import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, Award, Compass, BookOpen, Clock, Heart, 
  Map, Sparkles, Star, ChevronLeft, ChevronDown, CheckCircle, 
  Search, ShieldAlert, History, Globe, Plus, FileText, Video, Filter
} from "lucide-react";
import { stagesData, Stage, Grade, Subject } from "./data/curriculum";
import SubjectModal from "./components/SubjectModal";
import AddSubjectModal from "./components/AddSubjectModal";
import DynamicIcon from "./components/DynamicIcon";

export default function App() {
  // Curriculum data is retrieved directly from the server-side compiled curriculum.ts (stagesData)
  // This is the absolute single source of truth for all devices and users.
  const [curriculumData, setCurriculumData] = useState<Stage[]>(stagesData);

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
  const [categoryFilter, setCategoryFilter] = useState<"all" | "books" | "videos" | "interactive">("all");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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

  // Set default stage from loaded curriculumData
  useEffect(() => {
    if (curriculumData.length > 1 && !selectedStage) {
      setSelectedStage(curriculumData[1]); // Default to primary stage
    }
  }, [curriculumData]);

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
  }, [curriculumData]);

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

      const result = await response.json();
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
    
    // Auto sync to server file system code!
    saveCurriculumToServer(newData);

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

    // Auto sync to server file system code!
    saveCurriculumToServer(newData);
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
      <div className="h-2 w-full flex">
        <div className="bg-[#D21034] flex-1"></div>
        <div className="bg-white flex-1"></div>
        <div className="bg-[#000000] flex-1"></div>
        <div className="bg-[#007229] flex-1"></div>
      </div>

      {/* Embedded Sudan Cultural and Academic Hero Banner */}
      <header className="relative py-12 md:py-16 px-6 overflow-hidden">
        {/* Abstract Geometrics */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-emerald-950/20 via-slate-950/30 to-slate-950 pointer-events-none" />
        <div className="absolute -left-36 top-12 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-36 top-0 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-900/40 text-emerald-455 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>موقع تفاعلي لطلاب جمهورية السودان 🇸🇩</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-101 tracking-tight leading-tight md:leading-normal">
              منصة السودان <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-405">التعليمية التفاعلية</span>
            </h1>
            <p className="text-sm md:text-base text-slate-405 leading-relaxed max-w-xl">
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

          {/* Simple Statistics widget */}
          <div className="w-full md:w-auto grid grid-cols-2 gap-4 flex-shrink-0">
            <div 
              onClick={() => setShowOnlyFavorites(prev => !prev)}
              className={`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-205 select-none ${
                showOnlyFavorites 
                  ? "bg-amber-950/25 border-yellow-500/80 ring-2 ring-yellow-500/30 text-yellow-250 hover:bg-amber-950/40 shadow-yellow-950/40" 
                  : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850/80 hover:border-yellow-500/40"
              }`}
            >
              <Star className={`w-5 h-5 mx-auto transition-all ${showOnlyFavorites ? "text-yellow-400 fill-yellow-400 scale-110" : "text-yellow-400"}`} />
              <span className="text-xl font-bold text-slate-101 block">{favoriteSubjects.length}</span>
              <span className="text-2xs text-slate-400 block font-bold">
                {showOnlyFavorites ? "المناهج الكاملة" : "المواد المفضلة ⭐"}
              </span>
            </div>
            <div className="bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg selection:bg-transparent">
              <CheckCircle className="w-5 h-5 text-emerald-450 mx-auto" />
              <span className="text-xl font-bold text-slate-101 block">{completedLessons.length}</span>
              <span className="text-2xs text-slate-404 block font-medium">تمارين مكتملة</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Stage selection selector tabs */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-850 pb-4 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-300">مراحل التعليم الأساسي بدولة السودان:</h2>
              <p className="text-2xs text-slate-550 mt-1">اختر المرحلة الدراسية الملائمة لتصفح الفصول والمواد الدراسية المقررة.</p>
            </div>
            
            {/* Quick notification of custom structure */}
            <div className="text-2xs text-amber-450 bg-amber-955/10 border border-amber-900/30 rounded-lg py-1.5 px-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>مطابق لهيكل التعليم في السودان الجديد (3 رياض، 6 ابتدائي، 3 متوسط، 3 ثانوي).</span>
            </div>
          </div>

          {/* Grid of Stage Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {curriculumData.map((stage) => {
              const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites;
              
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setSelectedStage(stage);
                    setActiveGrade(null);
                    setShowOnlyFavorites(false);
                  }}
                  className={`relative p-5 rounded-2xl text-right border transition-all text-xs md:text-sm shadow-sm overflow-hidden group cursor-pointer ${
                    isSelected 
                      ? "bg-slate-900 border-emerald-605 shadow-md shadow-emerald-950/20" 
                      : "bg-slate-900/40 border-slate-850/60 hover:bg-slate-900 hover:border-slate-800"
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
                      <h3 className="font-bold text-slate-101">{stage.name}</h3>
                      <p className="text-2xs text-slate-400 line-clamp-1">{stage.description}</p>
                      <span className="text-3xs text-emerald-505 font-bold block mt-1">
                        عدد الفصول: {stage.grades.length} {stage.id === "kindergarten" ? "سنوات" : "صفوف دراسية"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Render Favorited Subjects when filtered, otherwise Stage Exploration */}
        {showOnlyFavorites ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/10 p-6 md:p-8 rounded-3xl border border-slate-800/85 gap-6 shadow-xl">
              <div className="space-y-2 text-center sm:text-right">
                <span className="text-xs text-yellow-405 font-mono font-black uppercase tracking-widest">تصفح قائمتك الخاصة:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <h3 className="text-xl md:text-2xl font-black text-slate-101 animate-pulse">المواد المفضلة لديك ⭐</h3>
                </div>
                <p className="text-xs text-slate-400">لقد قمت بإضافة {favoritedSubjectsList.length} مادة للمفضلة لتسهيل مراجعتها والمتابعة السريعة للفيديوهات والمعامل التفاعلية.</p>
              </div>
              
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="px-5 py-2 text-xs font-bold text-slate-205 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md shrink-0"
              >
                العودة للمنهج السوداني الكامل 🇸🇩
              </button>
            </div>

            {favoritedSubjectsList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-850/60 border-dashed space-y-4 max-w-2xl mx-auto">
                <div className="p-4 bg-yellow-500/5 text-yellow-550 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-yellow-500/10">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-205">لا توجد مواد مفضلة حتى الآن</p>
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
                        onClick={() => setActiveSubject({ ...subject } as any)}
                        className="relative p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-200 hover:border-emerald-600 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-950/60 cursor-pointer flex flex-col justify-between"
                      >
                        {/* Action buttons (Favorites, studied toggle) */}
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <button
                            onClick={(e) => toggleFavorite(subject.id, e)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isFavorite 
                                ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800/40' 
                                : 'bg-slate-805 text-slate-505 hover:text-slate-205 border-slate-755'
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
                                : 'bg-slate-805 text-slate-505 hover:text-slate-205 border-slate-755'
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
                              <span className="text-3xs text-emerald-450 font-bold block truncate">
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
                          <span className="text-emerald-455 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            بوابة المدرس والمناهج التفاعلية
                          </span>
                          <span className="text-slate-400 font-medium group-hover:text-slate-205 flex items-center gap-0.5">
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
        ) : (
          selectedStage && (
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
                  <span className="text-xs text-emerald-405 font-mono font-black uppercase tracking-widest">تصفح المواد في:</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-101">{selectedStage.name}</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{selectedStage.description}</p>
                </div>
                
                {/* Informative indicator card */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-3.5 flex-shrink-0">
                  <div className="p-2 bg-emerald-500/10 text-emerald-450 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block leading-none">مجموع المواد التفاعلية</span>
                    <span className="text-lg font-black text-slate-101 block mt-1">
                      {selectedStage.grades.reduce((sum, g) => sum + g.subjects.length, 0)} مواد دراسية
                    </span>
                  </div>
                </div>
              </div>

              {/* List of Grades (الصفوف الدراسية لهذه المرحلة) */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">المستويات الدراسية السنوية:</h4>
                
                <div className="space-y-6">
                  {selectedStage.grades.map((grade) => {
                    const isGradeExpanded = activeGrade?.id === grade.id;
                    
                    // Interactive grade filtering logic
                    const filteredSubjects = grade.subjects.filter(subj => {
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
                        className="bg-slate-900/60 border border-slate-805 rounded-2xl overflow-hidden shadow-md"
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
                              <h5 className="font-extrabold text-slate-101 group-hover:text-emerald-300 transition-colors">{grade.name}</h5>
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
                              className="border-t border-slate-850 bg-slate-950/40"
                            >
                              <div className="p-6 space-y-5">
                                
                                {/* 🏷️ Category Filter Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
                                  <div className="flex items-center gap-2 text-slate-400 text-3xs font-extrabold pb-1 sm:pb-0">
                                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>تصنيف محتوى المواد وعرض المقررات:</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.55">
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
                                        onClick={() => setActiveSubject({ ...subject, gradeName: grade.name, gradeId: grade.id } as any)}
                                        className="group relative p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-650/80 rounded-2xl transition-all duration-300 hover:translate-y-[-3px] hover:shadow-2xl hover:shadow-emerald-950/20 cursor-pointer flex flex-col justify-between overflow-hidden"
                                      >
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Action buttons (Favorites, studied toggle) */}
                                        <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                                          <button
                                            onClick={(e) => toggleFavorite(subject.id, e)}
                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                              isFavorite 
                                                ? 'bg-yellow-905/30 text-yellow-400 border-yellow-800/60 scale-105' 
                                                : 'bg-slate-950/60 text-slate-500 hover:text-yellow-400 border-slate-850 hover:border-yellow-950/30'
                                            }`}
                                            title="المفضلة"
                                          >
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                          </button>
                                          <button
                                            onClick={(e) => toggleLessonComplete(subject.id, e)}
                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                              isLessonComplete 
                                                ? 'bg-emerald-955/45 text-emerald-400 border-emerald-900/60 scale-105' 
                                                : 'bg-slate-950/60 text-slate-500 hover:text-emerald-400 border-slate-850 hover:border-emerald-950/30'
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
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-950/30 border border-purple-900/30 text-[9px] text-purple-400 font-bold">
                                                <Compass className="w-2.5 h-2.5" />
                                                تفاعلي
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                لا بوابة
                                              </span>
                                            )}

                                            {subject.videoUrl ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-950/30 border border-rose-900/30 text-[9px] text-rose-400 font-bold">
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
                                    <div className="col-span-full py-12 px-6 bg-slate-900/20 border border-slate-850/60 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
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
                                    className="relative p-5 bg-slate-900/30 border border-dashed border-slate-850 hover:border-emerald-600/60 rounded-2xl transition-all duration-200 hover:bg-slate-900/50 cursor-pointer flex flex-col justify-center items-center text-center space-y-3 min-h-[180px]"
                                  >
                                    <div className="p-3 bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition-colors">
                                      <Plus className="w-5 h-5 text-emerald-450" />
                                    </div>
                                    <div className="space-y-1">
                                      <h6 className="font-bold text-slate-200 text-xs">إضافة مادة مخصصة جديدة</h6>
                                      <p className="text-3xs text-slate-500 leading-relaxed max-w-[200px]">
                                        انقر هنا لإضافة بطاقة مادة مقررة إضافية لهذا الصف (مطلوب رمز المعلم).
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
          )
        )}
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
          />
        )}
      </AnimatePresence>

      {/* Sticky footer info */}
      <footer className="mt-20 border-t border-slate-850/80 pt-10 text-center max-w-7xl mx-auto px-6">
        <div className="space-y-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">🇸🇩 منصة المناهج السودانية التفاعلية لعام 2026</p>
          <p className="max-w-xl mx-auto text-2xs text-slate-500 leading-relaxed">
            تم تطوير هذه المنصة بكل حب ومسؤولية لمساعدة أفراد المنظومة التعليمية وطلاب السودان الأحباء لتسهيل الحصول على المهارات وألعاب المحاكاة الإلكترونية مجاناً وتحت رعاية المعلم الذكي.
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
            <span className="text-xs font-extrabold text-slate-200">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
