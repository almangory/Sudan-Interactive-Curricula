import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Sparkles, BookOpen, Compass, Download, Video,
  FileText, Lock, Unlock, Save, Plus, Palette
} from "lucide-react";
import { Subject } from "../data/curriculum";
import DynamicIcon from "./DynamicIcon";
import { stageAndGradeTranslations, uiTranslations } from "../lib/translations";

interface AddSubjectModalProps {
  stageId: string;
  gradeId: string;
  gradeName: string;
  onClose: () => void;
  onAddSubject: (stageId: string, gradeId: string, newSubject: Subject) => void;
  isAdminActive?: boolean;
  currentLang?: "ar" | "en";
  siteTheme?: string;
}

const AVAILABLE_ICONS = [
  { name: "BookOpen", label: "كتاب" },
  { name: "Compass", label: "بوصلة/استكشاف" },
  { name: "Award", label: "جائزة" },
  { name: "Smile", label: "مرح ورسم" },
  { name: "Atom", label: "علوم/ذرة" },
  { name: "Calculator", label: "رياضيات/حساب" },
  { name: "Globe", label: "جغرافيا/عالم" },
  { name: "History", label: "تاريخ" },
  { name: "PenTool", label: "رسم وكتابة" },
  { name: "Map", label: "خريطة" },
  { name: "Music", label: "موسيقى وأناشيد" },
  { name: "Leaf", label: "أحياء/طبيعة" },
  { name: "FlaskConical", label: "كيمياء/مختبر" },
  { name: "Languages", label: "لغات وترجمة" },
  { name: "Sparkles", label: "مهارات ذكية" }
];

const AVAILABLE_COLORS = [
  { value: "bg-emerald-900/20 text-emerald-400 border-emerald-800/40", label: "أخضر زمردي" },
  { value: "bg-blue-900/20 text-blue-400 border-blue-800/40", label: "أزرق سماوي" },
  { value: "bg-amber-900/20 text-amber-400 border-amber-800/40", label: "أصفر عنبري" },
  { value: "bg-rose-900/20 text-rose-400 border-rose-800/40", label: "أحمر وردي" },
  { value: "bg-purple-900/20 text-purple-400 border-purple-800/40", label: "بنفسجي ملكي" },
  { value: "bg-sky-900/20 text-sky-400 border-sky-850", label: "سماوي ناصع" },
  { value: "bg-pink-900/20 text-pink-400 border-pink-855", label: "وردي زاهي" }
];

