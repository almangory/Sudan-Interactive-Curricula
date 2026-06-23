import { createClient } from "@supabase/supabase-js";
import { Stage, Subject } from "../data/curriculum";

// Helper keys for local retention of user configurations
const STORAGE_KEYS = {
  URL: "sudan_supabase_url",
  ANON_KEY: "sudan_supabase_anon_key",
};

/**
 * Dynamically gets the active Supabase configurations from localstorage or environment variables.
 * Prioritizes production environment variables (like those in Vercel) over local storage so the live app remains stable.
 */
export function getSupabaseConfig() {
  // التعديل الهندسي النظيف: الاعتماد الكامل والمباشر على مسميات بيئة Vite المستقرة
  const envUrl = (((import.meta as any).env?.VITE_SUPABASE_URL || "") as string).trim();
  const envKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "") as string).trim();

  const localUrl = (localStorage.getItem(STORAGE_KEYS.URL) || "").trim();
  const localKey = (localStorage.getItem(STORAGE_KEYS.ANON_KEY) || "").trim();

  // قيم افتراضية آمنة ومحدثة بناءً على طلب المستخدم
  const fallbackUrl = "https://ecgqrdkiybhhncdrtlea.supabase.co";
  const fallbackKey = "sb_publishable_BrL53NclB-jnltLj2Hcv5w_ovYsdzF9";

  const activeUrl = envUrl || localUrl || fallbackUrl;
  const activeKey = envKey || localKey || fallbackKey;

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured: !!activeUrl && !!activeKey,
    source: (envUrl && envKey) ? "env" : (localUrl && localKey) ? "localStorage" : "defaults",
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

// Cache-holding singleton variables for Supabase client
let cachedClient: any = null;
let cachedActiveUrl = "";
let cachedActiveKey = "";

/**
 * Initializes and returns a Supabase helper instance, or null if unconfigured/invalid.
 */
export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    cachedClient = null;
    cachedActiveUrl = "";
    cachedActiveKey = "";
    return null;
  }
  
  // Basic validation to avoid createClient throwing on poorly formatted URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.warn("Invalid Supabase URL schema encountered:", url);
    return null;
  }

  // If a client already exists for this exact url/key configuration, return it
  if (cachedClient && cachedActiveUrl === url && cachedActiveKey === anonKey) {
    return cachedClient;
  }

  try {
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: true, // Allow session persistence for user registration & login sessions
      }
    });
    cachedClient = client;
    cachedActiveUrl = url;
    cachedActiveKey = anonKey;
    return client;
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
      const singleRow = listData.find(row => row.id === "curriculum" && (row.stages || row.config));
      if (singleRow) {
        return (singleRow.stages || singleRow.config) as Stage[];
      }

      // Reconstruct stages hierarchy from individual rows
      const { stagesData } = await import("../data/curriculum");
      let currentStages = JSON.parse(JSON.stringify(stagesData)) as Stage[];

      // Clear all default subjects first to ensure only stored/approved subjects remain.
      // This makes sure deletion dynamically reflects in real-time.
      currentStages.forEach(stg => {
        stg.grades.forEach(grd => {
          grd.subjects = [];
        });
      });

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
  } catch (err) {
    console.error("Error drawing data from Supabase:", err);
  }
  return null;
}

export interface SyncResult {
  success: boolean;
  savedTable: "curricula_links" | "none";
  method: "row_by_row" | "none";
  rowCount: number;
  errors: string[];
}

/**
 * Upserts custom curriculum stages to Supabase. Supports structured rows mapping onto clean relational fields.
 */
