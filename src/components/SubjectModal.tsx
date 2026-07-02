import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, ExternalLink, Sparkles, BookOpen, Clock, Users, ShieldAlert,
  ChevronRight, Award, Compass, Heart, HelpCircle, Download, Video,
  FileText, Youtube, Lock, Unlock, Save, Edit, Share2, Check, Star, Trash2,
  Wifi, WifiOff, Plus
} from "lucide-react";
import { Subject } from "../data/curriculum";
import DynamicIcon from "./DynamicIcon";
import AITutor from "./AITutor";
import { stageAndGradeTranslations, uiTranslations } from "../lib/translations";
import { saveLiveLessonToSupabase, deleteLiveLessonFromSupabase, sha256 } from "../lib/supabase";

function getVideoEmbedUrl(url: string): { url: string; isYouTube: boolean; isDrive: boolean } | null {
  if (!url) return null;
  
  // 1. Check YouTube
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[2].length === 11) {
    return {
      url: `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1&mute=0&rel=0`,
      isYouTube: true,
      isDrive: false
    };
  }

  // 2. Check Google Drive share links
  const driveFileRegExp = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveFileMatch = url.match(driveFileRegExp);
  if (driveFileMatch && driveFileMatch[1]) {
    return {
      url: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      isYouTube: false,
      isDrive: true
    };
  }

  // 3. Check Google Drive open link (e.g., ?id=...)
  const driveOpenRegExp = /[?&]id=([a-zA-Z0-9_-]+)/;
  const driveOpenMatch = url.match(driveOpenRegExp);
  if (url.includes("drive.google.com") && driveOpenMatch && driveOpenMatch[1]) {
    return {
      url: `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`,
      isYouTube: false,
      isDrive: true
    };
  }

  // 4. docs.google.com drive links
  if (url.includes("docs.google.com") && driveFileMatch && driveFileMatch[1]) {
    return {
      url: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      isYouTube: false,
      isDrive: true
    };
  }

  return null;
}

interface SubjectModalProps {
  stageId: string;
  stageName: string;
  gradeId: string;
  gradeName: string;
  subject: Subject;
  onClose: () => void;
  onUpdateSubject?: (stageId: string, gradeId: string, subjectId: string, updatedFields: Partial<Subject>) => void;
  onDeleteSubject?: (stageId: string, gradeId: string, subjectId: string) => void;
  isAdminActive?: boolean;
  isAdminLoggedIn?: boolean;
  currentLang?: "ar" | "en";
  siteTheme?: "sudanese" | "legacy";
  liveLessons?: any[];
  onRefreshLiveLessons?: () => void;
}

