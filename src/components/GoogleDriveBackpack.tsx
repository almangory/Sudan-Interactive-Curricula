import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cloud, Check, RefreshCw, LogOut, FolderOpen, FileText, 
  Upload, HelpCircle, AlertCircle, Paperclip } from "lucide-react";
import { 
  googleSignIn, logout, listDriveFiles, createFolder, 
  uploadFileToDrive, getAccessToken, auth, DriveFile 
} from "../lib/driveAuth";

export default function GoogleDriveBackpack() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on mount and monitor auth state
  useEffect(() => {
    const checkState = async () => {
      const activeToken = await getAccessToken();
      const currentUser = auth.currentUser;
      if (activeToken && currentUser) {
        setUser(currentUser);
        setToken(activeToken);
        loadBackupFiles(activeToken);
      }
    };
    checkState();

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      const activeToken = await getAccessToken();
      if (currentUser && activeToken) {
        setUser(currentUser);
        setToken(activeToken);
        loadBackupFiles(activeToken);
      } else {
        setUser(null);
        setToken(null);
        setFiles([]);
        setFolderId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadBackupFiles = async (accessToken: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Check or create "المناهج السودانية 🇸🇩" folder in Drive
      const fId = await createFolder(accessToken, "المناهج السودانية 🇸🇩");
      setFolderId(fId);
      
      // 2. Load files inside folder
      const query = `'${fId}' in parents and trashed = false`;
      const driveFiles = await listDriveFiles(accessToken, query);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error("Error loading files:", err);
      // If token is invalid or expired, trigger silent logout
      if (err.message && (err.message.includes("401") || err.message.includes("invalid") || err.message.includes("expired"))) {
        await handleLogout();
      } else {
        setError(err.message || "فشل تحميل ملفات المحفظة السحابية.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        await loadBackupFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/popup-closed-by-user" || (err.message && (err.message.includes("popup-closed-by-user") || err.message.includes("closed-by-user")))) {
        setError("تم إغلاق نافذة تسجيل الدخول قبل اكتمال ربط حساب Google Drive.");
      } else {
        setError("لم نتمكن من الاتصال بـ Google Drive. يرجى محاولة تسجيل الدخول مجدداً أو التحقق من اتصالك بالإنترنت.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setFiles([]);
      setFolderId(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const syncFiles = async () => {
    if (token) {
      await loadBackupFiles(token);
    }
  };

  // Custom File Uploader logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !token || !folderId) return;

    try {
      setUploading(true);
      setError(null);
      
      await uploadFileToDrive(
        token,
        selectedFile.name,
        selectedFile.type || "application/octet-stream",
        selectedFile,
        folderId
      );

      setSuccessMsg(`✓ تم تحميل الملف "${selectedFile.name}" بنجاح إلى حقيبتك السحابية!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      
      // Reload backup files
      await loadBackupFiles(token);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "فشلت عملية تحميل الملف.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div id="google-drive-backpack" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-right" dir="rtl">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/35 text-emerald-400 text-3xs font-black">
            <Cloud className="w-3.5 h-3.5" />
            <span>خدمة التخزين السحابي الدراسي</span>
          </div>
          <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <span>حقيبة الـ Google Drive المدرسية 🎒</span>
          </h3>
          <p className="text-2xs text-slate-350">
            احفظ كتبك ومذكراتك التفاعلية، وحمّل واجباتك وصورك الدراسية على حساب Google الخاص بك مباشرة وآمن ومزامن دائماً!
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-2 rounded-2xl">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Google user avatar" 
                className="w-8 h-8 rounded-full border border-emerald-500/35"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="text-right">
              <span className="text-2xs font-extrabold text-slate-200 block max-w-[120px] truncate">{user.displayName}</span>
              <span className="text-[10px] text-emerald-400 block font-medium">سحابي نشط 🟢</span>
            </div>
            
            <button 
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/35 hover:border-red-500 text-red-400 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main drive content split areas */}
      {!user ? (
        <div className="flex flex-col md:flex-row items-center gap-8 py-4 px-2">
          {/* Landing Promo Panel */}
          <div className="flex-1 space-y-4">
            <h4 className="text-base font-black text-slate-200">لماذا يجب عليك ربط حقيبتك المدرسية بـ Google Drive؟</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                <span className="text-emerald-400 text-xs font-bold font-mono">1. مزامنة فورية</span>
                <p className="text-3xs text-slate-400 leading-normal">
                  حفظ كتب المقررات والمذكرات بضغطة زر واحدة داخل مجلد دراسي منظم على درايف الشخصي الخاص بك.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                <span className="text-emerald-400 text-xs font-bold font-mono">2. رفع الواجبات والملفات</span>
                <p className="text-3xs text-slate-400 leading-normal">
                  ارفع ملخصاتك، كتبك الخاصة، أو مذكراتك المحررة من هاتفك أو حاسوبك فورياً لحقيبتك الخاصة.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                <span className="text-emerald-400 text-xs font-bold font-mono">3. آمن وبدون قيود</span>
                <p className="text-3xs text-slate-400 leading-normal">
                  اتصال مباشر وآمن ومشفر بقنوات Google OAuth الرسمية دون تخزين أي من بياناتك على خوادمنا.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                <span className="text-emerald-400 text-xs font-bold font-mono">4. مذكرات المعلم</span>
                <p className="text-3xs text-slate-400 leading-normal">
                  احفظ مذكرات المراجعة النهائية المقترحة للمرحلة الابتدائية والمتوسطة والثانوية وراجعها في أي وقت دون تحميل.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-550 border border-emerald-500/40 text-white font-black text-xs rounded-2xl transition-all shadow-lg hover:shadow-emerald-900/10 cursor-pointer disabled:opacity-65"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 fill-white/10" />}
                <span>ربط المنصة وتفعيل Google Drive الآن</span>
              </button>
            </div>
          </div>

          {/* Graphical Mockup */}
          <div className="w-full md:w-[32%] flex flex-col justify-center items-center p-6 bg-slate-950/40 rounded-3xl border border-slate-800 text-center space-y-4">
            <div className="p-5 rounded-full bg-slate-900 border border-slate-800 text-emerald-450 shadow-inner animate-pulse">
              <FolderOpen className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200 block">المجلد المدرسي بانتظارك</span>
              <p className="text-3xs text-slate-400 leading-relaxed">
                مسار آمن: "المناهج السودانية 🇸🇩"
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Authenticated Dashboard Actions and File Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* File list browser panel (Left 8 columns on large screens) */}
            <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <h4 className="text-sm font-bold text-slate-205 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span>الملفات المحفوظة بالحقيبة السحابية ({files.length}):</span>
                </h4>
                
                <button 
                  onClick={syncFiles}
                  disabled={loading}
                  title="مزامنة"
                  className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-900/50 text-3xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-emerald-450" : ""}`} />
                  <span>تحديث</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-10 h-10 animate-spin text-emerald-455" />
                  <p className="text-2xs text-slate-400 font-extrabold text-center">جاري استعراض ملفات درايف ومزامنتها... ⏳</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-full w-fit mx-auto text-slate-400">
                    <Cloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <span className="text-xs font-bold text-slate-200 block">لا توجد ملفات مخزنة حالياً في حقيبتك</span>
                    <p className="text-3xs text-slate-450 leading-relaxed">
                      حقيبة الدراسة خالية. افتح أي مادة في المناهج بالأسفل واضغط على زر **"حفظ في Google Drive"** لحفظ الكتاب المدرسي، أو استخدم خيار التحميل اليدوي السريع.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl hover:border-emerald-900/35 transition-all text-right flex items-center gap-2.5 justify-between"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-2 bg-emerald-950/30 border border-emerald-900/30 rounded-lg text-emerald-400 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate text-right">
                            <span className="text-xs font-bold text-slate-200 block truncate" title={file.name}>{file.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">
                              {file.createdTime 
                                ? new Date(file.createdTime).toLocaleDateString("ar-SD", { day: "numeric", month: "long" }) 
                                : "مؤخراً"} 
                              {file.size ? ` • ${(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB` : ""}
                            </span>
                          </div>
                        </div>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-900/30 hover:bg-emerald-950 border border-emerald-805 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                          >
                            <span>فتح</span>
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Manual Uplader section (Right 4 columns) */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-205 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>تحميل ملف يدوي للحقيبة:</span>
                </h4>
                <p className="text-3xs text-slate-400 leading-normal">
                  هل لديك ملف واجب منزلي، صورة لحل تمرين، أو كتاب مدرسي إضافي؟ ارفعه هنا ليكون محفوظاً في مجلدك السحابي فوراً.
                </p>
              </div>

              {/* Upload area */}
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-800 rounded-xl p-4 text-center space-y-2 cursor-pointer transition-all ${
                  uploading 
                    ? "bg-slate-900/40 border-slate-705 cursor-not-allowed" 
                    : "hover:bg-slate-900/40 hover:border-emerald-900/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                
                {uploading ? (
                  <div className="space-y-1">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-450" />
                    <span className="text-[10px] font-bold text-slate-200 block">جاري رفع الملف لـ Google Drive... ⏳</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Paperclip className="w-5 h-5 mx-auto text-slate-400" />
                    <span className="text-3xs font-bold text-emerald-400 block hover:underline">اضغط هنا واعلمنّا بالملف المقترح 📁</span>
                    <span className="text-[9px] text-slate-500 block">يدعم PDF، صور، أو مذكرات (الحد الأقصى: 15 ميجا)</span>
                  </div>
                )}
              </div>

              {/* Context notification info */}
              <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-900 border border-slate-850 rounded-xl p-2.5">
                📁 مجلد وجهتك السحابية:
                <strong className="text-emerald-450"> Google Drive / المناهج السودانية 🇸🇩</strong>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Success and General Errors */}
      {successMsg && (
        <div className="px-4 py-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-450" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-medium rounded-2xl flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>تنبيه: {error}</span>
        </div>
      )}

    </div>
  );
}
