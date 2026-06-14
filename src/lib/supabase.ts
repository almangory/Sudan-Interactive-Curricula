import { createClient } from "@supabase/supabase-js";
import { Stage, Subject } from "../data/curriculum";

// Helper keys for local retention of user configurations
const STORAGE_KEYS = {
  URL: "sudan_supabase_url",
  ANON_KEY: "sudan_supabase_anon_key",
};

/**
 * Dynamically gets the active Supabase configurations from localstorage or environment variables.
 */
export function getSupabaseConfig() {
  const localUrl = localStorage.getItem(STORAGE_KEYS.URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY);

  // Fallbacks to environment variables if available
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || "") as string;
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "") as string;

  return {
    url: localUrl || envUrl || "",
    anonKey: localKey || envKey || "",
    isConfigured: !!(localUrl || envUrl) && !!(localKey || envKey),
    source: (localUrl && localKey) ? "localStorage" : (envUrl && envKey) ? "env" : "none",
  };
}

/**
 * Saves user credentials to localStorage dynamically.
 */
export function saveSupabaseConfig(url: string, anonKey: string) {
  if (!url || !anonKey) {
    localStorage.removeItem(STORAGE_KEYS.URL);
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
  } else {
    localStorage.setItem(STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
  }
}

/**
 * Initializes and returns a Supabase helper instance, or null if unconfigured/invalid.
 */
export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  
  // Basic validation to avoid createClient throwing on poorly formatted URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.warn("Invalid Supabase URL schema encountered:", url);
    return null;
  }

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false, // Purely for stateless data updates
      }
    });
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

/**
 * Validates the project credentials structure and returns a client if valid, otherwise returns error.
 */
export function testSupabaseConnection(url: string, anonKey: string): { success: boolean; error?: string; client?: any } {
  const cleanUrl = (url || "").trim();
  const cleanKey = (anonKey || "").trim();

  if (!cleanUrl) {
    return { success: false, error: "رابط مشروع Supabase مطلوب ولا يمكن تركه فارغاً سيدي." };
  }
  if (!cleanKey) {
    return { success: false, error: "مفتاح Anon Key الخاص بمشروعك مطلوب ومهم للاتصالات سحابياً." };
  }
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return { success: false, error: "يجب أن يبدأ رابط مشروع سوبابيس بـ http:// أو https:// بشكل كامل وصحيح." };
  }

  try {
    const client = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
      }
    });
    return { success: true, client };
  } catch (err: any) {
    return { success: false, error: `فشل إنشاء اتصال سوبابيس: ${err.message || err}` };
  }
}

/**
 * Verifies admin credentials in the Supabase 'admin_users' table.
 * Falls back to offline confirmation if the table doesn't exist or client is unconfigured.
 */
export async function verifyAdminInSupabase(username: string, password: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log("Supabase client not configured. Verification falling back to default credential.");
    return false;
  }

  try {
    const cleanUser = username.trim().toLowerCase();
    
    // We try to look up where username is equal, or email is equal (if they use email as standard identifier)
    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .or(`username.eq.${cleanUser},email.eq.${cleanUser}`)
      .limit(1);

    if (error) {
      console.warn("Database check error on admin_users table:", error);
      return false;
    }

    if (data && data.length > 0) {
      const adminEntry = data[0];
      // Compare password. Checking plain-text standard column first
      if (adminEntry.password === password) {
        return true;
      }
    }
  } catch (err) {
    console.error("Error during Supabase admin authentication check:", err);
  }
  return false;
}

/**
 * Fetches curriculum stages from the configured Supabase connection (curricula_links table).
 */
