import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, Award, Compass, BookOpen, Clock, Heart, 
  Map, Sparkles, Star, ChevronLeft, ChevronDown, CheckCircle, 
  Search, ShieldAlert, History, Globe, Plus, FileText, Video, Filter,
  Lock, X
} from "lucide-react";
import { stagesData, Stage, Grade, Subject } from "./data/curriculum";
import SubjectModal from "./components/SubjectModal";
import AddSubjectModal from "./components/AddSubjectModal";
import DynamicIcon from "./components/DynamicIcon";
import StudyCamp from "./components/StudyCamp";
import AdminDashboard from "./components/AdminDashboard";
import { fetchCurriculumFromSupabase, verifyAdminInSupabase, saveCurriculumToSupabase, getSupabaseConfig, saveSupabaseConfig, AppUser, registerUser, loginUser, signInWithGoogle, checkAndSyncGoogleSession, getSupabaseClient, updateCurrentUserProfile } from "./lib/supabase";

export default function App() {
  // Curriculum data is retrieved directly from the server-side compiled curriculum.ts (stagesData)
  // We use local storage fallback for cross-environment consistency (e.g. on Vercel)
  const [curriculumData, setCurriculumData] = useState<Stage[]>(() => {
    const cached = localStorage.getItem("sudan_custom_curriculum_v3");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached curriculum", e);
      }
    }
    return stagesData;
  });

  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [addSubjectState, setAddSubjectState] = useState<{
    stageId: string;
    gradeId: string;
    gradeName: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showStudyCamp, setShowStudyCamp] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "books" | "videos" | "interactive">("all");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Load from Supabase on start if available and subscribe to Webhook SSE events
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        // 1. Try to fetch dynamic Supabase keys from the server first to bootstrap all client instances
        try {
          const configRes = await fetch("/api/config/supabase");
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.isConfigured && configData.url && configData.anonKey) {
              const currentCfg = getSupabaseConfig();
              // Only save if it's different to prevent redundant writes
              if (currentCfg.url !== configData.url || currentCfg.anonKey !== configData.anonKey) {
                console.log("Bootstrapping client Supabase connection parameters from production server environmental keys...");
                saveSupabaseConfig(configData.url, configData.anonKey);
              }
            }
          }
        } catch (configErr) {
          console.warn("Could not check backend Supabase config fallback, continuing client-side check.", configErr);
        }

        // 2. Fetch the actual content from Supabase
        const cloudData = await fetchCurriculumFromSupabase();
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          setCurriculumData(cloudData);
          console.log("Successfully loaded dynamic curriculum from Supabase database!");
        }
      } catch (err) {
        console.error("Failed to load dynamic curriculum from Supabase", err);
      }
    };
    loadSupabaseData();

    // Verify and synchronize active Google OAuth session
    const syncGoogleUserSession = async () => {
      try {
        const checkUser = await checkAndSyncGoogleSession();
        if (checkUser) {
          console.log("Synchronized and logged in Google active session:", checkUser);
          setCurrentUser(checkUser);
          localStorage.setItem("sudan_auth_user", JSON.stringify(checkUser));
          setSaveStatus(`👋 مرحبًا بك مجددًا يا ${checkUser.username}! تم تسجيل دخولك بنجاح بنظام سوبابيس.`);
          setTimeout(() => setSaveStatus(null), 5000);
        }
      } catch (e) {
        console.warn("Failed checking/syncing active Google session:", e);
      }
    };
    syncGoogleUserSession();

    // ⚡ Subscribe to server-sent events for instant Supabase Webhook notification updates
    const eventSource = new EventSource("/api/events");
    
    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "reload_curriculum") {
          console.log("Received instant sync webhook trigger from server:", data);
          setSaveStatus("⚡ تحديث تلقائي فوري: تم رصد تعديل في قاعدة البيانات سوبابيس، جاري مزامنة الموقع...");
          const freshData = await fetchCurriculumFromSupabase();
          if (freshData && Array.isArray(freshData) && freshData.length > 0) {
            setCurriculumData(freshData);
            localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(freshData));
            setSaveStatus("✅ تم مزامنة وتحديث بيانات المناهج فورياً دون الحاجة لتحديث الصفحة! ⚡");
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            setSaveStatus(null);
          }
        }
      } catch (err) {
        console.error("SSE parsing error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 🔐 Admin state variables & credentials management
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("sudan_edu_admin") === "true";
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [showHiddenAdminGate, setShowHiddenAdminGate] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.search.includes("admin") || window.location.search.includes("management") || localStorage.getItem("sudan_edu_admin") === "true";
    }
    return false;
  });
  const [trimClickCount, setTrimClickCount] = useState(0);

  const handleTrimClick = () => {
    const nextCount = trimClickCount + 1;
    setTrimClickCount(nextCount);
    if (nextCount >= 5) {
      setShowHiddenAdminGate(true);
      setShowAdminLogin(true);
      setAdminLoginError("");
      setAdminUsername("");
      setAdminPassword("");
      setSaveStatus("🔓 تم تنشيط وإظهار بوابة دخول الإدارة السرية ونموذج تسجيل الدخول بنجاح.");
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // 👤 Student & general user registration & login states (for standard 'users' table)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem("sudan_auth_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn("Could not load user session cached:", e);
      }
    }
    return null;
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalTab, setUserModalTab] = useState<"login" | "register" | "profile">("login");
  const [loginRole, setLoginRole] = useState<"student" | "admin">("student");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userAuthError, setUserAuthError] = useState("");
  const [userAuthSuccess, setUserAuthSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Filter stages based on logged-in student profile or admin view
  const displayedStages = React.useMemo(() => {
    if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
      const studentStage = curriculumData.find(stage => 
        stage.grades.some(g => g.id === currentUser.grade_id)
      );
      if (studentStage) {
        return [studentStage];
      }
    }
    return curriculumData;
  }, [curriculumData, currentUser]);

  const triggerEditProfile = () => {
    if (!currentUser) return;
    setUserEmail(currentUser.email);
    setUserUsername(currentUser.username);
    setUserPassword(""); // Keep password input blank unless they want to change it
    setRegUserRole(currentUser.user_role === "teacher" ? "teacher" : "student");
    setRegGradeId(currentUser.grade_id || "");
    setRegContactMethod(currentUser.contact_method || "");
    if (currentUser.specialties) {
      setSelectedSpecialties(currentUser.specialties.split(", ").map((x: string) => x.trim()));
    } else {
      setSelectedSpecialties([]);
    }
    setUserAuthError("");
    setUserAuthSuccess("");
    setUserModalTab("profile");
    setShowUserModal(true);
  };

  // Guard function: Don't allow opening materials/subjects if not logged in
  const handleOpenSubject = (subject: any) => {
    if (!currentUser && !isAdminLoggedIn) {
      setUserAuthError("⚠️ عذراً، يرجى تسجيل الدخول أو إنشاء حساب طالب/أستاذ أولاً لتتمكن من تصفح محتويات المواد والدرس التفاعلي!");
      setShowUserModal(true);
      setUserModalTab("login");
      return;
    }
    setActiveSubject(subject);
  };

  // 🎓 Student & Teacher Custom Fields
  const [regUserRole, setRegUserRole] = useState<"student" | "teacher">("student");
  const [regGradeId, setRegGradeId] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [regContactMethod, setRegContactMethod] = useState("");

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = adminUsername.trim();
    
    // 1. First try to authenticate against the Supabase DB
    let authenticated = false;
    try {
      authenticated = await verifyAdminInSupabase(cleanUser, adminPassword);
    } catch (err) {
      console.warn("DB authentication check yielded error:", err);
    }

    // 2. If DB validation succeeded, or fallback user matched standard offline password
    const isOfflineFallback = (cleanUser.toLowerCase() === "almangory" || cleanUser.toLowerCase() === "admin@sudan.edu") && adminPassword === "20302060";

    if (authenticated || isOfflineFallback) {
      setIsAdminLoggedIn(true);
      localStorage.setItem("sudan_edu_admin", "true");
      setShowAdminLogin(false);
      setShowAdminDashboard(true); // Automatically toggle on dynamic edit panel
      setAdminLoginError("");
      
      const welcomeMsg = authenticated 
        ? `مرحباً بك يا ${cleanUser}! تم التحقق من هويتك سحابياً عبر جدول admin_users بنجاح 🔑`
        : `مرحباً بك يا أستاذ عثمان المنقوري! تم تفعيل دخول الإدارة والمزامنة بالهوية الاحتياطية بنجاح 🔑`;
        
      setSaveStatus(welcomeMsg);
      setTimeout(() => setSaveStatus(null), 6000);
    } else {
      setAdminLoginError("اسم المستخدم أو كلمة المرور غير صحيحة! يرجى التحقق من جدول admin_users في سوبابيس أو استخدام كلمة المرور الاحتياطية.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminDashboard(false);
    setShowHiddenAdminGate(false);
    setTrimClickCount(0);
    localStorage.removeItem("sudan_edu_admin");
    setSaveStatus("تم تسجيل الخروج من لوحة الإدارة بنجاح.");
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    try {
      if (!userUsername.trim()) {
        setUserAuthError("⚠️ يرجى تزويد اسم مستخدم أو اسم ثلاثي صحيح.");
        setIsAuthLoading(false);
        return;
      }
      if (!userEmail.includes("@")) {
        setUserAuthError("⚠️ يرجى تزويد بريد إلكتروني صحيح لتسجيل الدخول.");
        setIsAuthLoading(false);
        return;
      }
      if (userPassword.length < 4) {
        setUserAuthError("⚠️ كلمة المرور يجب أن لا تقل عن ٤ خانات لتأمين حسابك.");
        setIsAuthLoading(false);
        return;
      }

      const checkConfig = getSupabaseConfig();
      if (!checkConfig.isConfigured) {
        setUserAuthError("⚠️ سوبابيس (Supabase) غير مهيأة بعد من قبل مسؤول النظام. يرجى تهيئتها أولاً.");
        setIsAuthLoading(false);
        return;
      }

      // Extract Student Grade Details
      let resolvedGradeId = undefined;
      let resolvedGradeName = undefined;
      if (regUserRole === "student") {
        const fallbackGradeId = regGradeId || curriculumData[0]?.grades[0]?.id || "";
        resolvedGradeId = fallbackGradeId;
        const matchedGrade = curriculumData.flatMap(stage => stage.grades).find(g => g.id === fallbackGradeId);
        resolvedGradeName = matchedGrade ? matchedGrade.name : "";
      }

      // Extract Teacher Specialties & Contact Methods
      let resolvedSpecialties = undefined;
      let resolvedContactMethod = undefined;
      if (regUserRole === "teacher") {
        if (selectedSpecialties.length === 0) {
          setUserAuthError("⚠️ يرجى تحديد مادة واحدة على الأقل لتخصصك الدراسي.");
          setIsAuthLoading(false);
          return;
        }
        if (!regContactMethod.trim()) {
          setUserAuthError("⚠️ يرجى تزويد رقم الهاتف أو وسيلة تواصل صحيحة لتلقي التراخيص.");
          setIsAuthLoading(false);
          return;
        }
        resolvedSpecialties = selectedSpecialties.join(", ");
        resolvedContactMethod = regContactMethod.trim();
      }

      const res = await registerUser(
        userUsername, 
        userEmail, 
        userPassword, 
        "email",
        regUserRole,
        resolvedGradeId,
        resolvedGradeName,
        resolvedSpecialties,
        resolvedContactMethod
      );

      if (res.success && res.user) {
        if (regUserRole === "teacher") {
          setUserAuthSuccess("🎉 تم تسجيل حسابك كمعلم بنجاح! يخضع حسابك المبرمج حالياً للمراجعة من قبل الإدارة وسنتواصل معك قريباً.");
        } else {
          setUserAuthSuccess("🎉 تم تسجيل حسابك والدخول كطالب بنجاح!");
        }
        setCurrentUser(res.user);
        localStorage.setItem("sudan_auth_user", JSON.stringify(res.user));
        
        setSaveStatus(`👋 مرحبًا بك يا ${res.user.username}! تم تسجيل حسابك وعملك كسوبابيس.`);
        setTimeout(() => setSaveStatus(null), 5000);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 3000);
      } else {
        setUserAuthError(res.error || "فشل التسجيل. يرجى مراجعة إعدادات قاعدة البيانات.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء عملية التسجيل: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    try {
      const cleanEmail = userEmail.trim().toLowerCase();
      
      // Admin Login Option inside Student/User modal
      if (cleanEmail === "admin@sudan.edu" && userPassword === "20302060") {
        setIsAdminLoggedIn(true);
        localStorage.setItem("sudan_edu_admin", "true");
        setShowHiddenAdminGate(true);
        setShowAdminDashboard(true);
        
        const adminUser: AppUser = {
          id: "admin-master-id-123",
          username: "عثمان المنقوري 👑",
          email: "admin@sudan.edu",
          provider: "database",
          user_role: "teacher",
          created_at: new Date().toISOString()
        };
        setCurrentUser(adminUser);
        localStorage.setItem("sudan_auth_user", JSON.stringify(adminUser));

        setUserAuthSuccess("🟢 تم تسجيل دخول المسؤول بنجاح! جاري تفعيل لوحة الإدارة...");
        setSaveStatus("مرحباً بك يا أستاذ عثمان المنقوري! تم تفعيل لوحة التحكم والمزامنة بالهوية الاحتياطية بنجاح 🔑");
        setTimeout(() => setSaveStatus(null), 6000);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
        return;
      }

      if (!userEmail.includes("@")) {
        setUserAuthError("⚠️ يرجى إدخال بريد إلكتروني صحيح.");
        setIsAuthLoading(false);
        return;
      }

      const checkConfig = getSupabaseConfig();
      if (!checkConfig.isConfigured) {
        setUserAuthError("⚠️ سوبابيس غير مهيأة بعد من قبل المسؤول.");
        setIsAuthLoading(false);
        return;
      }

      // Try table login
      const res = await loginUser(userEmail, userPassword);
      if (res.success && res.user) {
        setUserAuthSuccess("🟢 تم التحقق وتسجيل الدخول بنجاح!");
        setCurrentUser(res.user);
        localStorage.setItem("sudan_auth_user", JSON.stringify(res.user));
        
        setSaveStatus(`👋 مرحبًا بك مجددًا يا ${res.user.username}! تصفح ممتع للمناهج السودانية.`);
        setTimeout(() => setSaveStatus(null), 5050);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
      } else {
        setUserAuthError(res.error || "خطأ غير معروف في التحقق من الحساب.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء عملية الدخول: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUserProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    try {
      if (!userUsername.trim()) {
        setUserAuthError("⚠️ اسم المستخدم مطلوب.");
        setIsAuthLoading(false);
        return;
      }

      // Prepare updated details
      let resolvedGradeId = undefined;
      let resolvedGradeName = undefined;
      if (currentUser.user_role === "student") {
        resolvedGradeId = regGradeId;
        const matchedGrade = curriculumData.flatMap(stage => stage.grades).find(g => g.id === regGradeId);
        resolvedGradeName = matchedGrade ? matchedGrade.name : "";
      }

      let resolvedSpecialties = undefined;
      let resolvedContactMethod = undefined;
      if (currentUser.user_role === "teacher") {
        resolvedSpecialties = selectedSpecialties.join(", ");
        resolvedContactMethod = regContactMethod.trim();
      }

      const res = await updateCurrentUserProfile(currentUser.id, {
        username: userUsername,
        password: userPassword || undefined,
        grade_id: resolvedGradeId,
        grade_name: resolvedGradeName,
        specialties: resolvedSpecialties,
        contact_method: resolvedContactMethod
      });

      if (res.success) {
        let updatedUser = res.user;
        if (!updatedUser) {
          updatedUser = {
            ...currentUser,
            username: userUsername,
            grade_id: resolvedGradeId,
            grade_name: resolvedGradeName,
            specialties: resolvedSpecialties,
            contact_method: resolvedContactMethod
          };
        }
        setCurrentUser(updatedUser);
        localStorage.setItem("sudan_auth_user", JSON.stringify(updatedUser));
        
        setUserAuthSuccess("🎉 تم تحديث بياناتك الشخصية بنجاح سحابياً!");
        setSaveStatus(`✅ تم تحديث بيانات حسابك بنجاح يا ${userUsername}!`);
        setTimeout(() => setSaveStatus(null), 5000);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
      } else {
        setUserAuthError(res.error || "فشل تعديل البيانات.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء تعديل البيانات: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleOAuthLogin = async () => {
    setUserAuthError("");
    setUserAuthSuccess("");
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setUserAuthSuccess("جاري تحويلك إلى قوقل للمصادقة وتخزين البيانات...");
      } else {
        const errorMsg = res.error || "";
        if (errorMsg.includes("provider is not enabled") || errorMsg.includes("Unsupported provider")) {
          setUserAuthError(
            "⚠️ تسجيل الدخول الاجتماعي بـ (Google) غير مفعّل في لوحة تحكّم Supabase الخاصة بمشروعك بعد!\n\n" +
            "لتفعيله وحل هذا الخطأ بسهولة:\n" +
            "١. افتح لوحة تحكم Supabase Dashboard الخاصة بك.\n" +
            "٢. توجه إلى القائمة الجانبية: Authentication ➔ Providers.\n" +
            "٣. اضغط على Google وقم بتمكينه (Enable) مع إضافة الـ Client ID والـ Client Secret من حساب مطوري Google.\n\n" +
            "💡 نصيحة: يمكنك استخدام خيار 'إنشاء حساب جديد' بالبريد الإلكتروني وكلمة المرور بالأعلى مباشرة، فهو جاهز ومفعّل لحفظ بياناتك فورياً في جدول الـ users سحابياً دون أي إعداد إضافي!"
          );
        } else {
          setUserAuthError(`فشل بدء تسجيل الدخول بقوقل: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء تسجيل قوقل: ${err.message || err}`);
    }
  };

  const [copySuccess, setCopySuccess] = useState(false);

  const downloadCurriculumFile = () => {
    const fileContent = `export interface Subject {
  id: string;
  name: string;
  iconName: string; // Used to select Lucide icon dynamically
  colorClass: string; // Tailwind bg/text/border color classes
  interactiveUrl: string; // External interactive website url
  interactiveLabel: string; // Friendly label for the external link
  curriculumSummary: string; // Short summary of what is taught in Sudan
  pdfUrl?: string; // Optional download link for the E-Book
  memoPdfUrl?: string; // Optional link to a PDF memorandum
  videoUrl?: string; // Optional YouTube channel or lesson video link
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // Tailwind color theme for this stage
  icon: string; // Lucide icon
  grades: Grade[];
}

export const stagesData: Stage[] = ${JSON.stringify(curriculumData, null, 2)};
`;

    const blob = new Blob([fileContent], { type: "text/typescript;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "curriculum.ts");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCurriculumCode = () => {
    const fileContent = `export interface Subject {
  id: string;
  name: string;
  iconName: string; // Used to select Lucide icon dynamically
  colorClass: string; // Tailwind bg/text/border color classes
  interactiveUrl: string; // External interactive website url
  interactiveLabel: string; // Friendly label for the external link
  curriculumSummary: string; // Short summary of what is taught in Sudan
  pdfUrl?: string; // Optional download link for the E-Book
  memoPdfUrl?: string; // Optional link to a PDF memorandum
  videoUrl?: string; // Optional YouTube channel or lesson video link
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // Tailwind color theme for this stage
  icon: string; // Lucide icon
  grades: Grade[];
}

export const stagesData: Stage[] = ${JSON.stringify(curriculumData, null, 2)};
`;

    navigator.clipboard.writeText(fileContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    }).catch(err => {
      console.error("Could not copy curriculum code", err);
    });
  };

  const resetCurriculumToDefault = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في استعادة المنهج الدراسي الافتراضي الأصلي وحذف كل التعديلات المحلية الحالية؟")) {
      localStorage.removeItem("sudan_custom_curriculum_v3");
      setCurriculumData(stagesData);
      setSaveStatus("تمت استعادة المنهج الدراسي الافتراضي بنجاح! 🔄");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Clean up any stale client-side curriculum caches to ensure the app loads the fresh server compiled code
  useEffect(() => {
    localStorage.removeItem("sudan_custom_curriculum_v2");
    localStorage.removeItem("sudan_custom_curriculum"); // Purge very old version if any
  }, []);

  // 📱 Mobile and Browser Native Back Button Integration
  // Automatically pushes and pops from window.history stack when modals are shown / hidden
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When back is pressed, close any open modal
      if (activeSubject) {
        setActiveSubject(null);
      } else if (addSubjectState) {
        setAddSubjectState(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeSubject, addSubjectState]);

  useEffect(() => {
    // Check if any modal is active
    const modalActive = !!(activeSubject || addSubjectState);
    
    if (modalActive) {
      // If modal is active but history does not reflect it, push state
      if (!window.history.state || !window.history.state.modalOpen) {
        window.history.pushState({ modalOpen: true }, "");
      }
    } else {
      // If no modals are active but history still has modalOpen, pop back to sync states
      if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
      }
    }
  }, [activeSubject, addSubjectState]);

  // Set default stage from loaded curriculumData or enforce registered student stage
  useEffect(() => {
    if (currentUser && currentUser.user_role === "student" && currentUser.grade_id && curriculumData.length > 0) {
      let foundStage = null;
      let foundGrade = null;
      for (const stage of curriculumData) {
        const matched = stage.grades.find(g => g.id === currentUser.grade_id);
        if (matched) {
          foundStage = stage;
          foundGrade = matched;
          break;
        }
      }
      if (foundStage && foundGrade) {
        setSelectedStage(foundStage);
        setActiveGrade(foundGrade);
        setShowOnlyFavorites(false);
        setShowStudyCamp(false);
        setShowAdminDashboard(false);
      }
    } else if (curriculumData.length > 1 && !selectedStage) {
      setSelectedStage(curriculumData[1]); // Default to primary stage
    }
  }, [curriculumData, currentUser]);

  // Handle active stage changing when curriculumData is updated to keep selectedStage reference in sync
  useEffect(() => {
    if (selectedStage) {
      const refreshedStage = curriculumData.find(s => s.id === selectedStage.id);
      if (refreshedStage) {
        setSelectedStage(refreshedStage);
      }
    }
  }, [curriculumData]);

  // Deep-linking from URL query parameters on website load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subjectId");
    if (subjectId) {
      for (const stage of curriculumData) {
        for (const grade of stage.grades) {
          const subject = grade.subjects.find(sub => sub.id === subjectId);
          if (subject) {
            if (!currentUser && !isAdminLoggedIn) {
              setUserAuthError("⚠️ يرجى تسجيل الدخول أو إنشاء حساب طالب/أستاذ أولاً لتصفح هذا المنهج الدراسي بالكامل!");
              setShowUserModal(true);
              setUserModalTab("login");
              break;
            }
            setSelectedStage(stage);
            setActiveGrade(grade);
            setActiveSubject({
              ...subject,
              stageId: stage.id,
              stageName: stage.name,
              gradeId: grade.id,
              gradeName: grade.name
            } as any);
            // Clean url parameters slightly or keep them for bookmarking
            break;
          }
        }
      }
    }
  }, [curriculumData, currentUser, isAdminLoggedIn]);

  // Function to save curriculum data directly on the server filesystem
  const saveCurriculumToServer = async (newData: Stage[], isSilent = false) => {
    try {
      if (!isSilent) {
        setSaveStatus("جاري حفظ التعديلات على كود ملقم التعليم...");
      }
      
      const response = await fetch("/api/curriculum/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: "20302060",
          stages: newData
        })
      });

      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        throw new Error("استجابة الخادم ليست ملف JSON. يرجى العلم أن السيرفرات السحابية المؤقتة والمنصات غير المطورة بالكامل (مثل Vercel) لا تدعم ميزة الكتابة والتعديل المباشر لملفات الكود، ولكن تم حفظ تعديلاتك محلياً في المتصفح بنجاح! 💾");
      }

      if (response.ok && result.success) {
        if (!isSilent) {
          setSaveStatus("تم تحديث كود برنامج المنهج (curriculum.ts) على الخادم بنجاح! 🎉");
          setTimeout(() => setSaveStatus(null), 5000);
        } else {
          console.log("Curriculum successfully synced to server file system on startup.");
        }
      } else {
        throw new Error(result.error || "فشل غير معروف أثناء تحديث ملف الخادم.");
      }
    } catch (err: any) {
      console.error("Server save error:", err);
      if (!isSilent) {
        setSaveStatus(`تنبيه: تم الحفظ محلياً وفشل الحفظ على الملقم (${err.message})`);
        setTimeout(() => setSaveStatus(null), 6000);
      }
    }
  };

  const saveCurriculumToCloudAutomatically = async (newData: Stage[]) => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      console.log("Supabase not configured, skipping background cloud sync.");
      return;
    }

    try {
      setSaveStatus("☁️ جاري مزامنة وحفظ التعديلات تلقائياً في سوبابيس (Supabase)...");
      const result = await saveCurriculumToSupabase(newData);
      if (result && result.success) {
        setSaveStatus("✅ تم مزامنة وحفظ كافة التعديلات في قاعدة البيانات سوبابيس بنجاح! ☁️");
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        console.warn("Background cloud sync errors:", result.errors);
        setSaveStatus("⚠️ تم الحفظ محلياً وفشلت المزامنة التلقائية مع سوبابيس (يرجى مراجعة إعدادات الجدول أو الـ RLS)");
        setTimeout(() => setSaveStatus(null), 7000);
      }
    } catch (err: any) {
      console.error("Background cloud sync error:", err);
      setSaveStatus(`⚠️ خطأ في المزامنة التلقائية: ${err.message || err}`);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const updateSubject = (stageId: string, gradeId: string, subjectId: string, updatedFields: Partial<Subject>) => {
    const newData = curriculumData.map(stg => {
      if (stg.id !== stageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== gradeId) return grd;
          return {
            ...grd,
            subjects: grd.subjects.map(sub => {
              if (sub.id !== subjectId) return sub;
              return {
                ...sub,
                ...updatedFields
              };
            })
          };
        })
      };
    });
    setCurriculumData(newData);
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));
    
    // Auto sync to server file system code!
    saveCurriculumToServer(newData);
    
    // Auto sync to Supabase database!
    saveCurriculumToCloudAutomatically(newData);

    // Update active subject if it is currently open
    if (activeSubject && activeSubject.id === subjectId) {
      setActiveSubject({
        ...activeSubject,
        ...updatedFields
      } as any);
    }
  };

  const addSubject = (stageId: string, gradeId: string, newSubject: Subject) => {
    const newData = curriculumData.map(stg => {
      if (stg.id !== stageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== gradeId) return grd;
          return {
            ...grd,
            subjects: [...grd.subjects, newSubject]
          };
        })
      };
    });
    setCurriculumData(newData);
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));

    // Auto sync to server file system code!
    saveCurriculumToServer(newData);

    // Auto sync to Supabase database!
    saveCurriculumToCloudAutomatically(newData);
  };

  // Local achievements stats stored in localStorage
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem("sudan_edu_favs");
    const savedLessons = localStorage.getItem("sudan_edu_lessons");
    if (savedFavs) setFavoriteSubjects(JSON.parse(savedFavs));
    if (savedLessons) setCompletedLessons(JSON.parse(savedLessons));
  }, []);

  // Save changes
  const toggleFavorite = (subjectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let newFavs = [...favoriteSubjects];
    if (favoriteSubjects.includes(subjectId)) {
      newFavs = newFavs.filter(id => id !== subjectId);
    } else {
      newFavs.push(subjectId);
    }
    setFavoriteSubjects(newFavs);
    localStorage.setItem("sudan_edu_favs", JSON.stringify(newFavs));
  };

  const toggleLessonComplete = (subjectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let newCompleted = [...completedLessons];
    if (completedLessons.includes(subjectId)) {
      newCompleted = newCompleted.filter(id => id !== subjectId);
    } else {
      newCompleted.push(subjectId);
    }
    setCompletedLessons(newCompleted);
    localStorage.setItem("sudan_edu_lessons", JSON.stringify(newCompleted));
  };

  // Stage details icon component helper
  const getStageIcon = (iconName: string) => {
    switch (iconName) {
      case "Baby":
        return <Globe className="w-6 h-6" />;
      case "GraduationCap":
        return <GraduationCap className="w-6 h-6" />;
      case "Compass":
        return <Compass className="w-6 h-6" />;
      case "Award":
        return <Award className="w-6 h-6" />;
      default:
        return <BookOpen className="w-6 h-6" />;
    }
  };

  // Compute if the logged in user or admin has license to modify content (Admin or Approved Teacher)
  const hasEditPermissions = isAdminLoggedIn || (!!currentUser && currentUser.user_role === "teacher" && !!currentUser.is_approved_teacher);

  // Gather favorited subjects list with their stage and grade info
  const favoritedSubjectsList: any[] = [];
  curriculumData.forEach(stage => {
    stage.grades.forEach(grade => {
      grade.subjects.forEach(subject => {
        if (favoriteSubjects.includes(subject.id)) {
          favoritedSubjectsList.push({
            ...subject,
            stageId: stage.id,
            stageName: stage.name,
            gradeId: grade.id,
            gradeName: grade.name
          });
        }
      });
    });
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-16" dir="rtl">
      {/* Upper Flag Trim (Sudan Flag Colors: Red, White, Black, Green) */}
      <div 
        onClick={handleTrimClick}
        className="h-2 w-full flex cursor-pointer hover:opacity-95 active:opacity-80 transition-opacity" 
        title="المنصة السودانية التعليمية الموحدة"
      >
        <div className="bg-[#D21034] flex-1"></div>
        <div className="bg-white flex-1"></div>
        <div className="bg-[#000000] flex-1"></div>
        <div className="bg-[#007229] flex-1"></div>
      </div>

      {/* Top Header Bar for Admin Portal */}
      <div className="bg-slate-900/90 border-b border-slate-800/60 px-6 py-2.5 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap text-right">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-3xs md:text-2xs text-slate-400 font-bold">نقلة للمناهج السودانية التفاعلية لعام 2026 م</span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Student / user login trigger */}
            {currentUser ? (
              <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 border border-indigo-950/70 rounded-xl shadow-inner select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] text-indigo-400 font-extrabold max-w-[110px] truncate">
                  👤 {currentUser.username}
                </span>
                <button
                  onClick={triggerEditProfile}
                  className="text-[9px] text-amber-450 hover:text-amber-400 mr-1.5 pr-1.5 border-r border-slate-800 transition-colors cursor-pointer font-bold"
                >
                  تعديل الملف ⚙️
                </button>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem("sudan_auth_user");
                    const client = getSupabaseClient();
                    if (client) {
                      client.auth.signOut();
                    }
                    setSaveStatus("🚪 تم تسجيل الخروج من حسابك بنجاح.");
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  className="text-[9px] text-rose-450 hover:text-rose-400 mr-1.5 pr-1.5 border-r border-slate-800 transition-colors cursor-pointer font-bold"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowUserModal(true);
                  setUserModalTab("login");
                  setUserEmail("");
                  setUserPassword("");
                  setUserUsername("");
                  setUserAuthError("");
                  setUserAuthSuccess("");
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/60 text-indigo-400 hover:text-indigo-300 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                👤 حساب الطالب
              </button>
            )}

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/45 border border-emerald-900/65 text-emerald-400 font-extrabold text-[10px] rounded-xl shadow-inner select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>🔒 صلاحية تعديل الإدارة مباشرة لـ: </span>
                  <span className="text-white font-mono font-black">almangory</span>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="px-2.5 py-1 bg-rose-955/20 hover:bg-rose-900/20 border border-rose-900/40 text-rose-450 hover:text-rose-350 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAdminLogin(prev => !prev);
                  setAdminLoginError("");
                  setAdminUsername("");
                  setAdminPassword("");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all hover:border-emerald-700/60 cursor-pointer"
                title="دخول المسؤول المفوّض لتعديل وإخفاء المناهج التعليمية"
              >
                🔐 دخول الإدارة
              </button>
            )}

            {/* Admin Login Dialog dropdown */}
            <AnimatePresence>
              {showAdminLogin && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-3 md:left-0 md:right-auto right-[-80px] w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[9999] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>دخول إدارة المنهج التعليمي 🇸🇩</span>
                    </h5>
                    <button 
                      onClick={() => setShowAdminLogin(false)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
                    <div className="bg-emerald-955/25 border border-emerald-900/35 rounded-lg p-2.5 text-[9px] text-emerald-400 space-y-1 leading-normal font-semibold">
                      <p className="font-extrabold text-emerald-300">🔑 دخول المسؤول المفوّض:</p>
                      <p>اسم المستخدم: <span className="font-mono text-white select-all bg-slate-950 px-1 rounded">admin@sudan.edu</span></p>
                      <p>رمز المرور السري: <span className="font-mono text-white select-all bg-slate-950 px-1 rounded">20302060</span></p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">اسم المستخدم:</label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="أدخل الاسم: almangory"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-3xs text-slate-100 outline-none focus:border-emerald-600 transition-all font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">كلمة المرور السرية:</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-3xs text-slate-100 outline-none focus:border-emerald-600 transition-all font-sans"
                      />
                    </div>

                    {adminLoginError && (
                      <p className="text-[10px] text-rose-500 font-bold text-center leading-normal bg-rose-955/20 border border-rose-900/40 p-1.5 rounded-lg animate-bounce">{adminLoginError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-505 hover:to-emerald-605 text-[#ffffff] text-3xs font-black rounded-lg transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      تفعيل صلاحيات الإدارة وحفظ الأكواد
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Admin Operations Section */}
      {isAdminLoggedIn && (
        <div id="admin-git-integration" className="bg-slate-900 border-b border-emerald-900/40 px-6 py-4 pb-5 relative z-40 text-right font-sans" dir="rtl">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="text-emerald-400 text-3xs font-black block">⚙️ أدوات نقل وتحديث المنهج التعليمي (GitHub / Vercel / Live-Server):</span>
                <p className="text-xs text-slate-300 font-bold">
                  لقد قمت بإجراء تعديلات على مسميات أو روابط المواد الدراسية. يمكنك تصدير الملف لتحديثه على <span className="font-mono text-emerald-400">GitHub</span> من هنا ليعمل على جميع المنصات مجاناً وبشكل دائم!
                </p>
              </div>

              {/* Reset button */}
              <button
                onClick={resetCurriculumToDefault}
                className="px-3.5 py-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-900/40 hover:border-red-550 text-red-400 text-3xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>استعادة المنهج الأصلي 🔄</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Copy Code Button */}
              <button
                onClick={copyCurriculumCode}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white text-2xs font-extrabold rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>{copySuccess ? "✓ تم نسخ الكود!" : "📋 نسخ كود الملف الكامل (curriculum.ts)"}</span>
              </button>

              {/* Download File Button */}
              <button
                onClick={downloadCurriculumFile}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-705 text-slate-100 text-2xs font-extrabold rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>📥 تنزيل ملف المنهج المحدث (curriculum.ts)</span>
              </button>

              <span className="text-3xs text-slate-400 max-w-sm leading-normal">
                💡 **طريقة النقل**: قم بتنزيل أو نسخ الملف المحدث أعلاه، واستبدل به الملف القديم في كود مستودع GitHub الخاص بك في هذا المسار تماماً: <code className="bg-slate-950 text-yellow-400 px-1.5 py-0.5 rounded text-3xs font-mono">src/data/curriculum.ts</code> ، وسيتم تحديث ونقل جميع تعديلات الروابط والمسميات تلقائياً فوراً!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Sudan Cultural and Academic Hero Banner */}
      <header className="relative py-12 md:py-16 px-6 overflow-hidden">
        {/* Abstract Geometrics */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-emerald-950/20 via-slate-950/30 to-slate-950 pointer-events-none" />
        <div className="absolute -left-36 top-12 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-36 top-0 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>موقع تفاعلي لطلاب جمهورية السودان 🇸🇩</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight md:leading-normal">
              منصة السودان <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-400">التعليمية التفاعلية</span>
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
              بوابتك الذكية لاستكشاف مناهج وزارة التربية والتعليم السودانية، من رياض ومرحلة الطفولة المبكرة والابتدائي إلى المتوسط والثانوي. تصفح المواد الدراسية، والتحق بمعاملك التفاعلية وأستاذك الذكي.
            </p>

            {/* Quick search input */}
            <div className="relative max-w-md mx-auto md:mr-0 pt-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مادة تفاعلية مخصصة (مثال: فيزياء، حساب...)"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder-slate-500 rounded-xl py-2 px-4 pr-10 text-xs md:text-sm text-slate-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Simple Statistics & Admin Gate widgets */}
          <div className={`w-full md:w-auto grid gap-4 flex-shrink-0 ${
            isAdminLoggedIn || showHiddenAdminGate 
              ? "grid-cols-2 md:grid-cols-3" 
              : "grid-cols-2"
          }`}>
            <div 
              onClick={() => {
                setShowOnlyFavorites(prev => !prev);
                setShowStudyCamp(false);
                setShowAdminDashboard(false);
              }}
              className={`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 select-none ${
                showOnlyFavorites 
                  ? "bg-amber-950/20 border-yellow-500/80 ring-2 ring-yellow-500/30 text-amber-400 hover:bg-amber-950/40 shadow-yellow-950/40" 
                  : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-yellow-500/40"
              }`}
            >
              <Star className={`w-5 h-5 mx-auto transition-all ${showOnlyFavorites ? "text-yellow-400 fill-yellow-400 scale-110" : "text-yellow-400"}`} />
              <span className="text-xl font-bold text-slate-100 block">{favoriteSubjects.length}</span>
              <span className="text-2xs text-slate-400 block font-bold">
                {showOnlyFavorites ? "المناهج الكاملة" : "المواد المفضلة ⭐"}
              </span>
            </div>

            <div className="bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg selection:bg-transparent">
              <CheckCircle className="w-5 h-5 text-emerald-450 mx-auto" />
              <span className="text-xl font-bold text-slate-100 block">{completedLessons.length}</span>
              <span className="text-2xs text-slate-400 block font-medium">تمارين مكتملة</span>
            </div>

            {(isAdminLoggedIn || showHiddenAdminGate) && (
              <div 
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setShowAdminDashboard(prev => !prev);
                    setSelectedStage(null);
                    setActiveGrade(null);
                    setShowStudyCamp(false);
                    setShowOnlyFavorites(false);
                  } else {
                    setShowAdminLogin(true);
                    setAdminLoginError("");
                    setAdminUsername("");
                    setAdminPassword("");
                  }
                }}
                className={`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 select-none col-span-2 md:col-span-1 ${
                  isAdminLoggedIn 
                    ? "bg-emerald-950/20 border-emerald-500/80 ring-2 ring-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40" 
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-emerald-500/40"
                }`}
              >
                <Lock className={`w-5 h-5 mx-auto transition-all ${isAdminLoggedIn ? "text-emerald-400" : "text-slate-400"}`} />
                <span className="text-xs font-bold text-slate-100 block leading-tight pt-1">
                  {isAdminLoggedIn ? "لوحة التحكم" : "بوابة الإدارة"}
                </span>
                <span className="text-3xs text-emerald-450 block font-bold mt-1">
                  {isAdminLoggedIn ? "تعديل المناهج ⚙️" : "دخول الإدارة 🔐"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 space-y-12">
        


        {/* Stage selection selector tabs */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-300">مراحل التعليم الأساسي بدولة السودان:</h2>
              <p className="text-2xs text-slate-500 mt-1">اختر المرحلة الدراسية الملائمة لتصفح الفصول والمواد الدراسية المقررة.</p>
            </div>
            
            {/* Quick notification of custom structure */}
            <div className="text-2xs text-amber-450 bg-amber-955/10 border border-amber-900/30 rounded-lg py-1.5 px-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>مطابق لهيكل التعليم في السودان الجديد (3 رياض، 6 ابتدائي، 3 متوسط، 3 ثانوي).</span>
            </div>
          </div>

          {/* Grid of Stage Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
            {displayedStages.map((stage) => {
              const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites && !showStudyCamp;
              
              return (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStage(null);
                        setActiveGrade(null);
                      } else {
                        setSelectedStage(stage);
                        setActiveGrade(null);
                        setShowOnlyFavorites(false);
                        setShowStudyCamp(false);
                      }
                    }}
                    className={`relative p-5 rounded-2xl text-right border transition-all text-xs md:text-sm shadow-sm overflow-hidden group cursor-pointer ${
                      isSelected 
                        ? "bg-slate-900 border-emerald-600 shadow-md shadow-emerald-950/20" 
                        : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-800"
                    }`}
                  >
                    {/* Decorative Subtle Accent Tag for selected */}
                    {isSelected && (
                      <span className="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-emerald-700" />
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl transition-all ${
                        isSelected 
                          ? "bg-emerald-600/20 text-emerald-400" 
                          : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                      }`}>
                        {getStageIcon(stage.icon)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-100">{stage.name}</h3>
                        <p className="text-2xs text-slate-400 line-clamp-1">{stage.description}</p>
                        <span className="text-3xs text-emerald-500 font-bold block mt-1">
                          عدد الفصول: {stage.grades.length} {stage.id === "kindergarten" ? "سنوات" : "صفوف دراسية"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Inline Expanded Grades & Classes for the Selected Stage */}
                  {isSelected && (() => {
                    const renderedGrades = currentUser && currentUser.user_role === "student" && currentUser.grade_id
                      ? stage.grades.filter(g => g.id === currentUser.grade_id)
                      : stage.grades;

                    return (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-5 bg-slate-900/50 border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-6 mt-1 mb-4 select-text">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-850 pb-4">
                          <div className="space-y-1 text-center sm:text-right">
                            <span className="text-3xs text-emerald-400 font-mono font-black uppercase tracking-widest block">صفوف ومستويات المرحلة:</span>
                            <h4 className="text-sm font-black text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                              {getStageIcon(stage.icon)}
                              <span>مناهج {stage.name}</span>
                            </h4>
                          </div>
                          
                          <div className="text-3xs text-slate-400 font-bold flex items-center gap-1.5 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850 animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            <span>مجموع الصفوف: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مادة تفاعلية مضافة)</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {renderedGrades.map((grade) => {
                            const isGradeExpanded = activeGrade?.id === grade.id;
                            
                            // Interactive grade filtering logic
                            const filteredSubjects = grade.subjects.filter(subj => {
                              // If subject is hidden, only show to logged-in administrator
                              if (subj.hidden && !isAdminLoggedIn) return false;

                              const matchesSearch = !searchQuery || 
                                subj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                subj.curriculumSummary.toLowerCase().includes(searchQuery.toLowerCase());
                              
                              if (!matchesSearch) return false;

                              // Category filter checks
                              if (categoryFilter === "books") {
                                return !!subj.pdfUrl || !!subj.memoPdfUrl;
                              }
                              if (categoryFilter === "videos") {
                                return !!subj.videoUrl;
                              }
                              if (categoryFilter === "interactive") {
                                return !!subj.interactiveUrl;
                              }
                              
                              return true;
                            });

                            if (searchQuery && filteredSubjects.length === 0) return null;

                            return (
                              <motion.div 
                                key={grade.id}
                                layout
                                className="bg-slate-950/45 border border-slate-850 rounded-xl overflow-hidden shadow-sm"
                              >
                                <button
                                  onClick={() => {
                                    if (isGradeExpanded) {
                                      setActiveGrade(null);
                                    } else {
                                      setActiveGrade(grade);
                                    }
                                  }}
                                  className="w-full px-5 py-3.5 hover:bg-slate-900/60 flex items-center justify-between text-right cursor-pointer group transition-colors"
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 font-extrabold text-xs shadow-inner">
                                      {grade.subjects.length}
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">{grade.name}</h5>
                                      <p className="text-3xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                        <span>اضغط لتصفح الكتب والمقررات والفيديوهات التفاعلية</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-slate-400 group-hover:text-slate-200 transition-colors">
                                    <ChevronDown className={`w-4 h-4 transform transition-transform duration-250 ${isGradeExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isGradeExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="border-t border-slate-800/80 bg-slate-950/80"
                                    >
                                      <div className="p-4 sm:p-5 space-y-4">
                                        {/* Category Filter Bar */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/20 p-2 rounded-xl border border-slate-800/80">
                                          <div className="flex items-center gap-1.5 text-slate-400 text-3xs font-extrabold pb-0.5 sm:pb-0">
                                            <Filter className="w-3 h-3 text-emerald-400" />
                                            <span>تصنيف محتوى المواد وعرض المقررات:</span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("all")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                                                categoryFilter === "all"
                                                  ? "bg-emerald-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/60 hover:text-slate-200"
                                              }`}
                                            >
                                              الكل ({grade.subjects.length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("books")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "books"
                                                  ? "bg-blue-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/60 hover:text-blue-450"
                                              }`}
                                            >
                                              📚 كتب ومذكرات ({grade.subjects.filter(s => !!s.pdfUrl || !!s.memoPdfUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("videos")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "videos"
                                                  ? "bg-rose-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/60 hover:text-rose-450"
                                              }`}
                                            >
                                              🎥 فيديوهات شروحات ({grade.subjects.filter(s => !!s.videoUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("interactive")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "interactive"
                                                  ? "bg-purple-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/60 hover:text-purple-450"
                                              }`}
                                            >
                                              🔬 معامل تفاعلية ({grade.subjects.filter(s => !!s.interactiveUrl).length})
                                            </button>
                                          </div>
                                        </div>

                                        {/* Grid of subjects */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {filteredSubjects.map((subject) => {
                                            let isFavorite = favoriteSubjects.includes(subject.id);
                                            let isLessonComplete = completedLessons.includes(subject.id);

                                            return (
                                              <div
                                                key={subject.id}
                                                onClick={() => handleOpenSubject({ ...subject, gradeName: grade.name, gradeId: grade.id } as any)}
                                                className="group relative p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-650/80 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
                                              >
                                                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="absolute top-3.5 left-3.5 flex gap-1 z-10">
                                                  <button
                                                    onClick={(e) => toggleFavorite(subject.id, e)}
                                                    className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                                                      isFavorite 
                                                        ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800/60' 
                                                        : 'bg-slate-950/60 text-slate-500 hover:text-yellow-400 border-slate-800 hover:border-yellow-950/30'
                                                    }`}
                                                    title="المفضلة"
                                                  >
                                                    <Star className="w-3 h-3 fill-current" />
                                                  </button>
                                                  <button
                                                    onClick={(e) => toggleLessonComplete(subject.id, e)}
                                                    className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                                                      isLessonComplete 
                                                        ? 'bg-emerald-950/45 text-emerald-400 border-emerald-900/60' 
                                                        : 'bg-slate-950/60 text-slate-500 hover:text-emerald-400 border-slate-800 hover:border-emerald-950/30'
                                                    }`}
                                                    title="تميز بالاكتمال"
                                                  >
                                                    <CheckCircle className="w-3 h-3 fill-current" />
                                                  </button>
                                                </div>

                                                <div className="space-y-3">
                                                  <div className="flex items-start gap-3">
                                                    <div className={`p-2.5 rounded-lg ${subject.colorClass || "bg-emerald-600/10 text-emerald-400"} border flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                                      <DynamicIcon name={subject.iconName} className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-0.5 max-w-[65%]">
                                                      <h6 className="font-extrabold text-white text-xs group-hover:text-emerald-300 transition-colors truncate">{subject.name}</h6>
                                                      <span className="text-3xs text-slate-500 truncate block">السودان • مقرر تفاعلي</span>
                                                    </div>
                                                  </div>

                                                  <p className="text-3xs text-slate-400 leading-normal line-clamp-2 h-7 overflow-hidden text-ellipsis text-right" dir="rtl">
                                                    {subject.curriculumSummary}
                                                  </p>

                                                  {/* Resource badges */}
                                                  <div className="flex flex-wrap gap-1">
                                                    {subject.hidden ? (
                                                      <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-yellow-950/40 border border-yellow-850/40 text-[8px] text-amber-500 font-extrabold animate-pulse">
                                                        👁️‍قيد الإخفاء
                                                      </span>
                                                    ) : null}
                                                    {subject.pdfUrl ? (
                                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-955/40 border border-blue-900/20 text-[8px] text-blue-400 font-extrabold">
                                                        📚 كتاب
                                                      </span>
                                                    ) : null}
                                                    {subject.memoPdfUrl ? (
                                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-900/20 border border-emerald-900/10 text-[8px] text-emerald-400 font-extrabold">
                                                        📝 ملخص
                                                      </span>
                                                    ) : null}
                                                    {subject.interactiveUrl ? (
                                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-purple-955/30 border border-purple-900/20 text-[8px] text-purple-400 font-extrabold">
                                                        🔬 تفاعلي
                                                      </span>
                                                    ) : null}
                                                    {subject.videoUrl ? (
                                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-rose-955/30 border border-rose-900/20 text-[8px] text-rose-400 font-extrabold">
                                                        🎥 فيديو
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </div>

                                                <div className="mt-3.5 pt-2.5 border-t border-slate-850 flex items-center justify-between text-3xs">
                                                  <span className="text-emerald-400/95 font-black flex items-center gap-0.5">
                                                    <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                                                    التحاق بالدرس التفاعلي
                                                  </span>
                                                  <ChevronLeft className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-355 transform group-hover:translate-x-[-1px] transition-all" />
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Add custom subject button inside the class if teacher mode activated */}
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setAddSubjectState({
                                                stageId: stage.id,
                                                gradeId: grade.id,
                                                gradeName: grade.name
                                              });
                                            }}
                                            className="relative p-4 bg-slate-900/10 border border-dashed border-slate-800 hover:border-emerald-600/50 rounded-xl transition-all hover:bg-slate-900/30 cursor-pointer flex flex-col justify-center items-center text-center space-y-2 min-h-[140px]"
                                          >
                                            <Plus className="w-4 h-4 text-emerald-400 bg-slate-950 p-1 rounded border border-slate-800" />
                                            <h6 className="font-bold text-slate-200 text-3xs">إضافة مادة جديدة</h6>
                                            <p className="text-4xs text-slate-500 leading-normal max-w-[150px]">
                                              إضافة بطاقة مقرر تفاعلي إضافية لهذا الصف.
                                            </p>
                                          </div>
                                        </div>

                                        {filteredSubjects.length === 0 && (
                                          <div className="text-center py-8 bg-slate-900/10 rounded-xl border border-slate-855 space-y-2">
                                            <p className="text-3xs text-slate-400">لا توجد مواد تطابق هذا التصنيف حالياً لهذا الصف.</p>
                                            <button 
                                              onClick={() => setCategoryFilter("all")}
                                              className="text-4xs text-emerald-400 underline"
                                            >
                                              عرض الكل
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </React.Fragment>
              );
            })}

            {/* Study Camp Activator Card */}
            <button
              onClick={() => {
                setShowStudyCamp(true);
                setSelectedStage(null);
                setActiveGrade(null);
                setShowOnlyFavorites(false);
              }}
              className={`relative p-5 rounded-2xl text-right border transition-all text-xs md:text-sm shadow-sm overflow-hidden group cursor-pointer ${
                showStudyCamp 
                  ? "bg-slate-900 border-indigo-600 shadow-md shadow-indigo-950/20" 
                  : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-indigo-650/40"
              }`}
            >
              {/* Decorative Subtle Accent Tag for selected */}
              {showStudyCamp && (
                <span className="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-505 to-indigo-705" />
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl transition-all ${
                  showStudyCamp 
                    ? "bg-indigo-600/20 text-indigo-400" 
                    : "bg-slate-800 text-slate-400 group-hover:text-indigo-405"
                }`}>
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-100">مخيم المذاكرة وأدوات التفوق ⚡</h3>
                  <p className="text-2xs text-slate-400 line-clamp-1">تدريبات تفاعلية وحاسبات ذكية</p>
                  <span className="text-3xs text-indigo-455 font-bold block mt-1 animate-pulse">
                    اختبارات، درجات، وجداول 📅
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Render Admin Dashboard, Favorited Subjects when filtered, otherwise Stage Exploration */}
        {showAdminDashboard ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminDashboard 
              stages={curriculumData}
              onUpdateCurriculum={(newStages) => {
                setCurriculumData(newStages);
                localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newStages));
                saveCurriculumToServer(newStages, true);
                saveCurriculumToCloudAutomatically(newStages);
              }}
              onClose={() => setShowAdminDashboard(false)}
            />
          </motion.div>
        ) : showOnlyFavorites ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/10 p-6 md:p-8 rounded-3xl border border-slate-800/85 gap-6 shadow-xl">
              <div className="space-y-2 text-center sm:text-right">
                <span className="text-xs text-amber-400 font-mono font-black uppercase tracking-widest">تصفح قائمتك الخاصة:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <h3 className="text-xl md:text-2xl font-black text-slate-100 animate-pulse">المواد المفضلة لديك ⭐</h3>
                </div>
                <p className="text-xs text-slate-400">لقد قمت بإضافة {favoritedSubjectsList.length} مادة للمفضلة لتسهيل مراجعتها والمتابعة السريعة للفيديوهات والمعامل التفاعلية.</p>
              </div>
              
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="px-5 py-2 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md shrink-0"
              >
                العودة للمنهج السوداني الكامل 🇸🇩
              </button>
            </div>

            {favoritedSubjectsList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/60 border-dashed space-y-4 max-w-2xl mx-auto">
                <div className="p-4 bg-yellow-500/5 text-yellow-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-yellow-500/10">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">لا توجد مواد مفضلة حتى الآن</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    لتسهيل المذاكرة والمتابعة السريعة، تصفح المراحل التعليمية واضغط على علامة النجمة (⭐) الموجودة على أي مادة دراسية لتظهر هنا تلقائياً لسهولة تصفحها.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritedSubjectsList
                  .filter(subj => {
                    if (!searchQuery) return true;
                    return subj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           subj.curriculumSummary.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((subject) => {
                    let isFavorite = favoriteSubjects.includes(subject.id);
                    let isLessonComplete = completedLessons.includes(subject.id);

                    return (
                      <div
                        key={subject.id}
                        onClick={() => handleOpenSubject({ ...subject } as any)}
                        className="relative p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-200 hover:border-emerald-600 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-950/60 cursor-pointer flex flex-col justify-between"
                      >
                        {/* Action buttons (Favorites, studied toggle) */}
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <button
                            onClick={(e) => toggleFavorite(subject.id, e)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isFavorite 
                                ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800/40' 
                                : 'bg-slate-800 text-slate-500 hover:text-slate-200 border-slate-700'
                            }`}
                            title="المفضلة"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => toggleLessonComplete(subject.id, e)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isLessonComplete 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' 
                                : 'bg-slate-800 text-slate-500 hover:text-slate-200 border-slate-700'
                            }`}
                            title="تميز بالاكتمال"
                          >
                            <CheckCircle className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Subject Title and Icon */}
                          <div className="flex items-start gap-3.5">
                            <div className={`p-3 rounded-xl ${subject.colorClass} border flex-shrink-0`}>
                              <DynamicIcon name={subject.iconName} className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 max-w-[70%]">
                              <h6 className="font-extrabold text-[#ffffff] text-sm truncate">{subject.name}</h6>
                              <span className="text-3xs text-emerald-400 font-bold block truncate">
                                {subject.stageName} • {subject.gradeName}
                              </span>
                            </div>
                          </div>

                          {/* Abstract brief summary of curriculum */}
                          <p className="text-2xs text-slate-400 leading-relaxed line-clamp-3">
                            {subject.curriculumSummary}
                          </p>
                        </div>

                        {/* Footer: entering triggers interaction */}
                        <div className="mt-5 pt-3.5 border-t border-slate-800/50 flex items-center justify-between text-2xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            بوابة المدرس والمناهج التفاعلية
                          </span>
                          <span className="text-slate-400 font-medium group-hover:text-slate-200 flex items-center gap-0.5">
                            دخول
                            <ChevronLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        ) : showStudyCamp ? (
          <motion.div
            key="study-camp-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <StudyCamp stages={displayedStages} />
          </motion.div>
        ) : (
          false && selectedStage && (() => {
            const renderedGrades = currentUser && currentUser.user_role === "student" && currentUser.grade_id
              ? selectedStage.grades.filter(g => g.id === currentUser.grade_id)
              : selectedStage.grades;

            return (
              <motion.div 
                key={selectedStage.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stage Hero Summary */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/10 p-6 md:p-8 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-3 max-w-xl text-center md:text-right">
                    <span className="text-xs text-emerald-400 font-mono font-black uppercase tracking-widest">تصفح المواد في:</span>
                    <h3 className="text-xl md:text-2xl font-black text-slate-100">{selectedStage.name}</h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{selectedStage.description}</p>
                  </div>
                  
                  {/* Informative indicator card */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3.5 flex-shrink-0">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block leading-none">مجموع المواد التفاعلية</span>
                      <span className="text-lg font-black text-slate-105 block mt-1">
                        {renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مواد دراسية
                      </span>
                    </div>
                  </div>
                </div>

                {/* List of Grades (الصفوف الدراسية لهذه المرحلة) */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">المستويات الدراسية السنوية:</h4>
                  
                  <div className="space-y-6">
                    {renderedGrades.map((grade) => {
                    const isGradeExpanded = activeGrade?.id === grade.id;
                    
                    // Interactive grade filtering logic
                    const filteredSubjects = grade.subjects.filter(subj => {
                      if (subj.hidden && !isAdminLoggedIn) return false;
                      const matchesSearch = !searchQuery || 
                        subj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        subj.curriculumSummary.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      if (!matchesSearch) return false;

                      // Category filter checks
                      if (categoryFilter === "books") {
                        return !!subj.pdfUrl || !!subj.memoPdfUrl;
                      }
                      if (categoryFilter === "videos") {
                        return !!subj.videoUrl;
                      }
                      if (categoryFilter === "interactive") {
                        return !!subj.interactiveUrl;
                      }
                      
                      return true;
                    });

                    // If search is active and this grade has no matching subjects, hide this grade
                    if (searchQuery && filteredSubjects.length === 0) return null;

                    return (
                      <motion.div 
                        key={grade.id}
                        layout
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                      >
                        {/* Grade Title / Header accordion tab */}
                        <button
                          onClick={() => {
                            if (isGradeExpanded) {
                              setActiveGrade(null);
                            } else {
                              setActiveGrade(grade);
                            }
                          }}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-900 text-right cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 font-bold transition-all shadow-inner`}>
                              {grade.subjects.length}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-100 group-hover:text-emerald-300 transition-colors">{grade.name}</h5>
                              <p className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                                <span>انقر لتصفح المواد كشبكة تفاعلية مصنفة</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-slate-400 group-hover:text-slate-200 transition-colors">
                            <ChevronDown className={`w-5 h-5 transform transition-transform ${isGradeExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expandable Subjects Panel */}
                        <AnimatePresence initial={false}>
                          {isGradeExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28 }}
                              className="border-t border-slate-800 bg-slate-950/40"
                            >
                              <div className="p-6 space-y-5">
                                
                                {/* 🏷️ Category Filter Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                                  <div className="flex items-center gap-2 text-slate-400 text-3xs font-extrabold pb-1 sm:pb-0">
                                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>تصنيف محتوى المواد وعرض المقررات:</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setCategoryFilter("all")}
                                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer ${
                                        categoryFilter === "all"
                                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                                          : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-slate-200"
                                      }`}
                                    >
                                      الكل ({grade.subjects.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCategoryFilter("books")}
                                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        categoryFilter === "books"
                                          ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                                          : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-blue-400"
                                      }`}
                                    >
                                      📚 كتب ومذكرات ({grade.subjects.filter(s => !!s.pdfUrl || !!s.memoPdfUrl).length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCategoryFilter("videos")}
                                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        categoryFilter === "videos"
                                          ? "bg-rose-600 text-white shadow-md shadow-rose-950/30"
                                          : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-rose-400"
                                      }`}
                                    >
                                      🎥 فيديوهات شروحات ({grade.subjects.filter(s => !!s.videoUrl).length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCategoryFilter("interactive")}
                                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        categoryFilter === "interactive"
                                          ? "bg-purple-600 text-white shadow-md shadow-purple-950/30"
                                          : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-purple-400"
                                      }`}
                                    >
                                      🔬 معامل وبوابات تفاعلية ({grade.subjects.filter(s => !!s.interactiveUrl).length})
                                    </button>
                                  </div>
                                </div>

                                {/* Active Interactive Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {filteredSubjects.map((subject) => {
                                    let isFavorite = favoriteSubjects.includes(subject.id);
                                    let isLessonComplete = completedLessons.includes(subject.id);

                                    return (
                                      <div
                                        key={subject.id}
                                        onClick={() => handleOpenSubject({ ...subject, gradeName: grade.name, gradeId: grade.id } as any)}
                                        className="group relative p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-650/80 rounded-2xl transition-all duration-300 hover:translate-y-[-3px] hover:shadow-2xl hover:shadow-emerald-950/20 cursor-pointer flex flex-col justify-between overflow-hidden"
                                      >
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Action buttons (Favorites, studied toggle) */}
                                        <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                                          <button
                                            onClick={(e) => toggleFavorite(subject.id, e)}
                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                              isFavorite 
                                                ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800/60 scale-105' 
                                                : 'bg-slate-950/60 text-slate-500 hover:text-yellow-400 border-slate-800 hover:border-yellow-950/30'
                                            }`}
                                            title="المفضلة"
                                          >
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                          </button>
                                          <button
                                            onClick={(e) => toggleLessonComplete(subject.id, e)}
                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                              isLessonComplete 
                                                ? 'bg-emerald-950/45 text-emerald-400 border-emerald-900/60 scale-105' 
                                                : 'bg-slate-950/60 text-slate-500 hover:text-emerald-400 border-slate-800 hover:border-emerald-950/30'
                                            }`}
                                            title="تميز بالاكتمال"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5 fill-current" />
                                          </button>
                                        </div>

                                        <div className="space-y-4">
                                          {/* Subject Title and Icon */}
                                          <div className="flex items-start gap-3.5">
                                            <div className={`p-3 rounded-xl ${subject.colorClass} border flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                                              <DynamicIcon name={subject.iconName} className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5 max-w-[65%]">
                                              <h6 className="font-extrabold text-[#ffffff] text-sm group-hover:text-emerald-300 transition-colors truncate">{subject.name}</h6>
                                              <span className="text-3xs text-slate-500 leading-none truncate block">السودان • مادة دراسية أساسية</span>
                                            </div>
                                          </div>

                                          {/* Abstract brief summary of curriculum */}
                                          <p className="text-2xs text-slate-400 leading-relaxed line-clamp-2 h-7 overflow-hidden text-ellipsis">
                                            {subject.curriculumSummary}
                                          </p>

                                          {/* Mini resource indicators */}
                                          <div className="flex flex-wrap gap-1.5 pt-1">
                                            {subject.hidden && (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-yellow-950/45 border border-yellow-850/45 text-[9px] text-amber-400 font-bold animate-pulse">
                                                👁️‍قيد الإخفاء
                                              </span>
                                            )}
                                            {subject.pdfUrl ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-blue-950/40 border border-blue-900/30 text-[9px] text-blue-400 font-bold">
                                                <BookOpen className="w-2.5 h-2.5" />
                                                كتاب مقرر
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                لا كتاب
                                              </span>
                                            )}

                                            {subject.memoPdfUrl ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-950/30 border border-emerald-900/30 text-[9px] text-emerald-400 font-bold">
                                                <FileText className="w-2.5 h-2.5" />
                                                ملخص/مذكرة
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                لا ملخص
                                              </span>
                                            )}

                                            {subject.interactiveUrl ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-955/30 border border-purple-900/30 text-[9px] text-purple-400 font-bold">
                                                <Compass className="w-2.5 h-2.5" />
                                                تفاعلي
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                لا بوابة
                                              </span>
                                            )}

                                            {subject.videoUrl ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-955/30 border border-rose-900/30 text-[9px] text-rose-400 font-bold">
                                                <Video className="w-2.5 h-2.5" />
                                                فيديو
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                لا فيديو
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Footer: entering triggers interaction */}
                                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-2xs">
                                          <span className="text-emerald-400/90 font-bold flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                                            شرح المعلم التفاعلي نشط
                                          </span>
                                          <span className="text-slate-400 font-bold group-hover:text-emerald-400 group-hover:translate-x-[-1px] transition-all flex items-center gap-0.5">
                                            دخول
                                            <ChevronLeft className="w-3 h-3 text-emerald-500" />
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Empty State when filter yields 0 matches */}
                                  {filteredSubjects.length === 0 && (
                                    <div className="col-span-full py-12 px-6 bg-slate-905/20 border border-slate-800/60 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
                                      <div className="p-3 bg-slate-950 rounded-full text-slate-500">
                                        <Filter className="w-6 h-6" />
                                      </div>
                                      <p className="text-xs font-bold text-slate-400">عذراً، لا توجد مواد دراسية تفاعلية مضافة تحتوي على هذا المحتوى حالياً.</p>
                                      <button 
                                        onClick={() => setCategoryFilter("all")} 
                                        className="text-3xs text-emerald-400 border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 rounded-xl hover:bg-emerald-900/30 transition-all cursor-pointer"
                                      >
                                        عرض كافة المواد الدراسية لهذه السنة
                                      </button>
                                    </div>
                                  )}

                                  {/* Add Subject Card */}
                                  <div
                                    onClick={() => setAddSubjectState({
                                      stageId: selectedStage.id,
                                      gradeId: grade.id,
                                      gradeName: grade.name
                                    })}
                                    className="relative p-5 bg-slate-900/30 border border-dashed border-slate-800 hover:border-emerald-600/60 rounded-2xl transition-all duration-200 hover:bg-slate-900/50 cursor-pointer flex flex-col justify-center items-center text-center space-y-3 min-h-[180px]"
                                  >
                                    <div className="p-3 bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition-colors">
                                      <Plus className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="space-y-1">
                                      <h6 className="font-bold text-slate-200 text-xs">إضافة مادة مخصصة جديدة</h6>
                                      <p className="text-3xs text-slate-500 leading-relaxed max-w-[200px]">
                                        انقر هنا لإضافة بطاقة مادة مقرر إضافية لهذا الصف (مطلوب رمز المعلم).
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })())}
      </main>

      {/* Embedded Subject entry gate Modal */}
      <AnimatePresence>
        {activeSubject && (
          <SubjectModal
            stageId={(activeSubject as any).stageId || (selectedStage ? selectedStage.id : "")}
            stageName={(activeSubject as any).stageName || (selectedStage ? selectedStage.name : "")}
            gradeId={(activeSubject as any).gradeId || ""}
            gradeName={(activeSubject as any).gradeName}
            subject={activeSubject}
            onClose={() => setActiveSubject(null)}
            onUpdateSubject={updateSubject}
            isAdminActive={hasEditPermissions}
          />
        )}
      </AnimatePresence>

      {/* Embedded Add Subject Modal */}
      <AnimatePresence>
        {addSubjectState && (
          <AddSubjectModal
            stageId={addSubjectState.stageId}
            gradeId={addSubjectState.gradeId}
            gradeName={addSubjectState.gradeName}
            onClose={() => setAddSubjectState(null)}
            onAddSubject={addSubject}
            isAdminActive={hasEditPermissions}
          />
        )}
      </AnimatePresence>

      {/* 👤 Student/User Registration and Login Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-right font-sans"
              dir="rtl"
            >
              {/* Pattern Background Accent */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
              
              {/* Modal Upper Top Bar */}
              <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-600/15 text-indigo-400 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-100">
                      {userModalTab === "profile" ? "تعديل بيانات الحساب ⚙️" : "بوابة الطالب والزائر 🇸🇩"}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {userModalTab === "profile" ? "تعديل معلومات حسابك الدراسي لعام ٢٠٢٦" : "منصة المناهج السودانية التفاعلية لعام ٢٠٢٦"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs list (Sign-in / Register) */}
              {userModalTab !== "profile" && (
                <div className="px-6 pt-4 flex gap-2 relative z-10">
                  <button
                    onClick={() => {
                      setUserModalTab("login");
                      setUserAuthError("");
                      setUserAuthSuccess("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      userModalTab === "login"
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                        : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-205"
                    }`}
                  >
                    تسجيل الدخول للطلاب
                  </button>
                  <button
                    onClick={() => {
                      setUserModalTab("register");
                      setUserAuthError("");
                      setUserAuthSuccess("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      userModalTab === "register"
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                        : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-205"
                    }`}
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              )}

              {/* Form segment */}
              <div className="p-6 relative z-10 space-y-4">
                <form
                  onSubmit={
                    userModalTab === "profile"
                      ? handleUserProfileUpdateSubmit
                      : userModalTab === "login"
                      ? handleUserLoginSubmit
                      : handleUserRegisterSubmit
                  }
                  className="space-y-3.5"
                >
                  {userModalTab === "profile" && (
                    <>
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">الاسم بالكامل (أو اسم المستخدم):</label>
                        <input
                          type="text"
                          required
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          placeholder="مثال: يوسف أحمد التكينة"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                        />
                      </div>

                      {/* Display Class Selector for Students */}
                      {currentUser?.user_role === "student" && (
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] text-slate-400 font-bold block">الصف والمرحلة الدراسية الخاصة بك:</label>
                          <select
                            value={regGradeId}
                            onChange={(e) => setRegGradeId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-600"
                          >
                            <option value="">-- اختر صفّك الدراسي --</option>
                            {curriculumData.flatMap(stage => 
                              stage.grades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                  {stage.name} - {grade.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      {/* Display Specialty selections for Teachers */}
                      {currentUser?.user_role === "teacher" && (
                        <>
                          <div className="space-y-2 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              المواد المتخصص بتدريسها لمناهج السودان (تحديد متعدد):
                            </label>
                            <div className="max-h-28 overflow-y-auto border border-slate-850 bg-slate-950 p-2.5 rounded-xl text-right">
                              {Array.from(new Set(
                                curriculumData.flatMap(stage => 
                                  stage.grades.flatMap(grade => 
                                    grade.subjects.map(subj => subj.name)
                                  )
                                )
                              )).map((subjectName) => {
                                const isSelected = selectedSpecialties.includes(subjectName);
                                return (
                                  <button
                                    type="button"
                                    key={subjectName}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSpecialties(prev => prev.filter(x => x !== subjectName));
                                      } else {
                                        setSelectedSpecialties(prev => [...prev, subjectName]);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 ml-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-600/20 text-amber-400 border-amber-600 font-extrabold"
                                        : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                    <span>{subjectName}</span>
                                    {isSelected && <span>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">جوال المعلم أو وسيلة تواصل سريعة (إيميل/رقم):</label>
                            <input
                              type="text"
                              required
                              value={regContactMethod}
                              onChange={(e) => setRegContactMethod(e.target.value)}
                              placeholder="مثال: 0123456789 أو whatsapp"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-amber-600 transition-all font-sans text-right"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {userModalTab === "register" && (
                    <>
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">الاسم بالكامل (أو اسم المستخدم):</label>
                        <input
                          type="text"
                          required
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          placeholder="مثال: يوسف أحمد التكينة"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                        />
                      </div>

                      {/* نوع الحساب Segmented Button */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">نوع الحساب الأساسي:</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100/5 p-1 rounded-xl border border-slate-805">
                          <button
                            type="button"
                            onClick={() => setRegUserRole("student")}
                            className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                              regUserRole === "student"
                                ? "bg-indigo-650 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-slate-205"
                            }`}
                          >
                            🎓 طالب علم
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegUserRole("teacher")}
                            className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                              regUserRole === "teacher"
                                ? "bg-amber-650 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-slate-205"
                            }`}
                          >
                            👨‍🏫 أستاذ / معلم
                          </button>
                        </div>
                      </div>

                      {/* Conditional Display: Student Class Dropdown */}
                      {regUserRole === "student" && (
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] text-slate-400 font-bold block">الصف والمرحلة الدراسية الخاصة بك:</label>
                          <select
                            value={regGradeId}
                            onChange={(e) => setRegGradeId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-600"
                          >
                            <option value="">-- اختر صفّك الدراسي --</option>
                            {curriculumData.flatMap(stage => 
                              stage.grades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                  {stage.name} - {grade.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      {/* Conditional Display: Teacher specialties list of checkable badges */}
                      {regUserRole === "teacher" && (
                        <>
                          <div className="space-y-2 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              المواد المتخصص بتدريسها لمناهج السودان (تحديد متعدد):
                            </label>
                            <div className="max-h-28 overflow-y-auto border border-slate-850 bg-slate-950 p-2.5 rounded-xl text-right">
                              {Array.from(new Set(
                                curriculumData.flatMap(stage => 
                                  stage.grades.flatMap(grade => 
                                    grade.subjects.map(subj => subj.name)
                                  )
                                )
                              )).map((subjectName) => {
                                const isSelected = selectedSpecialties.includes(subjectName);
                                return (
                                  <button
                                    type="button"
                                    key={subjectName}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSpecialties(prev => prev.filter(x => x !== subjectName));
                                      } else {
                                        setSelectedSpecialties(prev => [...prev, subjectName]);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 ml-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-600/20 text-amber-400 border-amber-600 font-extrabold"
                                        : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                    <span>{subjectName}</span>
                                    {isSelected && <span>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">جوال المعلم أو وسيلة تواصل سريعة (إيميل/رقم):</label>
                            <input
                              type="text"
                              required
                              value={regContactMethod}
                              onChange={(e) => setRegContactMethod(e.target.value)}
                              placeholder="مثال: 0123456789 أو whatsapp"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-amber-600 transition-all font-sans text-right"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {userModalTab === "login" && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-100/5 p-1 rounded-xl border border-slate-800/60 mb-4">
                      <button
                        type="button"
                        onClick={() => setLoginRole("student")}
                        className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          loginRole === "student"
                            ? "bg-indigo-650 text-white shadow-sm font-black"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        🎓 دخول الطلاب
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRole("admin")}
                        className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          loginRole === "admin"
                            ? "bg-indigo-650 text-white shadow-sm font-black"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        🔑 دخول الإدارة والأساتذة
                      </button>
                    </div>
                  )}


                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      {userModalTab === "profile" ? "البريد الإلكتروني (غير قابل للتعديل):" : "البريد الإلكتروني:"}
                    </label>
                    <input
                      type="email"
                      required
                      disabled={userModalTab === "profile"}
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder={loginRole === "admin" && userModalTab === "login" ? "admin@sudan.edu" : "student@example.com"}
                      className={`w-full border border-slate-800 rounded-xl p-3 text-xs outline-none transition-all font-sans text-left ${userModalTab === "profile" ? "bg-slate-950/60 text-slate-400 pointer-events-none" : "bg-slate-950 text-slate-100 focus:border-indigo-600"}`}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      {userModalTab === "profile" ? "تعديل كلمة المرور السرية (اتركها فارغة للإبقاء على الحالية):" : "كلمة المرور السرية:"}
                    </label>
                    <input
                      type="password"
                      required={userModalTab !== "profile"}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={userModalTab === "profile" ? "•••••••• (تغيير كلمة المرور)" : "••••••••"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                    />
                  </div>

                  {userAuthError && (
                    <div className="text-[10px] text-rose-400 font-bold text-right leading-relaxed bg-rose-955/20 border border-rose-900/30 p-3 rounded-xl whitespace-pre-line" dir="rtl">
                      {userAuthError}
                    </div>
                  )}

                  {userAuthSuccess && (
                    <div className="text-[10px] text-emerald-450 font-bold text-center leading-relaxed bg-emerald-955/20 border border-emerald-900/30 p-2.5 rounded-xl">
                      {userAuthSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-3 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {isAuthLoading ? "جاري التحقق والمزامنة..." : userModalTab === "profile" ? "حفظ وتعديل البيانات الشخصية 💾" : userModalTab === "login" ? "تسجيل المزامنة والدخول 🚀" : "إتمام إنشاء الحساب وحفظه فورياً ✨"}
                  </button>
                </form>
              </div>

              {/* Informative Footer */}
              <div className="bg-slate-955/80 px-6 py-4 border-t border-slate-800/45 text-center">
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  {userModalTab === "profile" ? "يتم حفظ التعديلات سحابياً فوراً بالربط السحابي مع Supabase لتأمين وتحديث الحساب الدراسي." : "بمجرد التسجيل، سيتم ربط حسابك بـ Supabase لمتابعة دراسة المناهج وحفظ الدروس المكتملة في المخدم سحابياً مجاناً ومباشرة."}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky footer info */}
      <footer className="mt-20 border-t border-slate-800/80 pt-10 text-center max-w-7xl mx-auto px-6">
        {/* Simple email contact info requested by the user */}
        <div className="max-w-md mx-auto mb-10 p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-center backdrop-blur shadow-lg">
          <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
            📬 للتواصل والاستفسارات والاقتراحات يرجى مراسلتنا مباشرة عبر البريد الإلكتروني:
          </p>
          <a 
            href="mailto:almangoryo@gmail.com" 
            className="text-emerald-450 font-mono font-bold text-sm tracking-wide hover:text-emerald-350 select-all transition-all hover:underline"
          >
            almangoryo@gmail.com
          </a>
        </div>

        <div className="space-y-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">🇸🇩 منصة المناهج السودانية التفاعلية لعام 2026</p>
          <p className="max-w-xl mx-auto text-2xs text-slate-500 leading-relaxed">
            تم تطوير هذا المنصة بواسطة عثمان المنقوري لمساعدة المنظومة التعليمية وطلاب السودان الأحباء لتسهيل التعلم .
          </p>
        </div>
      </footer>

      {/* Save Status Floating Toast */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 md:left-auto md:right-6 z-[9999] bg-slate-950 border border-emerald-500/60 text-emerald-400 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-2xl"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-205">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