export async function saveCurriculumToSupabase(stages: Stage[]): Promise<SyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      savedTable: "none",
      method: "none",
      rowCount: 0,
      errors: ["عميل Supabase غير متاح أو غير مهيأ بالكامل لاستقبال البيانات."]
    };
  }

  const errors: string[] = [];

  try {
    // Flatten nested Stage structure into sequential database rows for structured row-by-row saving
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

    // Attempt direct relational insertion with a self-healing retry mechanism for missing columns
    let attempts = 0;
    let success = false;
    let lastError: any = null;
    let currentFlatRows = [...flatRows];

    while (attempts < 5 && !success) {
      const { error } = await client
        .from("curricula_links")
        .upsert(currentFlatRows);

      if (!error) {
        success = true;
        break;
      }

      lastError = error;
      const errMsg = error.message || "";
      console.warn(`Upsert attempt ${attempts + 1} failed: ${errMsg}`);

      // Locate column name in errors like "Could not find the '...' column of 'curricula_links'" or "column '...' does not exist"
      let missingColumn: string | null = null;
      const match1 = errMsg.match(/Could not find the '([^']+)' column/i);
      const match2 = errMsg.match(/column "([^"]+)" of relation .*(?:does not exist|not found)/i);
      const match3 = errMsg.match(/column ([a-zA-Z0-9_]+) of relation .*(?:does not exist|not found)/i);

      if (match1) missingColumn = match1[1];
      else if (match2) missingColumn = match2[1];
      else if (match3) missingColumn = match3[1];

      if (missingColumn) {
        console.log(`Self-healing active: Removing unsupported column '${missingColumn}' and retrying...`);
        currentFlatRows = currentFlatRows.map(row => {
          const newRow = { ...row };
          delete newRow[missingColumn!];
          return newRow;
        });
        attempts++;
      } else {
        // Not a column missing error, break immediately (e.g., RLS, database offline, validation rules)
        break;
      }
    }

    if (success) {
      console.log("Successfully saved row-by-row into curricula_links!");

      // Clean up deleted subjects that are no longer in our curriculum tree safely via diffing
      const currentIds = flatRows.map(row => row.id);
      try {
        const { data: dbRows, error: fetchErr } = await client
          .from("curricula_links")
          .select("id");

        if (!fetchErr && dbRows) {
          const dbIds = dbRows.map((r: any) => r.id);
          const idsToDelete = dbIds.filter((id: string) => id !== "curriculum" && !currentIds.includes(id));
          
          if (idsToDelete.length > 0) {
            console.log("Safely deleting obsolete subject IDs from Supabase:", idsToDelete);
            const { error: deleteErr } = await client
              .from("curricula_links")
              .delete()
              .in("id", idsToDelete);

            if (deleteErr) {
              console.warn("Could not delete removed subject rows from Supabase during sync:", deleteErr);
            } else {
              console.log(`Successfully deleted ${idsToDelete.length} obsolete subjects from database.`);
            }
          }
        }
      } catch (e) {
        console.warn("Exception during safe database cleanup in sync:", e);
      }

      return {
        success: true,
        savedTable: "curricula_links",
        method: "row_by_row",
        rowCount: flatRows.length,
        errors
      };
    }
    
    errors.push(`[خطأ بـ curricula_links] ${lastError?.message || "خطأ غير معروف"}`);
    return {
      success: false,
      savedTable: "none",
      method: "none",
      rowCount: 0,
      errors
    };
  } catch (err: any) {
    console.error("Error writing data to Supabase:", err);
    return {
      success: false,
      savedTable: "none",
      method: "none",
      rowCount: 0,
      errors: [err.message || String(err)]
    };
  }
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  provider: string;
  user_role?: string;       // 'student' | 'teacher' | 'admin'
  grade_id?: string;
  grade_name?: string;
  specialties?: string;     // Specialized subjects e.g. "الكيمياء, الرياضيات"
  contact_method?: string;  // Phone number or email
  status?: string;          // 'pending' or 'active'
  is_approved_teacher?: boolean;
  created_at?: string;
}

/**
 * Registers a new user directly in the database 'users' table.
 */
