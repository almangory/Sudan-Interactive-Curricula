import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Award, HelpCircle, CheckCircle, XCircle, Calculator, 
  Calendar, BookOpen, Clock, ChevronRight, Save, Trash2, 
  Smile, Trophy, Star, RefreshCw, Layers, Clipboard, Check,
  Bell, BellOff, ChevronLeft, Plus, AlertCircle, Trash
} from "lucide-react";
import { Stage, Grade, Subject } from "../data/curriculum";

// Static high quality bank of quiz questions supporting multiple disciplines
interface QuizQuestion {
  id: string;
  subjectId?: string;
  subjectName: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "q-math-1",
    subjectName: "الرياضيات",
    question: "إذا كانت المعادلة: ٣س - ٧ = ١١، فما هي قيمة س؟",
    options: ["٤", "٥", "٦", "٧"],
    correctAnswer: "٦",
    explanation: "بإضافة ٧ للطرفين تصبح ٣س = ١٨، وبالقسمة على ٣ نجد أن س = ٦."
  },
  {
    id: "q-math-2",
    subjectName: "الرياضيات",
    question: "ما هو حجم المكعب الذي طول ضلعه يساوي ٣ سم؟",
    options: ["٩ سم مكعب", "١٨ سم مكعب", "٢٧ سم مكعب", "٣٦ سم مكعب"],
    correctAnswer: "٢٧ سم مكعب",
    explanation: "قانون حجم المكعب هو طول الضلع تكعيب: ٣ × ٣ × ٣ = ٢٧ سم مكعب."
  },
  {
    id: "q-islamic-1",
    subjectName: " التربية الإسلامية",
    question: "كم عدد أركان الإسلام الأساسية المقررة؟",
    options: ["ثلاثة أركان", "خمسة أركان", "ستة أركان", "أربعة أركان"],
    correctAnswer: "خمسة أركان",
    explanation: "بني الإسلام على خمس: شهادة أن لا إله إلا الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت."
  },
  {
    id: "q-arabic-1",
    subjectName: "اللغة العربية",
    question: "أي من الحروف التالية يعتبر من الحروف الناسخة التي تنصب المبتدأ وترفع الخبر؟",
    options: ["كان", "إنّ", "لم", "أصبح"],
    correctAnswer: "إنّ",
    explanation: "إنّ وأخواتها حروف ناسخة تدخل على الجملة الاسمية فتنصب المبتدأ وترفع الخبر."
  },
  {
    id: "q-physics-1",
    subjectName: "الفيزياء والعلوم",
    question: "ما هي وحدة القياس الدولية للقوة الميكانيكية؟",
    options: ["الجول", "الوات", "النيوتن", "الأمبير"],
    correctAnswer: "النيوتن",
    explanation: "يقاس مقدار القوة بوحدة النيوتن تخليداً للعالم إسحاق نيوتن."
  },
  {
    id: "q-physics-2",
    subjectName: "الفيزياء والعلوم",
    question: "تنتشر الحرارة في الفراغ الخارجي عن طريق:",
    options: ["التوصيل", "الحمل الحراري", "الإشعاع", "الاحتكاك"],
    correctAnswer: "الإشعاع",
    explanation: "تنتشر حرارة الشمس وتصل للأرض في الفراغ عن طريق الإشعاع فقط، لعدم وجود مادة للتوصيل أو الحمل."
  },
  {
    id: "q-history-1",
    subjectName: "الدراسات الاجتماعية",
    question: "أين يلتقي النيلان الأبيض والأزرق في دولة السودان؟",
    options: ["الخرطوم (المقرن)", "ود مدني", "عطبرة", "شندي"],
    correctAnswer: "الخرطوم (المقرن)",
    explanation: "يلتقي النيل الأبيض بالنيل الأزرق عند منطقة المقرن التاريخية بمدينة الخرطوم ليشكلوا معاً نهر النيل العظيم."
  },
  {
    id: "q-history-2",
    subjectName: "الدراسات الاجتماعية",
    question: "ما هي عاصمة السودان التاريخية الوطنية القديمة التي أسسها الإمام المهدي؟",
    options: ["الخرطوم", "أم درمان", "بورتسودان", "الفاشر"],
    correctAnswer: "أم درمان",
    explanation: "تعتبر أم درمان هي العاصمة التاريخية والوطنية التي اتخذتها الثورة المهدية عاصمة ومقراً لها."
  },
  {
    id: "q-chemistry-1",
    subjectName: "الكيمياء",
    question: "ما هو الرمز الكيميائي لملح الطعام العلمي (كلوريد الصوديوم)؟",
    options: ["H2O", "CO2", "NaCl", "NaOH"],
    correctAnswer: "NaCl",
    explanation: "يتكون ملح الطعام من ارتباط ذرة صوديوم (Na) مع ذرة كلور (Cl) فينتج Nacl."
  },
  {
    id: "q-bio-1",
    subjectName: "الأحياء والعلوم",
    question: "ما هو الجزء المسؤول عن عملية البناء الضوئي وصنع الغذاء في النباتات؟",
    options: ["الجذور", "الأزهار", "الكلوروفيل (في الأوراق)", "الجذع"],
    correctAnswer: "الكلوروفيل (في الأوراق)",
    explanation: "تحتوي خلايا الأوراق على بلاستيدات خضراء بها صبغة الكلوروفيل التي تمتص أشعة الشمس للقيام بالتمثيل الضوئي."
  }
];

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "exam" | "academic" | "personal";
  notes?: string;
}

interface StudyCampProps {
  stages: Stage[];
}

