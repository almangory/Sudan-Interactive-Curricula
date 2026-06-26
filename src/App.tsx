import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Award, Compass, BookOpen, Clock, Heart, 
  Map, Sparkles, Star, ChevronLeft, ChevronDown, ChevronUp, CheckCircle, 
  Search, ShieldAlert, History, Globe, Plus, FileText, Video, Filter,
  Lock, Network, MessageSquare, X, Bell, MessagesSquare, UserCheck, Check, Link, ArrowLeftRight,
  User, LogOut, Settings, Wifi, WifiOff, RotateCw, UserPlus, LogIn, Image, Pencil
} from "lucide-react";
import { stagesData, Stage, Grade, Subject } from "./data/curriculum";
import SubjectModal from "./components/SubjectModal";
import AddSubjectModal from "./components/AddSubjectModal";
import DynamicIcon from "./components/DynamicIcon";
import StudyCamp from "./components/StudyCamp";
import AdminDashboard from "./components/AdminDashboard";
import EducationalMindMap from "./components/EducationalMindMap";
import StudentChatRoom from "./components/StudentChatRoom";
import WebsiteLogo from "./components/WebsiteLogo";
import { fetchCurriculumFromSupabase, verifyAdminInSupabase, saveCurriculumToSupabase, getSupabaseConfig, saveSupabaseConfig, AppUser, registerUser, loginUser, signInWithGoogle, checkAndSyncGoogleSession, getSupabaseClient, updateCurrentUserProfile, fetchLiveLessonsFromSupabase, LiveLesson, checkUserExistsAndActive } from "./lib/supabase";
import { stageAndGradeTranslations, uiTranslations } from "./lib/translations";

function getGoogleDriveFileId(url: string): string {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const dMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      return dMatch[1];
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
  }
  return "";
}

function convertGoogleDriveUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://docs.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
}

function getGoogleDriveEmbedUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

function convertGoogleDriveVideoUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

