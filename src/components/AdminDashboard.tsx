import React, { useState, useEffect } from "react";
import { 
  Database, Save, Plus, Trash2, Edit3, Settings, AlertTriangle, CheckCircle, 
  RefreshCw, Globe, BookOpen, Video, FileText, LayoutGrid, X, Sparkles, Award,
  Users, ShieldAlert, CheckCircle2, UserCheck
} from "lucide-react";
import { Stage, Grade, Subject } from "../data/curriculum";
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient, saveCurriculumToSupabase, fetchCurriculumFromSupabase, testSupabaseConnection, AppUser, fetchAllRegisteredUsers, updateUserRoleAndPermissions } from "../lib/supabase";

interface AdminDashboardProps {
  stages: Stage[];
  onUpdateCurriculum: (newStages: Stage[]) => void;
  onClose: () => void;
}

export default function AdminDashboard({ stages, onUpdateCurriculum, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "supabase" | "users">("edit");
  
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
  const [colorClass, setColorClass] = useState("bg-blue-105 text-blue-900 border-blue-200");
  const [hidden, setHidden] = useState<boolean>(false);

  // Supabase states
  const [sbUrl, setSbUrl] = useState("");
  const [sbAnonKey, setSbAnonKey] = useState("");
  const [sbStatus, setSbStatus] = useState<string | null>(null);
  const [isSbLoading, setIsSbLoading] = useState(false);
  const [showSqlBlock, setShowSqlBlock] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // User & Teacher Management States
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [modifyingUserId, setModifyingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) return;
    setIsLoadingUsers(true);
    try {
      const list = await fetchAllRegisteredUsers();
      setUsersList(list);
    } catch (e) {
      console.warn("Could not load users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);
  
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
    setHidden(false);
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
    setHidden(!!subj.hidden);
    
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
        videoUrl: videoUrl.trim() || undefined,
        hidden: hidden
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
                  videoUrl: videoUrl.trim() || undefined,
                  hidden: hidden
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

      // Test connection to 'users' table (general student registration)
      try {
        const { error: genUsersError } = await client
          .from("users")
          .select("id")
          .limit(1);

        if (genUsersError) {
          if (genUsersError.code === "PGRST404") {
            statusMsg += "⚠️ الجدول 'users' الخاص بـتسجيل الطلاب غير متوفر حالياً في قاعدة بياناتك.\n";
          } else {
            statusMsg += `⚠️ خطأ في جدول 'users': ${genUsersError.message}\n`;
          }
        } else {
          statusMsg += "✅ تم الاتصال والتحقق من جدول الحسابات العامة 'users' بنجاح!\n";
        }
      } catch (err: any) {
        statusMsg += `⚠️ فشل الاستعلام من جدول 'users': ${err.message || err}\n`;
      }

      setSbStatus(statusMsg || "✅ تم الاتصال والتحقق من جداول المناهج والمستخدمين بنجاح سحابياً!");
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
      if (response && response.success) {
        if (response.savedTable === "curricula_links") {
          showFeedback("تم رفع وحفظ المنهج الدراسي بالكامل كسطور منفردة في جدول curricula_links بنجاح! ⭐", "success");
          setSbStatus(
            `✅ تم حفظ ومزامنة المناهج بنجاح سحابياً!\n` +
            `• جدول الاستقبال النشط: 'curricula_links' (المناهج التفصيلية)\n` +
            `• نمط التخزين: سطور تفصيلية منفصلة (${response.rowCount} مادة دراسية ومستند تم توزيعها بنجاح)\n\n` +
            `تأكد من فتح جدول 'curricula_links' في سوبابيس لرؤية البيانات تفصيلياً.`
          );
        } else {
          showFeedback("⚠️ تم الرفع الاحتياطي بجدول التكوين بنجاح.", "info");
          setSbStatus(
            `⚠️ تنبيه: تم الرفع بنجاح ولكن عبر جدول النسخ الاحتياطية 'curriculum_config' كمصفوفة JSON مجتمعة.\n` +
            `السبب هو أن جدول التفاصيل 'curricula_links' ربما غير جاهز للاستقبال المباشر بسبب قاعدة الأمان أو صلاحيات RLS.\n\n` +
            `الأخطاء التي حدثت أثناء محاولة الاستعلام للجدول العام:\n` +
            `${response.errors.join("\n")}\n\n` +
            `💡 لتوزيع المناهج بسطور تفصيلية كاملة بـ curricula_links:\n` +
            `1. تأكد من تشغيل كود الإنشاء (SQL Script) لجدول 'curricula_links' وصلاحيات RLS المرافقة له بالكامل.\n` +
            `2. إذا كان الجدول قد تم إنشاؤه مسبقاً، يرجى تشغيل الكود التالي في لوحة تحكم سوبابيس لإعادة تنشيط الذاكرة المؤقتة:\n` +
            `NOTIFY pgrst, 'reload schema';`
          );
        }
      } else {
        const errorDetail = response?.errors?.join(" \n ") || "فشل غير معروف.";
        throw new Error(errorDetail);
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
        setSbStatus("✅ تم سحب البيانات المحدثة ديناميكياً من سوبابيس بنجاح وتحميلها بالكامل في متصفحك الحالي.");
      } else {
        throw new Error("قاعدة بيانات سوبابيس لا تحتوي على منهج محفوظ تحت المعرف 'curriculum' أو أن المسميات فارغة.");
      }
    } catch (err: any) {
      setSbStatus(`❌ فشل تحميل البيانات من السحابة: ${err.message}`);
      showFeedback("فشل جلب البيانات.", "error");
    } finally {
      setIsSbLoading(false);
    }
  };

  const sqlCode = `-- 1. إنشاء جدول المناهج والروابط
CREATE TABLE IF NOT EXISTS curricula_links (
  id TEXT PRIMARY KEY,
  stage_id TEXT,
  stage_name TEXT,
  stage_description TEXT,
  stage_theme TEXT,
  stage_icon TEXT,
  grade_id TEXT,
  grade_name TEXT,
  name TEXT,
  icon_name TEXT,
  color_class TEXT,
  interactive_url TEXT,
  interactive_label TEXT,
  curriculum_summary TEXT,
  pdf_url TEXT,
  memo_pdf_url TEXT,
  video_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- تمكين الوصول العام للقراءة والكتابة لـ RLS:
ALTER TABLE curricula_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read write for all" ON curricula_links FOR ALL USING (true) WITH CHECK (true);

-- 2. إنشاء جدول المستخدمين للمصادقة
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for everyone" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow insert update for all" ON admin_users FOR ALL USING (true) WITH CHECK (true);

-- إضافة مستخدم إداري افتراضي:
INSERT INTO admin_users (username, password) VALUES ('almangory', '20302060') ON CONFLICT DO NOTHING;

-- 3. إنشاء جدول الطلاب والمستخدمين العامين وتراخيص الأساتذة (users)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  provider TEXT DEFAULT 'email',
  user_role TEXT DEFAULT 'student',
  grade_id TEXT DEFAULT NULL,
  grade_name TEXT DEFAULT NULL,
  specialties TEXT DEFAULT NULL,
  contact_method TEXT DEFAULT NULL,
  status TEXT DEFAULT 'active',
  is_approved_teacher BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for everyone on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert update for all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 4. تنشيط ذاكرة الكاش المؤقتة لـ PostgREST لتسريع قراءة وحفظ الأعمدة الجديدة:
NOTIFY pgrst, 'reload schema';`;

  const handleCreateDatabaseTable = async () => {
    setShowSqlBlock(prev => !prev);
    if (!showSqlBlock) {
      showFeedback("تم تفعيل كود الـ SQL بالأسفل، تفضل بنسخه الآن! 📋", "info");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    showFeedback("تم نسخ كود SQL الإنشاء إلى كاش السيرفر الحافظ بنجاح! 📋", "success");
    setTimeout(() => setCopiedSql(false), 3000);
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

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-violet-600 text-[#ffffff] shadow-md shadow-violet-950"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👤 إدارة الحسابات وصلاحيات المعلمين</span>
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
                          {subj.hidden && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-950/20 border border-yellow-900/35 rounded font-black text-amber-500">👁️‍🗨️ مخفي</span>}
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

                {/* Hide / Visibility Toggle */}
                <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-right">
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold text-amber-400 block">إخفاء هذا المقرر ومحتوياته من الموقع 👁️‍🗨️</span>
                    <p className="text-[10px] text-slate-400">عند تفعيل هذا الخيار، سيتم حجب بطاقة المادة بالكامل عن الطلاب وأجهزة الزوّار ولن تظهر إلا للمسؤولين فقط لتعديلها لاحقاً.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hidden}
                      onChange={(e) => setHidden(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-emerald-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-950/40 border border-slate-700/60 transition-all"></div>
                  </label>
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

          {showSqlBlock && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-right animate-fade-in relative z-10" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs leading-none">⚠️</span>
                  <h4 className="text-xs font-black text-slate-100">تهيئة وتأسيس الجداول في لوحة سوبابيس (SQL Script)</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-[#ffffff] rounded-lg text-3xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  {copiedSql ? "✅ تم نسخ الكود" : "📋 نسخ الكود بالكامل"}
                </button>
              </div>

              <p className="text-3xs text-slate-400 leading-relaxed">
                يرجى نسخ الكود بالكامل ثم لصقه وتشغيله في صفحة <strong className="text-indigo-300">SQL Editor</strong> الممتازة بمشروعك في لوحة تحكم <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Supabase</a> لتأسيس وبناء جدول المناهج <code className="text-indigo-300 font-mono">curricula_links</code> وصلاحيات الأمان بنجاح.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={sqlCode}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-3xs font-mono text-slate-300 cursor-text leading-relaxed select-all"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1.5">
                <h5 className="text-3xs font-black text-indigo-300 flex items-center gap-1">
                  <span>💡 تنبيه هام لعملاء منصة الاستضافة (Vercel):</span>
                </h5>
                <p className="text-3xs text-slate-400 leading-normal">
                  لضمان بقاء المنصة متصلة بقاعدتكم السحابية سوبابيس دائماً دون انقطاع أو الحاجة لتسجيل الكود، يرجى ملء مفتاح ورابط المشروع في إعدادات البيئة (Environment Variables) بموقع <strong className="text-slate-200">Vercel</strong> بالأسماء التالية:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs font-mono text-indigo-200 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400">اسم المتغير 1:</span> <span className="text-emerald-400 select-all">VITE_SUPABASE_URL</span>
                  </div>
                  <div>
                    <span className="text-slate-400">اسم المتغير 2:</span> <span className="text-emerald-400 select-all">VITE_SUPABASE_ANON_KEY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Webhook Sync Guide Box */}
          <div className="border border-indigo-905/40 rounded-2xl p-5 bg-indigo-950/20 space-y-3.5 text-right" dir="rtl">
            <div className="flex items-center gap-2 border-b border-indigo-900/40 pb-2.5">
              <span className="p-1 bg-indigo-650/30 text-indigo-400 rounded-lg text-xs leading-none">⚡</span>
              <h5 className="text-xs font-black text-slate-200">مزامنة تلقائية فورية للمستعرضات (Realtime Webhooks Setup):</h5>
            </div>

            <p className="text-2xs text-slate-400 leading-relaxed text-right">
              لتفعيل المزامنة الفورية لمستشعرات التعديل (Webhook) لتعكس بيانات سوبابيس في الموقع بشكل لحظي ودون الحاجة لتحديث الصفحة، اتبع الخطوات التالية في لوحة تحكم سوبابيس الخاصة بك:
            </p>

            <ul className="list-decimal list-inside text-3xs text-slate-350 space-y-2 leading-relaxed text-right">
              <li>
                اذهب إلى صفحة <strong className="text-indigo-300">Database {"->"} Webhooks</strong> في سوبابيس.
              </li>
              <li>
                اضغط على زر <strong className="text-emerald-400">Create Webhook</strong> لإنشاء إشعار ويب جديد.
              </li>
              <li>
                سمّ التنبيه مثلاً: <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-800">sync_curriculum</code>، واختر الجدول <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-800">curricula_links</code>.
              </li>
              <li>
                اختر الأحداث أو التعديلات: <strong className="text-slate-200">INSERT, UPDATE, DELETE</strong>.
              </li>
              <li>
                اجعل طريقة الطلب <strong className="text-indigo-400">POST</strong>، والصق الرابط التالي في خانه الـ <strong className="text-indigo-300">Webhook URL</strong>:
              </li>
            </ul>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 font-mono text-3xs overflow-x-auto text-emerald-400 select-all" style={{ direction: "ltr", textAlign: "left" }}>
              <span>{`${window.location.origin}/api/webhooks/supabase`}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/supabase`);
                  showFeedback("تم نسخ رابط الويب هوك بنجاح! 📋", "success");
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-[#ffffff] rounded-lg text-3xs font-black cursor-pointer transition-all shrink-0 select-none animate-pulse-subtle"
              >
                نسخ الرابط
              </button>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-xl">
              <p className="text-3xs text-slate-405 leading-normal text-right">
                💡 <strong className="text-indigo-350 font-black">كيف تعمل؟</strong> بمجرد قيامك (أو أي مستخدم) بتعديل المناهج من هنا أو يدوياً عبر قاعدة البيانات، يقوم الـ Webhook بتنبيه الخادم الخاص بنا فورياً، ويقوم الخادم بدوره ببث تحديث لحظي لجميع المتصفحات المفتوحة حالياً لتحديث الواجهات بثوانٍ بدون لمس زر التحديث!
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Tab Contents: Users & Teachers Management */}
      {activeTab === "users" && (
        <div className="space-y-6 relative z-10 text-right" dir="rtl">
          <div className="border border-slate-800 rounded-3xl p-6 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span>إدارة حسابات المعلمين والطلاب وتخصيص الصلاحيات</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">يمكنك تفعيل صلاحيات الأساتذة للتحكم بالمحتوى وتصفح الصفوف والمواد لكل مستخدم مسجل بقاعدة بياناتك.</p>
              </div>
              <button
                type="button"
                onClick={fetchUsers}
                disabled={isLoadingUsers}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 active:scale-95 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-3xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                <span>تحديث القائمة</span>
              </button>
            </div>

            {/* If Supabase connection is not verified or initialized */}
            {!getSupabaseConfig().isConfigured ? (
              <div className="p-5 bg-amber-955/25 border border-amber-900/40 rounded-2xl space-y-2 text-right">
                <div className="flex items-center gap-1.5 text-amber-450 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>سوبابيس (Supabase) غير مهيأة بعد!</span>
                </div>
                <p className="text-3xs text-slate-300 leading-normal">
                  يرجى الانتقال أولاً إلى تبويب <strong className="text-amber-400">"إعداد ومزامنة سوبابيس"</strong> وإدخال مفاتيح الربط لتأسيس الجداول والحصول على بيانات الحسابات من السيرفر.
                </p>
              </div>
            ) : isLoadingUsers ? (
              <div className="py-12 text-center text-slate-400 space-y-2.5">
                <RefreshCw className="w-7 h-7 mx-auto animate-spin text-violet-500" />
                <p className="text-3xs font-bold font-sans">جاري تحميل وسحب بيانات الحسابات من سوبابيس...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2.5 border border-dashed border-slate-800/70 rounded-2xl bg-slate-950/20">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-3xs font-black font-sans">لم يتم تسجيل أي طالب أو أستاذ بقاعدة البيانات حالياً.</p>
                <p className="text-[10px] text-slate-505 font-sans">حاول تسجيل حساب جديد من زر "حساب الطالب" بالصفحة الرئيسية أولاً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/30">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-black uppercase">
                      <th className="p-3.5 pr-5">المستخدم والبريد الإلكتروني</th>
                      <th className="p-3.5">نوع الحساب</th>
                      <th className="p-3.5">التفاصيل / التخصص الدراسي</th>
                      <th className="p-3.5">وسيلة التواصل</th>
                      <th className="p-3.5">حالة وتراخيص الأستاذ</th>
                      <th className="p-3.5 pl-5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300">
                    {usersList.map((usr) => {
                      const isTeacher = usr.user_role === "teacher";
                      const isApproved = !!usr.is_approved_teacher;
                      
                      return (
                        <tr key={usr.id} className="hover:bg-slate-900/35 transition-colors">
                          <td className="p-3.5 pr-5">
                            <div className="font-extrabold text-slate-200 flex items-center gap-1.5">
                              <span>{usr.username}</span>
                              {usr.provider === "google" ? (
                                <span className="px-1.5 py-0.5 bg-sky-950 text-sky-404 border border-sky-900/40 rounded-md text-[8px] font-black">Google</span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[8px]">بريد</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 select-all">{usr.email}</div>
                          </td>
                          <td className="p-3.5">
                            {isTeacher ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-955/40 text-amber-400 border border-amber-900/40 rounded-xl text-[10px] font-black shadow-inner">
                                👨‍🏫 أستاذ / معلم
                              </span>
                            ) : usr.user_role === "admin" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-955/40 text-rose-455 border border-rose-900/40 rounded-xl text-[10px] font-black shadow-inner">
                                🔑 مدير النظام
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 rounded-xl text-[10px] font-black shadow-inner">
                                🎓 طالب مصدق
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isTeacher ? (
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block text-right">تخصص المواد:</span>
                                <div className="flex flex-wrap gap-1 justify-start">
                                  {usr.specialties ? (
                                    usr.specialties.split(",").map((spec, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] text-[#ffffff] font-extrabold">
                                        {spec.trim()}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-500 italic">غير محدد بعد</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold">الصف والمرحلة:</span>
                                <p className="text-[10px] text-slate-200 font-medium">{usr.grade_name || "غير محدد / لم يدرس بعد"}</p>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {usr.contact_method ? (
                              <span className="font-mono text-3xs text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-850 select-all">
                                {usr.contact_method}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">غير متوفر</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isTeacher ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                                  <span className={`text-[10px] font-extrabold ${isApproved ? "text-emerald-455" : "text-rose-450"}`}>
                                    {isApproved ? "تم تفعيل الصلاحية" : "تحت المراجعة (معطل)"}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 block">حالة الحساب: {usr.status === "active" ? "نشط" : "معلق"}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">- لا ينطبق -</span>
                            )}
                          </td>
                          <td className="p-3.5 pl-5 text-center">
                            {modifyingUserId === usr.id ? (
                              <span className="text-3xs text-slate-400 font-bold animate-pulse">جاري التحديث...</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                {isTeacher ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setModifyingUserId(usr.id);
                                        const res = await updateUserRoleAndPermissions(usr.id, "teacher", !isApproved, "active");
                                        if (res.success) {
                                          showFeedback(isApproved ? "🚫 تم إيقاف صلاحيات المعلم بنجاح" : "✅ تم تفعيل صلاحيات المعلم وتنشيطه بنجاح", "success");
                                          fetchUsers();
                                        } else {
                                          showFeedback(`خطأ في التحديث: ${res.error}`, "error");
                                        }
                                        setModifyingUserId(null);
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                        isApproved
                                          ? "bg-rose-955/35 hover:bg-rose-955/50 text-rose-455 border border-rose-900/60"
                                          : "bg-emerald-950 hover:bg-emerald-900 text-emerald-455 border border-emerald-800"
                                      }`}
                                    >
                                      {isApproved ? "إلغاء الترخيص" : "تفعيل المعلم 👨‍🏫"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setModifyingUserId(usr.id);
                                        const res = await updateUserRoleAndPermissions(usr.id, "student", false, "active");
                                        if (res.success) {
                                          showFeedback("🔄 تم تحويل الحساب بنجاح لصفة طالب", "success");
                                          fetchUsers();
                                        } else {
                                          showFeedback(`خطأ: ${res.error}`, "error");
                                        }
                                        setModifyingUserId(null);
                                      }}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-3xs font-extrabold cursor-pointer transition-all"
                                      title="تحويل الحساب إلى طالب"
                                    >
                                      طالب 🎓
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setModifyingUserId(usr.id);
                                        const res = await updateUserRoleAndPermissions(usr.id, "teacher", true, "active");
                                        if (res.success) {
                                          showFeedback("🔄 تم ترقية الطالب بنجاح لصفة أستاذ مرخص", "success");
                                          fetchUsers();
                                        } else {
                                          showFeedback(`خطأ: ${res.error}`, "error");
                                        }
                                        setModifyingUserId(null);
                                      }}
                                      className="px-2.5 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900 text-indigo-400 hover:text-indigo-305 rounded-lg text-3xs font-black cursor-pointer transition-all"
                                    >
                                      ترقية لأستاذ 👨‍🏫
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
