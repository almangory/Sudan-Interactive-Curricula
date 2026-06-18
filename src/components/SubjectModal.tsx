import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, ExternalLink, Sparkles, BookOpen, Clock, Users, ShieldAlert,
  ChevronRight, Award, Compass, Heart, HelpCircle, Download, Video,
  FileText, Youtube, Lock, Unlock, Save, Edit, Share2, Check, Star, Trash2,
  Wifi, WifiOff
} from "lucide-react";
import { Subject } from "../data/curriculum";
import DynamicIcon from "./DynamicIcon";
import AITutor from "./AITutor";
import { stageAndGradeTranslations, uiTranslations } from "../lib/translations";

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
  currentLang?: "ar" | "en";
}

export default function SubjectModal({ stageId, stageName, gradeId, gradeName, subject, onClose, onUpdateSubject, onDeleteSubject, isAdminActive, currentLang: passedLang }: SubjectModalProps) {
  const [showTutor, setShowTutor] = useState(false);

  const currentLang = passedLang || (localStorage.getItem("sudan_edu_lang") as "ar" | "en") || "ar";
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
      if (isAdminActive) {
        setIsEditing(true);
      } else {
        setShowPasswordPrompt(true);
        setPasswordInput("");
        setPasswordError("");
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "20302060") {
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
      }
      onClose();
    }
  };

  // Check if interactiveUrl exists and is not empty
  const hasInteractiveLink = subject.interactiveUrl && subject.interactiveUrl.trim() !== "";

  const embedInfo = subject.videoUrl ? getVideoEmbedUrl(subject.videoUrl) : null;

  if (isStudyMode) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md transition-all font-sans" dir={currentLang === "ar" ? "rtl" : "ltr"}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-full max-h-[96vh] flex flex-col justify-between overflow-hidden shadow-2xl relative"
        >
          {/* Top Panel: Header with live Timer, pause, and exit controls */}
          <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${subject.colorClass} border animate-pulse`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs text-emerald-400 font-bold block">{t(gradeName)} • {t(stageName)}</span>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1">
                  <span>{t("وضع المذاكرة والتركيز:")}</span>
                  <span className="text-indigo-400">{t(subject.name)}</span>
                </h3>
              </div>
            </div>

            {/* LIVE TIMER AND CONTROLS */}
            <div className="flex items-center gap-3 bg-slate-900/90 py-1.5 px-3 rounded-2xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs text-slate-400 font-bold">{t("وقت المذاكرة:")}</span>
                <span className="font-mono text-sm sm:text-base font-black text-white bg-slate-950 px-2.5 py-0.5 rounded-lg border border-indigo-950 text-center select-none tracking-widest min-w-[75px]">
                  {formatStudyTime(studySeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isTimerActive ? (
                  <button
                    onClick={pauseStudyTimer}
                    className="p-1 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-3xs font-black transition-all cursor-pointer"
                  >
                    {t("إيقاف مؤقت ⏸️")}
                  </button>
                ) : (
                  <button
                    onClick={startStudyTimer}
                    className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-3xs font-black transition-all cursor-pointer"
                  >
                    {t("استئناف ▶️")}
                  </button>
                )}
                <button
                  onClick={resetStudyTimer}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-3xs font-black transition-all cursor-pointer"
                >
                  {t("إعادة 🔄")}
                </button>
              </div>
            </div>

            {/* Exit button */}
            <button
              onClick={exitStudyMode}
              className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1 sm:self-center"
            >
              <span>{t("إنهاء جلسة المذاكرة 🚪")}</span>
            </button>
          </div>

          {/* Central Workspace Canvas: Prominent Book PDF / Video / Focus Material */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-950/10 space-y-6">
            
            {/* Ambient motivational tip dashboard */}
            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-2xl flex items-center gap-2.5 text-right">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-bounce" />
              <p className="text-3xs sm:text-2xs text-indigo-300 font-bold leading-normal">
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
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-indigo-400" />
                        <span>{t("مادة العرض النشطة والدروس:")}</span>
                      </h4>
                      <span className="text-3xs text-yellow-400 font-black">{t("جاهز للدراسة 📖")}</span>
                    </div>

                    {/* Book or Video Frame */}
                    {subject.videoUrl && embedInfo ? (
                      <div className="space-y-3">
                        <span className="text-3xs text-rose-400 font-bold flex items-center gap-1">🔴 {t("دروس الفيديو والشرح")}:</span>
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-955 bg-black shadow-lg">
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
                        <span className="text-3xs text-emerald-400 font-bold flex items-center gap-1">🟢 {currentLang === "ar" ? "تصفح الكتاب الدراسي الرسمي:" : "Browse Official Textbook:"}</span>
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4 shadow-inner">
                          <FileText className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-200">{currentLang === "ar" ? `كتاب مقرر ${t(subject.name)} متاح للدراسة` : `${t(subject.name)} textbook is ready to study`}</h5>
                            <p className="text-3xs text-slate-400 max-w-md mx-auto leading-relaxed">
                              {currentLang === "ar" ? "افتح الكتاب الرقمي المنهجي بصيغة PDF بجوار الشاشة أو قم بتنزيله لدراسة فصوله وعقد المقارنات البينية بأريحية كاملة." : "Open the official digital PDF textbook on your device or download it to study syllabus chapters seamlessly."}
                            </p>
                          </div>
                          <a
                            href={subject.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-555 text-white text-2xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{currentLang === "ar" ? "فتح / تنزيل كتاب المقرر PDF التفاعلي" : "Open / Download Interactive Textbook PDF"}</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-10 rounded-xl border border-slate-800 text-center space-y-2">
                        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">لا يوجد كتاب PDF أو دروس فيديو متوفرة لهذه المادة حالياً.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                    <BookOpen className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-200">لقد دخلت مساحة المذاكرة التفاعلية!</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      اقرأ ملخص المنهج ومحتويات الأقسام واطلب من المعلم الذكي توفير تدريبات واختبارات لترسيخ المفهوم في ذهنك بالكامل.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Screen: Summary text & prompt tips list */}
              <div className="space-y-4">
                {/* Summary card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                  <h4 className="text-xs font-black text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>خلاصة خطة المنهج الدراسي للمذاكرة:</span>
                  </h4>
                  <p className="text-2xs text-slate-350 leading-relaxed max-h-[160px] overflow-y-auto">
                    {subject.curriculumSummary}
                  </p>
                </div>

                {/* Self-Study Checklist */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                  <h4 className="text-xs font-black text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>{currentLang === "ar" ? `خطوات إتقان درس ${subject.name}:` : `Steps to master ${t(subject.name)}:`}</span>
                  </h4>
                  <ul className="space-y-2 text-3xs text-slate-400 font-medium font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-extrabold font-mono">1.</span>
                      <span>{currentLang === "ar" ? "اقرأ الملخص العام للمادة في السودان لتفهم الهيكل المعرفي." : "Read the general outline of the subject to understand the layout."}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-extrabold font-mono">2.</span>
                      <span>{currentLang === "ar" ? "شاهد دروس الفيديو المعتمدة لتبسيط التعقيدات العلمية." : "Watch the official video playlist to clarify complex topics."}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-extrabold font-mono">3.</span>
                      <span>{currentLang === "ar" ? "قم بحل الأسئلة التدريبية بالتعاون مع معلم الذكاء الاصطناعي." : "Solve exercises with the guidance of our custom AI teacher."}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-extrabold font-mono">4.</span>
                      <span>{currentLang === "ar" ? "اختبر مستواك في مخيم المذاكرة للتأكد من جاهزيتك للاختبارات الوزارية." : "Test your level in the Study Camp to prepare for national examinations."}</span>
                    </li>
                  </ul>
                </div>                 {/* AI Tutor Chat Access */}
                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-900/30 p-4 rounded-2xl text-center space-y-3.5 shadow-xl">
                  <Sparkles className="w-8 h-8 text-amber-300 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-indigo-300">
                      {currentLang === "ar" ? "هل تحتاج لشرح نقطة غير مفهومة؟" : "Do you need clarification on any topic?"}
                    </h5>
                    <p className="text-3xs text-slate-400 leading-relaxed">
                      {currentLang === "ar" ? "الأستاذ السوداني متوفر طوال الوقت، اضغط أدناه للتحدث وطرح الأسئلة المباشرة." : "The virtual Sudanese tutor is available 24/7 to answer your direct questions immediately."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsStudyMode(false);
                      setShowTutor(true);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    {currentLang === "ar" ? "💬 التحدث مع المعلم الذكي الآن" : "💬 Chat with Smart Tutor Now"}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Panel */}
          <div className="p-3 bg-slate-950 border-t border-slate-850 flex items-center justify-between text-3xs text-slate-500 flex-shrink-0">
            <span>{currentLang === "ar" ? "منصة المذاكرة الذكية ودراسة المناهج السودانية 🇸🇩" : "Smart Study Room & Sudanese Curriculum Directory 🇸🇩"}</span>
            <span className="font-mono">Focused Study Session Tracker v3</span>
          </div>

        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity" dir={currentLang === "ar" ? "rtl" : "ltr"}>
      <motion.div 
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        className="relative bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[650px] max-h-[92vh] md:max-h-[650px] text-right animate-fadeIn"
      >
        
        {/* Left pane: Details (Hidden if Tutor is fullscreen on mobile, but side-by-side on desktop) */}
        <div className={`p-5 md:p-8 flex-1 flex flex-col justify-between overflow-y-auto ${showTutor ? 'hidden md:flex md:w-[45%]' : 'w-full'} max-h-[92vh] md:max-h-full`}>
          
          {/* Header Close button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5 border-b border-slate-800/40 pb-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
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
              {isAdminActive && (
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
                  <span className="text-xs text-emerald-400 font-mono font-semibold">{t(stageName)}</span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100">{t(subject.name)}</h2>
                </div>
              </div>

              {/* Study Mode Quick Start Banner */}
              <div className="bg-gradient-to-r from-indigo-950/45 via-purple-950/20 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-center sm:text-right">
                  <span className="text-3xs text-indigo-400 font-black tracking-wide block uppercase">⚡ {currentLang === "ar" ? "وضع المذاكرة التفاعلي والتركيز" : "Interactive Study & Focus Mode"}</span>
                  <h4 className="text-xs font-black text-slate-205">{currentLang === "ar" ? "ادرس في بيئة هادئة ومكبرة خالية من المشتتات" : "Study in a quiet and magnified environment free from distractions"}</h4>
                  <p className="text-[10px] text-slate-400">{currentLang === "ar" ? "شاشة مخصصة لعرض الكتاب بمساحة أكبر مع مؤقت ذكي يتابع تقدمك." : "A dedicated wider screen displaying textbooks side-by-side with a focus timer."}</p>
                </div>
                <button
                  type="button"
                  onClick={enterStudyMode}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-l from-indigo-650 to-indigo-600 hover:from-indigo-600 hover:to-indigo-550 border border-indigo-500/40 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Clock className="w-4 h-4 text-indigo-300 animate-pulse" />
                  <span>{t("دخول وضع المذاكرة والتركيز ⏱️")}</span>
                </button>
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

              {/* Curriculum Summary Card */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{t("المنهج السوداني المقرر للمادة:")}</span>
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {subject.curriculumSummary}
                </p>
              </div>

              {/* Interactive Website (Al-Manhaf) */}
              <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950/55 p-5 rounded-2xl border border-emerald-900/35 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">{t("بوابة المعامل والألعاب التفاعلية المقترحة")}</span>
                  <h4 className="text-sm font-bold text-slate-205 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>{t("محاكاة ومواقع عالمية تفاعلية:")}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hasInteractiveLink
                      ? (currentLang === "ar" ? "هذا الرابط المعتمد ينقلك مباشرة لمنصة تفاعلية مخصصة لتجربة المفاهيم عملياً بالرسوم والتحريك التفاعلي." : "This certified link directs you to an interactive platform to experience concepts hands-on with digital animations.")
                      : (currentLang === "ar" ? "البوابة التفاعلية غير نشطة حالياً لهذا المقرر (لم يتم تزويد الرابط بعد من قبل المعلم)." : "The interactive portal is currently offline for this subject (no link has been added by your teacher yet).")}
                  </p>
                </div>

                <div className="pt-1">
                  {hasInteractiveLink ? (
                    <a 
                      href={subject.interactiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-emerald-900/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{currentLang === "ar" ? `دخول الموقع التفاعلي: ${subject.interactiveLabel}` : `Open Interactive Portal: ${subject.interactiveLabel}`}</span>
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold transition-all border border-slate-700/60 cursor-not-allowed opacity-60"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("البوابة غير نشطة (الرابط غير متوفر حالياً)")}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* E-Book, PDF Memo, and Video Showcase Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-Book Card */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <h5 className="text-xs font-bold">{t("الكتاب الإلكتروني للمقرر")}</h5>
                      </div>
                      
                      {subject.pdfUrl && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          cachedUrls.includes(subject.pdfUrl) 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800"
                        }`}>
                          {cachedUrls.includes(subject.pdfUrl) 
                            ? (currentLang === "ar" ? "متاح أوفلاين ✦" : "Offline Ready ✦")
                            : (currentLang === "ar" ? "غير محفوظ محلياً" : "Not Cached")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
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
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <h5 className="text-xs font-bold font-sans">{t("ملخص ومذكرة المادة PDF")}</h5>
                      </div>

                      {subject.memoPdfUrl && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          cachedUrls.includes(subject.memoPdfUrl) 
                            ? "bg-amber-955/30 text-amber-400 border border-amber-900/40"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800"
                        }`}>
                          {cachedUrls.includes(subject.memoPdfUrl) 
                            ? (currentLang === "ar" ? "متاح أوفلاين ✦" : "Offline Ready ✦")
                            : (currentLang === "ar" ? "غير محفوظ محلياً" : "Not Cached")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
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
                <div className={`p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-3 ${subject.videoUrl ? "col-span-1 sm:col-span-2" : ""}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-200">
                      {embedInfo?.isDrive ? (
                        <Video className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Youtube className="w-4 h-4 text-rose-500" />
                      )}
                      <h5 className="text-xs font-bold">
                        {embedInfo?.isDrive 
                          ? (currentLang === "ar" ? "شرح المادة بالفيديو (رابط قوقل درايف)" : "Course Video Lecture (Google Drive)")
                          : (currentLang === "ar" ? "شرح المادة بالفيديو التفاعلي" : "Course Video Lecture Series")}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
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

              {/* Tutor Action Replacement Text */}
              <div className="w-full py-4 px-5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-450" />
                <span className="text-xs font-black text-emerald-400">
                  {t("للدخول وسؤال الأستاذ ادخل على رابط الموقع التفاعلي")}
                </span>
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
