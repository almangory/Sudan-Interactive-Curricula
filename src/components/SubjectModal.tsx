import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, ExternalLink, Sparkles, BookOpen, Clock, Users, ShieldAlert,
  ChevronRight, Award, Compass, Heart, HelpCircle, Download, Video,
  FileText, Youtube, Lock, Unlock, Save, Edit, Share2, Check
} from "lucide-react";
import { Subject } from "../data/curriculum";
import DynamicIcon from "./DynamicIcon";
import AITutor from "./AITutor";

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
  isAdminActive?: boolean;
}

export default function SubjectModal({ stageId, stageName, gradeId, gradeName, subject, onClose, onUpdateSubject, isAdminActive }: SubjectModalProps) {
  const [showTutor, setShowTutor] = useState(false);

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

  // Check if interactiveUrl exists and is not empty
  const hasInteractiveLink = subject.interactiveUrl && subject.interactiveUrl.trim() !== "";

  const embedInfo = subject.videoUrl ? getVideoEmbedUrl(subject.videoUrl) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity" dir="rtl">
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
                {gradeName}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              <button 
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 hover:text-emerald-300 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm"
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                <span>{isCopied ? "تم النسخ!" : "مشاركة المادة"}</span>
              </button>
              <button 
                onClick={handleEditClick}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-3xs font-bold transition-all cursor-pointer shadow-sm ${
                  isAdminActive 
                    ? 'bg-emerald-900/30 hover:bg-emerald-900/40 border-emerald-800/80 text-emerald-450 hover:text-emerald-300' 
                    : 'bg-slate-800 hover:bg-slate-755 border-slate-700/80 text-amber-400 hover:text-amber-300'
                }`}
              >
                <Edit className="w-3 h-3" />
                <span>{isEditing ? "إلغاء التعديل" : isAdminActive ? "تعديل الإدارة 🔑" : "تعديل الروابط"}</span>
              </button>
              <div className={`hidden sm:block px-3 py-1 rounded-full text-xs font-semibold ${subject.colorClass} border`}>
                {gradeName}
              </div>
            </div>
          </div>

          {/* Conditional Forms or Normal Content */}
          {showPasswordPrompt ? (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-auto space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Lock className="w-5 h-5" />
                <h4 className="text-sm font-bold">تعديل المنهج - مطلوب كلمة مرور المعلم</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                يرجى إدخال كلمة المرور الخاصة بالإدارة لحماية تعديل أسماء المواد، روابط الكتب الإلكترونية التفاعلية، وروابط شروحات الفيديو.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة مرور الإدارة"
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
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>تأكيد الدخول</span>
                  </button>
                </div>
              </form>
            </div>
          ) : isEditing ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-200">تحرير المادة: {subject.name}</h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">المعلم نشط 🔐</span>
              </div>

              {/* Subject Name */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">اسم المادة الدراسية:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Curriculum Summary */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">تفاصيل المنهج السوداني المقرر:</label>
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
                  <label className="text-3xs font-bold text-slate-400 uppercase block">رابط البوابة التفاعلية للمقرر:</label>
                  <input
                    type="text"
                    value={editInteractiveUrl}
                    onChange={(e) => setEditInteractiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-400 uppercase block">تسمية البوابة التفاعلية:</label>
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
                <label className="text-3xs font-bold text-slate-400 uppercase block">رابط تنزيل كتاب المقرر PDF:</label>
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
                <label className="text-3xs font-bold text-slate-400 uppercase block">رابط ملخص أو مذكرة المادة PDF:</label>
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
                <label className="text-3xs font-bold text-slate-400 uppercase block">رابط شرح المادة بالفيديو (يوتيوب):</label>
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
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-600 rounded-xl transition-all flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التغييرات</span>
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
                  <span className="text-xs text-emerald-400 font-mono font-semibold">{stageName}</span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100">{subject.name}</h2>
                </div>
              </div>

              {/* Curriculum Summary Card */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>المنهج السوداني المقرر للمادة:</span>
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {subject.curriculumSummary}
                </p>
              </div>

              {/* Interactive Website (Al-Manhaf) */}
              <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950/55 p-5 rounded-2xl border border-emerald-900/35 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">بوابة المعامل والألعاب التفاعلية المقترحة</span>
                  <h4 className="text-sm font-bold text-slate-205 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>محاكاة ومواقع عالمية تفاعلية:</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hasInteractiveLink
                      ? "هذا الرابط المعتمد ينقلك مباشرة لمنصة تفاعلية مخصصة لتجربة المفاهيم عملياً بالرسوم والتحريك التفاعلي."
                      : "البوابة التفاعلية غير نشطة حالياً لهذا المقرر (لم يتم تزويد الرابط بعد من قبل المعلم)."}
                  </p>
                </div>

                <div className="pt-1">
                  {hasInteractiveLink ? (
                    <a 
                      href={subject.interactiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-emerald-900/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>دخول الموقع التفاعلي: {subject.interactiveLabel}</span>
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold transition-all border border-slate-700/60 cursor-not-allowed opacity-60"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>البوابة غير نشطة (الرابط غير متوفر حالياً)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* E-Book, PDF Memo, and Video Showcase Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-Book Card */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-xs font-bold">الكتاب الإلكتروني للمقرر</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {subject.pdfUrl 
                        ? "اضغط أدناه لتحميل النسخة الرسمية للمقرر بصيغة PDF مباشرة للدراسة والاستخدام الرقمي."
                        : "رابط تنزيل كتاب المنهج السوداني الرسمي بصيغة PDF للهواتف والأجهزة اللوحية."}
                    </p>
                  </div>
                  <div>
                    {subject.pdfUrl ? (
                      <a 
                        href={subject.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تنزيل كتاب المقرر PDF</span>
                      </a>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Download className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>رابط الكتاب (سيتوفر قريباً)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Memorandum Card */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <h5 className="text-xs font-bold font-sans">ملخص ومذكرة المادة PDF</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {subject.memoPdfUrl 
                        ? "اضغط أدناه لتنزيل ملخص ومذكرة الشرح الشاملة من قبل معلم المادة مباشرة."
                        : "رابط تنزيل مذكرة الشرح والملخصات لتبسيط المذاكرة للطلاب وأولياء الأمور."}
                    </p>
                  </div>
                  <div>
                    {subject.memoPdfUrl ? (
                      <a 
                        href={subject.memoPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-550 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 animate-pulse" />
                        <span>تنزيل مذكرة المادة PDF</span>
                      </a>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Download className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>رابط المذكرة (سيتوفر قريباً)</span>
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
                        {embedInfo?.isDrive ? "شرح المادة بالفيديو (رابط قوقل درايف)" : "شرح المادة بالفيديو التفاعلي"}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {subject.videoUrl
                        ? "دُمجت الدروس بنجاح! شاهد الشرح التعليمي بالفيديو مباشرة وبصورة تلقائية أدناه."
                        : "فيديوهات شرح دروس المادة من القناة التعليمية لتيسير الفهم للطلاب وأولياء الأمور."}
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
                                title={`شرح ${subject.name}`}
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
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shadow-rose-950/20"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>مشاهدة شرح المادة (رابط خارجي)</span>
                            </a>
                          );
                        }
                      })()
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/40 cursor-not-allowed opacity-60">
                        <Video className="w-3.5 h-3.5 text-slate-500/80" />
                        <span>شرح الفيديو (سيتوفر قريباً)</span>
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
                  <h5 className="text-xs font-black text-slate-200 bg-gradient-to-l from-emerald-400 to-slate-200 bg-clip-text text-transparent">شارك هذا المنهج الدراسي مع أصحابك 📢</h5>
                  <p className="text-[10px] text-slate-400">انشر الرابط لزملائك الطلاب أو مجموعات المدرسة في المحادثات</p>
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {/* WhatsApp */}
                  <a
                    href={getShareLinks().whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                    <span>الواتساب</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={getShareLinks().telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-pulse"></span>
                    <span>تلغرام</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={getShareLinks().facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span>فيسبوك</span>
                  </a>

                  {/* Copy Link Button */}
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-3xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-450" /> : <Share2 className="w-3 h-3 text-emerald-450" />}
                    <span>{isCopied ? "تم النسخ!" : "نسخ الرابط"}</span>
                  </button>
                </div>
              </div>

              {/* Tutor Action Button */}
              <button
                onClick={() => setShowTutor(true)}
                className="w-full py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/30 hover:shadow-emerald-950/10 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform animate-bounce" />
                <span>دخول غرفت المعلم السوداني الذكي التفاعلي 🇸🇩</span>
                <ChevronRight className="w-4 h-4 transform rotate-180" />
              </button>
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
              onClose={() => setShowTutor(false)}
            />
            {/* Control to go back to description for smaller views */}
            <div className="p-3 bg-slate-950 border-t border-slate-850 md:hidden text-center flex-shrink-0">
              <button
                onClick={() => setShowTutor(false)}
                className="text-xs text-emerald-400 font-bold tracking-wide py-1 px-4 rounded-lg bg-emerald-950/20 active:bg-emerald-950/40 border border-emerald-900/30 w-full"
              >
                ← العودة إلى خلاصة منهج المادة
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