export async function registerUser(
  username: string, 
  email: string, 
  password?: string, 
  provider = "email",
  userRole = "student",
  gradeId?: string,
  gradeName?: string,
  specialties?: string,
  contactMethod?: string
): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "قاعدة بيانات سوبابيس (Supabase) غير مهيأة بعد." };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const userDataToInsert = {
      username: cleanUsername,
      email: cleanEmail,
      password: password || "", 
      password_hash: password || "", 
      provider: provider,
      user_role: userRole,
      grade_id: gradeId || null,
      grade_name: gradeName || null,
      specialties: specialties || null,
      contact_method: contactMethod || null,
      status: userRole === "teacher" ? "pending" : "active",
      is_approved_teacher: false,
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await client
      .from("users")
      .insert([userDataToInsert])
      .select();

    if (insertError) {
      return { success: false, error: `فشل الحفظ بجدول 'users': ${insertError.message}` };
    }

    const returnedUser = insertData?.[0];
    return {
      success: true,
      user: {
        id: returnedUser?.id || String(Date.now()),
        username: returnedUser?.username || cleanUsername,
        email: returnedUser?.email || cleanEmail,
        provider: returnedUser?.provider || provider,
        user_role: returnedUser?.user_role || userRole,
        grade_id: returnedUser?.grade_id,
        grade_name: returnedUser?.grade_name,
        specialties: returnedUser?.specialties,
        contact_method: returnedUser?.contact_method,
        status: returnedUser?.status,
        is_approved_teacher: returnedUser?.is_approved_teacher
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Logs in a user by checking the database 'users' table.
 */
export async function loginUser(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "قاعدة بيانات سوبابيس (Supabase) غير مهيأة بعد." };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .limit(1);

    if (error) {
      return { success: false, error: `فشل البحث في جدول المستخدمين: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "هذا البريد الإلكتروني غير مسجل لدينا سيدي. يرجى إنشاء حساب أولاً." };
    }

    const userEntry = data[0];
    const storedPass = userEntry.password || userEntry.password_hash || "";
    if (password && storedPass !== password) {
      return { success: false, error: "كلمة المرور المدخلة غير صحيحة! يرجى إعادة المحاولة." };
    }

    return {
      success: true,
      user: {
        id: userEntry.id || String(Date.now()),
        username: userEntry.username || userEntry.name || "مستخدم جديد",
        email: userEntry.email,
        provider: userEntry.provider || "email",
        user_role: userEntry.user_role || "student",
        grade_id: userEntry.grade_id,
        grade_name: userEntry.grade_name,
        specialties: userEntry.specialties,
        contact_method: userEntry.contact_method,
        status: userEntry.status || "active",
        is_approved_teacher: !!userEntry.is_approved_teacher
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetches all registered users from the database 'users' table for Admin use.
 */
export async function fetchAllRegisteredUsers(): Promise<AppUser[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users list:", error);
      return [];
    }

    return (data || []).map((x: any) => ({
      id: x.id,
      username: x.username,
      email: x.email,
      provider: x.provider || "email",
      user_role: x.user_role || "student",
      grade_id: x.grade_id,
      grade_name: x.grade_name,
      specialties: x.specialties,
      contact_method: x.contact_method,
      status: x.status || "active",
      is_approved_teacher: !!x.is_approved_teacher,
      created_at: x.created_at
    }));
  } catch (e) {
    console.warn("Failed retrieving users from database:", e);
    return [];
  }
}

/**
 * Updates a user's type, approval level and status.
 */
export async function updateUserRoleAndPermissions(
  userId: string, 
  userRole: string,
  isApproved: boolean,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "قاعدة بيانات سوبابيس (Supabase) غير مهيأة بعد." };
  }

  try {
    const { error } = await client
      .from("users")
      .update({
        user_role: userRole,
        is_approved_teacher: isApproved,
        status: status
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Handles initiating Sign In with Google via Supabase OAuth.
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "قاعدة بيانات سوبابيس (Supabase) غير مهيأة بعد." };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Checks if there is a logged in session (e.g. after Google Sign-In redirect)
 */
export async function checkAndSyncGoogleSession(): Promise<AppUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      const gUser = session.user;
      const email = gUser.email || "";
      const metadata = gUser.user_metadata || {};
      const username = metadata.full_name || metadata.name || email.split("@")[0] || "مستخدم قوقل";

      if (!email) return null;

      const { data, error } = await client
        .from("users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .limit(1);

      if (!error && data && data.length > 0) {
        const usr = data[0];
        return {
          id: usr.id || gUser.id,
          username: usr.username || username,
          email: usr.email || email,
          provider: usr.provider || "google"
        };
      }

      const reg = await registerUser(username, email, "oauth_google_verified", "google");
      if (reg.success && reg.user) {
        return reg.user;
      }

      return {
        id: gUser.id,
        username,
        email,
        provider: "google"
      };
    }
  } catch (e) {
    console.warn("Failed checking/syncing user session:", e);
  }
  return null;
}

/**
 * Updates the profile of the current user in both Supabase table 'users'.
 */
export async function updateCurrentUserProfile(
  userId: string,
  updatedData: {
    username?: string;
    password?: string;
    grade_id?: string;
    grade_name?: string;
    specialties?: string;
    contact_method?: string;
  }
): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "قاعدة بيانات سوبابيس غير مهيأة بعد." };
  }

  try {
    const updateObj: any = {};
    if (updatedData.username) updateObj.username = updatedData.username;
    if (updatedData.password) {
      updateObj.password = updatedData.password;
      updateObj.password_hash = updatedData.password;
    }
    if (updatedData.grade_id !== undefined) {
      updateObj.grade_id = updatedData.grade_id;
      updateObj.grade_name = updatedData.grade_name || "";
    }
    if (updatedData.specialties !== undefined) updateObj.specialties = updatedData.specialties;
    if (updatedData.contact_method !== undefined) updateObj.contact_method = updatedData.contact_method;

    const { error } = await client
      .from("users")
      .update(updateObj)
      .eq("id", userId);

    if (error) {
      return { success: false, error: `فشل تعديل البيانات في جدول المستخدمين: ${error.message}` };
    }

    const { data: updatedEntry, error: fetchError } = await client
      .from("users")
      .select("*")
      .eq("id", userId)
      .limit(1);

    if (fetchError || !updatedEntry || updatedEntry.length === 0) {
      return {
        success: true,
        error: "تم تعديل البيانات بنجاح، لكن تعذر قراءة النسخة السحابية المحدثة فورياً. يرجى إعادة تحديث الصفحة لتحديث العرض."
      };
    }

    const userEntry = updatedEntry[0];
    return {
      success: true,
      user: {
        id: userEntry.id,
        username: userEntry.username || userEntry.name || "مستخدم جديد",
        email: userEntry.email,
        provider: userEntry.provider || "email",
        user_role: userEntry.user_role || "student",
        grade_id: userEntry.grade_id,
        grade_name: userEntry.grade_name,
        specialties: userEntry.specialties,
        contact_method: userEntry.contact_method,
        status: userEntry.status || "active",
        is_approved_teacher: !!userEntry.is_approved_teacher
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export interface LiveLesson {
  id: string;
  title: string;
  stageId: string;
  gradeId: string;
  subjectId?: string;
  subjectName?: string;
  teacherName: string;
  meetingPlatform: "zoom" | "google_meet" | "other";
  meetingUrl: string;
  scheduledTime: string; // ISO datetime
  duration: number; // in minutes
  notes?: string;
  createdAt?: string;
}

/**
 * Fetches scheduled live lessons. Merges or falls back to local storage if needed.
 */
export async function fetchLiveLessonsFromSupabase(): Promise<LiveLesson[]> {
  const localLessonsStr = localStorage.getItem("sudan_live_lessons_v1");
  const localLessons: LiveLesson[] = localLessonsStr ? JSON.parse(localLessonsStr) : [];

  const client = getSupabaseClient();
  if (!client) {
    return localLessons;
  }

  try {
    const { data, error } = await client
      .from("live_lessons")
      .select("*")
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.warn("Could not load live lessons from Supabase (using local fallback):", error.message);
      return localLessons;
    }

    if (data) {
      const mappedLessons: LiveLesson[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        stageId: row.stage_id,
        gradeId: row.grade_id,
        subjectId: row.subject_id || undefined,
        teacherName: row.teacher_name,
        meetingPlatform: row.meeting_platform || "other",
        meetingUrl: row.meeting_url,
        scheduledTime: row.scheduled_time,
        duration: row.duration || 45,
        notes: row.notes || "",
        createdAt: row.created_at
      }));

      // Update local storage cache
      localStorage.setItem("sudan_live_lessons_v1", JSON.stringify(mappedLessons));
      return mappedLessons;
    }
  } catch (err: any) {
    console.error("Exception loading live lessons from Supabase:", err);
  }

  return localLessons;
}

/**
 * Saves (inserts/updates) a live lesson to Supabase and updates local cache.
 */
export async function saveLiveLessonToSupabase(lesson: LiveLesson): Promise<{ success: boolean; error?: string }> {
  // Update local storage first
  const localLessonsStr = localStorage.getItem("sudan_live_lessons_v1");
  let localLessons: LiveLesson[] = localLessonsStr ? JSON.parse(localLessonsStr) : [];
  
  const existingIdx = localLessons.findIndex(l => l.id === lesson.id);
  if (existingIdx > -1) {
    localLessons[existingIdx] = lesson;
  } else {
    localLessons.push(lesson);
  }
  localStorage.setItem("sudan_live_lessons_v1", JSON.stringify(localLessons));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true }; // locally successful
  }

  try {
    const dbRow = {
      id: lesson.id,
      title: lesson.title,
      stage_id: lesson.stageId,
      grade_id: lesson.gradeId,
      subject_id: lesson.subjectId || null,
      teacher_name: lesson.teacherName,
      meeting_platform: lesson.meetingPlatform,
      meeting_url: lesson.meetingUrl,
      scheduled_time: lesson.scheduledTime,
      duration: lesson.duration,
      notes: lesson.notes || null,
      created_at: lesson.createdAt || new Date().toISOString()
    };

    const { error } = await client
      .from("live_lessons")
      .upsert(dbRow);

    if (error) {
      console.warn("Could not upsert live lesson to Supabase:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Exception saving live lesson:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Deletes a live lesson from Supabase and updates local cache.
 */
export async function deleteLiveLessonFromSupabase(lessonId: string): Promise<{ success: boolean; error?: string }> {
  // Update local storage first
  const localLessonsStr = localStorage.getItem("sudan_live_lessons_v1");
  let localLessons: LiveLesson[] = localLessonsStr ? JSON.parse(localLessonsStr) : [];
  localLessons = localLessons.filter(l => l.id !== lessonId);
  localStorage.setItem("sudan_live_lessons_v1", JSON.stringify(localLessons));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true };
  }

  try {
    const { error } = await client
      .from("live_lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      console.warn("Could not delete live lesson from Supabase:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Exception deleting live lesson:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Checks if a user exists in the database and is active.
 */
export async function checkUserExistsAndActive(userId: string): Promise<{ exists: boolean; active: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    // If Supabase is not connected or initialized, assume local status is correct
    return { exists: true, active: true };
  }

  try {
    const { data, error } = await client
      .from("users")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Error checking user in database:", error.message);
      return { exists: true, active: true }; // Fallback to avoid false lockouts on temporary DB hiccups
    }

    if (!data) {
      return { exists: false, active: false };
    }

    return { exists: true, active: data.status !== "deleted" && data.status !== "inactive" };
  } catch (err: any) {
    console.error("Exception in checkUserExistsAndActive:", err);
    return { exists: true, active: true };
  }
}