export default function StudyCamp({ stages }: StudyCampProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "calculator" | "schedule" | "calendar">("quiz");

  // --- 1. QUIZ GENERATOR STATES ---
  const [quizStage, setQuizStage] = useState("");
  const [quizGrade, setQuizGrade] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Filter values arrays
  const selectedStageObj = stages.find(s => s.id === quizStage);
  const availableGrades = selectedStageObj ? selectedStageObj.grades : [];
  const selectedGradeObj = availableGrades.find(g => g.id === quizGrade);
  const availableSubjects = selectedGradeObj ? selectedGradeObj.subjects : [];

  const handleStartQuiz = () => {
    // Generate questions
    let subName = "";
    if (quizSubject) {
      const sub = availableSubjects.find(s => s.id === quizSubject);
      subName = sub ? sub.name : "";
    }

    // Filter questions if subject selected, else random mix
    let filtered = QUIZ_BANK;
    if (quizSubject && subName) {
      // Find similar discipline or do a mix with subject title contains
      const key = subName.substring(0, 4);
      filtered = QUIZ_BANK.filter(q => q.subjectName.includes(key) || q.subjectName.includes(subName));
    }

    if (filtered.length === 0) {
      filtered = QUIZ_BANK; // Fallback
    }

    // Shuffle and pick max 5
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, 5));
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    setQuizStarted(true);
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);
    if (option === quizQuestions[currentQuizIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const getTrophyBadge = (scoreNum: number, total: number) => {
    const ratio = scoreNum / total;
    if (ratio === 1) return { label: "عبقري متفوق 🏆", desc: "نتيجة كاملة! أنت جاهز للاختبارات الوزارية تماماً.", color: "bg-amber-500 border-amber-300 text-slate-950" };
    if (ratio >= 0.8) return { label: "مثابر ذهبي 🏅", desc: "رائع جداً! استمر على هذا المنوال لتحقيق الصدارة.", color: "bg-indigo-600 border-indigo-405 text-white" };
    if (ratio >= 0.5) return { label: "طالب مجتهد ⚡", desc: "جيد جداً! بعض التركيز الإضافي وسيصبح مستواك ممتازاً.", color: "bg-emerald-600 border-emerald-450 text-white" };
    return { label: "خطوة بخطوة 🌱", desc: "مجهود طيب. راجع خلاصة الدرس وكرر حل التدريبات مع المعلم الذكي.", color: "bg-slate-800 border-slate-700 text-slate-200" };
  };


  // --- 2. GRADE CALCULATOR STATES ---
  const [examType, setExamType] = useState<"intermediate" | "secondary" | "custom">("intermediate");
  const [gradesInput, setGradesInput] = useState<{ [key: string]: number }>({
    arabic: 85,
    english: 72,
    math: 78,
    science: 80,
    history: 75,
    islamic: 90,
    extra: 0
  });

  const handleGradeChange = (subjectKey: string, val: string) => {
    const num = Math.min(Math.max(0, parseInt(val) || 0), examType === "secondary" ? 100 : 40);
    setGradesInput(prev => ({
      ...prev,
      [subjectKey]: num
    }));
  };

  const getCalculatorResults = () => {
    const totalMax = examType === "secondary" ? 700 : 280;
    
    // Sum keys
    let totalObtained = 0;
    if (examType === "secondary") {
      // 7 subjects out of 100 each
      const keys = ["arabic", "english", "math", "science", "history", "islamic", "extra"];
      totalObtained = keys.reduce((s, k) => s + (gradesInput[k] || 0), 0);
    } else {
      // Intermediate level: 7 subjects but historically out of 40 each, summing to 280 total
      const keys = ["arabic", "english", "math", "science", "history", "islamic", "extra"];
      totalObtained = keys.reduce((s, k) => s + (gradesInput[k] || 0), 0);
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    
    let estimation = "";
    let estColor = "";
    if (percentage >= 80) { estimation = "ممتاز (Excellent) 🌟"; estColor = "text-amber-400"; }
    else if (percentage >= 70) { estimation = "جيد جداً (Very Good) ✨"; estColor = "text-indigo-400"; }
    else if (percentage >= 60) { estimation = "جيد (Good) ⚡"; estColor = "text-emerald-400"; }
    else if (percentage >= 50) { estimation = "مقبول (Pass) 👍"; estColor = "text-slate-350"; }
    else { estimation = "ضعيف / يحتاج لتركيز مكثف 📌"; estColor = "text-red-500"; }

    return { totalObtained, totalMax, percentage: parseFloat(percentage.toFixed(1)), estimation, estColor };
  };


  // --- 3. STUDY PLANNER/TIMETABLE STATES ---
  interface ScheduleSlot {
    id: string;
    day: string;
    time: string;
    task: string;
    completed: boolean;
  }

  const [studyPlanGrade, setStudyPlanGrade] = useState("");
  const [studyPlanIntensity, setStudyPlanIntensity] = useState<"light" | "medium" | "heavy">("medium");
  const [userSchedule, setUserSchedule] = useState<ScheduleSlot[]>([]);
  const [isCopiedText, setIsCopiedText] = useState(false);

  // --- 4. BROWSER REMINDER NOTIFICATION STATES & LOGIC ---
  const [reminderTime, setReminderTime] = useState("17:00");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const lastTriggeredRef = React.useRef<string | null>(null);

  // Load scheduler configurations on mount
  useEffect(() => {
    const saved = localStorage.getItem("sudan_study_camp_schedule_v2");
    if (saved) {
      try {
        setUserSchedule(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved schedule", e);
      }
    }

    const savedTime = localStorage.getItem("sudan_study_reminder_time");
    const savedEnabled = localStorage.getItem("sudan_study_reminder_enabled");
    
    if (savedTime) setReminderTime(savedTime);
    if (savedEnabled === "true") setReminderEnabled(true);
    
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const saveSchedule = (newSched: ScheduleSlot[]) => {
    setUserSchedule(newSched);
    localStorage.setItem("sudan_study_camp_schedule_v2", JSON.stringify(newSched));
  };

  const handleToggleReminder = async (enabledState: boolean) => {
    if (enabledState) {
      if (typeof Notification === "undefined") {
        alert("إشعارات المتصفح غير مدعومة على جهازك الحالي.");
        return;
      }
      
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== "granted") {
          alert("يرجى تفعيل صلاحية الإشعارات من إعدادات المتصفح للتمكن من استقبال التنبيهات.");
          setReminderEnabled(false);
          localStorage.setItem("sudan_study_reminder_enabled", "false");
          return;
        }
      }
      
      setReminderEnabled(true);
      localStorage.setItem("sudan_study_reminder_enabled", "true");
      
      // Trigger a direct test notification to confirm success
      new Notification("🇸🇩 منصة المناهج السودانية", {
        body: `🔔 تم تفعيل تذكير المذاكرة اليومي بنجاح! سنقوم بتذكيرك يومياً عند الساعة ${reminderTime}.`,
        icon: "/favicon.ico"
      });
    } else {
      setReminderEnabled(false);
      localStorage.setItem("sudan_study_reminder_enabled", "false");
    }
  };

  const handleTimeChange = (newTime: string) => {
    setReminderTime(newTime);
    localStorage.setItem("sudan_study_reminder_time", newTime);
  };

  const handleTestNotification = () => {
    if (typeof Notification === "undefined") {
      alert("إشعارات المتصفح غير مدعومة على متصفحك الحالي.");
      return;
    }

    if (Notification.permission !== "granted") {
      alert("الرجاء تفعيل واستقبال صلاحية الإشعارات أولاً.");
      return;
    }

    new Notification("🎯 تجربة تذكير المذاكرة", {
      body: "أحسنت! الإشعارات التفاعلية تعمل الآن بنجاح وسيتم إرسال تذكير المذاكرة يومياً في توقيتك المفضل.",
      icon: "/favicon.ico"
    });
  };

  // Background interval loader to trigger daily reminder precisely on time
  useEffect(() => {
    if (!reminderEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    const checkAndTrigger = () => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHour}:${currentMin}`;

      if (timeStr === reminderTime) {
        const todayStr = now.toDateString();
        const triggerKey = `${todayStr}-${timeStr}`;

        if (lastTriggeredRef.current !== triggerKey) {
          lastTriggeredRef.current = triggerKey;
          
          new Notification("📚 حان وقت المذاكرة اليومية 🇸🇩", {
            body: "أهلاً بك يا بطل! حان موعد جلستك الدراسية اليومية المقررة بجدولك التفاعلي. استعن بالله وابدأ بهمة ونشاط للوصول للصدارة!",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            requireInteraction: true
          });
        }
      }
    };

    // Run custom checks every 10 seconds to make sure it alerts accurately
    const interval = setInterval(checkAndTrigger, 10000);
    // Core immediate check
    checkAndTrigger();

    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime]);

  // --- 5. INTERACTIVE CALENDAR STATES & LOGIC ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 5, 14)); // Initial value matching system time (June 14, 2026)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>("2026-06-14");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("sudan_study_camp_calendar_events_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved calendar events", e);
      }
    }
    
    // Default mock prepopulated academic schedule dates
    return [
      {
        id: "evt-school-start-26",
        date: "2026-06-15",
        title: "انطلاق مخيم المراجعة والمذاكرة المكثف",
        type: "academic",
        notes: "البداية الرسمية للتحديات والاستعداد للاختبارات الدورية."
      },
      {
        id: "evt-math-exam-26",
        date: "2026-06-25",
        title: "الامتحان التجريبي الموحد لشهادة مرحلة الأساس / الثانوي",
        type: "exam",
        notes: "امتحان شامل يغطي الفصل الدراسي الأول للتأكد من جاهزية الطلاب."
      },
      {
        id: "evt-mid-exams-26",
        date: "2026-07-15",
        title: "بدء امتحانات التقييم السنوي والشهري القومي",
        type: "exam",
        notes: "يرجى تحضير المراجعات والملخصات التفاعلية مسبقاً."
      },
      {
        id: "evt-summer-camp",
        date: "2026-07-28",
        title: "ندوة مهارات المذاكرة وصناعة التفوق الدراسي",
        type: "academic",
        notes: "نصائح وإرشادات من كبار الأساتذة للتفوق في البيئة السودانية."
      },
      {
        id: "evt-sudan-official-26",
        date: "2026-09-06",
        title: "الموعد المقترح لبدء العام الدراسي الجديد ٢٠٢٦-٢٠٢٧ 🇸🇩",
        type: "academic",
        notes: "بداية التسجيل الرسمي بالمدارس ومطابقة الرغبات والمواد."
      },
      {
        id: "evt-arabic-exam-26",
        date: "2026-06-20",
        title: "مراجعة شاملة لمقرر النحو والصرف والإنشاء",
        type: "personal",
        notes: "حصة تفاعلية ممتازة للطلبة بهدف تقفيل درجات اللغة العربية."
      }
    ];
  });

  const saveCalendarEvents = (newEvents: CalendarEvent[]) => {
    setCalendarEvents(newEvents);
    localStorage.setItem("sudan_study_camp_calendar_events_v2", JSON.stringify(newEvents));
  };

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"exam" | "academic" | "personal">("exam");
  const [newEventNotes, setNewEventNotes] = useState("");

  const handleAddCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedCalendarDay) return;

    const newEvt: CalendarEvent = {
      id: "evt-custom-" + Date.now(),
      date: selectedCalendarDay,
      title: newEventTitle.trim(),
      type: newEventType,
      notes: newEventNotes.trim() || undefined
    };

    const updated = [...calendarEvents, newEvt];
    saveCalendarEvents(updated);
    
    setNewEventTitle("");
    setNewEventNotes("");

    if (typeof Notification !== "undefined" && Notification.permission === "granted" && reminderEnabled) {
      new Notification("📅 تم حفظ موعد الاختبار بنجاح", {
        body: `تم إدراج "${newEventTitle}" في تقويمك الدراسي ليوم ${selectedCalendarDay}.`,
        icon: "/favicon.ico"
      });
    }
  };

  const handleDeleteCalendarEvent = (eventId: string) => {
    const updated = calendarEvents.filter(evt => evt.id !== eventId);
    saveCalendarEvents(updated);
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() - 1);
      return copy;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() + 1);
      return copy;
    });
  };

  const handleGenerateSchedule = () => {
    const defaultSubjects = ["الرياضيات والتفاضل", "اللغة العربية الفصحى", "اللغة الإنجليزية قواعد", "العلوم والفيزياء الكونية", "التاريخ والجغرافيا", "التربية الإسلامية المقررة"];
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    
    let timeslots: string[] = [];
    if (studyPlanIntensity === "light") {
      timeslots = ["04:00 م - 05:00 م", "05:30 م - 06:30 م"];
    } else if (studyPlanIntensity === "medium") {
      timeslots = ["03:30 م - 04:30 م", "05:00 م - 06:00 م", "07:00 م - 08:00 م"];
    } else {
      timeslots = ["03:00 م - 04:15 م", "04:45 م - 06:00 م", "07:00 م - 08:15 م", "08:45 م - 10:00 م"];
    }

    const output: ScheduleSlot[] = [];
    let subjCounter = 0;

    days.forEach(day => {
      timeslots.forEach((time, index) => {
        // Interweave breaks in naming
        const subj = defaultSubjects[subjCounter % defaultSubjects.length];
        output.push({
          id: `slot-${day}-${index}`,
          day,
          time,
          task: `مراجعة وحل تمارين: ${subj}`,
          completed: false
        });
        subjCounter++;
      });
    });

    saveSchedule(output);
  };

  const toggleSlotCompleted = (id: string) => {
    const next = userSchedule.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    saveSchedule(next);
  };

  const handleClearSchedule = () => {
    if (window.confirm("هل ترغب بالفعل في حذف جدول المذاكرة الأسبوعي الحالي؟")) {
      saveSchedule([]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-right space-y-8 shadow-xl" dir="rtl">
      
      {/* Introduction banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
        <div className="space-y-1 text-center md:text-right">
          <span className="text-xs text-indigo-400 font-mono font-black uppercase tracking-wider block">بوابة الأدوات التفاعلية المساعدة للطلاب</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>مخيم المذاكرة وأدوات النجاح التفاعلية ⚡</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            اختبر جاهزيتك العلمية، خطط لجدولك الدراسي الأسبوعي بكفاءة، واحسب درجات تقديرك الأكاديمي للشهادة بدقة تفاعلية عالية.
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex bg-slate-950/80 p-0.5 rounded-2xl border border-slate-800 w-full md:w-auto shrink-0 select-none">
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "quiz" 
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>مولد الاختبارات</span>
          </button>
          
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "calculator" 
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>حاسبة الدرجات</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "schedule" 
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>جدول المذاكرة</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "calendar" 
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>التقويم التفاعلي</span>
          </button>
        </div>
      </div>

      {/* --- TAB VIEW CONTROLLERS --- */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: INTERACTIVE QUIZ GENERATOR */}
        {activeTab === "quiz" && (
          <motion.div
            key="quiz-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {!quizStarted ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left controls Column */}
                <div className="lg:col-span-1 bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>تخصيص أسئلة الاختبار التفاعلي:</span>
                  </h4>

                  {/* Stage filter */}
                  <div className="space-y-1">
                    <label className="text-3xs text-slate-400 font-bold block">المرحلة الأكاديمية:</label>
                    <select
                      value={quizStage}
                      onChange={(e) => {
                        setQuizStage(e.target.value);
                        setQuizGrade("");
                        setQuizSubject("");
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-550 rounded-xl p-2 text-2xs text-slate-200 cursor-pointer outline-none"
                    >
                      <option value="">-- اختر المرحلة الدراسية --</option>
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade filter */}
                  <div className="space-y-1">
                    <label className="text-3xs text-slate-400 font-bold block">الصف الدراسي:</label>
                    <select
                      value={quizGrade}
                      disabled={!quizStage}
                      onChange={(e) => {
                        setQuizGrade(e.target.value);
                        setQuizSubject("");
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-550 rounded-xl p-2 text-2xs text-slate-250 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- اختر الفئة / الصف --</option>
                      {availableGrades.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject filter */}
                  <div className="space-y-1">
                    <label className="text-3xs text-slate-400 font-bold block">المادة الدراسية:</label>
                    <select
                      value={quizSubject}
                      disabled={!quizGrade}
                      onChange={(e) => setQuizSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-550 rounded-xl p-2 text-2xs text-slate-250 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- اختر المادة الأكاديمية --</option>
                      {availableSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleStartQuiz}
                      className="w-full py-2.5 bg-gradient-to-l from-indigo-650 to-indigo-600 hover:from-indigo-600 hover:to-indigo-550 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                    >
                      ابدأ الاختبار التفاعلي الآن ⚡
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
                      إذا لم تختر مادة معينة، فسيتم توليد اختبار ذكاء عام يشمل الرياضيات وحقائق العلوم واللغة العربية وتاريخ السودان.
                    </p>
                  </div>

                </div>

                {/* Right content Column */}
                <div className="lg:col-span-2 bg-slate-950/20 border border-slate-800/85 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-950/10 rounded-xl border border-indigo-900/35 flex items-center gap-2.5">
                      <Trophy className="w-5 h-5 text-yellow-500 animate-bounce animate-pulse" />
                      <h4 className="text-xs font-black text-indigo-300">كن من المتصدرين: اختبر مهاراتك بشكل مستمر!</h4>
                    </div>

                    <p className="text-xs text-slate-350 leading-relaxed font-sans">
                      تعتبر **الاختبارات التفاعلية القصيرة** أهم محفز للأعصاب لنقل المعلومات من ذاكرة المدى القصير إلى خزانة الحفظ المستديم في الدماغ البشري.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-200">📌 تغذية راجعة فورية</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">ستعرف أي الإجابات هي الصحيحة في نفس اللحظة للحصول على تصحيح فوري.</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-200">🎓 منوع وشامل</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">مواضيع الأسئلة تغطي شتى فروع المناهج السودانية والعلوم العامة لتعزيز تفوقك.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850/60 flex items-center justify-between text-2xs text-slate-500 font-bold">
                    <span>عدد الأسئلة لكل جلسة: ٥ أسئلة ذكية</span>
                    <span className="text-indigo-400">نظام ذكاء تفاعلي بالمنصة</span>
                  </div>
                </div>

              </div>
            ) : (
              // Quiz active gameplay
              <div className="max-w-3xl mx-auto bg-slate-950/40 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6 relative overflow-hidden shadow-2xl">
                
                {/* Score bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">الاختبار النشط:</span>
                    <span className="text-xs text-xs font-black text-slate-200">
                      {quizSubject ? availableSubjects.find(s => s.id === quizSubject)?.name : "معلومات عامة والمنهج الوطني"}
                    </span>
                  </div>
                  {!quizCompleted && (
                    <div className="font-mono text-xs text-slate-400">
                      سؤال <span className="font-bold text-indigo-400">{currentQuizIndex + 1}</span> من <span className="font-bold">{quizQuestions.length}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar timeline */}
                {!quizCompleted && (
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {!quizCompleted ? (
                    <motion.div
                      key={currentQuizIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      {/* Subject marker */}
                      <span className="inline-block px-2 py-0.5 bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 rounded-md text-[9px] font-bold">
                        {quizQuestions[currentQuizIndex].subjectName}
                      </span>

                      {/* Question Text */}
                      <h3 className="text-sm sm:text-base font-black text-slate-100 leading-relaxed font-sans">
                        {quizQuestions[currentQuizIndex].question}
                      </h3>

                      {/* Options stack RTL */}
                      <div className="space-y-2.5 pt-2">
                        {quizQuestions[currentQuizIndex].options.map((option, idx) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect = option === quizQuestions[currentQuizIndex].correctAnswer;
                          
                          let btnClass = "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-705 text-slate-300";
                          let iconNode = null;

                          if (isAnswered) {
                            if (isCorrect) {
                              btnClass = "bg-emerald-950/40 border-emerald-500 text-emerald-300";
                              iconNode = <CheckCircle className="w-4 h-4 text-emerald-400 pointer-events-none" />;
                            } else if (isSelected) {
                              btnClass = "bg-red-955/30 border-red-500 text-red-400";
                              iconNode = <XCircle className="w-4 h-4 text-red-500 pointer-events-none" />;
                            } else {
                              btnClass = "bg-slate-900/30 border-slate-900 text-slate-650 opacity-55";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectAnswer(option)}
                              disabled={isAnswered}
                              className={`w-full p-4 rounded-xl border text-right text-xs md:text-sm transition-all duration-150 flex items-center justify-between select-none ${
                                !isAnswered ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                              } ${btnClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-3xs text-slate-500 font-bold font-mono uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                                  {idx === 0 ? "أ" : idx === 1 ? "ب" : idx === 2 ? "ج" : "د"}
                                </span>
                                <span className="font-bold">{option}</span>
                              </div>
                              {iconNode}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box after answering */}
                      {isAnswered && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1"
                        >
                          <span className="text-[10px] text-yellow-400 font-bold block">💡 إيضاح وتعلم:</span>
                          <p className="text-3xs sm:text-2xs text-slate-400 leading-relaxed">
                            {quizQuestions[currentQuizIndex].explanation}
                          </p>
                        </motion.div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end pt-4 border-t border-slate-800">
                        {isAnswered ? (
                          <button
                            onClick={handleNextQuestion}
                            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow cursor-auto"
                          >
                            <span>{currentQuizIndex + 1 === quizQuestions.length ? "مشاهدة النتيجة المتكاملة 🏁" : "السؤال التالي ➡️"}</span>
                          </button>
                        ) : (
                          <span className="text-3xs text-slate-500 self-center">أجب على السؤال أعلاه لتتمكن من الانتقال للتالي.</span>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    // Quiz Result
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-6"
                    >
                      <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce animate-pulse" />
                      
                      <div className="space-y-2">
                        <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase block">تم الانتهاء من الاختبار</span>
                        <h4 className="text-base font-black text-slate-100">
                          نتيجتك النهائية هي: <span className="text-indigo-400 text-xl font-mono">{score}</span> من <span className="font-mono text-xl">{quizQuestions.length}</span>
                        </h4>
                        
                        {/* Dynamic Badge */}
                        <div className="max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 mt-4 shadow-md">
                          <span className={`inline-block px-3 py-1 border rounded-full text-xs font-extrabold ${getTrophyBadge(score, quizQuestions.length).color}`}>
                            {getTrophyBadge(score, quizQuestions.length).label}
                          </span>
                          <p className="text-3xs sm:text-2xs text-slate-400 leading-normal">
                            {getTrophyBadge(score, quizQuestions.length).desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center gap-3 pt-4 border-t border-slate-800/60">
                        <button
                          onClick={() => setQuizStarted(false)}
                          className="px-4 py-2 bg-slate-805 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          المغادرة للرئيسية
                        </button>
                        <button
                          onClick={handleStartQuiz}
                          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>إعادة الاختبار 🔄</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: GRADE & ESTIMATION CALCULATOR */}
        {activeTab === "calculator" && (
          <motion.div
            key="calculator-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Inputs column */}
            <div className="lg:col-span-2 bg-slate-950/40 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span>أدخل درجات الطالب (الدرجة المحققة لكل مادة مخصصة للشهادة):</span>
                </h4>

                {/* Exam select tab */}
                <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 self-start">
                  <button
                    onClick={() => {
                      setExamType("intermediate");
                      // Reset to suitable intermediate values out of 40 if needed
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                      examType === "intermediate" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    مرحلة الأساس / المتوسطة (من 280)
                  </button>
                  <button
                    onClick={() => {
                      setExamType("secondary");
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                      examType === "secondary" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    الشهادة الثانوية (من 700)
                  </button>
                </div>
              </div>

              {/* Grid or inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Arabic */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">اللغة العربية:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.arabic}
                    onChange={(e) => handleGradeChange("arabic", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* English */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">اللغة الإنجليزية:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.english}
                    onChange={(e) => handleGradeChange("english", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* Math */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">الرياضيات:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.math}
                    onChange={(e) => handleGradeChange("math", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* Science */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">العلوم / الفيزياء والكيمياء:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.science}
                    onChange={(e) => handleGradeChange("science", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* Social studies */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">الدراسات والتاريخ والجغرافيا:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.history}
                    onChange={(e) => handleGradeChange("history", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* Islamic Studies */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">التربية الإسلامية:</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.islamic}
                    onChange={(e) => handleGradeChange("islamic", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>

                {/* Extra Subject */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3 sm:col-span-2">
                  <div>
                    <span className="text-2xs text-slate-200 font-bold block">المادة السابعة الاختيارية (مثل: الفنون، الحاسوب، الأسرية، الهندسية...):</span>
                    <span className="text-[10px] text-slate-500 font-mono block">الدرجة المقررة: {examType === "secondary" ? "100" : "40"}</span>
                  </div>
                  <input
                    type="number"
                    value={gradesInput.extra}
                    onChange={(e) => handleGradeChange("extra", e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-550 rounded-lg p-1.5 text-xs text-center font-bold text-slate-200 outline-none"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                💡 **ملاحظة**: بالنسبة لامتحانات مرحلة الأساس والمتوسطة تبلغ الدرجة القصوى لكل مادة 40 درجة بإجمالي 280 درجة، أما في الشهادة الثانوية السودانية فيتم احتساب الدرجات بكل مادة من 100 بمجموع كلي 700 درجة.
              </p>
            </div>

            {/* Right Result Column */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-wider block uppercase">ملخص المجموع والتقدير التفاعلي</span>
                
                <div className="space-y-2 p-4 bg-slate-900 border border-slate-805 rounded-xl">
                  <div className="flex items-center justify-between text-2xs text-slate-400">
                    <span>المجموع الكلي للدرجات:</span>
                    <span className="font-mono">{getCalculatorResults().totalObtained} / {getCalculatorResults().totalMax}</span>
                  </div>

                  <hr className="border-slate-800/60" />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-2xs text-slate-450 font-bold">النسبة المئوية:</span>
                    <span className="text-2xl font-black font-mono text-white select-none">{getCalculatorResults().percentage}%</span>
                  </div>
                </div>

                {/* Estimation box */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block">مرتبة التقدير العام:</span>
                  <div className={`text-sm sm:text-base font-black ${getCalculatorResults().estColor}`}>
                    {getCalculatorResults().estimation}
                  </div>
                </div>

                {/* Personalized Advice */}
                <div className="p-3 bg-slate-900/60 rounded-xl text-[11px] text-slate-400 leading-relaxed font-medium">
                  {getCalculatorResults().percentage >= 80 ? (
                    "🎉 أداء متفوق مذهل! تقديرك في رتبة الممتاز. استمر في المذاكرة والاطلاع المستمر لضمان أعلى المراتب على مستوى دولة السودان والمستقبل العلمي الرائد."
                  ) : getCalculatorResults().percentage >= 65 ? (
                    "⭐ أحسنت صنعاً! تقديرك ممتاز وفي تطور، بزيادة ساعتين أسبوعياً من المراجعة المركزة على المناهج والمذكرة عبر معلم الذكاء الاصطناعي، يمكنك الارتقاء للقرى والتميز المئوي التام."
                  ) : (
                    "📌 مجهود مثمن! تحتاج لمراجعة الدروس بانتظام لحفظ المفاهيم وبناء الثقة. استفد من جداول المذاكرة وخطط لمراجعة المواد الصعبة كأولوية قصوى بمساعدة المعلم."
                  )}
                </div>
              </div>

              <div className="text-3xs text-slate-500 font-bold flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-indigo-400" />
                <span>النجاح هو طابور طوب يُبنى حجرًا خلف حجر بانتظام!</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SMART STUDY TIMETABLE GENERATOR */}
        {activeTab === "schedule" && (
          <motion.div
            key="schedule-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* ⏰ BROWSER NOTIFICATION DAILY REMINDERS CARD */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/20 p-5 rounded-2xl border border-indigo-900/40 space-y-4 shadow-lg text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${reminderEnabled ? "bg-indigo-500/10 text-indigo-400 animate-pulse" : "bg-slate-900 text-slate-500"}`}>
                    {reminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div className="space-y-0.5 text-right">
                    <h4 className="text-xs font-black text-slate-200 flex items-center justify-start gap-1.5 flex-row-reverse pb-0.5">
                      <span>منبه التذكير اليومي الذكي للمذاكرة</span>
                      {reminderEnabled && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          نشط تلقائياً
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-450 leading-normal max-w-xl">
                      اضبط موعداً يومياً لتلقي إشعار متصفح مميز ينبهك لبدء جدول حصصك والمذاكرة بتركيز.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Test notification button */}
                  {reminderEnabled && (
                    <button
                      onClick={handleTestNotification}
                      type="button"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-200 border border-slate-800 rounded-xl text-3xs font-black transition-all cursor-pointer"
                    >
                      تجربة الإشعار 🧪
                    </button>
                  )}
                  
                  {/* Reminder Toggle state button */}
                  <button
                    onClick={() => handleToggleReminder(!reminderEnabled)}
                    className={`px-4 py-1.5 rounded-xl text-3xs font-black transition-all border cursor-pointer ${
                      reminderEnabled
                        ? "bg-red-950/40 border-red-900/50 text-red-100 hover:bg-red-902/20"
                        : "bg-indigo-600 hover:bg-indigo-550 border-indigo-500 text-white shadow-md shadow-indigo-950/10"
                    }`}
                  >
                    {reminderEnabled ? "إيقاف التنبيهات 🔕" : "تفعيل التنبيهات 🔔"}
                  </button>
                </div>
              </div>

              {/* Configurations Row */}
              <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold block shrink-0">توقيت التذكير المفضل:</span>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 focus:border-indigo-550 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-slate-200 outline-none cursor-pointer"
                  />
                </div>

                <div className="text-[10px] text-slate-500 font-medium">
                  {typeof Notification === "undefined" ? (
                    <span className="text-red-400 font-bold">⚠️ متصفحك الحالي لا يدعم إشعارات سطح المكتب.</span>
                  ) : notificationPermission === "granted" ? (
                    <span className="text-emerald-400 font-bold flex items-center justify-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                      <span>صلاحية الإشعارات ممنوحة بنجاح.</span>
                    </span>
                  ) : notificationPermission === "denied" ? (
                    <span className="text-red-400 font-bold">❌ تم حظر الإشعارات. يرجى تفعيلها في إعدادات متصفحك يدوياً.</span>
                  ) : (
                    <span>🔔 يرجى منح صلاحية المتصفح للتنبيهات عند تفعيل المنبه.</span>
                  )}
                </div>
              </div>
            </div>

            {userSchedule.length === 0 ? (
              // Generator setup form
              <div className="max-w-xl mx-auto bg-slate-950/40 border border-slate-850 p-6 sm:p-8 rounded-2xl text-center space-y-6">
                <Calendar className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-100">مولد جداول المذاكرة الأسبوعية الذكية للمنهج السوداني</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    حدد مستوى شدة المذاكرة المفضلة لديك وسيقوم المحك المعرفي ببناء جدول الحصص الأنسب لك متضمناً فترات للاستراحات للتغلب على الإرهاق.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto text-right">
                  {/* Intensity choose */}
                  <div className="space-y-1">
                    <label className="text-3xs text-slate-450 font-black block">مستوى الشدة التركيزية المرجوة:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setStudyPlanIntensity("light")}
                        className={`p-2 border rounded-xl text-3xs font-bold transition-all ${
                          studyPlanIntensity === "light" 
                            ? "bg-indigo-605 border-indigo-400 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        ساعتين يومياً (خفيف) 🌱
                      </button>
                      <button
                        onClick={() => setStudyPlanIntensity("medium")}
                        className={`p-2 border rounded-xl text-3xs font-bold transition-all ${
                          studyPlanIntensity === "medium" 
                            ? "bg-indigo-605 border-indigo-400 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        ٤ ساعات (متوسط) ⚡
                      </button>
                      <button
                        onClick={() => setStudyPlanIntensity("heavy")}
                        className={`p-2 border rounded-xl text-3xs font-bold transition-all ${
                          studyPlanIntensity === "heavy" 
                            ? "bg-indigo-605 border-indigo-400 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        ٦ ساعات (مكثف) 🔥
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateSchedule}
                    className="px-6 py-3 bg-gradient-to-l from-indigo-650 to-indigo-600 hover:from-indigo-600 hover:to-indigo-550 border border-indigo-550 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    توليد جدول المذاكرة الأكاديمي التفاعلي 📅
                  </button>
                </div>
              </div>
            ) : (
              // Active table view
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-slate-200">جدول مذاكرتي الأسبوعي النشط للتميز الأكاديمي</h5>
                    <p className="text-[10px] text-slate-400">تابع تقدمك اليومي بالضغط وعمل علامة صح على الجلسات التي أتممتها بنجاح.</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 self-start">
                    <button
                      onClick={handleClearSchedule}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/45 text-red-400 rounded-xl text-3xs font-black transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف الجدول البدء من جديد</span>
                    </button>
                  </div>
                </div>

                {/* Progress ratio */}
                <div className="p-3 bg-slate-950/20 border border-slate-800 rounded-xl flex items-center justify-between text-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">الجلسات المكتملة:</span>
                    <span className="font-mono font-bold text-slate-100">{userSchedule.filter(s => s.completed).length} / {userSchedule.length}</span>
                  </div>
                  <div className="flex-1 max-w-xs h-1.5 bg-slate-900 rounded-full mx-4 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-505 transition-all duration-300"
                      style={{ width: `${(userSchedule.filter(s => s.completed).length / userSchedule.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Grid layout grouped by days */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"].map((dayName) => {
                    const daySlots = userSchedule.filter(s => s.day === dayName);
                    
                    return (
                      <div key={dayName} className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 space-y-3.5">
                        <div className="border-b border-indigo-900/30 pb-2 text-center">
                          <span className="px-3 py-1 bg-indigo-950/45 text-indigo-400 border border-indigo-900/45 rounded-lg text-2xs font-extrabold">
                            {dayName}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {daySlots.map((slot) => (
                            <div 
                              key={slot.id}
                              onClick={() => toggleSlotCompleted(slot.id)}
                              className={`p-3 rounded-xl border text-right transition-all duration-100 cursor-pointer select-none space-y-1 hover:border-indigo-550/55 ${
                                slot.completed 
                                  ? "bg-slate-900/30 border-emerald-900/60 opacity-60 line-through text-slate-500" 
                                  : "bg-slate-900 border-slate-800 text-slate-205"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className={slot.completed ? "text-slate-500 font-bold" : "text-indigo-400 font-sans"}>
                                  {slot.time}
                                </span>
                                {slot.completed && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                              </div>
                              <p className={`text-3xs font-bold leading-normal ${slot.completed ? "text-slate-500 fill-neutral-400" : ""}`}>
                                {slot.task}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-950/10 border border-indigo-900/30 p-3.5 rounded-xl text-3xs text-slate-400 leading-relaxed text-center font-bold">
                  🧠 الجدول الأكاديمي مرن ومحلي، يرجى الاستمرار على تخصيصه وجعله روتينك اليومي، والتميز سيأتي بطبيعة الحال مع المثابرة المستمرة والاعتماد على عون الله!
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: INTERACTIVE CALENDAR */}
        {activeTab === "calendar" && (() => {
          const ARABIC_MONTHS = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
          ];
          const ARABIC_DAYS_SHORT = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

          const calYear = currentCalendarDate.getFullYear();
          const calMonth = currentCalendarDate.getMonth();

          // Days in month
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          // First day offset (0 = Sunday, 1 = Monday ...)
          const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

          // Create grid cells
          const calendarCells: (number | null)[] = [];
          for (let i = 0; i < firstDayIndex; i++) {
            calendarCells.push(null);
          }
          for (let d = 1; d <= daysInMonth; d++) {
            calendarCells.push(d);
          }

          // Format Helper
          const getFormattedDateString = (dayNum: number) => {
            const mm = String(calMonth + 1).padStart(2, "0");
            const dd = String(dayNum).padStart(2, "0");
            return `${calYear}-${mm}-${dd}`;
          };

          // Get active selected day events
          const dayEvts = calendarEvents.filter(
            evt => evt.date === selectedCalendarDay
          );

          // Group all events for quick lookup inside cells
          const getEventsForDay = (dayNum: number) => {
            const dateStr = getFormattedDateString(dayNum);
            return calendarEvents.filter(evt => evt.date === dateStr);
          };

          return (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Calendar Info Banner */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-5 text-right">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-100 flex items-center justify-start gap-2 flex-row-reverse">
                    <span>التقويم الدراسي التفاعلي وجدول اختبارات المنهج السوداني 🇸🇩</span>
                  </h4>
                  <p className="text-xs text-slate-450 max-w-xl leading-relaxed">
                    هذا القسم مخصص للجدولة الزمنية وتحديد مواعيد الاختبارات الشهرية، الحصص التجريبية، واختبارات الشهادة السودانية القومية، بالإضافة للسماح لكل طالب بكتابة وتحديد مواعيده الفردية لتنظيم المراجعات بدقة بالغة.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end shrink-0 text-3xs font-extrabold pb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse"></span>
                    <span>اختبارات رسمية</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>مواعيد أكاديمية عامة</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                    <span>تنظيم مراجعة شخصية</span>
                  </span>
                </div>
              </div>

              {/* Grid Core: Month Grid & Detail list / Add form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* SIDEBAR: Selected Date Info & Custom Scheduling Form */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6 order-2 lg:order-1 text-right">
                  
                  {/* 1. EVENTS LIST FOR THE SELECTED DAY */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[10px] text-indigo-400 font-mono font-black select-none">
                        {selectedCalendarDay ? selectedCalendarDay : "لم يتم التحديد"}
                      </span>
                      <h5 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                        <span>الأجندة والمواعيد لليوم المختار</span>
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      </h5>
                    </div>

                    {selectedCalendarDay ? (
                      (() => {
                        if (dayEvts.length === 0) {
                          return (
                            <div className="py-8 text-center space-y-2.5">
                              <AlertCircle className="w-7 h-7 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                لا توجد امتحانات أو مواعيد مقررة في هذا اليوم بعد. تصفح الأيام الأخرى أو أضف موعدك الدراسي الخاص بك أدناه!
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {dayEvts.map(evt => (
                              <div 
                                key={evt.id} 
                                className={`p-3.5 rounded-xl border text-right space-y-1.5 transition-all ${
                                  evt.type === "exam" 
                                    ? "bg-red-950/20 border-red-900/40 hover:border-red-900/80" 
                                    : evt.type === "academic"
                                    ? "bg-emerald-950/15 border-emerald-900/40 hover:border-emerald-900/80"
                                    : "bg-purple-950/15 border-purple-900/40 hover:border-purple-900/80"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  {evt.id.startsWith("evt-custom-") ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCalendarEvent(evt.id)}
                                      className="p-1 text-slate-500 hover:text-red-405 rounded hover:bg-slate-900/40 cursor-pointer transition-colors"
                                      title="حذف الموعد"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded-md font-black">موعد عام</span>
                                  )}

                                  <div className="space-y-0.5">
                                    <p className="text-xs font-black text-slate-100">{evt.title}</p>
                                    <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      evt.type === "exam" 
                                        ? "bg-red-500/10 text-red-400" 
                                        : evt.type === "academic"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-purple-500/10 text-purple-400"
                                    }`}>
                                      {evt.type === "exam" ? "امتحان / اختبار" : evt.type === "academic" ? "تقويم أكاديمي" : "مذاكرة ومراجعة شخصية"}
                                    </span>
                                  </div>
                                </div>

                                {evt.notes && (
                                  <p className="text-2xs text-slate-400 bg-slate-950/50 p-2 rounded-lg leading-normal mt-1 border border-slate-900">
                                    💡 {evt.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-center text-slate-500 py-6">الرجاء تحديد يوم من تقويم الشهر لعرض تفاصيل مواعيده.</p>
                    )}
                  </div>

                  {/* 2. FORM TO ADD NEW IMPORTANT EXAM DATE */}
                  <form 
                    onSubmit={handleAddCalendarEvent}
                    className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4"
                  >
                    <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span className="text-[10px] text-indigo-400 font-bold">إضافة موعد لليوم المختار</span>
                      <h5 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                        <span>تحديد موعد اختبار جديد</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-400 text-slate-100" />
                      </h5>
                    </div>

                    <div className="space-y-3.5 text-right text-xs">
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-extrabold text-indigo-400 select-all">
                          {selectedCalendarDay ? selectedCalendarDay : "اختر يوماً أولاً"}
                        </span>
                        <span className="text-slate-400 text-3xs font-black">تاريخ الاختبار المستهدف:</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-3xs text-slate-400 font-bold block">اسم الموعد أو الاختبار:</label>
                        <input
                          type="text"
                          required
                          disabled={!selectedCalendarDay}
                          placeholder={selectedCalendarDay ? "مثال: مراجعة الجبر والتفاضل، امتحان الكيمياء" : "الرجاء تحديد يوم من الجدول أولاً"}
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-505 rounded-xl p-2.5 text-xs text-right outline-none text-slate-202 placeholder-slate-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-3xs text-slate-400 font-bold block">تصنيف الموعد:</label>
                        <select
                          disabled={!selectedCalendarDay}
                          value={newEventType}
                          onChange={(e: any) => setNewEventType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-505 rounded-xl p-2.5 text-xs text-right outline-none text-slate-205 cursor-pointer"
                        >
                          <option value="exam">امتحان / اختبار شهري</option>
                          <option value="academic">موعد دراسي عام</option>
                          <option value="personal">مذاكرة ومراجعة شخصية</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-3xs text-slate-400 font-bold block">ملاحظات أو مواضيع مطلوبة (اختياري):</label>
                        <textarea
                          disabled={!selectedCalendarDay}
                          placeholder="أدخل أي ملاحظات إضافية، مثل الفصول المقررة للنجاح..."
                          value={newEventNotes}
                          onChange={(e) => setNewEventNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-505 rounded-xl p-2.5 text-xs text-right outline-none text-slate-202 resize-none placeholder-slate-600"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedCalendarDay || !newEventTitle.trim()}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 border border-indigo-505 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 animate-none"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        <span>حفظ الموعد بالتقويم الدراسي</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* MONTH SELECTOR & MONTH GRID AND UPCOMING LIST */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6 order-1 lg:order-2 text-right">
                  
                  {/* MONTH HEADER SELECTOR AND CALENDAR GRID */}
                  <div className="bg-slate-950/40 border border-slate-855 rounded-2xl p-5 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handlePrevMonth}
                          type="button"
                          className="p-2 bg-slate-900 hover:bg-slate-850 hover:text-slate-100 text-slate-400 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                          title="الشهر السابق"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={handleNextMonth}
                          type="button"
                          className="p-2 bg-slate-900 hover:bg-slate-850 hover:text-slate-100 text-slate-400 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                          title="الشهر القادم"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                          <span>{ARABIC_MONTHS[calMonth]} {calYear}</span>
                          <Calendar className="w-4 h-4 text-indigo-400" />
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold">انتقل بين الشهور لعرض وجدولة الخطة الأكاديمية.</p>
                      </div>
                    </div>

                    {/* WEEKDAY LABELS HEADERS */}
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-450 border-b border-slate-855 pb-2 select-none font-sans">
                      {ARABIC_DAYS_SHORT.map((dayLabel) => (
                        <div key={dayLabel} className="p-1 uppercase">
                          {dayLabel}
                        </div>
                      ))}
                    </div>

                    {/* MONTH ACTIVE DAY CELLS GRID */}
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {calendarCells.map((dayNum, cellIdx) => {
                        if (dayNum === null) {
                          return (
                            <div 
                              key={`empty-${cellIdx}`} 
                              className="aspect-square bg-slate-950/20 border border-slate-900/10 rounded-xl opacity-35"
                            />
                          );
                        }

                        const dateStr = getFormattedDateString(dayNum);
                        const isSelected = selectedCalendarDay === dateStr;
                        const hasEvents = getEventsForDay(dayNum);
                        const isToday = dateStr === "2026-06-14";

                        const hasExams = hasEvents.some(evt => evt.type === "exam");
                        const hasAcademics = hasEvents.some(evt => evt.type === "academic");
                        const hasPersonal = hasEvents.some(evt => evt.type === "personal");

                        return (
                          <button
                            key={`day-${dayNum}`}
                            onClick={() => setSelectedCalendarDay(dateStr)}
                            type="button"
                            className={`aspect-square w-full rounded-xl border p-1 sm:p-1.5 flex flex-col items-center justify-between text-right cursor-pointer transition-all relative ${
                              isSelected 
                                ? "bg-indigo-600 border-indigo-505 text-white font-black scale-102 shadow-md shadow-indigo-950/25 animate-none"
                                : isToday
                                ? "bg-slate-900 border-indigo-900/60 text-indigo-400 font-extrabold"
                                : "bg-slate-950 border-slate-850/60 hover:bg-slate-900 hover:border-slate-800 text-slate-205"
                            }`}
                          >
                            <div className="w-full flex items-center justify-between text-right">
                              {isToday && !isSelected && (
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block animate-ping" title="اليوم" />
                              )}
                              <span className="text-3xs font-bold leading-none font-sans self-end select-none">
                                {dayNum}
                              </span>
                            </div>

                            <div className="flex gap-1 items-center justify-center pt-1 flex-wrap flex-row-reverse max-w-full">
                              {hasExams && (
                                <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-red-400"}`} title="اختبار مقرر" />
                              )}
                              {hasAcademics && (
                                <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`} title="أجندة عامة" />
                              )}
                              {hasPersonal && (
                                <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-purple-400"}`} title="مراجعة شخصية" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OVERALL UPCOMING EVENTS LIST */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] text-slate-450 font-bold">المواعيد الشاملة المسجلة</span>
                      <h5 className="text-xs font-black text-slate-100 flex items-center gap-2">
                        <span>الجدول الزمني العام ومواعيد الاختبارات القادمة</span>
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                      </h5>
                    </div>

                    <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 text-right">
                      {calendarEvents
                        .slice()
                        .sort((a,b) => a.date.localeCompare(b.date))
                        .map((evt) => {
                          const isPast = evt.date < "2026-06-14";
                          return (
                            <div 
                              key={evt.id}
                              onClick={() => setSelectedCalendarDay(evt.date)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-right cursor-pointer transition-all hover:bg-slate-900/40 ${
                                selectedCalendarDay === evt.date
                                  ? "bg-slate-900/70 border-indigo-505"
                                  : "bg-slate-950/60 border-slate-850"
                              } ${isPast ? "opacity-60" : ""}`}
                            >
                              <span className="font-mono text-3xs font-extrabold text-indigo-400 whitespace-nowrap bg-indigo-950/20 px-2 py-1 rounded">
                                {evt.date}
                              </span>
                              
                              <div className="flex-1 space-y-0.5 truncate text-right">
                                <p className="text-3xs font-black text-slate-205 truncate">{evt.title}</p>
                                <span className={`inline-block text-[8px] font-black leading-none px-1.5 py-0.5 rounded ${
                                  evt.type === "exam" 
                                    ? "bg-red-500/10 text-red-400" 
                                    : evt.type === "academic"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-purple-500/10 text-purple-400"
                                }`}>
                                  {evt.type === "exam" ? "اختبار" : evt.type === "academic" ? "عام" : "شخصي"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          );
        })()}

      </AnimatePresence>

    </div>
  );
}