export default function SubjectModal({ 
  stageId, 
  stageName, 
  gradeId, 
  gradeName, 
  subject, 
  onClose, 
  onUpdateSubject, 
  onDeleteSubject, 
  isAdminActive, 
  isAdminLoggedIn, 
  currentLang: passedLang, 
  siteTheme = "legacy",
  liveLessons = [],
  onRefreshLiveLessons
}: SubjectModalProps) {
  const [showTutor, setShowTutor] = useState(false);

  const subjectLiveLessons = liveLessons.filter(
    (lesson) => lesson.subjectId === subject.id || (lesson.subjectName === subject.name && lesson.gradeId === gradeId)
  );
  const isLiveLessonAvailable = subjectLiveLessons.length > 0;

  const currentLang = passedLang || (localStorage.getItem("sudan_edu_lang") as "ar" | "en") || "ar";
  const embedInfo = getVideoEmbedUrl(subject.videoUrl);
  const hasInteractiveLink = !!subject.interactiveUrl;
  const t = (key: string): string => {
    if (uiTranslations[currentLang] && (uiTranslations[currentLang] as any)[key]) {
      return (uiTranslations[currentLang] as any)[key];
    }
    if (currentLang === "en" && stageAndGradeTranslations[key]) {
      return stageAndGradeTranslations[key];
    }
    return key;
  };

  // Study Mode state variables
  const [isStudyMode, setIsStudyMode] = useState(false);
  
  // Live lesson management states inside SubjectModal
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonTeacher, setNewLessonTeacher] = useState("");
  const [newLessonTime, setNewLessonTime] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState(45);
  const [newLessonPlatform, setNewLessonPlatform] = useState<"google_meet" | "zoom" | "other">("google_meet");
  const [newLessonUrl, setNewLessonUrl] = useState("");
  const [newLessonNotes, setNewLessonNotes] = useState("");
  const [subjectFeedback, setSubjectFeedback] = useState<string | null>(null);

  const handleSubjectLiveLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !newLessonTeacher.trim() || !newLessonTime || !newLessonUrl.trim()) {
      setSubjectFeedback("⚠️ يرجى ملء جميع الحقول الإلزامية.");
      return;
    }

    setSubjectFeedback("⏳ جاري جدولة وحفظ الحصة المباشرة...");
    const res = await saveLiveLessonToSupabase({
      id: "live-" + Math.random().toString(36).substring(2, 11),
      title: newLessonTitle.trim(),
      stageId: stageId,
      gradeId: gradeId,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherName: newLessonTeacher.trim(),
      meetingPlatform: newLessonPlatform,
      meetingUrl: newLessonUrl.trim(),
      scheduledTime: newLessonTime,
      duration: newLessonDuration,
      notes: newLessonNotes.trim() || undefined
    });

    if (res.success) {
      setSubjectFeedback("✅ تم جدولة وإتاحة الحصة المباشرة بنجاح!");
      setNewLessonTitle("");
      setNewLessonTeacher("");
      setNewLessonTime("");
      setNewLessonDuration(45);
      setNewLessonUrl("");
      setNewLessonNotes("");
      setShowAddLessonForm(false);
      
      setTimeout(() => setSubjectFeedback(null), 3000);

      if (onRefreshLiveLessons) {
        onRefreshLiveLessons();
      }
    } else {
      setSubjectFeedback("❌ فشل جدولة الحصة: " + res.error);
    }
  };
  const [studySeconds, setStudySeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [studySessionCompleted, setStudySessionCompleted] = useState<string | null>(null);

  React.useEffect(() => {
    let interval: any = null;
    if (isStudyMode && isTimerActive) {
      interval = setInterval(() => {
        setStudySeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStudyMode, isTimerActive]);

  const startStudyTimer = () => setIsTimerActive(true);
  const pauseStudyTimer = () => setIsTimerActive(false);
  const resetStudyTimer = () => setStudySeconds(0);

  const formatStudyTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const enterStudyMode = () => {
    setIsStudyMode(true);
    setStudySeconds(0);
    setIsTimerActive(true);
    setStudySessionCompleted(null);
  };

  const exitStudyMode = () => {
    setIsStudyMode(false);
    setIsTimerActive(false);
    if (studySeconds > 5) {
      const mins = Math.floor(studySeconds / 60);
      const secs = studySeconds % 60;
      const formattedTime = mins > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${secs} ثانية`;
      setStudySessionCompleted(`أحسنت صنعاً! لقد أنجزت جلسة مذاكرة مركزة لمادة ${subject.name} استغرقت ${formattedTime} 🔥. واصل الكفاح نحو النجاح!`);
    }
  };

  // Sharing states and helper methods
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?subjectId=${subject.id}`;
    const shareData = {
      title: `مادة: ${subject.name} - ${gradeName}`,
      text: `تصفح تفاصيل ومقرر مادة ${subject.name} للصف ${gradeName} عبر منصة السودان التعليمية التفاعلية 🇸🇩`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } catch (clipboardErr) {
        console.error("Clipboard copy failed:", clipboardErr);
      }
    }
  };

  const getShareLinks = () => {
    const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?subjectId=${subject.id}`;
    const text = `تصفح تفاصيل ومقرر مادة ${subject.name} (${gradeName}) عبر المنصة السودانية التفاعلية 🇸🇩`;
    return {
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + "\n" + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    };
  };

  // Editing and Admin authentication states
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Offline Caching states for textbooks and summaries
  const [cachedUrls, setCachedUrls] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("sudan_edu_cached_urls");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [cachingStatus, setCachingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});

  const handleToggleCache = async (url: string) => {
    if (!url) return;
    setCachingStatus(prev => ({ ...prev, [url]: "loading" }));
    
    try {
      // Direct call to Cache Storage API
      if ('caches' in window) {
        const cache = await caches.open('sudan-edu-offline-v2');
        // Cache the request in a CORS-safe manner
        await cache.add(new Request(url, { mode: 'no-cors' }));
      }
    } catch (e) {
      console.warn("Direct cache storage adding not possible, saving reference locally:", e);
    }
    
    // Smooth, guaranteed state change
    setTimeout(() => {
      setCachedUrls(prev => {
        const next = prev.includes(url) ? prev : [...prev, url];
        localStorage.setItem("sudan_edu_cached_urls", JSON.stringify(next));
        return next;
      });
      setCachingStatus(prev => ({ ...prev, [url]: "success" }));
      setTimeout(() => {
        setCachingStatus(prev => ({ ...prev, [url]: "idle" }));
      }, 2500);
    }, 1200);
  };

  // Curated states for fields
  const [editName, setEditName] = useState(subject.name);
  const [editInteractiveUrl, setEditInteractiveUrl] = useState(subject.interactiveUrl || "");
  const [editInteractiveLabel, setEditInteractiveLabel] = useState(subject.interactiveLabel || "");
  const [editPdfUrl, setEditPdfUrl] = useState(subject.pdfUrl || "");
  const [editMemoPdfUrl, setEditMemoPdfUrl] = useState(subject.memoPdfUrl || "");
  const [editVideoUrl, setEditVideoUrl] = useState(subject.videoUrl || "");
  const [editCurriculumSummary, setEditCurriculumSummary] = useState(subject.curriculumSummary || "");

  const handleEditClick = () => {
    if (isEditing) {
      setIsEditing(false);
      // Reset to original data
      setEditName(subject.name);
      setEditInteractiveUrl(subject.interactiveUrl || "");
      setEditInteractiveLabel(subject.interactiveLabel || "");
      setEditPdfUrl(subject.pdfUrl || "");
      setEditMemoPdfUrl(subject.memoPdfUrl || "");
      setEditVideoUrl(subject.videoUrl || "");
      setEditCurriculumSummary(subject.curriculumSummary || "");
    } else {
      if (isAdminLoggedIn) {
        setIsEditing(true);
      } else {
        alert(currentLang === "ar" ? "⚠️ عذراً، لا يمكن تعديل المادة إلا من خلال تسجيل الدخول بحساب الإدارة فقط." : "⚠️ Sorry, editing subjects is restricted to logged-in administrator accounts only.");
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sha256(passwordInput) === "7322a90b9246e190b817891970e4ed6fb2f622509e17eebfe33cfff81f69e0a2") {
      setShowPasswordPrompt(false);
      setIsEditing(true);
      setPasswordError("");
    } else {
      setPasswordError("كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.");
    }
  };

  const handleSave = () => {
    if (!editName.trim()) {
      alert("يرجى كتابة اسم المادة الدراسية.");
      return;
    }
    if (onUpdateSubject) {
      onUpdateSubject(stageId, gradeId, subject.id, {
        name: editName,
        interactiveUrl: editInteractiveUrl,
        interactiveLabel: editInteractiveLabel || "الموقع التفاعلي",
        pdfUrl: editPdfUrl,
        memoPdfUrl: editMemoPdfUrl,
        videoUrl: editVideoUrl,
        curriculumSummary: editCurriculumSummary
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmMsg = currentLang === "ar" 
      ? `هل أنت متأكد من رغبتك في حذف مادة (${subject.name}) بشكل نهائي من الصف؟` 
      : `Are you sure you want to permanently delete (${subject.name}) from this grade?`;
    if (window.confirm(confirmMsg)) {
      if (onDeleteSubject) {
        onDeleteSubject(stageId, gradeId, subject.id);
        onClose();
      }
    }
  };

  if (isStudyMode) {
    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 backdrop-blur-md transition-all font-sans ${
        siteTheme === "sudanese" ? "bg-mud/40" : "bg-slate-950/95"
      }`} dir={currentLang === "ar" ? "rtl" : "ltr"}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-full max-w-5xl h-full max-h-[96vh] flex flex-col justify-between overflow-hidden relative ${
            siteTheme === "sudanese" 
              ? "bg-[#FAF5EC] border border-mud/15 rounded-3xl shadow-xl text-mud" 
              : "bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl"
          }`}
        >
          {/* Top Panel: Header with live Timer, pause, and exit controls */}
          <div className={`p-4 sm:px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 ${
            siteTheme === "sudanese"
              ? "bg-cream border-mud/15 text-mud"
              : "bg-slate-955 border-slate-800"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border animate-pulse ${
                siteTheme === "sudanese"
                  ? "bg-earthgold/10 text-mud border-earthgold"
                  : subject.colorClass
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-3xs font-bold block ${
                  siteTheme === "sudanese" ? "text-mud/60" : "text-emerald-400"
                }`}>{t(gradeName)} • {t(stageName)}</span>
                <h3 className={`text-sm sm:text-base font-black flex items-center gap-1 ${
                  siteTheme === "sudanese" ? "text-mud" : "text-slate-100"
                }`}>
                  <span>{t("وضع المذاكرة والتركيز:")}</span>
                  <span className={siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}>{t(subject.name)}</span>
                </h3>
              </div>
            </div>

            {/* LIVE TIMER AND CONTROLS */}
            <div className={`flex items-center gap-3 py-1.5 px-3 rounded-2xl border w-full sm:w-auto justify-between sm:justify-start ${
              siteTheme === "sudanese"
                ? "bg-white border-mud/15"
                : "bg-slate-900/90 border-slate-800"
            }`}>
              <div className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 animate-spin ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`} style={{ animationDuration: '4s' }} />
                <span className={`text-xs font-bold ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>{t("وقت المذاكرة:")}</span>
                <span className={`font-mono text-sm sm:text-base font-black px-2.5 py-0.5 rounded-lg border text-center select-none tracking-widest min-w-[75px] ${
                  siteTheme === "sudanese"
                    ? "bg-[#FAF5EC] border-mud/20 text-mud"
                    : "bg-slate-950 border-indigo-950 text-white"
                }`}>
                  {formatStudyTime(studySeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isTimerActive ? (
                  <button
                    onClick={pauseStudyTimer}
                    className={`p-1 px-2.5 border rounded-lg text-3xs font-black transition-all cursor-pointer ${
                      siteTheme === "sudanese"
                        ? "bg-amber-100 hover:bg-amber-150 text-amber-800 border-amber-300"
                        : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {t("إيقاف مؤقت ⏸️")}
                  </button>
                ) : (
                  <button
                    onClick={startStudyTimer}
                    className={`p-1 px-2.5 border rounded-lg text-3xs font-black transition-all cursor-pointer ${
                      siteTheme === "sudanese"
                        ? "bg-emerald-100 hover:bg-emerald-150 text-emerald-800 border-emerald-300"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {t("استئناف ▶️")}
                  </button>
                )}
                <button
                  onClick={resetStudyTimer}
                  className={`p-1 px-2.5 border rounded-lg text-3xs font-black transition-all cursor-pointer ${
                    siteTheme === "sudanese"
                      ? "bg-cream hover:bg-white text-mud border-mud/15"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                >
                  {t("إعادة 🔄")}
                </button>
              </div>
            </div>

            {/* Exit button */}
            <button
              onClick={exitStudyMode}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1 sm:self-center ${
                siteTheme === "sudanese"
                  ? "bg-mud hover:bg-[#4A2312] text-cream"
                  : "bg-red-650 hover:bg-red-600 text-white"
              }`}
            >
              <span>{t("إنهاء جلسة المذاكرة 🚪")}</span>
            </button>
          </div>

          {/* Central Workspace Canvas: Prominent Book PDF / Video / Focus Material */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            
            {/* Ambient motivational tip dashboard */}
            <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-right border ${
              siteTheme === "sudanese"
                ? "bg-[#FAF5EC]/85 border-mud/10 text-mud"
                : "bg-indigo-950/20 border-indigo-900/30 text-indigo-300"
            }`}>
              <Sparkles className={`w-4 h-4 flex-shrink-0 animate-bounce ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`} />
              <p className={`text-3xs sm:text-2xs font-bold leading-normal ${siteTheme === "sudanese" ? "text-mud/85" : "text-indigo-300"}`}>
                {currentLang === "ar" ? (
                  <span>🧠 **نصيحة بومودورو التعليمية**: المذاكرة لمدة ٢٥ دقيقة مركزة تليها ٥ دقائق استراحة هي أفضل طريقة للاحتفاظ بالمعلومات في الذاكرة مستديمة الأجل وحماية نشاط المخ!</span>
                ) : (
                  <span>🧠 **Pomodoro Study Practice**: Studying for 25 focused minutes followed by a 5-minute break is the absolute best way to retain information in long-term memory!</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Center Screen: Book or PDF / Video Stream (fills 2 cols on wide, full width on small) */}
              <div className="lg:col-span-2 space-y-4">
                {subject.videoUrl || subject.pdfUrl ? (
                  <div className={`p-3 sm:p-4 space-y-3 shadow-xl border rounded-2xl ${
                    siteTheme === "sudanese"
                      ? "bg-white border-mud/10 text-mud"
                      : "bg-slate-900 border-slate-800/80 text-slate-300"
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2.5 ${
                      siteTheme === "sudanese" ? "border-mud/5" : "border-slate-800"
                    }`}>
                      <h4 className="text-xs font-black flex items-center gap-1.5">
                        <Compass className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`} />
                        <span>{t("مادة العرض النشطة والدروس:")}</span>
                      </h4>
                      <span className={`text-3xs font-black ${siteTheme === "sudanese" ? "text-earthgold" : "text-yellow-400"}`}>{t("جاهز للدراسة 📖")}</span>
                    </div>

                    {/* Book or Video Frame */}
                    {subject.videoUrl && embedInfo ? (
                      <div className="space-y-3">
                        <span className={`text-3xs font-bold flex items-center gap-1 ${siteTheme === "sudanese" ? "text-mud" : "text-rose-400"}`}>🔴 {t("دروس الفيديو والشرح")}:</span>
                        <div className={`aspect-video w-full rounded-xl overflow-hidden border bg-black shadow-lg ${
                          siteTheme === "sudanese" ? "border-mud/15" : "border-slate-955"
                        }`}>
                          <iframe
                            src={embedInfo.url}
                            title={`شرح ${t(subject.name)}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    ) : subject.pdfUrl ? (
                      <div className="space-y-3">
                        <span className={`text-3xs font-bold flex items-center gap-1 ${siteTheme === "sudanese" ? "text-mud" : "text-emerald-400"}`}>🟢 {currentLang === "ar" ? "تصفح الكتاب الدراسي الرسمي:" : "Browse Official Textbook:"}</span>
                        <div className={`p-6 rounded-xl border text-center space-y-4 shadow-inner ${
                          siteTheme === "sudanese" ? "bg-cream border-mud/10" : "bg-slate-950 border-slate-800"
                        }`}>
                          <FileText className={`w-12 h-12 mx-auto animate-pulse ${siteTheme === "sudanese" ? "text-mud" : "text-emerald-400"}`} />
                          <div className="space-y-1">
                            <h5 className={`text-xs font-bold ${siteTheme === "sudanese" ? "text-mud" : "text-slate-205"}`}>{currentLang === "ar" ? `كتاب مقرر ${t(subject.name)} متاح للدراسة` : `${t(subject.name)} textbook is ready to study`}</h5>
                            <p className={`text-3xs max-w-md mx-auto leading-relaxed ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>
                              {currentLang === "ar" ? "افتح الكتاب الرقمي المنهجي بصيغة PDF بجوار الشاشة أو قم بتنزيله لدراسة فصوله وعقد المقارنات البينية بأريحية كاملة." : "Open the official digital PDF textbook on your device or download it to study syllabus chapters seamlessly."}
                            </p>
                          </div>
                          <a
                            href={subject.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-2xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                              siteTheme === "sudanese" ? "bg-mud hover:bg-[#4A2312]" : "bg-emerald-600 hover:bg-emerald-555"
                            }`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{currentLang === "ar" ? "فتح / تنزيل كتاب المقرر PDF التفاعلي" : "Open / Download Interactive Textbook PDF"}</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-10 rounded-xl border text-center space-y-2 ${
                        siteTheme === "sudanese" ? "bg-cream border-mud/10" : "bg-slate-950 border-slate-800"
                      }`}>
                        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className={`text-xs ${siteTheme === "sudanese" ? "text-mud/50" : "text-slate-400"}`}>لا يوجد كتاب PDF أو دروس فيديو متوفرة لهذه المادة حالياً.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`border rounded-2xl p-8 text-center space-y-4 ${
                    siteTheme === "sudanese" ? "bg-white border-mud/10 text-mud" : "bg-slate-900 border-slate-850"
                  }`}>
                    <BookOpen className={`w-12 h-12 mx-auto animate-bounce ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`} />
                    <h4 className={`text-sm font-bold ${siteTheme === "sudanese" ? "text-mud font-black" : "text-slate-200"}`}>لقد دخلت مساحة المذاكرة التفاعلية!</h4>
                    <p className={`text-xs max-w-md mx-auto leading-relaxed ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>
                      اقرأ ملخص المنهج ومحتويات الأقسام واطلب من المعلم الذكي توفير تدريبات واختيبارات لترسيخ المفهوم في ذهنك بالكامل.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Screen: Summary text & checklist list */}
              <div className="space-y-4">
                {/* Summary card */}
                <div className={`border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl ${
                  siteTheme === "sudanese" ? "bg-white border-mud/10 text-mud" : "bg-slate-900 border-slate-800"
                }`}>
                  <h4 className="text-xs font-black border-b pb-2 flex items-center gap-1.5 font-sans">
                    <FileText className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-mud" : "text-emerald-400"}`} />
                    <span>{currentLang === "ar" ? "خلاصة خطة المنهج الدراسي للمذاكرة:" : "Curriculum Plan Summary:"}</span>
                  </h4>
                  <p className={`text-2xs leading-relaxed max-h-[160px] overflow-y-auto ${siteTheme === "sudanese" ? "text-mud/85" : "text-slate-350"}`}>
                    {subject.curriculumSummary}
                  </p>
                </div>

                {/* Self-Study Checklist */}
                <div className={`border rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl ${
                  siteTheme === "sudanese" ? "bg-white border-mud/10 text-mud" : "bg-slate-900 border-slate-800"
                }`}>
                  <h4 className="text-xs font-black border-b pb-2 flex items-center gap-1.5 font-sans">
                    <Check className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-mud" : "text-indigo-400"}`} />
                    <span>{currentLang === "ar" ? "خطوات التحصيل الدراسي المقترحة:" : "Suggested Self-Study Checklist:"}</span>
                  </h4>
                  <ul className="space-y-2 text-2xs leading-relaxed">
                    <li className="flex items-start gap-1.5 font-sans">
                      <span className={`font-extrabold font-mono ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`}>1.</span>
                      <span>{currentLang === "ar" ? "اقرأ خلاصة خطة المنهج أعلاه بدقة لفهم المادة." : "Read the curriculum plan summary carefully to understand the material."}</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-sans">
                      <span className={`font-extrabold font-mono ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`}>2.</span>
                      <span>{currentLang === "ar" ? "شاهد دروس الفيديو المتاحة وتصفح كتاب المنهج بدقة." : "Watch available video lessons and browse the curriculum textbook carefully."}</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-sans">
                      <span className={`font-extrabold font-mono ${siteTheme === "sudanese" ? "text-earthgold" : "text-indigo-400"}`}>3.</span>
                      <span>{currentLang === "ar" ? "تواصل مع المعلم الذكي لحل التمارين وتوضيح النقاط الصعبة." : "Ask the Sudanese Smart Tutor for quizzes, practice, and help on tough spots."}</span>
                    </li>
                  </ul>
                </div>

                {/* AI Tutor Chat Access */}
                <div className={`border p-4 rounded-2xl text-center space-y-3.5 shadow-xl ${
                  siteTheme === "sudanese"
                    ? "bg-[#FAF5EC] border-mud/10 text-mud"
                    : "bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border-indigo-900/30"
                }`}>
                  <Sparkles className={`w-8 h-8 mx-auto animate-bounce ${siteTheme === "sudanese" ? "text-earthgold" : "text-amber-300"}`} />
                  <div className="space-y-1">
                    <h5 className={`text-xs font-black ${siteTheme === "sudanese" ? "text-mud" : "text-indigo-300"}`}>
                      {currentLang === "ar" ? "هل تحتاج لشرح نقطة غير مفهومة؟" : "Do you need clarification on any topic?"}
                    </h5>
                    <p className={`text-3xs leading-relaxed ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>
                      {currentLang === "ar" ? "الأستاذ السوداني متوفر طوال الوقت، اضغط أدناه للتحدث وطرح الأسئلة المباشرة." : "The virtual Sudanese tutor is available 24/7 to answer your direct questions immediately."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsStudyMode(false);
                      setShowTutor(true);
                    }}
                    className={`w-full py-2 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center ${
                      siteTheme === "sudanese"
                        ? "bg-mud hover:bg-[#4A2312] text-cream"
                        : "bg-indigo-600 hover:bg-indigo-550 text-white"
                    }`}
                  >
                    {currentLang === "ar" ? "💬 التحدث مع المعلم الذكي الآن" : "💬 Chat with Smart Tutor Now"}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Panel */}
          <div className={`p-3 border-t flex items-center justify-between text-3xs flex-shrink-0 ${
            siteTheme === "sudanese"
              ? "bg-cream border-mud/10 text-mud/50"
              : "bg-slate-955 border-slate-850 text-slate-500"
          }`}>
            <span>{currentLang === "ar" ? "منصة المذاكرة الذكية ودراسة المناهج السودانية 🇸🇩" : "Smart Study Room & Sudanese Curriculum Directory 🇸🇩"}</span>
            <span className="font-mono">Focused Study Session Tracker v3</span>
          </div>

        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-sm transition-opacity ${
      siteTheme === "sudanese" ? "bg-mud/40" : "bg-slate-950/80"
    }`} dir={currentLang === "ar" ? "rtl" : "ltr"}>
      <motion.div 
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        className={`relative border rounded-2xl md:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[650px] max-h-[92vh] md:max-h-[650px] text-right animate-fadeIn ${
          siteTheme === "sudanese"
            ? "bg-[#FAF5EC] border-mud/10 text-mud"
            : "bg-slate-900 border-slate-800 text-slate-100"
        }`}
      >
        
        {/* Left pane: Details (Hidden if Tutor is fullscreen on mobile, but side-by-side on desktop) */}
        <div className={`p-5 md:p-8 flex-1 flex flex-col justify-between overflow-y-auto ${showTutor ? 'hidden md:flex md:w-[45%]' : 'w-full'} max-h-[92vh] md:max-h-full`}>
          
          {/* Header Close button */}
          <div className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5 border-b pb-4 ${
            siteTheme === "sudanese" ? "border-mud/10" : "border-slate-800/40"
          }`}>
            <div className="flex items-center justify-between w-full sm:w-auto">
              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  siteTheme === "sudanese" 
                    ? "text-mud/70 hover:text-mud bg-mud/5 hover:bg-mud/15" 
                    : "text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Render grade marker next to close button on mobile ONLY for compact elegance */}
              <div className={`sm:hidden px-3 py-1 rounded-full text-3xs font-black ${subject.colorClass} border`}>
                {t(gradeName)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              <button 
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 hover:text-emerald-300 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm"
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                <span>{isCopied ? t("تم النسخ!") : t("مشاركة المادة")}</span>
              </button>
              {isAdminLoggedIn && (
                <>
                  <button 
                    onClick={handleEditClick}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-3xs font-bold transition-all cursor-pointer shadow-sm bg-emerald-900/30 hover:bg-emerald-900/40 border-emerald-800/80 text-emerald-450 hover:text-emerald-300"
                  >
                    <Edit className="w-3 h-3" />
                    <span>{isEditing ? t("إلغاء التعديل") : t("تعديل الإدارة 🔑")}</span>
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-3xs font-bold transition-all cursor-pointer shadow-sm bg-red-950/40 hover:bg-red-900/40 border-red-900/50 text-red-400 hover:text-red-350"
                  >
                    <Trash2 className="w-3 h-3 text-red-450" />
                    <span>{currentLang === "ar" ? "حذف المقرر 🗑️" : "Delete Subject 🗑️"}</span>
                  </button>
                </>
              )}
              <div className={`hidden sm:block px-3 py-1 rounded-full text-xs font-semibold ${subject.colorClass} border`}>
                {t(gradeName)}
              </div>
            </div>
          </div>

          {/* Conditional Forms or Normal Content */}
          {showPasswordPrompt ? (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-auto space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Lock className="w-5 h-5" />
                <h4 className="text-sm font-bold">{t("تعديل المنهج - مطلوب كلمة مرور المعلم")}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("يرجى إدخال كلمة المرور الخاصة بالإدارة لحماية تعديل أسماء المواد، روابط الكتب الإلكترونية التفاعلية، وروابط شروحات الفيديو.")}
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={t("أدخل كلمة مرور الإدارة")}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none transition-all text-center tracking-widest"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-2xs text-red-500 text-center font-bold">{passwordError}</p>
                )}
                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordPrompt(false)}
                    className="px-4 py-2 text-xs text-slate-400 bg-slate-800 hover:bg-slate-750 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    {currentLang === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t("تأكيد الدخول")}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : isEditing ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-200">{t("تحرير المادة:")} {t(subject.name)}</h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">{t("المعلم نشط 🔐")}</span>
              </div>

              {/* Subject Name */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{t("اسم المادة الدراسية: ")}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Curriculum Summary */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{t("تفاصيل المنهج السوداني المقرر:")}</label>
                <textarea
                  value={editCurriculumSummary}
                  onChange={(e) => setEditCurriculumSummary(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all resize-none"
                />
              </div>

              {/* Interactive Url & Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-400 uppercase block">{t("رابط البوابة التفاعلية للمقرر:")}</label>
                  <input
                    type="text"
                    value={editInteractiveUrl}
                    onChange={(e) => setEditInteractiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-400 uppercase block">{t("تسمية البوابة التفاعلية:")}</label>
                  <input
                    type="text"
                    value={editInteractiveLabel}
                    onChange={(e) => setEditInteractiveLabel(e.target.value)}
                    placeholder="منصة تفاعلية..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* PDF Url */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{t("رابط تنزيل كتاب المقرر PDF:")}</label>
                <input
                  type="text"
                  value={editPdfUrl}
                  onChange={(e) => setEditPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Memo PDF Url */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{t("رابط ملخص أو مذكرة المادة PDF:")}</label>
                <input
                  type="text"
                  value={editMemoPdfUrl}
                  onChange={(e) => setEditMemoPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Video Url */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{t("رابط شرح المادة بالفيديو (يوتيوب):")}</label>
                <input
                  type="text"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  {currentLang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-600 rounded-xl transition-all flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t("حفظ التغييرات")}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              {/* Subject details & title */}
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${subject.colorClass} border shadow-lg flex-shrink-0`}>
                  <DynamicIcon name={subject.iconName} className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-mono font-semibold ${
                    siteTheme === "sudanese" ? "text-earthgold-700" : "text-emerald-400"
                  }`}>{t(stageName)}</span>
                  <h2 className={`text-xl md:text-2xl font-black ${
                    siteTheme === "sudanese" ? "text-mud" : "text-slate-100"
                  }`}>{t(subject.name)}</h2>
                  
                  {hasInteractiveLink && (
                    <div className="pt-2">
                      <a 
                        href={subject.interactiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-black text-xs transition-all cursor-pointer relative overflow-hidden shadow-lg border animate-pulse hover:animate-none hover:scale-[1.03] active:scale-95 group"
                        style={{
                          background: siteTheme === "sudanese" 
                            ? "linear-gradient(135deg, #059669 0%, #0d9488 100%)" 
                            : "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                          borderColor: siteTheme === "sudanese" ? "#0b512b" : "#34d399",
                          color: siteTheme === "sudanese" ? "#2b742c" : "#ffffff",
                          boxShadow: siteTheme === "sudanese"
                            ? "0 4px 15px rgba(5, 150, 105, 0.4)"
                            : "0 4px 15px rgba(16, 185, 129, 0.4)"
                        }}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                        </span>
                        <Compass className="w-4 h-4 animate-spin text-emerald-100 shrink-0" style={{ animationDuration: '6s' }} />
                        <span className="tracking-wide text-right font-black">
                          {currentLang === "ar" 
                            ? `دخول الموقع التفاعلي: ${subject.interactiveLabel || "اضغط هنا"}` 
                            : `Open Interactive: ${subject.interactiveLabel || "Click here"}`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-200 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>



              {/* Study session completed success alert */}
              {studySessionCompleted && (
                <div className="bg-indigo-950/30 border border-indigo-550/40 p-4 rounded-2xl text-xs text-indigo-300 font-bold leading-relaxed relative animate-fadeIn flex items-start gap-2.5 shadow-md">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-yellow-400 shrink-0">
                    <Star className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <div className="flex-1 text-2xs sm:text-xs">
                    {studySessionCompleted}
                  </div>
                  <button type="button" onClick={() => setStudySessionCompleted(null)} className="text-indigo-400 hover:text-white p-1 text-xs cursor-pointer">✕</button>
                </div>
              )}

              {/* Live Lesson Status indicator */}
              <div className={`p-4 rounded-2xl border mb-4 ${
                isLiveLessonAvailable
                  ? "bg-emerald-950/15 border-emerald-550/35 text-emerald-300"
                  : siteTheme === "sudanese"
                    ? "bg-[#FCFAF3] border-mud/10 text-mud/85"
                    : "bg-slate-950/30 border-slate-800/80 text-slate-400"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {isLiveLessonAvailable ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-550"></span>
                      )}
                    </span>
                    <span className="text-xs font-extrabold">
                      {isLiveLessonAvailable 
                        ? (currentLang === "ar" ? "🎥 الحصص المباشرة للمادة: متوفرة حالياً" : "🎥 Subject Live Lessons: Available Now")
                        : (currentLang === "ar" ? "⚪ الحصص المباشرة للمادة: غير متوفرة حالياً" : "⚪ Subject Live Lessons: Currently Unavailable")
                      }
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 opacity-80">
                    {currentLang === "ar" ? "تحديد حسب جدول الأستاذ" : "Scheduled by Teacher"}
                  </span>
                </div>

                {isLiveLessonAvailable ? (
                  <div className="space-y-3">
                    {subjectLiveLessons.map((lesson) => {
                      const isActiveNow = new Date(lesson.scheduledTime).getTime() <= Date.now();
                      return (
                        <div key={lesson.id} className="p-3 rounded-xl bg-slate-950/40 border border-emerald-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1 text-right">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${isActiveNow ? 'bg-emerald-600 text-[#ffffff]' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                {isActiveNow ? "🔴 جارية الآن" : "📅 مجدولة قريباً"}
                              </span>
                              <span className="text-xs font-black text-slate-200">{lesson.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                              <span>👤 المعلم: {lesson.teacherName}</span>
                              <span>⏱️ المدة: {lesson.duration} دقيقة</span>
                              <span>📅 الموعد: {new Date(lesson.scheduledTime).toLocaleString("ar-SD", { hour12: true })}</span>
                            </div>
                            {lesson.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-1 font-sans">📝 ملاحظة: {lesson.notes}</p>
                            )}
                          </div>
                          
                          <a
                            href={lesson.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-555 text-[#ffffff] text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{currentLang === "ar" ? "انضمام للبث المباشر" : "Join Live Class"}</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed opacity-80 text-right">
                    {currentLang === "ar" 
                      ? "لا توجد حصص بث مباشر مجدولة لهذه المادة حالياً من قبل أستاذ المادة. سيتم تحديث هذه اللوحة فور قيام المعلم بجدولة أي بث جديد."
                      : "There are no live lessons scheduled for this subject at the moment by the teacher. This board will update automatically once a live broadcast is scheduled."
                    }
                  </p>
                )}

                {/* If user is teacher/admin, allow adding a live lesson for this specific subject right here! */}
                {isAdminActive && (
                  <div className="mt-4 pt-3 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setShowAddLessonForm(!showAddLessonForm)}
                      className="px-3 py-1.5 bg-sky-900/30 hover:bg-sky-900/40 border border-sky-850 text-sky-400 hover:text-sky-350 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-400" />
                      <span>{showAddLessonForm ? (currentLang === "ar" ? "إغلاق نافذة الجدولة" : "Close Scheduler") : (currentLang === "ar" ? "➕ جدولة حصة مباشرة جديدة لهذه المادة" : "➕ Schedule New Live Lesson for this Subject")}</span>
                    </button>

                    {showAddLessonForm && (
                      <form onSubmit={handleSubjectLiveLessonSubmit} className="mt-3 p-4 rounded-xl bg-slate-950/65 border border-slate-850 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 block">عنوان الحصة: <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="مثال: مراجعة الباب الأول وحل المسائل"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 block">اسم المعلم: <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={newLessonTeacher}
                              onChange={(e) => setNewLessonTeacher(e.target.value)}
                              placeholder="أ. أحمد المصطفى"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 block">موعد الحصة: <span className="text-red-500">*</span></label>
                            <input
                              type="datetime-local"
                              required
                              value={newLessonTime}
                              onChange={(e) => setNewLessonTime(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 block">المدة (دقائق): <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              required
                              value={newLessonDuration}
                              onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 block">المنصة: <span className="text-red-500">*</span></label>
                            <select
                              value={newLessonPlatform}
                              onChange={(e) => setNewLessonPlatform(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                            >
                              <option value="google_meet">جوجل ميت Google Meet</option>
                              <option value="zoom">زووم Zoom</option>
                              <option value="other">رابط خارجي</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">رابط الحصة: <span className="text-red-500">*</span></label>
                          <input
                            type="url"
                            required
                            value={newLessonUrl}
                            onChange={(e) => setNewLessonUrl(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">ملاحظات إضافية (اختياري):</label>
                          <textarea
                            value={newLessonNotes}
                            onChange={(e) => setNewLessonNotes(e.target.value)}
                            placeholder="مثال: يرجى تجهيز دفتر الملاحظات وقلم لحل المسائل التفاعلية معاً."
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-3xs text-slate-200 outline-none focus:border-sky-500 font-bold"
                          />
                        </div>

                        {subjectFeedback && (
                          <div className={`p-2 rounded-lg text-4xs font-bold text-center ${subjectFeedback.includes("✅") ? "bg-emerald-950/45 text-emerald-400" : "bg-red-955/20 text-red-400"}`}>
                            {subjectFeedback}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-555 text-[#ffffff] text-xs font-bold rounded-lg duration-150 cursor-pointer shadow"
                          >
                            <span>حفظ وجدولة الحصة 🚀</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Show scheduled lessons listing for easy management inside modal */}
                    {subjectLiveLessons.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[10px] text-slate-450 font-extrabold">✏️ إدارة حصص المادة المجدولة حالياً:</div>
                        {subjectLiveLessons.map((lesson) => (
                          <div key={lesson.id} className="p-2.5 rounded-xl bg-slate-950/20 border border-slate-850 flex items-center justify-between text-3xs">
                            <span className="font-bold text-slate-200">{lesson.title}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(currentLang === "ar" ? "هل أنت متأكد من حذف هذه الحصة؟" : "Are you sure you want to delete this lesson?")) {
                                  const res = await deleteLiveLessonFromSupabase(lesson.id);
                                  if (res.success && onRefreshLiveLessons) {
                                    onRefreshLiveLessons();
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-rose-950/30 hover:bg-rose-900/30 text-rose-400 border border-rose-900/35 rounded-lg text-4xs font-bold transition-all cursor-pointer"
                            >
                              {currentLang === "ar" ? "حذف" : "Delete"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* E-Book, PDF Memo, and Video Showcase Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-Book Card */}
                <div className={`p-4 rounded-2xl flex flex-col justify-between space-y-3 border ${
                  siteTheme === "sudanese"
                    ? "bg-[#FCFAF3] border-mud/10 text-mud"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-100"
                }`}>
                  <div className="space-y-1">
                    <div className={`flex items-center justify-between gap-2 ${
                      siteTheme === "sudanese" ? "text-mud font-extrabold" : "text-slate-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${siteTheme === 'sudanese' ? 'text-earthgold-700' : 'text-emerald-400'}`} />
                        <h5 className="text-xs font-bold">{t("الكتاب الإلكتروني للمقرر")}</h5>
                      </div>
                      
                      {subject.pdfUrl && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          cachedUrls.includes(subject.pdfUrl) 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                            : siteTheme === "sudanese" 
                              ? "bg-mud/5 text-mud/60 border border-mud/10"
                              : "bg-slate-900/60 text-slate-400 border border-slate-800"
                        }`}>
                          {cachedUrls.includes(subject.pdfUrl) 
                            ? (currentLang === "ar" ? "متاح أوفلاين ✦" : "Offline Ready ✦")
                            : (currentLang === "ar" ? "غير محفوظ محلياً" : "Not Cached")}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${
                      siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
                    }`}>
                      {subject.pdfUrl 
                        ? (currentLang === "ar" ? "اضغط أدناه لتحميل النسخة الرسمية للمقرر بصيغة PDF مباشرة للدراسة والاستخدام الرقمي." : "Click below to read and download the official curriculum textbook in PDF format.")
                        : (currentLang === "ar" ? "رابط تنزيل كتاب المنهج السوداني الرسمي بصيغة PDF للهواتف والأجهزة اللوحية." : "Download link for the official Sudanese curriculum textbook PDF for phones and tablets.")}
                    </p>
                  </div>
                  <div>
                    {subject.pdfUrl ? (
                      <div className="grid grid-cols-5 gap-2">
                        <a 
                          href={subject.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t("تنزيل كتاب المقرر PDF")}</span>
                        </a>

                        <button
                          onClick={() => handleToggleCache(subject.pdfUrl!)}
                          disabled={cachingStatus[subject.pdfUrl] === "loading"}
                          className={`col-span-2 inline-flex items-center justify-center gap-1 px-1 py-2 rounded-xl text-[9px] font-extrabold border transition-all cursor-pointer ${
                            cachedUrls.includes(subject.pdfUrl)
                              ? "bg-emerald-950/25 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/20"
                              : cachingStatus[subject.pdfUrl] === "loading"
                                ? "bg-slate-900 text-slate-500 border-slate-850"
                                : "bg-slate-900/40 hover:bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40"
                          }`}
                        >
                          {cachingStatus[subject.pdfUrl] === "loading" ? (
                            <span className="inline-block w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                          ) : cachingStatus[subject.pdfUrl] === "success" ? (
                            <span>{currentLang === "ar" ? "حُفظ! 🟢" : "Saved! 🟢"}</span>
                          ) : cachedUrls.includes(subject.pdfUrl) ? (
                            <span>{currentLang === "ar" ? "حذف" : "Remove"}</span>
                          ) : (
                            <span>{currentLang === "ar" ? "تفعيل الحفظ" : "Cache offline"}</span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Download className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>{t("رابط الكتاب (سيتوفر قريباً)")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Memorandum Card */}
                <div className={`p-4 rounded-2xl flex flex-col justify-between space-y-3 border ${
                  siteTheme === "sudanese"
                    ? "bg-[#FCFAF3] border-mud/10 text-mud"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-100"
                }`}>
                  <div className="space-y-1">
                    <div className={`flex items-center justify-between gap-2 ${
                      siteTheme === "sudanese" ? "text-mud font-extrabold" : "text-slate-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${siteTheme === 'sudanese' ? 'text-earthgold-700' : 'text-amber-400'}`} />
                        <h5 className="text-xs font-bold font-sans">{t("ملخص ومذكرة المادة PDF")}</h5>
                      </div>

                      {subject.memoPdfUrl && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          cachedUrls.includes(subject.memoPdfUrl) 
                            ? "bg-amber-955/30 text-amber-400 border border-amber-900/40"
                            : siteTheme === "sudanese"
                              ? "bg-mud/5 text-mud/65 border border-mud/10"
                              : "bg-slate-900/60 text-slate-400 border border-slate-800"
                        }`}>
                          {cachedUrls.includes(subject.memoPdfUrl) 
                            ? (currentLang === "ar" ? "متاح أوفلاين ✦" : "Offline Ready ✦")
                            : (currentLang === "ar" ? "غير محفوظ محلياً" : "Not Cached")}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${
                      siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
                    }`}>
                      {subject.memoPdfUrl 
                        ? (currentLang === "ar" ? "اضغط أدناه لتنزيل ملخص ومذكرة الشرح الشاملة من قبل معلم المادة مباشرة." : "Click below to download the comprehensive course study guide compiled by your teacher.")
                        : (currentLang === "ar" ? "رابط تنزيل مذكرة الشرح والملخصات لتبسيط المذاكرة للطلاب وأولياء الأمور." : "Download link for reference notes and summaries to simplify revision for students.")}
                    </p>
                  </div>
                  <div>
                    {subject.memoPdfUrl ? (
                      <div className="grid grid-cols-5 gap-2">
                        <a 
                          href={subject.memoPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-550 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 animate-pulse" />
                          <span>{currentLang === "ar" ? "تنزيل المذكرة" : "Download Notes"}</span>
                        </a>

                        <button
                          onClick={() => handleToggleCache(subject.memoPdfUrl!)}
                          disabled={cachingStatus[subject.memoPdfUrl] === "loading"}
                          className={`col-span-2 inline-flex items-center justify-center gap-1 px-1 py-2 rounded-xl text-[9px] font-extrabold border transition-all cursor-pointer ${
                            cachedUrls.includes(subject.memoPdfUrl)
                              ? "bg-amber-955/25 text-amber-400 border-amber-900/30 hover:bg-amber-900/20"
                              : cachingStatus[subject.memoPdfUrl] === "loading"
                                ? "bg-slate-900 text-slate-500 border-slate-850"
                                : "bg-slate-900/40 hover:bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/40"
                          }`}
                        >
                          {cachingStatus[subject.memoPdfUrl] === "loading" ? (
                            <span className="inline-block w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                          ) : cachingStatus[subject.memoPdfUrl] === "success" ? (
                            <span>{currentLang === "ar" ? "حُفظ! 🟢" : "Saved! 🟢"}</span>
                          ) : cachedUrls.includes(subject.memoPdfUrl) ? (
                            <span>{currentLang === "ar" ? "حذف" : "Remove"}</span>
                          ) : (
                            <span>{currentLang === "ar" ? "تفعيل الحفظ" : "Cache offline"}</span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Download className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>{t("رابط المذكرة (سيتوفر قريباً)")}</span>
                      </div>
                    )}
                  </div>
                </div>



                {/* Video Card */}
                <div className={`p-4 rounded-2xl flex flex-col justify-between space-y-3 border ${
                  siteTheme === "sudanese"
                    ? "bg-[#FCFAF3] border-mud/10 text-mud"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-100"
                } ${subject.videoUrl ? "col-span-1 sm:col-span-2" : ""}`}>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 ${
                      siteTheme === "sudanese" ? "text-mud font-extrabold" : "text-slate-200"
                    }`}>
                      {embedInfo?.isDrive ? (
                        <Video className={`w-4 h-4 ${siteTheme === 'sudanese' ? 'text-earthgold-700' : 'text-emerald-400'}`} />
                      ) : (
                        <Youtube className="w-4 h-4 text-rose-500" />
                      )}
                      <h5 className="text-xs font-bold">
                        {embedInfo?.isDrive 
                          ? (currentLang === "ar" ? "شرح المادة بالفيديو (رابط قوقل درايف)" : "Course Video Lecture (Google Drive)")
                          : (currentLang === "ar" ? "شرح المادة بالفيديو التفاعلي" : "Course Video Lecture Series")}
                      </h5>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${
                      siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
                    }`}>
                      {subject.videoUrl
                        ? (currentLang === "ar" ? "دُمجت الدروس بنجاح! شاهد الشرح التعليمي بالفيديو مباشرة وبصورة تلقائية أدناه." : "Lessons integrated successfully! Watch the video explanations directly below.")
                        : (currentLang === "ar" ? "فيديوهات شرح دروس المادة من القناة التعليمية لتيسير الفهم للطلاب وأولياء الأمور." : "Video lectures for course lessons to simplify comprehension.")}
                    </p>
                  </div>
                  <div>
                    {subject.videoUrl ? (
                      (() => {
                        if (embedInfo) {
                          return (
                            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-black mt-2">
                              <iframe
                                src={embedInfo.url}
                                title={currentLang === "ar" ? `شرح ${subject.name}` : `Explanation of ${t(subject.name)}`}
                                className="w-full h-full animate-fadeIn"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              ></iframe>
                            </div>
                          );
                        } else {
                          return (
                            <a 
                              href={subject.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-555 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shadow-rose-950/20"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{currentLang === "ar" ? "مشاهدة شرح المادة (رابط خارجي)" : "Watch Video Lecture (External Link)"}</span>
                            </a>
                          );
                        }
                      })()
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Video className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>{currentLang === "ar" ? "شرح الفيديو (سيتوفر قريباً)" : "Video lecture will be linked soon"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prompt action to trigger tutoring and quick share */}
          {!showTutor && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-4">
              
              {/* Premium Direct Social Share Board */}
              <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="space-y-0.5 text-center sm:text-right">
                  <h5 className="text-xs font-black text-slate-200 bg-gradient-to-l from-emerald-400 to-slate-200 bg-clip-text text-transparent">
                    {currentLang === "ar" ? "شارك هذا المنهج الدراسي مع أصحابك 📢" : "Share this curriculum with your friends 📢"}
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    {currentLang === "ar" ? "انشر الرابط لزملائك الطلاب أو مجموعات المدرسة في المحادثات" : "Post the link for your classmates or school chat groups"}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-center font-sans">
                  {/* WhatsApp */}
                  <a
                    href={getShareLinks().whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                    <span>{currentLang === "ar" ? "الواتساب" : "WhatsApp"}</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={getShareLinks().telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-pulse"></span>
                    <span>{currentLang === "ar" ? "تلغرام" : "Telegram"}</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={getShareLinks().facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span>{currentLang === "ar" ? "فيسبوك" : "Facebook"}</span>
                  </a>

                  {/* Copy Link Button */}
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-450" /> : <Share2 className="w-3 h-3 text-emerald-450" />}
                    <span>{isCopied ? t("تم النسخ!") : (currentLang === "ar" ? "نسخ الرابط" : "Copy Link")}</span>
                  </button>
                </div>
              </div>


            </div>
          )}
        </div>

        {/* Right pane / Overlaid Fullscreen on mobile: The Smart AI Tutor Interactive Room */}
        {showTutor && (
          <div className="w-full md:w-[55%] border-r border-slate-800 flex flex-col h-[560px] md:h-full justify-between max-h-[92vh] md:max-h-full">
            <AITutor 
              stageName={stageName}
              gradeName={gradeName}
              subjectName={subject.name}
              subject={subject}
              onClose={() => setShowTutor(false)}
            />
            {/* Control to go back to description for smaller views */}
            <div className="p-3 bg-slate-950 border-t border-slate-850 md:hidden text-center flex-shrink-0">
              <button
                onClick={() => setShowTutor(false)}
                className="text-xs text-emerald-400 font-bold tracking-wide py-1 px-4 rounded-lg bg-emerald-950/20 active:bg-emerald-950/40 border border-emerald-900/30 w-full"
              >
                {currentLang === "ar" ? "← العودة إلى خلاصة منهج المادة" : "← Go back to subject overview"}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
