import { createClient } from "@supabase/supabase-js";
import { Stage, Subject } from "../data/curriculum";

// Security and Obfuscation configurations
const SECURITY_SALT = "SudanEdu2026PlatformObfuscationKey";

/**
 * Obfuscation helper using custom key XORing to prevent plain-text discovery
 */
export function obfuscateString(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const saltCode = SECURITY_SALT.charCodeAt(i % SECURITY_SALT.length);
    const obfuscated = charCode ^ saltCode;
    result += obfuscated.toString(16).padStart(2, "0");
  }
  return result;
}

/**
 * Deobfuscation helper using custom key XORing
 */
export function deobfuscateString(hex: string): string {
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const part = parseInt(hex.substring(i, i + 2), 16);
    const saltCode = SECURITY_SALT.charCodeAt((i / 2) % SECURITY_SALT.length);
    result += String.fromCharCode(part ^ saltCode);
  }
  return result;
}

/**
 * Pure TypeScript implementation of the standard SHA-256 algorithm.
 * Guarantees cryptographic one-way hashing across all browsers and frames.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const result = [];
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let i, j;
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isPrime = function(n: number) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let n = 2; primeCounter < 64; n++) {
    if (isPrime(n)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(n, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(n, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  const strBytes = [];
  for (i = 0; i < ascii.length; i++) {
    strBytes.push(ascii.charCodeAt(i) & 0xff);
  }
  strBytes.push(0x80);

  while (strBytes.length % 64 !== 56) {
    strBytes.push(0);
  }

  for (i = 0; i < strBytes.length; i += 4) {
    words.push((strBytes[i] << 24) | (strBytes[i+1] << 16) | (strBytes[i+2] << 8) | strBytes[i+3]);
  }

  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength | 0);

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const w2 = w[i - 2];
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t2 = (s0 + maj) | 0;

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const t1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;

      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
      hash.length = 8;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 0xff;
      result.push((b < 16 ? "0" : "") + b.toString(16));
    }
  }
  return result.join("");
}

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

/**
 * Dynamically resolves the full URL of the backend API based on static/vercel hosting or configured backend setting.
 */
export function getApiUrl(path: string): string {
  const localBackend = localStorage.getItem("sudan_backend_url") || "";
  if (localBackend) {
    const base = localBackend.endsWith("/") ? localBackend.slice(0, -1) : localBackend;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }
  return path;
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
  try {
    const response = await fetch("/api/auth/admin-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const resData = await response.json();
      return !!resData.success;
    }
  } catch (err) {
    console.error("Error during Supabase admin authentication check via backend:", err);
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
        let id = row.id || "";

        if (!stageId || !gradeId || !id) return;

        // If the subject ID was saved with a composite unique prefix "stageId_gradeId_",
        // we strip it to restore the clean local subject ID (e.g., "math")
        const prefix = `${stageId}_${gradeId}_`;
        if (id.startsWith(prefix)) {
          id = id.substring(prefix.length);
        }

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
            id: `${stage.id}_${grade.id}_${subj.id}`, // Guaranteed unique composite ID
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

    // Hash the password with SHA-256 before inserting to database for optimal security and privacy
    const hashedPassword = password ? sha256(password) : "";
    const userDataToInsert = {
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword, 
      password_hash: hashedPassword, 
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
      .select("id, username, email, provider, user_role, grade_id, grade_name, specialties, contact_method, status, is_approved_teacher, created_at");

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("duplicate key") || insertError.message?.toLowerCase().includes("already exists") || insertError.message?.toLowerCase().includes("unique constraint")) {
        return { success: false, error: "⚠️ البريد الإلكتروني الذي أدخلته مسجل بالفعل في النظام! يرجى استخدام بريد إلكتروني آخر للتسجيل، أو الانتقال لعلامة تبويب (تسجيل الدخول) إذا كنت تملك هذا الحساب." };
      }
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
 * Logs in a user by checking the database 'users' table securely.
 */
export async function loginUser(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success) {
        return {
          success: true,
          user: resData.user
        };
      } else {
        return {
          success: false,
          error: resData.error || "فشل تسجيل الدخول."
        };
      }
    }
    return {
      success: false,
      error: `حدث خطأ أثناء الاتصال بالخادم: ${response.statusText}`
    };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetches all registered users from the database 'users' table for Admin use, without returning sensitive password columns.
 */
export async function fetchAllRegisteredUsers(): Promise<AppUser[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("users")
      .select("id, username, email, provider, user_role, grade_id, grade_name, specialties, contact_method, status, is_approved_teacher, created_at")
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
        .select("id, username, email, provider, user_role, grade_id, grade_name, specialties, contact_method, status, is_approved_teacher, created_at")
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
      const hashed = sha256(updatedData.password);
      updateObj.password = hashed;
      updateObj.password_hash = hashed;
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
      .select("id, username, email, provider, user_role, grade_id, grade_name, specialties, contact_method, status, is_approved_teacher, created_at")
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

  // Guard against guest accounts and non-numeric strings if DB has integer keys
  if (!userId || String(userId).startsWith("guest_") || isNaN(Number(userId))) {
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