export async function fetchCurriculumFromSupabase(): Promise<Stage[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Try to fetch from curricula_links
    const { data: listData, error: listError } = await client
      .from("curricula_links")
      .select("*");

    if (!listError && listData && listData.length > 0) {
      // Check if they stored the old single-row configuration as a JSON fallback
      const singleRow = listData.find(row => row.id === "curriculum" && (row.stages || row.config));
      if (singleRow) {
        return (singleRow.stages || singleRow.config) as Stage[];
      }

      // Reconstruct stages hierarchy from individual rows
      const { stagesData } = await import("../data/curriculum");
      let currentStages = JSON.parse(JSON.stringify(stagesData)) as Stage[];

      listData.forEach(row => {
        const stageId = row.stage_id || row.stage || "";
        const gradeId = row.grade_id || row.grade || "";
        const id = row.id || row.subject_id || "";

        if (!stageId || !gradeId || !id) return;

        // Try to find stage
        let stage = currentStages.find(s => s.id === stageId);
        if (!stage) {
          stage = {
            id: stageId,
            name: row.stage_name || stageId,
            description: row.stage_description || "",
            colorTheme: row.stage_theme || "from-blue-600 to-indigo-700",
            icon: row.stage_icon || "BookOpen",
            grades: []
          };
          currentStages.push(stage);
        }

        // Try to find grade
        let grade = stage.grades.find(g => g.id === gradeId);
        if (!grade) {
          grade = {
            id: gradeId,
            name: row.grade_name || gradeId,
            subjects: []
          };
          stage.grades.push(grade);
        }

        // Try to find subject
        let subj = grade.subjects.find(s => s.id === id);
        const mappedSubj: Subject = {
          id: id,
          name: row.name || row.subject_name || row.title || "مادة دراسية",
          iconName: row.icon_name || row.icon || "BookOpen",
          colorClass: row.color_class || row.color || "bg-blue-105 text-blue-900 border-blue-200",
          interactiveUrl: row.interactive_url || "",
          interactiveLabel: row.interactive_label || "الموقع التفاعلي",
          curriculumSummary: row.curriculum_summary || row.summary || "",
          pdfUrl: row.pdf_url || row.book_url || undefined,
          memoPdfUrl: row.memo_pdf_url || row.memo_url || undefined,
          videoUrl: row.video_url || undefined
        };

        if (subj) {
          Object.assign(subj, mappedSubj);
        } else {
          grade.subjects.push(mappedSubj);
        }
      });

      return currentStages;
    }

    // 2. Fallback to old curriculum_config JSON table if curricula_links didn't respond or is empty
    const { data: fallbackData, error: fallbackError } = await client
      .from("curriculum_config")
      .select("stages")
      .eq("id", "curriculum")
      .single();

    if (!fallbackError && fallbackData?.stages) {
      return fallbackData.stages as Stage[];
    }
  } catch (err) {
    console.error("Error drawing data from Supabase:", err);
  }
  return null;
}

/**
 * Upserts custom curriculum stages to Supabase. Supports both structured rows and single row JSON structures.
 */
export async function saveCurriculumToSupabase(stages: Stage[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Flatten nested Stage structure into sequential database rows for structured row-by-row saving
    const flatRows: any[] = [];
    stages.forEach(stage => {
      stage.grades.forEach(grade => {
        grade.subjects.forEach(subj => {
          flatRows.push({
            id: subj.id,
            stage_id: stage.id,
            stage_name: stage.name,
            stage_description: stage.description,
            stage_theme: stage.colorTheme,
            stage_icon: stage.icon,
            grade_id: grade.id,
            grade_name: grade.name,
            name: subj.name,
            icon_name: subj.iconName,
            color_class: subj.colorClass,
            interactive_url: subj.interactiveUrl || "",
            interactive_label: subj.interactiveLabel || "الموقع التفاعلي",
            curriculum_summary: subj.curriculumSummary || "",
            pdf_url: subj.pdfUrl || "",
            memo_pdf_url: subj.memoPdfUrl || "",
            video_url: subj.videoUrl || "",
            updated_at: new Date().toISOString()
          });
        });
      });
    });

    // Attempt 1: Try structured row-by-row insert into curricula_links
    try {
      const { error: insertErr } = await client
        .from("curricula_links")
        .upsert(flatRows);

      if (!insertErr) {
        return true;
      }
      console.warn("Attempt to save row-by-row to curricula_links yielded error, trying fallback:", insertErr);
    } catch (e) {
      console.warn("Row-by-row insert failed, trying JSON fallback:", e);
    }

    // Attempt 2: Try single-row JSON configuration approach directly on curricula_links
    try {
      const { error: jsonErr } = await client
        .from("curricula_links")
        .upsert({
          id: "curriculum",
          stages: stages,
          updated_at: new Date().toISOString()
        });

      if (!jsonErr) return true;
    } catch (e) {}

    // Attempt 3: Try legacy curriculum_config table fallback
    const { error: fallbackErr } = await client
      .from("curriculum_config")
      .upsert({
        id: "curriculum",
        stages: stages,
        updated_at: new Date().toISOString()
      });

    if (fallbackErr) {
      throw fallbackErr;
    }
    return true;
  } catch (err) {
    console.error("Error writing data to Supabase:", err);
    throw err;
  }
}