export default function AddSubjectModal({ stageId, gradeId, gradeName, onClose, onAddSubject, isAdminActive, currentLang = "ar", siteTheme }: AddSubjectModalProps) {
  const t = (key: string): string => {
    if (uiTranslations[currentLang] && (uiTranslations[currentLang] as any)[key]) {
      return (uiTranslations[currentLang] as any)[key];
    }
    if (currentLang === "en" && stageAndGradeTranslations[key]) {
      return stageAndGradeTranslations[key];
    }
    return key;
  };

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminActive || false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // New Subject form states
  const [name, setName] = useState("");
  const [curriculumSummary, setCurriculumSummary] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("BookOpen");
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0].value);
  const [interactiveUrl, setInteractiveUrl] = useState("");
  const [interactiveLabel, setInteractiveLabel] = useState(currentLang === "ar" ? "الموقع التفاعلي" : "Interactive Portal");
  const [pdfUrl, setPdfUrl] = useState("");
  const [memoPdfUrl, setMemoPdfUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "20302060") {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError(currentLang === "ar" ? "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى." : "Invalid password, please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(currentLang === "ar" ? "يرجى إدخال اسم المادة الدراسية." : "Please enter the subject name.");
      return;
    }
    if (!curriculumSummary.trim()) {
      alert(currentLang === "ar" ? "يرجى كتابة خلاصة للمادة والمقرر." : "Please write a syllabus summary for the subject.");
      return;
    }

    const uniqueId = `custom-subject-${Date.now()}`;
    const newSubject: Subject = {
      id: uniqueId,
      name,
      iconName: selectedIcon,
      colorClass: selectedColor,
      interactiveUrl: interactiveUrl.trim(),
      interactiveLabel: interactiveLabel.trim() || (currentLang === "ar" ? "الموقع التفاعلي" : "Interactive Portal"),
      curriculumSummary: curriculumSummary.trim(),
      pdfUrl: pdfUrl.trim() || undefined,
      memoPdfUrl: memoPdfUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined
    };

    onAddSubject(stageId, gradeId, newSubject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity" dir={currentLang === "ar" ? "rtl" : "ltr"}>
      <motion.div 
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        className={`relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-auto max-h-[90vh] ${currentLang === "ar" ? "text-right" : "text-left"}`}
      >
        {/* Header */}
        <div className={`p-6 border-b border-slate-800 flex items-center justify-between ${currentLang === "ar" ? "flex-row-reverse" : "flex-row"}`}>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xs text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-900/40 px-2.5 py-1 rounded-full">{t(gradeName)}</span>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{currentLang === "ar" ? "إضافة مادة مقررة جديدة" : "Add New Subject"}</span>
            </h3>
          </div>
        </div>

        {/* Dynamic content depending on authorization */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto w-full my-6 space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Lock className="w-5 h-5" />
                <h4 className="text-sm font-bold">{currentLang === "ar" ? "إضافة مادة - مطلوب كلمة مرور المعلم" : "Add Subject - Teacher Password Required"}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentLang === "ar" 
                  ? "يرجى إدخال كلمة المرور الخاصة بالإدارة لحماية تعديل أسماء المواد، روابط الكتب الإلكترونية التفاعلية، وروابط شروحات الفيديو." 
                  : "Please enter the administrative password to protect official subject names, interactive portals, and video reference links."}
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={currentLang === "ar" ? "أدخل كلمة مرور الإدارة" : "Enter administrative password"}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none transition-all text-center tracking-widest"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-2xs text-red-500 text-center font-bold">{passwordError}</p>
                )}
                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-slate-400 bg-slate-800 hover:bg-slate-755 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    {currentLang === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{currentLang === "ar" ? "تأكيد الصلاحية" : "Confirm Pin"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Subject Name */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{currentLang === "ar" ? "اسم المادة الدراسية الجديدة:" : "New Subject Name:"}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={currentLang === "ar" ? "مثال: علم البيئة والأحياء، التربية الإسلامية..." : "e.g. Ecology & Biology, Islamic Education..."}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-2 px-3.5 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Curriculum Summary */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-400 uppercase block">{currentLang === "ar" ? "وصف أو تفاصيل المنهج السوداني المقرر:" : "Sudanese Prescribed Syllabus Details:"}</label>
                <textarea
                  required
                  value={curriculumSummary}
                  onChange={(e) => setCurriculumSummary(e.target.value)}
                  rows={3}
                  placeholder={currentLang === "ar" ? "اكتب نبذة عن أبواب المادة التي يدرسها الطالب تماشياً مع معايير وزارة التربية والتعليم السودانية..." : "Write a brief description of the syllabus chapters in line with standard Ministry of Education criteria..."}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-2 px-3.5 text-xs text-slate-100 outline-none transition-all resize-none"
                />
              </div>

              {/* Selector for Icon and Color Theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Icon selection */}
                <div className="space-y-2">
                  <label className="text-3xs font-bold text-slate-400 uppercase block flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-emerald-400" />
                    <span>{currentLang === "ar" ? "أيقونة المادة المميزة:" : "Selected Graphic Icon:"}</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 max-h-[140px] overflow-y-auto">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setSelectedIcon(icon.name)}
                        title={icon.label}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          selectedIcon === icon.name 
                            ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/80" 
                            : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <DynamicIcon name={icon.name} className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme/Color Selection */}
                <div className="space-y-2">
                  <label className="text-3xs font-bold text-slate-400 uppercase block flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-emerald-400" />
                    <span>{currentLang === "ar" ? "لون وقالب البطاقة:" : "Card Color Palette:"}</span>
                  </label>
                  <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 max-h-[140px] overflow-y-auto">
                    {AVAILABLE_COLORS.map((color) => {
                      const colorEngLabels: Record<string, string> = {
                        "أخضر زمردي": "Emerald Green",
                        "أزرق سماوي": "Sky Blue",
                        "أصفر عنبري": "Amber Yellow",
                        "أحمر وردي": "Rose Red",
                        "بنفسجي ملكي": "Royal Purple",
                        "سماوي ناصع": "Vibrant Sky",
                        "وردي زاهي": "Bright Pink"
                      };
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-full py-1.5 px-3 rounded-lg border text-3xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            selectedColor === color.value 
                              ? "bg-emerald-600/10 text-emerald-350 border-emerald-500/85" 
                              : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{currentLang === "ar" ? color.label : (colorEngLabels[color.label] || color.label)}</span>
                          <span className={`w-4 h-4 rounded-full ${color.value} border flex items-center justify-center`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Decorative Line */}
              <div className="border-t border-slate-800/50 my-6" />

              {/* Extra External Links */}
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                {currentLang === "ar" ? "الروابط التفاعلية وقنوات الشرح (اختياري):" : "Interactive Portals & Explainers (Optional):"}
              </h4>

              {/* Interactive Url & Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-400 block">{currentLang === "ar" ? "رابط البوابة التفاعلية للمقرر:" : "Interactive Course Portal URL:"}</label>
                  <input
                    type="text"
                    value={interactiveUrl}
                    onChange={(e) => setInteractiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-400 block">{currentLang === "ar" ? "اسم البوابة التفاعلية:" : "Interactive Portal Label:"}</label>
                  <input
                    type="text"
                    value={interactiveLabel}
                    onChange={(e) => setInteractiveLabel(e.target.value)}
                    placeholder={currentLang === "ar" ? "مثال: تجربة فيزياء افتراضية PhET" : "e.g. PhET Interactive Physics Lab"}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* PDF Books & Summary Papers URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-450 block">{currentLang === "ar" ? "رابط كتاب المنهج الرسمي PDF:" : "Official Textbook PDF URL:"}</label>
                  <input
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs font-bold text-slate-450 block">{currentLang === "ar" ? "رابط ملخص ومذكرة المادة PDF:" : "Supporting Notes PDF URL:"}</label>
                  <input
                    type="text"
                    value={memoPdfUrl}
                    onChange={(e) => setMemoPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* YouTube explains URL */}
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-450 block">{currentLang === "ar" ? "رابط شرح المادة بالفيديو (يوتيوب أو قوقل درايف):" : "Video Lecture Playlist URL (YouTube / Drive):"}</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl py-1.5 px-3.5 text-xs text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Save or Cancel actions */}
              <div className="flex items-center gap-2 justify-end pt-5 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs text-slate-400 bg-slate-800 hover:bg-slate-755 rounded-xl transition-all cursor-pointer hover:text-white"
                >
                  {currentLang === "ar" ? "إلغاء التراجع" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-555 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{currentLang === "ar" ? "حفظ وإضافة المادة" : "Save & Publish"}</span>
                </button>
              </div>

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