export default function App() {
  const [siteTheme, setSiteTheme] = useState<"sudanese" | "legacy">(() => {
    return (localStorage.getItem("sudan_site_theme") as "sudanese" | "legacy") || "sudanese";
  });

  const toggleSiteTheme = () => {
    const nextTheme = siteTheme === "sudanese" ? "legacy" : "sudanese";
    setSiteTheme(nextTheme);
    localStorage.setItem("sudan_site_theme", nextTheme);
  };

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
  const [recentSubjects, setRecentSubjects] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("sudan_edu_recent_subjects");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [addSubjectState, setAddSubjectState] = useState<{
    stageId: string;
    gradeId: string;
    gradeName: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showTopSearch, setShowTopSearch] = useState(false);
  const [publicLibraryUrl, setPublicLibraryUrl] = useState(() => {
    return localStorage.getItem("sudan_public_library_url") || "https://sd-books-library.vercel.app/";
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showStudyCamp, setShowStudyCamp] = useState(false);
  const [showEducationalMindMap, setShowEducationalMindMap] = useState(false);
  const [showStudentChat, setShowStudentChat] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "books" | "videos" | "interactive">("all");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([]);

  const handleLibraryClick = () => {
    if (publicLibraryUrl) {
      window.open(publicLibraryUrl, "_blank");
    } else {
      if (isAdminLoggedIn) {
        const newUrl = prompt(
          currentLang === "ar" 
            ? "أدخل رابط موقع المكتبة العامة الجديد لحفظه:" 
            : "Enter new Public Library URL to save:", 
          "https://sd-books-library.vercel.app/"
        );
        if (newUrl !== null) {
          setPublicLibraryUrl(newUrl);
          localStorage.setItem("sudan_public_library_url", newUrl);
          setSaveStatus(
            currentLang === "ar" 
              ? "🎉 تم حفظ رابط المكتبة العامة بنجاح!" 
              : "🎉 Public Library link saved successfully!"
          );
          setTimeout(() => setSaveStatus(null), 4000);
        }
      } else {
        alert(
          currentLang === "ar"
            ? "📚 المكتبة العامة الرقمية:\nسيتم إضافة رابط موقع المكتبة العامة قريباً من قبل إدارة المنصة! ترقبوا كتباً تفاعلية ومصادر خارجية قيمة. ✨"
            : "📚 Digital Public Library:\nThe direct link will be added soon by the platform administration! Stay tuned for valuable interactive books & external resources. ✨"
        );
      }
    }
  };

  // 📢 Breaking News & Live Broadcasting Settings
  const [breakingNews, setBreakingNews] = useState(() => {
    try {
      const stored = localStorage.getItem("sudan_edu_breaking_news_setting_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.bgColor === "bg-[#D21034]/95" || parsed.bgColor === "bg-[#D21034]" || parsed.bgColor === "bg-red-950/90" || parsed.bgColor === "bg-slate-100") {
          parsed.bgColor = "bg-slate-900";
          parsed.textColor = "text-slate-100";
          localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(parsed));
        }
        return parsed;
      }
      return {
        enabled: true,
        textAr: "🔴 عاجل: تم تفعيل منصة التعليم لمساندة الطلاب السودانيين للعام الجديد - تصفح المقررات والملخصات والدروس المرئية الآن مجاناً 🇸🇩",
        textEn: "🔴 Breaking: Education platform enabled to support Sudanese students - browse courses, summaries, and video lessons now for free! 🇸🇩",
        speed: "normal",
        bgColor: "bg-slate-900",
        textColor: "text-slate-100",
        direction: "rtl"
      };
    } catch {
      return {
        enabled: true,
        textAr: "🔴 عاجل: تم تفعيل منصة التعليم لمساندة الطلاب السودانيين للعام الجديد - تصفح المقررات والملخصات والدروس المرئية الآن مجاناً 🇸🇩",
        textEn: "🔴 Breaking: Education platform enabled to support Sudanese students - browse courses, summaries, and video lessons now for free! 🇸🇩",
        speed: "normal",
        bgColor: "bg-slate-900",
        textColor: "text-slate-100",
        direction: "rtl"
      };
    }
  });

  const [isTickerDismissed, setIsTickerDismissed] = useState(() => {
    return sessionStorage.getItem("sudan_edu_ticker_dismissed") === "true";
  });

  const [tickerDirection, setTickerDirection] = useState<"rtl" | "ltr">(() => {
    return (localStorage.getItem("sudan_edu_ticker_direction") as "rtl" | "ltr") || "rtl";
  });

  // 🔔 Notification States & Realtime counters
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationDropdownRef.current && 
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationsDropdown(false);
      }
    }
    if (showNotificationsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationsDropdown]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [recentChatMessages, setRecentChatMessages] = useState<any[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [lastCheckedChat, setLastCheckedChat] = useState<string>(() => localStorage.getItem("sudan_chat_last_read") || new Date(0).toISOString());
  const [lastCheckedUpdates, setLastCheckedUpdates] = useState<string>(() => localStorage.getItem("sudan_updates_last_read") || new Date(0).toISOString());
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showPushPrompt, setShowPushPrompt] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return false;
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasPermission = Notification.permission;
    const dismissed = localStorage.getItem("sudan_push_dismissed") === "true";
    return isMobileOrTablet && hasPermission === "default" && !dismissed;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [currentLang, setCurrentLang] = useState<"ar" | "en">(() => {
    return (localStorage.getItem("sudan_edu_lang") as "ar" | "en") || "ar";
  });

  const t = (key: string): string => {
    if (uiTranslations[currentLang] && (uiTranslations[currentLang] as any)[key]) {
      return (uiTranslations[currentLang] as any)[key];
    }
    if (currentLang === "en" && stageAndGradeTranslations[key]) {
      return stageAndGradeTranslations[key];
    }
    return key;
  };



  const refreshLiveLessonsList = async () => {
    try {
      const cloudLessons = await fetchLiveLessonsFromSupabase();
      setLiveLessons(cloudLessons);
    } catch (err) {
      console.error("Failed to refresh live lessons:", err);
    }
  };

  // Global ripple click effect initializer for superb touch and click response
  useEffect(() => {
    const handleGlobalRipple = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find closest button, link, role="button", or elements categorized as card/trigger/pointer
      const trigger = target.closest('button, a, [role="button"], .cursor-pointer, .group, .ripple-trigger') as HTMLElement | null;

      if (!trigger) return;

      // Avoid triggering on standard editable fields to preserve focus flow
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Ensure the clickable element is styled with relative position so ripple is masked
      const computedStyle = window.getComputedStyle(trigger);
      if (computedStyle.position === "static") {
        trigger.style.position = "relative";
      }

      const prevOverflow = trigger.style.overflow;
      trigger.style.overflow = "hidden";

      // Calculate absolute click offsets relative to the parent bounding coordinates
      const rect = trigger.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Select maximum bounding radius to cover the diagonal corners smoothly
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple-circle";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Smart color selector: use dark ripple on light backgrounds, light ripple on dark backgrounds
      const isLightBg = trigger.classList.contains("bg-white") || 
                        trigger.classList.contains("bg-yellow-400") || 
                        trigger.classList.contains("bg-yellow-350") || 
                        trigger.classList.contains("bg-pink-400") || 
                        trigger.classList.contains("bg-emerald-400") ||
                        trigger.classList.contains("bg-emerald-300") ||
                        trigger.classList.contains("bg-slate-100");

      ripple.style.backgroundColor = isLightBg 
        ? "rgba(0, 0, 0, 0.16)" 
        : "rgba(255, 255, 255, 0.28)";

      trigger.appendChild(ripple);

      // Clean up DOM node once animation ends
      ripple.addEventListener("animationend", () => {
        ripple.remove();
        if (prevOverflow) {
          trigger.style.overflow = prevOverflow;
        }
      });
    };

    document.addEventListener("mousedown", handleGlobalRipple);
    return () => {
      document.removeEventListener("mousedown", handleGlobalRipple);
    };
  }, []);

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

        // Fetch live lessons
        try {
          const cloudLessons = await fetchLiveLessonsFromSupabase();
          setLiveLessons(cloudLessons);
        } catch (err) {
          console.error("Failed to load initial live lessons from Supabase:", err);
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

  // 🖼️ Custom Banner Image/Video settings (defined directly in the code for developers)
  // To change the banner media, edit the initial state values directly in the code here:
  const [bannerImageUrl, setBannerImageUrl] = useState<string>("");
  const [bannerMediaType, setBannerMediaType] = useState<"image" | "video">("https://drive.google.com/file/d/1GbK99NfvbfVHIvRlv7F0XWfOIgVTIx0X/view?usp=sharing");
  
  // Dummy handlers to disable the UI-based banner editor modal
  const showBannerEditModal = false;
  const tempBannerUrl = "" as string;
  const tempBannerMediaType = "image" as "image" | "video";
  const setTempBannerUrl = (val: string) => {};
  const setTempBannerMediaType = (val: "image" | "video") => {};
  const setShowBannerEditModal = (val: boolean) => {};

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

  // 🎈 Kid-Friendly Mode States (المرحلة الابتدائية وبراعم الأطفال)
  const [kidModeOverride, setKidModeOverride] = useState<boolean | null>(null);
  const [mascotMessage, setMascotMessage] = useState<string>("مرحباً بك يا بطل المناهج! أنا صديقك سمسم الفُضولي الذكي، اضغط عليّ لتسمع أهم مغامرة في السودان اليوم! 🦊🌟");
  const [mascotAnimState, setMascotAnimState] = useState<"idle" | "celebrate" | "speak">("idle");

  const isKidModeActive = React.useMemo(() => {
    if (kidModeOverride !== null) return kidModeOverride;
    // Auto-detect based on profile (grade ID starting with "pri-" or "kg-")
    const isKidProfile = currentUser?.user_role === "student" && (
      currentUser?.grade_id?.startsWith("pri-") || 
      currentUser?.grade_id?.startsWith("kg-")
    );
    // Or if currently active/selected stage is primary (elementary) or kindergarten
    const isKidStage = selectedStage?.id === "primary" || selectedStage?.id === "kindergarten";
    return !!(isKidProfile || isKidStage);
  }, [kidModeOverride, currentUser, selectedStage]);

  // 🔐 Verify if current user account is registered and not deleted/inactive in Supabase
  useEffect(() => {
    const verifyUserExistence = async () => {
      if (currentUser) {
        try {
          const { exists, active } = await checkUserExistsAndActive(currentUser.id);
          if (!exists || !active) {
            // Log out
            setCurrentUser(null);
            localStorage.removeItem("sudan_auth_user");
            setUserAuthError("⚠️ لا يوجد حساب نشط حالياً، نأمل التسجيل بالموقع.");
            setUserModalTab("register");
            setShowUserModal(true);
            alert("⚠️ لا يوجد حساب نشط حالياً، نأمل التسجيل بالموقع.");
          }
        } catch (e) {
          console.error("Error verifying user session:", e);
        }
      }
    };
    verifyUserExistence();
  }, [currentUser]);

  // 🔔 Push Notification permission request on mobile devices
  useEffect(() => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileDevice && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Mobile notification permission request result:", permission);
        }).catch((err) => {
          console.warn("Notification request failed:", err);
        });
      }
    }
  }, []);

  // Gentle happy sound synth specifically safe for modern browsers
  const playKidChime = (type: 'success' | 'click' | 'magic' = 'click') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        const playNote = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + start + 0.12);
          gain.gain.setValueAtTime(0.04, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.2);
        };
        playNote(523.25, 0); // C5
        playNote(659.25, 0.06); // E5
        playNote(783.99, 0.12); // G5
      } else {
        const playNote = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.03, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.3);
        };
        playNote(880, 0);       // A5
        playNote(1046.50, 0.08); // C6
        playNote(1318.51, 0.16); // E6
      }
    } catch (e) {
      console.warn("Audio feedback suspended or unsupported by platform sandbox.", e);
    }
  };

  const [showUserModal, setShowUserModal] = useState(() => {
    return !localStorage.getItem("sudan_auth_user");
  });
  const [userModalTab, setUserModalTab] = useState<"login" | "register" | "profile">("login");
  const [loginRole, setLoginRole] = useState<"student" | "admin">("student");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userAuthError, setUserAuthError] = useState("");
  const [userAuthSuccess, setUserAuthSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 🔔 HELPER LOG RETRIEVAL & CREATION ENGINE FOR NOTIFICATIONS
  const logSiteUpdate = async (category: string, titleAr: string, titleEn: string, bodyAr: string, bodyEn: string) => {
    const updateId = `UPD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newUpdate = {
      id: updateId,
      title_ar: titleAr,
      title_en: titleEn,
      body_ar: bodyAr,
      body_en: bodyEn,
      category: category,
      created_at: new Date().toISOString()
    };

    // Update local state and local storage immediately so it reflects in the UI instantly
    setSiteUpdates(prev => {
      const filtered = prev.filter(x => x.id !== updateId);
      const updated = [newUpdate, ...filtered].slice(0, 30);
      try {
        localStorage.setItem("sudan_edu_local_updates_v1", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save site updates to local storage:", err);
      }
      return updated;
    });

    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from("site_updates").insert([newUpdate]);
    } catch (err) {
      console.warn("Could not log site update automatically to Supabase:", err);
    }
  };

  const handleUpdateBreakingNews = async (updated: {
    enabled: boolean;
    textAr: string;
    textEn: string;
    speed: string;
    bgColor: string;
    textColor: string;
    direction?: "rtl" | "ltr";
  }) => {
    // 1. Update state immediately
    setBreakingNews(updated);
    if (updated.direction) {
      setTickerDirection(updated.direction);
      localStorage.setItem("sudan_edu_ticker_direction", updated.direction);
    }
    localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(updated));
    // Reset dismissed state since it's a freshly updated announcement!
    setIsTickerDismissed(false);
    sessionStorage.removeItem("sudan_edu_ticker_dismissed");

    // 2. Broadcast via existing site_updates table
    const configPayload = {
      enabled: updated.enabled,
      speed: updated.speed,
      bgColor: updated.bgColor,
      textColor: updated.textColor,
      direction: updated.direction || "rtl"
    };

    try {
      await logSiteUpdate(
        "breaking_news",
        updated.textAr,
        updated.textEn,
        JSON.stringify(configPayload),
        "broadcast_config"
      );
    } catch (err) {
      console.warn("Could not broadcast news configuration:", err);
    }
  };

  const fetchNotificationData = async () => {
    // 1. Fetch site updates (load local storage first)
    let updates = [];
    try {
      const stored = localStorage.getItem("sudan_edu_local_updates_v1");
      updates = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn(e);
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("site_updates")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && data) {
          updates = data;
          try {
            localStorage.setItem("sudan_edu_local_updates_v1", JSON.stringify(data));
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.warn("Could not fetch cloud site updates, using local cache:", err);
      }
    }
    setSiteUpdates(updates);

    if (!currentUser) {
      setPendingFriendRequests([]);
      return;
    }

    // 2. Fetch pending incoming friend requests
    let frData = [];
    try {
      const storedFr = localStorage.getItem("sudan_edu_local_friendships");
      frData = storedFr ? JSON.parse(storedFr) : [];
    } catch (e) {
      console.warn(e);
    }

    // Always capture pending incoming ones locally
    let pendingFr = frData.filter((f: any) => 
      String(f.receiver_id) === String(currentUser.id) && f.status === "pending"
    );

    if (client) {
      try {
        const { data, error } = await client
          .from("friendships")
          .select("*")
          .eq("receiver_id", String(currentUser.id))
          .eq("status", "pending");

        if (!error && data) {
          frData = data;
          pendingFr = data;
          try {
            localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(data));
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.warn("Could not fetch cloud friendships, using local storage:", err);
      }
    }

    // Translate senderName from users if online, otherwise fallback
    if (client && pendingFr.length > 0) {
      try {
        const senderIds = pendingFr.map((f: any) => parseInt(String(f.sender_id), 10)).filter(id => !isNaN(id));
        if (senderIds.length > 0) {
          const { data: usersData } = await client
            .from("users")
            .select("id, username")
            .in("id", senderIds);
          
          const userMap = new Map(usersData?.map((u: any) => [String(u.id), u.username]) || []);
          const requestsWithSender = pendingFr.map((f: any) => ({
            ...f,
            senderName: f.senderName || userMap.get(String(f.sender_id)) || (currentLang === "ar" ? "طالب آخر" : "Another Peer")
          }));
          setPendingFriendRequests(requestsWithSender);
        } else {
          setPendingFriendRequests([]);
        }
      } catch (err) {
        console.warn("Error parsing sender names, falling back:", err);
        const requestsWithSenderFallback = pendingFr.map((f: any) => ({
          ...f,
          senderName: f.senderName || (currentLang === "ar" ? "زميل دراسة" : "Study Peer")
        }));
        setPendingFriendRequests(requestsWithSenderFallback);
      }
    } else {
      const requestsWithSenderFallback = pendingFr.map((f: any) => ({
        ...f,
        senderName: f.senderName || (currentLang === "ar" ? "زميل دراسة" : "Study Peer")
      }));
      setPendingFriendRequests(requestsWithSenderFallback);
    }

    // 3. Fetch recent chat messages for parsing unread notifications
    if (client) {
      try {
        const { data: msgs, error: msgsError } = await client
          .from("chat_messages")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(30);

        if (!msgsError && msgs) {
          setRecentChatMessages(msgs);
        }
      } catch (err) {
        console.warn("Could not fetch recent chat messages for notifications:", err);
      }
    }
  };

  // Realtime subscription and high-reliability polling fallback
  useEffect(() => {
    fetchNotificationData();

    // 1. Hook instant local custom event listener
    const handleLocalNotificationUpdate = () => {
      fetchNotificationData();
    };
    window.addEventListener("sudan_edu_notification_update", handleLocalNotificationUpdate);

    // 2. High-reliability polling fallback
    const timer = setInterval(() => {
      fetchNotificationData();
    }, 12500);

    // 3. Realtime Supabase channel (if configured)
    const client = getSupabaseClient();
    let channel: any = null;
    
    if (client) {
      channel = client
        .channel("global-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friendships" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_updates" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "curricula_links" },
          async () => {
            console.log("⚡ Realtime Update: Curriculum links updated on Supabase, refreshing data...");
            try {
              const freshData = await fetchCurriculumFromSupabase();
              if (freshData && Array.isArray(freshData) && freshData.length > 0) {
                setCurriculumData(freshData);
                localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(freshData));
              }
            } catch (err) {
              console.warn("Realtime curriculum refresh failed:", err);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "live_lessons" },
          async () => {
            console.log("⚡ Realtime Update: Live lessons updated on Supabase, refreshing data...");
            try {
              const freshLessons = await fetchLiveLessonsFromSupabase();
              setLiveLessons(freshLessons);
            } catch (err) {
              console.warn("Realtime live lessons refresh failed:", err);
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener("sudan_edu_notification_update", handleLocalNotificationUpdate);
      clearInterval(timer);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [currentUser]);

  // Synchronize breaking news whenever site updates load or refresh from either storage or database
  useEffect(() => {
    const breakingUpdate = siteUpdates.find(upd => upd.category === "breaking_news");
    if (breakingUpdate) {
      try {
        let config: any = {};
        if (breakingUpdate.body_ar) {
          try {
            config = JSON.parse(breakingUpdate.body_ar);
          } catch {
            // fallback
          }
        }
        const updated = {
          enabled: config.enabled !== undefined ? config.enabled : true,
          textAr: breakingUpdate.title_ar || "",
          textEn: breakingUpdate.title_en || "",
          speed: config.speed || "normal",
          bgColor: config.bgColor || "bg-slate-900",
          textColor: config.textColor || "text-slate-100",
          direction: config.direction || "rtl"
        };
        setBreakingNews(updated);
        if (config.direction) {
          setTickerDirection(config.direction);
          localStorage.setItem("sudan_edu_ticker_direction", config.direction);
        }
        localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not parse sync breaking news:", e);
      }
    }
  }, [siteUpdates]);

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

  // Guard function: Don't allow opening materials/subjects if not logged in or if logged in as a guest
  const handleOpenSubject = (subject: any) => {
    if ((!currentUser || currentUser.user_role === "guest") && !isAdminLoggedIn) {
      setUserAuthError("⚠️ تصفح المواد الدراسية وفتح الدروس متاح للأعضاء المسجلين فقط. يرجى تسجيل الدخول أو إنشاء حساب جديد مجاناً للمتابعة!");
      setShowUserModal(true);
      setUserModalTab("login");
      return;
    }
    setActiveSubject(subject);
    setRecentSubjects(prev => {
      const filtered = prev.filter(s => s.id !== subject.id);
      const updated = [subject, ...filtered].slice(0, 3);
      try {
        localStorage.setItem("sudan_edu_recent_subjects", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save recent subjects to localStorage", err);
      }
      return updated;
    });
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
          // Save registration grade selection timestamp for student
          localStorage.setItem("sudan_grade_updated_at_" + res.user.id, String(Date.now()));
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
    } {
      setIsAuthLoading(false);
    }
  };

  const handleEnterAsGuest = () => {
    const guestUser: AppUser = {
      id: "guest_" + Math.random().toString(36).substr(2, 6),
      username: currentLang === "ar" ? "زائر المنصة 👤" : "Guest User 👤",
      email: "guest@sudan-edu.com",
      provider: "guest",
      user_role: "guest",
      created_at: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    localStorage.setItem("sudan_auth_user", JSON.stringify(guestUser));
    setShowUserModal(false);
    setSaveStatus(currentLang === "ar" ? "مرحباً بك كزائر للمنصة! يمكنك التصفح بحرية كاملة 🚪✨" : "Welcome as a guest! You can now browse freely 🚪✨");
    setTimeout(() => setSaveStatus(null), 5000);
  };

  const handleRequestPushPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSaveStatus("🔔 تم تفعيل إشعارات الجوال بنجاح! ستصلك التنبيهات مباشرة.");
        new Notification("المناهج السودانية 🇸🇩", {
          body: "شكراً لتفعيل الإشعارات! ستصلك تحديثات المناهج هنا فوراً.",
        });
      } else {
        setSaveStatus("⚠️ لم يتم تفعيل الإشعارات. يمكنك تفعيلها من إعدادات المتصفح.");
      }
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err) {
      console.warn("Could not request notification permission:", err);
    }
    setShowPushPrompt(false);
    localStorage.setItem("sudan_push_dismissed", "true");
  };

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false);
    localStorage.setItem("sudan_push_dismissed", "true");
  };

  // 📱 Mobile screen hardware / virtual back button management
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If user went back, let's close open sections one by one
      if (activeSubject) {
        setActiveSubject(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (addSubjectState) {
        setAddSubjectState(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showStudentChat) {
        setShowStudentChat(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showStudyCamp) {
        setShowStudyCamp(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showEducationalMindMap) {
        setShowEducationalMindMap(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showAdminDashboard) {
        setShowAdminDashboard(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (activeGrade) {
        setActiveGrade(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (selectedStage) {
        setSelectedStage(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

  // Push state to history whenever any view changes to enable the back button
  useEffect(() => {
    const hasActiveSubView = 
      !!activeSubject || 
      !!addSubjectState || 
      showStudentChat || 
      showStudyCamp || 
      showEducationalMindMap || 
      showAdminDashboard || 
      !!activeGrade || 
      !!selectedStage;

    if (hasActiveSubView) {
      if (window.history.state?.app !== "subview") {
        window.history.pushState({ app: "subview" }, "");
      }
    }
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

  // Exit prompt confirmation to avoid accidental close on exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActiveSubView = 
        !!activeSubject || 
        !!addSubjectState || 
        showStudentChat || 
        showStudyCamp || 
        showEducationalMindMap || 
        showAdminDashboard || 
        !!activeGrade || 
        !!selectedStage;
      
      if (!hasActiveSubView) {
        e.preventDefault();
        e.returnValue = "هل أنت متأكد من مغادرة التطبيق؟";
        return "هل أنت متأكد من مغادرة التطبيق؟";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

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

  const handleMascotClick = () => {
    const messages = [
      currentLang === "ar"
        ? "يا بطل المناهج! أنا فخور جداً بوجودك هنا لتتعلم اليوم وتفهم المنهج السوداني الرائع! 🦊✨"
        : "Yay champ! I'm so proud of you for being here to learn and understand the wonderful Sudanese curriculum! 🦊✨",
      currentLang === "ar"
        ? "هل علمت؟ التعليم هو سلاحك لتبني وطناً جميلاً وتصبح مخترعاً أو مهندساً عظيماً! 🇸🇩❤️"
        : "Did you know? Education is your tool to build our beautiful homeland and become a great scientist or architect! 🇸🇩❤️",
      currentLang === "ar"
        ? "أنت ذكي ومميز جداً! واصل حل التدريب واكسب نجوم التلميذ المتميز اليوم وشاركها مع أهلك! ⭐🏆"
        : "You are super smart and special! Continue completing lessons and win today's brilliant pupil stars! ⭐🏆",
      currentLang === "ar"
        ? "أهلاً بك في سفينة العلوم والرياضيات واللغة العربية.. لننطلق للفضاء سوياً ونكتشف الكواكب! 🚀👽"
        : "Welcome to the ship of science, math, and Arabic... let's launch into space together and explore planets! 🚀👽",
      currentLang === "ar"
        ? "منصة السودان تسعد برؤية ضحكتك ومذاكرتك اليومية! مذاكرة ممتعة وسهلة جداً! 😊🍭"
        : "Sudan platform loves to see your smile and daily study logs! Have a fun and easy study session! 😊🍭"
    ];
    
    let nextMsg = messages[Math.floor(Math.random() * messages.length)];
    while (nextMsg === mascotMessage) {
      nextMsg = messages[Math.floor(Math.random() * messages.length)];
    }
    
    setMascotMessage(nextMsg);
    setMascotAnimState("celebrate");
    playKidChime("magic");
    setTimeout(() => {
      setMascotAnimState("idle");
    }, 850);
  };

  const handleUserProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    type ProfileUpdateFields = {
      username: string;
      password?: string;
      grade_id?: string;
      grade_name?: string;
      specialties?: string;
      contact_method?: string;
    };

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

        // Enforce 15 days check
        if (resolvedGradeId && resolvedGradeId !== currentUser.grade_id) {
          let lastUpdatedTime = 0;
          const localLastUpdated = localStorage.getItem("sudan_grade_updated_at_" + currentUser.id);
          if (localLastUpdated) {
            lastUpdatedTime = parseInt(localLastUpdated, 10);
          } else if (currentUser.createdAt) {
            lastUpdatedTime = new Date(currentUser.createdAt).getTime();
          }

          if (lastUpdatedTime > 0) {
            const diffTime = Date.now() - lastUpdatedTime;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays < 15) {
              const remainingDays = Math.ceil(15 - diffDays);
              const alertMsg = currentLang === "ar"
                ? `⚠️ عذراً، بصفتك طالباً، لا يمكنك تعديل المرحلة الدراسية الرسمية إلا بعد مرور 15 يوماً من تحديدها عند التسجيل أو آخر تعديل (متبقي ${remainingDays} يوم على إمكانية التعديل).`
                : `⚠️ Sorry, as a student you cannot modify your official educational grade until 15 days have passed since registration or last change (${remainingDays} days remaining).`;
              setUserAuthError(alertMsg);
              setIsAuthLoading(false);
              return;
            }
          }
        }
      }

      let resolvedSpecialties = undefined;
      let resolvedContactMethod = undefined;
      if (currentUser.user_role === "teacher") {
        resolvedSpecialties = selectedSpecialties.join(", ");
        resolvedContactMethod = regContactMethod.trim();
      }

      const updatePayload: ProfileUpdateFields = {
        username: userUsername,
        password: userPassword || undefined,
        grade_id: resolvedGradeId,
        grade_name: resolvedGradeName,
        specialties: resolvedSpecialties,
        contact_method: resolvedContactMethod
      };

      const res = await updateCurrentUserProfile(currentUser.id, updatePayload);

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

        // If student successfully changed their grade, record it!
        if (currentUser.user_role === "student" && resolvedGradeId !== currentUser.grade_id) {
          localStorage.setItem("sudan_grade_updated_at_" + currentUser.id, String(Date.now()));
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
            "👑 نصيحة: يمكنك استخدام خيار 'إنشاء حساب جديد' بالبريد الإلكتروني وكلمة المرور بالأعلى مباشرة، فهو جاهز ومفعّل لحفظ بياناتك فورياً في جدول الـ users سحابياً دون أي إعداد إضافي!"
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

  const resetCurriculumToDefault = async () => {
    if (window.confirm("هل أنت متأكد من رغبتك في استعادة المنهج الدراسي الافتراضي الأصلي وحذف كل التعديلات المحلية الحالية؟")) {
      localStorage.removeItem("sudan_custom_curriculum_v3");
      setCurriculumData(stagesData);
      setSaveStatus("🔄 جاري استعادة المنهج الدراسي الافتراضي وتحديث السحابة...");
      try {
        await saveCurriculumToCloudAutomatically(stagesData);
        setSaveStatus("✅ تمت استعادة المنهج الدراسي بنجاح ومزامنته سحابياً! 🔄");
      } catch (err) {
        console.error("Failed to sync default curriculum reset to Supabase:", err);
        setSaveStatus("🔄 تم الحفظ محلياً وفشلت المزامنة التلقائية مع سوبابيس");
      }
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Clean up any stale client-side curriculum caches to ensure the app loads the fresh server compiled code
  useEffect(() => {
    localStorage.removeItem("sudan_custom_curriculum_v2");
    localStorage.removeItem("sudan_custom_curriculum"); // Purge very old version if any
  }, []);

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
        setShowEducationalMindMap(false);
        setShowStudentChat(false);
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

  // 📱 Automatic scroll to newly opened sections/subjects for enhanced mobile usability
  useEffect(() => {
    if (selectedStage) {
      setTimeout(() => {
        const el = document.getElementById("selected-stage-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [selectedStage]);

  useEffect(() => {
    if (activeGrade) {
      setTimeout(() => {
        const el = document.getElementById(`grade-card-${activeGrade.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [activeGrade]);

  useEffect(() => {
    if (showOnlyFavorites) {
      setTimeout(() => {
        const el = document.getElementById("favorites-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showOnlyFavorites]);

  useEffect(() => {
    if (showStudyCamp) {
      setTimeout(() => {
        const el = document.getElementById("study-camp-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showStudyCamp]);

  useEffect(() => {
    if (showEducationalMindMap) {
      setTimeout(() => {
        const el = document.getElementById("mind-map-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showEducationalMindMap]);

  useEffect(() => {
    if (showAdminDashboard) {
      setTimeout(() => {
        const el = document.getElementById("admin-dashboard-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showAdminDashboard]);

  // تم الاستغناء بالكامل عن الطريقة القديمة لحفظ الملفات محلياً على السيرفر (والتي كانت تفشل على فيرسل Vercel)
  // لصالح مزامنة سحابية ديناميكية وتلقائية بالكامل بنسبة 100% تعتمد على سوبابيس (Supabase Realtime Database)


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
        const errorDetail = result.errors && result.errors.length > 0 ? result.errors.join(" | ") : "خطأ مجهول بالـ RLS أو الصلاحيات";
        setSaveStatus(`⚠️ فشلت المزامنة التلقائية مع سوبابيس: ${errorDetail}`);
        setTimeout(() => setSaveStatus(null), 10000);
      }
    } catch (err: any) {
      console.error("Background cloud sync error:", err);
      setSaveStatus(`⚠️ خطأ في المزامنة التلقائية: ${err.message || err}`);
      setTimeout(() => setSaveStatus(null), 8000);
    }
  };

  const updateSubject = async (stageId: string, gradeId: string, subjectId: string, updatedFields: Partial<Subject>) => {
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
    
    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // Dynamically post a site update notifications alert if links/lessons were added/modified
    if (updatedFields.pdfUrl || updatedFields.memoPdfUrl || updatedFields.videoUrl || updatedFields.interactiveUrl) {
      const subjectName = updatedFields.name || "مادة دراسية";
      logSiteUpdate(
        "resource_update",
        `تم تحديث محتوى مادة: ${subjectName}`,
        `Curriculum contents refreshed: ${subjectName}`,
        `تم تعديل الروابط الدراسية ونشر مصادر إضافية/حصص مرئية جديدة لمادة "${subjectName}".`,
        `The online notes, teaching folders, or digital files for "${subjectName}" have been synced.`
      );
    }

    // Update active subject if it is currently open
    if (activeSubject && activeSubject.id === subjectId) {
      setActiveSubject({
        ...activeSubject,
        ...updatedFields
      } as any);
    }
  };

  const deleteSubject = async (stageId: string, gradeId: string, subjectId: string) => {
    const newData = curriculumData.map(stg => {
      if (stg.id !== stageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== gradeId) return grd;
          return {
            ...grd,
            subjects: grd.subjects.filter(sub => sub.id !== subjectId)
          };
        })
      };
    });
    setCurriculumData(newData);
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));
    
    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // If activeSubject is deleted, close the modal
    if (activeSubject && activeSubject.id === subjectId) {
      setActiveSubject(null);
    }
  };

  const addSubject = async (stageId: string, gradeId: string, newSubject: Subject) => {
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

    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // Dynamic user updates alert log
    const targetStage = curriculumData.find(s => s.id === stageId);
    const targetStageName = targetStage ? targetStage.name : "";
    logSiteUpdate(
      "new_subject",
      `إضافة مادة دراسية جديدة: ${newSubject.name}`,
      `New subject course loaded: ${newSubject.name}`,
      `تم إدراج منهج ومقرر مادة "${newSubject.name}" في المرحلة الدراسية بنجاح سيدي. تصفحوا الحصص الإلكترونية الآن.`,
      `The educational material syllabus for "${newSubject.name}" has been registered inside ${targetStageName}.`
    );
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
      // Play a happy success sound in Kid Mode
      if (isKidModeActive) {
        playKidChime("success");
      }
    }
    setCompletedLessons(newCompleted);
    localStorage.setItem("sudan_edu_lessons", JSON.stringify(newCompleted));
  };

  // Kid Mode Emoji helper for attractive kid-friendly cards
  const getKidSubjectEmoji = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("رياضيات") || lower.includes("math") || lower.includes("حساب")) return "🧮";
    if (lower.includes("علوم") || lower.includes("science") || lower.includes("أحياء") || lower.includes("كيمياء") || lower.includes("فيزياء") || lower.includes("طبيعة")) return "🚀";
    if (lower.includes("عربي") || lower.includes("arabic") || lower.includes("لغة عربية") || lower.includes("تربية وطنية")) return "🦁";
    if (lower.includes("إنجليزي") || lower.includes("english") || lower.includes("لغة إنجليزية")) return "🦜";
    if (lower.includes("إسلام") || lower.includes("دين") || lower.includes("islamic") || lower.includes("قرآن") || lower.includes("حديث") || lower.includes("فقه")) return "🌙";
    if (lower.includes("تاريخ") || lower.includes("جغراف") || lower.includes("سيرة") || lower.includes("سودان") || lower.includes("وطن") || lower.includes("دراسات")) return "🗺️";
    if (lower.includes("حاسوب") || lower.includes("كمبيوتر") || lower.includes("computer") || lower.includes("تكنولوجيا")) return "🤖";
    if (lower.includes("فني") || lower.includes("art") || lower.includes("رسم") || lower.includes("أشغال")) return "🎨";
    if (lower.includes("ألعاب") || lower.includes("ترفيه") || lower.includes("kindergarten") || lower.includes("نشاط") || lower.includes("روضة")) return "🧸";
    return "⭐";
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

  // 🔔 Compute Dynamic Notifications List
  const formattedNotifications = React.useMemo(() => {
    const list: any[] = [];

    // 1. Pending Friend Requests
    pendingFriendRequests.forEach((req: any) => {
      list.push({
        id: `friendship-${req.id}`,
        type: "friend_request",
        title: currentLang === "ar" ? "طلب صداقة وارد 👥" : "Incoming Friend Request 👥",
        body: currentLang === "ar" 
          ? `الزميل *${req.senderName}* يرغب في إضافتك لقائمته لتتمكنا من الدردشة والمذاكرة معاً.`
          : `Peer *${req.senderName}* wants to add you to chat and study together in the same stage.`,
        timeLabel: currentLang === "ar" ? "معلق وبانتظارك ⏳" : "Pending your approval ⏳",
        isUnread: true,
        icon: <UserCheck className="w-4 h-4 text-amber-500" />,
        iconBg: "bg-amber-955/20 border border-amber-900/40",
        action: "open_chat"
      });
    });

    // 2. Unread Chat Messages (Only public chats or DMs directed specifically to this user)
    const unreadMsgs = recentChatMessages.filter((m: any) => {
      if (!currentUser) return false;
      const mUserId = m.userId || m.user_id;
      if (String(mUserId) === String(currentUser.id)) return false;
      
      const isDM = m.text && m.text.startsWith("[DM:");
      if (isDM) {
        const dmMatch = m.text.match(/^\[DM:([^\]]+)\]/);
        if (dmMatch) {
          const recipientId = dmMatch[1];
          if (String(recipientId) !== String(currentUser.id)) {
            return false; // This private DM is not for this user!
          }
        } else {
          return false;
        }
      }
      
      return new Date(m.timestamp) > new Date(lastCheckedChat);
    });

    if (unreadMsgs.length > 0) {
      if (unreadMsgs.length === 1) {
        const m = unreadMsgs[0];
        // Clean out private DM tag for display if needed
        const cleanBodyText = m.text.startsWith("[DM:") ? m.text.replace(/^\[DM:[^\]]+\]/, "💬 [رسالة خاصة]: ") : m.text;
        list.push({
          id: `msg-${m.id}`,
          type: "message",
          title: currentLang === "ar" ? "رسالة جديدة 💬" : "New Message 💬",
          body: `*${m.username}*: ${cleanBodyText}`,
          timeLabel: new Date(m.timestamp).toLocaleTimeString(currentLang === "ar" ? "ar-SD" : "en-US", { hour: '2-digit', minute: '2-digit' }),
          isUnread: true,
          icon: <MessagesSquare className="w-4 h-4 text-indigo-400" />,
          iconBg: "bg-indigo-950/20 border border-indigo-900/30",
          action: "open_chat"
        });
      } else {
        const uniqueSenders = Array.from(new Set(unreadMsgs.map((m: any) => m.username)));
        list.push({
          id: `msgs-grouped`,
          type: "message",
          title: currentLang === "ar" ? "رسائل جديدة غير مقروءة 💬" : "Unread Chat Messages 💬",
          body: currentLang === "ar" 
            ? `لديك ${unreadMsgs.length} رسالة جديدة من: ${uniqueSenders.join(", ")}`
            : `You have ${unreadMsgs.length} new messages from: ${uniqueSenders.join(", ")}`,
          timeLabel: currentLang === "ar" ? "نشط الآن ⚡" : "Active now ⚡",
          isUnread: true,
          icon: <MessagesSquare className="w-4 h-4 text-indigo-400 animate-bounce" />,
          iconBg: "bg-indigo-950/35 border border-indigo-900/40",
          action: "open_chat"
        });
      }
    }

    // 3. Site Curricula / updates (Filtered dynamically by user permissions, grade, specialties, and targeted recipients)
    const teacherSpecs = currentUser && currentUser.user_role === "teacher" && currentUser.specialties
      ? currentUser.specialties.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    let studentGradeName = "";
    let studentStageName = "";
    if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
      curriculumData.forEach(stage => {
        const g = stage.grades.find(gr => gr.id === currentUser.grade_id);
        if (g) {
          studentGradeName = g.name.toLowerCase();
          studentStageName = stage.name.toLowerCase();
        }
      });
    }

    siteUpdates.forEach((upd: any) => {
      if (upd.category === "breaking_news" || (upd.body_ar && upd.body_ar.includes('"bgColor"')) || (upd.body_ar && upd.body_ar.includes('"enabled"'))) return; // Skip internal system config payloads
      
      const isUnread = new Date(upd.created_at) > new Date(lastCheckedUpdates);
      const isNewSubject = upd.category === "new_subject";

      const titleArLower = (upd.title_ar || "").toLowerCase();
      const bodyArLower = (upd.body_ar || "").toLowerCase();
      const titleEnLower = (upd.title_en || "").toLowerCase();
      const bodyEnLower = (upd.body_en || "").toLowerCase();

      // Check for targeted/private supervisor/admin messages
      const isTargeted = titleArLower.includes("موجه") || bodyArLower.includes("موجه") ||
                          titleArLower.includes("خاص ب") || bodyArLower.includes("خاص ب");
      if (isTargeted && currentUser) {
        const matchesMe = 
          titleArLower.includes(currentUser.username.toLowerCase()) || 
          bodyArLower.includes(currentUser.username.toLowerCase()) ||
          titleArLower.includes(currentUser.email.toLowerCase()) || 
          bodyArLower.includes(currentUser.email.toLowerCase()) ||
          (currentUser.user_role === "teacher" && (titleArLower.includes("معلم") || bodyArLower.includes("معلم") || titleArLower.includes("أساتذ") || bodyArLower.includes("أساتذ"))) ||
          (currentUser.user_role === "student" && (titleArLower.includes("طالب") || bodyArLower.includes("طالب") || titleArLower.includes("طلاب") || bodyArLower.includes("طلاب")));
        if (!matchesMe) return; // Skip if targeted message but not for this user
      }

      // Check role permissions: Teacher specialties
      if (currentUser && currentUser.user_role === "teacher" && teacherSpecs.length > 0) {
        const isSubjectUpdate = upd.category === "new_subject" || 
                                titleArLower.includes("مادة") || bodyArLower.includes("مادة") ||
                                titleArLower.includes("درس") || bodyArLower.includes("درس");
        if (isSubjectUpdate) {
          const matchesSpecialty = teacherSpecs.some(spec => 
            titleArLower.includes(spec) || bodyArLower.includes(spec) ||
            titleEnLower.includes(spec) || bodyEnLower.includes(spec)
          );
          if (!matchesSpecialty) return; // Skip notification if teacher is not specialized in this subject
        }
      }

      // Check role permissions: Student grade/stage
      if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
        const isSubjectUpdate = upd.category === "new_subject" || 
                                titleArLower.includes("مادة") || bodyArLower.includes("مادة") ||
                                titleArLower.includes("درس") || bodyArLower.includes("درس") ||
                                titleArLower.includes("صف") || bodyArLower.includes("صف");
        if (isSubjectUpdate) {
          const mentionsMyGrade = (studentGradeName && (titleArLower.includes(studentGradeName) || bodyArLower.includes(studentGradeName))) ||
                                  (studentStageName && (titleArLower.includes(studentStageName) || bodyArLower.includes(studentStageName)));
          if (!mentionsMyGrade) {
            // If it mentions other specific grades but not ours, skip it
            const otherGrades = curriculumData.flatMap(st => st.grades.map(gr => gr.name.toLowerCase())).filter(name => name !== studentGradeName);
            const mentionsOtherGrade = otherGrades.some(otherName => 
              titleArLower.includes(otherName) || bodyArLower.includes(otherName)
            );
            if (mentionsOtherGrade) {
              return; // Skip since it's for another grade
            }
          }
        }
      }

      list.push({
        id: `update-${upd.id}`,
        type: upd.category,
        title: currentLang === "ar" ? upd.title_ar : upd.title_en,
        body: currentLang === "ar" ? upd.body_ar : upd.body_en,
        timeLabel: new Date(upd.created_at).toLocaleDateString(currentLang === "ar" ? "ar-SD" : "en-US", { month: 'short', day: 'numeric' }),
        isUnread: isUnread,
        icon: isNewSubject ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-cyan-400" />,
        iconBg: isNewSubject ? "bg-emerald-955/20 border border-emerald-900/30" : "bg-cyan-955/20 border border-cyan-900/30",
        action: "open_curriculum"
      });
    });

    return list;
  }, [pendingFriendRequests, recentChatMessages, siteUpdates, currentUser, lastCheckedChat, lastCheckedUpdates, currentLang]);

  const unreadCount = React.useMemo(() => {
    return formattedNotifications.filter(n => n.isUnread).length;
  }, [formattedNotifications]);

  const handleNotificationClick = (item: any) => {
    if (item.action === "open_chat") {
      setShowStudentChat(true);
      
      const nowStr = new Date().toISOString();
      localStorage.setItem("sudan_chat_last_read", nowStr);
      setLastCheckedChat(nowStr);
    } else {
      const nowStr = new Date().toISOString();
      localStorage.setItem("sudan_updates_last_read", nowStr);
      setLastCheckedUpdates(nowStr);
    }
    setShowNotificationsDropdown(false);
  };

  return (
    <div className={`min-h-screen font-sans pb-16 transition-all duration-300 ${
      siteTheme === "sudanese" 
        ? "bg-cream text-mud selection:bg-earthgold/20 selection:text-mud" 
        : "bg-slate-950 text-slate-100 selection:bg-emerald-600 selection:text-white"
    }`} dir={currentLang === "ar" ? "rtl" : "ltr"}>
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

      {/* 📢 Breaking News Moving Ticker Bar */}
      {breakingNews && breakingNews.enabled && !isTickerDismissed && (
        <div 
          className={`relative w-full ${breakingNews.bgColor} ${breakingNews.textColor} text-xs py-2 px-4 md:px-6 select-none overflow-hidden flex items-center border-b border-white/5 z-40 transition-all shadow-lg shadow-black/10`}
          dir={currentLang === "ar" ? "rtl" : "ltr"}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            
            {/* Red alert badge with pulsing dot */}
            <div className="flex items-center gap-1.5 font-black bg-black/30 px-2.5 py-1 rounded-xl text-[10px] uppercase shadow-inner shrink-0 relative z-10 select-none border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-[10px] md:text-[11px] font-black">{currentLang === "ar" ? "" : "Breaking News 🔴"}</span>
            </div>

            {/* Animated Ticker container */}
            <div className="flex-1 overflow-hidden relative mx-2" dir="ltr">
              <div 
                className={tickerDirection === "rtl" ? "animate-marquee text-right" : "animate-marquee-ltr text-left"}
                style={{ 
                  "--marquee-duration": breakingNews.speed === "slow" ? "50s" : breakingNews.speed === "fast" ? "14s" : "26s" 
                } as React.CSSProperties}
              >
                <span className="px-6 text-[11px] md:text-xs font-black tracking-wide" dir={currentLang === "ar" ? "rtl" : "ltr"}>
                  {currentLang === "ar" ? breakingNews.textAr : breakingNews.textEn}
                </span>
                <span className="px-6 text-[11px] md:text-xs font-black tracking-wide opacity-90 select-none" dir={currentLang === "ar" ? "rtl" : "ltr"}>
                  🔴 {currentLang === "ar" ? breakingNews.textAr : breakingNews.textEn}
                </span>
              </div>
            </div>

            {/* Actions: Admin direct shortcut, Direction toggle & Dismiss key */}
            <div className="flex items-center gap-2 relative z-10 shrink-0">
              {currentUser && (currentUser.user_role === "admin" || currentUser.username === "almangory") && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="hidden md:inline-flex items-center gap-0.5 bg-black/40 hover:bg-black/60 text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg cursor-pointer transition-all border border-white/10 active:scale-95 text-slate-200"
                  title="تعديل محتوى وبث هذا الإعلان فوراً"
                >
                  <span>تعديل ⚙️</span>
                </button>
              )}

              {/* Direction selector Toggle key */}
              <button
                onClick={() => {
                  const newDir = tickerDirection === "rtl" ? "ltr" : "rtl";
                  setTickerDirection(newDir);
                  localStorage.setItem("sudan_edu_ticker_direction", newDir);
                }}
                className="hover:bg-black/35 px-2 py-1 rounded-xl text-[10px] text-white/90 hover:text-white transition-all active:scale-90 cursor-pointer border border-white/10 flex items-center gap-1.5 font-bold select-none"
                title={currentLang === "ar" ? "تغيير اتجاه حركة شريط الأخبار" : "Toggle Ticker Scroll Direction"}
              >
                <ArrowLeftRight className="w-3 h-3 text-white/90" />
                <span className="text-[9px] md:text-[10px] font-black hidden xs:inline">
                  {tickerDirection === "rtl" ? "يمين ⏪" : "⏪ يسار"}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setIsTickerDismissed(true);
                  sessionStorage.setItem("sudan_edu_ticker_dismissed", "true");
                }}
                className="hover:bg-black/35 p-1 rounded-lg text-white/80 hover:text-[#ffffff] transition-opacity active:scale-90 cursor-pointer border border-transparent hover:border-white/10"
                title={currentLang === "ar" ? "إخفاء الشريط" : "Hide Announcement"}
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Header Bar for Admin Portal */}
      <div className={`transition-all duration-300 border-b px-3 sm:px-6 py-2.5 relative z-50 ${
        siteTheme === "sudanese"
          ? "bg-white shadow-sm shadow-[#5C2C16]/5 border-mud/10 text-mud"
          : "bg-slate-900/90 border-slate-800/60 text-slate-100"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-right flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
            </div>
            
            {/* Elegant Offline Indicator Badge */}
            <div 
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black tracking-wide transition-all duration-300 ${
                isOnline 
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                  : 'bg-amber-955/30 text-amber-400 border-amber-900/40 animate-pulse'
              }`}
              title={isOnline ? "مزامنة ذكية مفعلة - جميع المواد المفتوحة تُحمل تلقائياً" : "وضع عدم الاتصال مفعل - تصفح ما تم فتحه مسبقاً بدقة عالية"}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                  <span>{currentLang === "ar" ? "متصل" : "Online"}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400 stroke-[3]" />
                  <span>{currentLang === "ar" ? "وضع عدم الاتصال" : "Offline Mode"}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 relative w-auto h-auto flex-nowrap shrink-0">
            {/* Page Refresh Button */}
            <button
              onClick={() => {
                window.location.reload();
              }}
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                siteTheme === "sudanese"
                  ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                  : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
              }`}
              title={currentLang === "ar" ? "تحديث الصفحة" : "Refresh Page"}
            >
              <RotateCw className="w-3.5 h-3.5 text-earthgold-600" />
              <span className="hidden sm:inline">
                {currentLang === "ar" ? " تحديث" : " Refresh"}
              </span>
            </button>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleSiteTheme}
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                siteTheme === "sudanese"
                  ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                  : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
              }`}
              title={currentLang === "ar" ? "تغيير المظهر (التصميم السوداني التقليدي / المظهر الداكن)" : "Switch Theme (Traditional Sudanese / Legacy Dark)"}
            >
              <span className="text-[14px]">🎨</span>
              <span className="hidden sm:inline">
                {currentLang === "ar" 
                  ? (siteTheme === "sudanese" ? " التصميم السوداني" : " التصميم الداكن") 
                  : (siteTheme === "sudanese" ? " Sudanese Style" : " Dark Legacy")}
              </span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={() => {
                const nextLang = currentLang === "ar" ? "en" : "ar";
                setCurrentLang(nextLang);
                localStorage.setItem("sudan_edu_lang", nextLang);
              }}
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                siteTheme === "sudanese"
                  ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                  : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
              }`}
              title={currentLang === "ar" ? "Switch to English" : "التحويل للغة العربية"}
            >
              <Globe className={`w-3.5 h-3.5 ${siteTheme === "sudanese" ? "text-earthgold" : "text-emerald-400"}`} />
              <span className="text-[10px] font-black ml-1 sm:hidden">{currentLang === "ar" ? "EN" : "AR"}</span>
              <span className="hidden sm:inline">{currentLang === "ar" ? " English" : " العربية"}</span>
            </button>

            {/* Kid Mode (البراعم) Playful Toggle Button - only visible to registered primary/kindergarten stage students */}
            {currentUser && currentUser.user_role === "student" && (currentUser?.grade_id?.startsWith("pri-") || currentUser?.grade_id?.startsWith("kg-")) && (
              <button
                onClick={() => {
                  const nextVal = !isKidModeActive;
                  setKidModeOverride(nextVal);
                  playKidChime(nextVal ? 'success' : 'click');
                }}
                className={`relative rounded-full shadow-lg transition-all duration-305 cursor-pointer flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 shrink-0 ${
                  isKidModeActive
                    ? "bg-pink-500/25 border-2 border-pink-400 ring-4 ring-pink-500/35 scale-110 shadow-pink-500/30 animate-bounce"
                    : "bg-slate-950/75 border border-slate-800 hover:border-pink-500/60 hover:scale-110 shadow-inner"
                }`}
                title={currentLang === "ar" ? "اضغط على البالون للانتقال لواجهة الأطفال اللطيفة! 🎈" : "Click the balloon to launch children mode! 🎈"}
              >
                <span className={`text-[16px] sm:text-[20px] select-none transition-all duration-300 ${isKidModeActive ? "scale-110" : "hover:scale-115"}`} style={{ transformOrigin: 'center' }}>
                  🎈
                </span>
                {isKidModeActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </button>
            )}

            {/* Live Student Chat Tab at Top */}
            {currentUser && currentUser.user_role !== "guest" && (
              <button
                onClick={() => {
                  const targetState = !showStudentChat;
                  setShowStudentChat(targetState);
                  
                  // Clear unread indicator
                  const nowStr = new Date().toISOString();
                  localStorage.setItem("sudan_chat_last_read", nowStr);
                  setLastCheckedChat(nowStr);

                  // Seamless mobile focus scroll
                  if (targetState && window.innerWidth < 1024) {
                    setTimeout(() => {
                      const chatEl = document.getElementById("friends-chat-dashboard") || document.getElementById("chat-visitor-blocked");
                      chatEl?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 250);
                  }
                }}
                className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 border font-sans font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer ${
                  showStudentChat
                    ? "bg-indigo-650/25 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20"
                    : "bg-slate-950/60 border-slate-800 hover:bg-slate-900 hover:border-indigo-500/50 text-slate-200"
                }`}
                title={currentLang === "ar" ? "الدردشة الطلابية" : "Student Chat"}
              >
                <MessagesSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">
                  {currentLang === "ar" ? " الدردشة" : " Chat"}
                </span>
              </button>
            )}

            {/* Search Lens Button and Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTopSearch(prev => !prev);
                  setShowNotificationsDropdown(false);
                }}
                className={`inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl shadow-sm transition-all duration-305 cursor-pointer relative ${
                  showTopSearch 
                    ? "bg-[#5C2C16] text-[#FAF5EC] ring-2 ring-[#5C2C16]/20" 
                    : siteTheme === "sudanese"
                      ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-[#5C2C16]/60"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/40 text-slate-200"
                }`}
                title={currentLang === "ar" ? "البحث السريع والترشيح" : "Quick Search & Filter"}
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showTopSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute left-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl p-5 z-[9999] text-right font-sans border ${
                      siteTheme === "sudanese"
                        ? "bg-white border-mud/15 text-mud"
                        : "bg-slate-900 border-slate-800 text-slate-100"
                    }`}
                    dir={currentLang === "ar" ? "rtl" : "ltr"}
                  >
                    <div className="flex items-center justify-between border-b border-mud/10 pb-2.5 mb-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Search className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-earthgold" : "text-emerald-400"}`} />
                        <h5 className="text-xs font-black">
                          {currentLang === "ar" ? "البحث والترشيح السريع 🔍" : "Quick Search & Filter 🔍"}
                        </h5>
                      </div>
                      <button
                        onClick={() => setShowTopSearch(false)}
                        className="text-[10px] text-mud/50 hover:text-mud transition-colors cursor-pointer"
                      >
                        {currentLang === "ar" ? "إغلاق ✕" : "Close ✕"}
                      </button>
                    </div>

                    <div className="space-y-4 text-right" dir="rtl">
                      {/* Search Input Box */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold block mb-1">
                          {currentLang === "ar" ? "كلمة البحث" : "Search Query"}
                        </label>
                        <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                          siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}>
                          <Search className="w-4 h-4 opacity-50 shrink-0 select-none ml-2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={currentLang === "ar" ? "اكتب اسم المادة..." : "Type subject..."}
                            className="bg-transparent w-full outline-none text-xs font-semibold text-right"
                          />
                        </div>
                      </div>

                      {/* Stage selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold block mb-1">
                          {currentLang === "ar" ? "المرحلة الدراسية" : "Educational Level"}
                        </label>
                        <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                          siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}>
                          <select
                            value={selectedStage ? selectedStage.id : ""}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              if (stageId === "") {
                                setSelectedStage(null);
                                setActiveGrade(null);
                              } else {
                                const stg = curriculumData.find(s => s.id === stageId);
                                if (stg) {
                                  setSelectedStage(stg);
                                  setActiveGrade(null);
                                  setShowOnlyFavorites(false);
                                  setShowStudyCamp(false);
                                  setShowEducationalMindMap(false);
                                }
                              }
                            }}
                            className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                          >
                            <option value="" className="text-slate-855">{currentLang === "ar" ? "جميع المراحل التعليمية" : "All Stages"}</option>
                            {curriculumData.map(st => (
                              <option key={st.id} value={st.id} className="text-slate-855">
                                {st.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                        </div>
                      </div>

                      {/* Grade selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold block mb-1">
                          {currentLang === "ar" ? "الصف الدراسي" : "Class / Grade"}
                        </label>
                        <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                          siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}>
                          <select
                            value={activeGrade ? activeGrade.id : ""}
                            onChange={(e) => {
                              const gradeId = e.target.value;
                              if (gradeId === "") {
                                setActiveGrade(null);
                              } else {
                                if (selectedStage) {
                                  const gr = selectedStage.grades.find(g => g.id === gradeId);
                                  if (gr) {
                                    setActiveGrade(gr);
                                  }
                                } else {
                                  let fs = null;
                                  let fg = null;
                                  curriculumData.forEach(st => {
                                    const gr = st.grades.find(g => g.id === gradeId);
                                    if (gr) {
                                      fs = st;
                                      fg = gr;
                                    }
                                  });
                                  if (fs && fg) {
                                    setSelectedStage(fs);
                                    setActiveGrade(fg);
                                  }
                                }
                              }
                            }}
                            className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                          >
                            <option value="" className="text-slate-855">{currentLang === "ar" ? "اختر الصف الدراسي..." : "Select Class..."}</option>
                            {(selectedStage ? selectedStage.grades : curriculumData.flatMap(st => st.grades)).map(gr => (
                              <option key={gr.id} value={gr.id} className="text-slate-855">
                                {gr.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                        </div>
                      </div>

                      {/* Subject selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold block mb-1">
                          {currentLang === "ar" ? "قائمة المواد" : "Subject Filter"}
                        </label>
                        <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                          siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}>
                          <select
                            value={activeSubject ? activeSubject.id : ""}
                            onChange={(e) => {
                              const subId = e.target.value;
                              if (subId) {
                                let foundSub = null;
                                curriculumData.forEach(st => {
                                  st.grades.forEach(g => {
                                    const sub = g.subjects.find(s => s.id === subId);
                                    if (sub) foundSub = sub;
                                  });
                                });
                                if (foundSub) handleOpenSubject(foundSub);
                              }
                            }}
                            className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                          >
                            <option value="" className="text-slate-855">{currentLang === "ar" ? "تصفح المواد..." : "Go to Subject..."}</option>
                            {(activeGrade ? activeGrade.subjects : curriculumData.flatMap(st => st.grades.flatMap(g => g.subjects))).map(s => (
                              <option key={s.id} value={s.id} className="text-slate-855">
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell Dropdown Component */}
            {currentUser && currentUser.user_role !== "guest" && (
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(prev => !prev);
                    setShowTopSearch(false);
                    if (!showNotificationsDropdown) {
                      const nowStr = new Date().toISOString();
                      localStorage.setItem("sudan_updates_last_read", nowStr);
                      setLastCheckedUpdates(nowStr);
                    }
                  }}
                  className={`inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl shadow-sm transition-all duration-300 cursor-pointer relative ${
                    showNotificationsDropdown 
                      ? "bg-amber-955/35 border-amber-500 text-amber-300 ring-2 ring-amber-500/20" 
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-200"
                  }`}
                  title={currentLang === "ar" ? "الإشعارات" : "Notifications"}
                >
                  <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? "text-amber-400 animate-bounce" : "text-slate-400"}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-650 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-slate-950 animate-pulse px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotificationsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[9999] text-right font-sans"
                      dir={currentLang === "ar" ? "rtl" : "ltr"}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <h5 className="text-xs font-black text-slate-100">
                            {currentLang === "ar" ? "الإشعارات والتحديثات 🔔" : "Notifications & Updates 🔔"}
                          </h5>
                        </div>
                        <button
                          onClick={() => {
                            const nowStr = new Date().toISOString();
                            localStorage.setItem("sudan_chat_last_read", nowStr);
                            setLastCheckedChat(nowStr);
                            localStorage.setItem("sudan_updates_last_read", nowStr);
                            setLastCheckedUpdates(nowStr);
                            setShowNotificationsDropdown(false);
                          }}
                          className="text-[9px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {currentLang === "ar" ? "تحديد كالمقروءة وإغلاق ✓" : "Mark read & close ✓"}
                        </button>
                      </div>

                      <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {formattedNotifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-500 text-2xs space-y-1">
                            <p className="font-extrabold text-slate-400">
                              {currentLang === "ar" ? "لا توجد إشعارات جديدة حالياً." : "No new notifications yet."}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {currentLang === "ar" 
                                ? "سيتم تنبيهك هنا عند تلقي طلب صداقة، رسائل جديدة، أو إضافة مواد وروابط." 
                                : "You will be notified of requests, replies, new subjects, or resource links here."}
                            </p>
                          </div>
                        ) : (
                          formattedNotifications.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                item.isUnread
                                  ? "bg-amber-955/5 border-amber-900/40 hover:bg-slate-850 hover:border-amber-500/30"
                                  : "bg-slate-950/40 border-slate-900/40 hover:bg-slate-850"
                              }`}
                            >
                              <div className="flex gap-2.5 items-start">
                                <div className={`p-1.5 rounded-lg shrink-0 ${item.iconBg}`}>
                                  {item.icon}
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-slate-100 truncate block">{item.title}</span>
                                    {item.isUnread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-350 leading-normal font-medium whitespace-pre-line text-right">
                                    {item.body}
                                  </p>
                                  <span className="text-[8px] text-slate-500 block pt-0.5 font-mono text-right">{item.timeLabel}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Student / user login trigger */}
            {currentUser ? (
              <div className="inline-flex items-center gap-1.5 sm:gap-2.5 bg-slate-950 px-2 sm:px-3.5 py-1.5 border border-slate-800 rounded-xl shadow-inner select-none">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
                
                <span className="inline-flex items-center gap-1 text-3xs md:text-2xs text-indigo-300 font-extrabold max-w-[80px] xs:max-w-[130px] truncate">
                  <User className="w-3.5 h-3.5 text-indigo-455 shrink-0" />
                  <span className="truncate">{currentUser.username}</span>
                </span>

                <div className="h-4 w-px bg-slate-800 shrink-0" />

                <button
                  onClick={triggerEditProfile}
                  className="inline-flex items-center gap-1 text-[9px] text-amber-500 hover:text-amber-400 transition-colors cursor-pointer font-extrabold"
                  title={t("editProfile")}
                >
                  <Settings className="w-3 h-3 text-amber-500" />
                  <span className="hidden xs:inline">{t("editProfile")}</span>
                </button>

                <div className="h-4 w-px bg-slate-800 shrink-0" />

                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem("sudan_auth_user");
                    const client = getSupabaseClient();
                    if (client) {
                      client.auth.signOut();
                    }
                    setSaveStatus(t("logoutSuccess"));
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  className="inline-flex items-center gap-1 text-[9px] text-rose-555 hover:text-rose-455 transition-colors cursor-pointer font-extrabold"
                  title={t("logout")}
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span className="hidden xs:inline">{t("logout")}</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/65 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-indigo-455" />
                <span className="hidden xs:inline">{t("studentAccount")}</span>
                <span className="xs:hidden">{currentLang === "ar" ? "حسابي" : "Account"}</span>
              </button>
            )}

            {/* Wrap the Admin Button and Dropdown in a dedicated relative div to prevent position overflow */}
            <div className="relative">
              {isAdminLoggedIn ? (
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-955/45 border border-emerald-900/65 text-emerald-400 font-extrabold text-[10px] rounded-xl shadow-inner select-none">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-455 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>{t("adminLoggedInAs")}</span>
                    <span className="text-white font-mono font-black pb-0.5">almangory</span>
                  </div>
                  <button
                    onClick={handleAdminLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-955/20 hover:bg-rose-900/20 border border-rose-900/40 text-rose-450 hover:text-rose-350 font-extrabold text-[10px] rounded-xl transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
                  >
                    <LogOut className="w-3 h-3 text-rose-500" />
                    <span>{t("logout")}</span>
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950/65 hover:bg-slate-900 text-slate-200 border border-slate-800 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 hover:border-emerald-500/40 cursor-pointer"
                  title={currentLang === "ar" ? "دخول المسؤول المفوّض لتعديل وإخفاء المناهج التعليمية" : "Authorized Administrator Portal Login"}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t("adminPortal")}</span>
                </button>
              )}

              {/* Admin Login Dialog dropdown (properly absolute-positioned under parent button) */}
              <AnimatePresence>
                {showAdminLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute -left-[150px] sm:left-auto sm:-right-4 mt-3 w-72 md:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[9999] space-y-3 font-sans"
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
                        <p>رمز المرور السري: <span className="font-mono text-white select-all bg-slate-950 px-1 rounded">sudan2026</span></p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold block">اسم المستخدم</label>
                        <input 
                          type="text" 
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="admin@sudan.edu"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold block">رمز المرور السري</label>
                        <input 
                          type="password" 
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>

                      {adminLoginError && (
                        <p className="text-[10px] text-rose-400 font-bold leading-normal">{adminLoginError}</p>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>تسجيل الدخول كمسؤول</span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
          {siteTheme === "legacy" && (
            <header className="relative py-12 md:py-16 px-6 overflow-hidden">
        {/* Abstract Geometrics */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-emerald-950/20 via-slate-950/30 to-slate-950 pointer-events-none" />
        <div className="absolute -left-36 top-12 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-36 top-0 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-955/50 border border-emerald-900/40 text-emerald-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("siteForSudan")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight md:leading-normal font-sans">
              {currentLang === "ar" ? (
                <>منصة السودان <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-400">التعليمية التفاعلية</span></>
              ) : (
                <>Sudanese <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-400">Interactive Platform</span></>
              )}
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
              {t("gatewayDesc")}
            </p>
          </div>

          {/* Simple Statistics & Admin Gate widgets */}
          <div className={`w-full md:w-auto grid gap-4 flex-shrink-0 ${
            isAdminLoggedIn || showHiddenAdminGate 
              ? "grid-cols-2 md:grid-cols-4" 
              : "grid-cols-2 md:grid-cols-3"
          }`}>
            <div 
              onClick={() => {
                setShowOnlyFavorites(prev => !prev);
                setShowStudyCamp(false);
                setShowEducationalMindMap(false);
                setShowStudentChat(false);
                setShowAdminDashboard(false);
              }}
              className={`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 select-none ${
                showOnlyFavorites 
                  ? "bg-amber-955/20 border-yellow-500/80 ring-2 ring-yellow-500/30 text-amber-400 hover:bg-amber-955/40 shadow-yellow-955/40" 
                  : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-yellow-500/40"
              }`}
            >
              <Star className={`w-5 h-5 mx-auto transition-all ${showOnlyFavorites ? "text-yellow-400 fill-yellow-400 scale-110" : "text-yellow-400"}`} />
              <span className="text-xl font-bold text-slate-100 block">{favoriteSubjects.length}</span>
              <span className="text-2xs text-slate-400 block font-bold">
                {showOnlyFavorites ? (currentLang === "ar" ? "المناهج الكاملة" : "Full Curricula") : (currentLang === "ar" ? "المواد المفضلة ⭐" : "My Favorites ⭐")}
              </span>
            </div>

            <div className="bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg selection:bg-transparent">
              <CheckCircle className="w-5 h-5 text-emerald-450 mx-auto" />
              <span className="text-xl font-bold text-slate-100 block">{completedLessons.length}</span>
              <span className="text-2xs text-slate-400 block font-medium">{t("completedExercises")}</span>
            </div>

            {/* 📚 Premium Vintage Book Cover Card for Public Library (المكتبة العامة) - Legacy Theme */}
            <div 
              onClick={handleLibraryClick}
              className="p-4 bg-gradient-to-br from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between min-h-[110px] select-none group"
            >
              <div className="bg-[#1E0D06]/70 px-1 py-0.5 rounded border border-amber-500/20 text-[7px] font-bold text-amber-400 text-center w-fit mx-auto leading-none">
                كنوز المعرفة 📜
              </div>
              <div className="py-1">
                <span className="text-xs font-black text-amber-300 block leading-tight">المكتبة العامة</span>
                <span className="text-[9px] text-amber-400/80 block mt-0.5">الكتب والمراجع التفاعلية</span>
              </div>
              <div className="w-5 h-5 mx-auto rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/15 group-hover:animate-spin">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              </div>
            </div>

            {(isAdminLoggedIn || showHiddenAdminGate) && (
              <div 
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setShowAdminDashboard(prev => !prev);
                    setSelectedStage(null);
                    setActiveGrade(null);
                    setShowStudyCamp(false);
                    setShowEducationalMindMap(false);
                    setShowStudentChat(false);
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
                    ? "bg-emerald-955/20 border-emerald-500/80 ring-2 ring-emerald-500/30 text-emerald-400 hover:bg-emerald-955/40" 
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-emerald-500/40"
                }`}
              >
                <Lock className={`w-5 h-5 mx-auto transition-all ${isAdminLoggedIn ? "text-emerald-400" : "text-slate-400"}`} />
                <span className="text-xs font-bold text-slate-100 block leading-tight pt-1">
                  {isAdminLoggedIn ? (currentLang === "ar" ? "لوحة التحكم" : "Admin Dashboard") : (currentLang === "ar" ? "بوابة الإدارة" : "Admin Gate")}
                </span>
                <span className="text-3xs text-emerald-455 block font-bold mt-1">
                  {isAdminLoggedIn ? (currentLang === "ar" ? "تعديل المناهج ⚙️" : "Manage Curriculums ⚙️") : (currentLang === "ar" ? "دخول الإدارة 🔐" : "Admin Login 🔐")}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
          )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Recent History Section */}
        {siteTheme === "legacy" && recentSubjects.length > 0 && (
          <section className="space-y-3 relative overflow-hidden bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-black tracking-wide text-slate-200">
                  {currentLang === "ar" ? "المواد المفتوحة مؤخراً" : "Recent Study History"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setRecentSubjects([]);
                  localStorage.removeItem("sudan_edu_recent_subjects");
                }}
                className="text-[10px] font-extrabold text-rose-450 hover:text-rose-400 transition-colors cursor-pointer"
              >
                {currentLang === "ar" ? "مسح السجل" : "Clear History"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {recentSubjects.map((subject, index) => (
                <div
                  key={`${subject.id}-${index}`}
                  className="group relative p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between overflow-hidden"
                  onClick={() => handleOpenSubject(subject)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0 select-none">
                      {subject.icon || "📚"}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-slate-100 text-xs font-bold truncate">
                        {t(subject.name)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {subject.gradeName ? t(subject.gradeName) : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSubjects(prev => {
                        const updated = prev.filter((_, i) => i !== index);
                        localStorage.setItem("sudan_edu_recent_subjects", JSON.stringify(updated));
                        return updated;
                      });
                    }}
                    className="w-5 h-5 rounded-md hover:bg-rose-955/40 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 ml-1"
                    title={currentLang === "ar" ? "حذف من السجل" : "Remove from History"}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stage selection selector tabs */}
        {siteTheme === "sudanese" ? (
          // Beautiful Traditional Sudanese Traditional clay architecture layout!
          <div className="flex flex-col gap-8 mt-5 items-start w-full">
             {/* Core Content Layout (Takes Full Width) */}
             <div className="w-full space-y-8 z-10 text-right" dir="rtl">
                {/* Visual Sudanese Heritage Gottia Pattern Backdrop Hero */}
                <div className="relative bg-gradient-to-br from-[#FAF5EC]/90 via-[#FDFBF7] to-[#F1ECE3] rounded-3xl p-3.5 sm:p-10 border border-mud/15 overflow-hidden shadow-inner flex flex-col md:flex-row items-center gap-4 sm:gap-8 group">
                   <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#5C2C16_1px,transparent_1px)] [background-size:16px_16px]"></div>
                   
                   <div className="flex-1 space-y-2 sm:space-y-4 text-right">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-earthgold/30 rounded-full text-[9px] sm:text-[10px] md:text-3xs font-extrabold text-mud uppercase tracking-wider shadow-sm select-none">
                           <WebsiteLogo size={12} />
                           <span>منصة المناهج السودانية المطورة 🇸🇩</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] sm:text-[10px] md:text-3xs font-black text-[#2E7D32] dark:text-emerald-400 tracking-wider shadow-sm select-none animate-pulse">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] dark:bg-emerald-400 shrink-0"></span>
                           <span>التعليم للجميع ✨</span>
                        </div>
                      </div>
                      <h2 className="text-sm sm:text-2xl md:text-3xl font-black text-mud leading-snug">
                         {currentLang === "ar" ? "أهلاً بك في البوابة التعليمية التفاعلية الموحدة" : "Interactive Gateway to Sudanese Unified Curricula"}
                      </h2>
                      <p className="text-[10px] sm:text-xs text-mud/85 leading-relaxed max-w-lg font-sans">
                         {currentLang === "ar" 
                           ? "نهدف لتوفير وصول دائم ومجاني لجميع المناهج الدراسية، الكتب، المذكرات التلخيصية، الشروحات التفاعلية، ومعامل الذكاء الاصطناعي المساندة للتعليم في السودان." 
                           : "Dedicated to providing free interactive school books, summaries, simulations, and virtual assistance for teachers and students."}
                      </p>

                      {/* Beautiful Traditional Sudanese Heritage Stats/Favorites/Admin Counters */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 pt-1 sm:pt-2 font-sans">
                         <button 
                            onClick={() => {
                               setShowOnlyFavorites(prev => !prev);
                               setShowStudyCamp(false);
                               setShowEducationalMindMap(false);
                               setShowStudentChat(false);
                               setShowAdminDashboard(false);
                               setSelectedStage(null);
                               setActiveGrade(null);
                            }}
                            className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs ${
                               showOnlyFavorites 
                                 ? "bg-[#D4AF37] text-white border-[#D4AF37] ring-4 ring-[#D4AF37]/20" 
                                 : "bg-white hover:bg-cream border-mud/15 text-mud"
                            }`}
                         >
                            <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${showOnlyFavorites ? "fill-white text-white" : "text-amber-500 fill-[#D4AF37]"}`} />
                            <span className="font-extrabold">{favoriteSubjects.length}</span>
                            <span>
                               {showOnlyFavorites ? (currentLang === "ar" ? "تصفح جميع المناهج 📋" : "Browse All Curricula 📋") : (currentLang === "ar" ? "المواد المفضلة ⭐" : "My Favorites ⭐")}
                            </span>
                         </button>

                         <div className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-mud/10 bg-white/70 text-mud text-[10px] sm:text-2xs font-bold select-none shadow-xs">
                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-extrabold">{completedLessons.length}</span>
                            <span>{currentLang === "ar" ? "تمارين مكتملة" : "Completed Exercises"}</span>
                         </div>
                         
                         {(isAdminLoggedIn || showHiddenAdminGate) && (
                           <button 
                              onClick={() => {
                                 if (isAdminLoggedIn) {
                                    setShowAdminDashboard(prev => !prev);
                                    setSelectedStage(null);
                                    setActiveGrade(null);
                                    setShowStudyCamp(false);
                                    setShowEducationalMindMap(false);
                                    setShowStudentChat(false);
                                    setShowOnlyFavorites(false);
                                 } else {
                                    setShowAdminLogin(true);
                                    setAdminLoginError("");
                                    setAdminUsername("");
                                    setAdminPassword("");
                                 }
                              }}
                              className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs ${
                                 showAdminDashboard 
                                   ? "bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-700/20" 
                                   : "bg-white hover:bg-cream border-mud/15 text-mud"
                              }`}
                           >
                              <Lock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${showAdminDashboard ? "text-white" : "text-mud/60"}`} />
                              <span>
                                 {isAdminLoggedIn ? (currentLang === "ar" ? "لوحة التحكم" : "Admin Dashboard") : (currentLang === "ar" ? "بوابة الإدارة" : "Admin Gate")}
                              </span>
                           </button>
                         )}
                      </div>
                   </div>

                   {/* Right side containers: Huts Gottia + Public Library Card */}
                   <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shrink-0 mt-4 md:mt-0">
                      {/* SVG or Custom Animated Image/Video from Google Drive or Direct Link */}
                      <div 
                        onClick={() => {
                          if (isAdminLoggedIn) {
                            const newUrl = prompt(
                              currentLang === "ar" 
                                ? "أدخل رابط صورة أو فيديو الغلاف الجديد (دعها فارغة للافتراضي):" 
                                : "Enter new cover image/video URL (leave empty for default):", 
                              bannerImageUrl || ""
                            );
                            if (newUrl !== null) {
                              setBannerImageUrl(newUrl);
                              localStorage.setItem("sudan_edu_banner_image_v1", newUrl);
                              const newType = newUrl && (newUrl.endsWith(".mp4") || newUrl.includes("video") || newUrl.includes("drive.google.com/file/d/")) ? "video" : "image";
                              setBannerMediaType(newType);
                              localStorage.setItem("sudan_edu_banner_media_type_v1", newType);
                            }
                          }
                        }}
                        className="w-28 h-20 sm:w-48 sm:h-36 shrink-0 relative bg-white/20 rounded-2xl border border-mud/10 flex items-center justify-center shadow-inner overflow-hidden select-none transition-all duration-300 cursor-pointer group/banner"
                      >
                        {bannerImageUrl ? (
                          bannerMediaType === "video" ? (
                            <video
                              src={bannerImageUrl.includes("drive.google.com") ? convertGoogleDriveVideoUrl(bannerImageUrl) : bannerImageUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover rounded-2xl pointer-events-none"
                              onError={(e) => {
                                console.warn("Custom banner video failed to load");
                              }}
                            />
                          ) : (
                            <img 
                              src={convertGoogleDriveUrl(bannerImageUrl)} 
                              alt="Banner Custom" 
                              className="w-full h-full object-cover rounded-2xl pointer-events-none"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                console.warn("Custom banner image failed to load, fallback to default icon");
                              }}
                            />
                          )
                        ) : (
                           <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
                            {/* Sky Sand Gradients */}
                            <defs>
                               <linearGradient id="sandSky" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FDFBF7" />
                                  <stop offset="100%" stopColor="#FAF5EC" />
                               </linearGradient>
                            </defs>
                            <rect width="200" height="150" fill="url(#sandSky)" />
                            
                            {/* Golden Sun */}
                            <circle cx="160" cy="50" r="18" fill="#D4AF37" opacity="0.35" className="animate-pulse" />
                            <circle cx="160" cy="50" r="12" fill="#D4AF37" opacity="0.8" />

                            {/* Desert sand dune */}
                            <path d="M 0 135 Q 60 115, 120 125 T 200 120 L 200 150 L 0 150 Z" fill="#E8DFCF" />
                            <path d="M 0 142 Q 80 132, 160 138 T 200 130 L 200 150 L 0 150 Z" fill="#FAF5EC" />

                            {/* gottia 1 */}
                            <g transform="translate(45, 80)">
                               {/* Gottia straw cone roof */}
                               <polygon points="25,0 0,35 50,35" fill="#D4AF37" stroke="#5C2C16" strokeWidth="1" />
                               {/* Gottia mud wall */}
                               <rect x="5" y="34" width="40" height="25" fill="#C57530" stroke="#5C2C16" strokeWidth="1" rx="2" />
                               {/* gottia door */}
                               <path d="M 20 45 A 5 5 0 0 1 30 45 L 30 59 L 20 59 Z" fill="#5C2C16" />
                            </g>

                            {/* gottia 2 */}
                            <g transform="translate(100, 88)">
                               {/* Gottia straw cone roof */}
                               <polygon points="20,0 0,28 40,28" fill="#5C2C16" opacity="0.85" />
                               {/* Gottia mud wall */}
                               <rect x="4" y="27" width="32" height="22" fill="#E4A054" stroke="#5C2C16" strokeWidth="1" rx="1" />
                               {/* gottia door */}
                               <path d="M 16 38 A 4 4 0 0 1 24 38 L 24 49 L 16 49 Z" fill="#5C2C16" />
                            </g>

                            {/* Palm tree */}
                            <g transform="translate(145, 85)">
                               <path d="M 10 0 Q 3 -25, -10 -40 Q 3 -15, 10 0 Z" fill="#C57530" />
                               {/* Palm leaves */}
                               <path d="M -10 -40 Q -25 -52, -35 -40" stroke="#D4AF37" strokeWidth="2" fill="none" />
                               <path d="M -10 -40 Q -20 -58, -5 -55" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
                               <path d="M -10 -40 Q 5 -55, 12 -45" stroke="#D4AF37" strokeWidth="2" fill="none" />
                               <path d="M -10 -40 Q -15 -32, -22 -28" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
                            </g>

                            {/* Floating educational gears/symbols */}
                            <text x="25" y="45" fontFamily="sans-serif" fontSize="11" fill="#D4AF37" className="animate-bounce">📖</text>
                            <text x="80" y="35" fontFamily="sans-serif" fontSize="10" fill="#5C2C16" opacity="0.6">✍️</text>
                            <text x="135" y="65" fontFamily="sans-serif" fontSize="12" fill="#D4AF37">⭐</text>
                         </svg>
                      )}

                      {/* Hover Overlay indicating editable */}
                      {isAdminLoggedIn && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-all duration-300">
                           <Pencil className="w-5 h-5 text-amber-400 animate-pulse" />
                           <span className="text-[10px] font-black tracking-wider bg-black/35 px-2.5 py-0.5 rounded-full border border-white/10">
                             {currentLang === "ar" ? "تعديل المظهر 🖼️🎥" : "Change Media 🖼️🎥"}
                           </span>
                        </div>
                      )}
                      </div>

                      {/* 📚 Premium Vintage Book Cover Card for Public Library (المكتبة العامة) - Sudanese Theme */}
                      <div
                        onClick={handleLibraryClick}
                        className="w-28 h-36 sm:w-32 sm:h-44 shrink-0 bg-gradient-to-b from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 p-2.5 flex flex-col justify-between rounded-2xl shadow-xl relative cursor-pointer hover:shadow-amber-500/10 hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] overflow-hidden select-none group"
                      >
                         {/* Dashed Gold Inner Stitches */}
                         <div className="absolute inset-1.5 border border-dashed border-amber-500/20 rounded-xl pointer-events-none" />
                         
                         {/* Vintage Top Ribbon */}
                         <div className="bg-[#1E0D06]/70 px-1.5 py-0.5 rounded border border-amber-500/20 text-[7px] sm:text-[8px] font-bold text-amber-400 text-center relative z-10 mx-auto w-fit tracking-wider">
                           كنوز المعرفة 📜
                         </div>
                         
                         {/* Book Title & Subtitle */}
                         <div className="text-center space-y-0.5 relative z-10 my-auto">
                           <h4 className="text-[11px] sm:text-[13px] font-black text-amber-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] leading-tight font-sans">
                             المكتبة العامة
                           </h4>
                           <p className="text-[7px] sm:text-[8px] font-medium text-amber-400/80 leading-none">
                             الكتب التفاعلية والمصادر
                           </p>
                         </div>
                         
                         {/* Golden Seal Stamp */}
                         <div className="relative z-10 mx-auto flex items-center justify-center">
                           <div className="w-5 h-5 rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/10 group-hover:animate-spin">
                             <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                           </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 🎥 Live Lessons Widget for Students */}
                {liveLessons.length > 0 && (
                   <div className="bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-3xl p-6 text-right space-y-4 mb-6 shadow-2xs" dir="rtl">
                      <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
                         <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D21034] opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D21034]"></span>
                            </span>
                            <h3 className="font-extrabold text-[#5C2C16] text-sm md:text-base flex items-center gap-1.5">
                               <span>🎥 البث المباشر والحصص التفاعلية الفورية</span>
                            </h3>
                         </div>
                         <span className="text-4xs font-bold text-mud/60 bg-cream px-2 py-0.5 rounded-full border border-mud/5">
                            {liveLessons.filter(l => new Date(l.scheduledTime).getTime() + (l.duration * 60 * 1000) > Date.now()).length} حصص نشطة/قادمة
                         </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {liveLessons
                           .filter(l => new Date(l.scheduledTime).getTime() + (l.duration * 60 * 1000) > Date.now()) // Only show active/future
                           .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                           .slice(0, 6) // Max 6 lessons
                           .map((lesson) => {
                              const isPassed = new Date(lesson.scheduledTime).getTime() + (lesson.duration * 60 * 1000) < Date.now();
                              const isActiveNow = new Date(lesson.scheduledTime).getTime() <= Date.now() && !isPassed;

                              // Resolve stage/grade names
                              const stageObj = curriculumData.find(s => s.id === lesson.stageId);
                              const gradeObj = stageObj?.grades.find(g => g.id === lesson.gradeId);
                              const subjObj = gradeObj?.subjects.find(s => s.id === lesson.subjectId);

                              return (
                                 <div 
                                   key={lesson.id} 
                                   className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                                      isActiveNow 
                                        ? "bg-white border-emerald-550 shadow-md shadow-emerald-550/5" 
                                        : "bg-white border-mud/10 hover:border-earthgold/40 hover:shadow-2xs"
                                   }`}
                                 >
                                    <div className="space-y-2 text-right">
                                       <div className="flex items-center justify-between gap-2">
                                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                                             isActiveNow 
                                               ? "bg-emerald-600 text-white" 
                                               : "bg-earthgold/10 text-earthgold border border-earthgold/20"
                                          }`}>
                                             {isActiveNow ? "🔴 جارية الآن" : "📅 حصة مجدولة"}
                                          </span>
                                          <span className="text-[10px] font-bold text-mud/60 font-mono">
                                             ⏱️ {lesson.duration} دقيقة
                                          </span>
                                       </div>

                                       <h4 className="text-xs font-black text-mud line-clamp-2">{lesson.title}</h4>

                                       <div className="flex flex-wrap gap-1.5 text-[9px] text-mud/75">
                                          <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">📚 {stageObj?.name || lesson.stageId}</span>
                                          <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">🏫 {gradeObj?.name || lesson.gradeId}</span>
                                          {subjObj && (
                                             <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">📖 {subjObj.name}</span>
                                          )}
                                       </div>

                                       <div className="space-y-1 text-[10px] text-mud/80 bg-[#FAF5EC]/40 p-2 rounded-xl border border-mud/5 text-right">
                                          <p className="flex items-center gap-1">
                                             <span>👤 المعلم:</span>
                                             <strong className="text-mud font-black">{lesson.teacherName}</strong>
                                          </p>
                                          <p className="flex items-center gap-1">
                                             <span>📅 الموعد:</span>
                                             <span className="font-mono text-earthgold font-bold">
                                                {new Date(lesson.scheduledTime).toLocaleString("ar-SD", { dateStyle: "short", timeStyle: "short" })}
                                             </span>
                                          </p>
                                          {lesson.notes && (
                                             <p className="text-[9px] text-mud/60 border-t border-mud/5 pt-1 mt-1 text-right">
                                                💡 {lesson.notes}
                                             </p>
                                          )}
                                       </div>
                                    </div>

                                    <a
                                      href={lesson.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 duration-150 shadow-2xs ${
                                         isActiveNow
                                           ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                           : "bg-earthgold hover:bg-earthgold/90 text-white"
                                      }`}
                                    >
                                       <Video className="w-3.5 h-3.5 text-white" />
                                       <span>دخول الحصة المباشرة ({lesson.meetingPlatform === "google_meet" ? "Google Meet" : lesson.meetingPlatform === "zoom" ? "Zoom" : "رابط الحصة"})</span>
                                    </a>
                                 </div>
                              );
                           })}
                      </div>
                   </div>
                )}

                {/* Grade Cards Grid */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between border-b border-mud/10 pb-3">
                      <div>
                         <h3 className="font-bold text-[#5C2C16] text-base">{currentLang === "ar" ? "المراحل التعليمية المتاحة" : "Available Educational Stages"}</h3>
                         <p className="text-3xs text-mud/60">{currentLang === "ar" ? "اختر المرحلة لعرض الصفوف والمقررات التفاعلية" : "Select a stage to view school levels and interactive books"}</p>
                      </div>
                      <span className="text-3xs font-extrabold bg-[#D4AF37]/10 text-mud px-2.5 py-1 rounded-lg border border-[#D4AF37]/20">
                         {curriculumData.length} {currentLang === "ar" ? "مراحل مضافة" : "Stages Available"}
                      </span>
                   </div>

                   {/* Elegant Cards Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                      {displayedStages.map((stage) => {
                         const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat;
                         const totalSubjects = stage.grades.reduce((sum, g) => sum + g.subjects.length, 0);
                         
                         return (
                            <div
                              key={stage.id}
                              onClick={() => {
                                 if (isSelected) {
                                    setSelectedStage(null);
                                    setActiveGrade(null);
                                 } else {
                                    setSelectedStage(stage);
                                    setActiveGrade(null);
                                    setShowOnlyFavorites(false);
                                    setShowStudyCamp(false);
                                    setShowEducationalMindMap(false);
                                    setShowStudentChat(false);
                                 }
                              }}
                              className={`group relative p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-300 cursor-pointer transform select-none ${
                                 isSelected
                                   ? "bg-white border-2 border-earthgold shadow-lg scale-[1.01]"
                                   : "bg-white border border-mud/15 hover:border-earthgold/50 shadow-sm hover:translate-y-[-2px] hover:shadow-md"
                              }`}
                            >
                               {/* Circle Portrait Badge representing stage */}
                               <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#FDFBF7] border border-mud/10 shrink-0 mb-3 text-2xl shadow-inner group-hover:scale-105 transition-transform">
                                  {stage.id === "kindergarten" ? "🧸" : stage.id === "primary" ? "🎒" : stage.id === "middle" ? "📚" : "🎓"}
                                </div>

                               <h3 className="text-mud font-black text-xs md:text-sm line-clamp-1">{t(stage.name)}</h3>
                               <p className="text-4xs text-mud/60 mt-1 leading-relaxed line-clamp-2 px-1">
                                  {stage.description}
                                </p>

                                <div className="mt-3 flex items-center gap-1 text-[9px] bg-[#FDFBF7] px-2 py-0.5 rounded-full border border-mud/5 text-mud/85 font-extrabold">
                                  <span>📚</span>
                                  <span>{currentLang === "ar" ? `المواد: ${totalSubjects}` : `Subjects: ${totalSubjects}`}</span>
                                </div>

                                <button
                                  className={`w-full mt-4 py-2 rounded-xl text-3xs font-extrabold transition-all duration-155 [font-family:inherit] cursor-pointer flex items-center justify-center gap-1 border ${
                                      isSelected
                                        ? "bg-earthgold text-white border-earthgold shadow-md shadow-earthgold/10"
                                        : "bg-white border-mud/20 text-mud hover:bg-cream"
                                  }`}
                                >
                                  <span>{isSelected ? "📋" : "🔍"}</span>
                                  <span>{isSelected ? (currentLang === "ar" ? "الصف مفتوح" : "Opened") : (currentLang === "ar" ? "تصفح الكتب" : "Browse")}</span>
                                </button>
                            </div>
                         );
                      })}
                   </div>
                </div>

                {/* Custom Section for Selected Stage expanded lists below the grid! */}
                   {selectedStage && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat && (() => {
                      const renderedGrades = currentUser && currentUser.user_role === "student" && currentUser.grade_id
                        ? selectedStage.grades.filter(g => g.id === currentUser.grade_id)
                        : selectedStage.grades;

                      return (
                         <div id="selected-stage-section" className="bg-white/95 rounded-3xl p-6 border border-mud/15 shadow-md mt-6 animate-fadeIn space-y-6 select-text text-right" dir="rtl">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-mud/10 pb-4">
                              <div className="space-y-1 text-center sm:text-right">
                                 <span className="text-[10px] text-earthgold font-black uppercase tracking-widest block">{t("gradesLevels")}</span>
                                 <h4 className="text-base font-black text-mud flex items-center justify-center sm:justify-start gap-1.5">
                                    <span>{selectedStage.id === "kindergarten" ? "🧸" : selectedStage.id === "primary" ? "🎒" : selectedStage.id === "middle" ? "📚" : "🎓"}</span>
                                    <span>{currentLang === "ar" ? `مناهج تفصيلية: ${selectedStage.name}` : `${t(selectedStage.name)} Detailed Curriculae`}</span>
                                 </h4>
                              </div>

                              <div className="text-3xs text-mud bg-[#FDFBF7] px-3.5 py-1.5 rounded-xl border border-mud/10 font-bold flex items-center gap-1">
                                 <CheckCircle className="w-3.5 h-3.5 text-earthgold animate-pulse" />
                                 {currentLang === "ar" ? (
                                    <span>الصفوف: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مادة دراسية متاحة)</span>
                                 ) : (
                                    <span>Levels: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} interactive classes)</span>
                                 )}
                              </div>
                            </div>

                            {/* List of Grades (Accordion) with light beautiful cream boxes */}
                            <div className="space-y-4">
                               {renderedGrades.map((grade) => {
                                  const isGradeExpanded = activeGrade?.id === grade.id;

                                  const filteredSubjects = grade.subjects.filter(subj => {
                                     if (subj.hidden && !isAdminLoggedIn) return false;
                                     const matchesSearch = !searchQuery || 
                                       subj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       subj.curriculumSummary.toLowerCase().includes(searchQuery.toLowerCase());
                                     
                                     if (!matchesSearch) return false;

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
                                     <div key={grade.id} id={`grade-card-${grade.id}`} className="bg-[#FDFBF7] border border-mud/10 rounded-2xl overflow-hidden shadow-2xs text-right">
                                        <button
                                          onClick={() => {
                                             if (isGradeExpanded) {
                                                setActiveGrade(null);
                                             } else {
                                                setActiveGrade(grade);
                                             }
                                          }}
                                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-cream/40 text-right cursor-pointer group"
                                        >
                                           <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-xl bg-white border border-mud/15 flex items-center justify-center text-mud font-extrabold shadow-sm">
                                                 {grade.subjects.length}
                                              </div>
                                              <div>
                                                 <h5 className="font-extrabold text-mud text-xs sm:text-sm group-hover:text-earthgold transition-colors">{grade.name}</h5>
                                                 <p className="text-4xs text-mud/60 mt-0.5">{currentLang === "ar" ? "اضغط لعرض الكتب والمذكرات والروابط التفاعلية" : "Click to view textbooks, cheat sheets & courses"}</p>
                                              </div>
                                           </div>
                                           <ChevronDown className={`w-4 h-4 text-mud/65 transform transition-transform ${isGradeExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isGradeExpanded && (
                                           <div className="border-t border-mud/5 p-5 bg-white space-y-4">
                                              {/* Categorizer tabs */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FDFBF7] p-2.5 rounded-2xl border border-mud/5">
                                                 <span className="text-4xs font-bold text-mud/70 pr-1">{currentLang === "ar" ? "تصفية المحتويات:" : "Content filters:"}</span>
                                                 <div className="flex flex-wrap gap-1">
                                                    <button onClick={() => setCategoryFilter("all")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "all" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>الكل</button>
                                                    <button onClick={() => setCategoryFilter("books")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "books" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>📚 كتب الدراسية</button>
                                                    <button onClick={() => setCategoryFilter("videos")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "videos" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>🎥 شروحات الفيديو</button>
                                                    <button onClick={() => setCategoryFilter("interactive")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "interactive" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>🔬 معامل تفاعلية</button>
                                                 </div>
                                              </div>

                                              {/* Grid of Subject items */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                 {filteredSubjects.map((subject) => {
                                                    const isFav = favoriteSubjects.includes(subject.id);
                                                    const isDone = completedLessons.includes(subject.id);

                                                    return (
                                                       <div
                                                         key={subject.id}
                                                         onClick={() => handleOpenSubject(subject as any)}
                                                         className="relative p-4 bg-[#FDFBF7] hover:bg-white border border-mud/10 hover:border-earthgold rounded-xl transition-all duration-150 cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-sm"
                                                       >
                                                          {/* Star / Done checklists */}
                                                          <div className="flex justify-between items-start gap-2 mb-3">
                                                             <div className="p-2 bg-white rounded-lg border border-mud/5 text-base shadow-sm">
                                                                🌱
                                                             </div>
                                                             <div className="flex gap-1">
                                                                <button onClick={(e) => toggleFavorite(subject.id, e)} className={`p-1 bg-white rounded border cursor-pointer text-3xs ${isFav ? 'text-amber-500 border-amber-400' : 'text-mud/40 border-mud/10'}`}>⭐</button>
                                                                <button onClick={(e) => toggleLessonComplete(subject.id, e)} className={`p-1 bg-white rounded border cursor-pointer text-3xs ${isDone ? 'text-emerald-500 border-emerald-400' : 'text-mud/40 border-mud/10'}`}>✓</button>
                                                             </div>
                                                          </div>

                                                          <div className="space-y-1">
                                                             <h3 className="font-bold text-mud text-xs group-hover:text-earthgold truncate">{subject.name}</h3>
                                                             <p className="text-[10px] text-mud/70 leading-relaxed line-clamp-2">{subject.curriculumSummary}</p>
                                                          </div>

                                                          <div className="mt-4 pt-2 border-t border-mud/5 flex items-center justify-between text-4xs text-[#C57530] font-medium">
                                                             <span className="flex items-center gap-1">
                                                                ✨ {currentLang === "ar" ? "المنهج التفاعلي" : "Interactive Class"}
                                                             </span>
                                                             <span className="group-hover:text-mud font-semibold flex items-center gap-0.5">
                                                                {currentLang === "ar" ? "تصفح" : "Open"} 
                                                             </span>
                                                          </div>
                                                       </div>
                                                    );
                                                 })}
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      );
                   })()}
                </div>
             </div>
        ) : (
          // Stage selection selector tabs
          <section className="space-y-4 relative overflow-hidden p-1 rounded-2xl">
          {/* Ambient kid-friendly background sparkles or clouds */}
          {isKidModeActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none z-0">
              <div className="absolute top-4 left-[10%] text-3xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '4s' }}>🎈</div>
              <div className="absolute bottom-10 left-[25%] text-2xl animate-pulse" style={{ animationDelay: '1.2s' }}>⭐</div>
              <div className="absolute top-10 right-[15%] text-4xl animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '6s' }}>✨</div>
              <div className="absolute bottom-4 right-[5%] text-2xl animate-pulse" style={{ animationDelay: '1.9s' }}>🎈</div>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-4 relative z-10">
            <div>
              <h2 className="text-base font-bold text-slate-300">{t("stagesTitle")}</h2>
              <p className="text-2xs text-slate-500 mt-1">{t("stagesSub")}</p>
            </div>
            
            {/* Quick notification of custom structure */}
            <div className="text-2xs text-amber-450 bg-amber-955/10 border border-amber-900/30 rounded-lg py-1.5 px-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("structureNote")}</span>
            </div>
          </div>

          {/* Grid of Stage Selector Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
            {displayedStages.map((stage) => {
              const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat;
              
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
                        setShowEducationalMindMap(false);
                        setShowStudentChat(false);
                      }
                    }}
                    className={
                      isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                        ? `relative p-3 sm:p-5 rounded-3xl text-center xs:text-right border-2 transition-all text-xs md:text-sm shadow-md overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? "bg-gradient-to-br from-pink-900/40 via-amber-900/20 to-indigo-900/40 border-pink-400 ring-4 ring-pink-500/20 shadow-lg shadow-pink-500/10 scale-[1.02]" 
                              : "bg-slate-900/70 border-pink-500/30 hover:border-pink-400 hover:bg-slate-900/90"
                          }`
                        : `relative p-3 sm:p-5 rounded-2xl text-center xs:text-right border transition-all text-xs md:text-sm shadow-sm overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? "bg-slate-900 border-emerald-600 shadow-md shadow-emerald-950/20" 
                              : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-800"
                          }`
                    }
                  >
                    {/* Decorative Subtle Accent Tag for selected */}
                    {isSelected && (
                      <span className={`absolute top-0 right-0 bottom-0 w-1.5 ${
                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                          ? "bg-gradient-to-b from-pink-400 via-yellow-400 to-indigo-400"
                          : "bg-gradient-to-b from-emerald-500 to-emerald-700"
                      }`} />
                    )}

                    <div className="flex flex-col xs:flex-row items-center xs:items-start gap-2 sm:gap-4">
                      <div className={`p-2.5 sm:p-3 rounded-2xl transition-all shrink-0 ${
                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                          ? isSelected
                            ? "bg-pink-500/30 text-pink-350 scale-110 rotate-3"
                            : "bg-pink-950/40 text-pink-400 group-hover:scale-105"
                          : isSelected 
                            ? "bg-emerald-600/20 text-emerald-400" 
                            : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                      }`}>
                        {getStageIcon(stage.icon)}
                      </div>
                      <div className="space-y-1 text-center xs:text-right min-w-0 w-full">
                        <h3 className={`font-black tracking-wide truncate ${
                          isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-300 font-sans text-xs md:text-sm"
                            : "font-bold text-slate-100 text-xs md:text-sm"
                        }`}>
                          {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                            ? `🎈 ${t(stage.name)} 🍭`
                            : t(stage.name)}
                        </h3>
                        <p className="text-[10px] sm:text-2xs text-slate-400 line-clamp-1">
                          {currentLang === "ar" 
                            ? stage.description 
                            : (stage.id === "kindergarten" 
                               ? "Kindergarten classes and infant development curriculum." 
                               : stage.id === "elementary" 
                                 ? "Comprehensive elementary primary school courses." 
                                 : stage.id === "intermediate" 
                                   ? "Intermediate general education classes." 
                                   : stage.id === "secondary" 
                                     ? "High school secondary general curricula." 
                                     : stage.description)}
                        </p>
                        <span className="text-[9px] sm:text-3xs text-emerald-400 font-bold block mt-1">
                          {currentLang === "ar" 
                            ? `الصفوف: ${stage.grades.length}` 
                            : `Classes: ${stage.grades.length}`}
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
                      <div id="selected-stage-section" className="col-span-2 md:col-span-3 lg:col-span-5 bg-slate-900/50 border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-6 mt-1 mb-4 select-text">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-850 pb-4">
                          <div className="space-y-1 text-center sm:text-right">
                            <span className="text-3xs text-emerald-400 font-mono font-black uppercase tracking-widest block">{t("gradesLevels")}</span>
                            <h4 className="text-sm font-black text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                              {getStageIcon(stage.icon)}
                              <span>{currentLang === "ar" ? `مناهج ${stage.name}` : `${t(stage.name)} Curricula`}</span>
                            </h4>
                          </div>
                          
                          <div className="text-3xs text-slate-400 font-bold flex items-center gap-1.5 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-855 animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            {currentLang === "ar" ? (
                              <span>مجموع الصفوف: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مادة تفاعلية مضافة)</span>
                            ) : (
                              <span>Total Levels: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} interactive subjects)</span>
                            )}
                          </div>
                        </div>

                        {/* 🎈 Kid mode mascot & study companion block */}
                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") && (
                          <div className="bg-gradient-to-br from-pink-600/10 via-amber-500/5 to-indigo-600/10 border-2 border-pink-500/35 rounded-3xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl select-none">
                            {/* Floating elements inside mascot banner */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 text-xs text-slate-300">
                              <span className="absolute top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎈</span>
                              <span className="absolute bottom-3 left-20 text-xl animate-pulse" style={{ animationDelay: '0.8s' }}>⭐</span>
                              <span className="absolute top-1/2 right-12 text-lg animate-bounce" style={{ animationDelay: '1.2s' }}>🧸</span>
                              <span className="absolute bottom-2 right-1/4 text-2xl animate-pulse" style={{ animationDelay: '1.8s' }}>🚀</span>
                            </div>

                            {/* Cute Fox Mascot face */}
                            <div 
                              onClick={handleMascotClick}
                              className={`relative w-20 h-20 shrink-0 flex items-center justify-center bg-transparent cursor-pointer transform transition-transform duration-300 active:scale-95 ${
                                mascotAnimState === "celebrate" 
                                  ? "animate-bounce scale-110" 
                                  : mascotAnimState === "speak" 
                                    ? "scale-105 rotate-3" 
                                    : "hover:scale-105"
                              }`}
                              title={currentLang === "ar" ? "اضغط على سمسم الثعلب ليقول شيئاً ممتعاً!" : "Tap Semsem to hear a tip!"}
                            >
                              {/* Floppy ears */}
                              <div className="absolute -top-1 -right-1 w-8 h-10 bg-amber-500 rounded-ellipse rotate-45 transform origin-bottom-left border-2 border-slate-900 flex items-center justify-center p-0.5">
                                <span className="w-5 h-7 bg-pink-300 rounded-ellipse" />
                              </div>
                              <div className="absolute -top-1 -left-1 w-8 h-10 bg-amber-500 rounded-ellipse -rotate-45 transform origin-bottom-right border-2 border-slate-900 flex items-center justify-center p-0.5">
                                <span className="w-5 h-7 bg-pink-300 rounded-ellipse" />
                              </div>
                              
                              {/* Round face */}
                              <div className="w-16 h-16 bg-amber-400 rounded-full border-2 border-slate-900 shadow-md relative flex items-center justify-center">
                                {/* Shiny eyes */}
                                <div className="absolute top-5 left-3.5 w-3.5 h-3.5 bg-slate-900 rounded-full flex items-start justify-start p-0.5">
                                  <span className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                <div className="absolute top-5 right-3.5 w-3.5 h-3.5 bg-slate-900 rounded-full flex items-start justify-start p-0.5">
                                  <span className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                {/* Cheeks */}
                                <div className="absolute top-8 left-1.5 w-3 h-1.5 bg-rose-400 rounded-full opacity-80" />
                                <div className="absolute top-8 right-1.5 w-3 h-1.5 bg-rose-400 rounded-full opacity-80" />
                                {/* Muzzle & nose */}
                                <div className="absolute bottom-3.5 w-5 h-3 bg-white rounded-full border border-slate-900 flex items-center justify-center">
                                  <span className="w-1.5 h-1 bg-slate-900 rounded-full -mt-1" />
                                </div>
                                {/* Sparkle sticker */}
                                <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white rounded-full p-0.5 border border-slate-900">
                                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                                </div>
                              </div>
                            </div>

                            {/* Talk Speech Bubble */}
                            <div className="flex-1 space-y-2 relative text-right">
                              <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 shadow-inner">
                                <span className="text-[10px] text-pink-400 font-extrabold block mb-1">
                                  🦊 {currentLang === "ar" ? "ثعلب الفنك السوداني العبقري سمسم يقول لك:" : "Smart Sudan Fox Semsem says:"}
                                </span>
                                <p className="text-xs md:text-sm font-black text-slate-100 leading-relaxed font-sans">
                                  {mascotMessage}
                                </p>
                              </div>
                            </div>

                            {/* Kid's Star Badges Tracker (لوحة أوسمة النجوم للطلاب) */}
                            <div className="w-full md:w-auto flex flex-col items-center md:items-end justify-center bg-slate-950/40 p-3 rounded-2xl border border-slate-850/80 shrink-0 gap-2 font-sans">
                              <span className="text-[10px] font-black text-pink-400">🏅 {currentLang === "ar" ? "نقاط البطل وأوسمة النجوم:" : "Little Champion Medal Board:"}</span>
                              <div className="flex gap-3">
                                {/* Badge 1 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 1 
                                      ? "bg-amber-955/40 border-yellow-500/60 text-yellow-400 shadow-md shadow-yellow-950/30 scale-105" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام البطل المبتدئ: أكمل دراسة مادة واحدة تفاعلية" : "Bud Champion: complete 1 lesson"}
                                >
                                  <span className="text-lg">⭐</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "وسام البطل" : "Bud Medal"}
                                  </span>
                                </div>

                                {/* Badge 2 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 3 
                                      ? "bg-emerald-955/40 border-emerald-500/60 text-emerald-400 shadow-md shadow-emerald-950/30 scale-105" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام البطل المستكشف: أكمل دراسة ٣ مواد تفاعلية" : "Smart Explorer: complete 3 lessons"}
                                >
                                  <span className="text-lg">🏆</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "ذكي ومكتشف" : "Explorer"}
                                  </span>
                                </div>

                                {/* Badge 3 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 5 
                                      ? "bg-pink-955/40 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/30 scale-105 animate-pulse" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام ملك الذكاء السوداني: أكمل دراسة ٥ مواد تفاعلية" : "Sudan Star: complete 5 lessons"}
                                >
                                  <span className="text-lg">🚀</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "سوبرمان المذاكرة" : "Superstar"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

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
                                id={`grade-card-${grade.id}`}
                                layout
                                className={
                                  isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                    ? "bg-slate-900 border-2 border-pink-500/40 rounded-3xl overflow-hidden shadow-md shadow-pink-950/10 hover:border-pink-400 transition-all"
                                    : "bg-slate-950/45 border border-slate-850 rounded-xl overflow-hidden shadow-sm"
                                }
                              >
                                <button
                                  onClick={() => {
                                    if (isGradeExpanded) {
                                      setActiveGrade(null);
                                    } else {
                                      setActiveGrade(grade);
                                    }
                                  }}
                                  className={`w-full px-5 py-4 flex items-center justify-between text-right cursor-pointer group transition-all ${
                                    isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                      ? "hover:bg-pink-500/10"
                                      : "hover:bg-slate-900/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 text-right w-full">
                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 border border-slate-900 flex items-center justify-center text-lg shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0 select-none">
                                        ⭐
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 font-extrabold text-xs shadow-inner shrink-0 leading-none">
                                        {grade.subjects.length}
                                      </div>
                                    )}
                                    <div className="text-right">
                                      <h5 className={`font-black tracking-wide text-xs sm:text-sm transition-colors ${
                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                          ? "text-yellow-300 group-hover:text-yellow-250 font-sans text-[13px] sm:text-sm"
                                          : "text-slate-100 group-hover:text-emerald-300"
                                      }`}>
                                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? `${t(grade.name)} 🍭` : t(grade.name)}
                                      </h5>
                                      {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                        <p className="text-2xs text-pink-300/90 font-bold mt-1 flex items-center gap-1 leading-snug">
                                          <span className="animate-pulse">🎈</span>
                                          <span>{currentLang === "ar" ? "اضغط هنا للبدء بأروع مغامرة لليوم!" : "Tap to play today's sweet class!"}</span>
                                        </p>
                                      ) : (
                                        <p className="text-3xs text-slate-500 mt-0.5 flex items-center gap-1">
                                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                          <span>{currentLang === "ar" ? "اضغط لتصفح الكتب والمقررات والفيديوهات التفاعلية" : "Click to view books, handouts and interactive lessons"}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`transition-colors shrink-0 ${isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? "text-pink-400 group-hover:text-yellow-355" : "text-slate-400 group-hover:text-slate-200"}`}>
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
                                            <span>{currentLang === "ar" ? "تصنيف محتوى المواد وعرض المقررات:" : "Content filter & material view:"}</span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("all")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                                                categoryFilter === "all"
                                                  ? "bg-emerald-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-slate-205"
                                              }`}
                                            >
                                              {currentLang === "ar" ? "الكل" : "All"} ({grade.subjects.length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("books")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "books"
                                                  ? "bg-blue-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-blue-405"
                                              }`}
                                            >
                                              📚 {currentLang === "ar" ? "كتب ومذكرات" : "Books & Handouts"} ({grade.subjects.filter(s => !!s.pdfUrl || !!s.memoPdfUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("videos")}
                                              className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "videos"
                                                  ? "bg-rose-600 text-white shadow-md shadow-rose-955/30"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-rose-400"
                                              }`}
                                            >
                                              🎥 {currentLang === "ar" ? "فيديوهات شروحات" : "Video Explanations"} ({grade.subjects.filter(s => !!s.videoUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("interactive")}
                                              className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "interactive"
                                                  ? "bg-purple-600 text-white shadow-md shadow-purple-955/30"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-purple-400"
                                              }`}
                                            >
                                              🔬 {currentLang === "ar" ? "معامل وبوابات تفاعلية" : "Interactive Labs"} ({grade.subjects.filter(s => !!s.interactiveUrl).length})
                                            </button>
                                          </div>
                                        </div>

                                        {/* Grid of subjects */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {filteredSubjects.map((subject) => {
                                            let isFavorite = favoriteSubjects.includes(subject.id);
                                            let isLessonComplete = completedLessons.includes(subject.id);

                                            return (
                                              <div
                                                key={subject.id}
                                                onClick={() => handleOpenSubject({ ...subject, gradeName: grade.name, gradeId: grade.id } as any)}
                                                className={
                                                  isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                    ? "group relative p-5 bg-gradient-to-br from-indigo-950 via-purple-900/20 to-pink-950/20 border-2 border-pink-500/40 hover:border-yellow-400 rounded-3xl transition-all duration-305 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
                                                    : "group relative p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-650/80 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
                                                }
                                              >
                                                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {/* Action buttons (Favorites, studied toggle) */}
                                                <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(subject.id, e); }}
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
                                                    onClick={(e) => { e.stopPropagation(); toggleLessonComplete(subject.id, e); }}
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
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-350 to-pink-500 border border-pink-400/40 flex items-center justify-center text-2xl shadow-md group-hover:scale-115 group-hover:rotate-6 transition-all duration-300 shrink-0 select-none mt-1">
                                                        {getKidSubjectEmoji(subject.name)}
                                                      </div>
                                                    ) : (
                                                      <div className={`p-2.5 rounded-lg ${subject.colorClass} border flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                                                        <DynamicIcon name={subject.iconName} className="w-5 h-5" />
                                                      </div>
                                                    )}
                                                    <div className="space-y-0.5 max-w-[65%]">
                                                      <h6 className={`font-black tracking-wide transition-colors truncate ${
                                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? "text-yellow-300 group-hover:text-yellow-250 font-sans text-sm"
                                                          : "text-white text-xs font-extrabold group-hover:text-emerald-300"
                                                      }`}>{t(subject.name)}</h6>
                                                      <span className={`text-3xs truncate block ${
                                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? "text-pink-300 font-bold"
                                                          : "text-slate-500"
                                                      }`}>
                                                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? (currentLang === "ar" ? "🪐 مغامرة ذكية ولذيذة" : "🪐 Happy Fun Lesson")
                                                          : (currentLang === "ar" ? "السودان • مادة دراسية أساسية" : "Sudan • Interactive Course")}
                                                      </span>
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

                                                <div className="mt-3.5 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-3xs">
                                                  <span className="text-emerald-400/90 font-black flex items-center gap-0.5">
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                      <span className="text-sm select-none animate-bounce mr-1">🎈</span>
                                                    ) : (
                                                      <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                                                    )}
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                      ? (currentLang === "ar" ? "🪐 العب وانطلق يا بطل!" : "🪐 Let's Play & Learn!")
                                                      : (currentLang === "ar" ? "شرح المعلم التفاعلي نشط" : "Join Interactive Class")}
                                                  </span>
                                                   {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                    <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black group-hover:scale-110 active:scale-95 transition-all shadow select-none leading-none">
                                                      {currentLang === "ar" ? "ابدأ 🍭" : "Start 🍭"}
                                                    </span>
                                                   ) : (
                                                    <span className="text-slate-400 font-bold group-hover:text-emerald-400 group-hover:translate-x-[-1px] transition-all flex items-center gap-0.5">
                                                      دخول
                                                      <ChevronLeft className="w-3 h-3 text-emerald-500" />
                                                    </span>
                                                   )}
                                                </div>
                                              </div>
                                            );
                                          })}

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

                                        {filteredSubjects.length === 0 && (
                                          <div className="text-center py-12 px-6 bg-slate-905/20 border border-slate-800/60 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
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

            {/* 📚 Premium Digital Book Cover Card for Public Library (المكتبة العامة) - Legacy Theme */}
            <button
              onClick={handleLibraryClick}
              className="relative p-5 rounded-2xl text-right border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 hover:bg-slate-900 hover:border-emerald-400 transition-all text-xs md:text-sm shadow-lg overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[140px] select-none"
            >
              {/* Subtle pulsing background glow */}
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              {/* Top Row / Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  المكتبة الرقمية 🌐
                </span>
                <BookOpen className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mt-3">
                <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                  المكتبة العامة السودانية
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  مصادر دراسية خارجية مثرية وكتب تفاعلية قيّمة
                </p>
              </div>

              {/* Action indicator */}
              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between w-full text-[10px]">
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>تصفح الكتب والمصادر</span>
                </span>
                <span className="text-slate-500 font-bold group-hover:text-emerald-400 transition-colors">
                  دخول 🚀
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

        {/* Render Admin Dashboard, Favorited Subjects when filtered, otherwise Stage Exploration */}
        {showAdminDashboard ? (
          <motion.div
            id="admin-dashboard-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminDashboard 
              stages={curriculumData}
              onUpdateCurriculum={(newStages) => {
                setCurriculumData(newStages);
                localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newStages));
                saveCurriculumToCloudAutomatically(newStages);
              }}
              onClose={() => setShowAdminDashboard(false)}
              breakingNews={breakingNews}
              onUpdateBreakingNews={handleUpdateBreakingNews}
            />
          </motion.div>
        ) : showOnlyFavorites ? (
          <motion.div
            id="favorites-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`flex flex-col sm:flex-row items-center justify-between p-6 md:p-8 rounded-3xl gap-6 shadow-md border ${
              siteTheme === "sudanese"
                ? "bg-white border-mud/15 text-mud"
                : "bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/10 border-slate-800/85 text-slate-100 shadow-xl"
            }`}>
              <div className="space-y-2 text-center sm:text-right">
                <span className={`text-xs font-bold uppercase tracking-widest ${siteTheme === "sudanese" ? "text-earthgold" : "text-amber-400"}`}>تصفح قائمتك الخاصة:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <h3 className={`text-xl md:text-2xl font-black ${siteTheme === "sudanese" ? "text-[#5C2C16]" : "text-slate-100 animate-pulse"}`}>المواد المفضلة لديك ⭐</h3>
                </div>
                <p className={`text-xs ${siteTheme === "sudanese" ? "text-mud/80" : "text-slate-400"}`}>لقد قمت بإضافة {favoritedSubjectsList.length} مادة للمفضلة لتسهيل مراجعتها والمتابعة السريعة للفيديوهات والمعامل التفاعلية.</p>
              </div>
              
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition-all shadow-md shrink-0 ${
                  siteTheme === "sudanese"
                    ? "bg-[#5C2C16] text-[#FDFBF7] hover:bg-[#4A200B] border-[#4A200B]"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200"
                }`}
              >
                العودة للمنهج السوداني الكامل 🇸🇩
              </button>
            </div>

            {favoritedSubjectsList.length === 0 ? (
              <div className={`text-center py-20 rounded-3xl border border-dashed space-y-4 max-w-2xl mx-auto ${
                siteTheme === "sudanese"
                  ? "bg-white border-mud/20 text-mud"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-200"
              }`}>
                <div className={`p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border ${
                  siteTheme === "sudanese"
                    ? "bg-earthgold/5 text-earthgold border-earthgold/10"
                    : "bg-yellow-500/5 text-yellow-500 border-yellow-500/10"
                }`}>
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${siteTheme === "sudanese" ? "text-mud" : "text-slate-200"}`}>لا توجد مواد مفضلة حتى الآن</p>
                  <p className={`text-xs max-w-md mx-auto leading-relaxed ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>
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
                        className={`relative p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                          siteTheme === "sudanese"
                            ? "bg-white hover:bg-cream/20 border-mud/10 hover:border-earthgold hover:shadow-md"
                            : "bg-slate-900 border-slate-800 hover:border-emerald-600 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-950/60"
                        }`}
                      >
                        {/* Action buttons (Favorites, studied toggle) */}
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(subject.id, e); }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isFavorite 
                                ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800/40' 
                                : siteTheme === "sudanese"
                                  ? 'bg-[#FDFBF7] text-mud/40 hover:text-mud border-mud/10'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-200 border-slate-700'
                            }`}
                            title="المفضلة"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLessonComplete(subject.id, e); }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isLessonComplete 
                                ? 'bg-emerald-955/40 text-emerald-400 border-emerald-900/50' 
                                : siteTheme === "sudanese"
                                  ? 'bg-[#FDFBF7] text-mud/40 hover:text-mud border-mud/10'
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
                              <h6 className={`font-extrabold text-sm truncate ${
                                siteTheme === "sudanese" ? "text-mud" : "text-white"
                              }`}>{subject.name}</h6>
                              <span className="text-3xs text-emerald-450 font-bold block truncate">
                                {subject.stageName} • {subject.gradeName}
                              </span>
                            </div>
                          </div>

                          {/* Abstract brief summary of curriculum */}
                          <p className={`text-2xs leading-relaxed line-clamp-3 ${
                            siteTheme === "sudanese" ? "text-mud/85" : "text-slate-400"
                          }`}>
                            {subject.curriculumSummary}
                          </p>
                        </div>

                        {/* Footer: entering triggers interaction */}
                        <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-2xs ${
                          siteTheme === "sudanese" ? "border-mud/10" : "border-slate-800/50"
                        }`}>
                          <span className="text-emerald-455 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {currentLang === "ar" ? "بوابة المدرس والمناهج التفاعلية" : "Interactive Portal"}
                          </span>
                          <span className={`font-medium flex items-center gap-0.5 ${
                            siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
                          }`}>
                            {currentLang === "ar" ? "دخول" : "Open"}
                            <ChevronLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        ) : showEducationalMindMap ? (
          <motion.div
            key="mind-map-view"
            id="mind-map-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <EducationalMindMap 
              stages={curriculumData}
              currentLang={currentLang}
              onSelectSubject={handleOpenSubject}
              activeStage={selectedStage}
            />
          </motion.div>
        ) : showStudyCamp ? (
          <motion.div
            key="study-camp-view"
            id="study-camp-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <StudyCamp stages={displayedStages} />
          </motion.div>
        ) : (
          null
        )}
      </main>

        {/* Sidebar Vertical Chat Space */}
        <AnimatePresence>
          {showStudentChat && (
            <>
              {/* Mobile/Tablet Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/70 z-45"
                onClick={() => setShowStudentChat(false)}
              />

              <motion.div
                initial={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                transition={{ type: "spring", damping: 28, stiffness: 140 }}
                className="fixed lg:static inset-y-0 right-0 lg:inset-auto z-50 lg:z-40 w-full max-w-[460px] lg:w-[480px] shrink-0 border-s border-slate-800/60 bg-slate-950/95 lg:bg-slate-950/20 shadow-2xl lg:shadow-none flex flex-col"
              >
                <div className="h-full lg:h-[calc(100vh-100px)] lg:sticky lg:top-4 overflow-y-auto p-4 lg:p-6 w-full flex flex-col justify-between">
                  {/* Drawer Header for Mobile */}
                  <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60">
                    <span className="font-extrabold text-xs text-slate-200">
                      {currentLang === "ar" ? "غرفة نقاش ومذاكرة الطلاب 🤝" : "Student Discussion Room 🤝"}
                    </span>
                    <button 
                      onClick={() => setShowStudentChat(false)}
                      className="p-1 px-3 text-2xs font-extrabold text-rose-400 bg-rose-955/30 border border-rose-900/40 rounded-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {currentLang === "ar" ? "إغلاق" : "Close"}
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <StudentChatRoom 
                      currentUser={currentUser}
                      currentLang={currentLang}
                      isAdminLoggedIn={isAdminLoggedIn}
                      onTriggerAuth={() => {
                        setShowUserModal(true);
                        setUserModalTab("login");
                      }}
                      onClose={() => setShowStudentChat(false)}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
            onDeleteSubject={deleteSubject}
            isAdminActive={hasEditPermissions}
            isAdminLoggedIn={isAdminLoggedIn}
            currentLang={currentLang}
            siteTheme={siteTheme}
            liveLessons={liveLessons}
            onRefreshLiveLessons={refreshLiveLessonsList}
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
            isAdminLoggedIn={isAdminLoggedIn}
            currentLang={currentLang}
            siteTheme={siteTheme}
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
                  <WebsiteLogo size={38} />
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
                  onClick={() => {
                    if (currentUser) {
                      setShowUserModal(false);
                    } else {
                      handleEnterAsGuest();
                    }
                  }}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={currentUser ? "إغلاق" : "تصفح كزائر"}
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

                  {userModalTab !== "profile" && (
                    <div className="mt-3.5">
                      <div className="relative flex py-1.5 items-center">
                        <div className="flex-grow border-t border-slate-800/50"></div>
                        <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold select-none">أو</span>
                        <div className="flex-grow border-t border-slate-800/50"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleEnterAsGuest}
                        className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-350 text-2xs font-extrabold rounded-xl transition-all cursor-pointer border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 flex items-center justify-center gap-1.5 active:scale-95 shadow-inner"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>تصفح المنصة كـ زائر (بدون حساب) 🚪✨</span>
                      </button>
                    </div>
                  )}
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
          <div className="flex items-center justify-center gap-2">
            <WebsiteLogo size={24} />
            <p className="font-semibold text-slate-300">🇸🇩 منصة المناهج السودانية التفاعلية لعام 2026</p>
          </div>
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
            className={`fixed bottom-6 left-6 md:left-auto md:right-6 z-[9999] bg-slate-950 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-2xl border ${
              saveStatus.includes("⚠️") || saveStatus.includes("❌")
                ? "border-amber-500/60 text-amber-400"
                : saveStatus.includes("جاري م") || saveStatus.includes("جاري M")
                ? "border-indigo-500/60 text-indigo-400"
                : "border-emerald-500/60 text-emerald-400"
            }`}
          >
            {saveStatus.includes("⚠️") || saveStatus.includes("❌") ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
            ) : saveStatus.includes("جاري م") || saveStatus.includes("جاري M") ? (
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
            )}
            <span className="text-xs font-extrabold text-slate-200">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Mobile & Tablet Custom Notification Permission Prompt */}
      <AnimatePresence>
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-20 inset-x-4 mx-auto max-w-sm bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/40 p-4 rounded-2xl shadow-2xl z-[9999] flex flex-col gap-3 font-sans"
            dir="rtl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-650/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
                <Bell className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1 text-right flex-1 min-w-0">
                <h5 className="text-xs font-black text-slate-100">
                  تفعيل إشعارات الجوال 🔔
                </h5>
                <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
                  احصل على تنبيهات فورية ضمن بار الجوال للمواد الدراسية الجديدة، الدردشات، ورسائل الأساتذة الخاصة بك لمتابعة الدروس أولاً بأول.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDismissPushPrompt}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-[10px] font-bold text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-800"
              >
                ليس الآن
              </button>
              <button
                onClick={handleRequestPushPermission}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black text-white rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/50 flex items-center gap-1 active:scale-95"
              >
                <span>🔔</span>
                <span>تفعيل الآن</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ Custom Banner Image & Video Customizer Modal (with Google Drive animated links integration) */}
      <AnimatePresence>
        {showBannerEditModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white border border-earthgold/30 rounded-3xl overflow-hidden shadow-2xl relative text-right font-sans"
              dir="rtl"
            >
              {/* Pattern Header Background Accent */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF5EC] to-transparent pointer-events-none" />
              
              {/* Modal Upper Top Bar */}
              <div className="p-6 pb-4 border-b border-mud/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600">
                    <Image className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-mud">
                      تعديل مظهر صندوق البانر 🖼️🎥
                    </h5>
                    <p className="text-3xs text-mud/60 mt-0.5 font-medium">
                      يمكنك استخدام صور متحركة GIF أو فيديوهات تفاعلية من قوقل درايف أو روابط مباشرة
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBannerEditModal(false)}
                  className="p-1.5 bg-cream hover:bg-cream/80 border border-mud/10 rounded-xl text-mud/60 hover:text-mud transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 relative z-10">
                {/* Media Type Toggle */}
                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold text-mud/80">
                    نوع المحتوى المرفق 📂
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-cream/40 p-1 rounded-xl border border-mud/10">
                    <button
                      type="button"
                      onClick={() => setTempBannerMediaType("image")}
                      className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tempBannerMediaType === "image"
                          ? "bg-[#D4AF37] text-white shadow-xs"
                          : "text-mud/70 hover:bg-cream/70 hover:text-mud"
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      <span>صورة أو متحركة GIF 🖼️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempBannerMediaType("video")}
                      className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tempBannerMediaType === "video"
                          ? "bg-[#D4AF37] text-white shadow-xs"
                          : "text-mud/70 hover:bg-cream/70 hover:text-mud"
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>فيديو تفاعلي 🎥</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold text-mud/80">
                    رابط ملف قوقل درايف أو رابط خارجي مباشر 🔗
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder={tempBannerMediaType === "video" ? "أدخل رابط فيديو قوقل درايف أو رابط فيديو MP4 مباشر..." : "أدخل رابط صورة قوقل درايف أو أي رابط صورة مباشر..."}
                      value={tempBannerUrl}
                      onChange={(e) => setTempBannerUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs bg-cream/50 hover:bg-cream/80 focus:bg-white border border-mud/15 rounded-xl text-mud font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                    />
                    {tempBannerUrl && (
                      <button
                        onClick={() => setTempBannerUrl("")}
                        className="px-3 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-600 text-3xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        مسح 🗑️
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-mud/55 leading-relaxed font-sans">
                    💡 **صيغة قوقل درايف المدعومة**: الصق رابط المشاركة العادي (مثال: <code className="bg-cream px-1 py-0.5 rounded text-[9px] font-mono break-all text-amber-700">https://drive.google.com/file/d/.../view</code>) وسنقوم تلقائياً بتحويله وتفعيله كمشغل تفاعلي!
                  </p>
                </div>

                {/* Live Preview Block */}
                <div className="space-y-2">
                  <span className="block text-3xs font-black text-mud/50 uppercase tracking-wider">
                    معاينة حية للمظهر الجديد 👁️
                  </span>
                  <div className="h-36 rounded-2xl border border-dashed border-mud/20 bg-cream/20 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {tempBannerUrl ? (
                      tempBannerMediaType === "video" ? (
                        tempBannerUrl.includes("drive.google.com") ? (
                          <iframe
                            src={getGoogleDriveEmbedUrl(tempBannerUrl)}
                            title="Preview Banner Video"
                            className="w-full h-full object-cover rounded-2xl scale-[1.1]"
                            allow="autoplay"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <video
                            src={tempBannerUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        )
                      ) : (
                        <img
                          src={convertGoogleDriveUrl(tempBannerUrl)}
                          alt="Preview Banner"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Warning preview
                          }}
                        />
                      )
                    ) : (
                      <div className="text-center p-4 space-y-1 text-mud/40">
                        <Image className="w-8 h-8 mx-auto stroke-1" />
                        <span className="block text-4xs font-bold">
                          المعالم التراثية التقليدية السودانية الافتراضية
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Helpful tips */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1">
                  <h6 className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
                    <span>🌟</span>
                    <span>خطوات مشاركة الملف (صورة أو فيديو) بشكل صحيح:</span>
                  </h6>
                  <ul className="list-decimal list-inside text-4xs text-mud/70 space-y-1 leading-relaxed font-sans">
                    <li>اضغط بالزر الأيمن على الصورة أو الفيديو داخل قوقل درايف (Google Drive).</li>
                    <li>اختر **مشاركة (Share)** ثم **مشاركة مع الآخرين**.</li>
                    <li>تأكد من تغيير الوصول العام إلى **أي شخص لديه الرابط (Anyone with the link)**.</li>
                    <li>اضغط على **نسخ الرابط (Copy Link)** ثم الصقه في الحقل أعلاه!</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="p-6 bg-[#FAF5EC]/50 border-t border-mud/10 flex gap-3 justify-end relative z-10">
                <button
                  onClick={() => setShowBannerEditModal(false)}
                  className="px-4 py-2 bg-white hover:bg-cream border border-mud/15 text-xs font-bold text-mud rounded-xl transition-all cursor-pointer"
                >
                  إلغاء التغييرات
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("sudan_banner_image_url", tempBannerUrl);
                    localStorage.setItem("sudan_banner_media_type", tempBannerMediaType);
                    setBannerImageUrl(tempBannerUrl);
                    setBannerMediaType(tempBannerMediaType);
                    setShowBannerEditModal(false);
                    setSaveStatus("✨ تم تحديث وحفظ مظهر صندوق البانر وتفعيله بنجاح!");
                    setTimeout(() => setSaveStatus(null), 4000);
                  }}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#bfa032] active:scale-95 text-xs font-black text-white rounded-xl transition-all cursor-pointer shadow-md shadow-amber-950/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتطبيق المظهر الجديد 💾</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}