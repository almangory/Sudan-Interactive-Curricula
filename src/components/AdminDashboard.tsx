import React, { useState, useEffect } from "react";
import { 
  Database, Save, Plus, Trash2, Edit3, Settings, AlertTriangle, CheckCircle, 
  RefreshCw, Globe, BookOpen, Video, FileText, LayoutGrid, X, Sparkles, Award
} from "lucide-react";
import { Stage, Grade, Subject } from "../data/curriculum";
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient, saveCurriculumToSupabase, fetchCurriculumFromSupabase, testSupabaseConnection } from "../lib/supabase";

interface AdminDashboardProps {
  stages: Stage[];
  onUpdateCurriculum: (newStages: Stage[]) => void;
  onClose: () => void;
}

export default function AdminDashboard({ stages, onUpdateCurriculum, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "supabase">("edit");
  
  // Selection States
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[1]?.id || stages[0]?.id || "");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  
  // Edit Subject Form State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  // Form Fields
  const [subjectName, setSubjectName] = useState("");
  const [iconName, setIconName] = useState("BookOpen");
  const [curriculumSummary, setCurriculumSummary] = useState("");
  const [interactiveUrl, setInteractiveUrl] = useState("");
  const [interactiveLabel, setInteractiveLabel] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [memoPdfUrl, setMemoPdfUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [colorClass, setColorClass] = useState("bg-blue-100 text-blue-800 border-blue-200");

  // Supabase states
  const [sbUrl, setSbUrl] = useState("");
  const [sbAnonKey, setSbAnonKey] = useState("");
  const [sbStatus, setSbStatus] = useState<string | null>(null);
  const [isSbLoading, setIsSbLoading] = useState(false);
  
  // Notification states
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Set default grade when stage changes
  const activeStage = stages.find(s => s.id === selectedStageId);
  useEffect(() => {
    if (activeStage && activeStage.grades.length > 0) {
      setSelectedGradeId(activeStage.grades[0].id);
    } else {
      setSelectedGradeId("");
    }
    cancelForm();
  }, [selectedStageId]);

  const activeGrade = activeStage?.grades.find(g => g.id === selectedGradeId);

  // Load configured Supabase keys from client local storage
  useEffect(() => {
    const config = getSupabaseConfig();
    setSbUrl(config.url);
    setSbAnonKey(config.anonKey);
  }, []);

  const cancelForm = () => {
    setEditingSubjectId(null);
    setIsAddingNew(false);
    setSubjectName("");
    setIconName("BookOpen");
    setCurriculumSummary("");
    setInteractiveUrl("");
    setInteractiveLabel("");
    setPdfUrl("");
    setMemoPdfUrl("");
    setVideoUrl("");
    setColorClass("bg-blue-105 text-blue-900 border-blue-200");
  };

  const handleEditSubject = (subj: Subject) => {
    setEditingSubjectId(subj.id);
    setIsAddingNew(false);
    setSubjectName(subj.name);
    setIconName(subj.iconName || "BookOpen");
    setCurriculumSummary(subj.curriculumSummary || "");
    setInteractiveUrl(subj.interactiveUrl || "");
    setInteractiveLabel(subj.interactiveLabel || "");
    setPdfUrl(subj.pdfUrl || "");
    setMemoPdfUrl(subj.memoPdfUrl || "");
    setVideoUrl(subj.videoUrl || "");
    setColorClass(subj.colorClass || "bg-blue-105 text-blue-900 border-blue-200");
    
    // Smooth scroll to form
    const formElement = document.getElementById("subject-form-anchor");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddNewSubjectClick = () => {
    cancelForm();
    setIsAddingNew(true);
    setInteractiveLabel("الموقع التفاعلي");
    
    // Smooth scroll to form
    const formElement = document.getElementById("subject-form-anchor");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      showFeedback("اسم المادة مطلوب سيدي!", "error");
      return;
    }

    if (!selectedStageId || !selectedGradeId) {
      showFeedback("يرجى تحديد المرحلة والصف الدراسي أولاً.", "error");
      return;
    }

    let updatedStages = [...stages];
    
    if (isAddingNew) {
      const newSubj: Subject = {
        id: "subj-" + Date.now().toString(),
        name: subjectName.trim(),
        iconName: iconName,
        colorClass: colorClass,
        interactiveUrl: interactiveUrl.trim(),
        interactiveLabel: interactiveLabel.trim() || "الموقع التفاعلي",
        curriculumSummary: curriculumSummary.trim(),
        pdfUrl: pdfUrl.trim() || undefined,
        memoPdfUrl: memoPdfUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined
      };

      updatedStages = stages.map(stg => {
        if (stg.id !== selectedStageId) return stg;
        return {
          ...stg,
          grades: stg.grades.map(grd => {
            if (grd.id !== selectedGradeId) return grd;
            return {
              ...grd,
              subjects: [...grd.subjects, newSubj]
            };
          })
        };
      });

      showFeedback("تمت إضافة المادة التفاعلية الجديدة بنجاح! 🎉", "success");
    } else if (editingSubjectId) {
      updatedStages = stages.map(stg => {
        if (stg.id !== selectedStageId) return stg;
        return {
          ...stg,
          grades: stg.grades.map(grd => {
            if (grd.id !== selectedGradeId) return grd;
            return {
              ...grd,
              subjects: grd.subjects.map(sub => {
                if (sub.id !== editingSubjectId) return sub;
                return {
                  ...sub,
                  name: subjectName.trim(),
                  iconName: iconName,
                  colorClass: colorClass,
                  interactiveUrl: interactiveUrl.trim(),
                  interactiveLabel: interactiveLabel.trim() || "الموقع التفاعلي",
                  curriculumSummary: curriculumSummary.trim(),
                  pdfUrl: pdfUrl.trim() || undefined,
                  memoPdfUrl: memoPdfUrl.trim() || undefined,
                  videoUrl: videoUrl.trim() || undefined
                };
              })
            };
          })
        };
      });

      showFeedback("تم تحديث مسميات وروابط المادة بنجاح! 💾", "success");
    }

    onUpdateCurriculum(updatedStages);
    cancelForm();
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف مادة "${name}" نهائياً من هذا المنهج؟`)) {
      return;
    }

    const updatedStages = stages.map(stg => {
      if (stg.id !== selectedStageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== selectedGradeId) return grd;
          return {
            ...grd,
            subjects: grd.subjects.filter(sub => sub.id !== subjectId)
          };
        })
      };
    });

    onUpdateCurriculum(updatedStages);
    showFeedback(`تم حذف مادة "${name}" بنجاح.`, "info");
    cancelForm();
  };

  const showFeedback = (text: string, type: "success" | "error" | "info") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // ☁️ Supabase Handlers
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSbLoading(true);
    setSbStatus(null);
    try {
      saveSupabaseConfig(sbUrl, sbAnonKey);
      
      const testResult = testSupabaseConnection(sbUrl, sbAnonKey);
      if (!testResult.success) {
        throw new Error(testResult.error || "تأكد من صحة البيانات المُدخلة.");
      }

      const client = testResult.client;
      if (!client) {
        throw new Error("بيانات الاتصال غير مكتملة أو غير صالحة للبدء.");
      }

      let statusMsg = "";

      // Test connection to curricula_links
      try {
        const { error: linksError } = await client
          .from("curricula_links")
          .select("id")
          .limit(1);

        if (linksError) {
          if (linksError.code === "PGRST404") {
            statusMsg += "⚠️ الجدول 'curricula_links' غير موجود حالياً في سوبابيس. اضغط زر التهيئة بالأسفل لعرض كود الإنشاء.\n";
          } else {
            statusMsg += `⚠️ خطأ في جدول curricula_links: ${linksError.message}\n`;
          }
        } else {
          statusMsg += "✅ تم الاتصال والتحقق من جدول 'curricula_links' بنجاح!\n";
        }
      } catch (err: any) {
        statusMsg += `⚠️ فشل الاستعلام من curricula_links: ${err.message || err}\n`;
      }

      // Test connection to admin_users
      try {
        const { error: usersError } = await client
          .from("admin_users")
          .select("id")
          .limit(1);

        if (usersError) {
          if (usersError.code === "PGRST404") {
            statusMsg += "⚠️ الجدول 'admin_users' الخاص بالمستخدمين الإداريين غير موجود في قاعدة بيانتك حالياً.\n";
          } else {
            statusMsg += `⚠️ خطأ في جدول admin_users: ${usersError.message}\n`;
          }
        } else {
          statusMsg += "✅ تم الاتصال والتحقق من جدول 'admin_users' بنجاح!\n";
        }
      } catch (err: any) {
        statusMsg += `⚠️ فشل الاستعلام من admin_users: ${err.message || err}\n`;
      }

      setSbStatus(statusMsg || "✅ تم الاتصال والتحقق من كلا الجدولين 'curricula_links' و 'admin_users' بنجاح سحابياً!");
      showFeedback("تم تحديث وحفظ مفاتيح السوبابيس بنجاح! ⚡", "success");
    } catch (err: any) {
      console.error(err);
      setSbStatus(`❌ فشل الاتصال بسوبابيس. يرجى التأكد من الرابط والمفتاح. الخطأ: ${err.message}`);
      showFeedback("فشل الاتصال بقاعدة البيانات.", "error");
    } finally {
      setIsSbLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      showFeedback("يرجى تهيئة إعدادات سوبابيس أولاً.", "error");
      return;
    }

    if (!window.confirm("مزامنة: هل ترغب في رفع كافة البيانات الحالية وعرض المناهج المحلية لتخزينها بالكامل في سوبابيس لتقرأ ديناميكياً؟")) {
      return;
    }

    setIsSbLoading(true);
    try {
      const response = await saveCurriculumToSupabase(stages);
      if (response) {
        showFeedback("تم رفع وحفظ المنهج الدراسي بالكامل إلى جدول curricula_links السحابي بنجاح! ⭐", "success");
        setSbStatus("✅ تمت المزامنة السحابية الأخيرة بنجاح داخل جدول curricula_links.");
      } else {
        throw new Error("فشل الرفع السحابي.");
      }
    } catch (err: any) {
      setSbStatus(`❌ فشل المزامنة السحابية. يرجى التحقق من صلاحيات الجدول RLS وقواعد الأمان. الخطأ: ${err.message}`);
      showFeedback("فشلت المزامنة.", "error");
    } finally {
      setIsSbLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      showFeedback("يرجى تهيئة إعدادات سوبابيس أولاً.", "error");
      return;
    }

    if (!window.confirm("سحب البيانات: هل ترغب في تنزيل البيانات الحالية من سوبابيس واستبدال المنهج المحلي بها؟")) {
      return;
    }

    setIsSbLoading(true);
    try {
      const loadedStages = await fetchCurriculumFromSupabase();
      if (loadedStages && Array.isArray(loadedStages) && loadedStages.length > 0) {
        onUpdateCurriculum(loadedStages);
        showFeedback("تم سحب وتحديث المنهج من سوبابيس بنجاح! ☁️", "success");
        setSbStatus("✅ تم سحب البيانات المحدثة ديناميكياً من جدول curricula_links بنجاح وتحميلها بالكامل.");
      } else {
        throw new Error("قاعدة بيانات سوبابيس لا تحتوي على منهج محفوظ تحت المعرف 'curriculum' أو أن الجدول فارغ.");
      }
    } catch (err: any) {
      setSbStatus(`❌ فشل تحميل البيانات من السحابة: ${err.message}`);
      showFeedback("فشل جلب البيانات.", "error");
    } finally {
      setIsSbLoading(false);
    }
  };

  const handleCreateDatabaseTable = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      showFeedback("يرجى تهيئة مفاتيح سوبابيس أولاً.", "error");
      return;
    }

    alert(
      "لتهيئة الجداول بنجاح في Supabase وصلاحياتها، يرجى نسخ وتنفيذ هذا الكود (SQL) في لوحة التحكم الخاصة بموقع سوبابيس (SQL Editor):\n\n" +
      "-- 1. إنشاء جدول المناهج والروابط\n" +
      "CREATE TABLE IF NOT EXISTS curricula_links (\n" +
      "  id TEXT PRIMARY KEY,\n" +
      "  stage_id TEXT,\n" +
      "  stage_name TEXT,\n" +
      "  stage_description TEXT,\n" +
      "  stage_theme TEXT,\n" +
      "  stage_icon TEXT,\n" +
      "  grade_id TEXT,\n" +
      "  grade_name TEXT,\n" +
      "  name TEXT,\n" +
      "  icon_name TEXT,\n" +
      "  color_class TEXT,\n" +
      "  interactive_url TEXT,\n" +
      "  interactive_label TEXT,\n" +
      "  curriculum_summary TEXT,\n" +
      "  pdf_url TEXT,\n" +
      "  memo_pdf_url TEXT,\n" +
      "  video_url TEXT,\n" +
      "  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())\n" +
      ");\n\n" +
      "-- تمكين الوصول العام للقراءة والكتابة لـ RLS:\n" +
      "ALTER TABLE curricula_links ENABLE ROW LEVEL SECURITY;\n" +
      "CREATE POLICY \"Allow read write for all\" ON curricula_links FOR ALL USING (true) WITH CHECK (true);\n\n" +
      "-- 2. إنشاء جدول المستخدمين للمصادقة\n" +
      "CREATE TABLE IF NOT EXISTS admin_users (\n" +
      "  id SERIAL PRIMARY KEY,\n" +
      "  username TEXT UNIQUE NOT NULL,\n" +
      "  password TEXT NOT NULL,\n" +
      "  email TEXT,\n" +
      "  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())\n" +
      ");\n\n" +
      "ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;\n" +
      "CREATE POLICY \"Allow select for everyone\" ON admin_users FOR SELECT USING (true);\n" +
      "CREATE POLICY \"Allow insert update for all\" ON admin_users FOR ALL USING (true) WITH CHECK (true);\n\n" +
      "-- إضافة مستخدم إداري افتراضي:\n" +
      "INSERT INTO admin_users (username, password) VALUES ('almangory', '20302060') ON CONFLICT DO NOTHING;"
    );
  };

  return (
    <div className="bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <span>لوحة تحكم إدارة وتحديث المناهج الدراسية</span>
              <span className="text-3xs uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-extrabold border border-emerald-900/45 animate-pulse">
                لوحة مخفية نشطة 🔒
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">تعديل المسميات والروابط (كتب، مذكرات، تفاعليات، فيديوهات) والربط مع سوبابيس</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2.5 hover:bg-slate-850 bg-slate-950 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <X className="w-4 h-4" />
          <span>خروج من اللوحة</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 py-3 mb-6 relative z-10">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "edit"
              ? "bg-emerald-600 text-[#ffffff] shadow-md shadow-emerald-950"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>إدارة المناهج والروابط الدراسية</span>
        </button>

        <button
          onClick={() => setActiveTab("supabase")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "supabase"
              ? "bg-indigo-600 text-[#ffffff] shadow-md shadow-indigo-950"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>إعداد ومزامنة سوبابيس (Supabase) ☁️</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 border text-xs font-bold animate-bounce ${
          feedbackMsg.type === "success" 
            ? "bg-emerald-955/20 border-emerald-900 text-emerald-400" 
            : feedbackMsg.type === "error"
            ? "bg-red-955/20 border-red-900 text-red-400"
            : "bg-slate-800 border-slate-700 text-slate-300"
        }`}>
          {feedbackMsg.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tab Contents: Edit Curriculum */}
      {activeTab === "edit" && (
        <div className="space-y-6 relative z-10">
          {/* Phase 1: Selector Stages and Grades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-slate-300 block">اختر المرحلة الدراسية:</label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-600"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-slate-300 block">اختر السنة / الصف الدراسي:</label>
              <select
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-600"
                disabled={!activeStage}
              >
                <option value="">-- حدد الصف --</option>
                {activeStage?.grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Subjects under selected Grade */}
          {activeGrade ? (
            <div className="border border-slate-800 bg-slate-950/40 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <h3 className="text-xs font-black text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  <span>المواد الموجودة في {activeGrade.name}:</span>
                  <span className="text-slate-500 font-mono text-3xs">({activeGrade.subjects.length} مواد)</span>
                </h3>

                <button
                  onClick={handleAddNewSubjectClick}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-[#ffffff] text-3xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مادة جديدة بالكامل</span>
                </button>
              </div>

              {activeGrade.subjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  لا توجد مواد مضافة في هذا الصف حالياً. اضغط على زر الإضافة لإثراء هذا المنهج!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeGrade.subjects.map(subj => (
                    <div 
                      key={subj.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 text-right"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{subj.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-3xs text-slate-400">
                          {subj.pdfUrl && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-emerald-450">📕 كتاب</span>}
                          {subj.memoPdfUrl && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-cyan-450">📝 مذكرة</span>}
                          {subj.videoUrl && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-rose-455">📺 فيديو</span>}
                          {subj.interactiveUrl && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-yellow-450">⚡ تفاعلي</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSubject(subj)}
                          className="p-1.5 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg text-emerald-400 hover:text-emerald-350 cursor-pointer"
                          title="تعديل الروابط والمسميات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subj.id, subj.name)}
                          className="p-1.5 hover:bg-slate-850 rounded-lg text-rose-500 hover:text-rose-400 cursor-pointer"
                          title="حذف المادة من المنهج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 border-dashed rounded-3xl">
              يرجى تحديد الصف والسنة الدراسية بالأعلى لعرض وإضافة وتحديث المواد ومصادرها تفصيلياً.
            </div>
          )}

          {/* Form: Add or Edit Subject */}
          <div id="subject-form-anchor" />
          {(editingSubjectId || isAddingNew) && (
            <form onSubmit={handleSaveSubject} className="border border-emerald-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <h4 className="text-xs font-black text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-450" />
                  <span>{isAddingNew ? `إضافة مادة دراسية جديدة لـ: ${activeGrade?.name}` : `تعديل المادة: ${subjectName}`}</span>
                </h4>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-3xs font-extrabold cursor-pointer"
                >
                  إلغاء التعديل ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-[11px] font-bold text-slate-350 block">مسمى المادة الدراسية:</label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="على سبيل المثال: الفيزياء الميكانيكية، الرياضيات"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-[11px] font-bold text-slate-350 block">مسمى ونوع الأيقونة المرئية (Lucide-Icon):</label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-600"
                  >
                    <option value="BookOpen">كتاب مفتوح (BookOpen)</option>
                    <option value="Calculator">حاسبة (Calculator)</option>
                    <option value="Atom">ذرة (Atom)</option>
                    <option value="Compass">بوصلة / هندسة (Compass)</option>
                    <option value="Languages">لغات (Languages)</option>
                    <option value="Globe">كرة أرضية (Globe)</option>
                    <option value="Palette">رسم وفنون (Palette)</option>
                    <option value="Heart">آداب وصحة (Heart)</option>
                    <option value="Cpu">تقنية ومعلومات (Cpu)</option>
                    <option value="Zap">كهرباء وطاقة (Zap)</option>
                    <option value="History">تاريخ وأثر (History)</option>
                    <option value="Map">خرائط (Map)</option>
                    <option value="Smile">طفولة وبراعم (Smile)</option>
                    <option value="Award">شرف تفوق (Award)</option>
                    <option value="Flame">حرارية وتفاعل (Flame)</option>
                    <option value="Disc">أقراص / حركة (Disc)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block">ملخص ونبذة سريعة عن المنهج السوداني المقرر:</label>
                  <textarea
                    rows={2}
                    value={curriculumSummary}
                    onChange={(e) => setCurriculumSummary(e.target.value)}
                    placeholder="توضيح مختصر ومتميز للمحاور لتساعد الطالب وتقدم له نبذة سريعة عند تصفح المواد..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all"
                  />
                </div>

                {/* Interactive Link */}
                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-yellow-450" />
                    <span>رابط الموقع التفاعلي / تجارب المحاكاة:</span>
                  </label>
                  <input
                    type="url"
                    value={interactiveUrl}
                    onChange={(e) => setInteractiveUrl(e.target.value)}
                    placeholder="https://example.com/interactive-app"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block">عنوان أو مسمى الرابط التفاعلي (مخصص):</label>
                  <input
                    type="text"
                    value={interactiveLabel}
                    onChange={(e) => setInteractiveLabel(e.target.value)}
                    placeholder="مثال: تجربة الفولت والمقاومة PhET"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all"
                  />
                </div>

                {/* Book PDF Download */}
                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-450" />
                    <span>رابط تحميل ملف الكتاب المدرسي الإلكتروني (E-Book):</span>
                  </label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="رابط مباشر لمستند Google Drive أو ملف PDF"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>

                {/* Memorandum link */}
                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-cyan-450" />
                    <span>رابط تحميل ملخص أو مذكرة تفوق داعمة (ملف PDF):</span>
                  </label>
                  <input
                    type="url"
                    value={memoPdfUrl}
                    onChange={(e) => setMemoPdfUrl(e.target.value)}
                    placeholder="رابط مباشر لملخص المادة، أسئلة وأجوبة ملخصة"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>

                {/* Video lessons Link */}
                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-rose-455" />
                    <span>رابط قناة أو قائمة تشغيل الفيديوهات والشروحات (YouTube):</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="رابط الدرس المرئي على يوتيوب أو ملف خارجي"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-[11px] font-bold text-slate-350 block">مسمى ألوان الكارت التجميلية (Tailwind):</label>
                  <select
                    value={colorClass}
                    onChange={(e) => setColorClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-600"
                  >
                    <option value="bg-blue-105 text-blue-900 border-blue-200">أزرق سماوي رياضي</option>
                    <option value="bg-emerald-100 text-emerald-800 border-emerald-200">أخضر زمردي ديني ولغوي</option>
                    <option value="bg-rose-100 text-rose-800 border-rose-200">أحمر وردي علمي</option>
                    <option value="bg-yellow-105 text-yellow-950 border-yellow-250">أصفر ذهبي منير</option>
                    <option value="bg-purple-100 text-purple-800 border-purple-200">بنفسجي أدبي</option>
                    <option value="bg-teal-100 text-teal-800 border-teal-200">أخضر تركواز معاصر</option>
                    <option value="bg-amber-100 text-amber-800 border-amber-205">بني عسلي أثري وتاريخي</option>
                    <option value="bg-cyan-100 text-cyan-800 border-cyan-200">سماوي رقمي وتكنولوجي</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-550 text-[#ffffff] rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>تأكيد وحفظ بيانات المادة الدراسية</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab Contents: Supabase Settings */}
      {activeTab === "supabase" && (
        <form onSubmit={handleSaveKeys} className="space-y-6 relative z-10 text-right">
          <div className="bg-gradient-to-l from-indigo-950/20 to-slate-900/40 border border-indigo-900/30 rounded-2xl p-4 flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 leading-normal">
              <h4 className="text-xs font-black text-slate-200">قاعدة بيانات Supabase الديناميكية:</h4>
              <p className="text-2xs text-slate-400">
                بربط منصتك مع سوبابيس، لن تكون المسميات أو روابط المواد ثابتة أو مؤقتة في المتصفح! ستتم السيطرة عليها وتخزينها سحابياً بجداول علائقية آمنة في بيئتك السحابية وتقرأ وتقسم بالكامل فوراً.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-indigo-300 block">رابط المشروع (Supabase Project URL):</label>
              <input
                type="url"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-indigo-300 block">مفتاح المشروع المجهول (Anon IP Key Security):</label>
              <input
                type="password"
                value={sbAnonKey}
                onChange={(e) => setSbAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl p-3 text-xs text-slate-200 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {sbStatus && (
            <div className="p-4 rounded-xl text-3xs font-mono border bg-slate-950/80 border-slate-800 text-slate-350 leading-relaxed whitespace-pre-line">
              {sbStatus}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 justify-between">
            <button
              type="button"
              onClick={handleCreateDatabaseTable}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-3xs font-extrabold cursor-pointer transition-all"
            >
              🛠️ عرض أمر إنشاء الجداول (SQL Script)
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSbLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSbLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>اتصال وحفظ المفاتيح</span>
              </button>
            </div>
          </div>

          {/* Cloud Sync Operations Box */}
          <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/40 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Award className="w-4 h-4 text-amber-500" />
              <h5 className="text-xs font-black text-slate-200">عمليات المزامنة السحابية للبيانات العامة:</h5>
            </div>

            <p className="text-2xs text-slate-400 leading-relaxed">
              بمجرد الاتصال وحفظ المفاتيح، يمكنك الضغط على "رفع ومزامنة المناهج الحالية" لإرسال جدول المناهج الحالي من متصفحك إلى قاعدة بيانات سوبابيس (مرة واحدة فقط لتأسيس البيانات)، ثم استخدام "سحب وتحميل المناهج السحابية" لتحميل منهج سوبابيس ديناميكياً دائماً.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSyncToCloud}
                disabled={isSbLoading || !sbUrl || !sbAnonKey}
                className="px-4 py-2.5 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900 text-emerald-450 hover:text-emerald-400 font-extrabold text-2xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>☁️ رفع ومزامنة المناهج الحالية إلى سوبابيس</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={isSbLoading || !sbUrl || !sbAnonKey}
                className="px-4 py-2.5 bg-indigo-950/30 hover:bg-indigo-950/60 border border-indigo-900 text-indigo-400 hover:text-indigo-305 font-extrabold text-2xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>📥 سحب وتحميل المناهج المحفوظة بـ سوبابيس</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
