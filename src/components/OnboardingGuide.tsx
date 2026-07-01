import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  BookOpen, 
  Wifi, 
  Gamepad2, 
  MessagesSquare, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  Award
} from "lucide-react";

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: "ar" | "en";
  siteTheme: "sudanese" | "dark";
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  isOpen,
  onClose,
  currentLang,
  siteTheme,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isRtl = currentLang === "ar";

  const steps = [
    {
      titleAr: "مرحباً بك في المنصة التعليمية السودانية 🇸🇩",
      titleEn: "Welcome to the Sudanese Educational Platform 🇸🇩",
      descriptionAr: "بوابتك الرقمية المتكاملة لجميع المناهج والكتب المدرسية السودانية من الروضة وحتى المرحلة الثانوية، مصممة خصيصاً لمساعدة الطلاب في جميع الظروف.",
      descriptionEn: "Your comprehensive digital gateway for all Sudanese curricula and school textbooks from Kindergarten to Secondary stage, specially designed to support students everywhere.",
      icon: <Sparkles className="w-12 h-12 text-earthgold" />,
      highlight: "from-amber-500 to-rose-500",
      bulletsAr: [
        "منهج رسمي معتمد ومحدث بشكل مستمر.",
        "تصفح ميسر يتناسب مع جميع الأجهزة والهواتف.",
        "متاح مجاناً لدعم التعليم واستمراريته لكافة أبنائنا وبناتنا."
      ],
      bulletsEn: [
        "Official, approved and continuously updated curriculum.",
        "Easy browsing optimized for all screens and smartphones.",
        "Available for free to support the continuity of education for all children."
      ]
    },
    {
      titleAr: "تصفح الكتب والمراحل الدراسية 📚",
      titleEn: "Explore Stages & Textbooks 📚",
      descriptionAr: "تنقسم المنصة إلى أربع مراحل تعليمية رئيسية لتسهيل الوصول للمحتوى المناسب لعمرك وصفك الدراسي.",
      descriptionEn: "The platform is divided into four main educational stages to facilitate access to content suitable for your age and grade.",
      icon: <BookOpen className="w-12 h-12 text-[#5C2C16]" />,
      highlight: "from-emerald-550 to-teal-450",
      bulletsAr: [
        "مرحلة الروضة: لتهيئة البراعم باللعب والألوان والتلوين.",
        "المرحلة الابتدائية: التأسيس الشامل لغرس العلوم والأدبيات.",
        "المرحلة المتوسطة: التركيز على المفاهيم العلمية والتحليل المعاصر.",
        "المرحلة الثانوية: إعداد متميز ومكثف لامتحانات الشهادة السودانية."
      ],
      bulletsEn: [
        "Kindergarten: Preparing children with play, coloring, and coordination.",
        "Primary Stage: Comprehensive foundation to instill sciences & literature.",
        "Intermediate Stage: Focus on scientific concepts and modern analysis.",
        "Secondary Stage: Premium and intensive preparation for Sudanese Certificate exams."
      ]
    },
    {
      titleAr: "المذاكرة دون اتصال بالإنترنت 📶",
      titleEn: "Study Offline & Sync Smarter 📶",
      descriptionAr: "ندرك تماماً تحديات انقطاع الكهرباء وشبكات الاتصال، لذلك تم تزويد المنصة بنظام مزامنة ذكي وتخزين مؤقت.",
      descriptionEn: "We understand connection and power challenges, so the platform is equipped with an offline caching system.",
      icon: <Wifi className="w-12 h-12 text-indigo-500" />,
      highlight: "from-blue-550 to-indigo-455",
      bulletsAr: [
        "أي كتاب أو مادة تفتحها سيتم حفظها تلقائياً على جهازك.",
        "يمكنك قراءة وتصفح الكتب المحملة مسبقاً بدقة عالية بدون إنترنت.",
        "يظهر مؤشر الشبكة العلوي حالة الاتصال ومدى جاهزية التصفح الذكي."
      ],
      bulletsEn: [
        "Any book or lesson you open is automatically cached on your device.",
        "Read previously opened textbooks in high resolution with zero connection.",
        "The top network indicator shows connection status and offline readiness."
      ]
    },
    {
      titleAr: "الألعاب التعليمية والبراعم 🎈🎮",
      titleEn: "Educational Games & Kid Mode 🎈🎮",
      descriptionAr: "التعليم ممتع معنا! وفرنا للبراعم الصغيرة قسماً ممتعاً للغاية للتعلم والمرح.",
      descriptionEn: "Learning is fun with us! We have created an engaging section for younger students to learn while playing.",
      icon: <Gamepad2 className="w-12 h-12 text-pink-500" />,
      highlight: "from-pink-500 to-rose-500",
      bulletsAr: [
        "زر البالون 🎈 يفتح واجهة براعم الأطفال الرائعة والمليئة بالألوان والتحفيزات الصوتية.",
        "ألعاب ذكاء وتلوين وتطوير مهارات الحساب والذاكرة بطريقة تفاعلية.",
        "مخيم الدراسة الذكي المزود بمؤقت لحساب فترات المذاكرة بتركيز."
      ],
      bulletsEn: [
        "The balloon button 🎈 unlocks the colorful kid-mode interface with sound effects.",
        "Puzzles, pixel coloring, arithmetic, and memory games in an interactive layout.",
        "Smart Study Camp with focus timer to track deep study blocks effectively."
      ]
    },
    {
      titleAr: "الدردشة الطلابية والذكاء الاصطناعي 💬🧠",
      titleEn: "Student Chat & AI Tutor 💬🧠",
      descriptionAr: "تواصل مع زملائك واسأل معلمك الذكي للحصول على تجربة تعليمية تشاركية ممتازة.",
      descriptionEn: "Connect with peers and ask your smart AI Tutor for an ultimate collaborative study experience.",
      icon: <MessagesSquare className="w-12 h-12 text-purple-500" />,
      highlight: "from-purple-550 to-indigo-550",
      bulletsAr: [
        "المعلم الذكي: اضغط على أيقونة المعلم في جانب الشاشة وسيجيبك على أي تساؤل في المنهج.",
        "الدردشة والتعارف: شارك زملائك النصائح الدراسية والأسئلة في غرف الدردشة الآمنة والمصنفة.",
        "الملف الشخصي: اختر اسم مستعار وشخصية كرتونية تناسبك لتمثلك في مجتمعنا الصغير."
      ],
      bulletsEn: [
        "AI Tutor: Click the AI button to receive step-by-step help for any subject query.",
        "Safe Peer Chat: Share study tips and notes with classmates in secure chat rooms.",
        "Student Profile: Set a cute custom nickname and pick an interactive avatar."
      ]
    }
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir={isRtl ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl border ${
            siteTheme === "sudanese"
              ? "bg-white border-mud/10 text-mud"
              : "bg-slate-900 border-slate-800 text-slate-100"
          }`}
        >
          {/* Top colored accent line */}
          <div className={`h-2 bg-gradient-to-r ${currentStepData.highlight}`} />

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${
              siteTheme === "sudanese"
                ? "bg-cream/40 text-mud hover:bg-cream"
                : "bg-slate-950/50 text-slate-400 hover:bg-slate-950"
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Guide Content */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 rounded-3xl bg-gradient-to-br from-amber-500/5 to-rose-500/5 border ${
                  siteTheme === "sudanese" ? "border-mud/5" : "border-slate-850"
                }`}
              >
                {currentStepData.icon}
              </motion.div>

              <h2 className={`text-xl md:text-2xl font-black ${
                siteTheme === "sudanese" ? "text-mud" : "text-slate-100"
              }`}>
                {isRtl ? currentStepData.titleAr : currentStepData.titleEn}
              </h2>

              <p className={`text-xs md:text-sm leading-relaxed max-w-lg ${
                siteTheme === "sudanese" ? "text-mud/80" : "text-slate-300"
              }`}>
                {isRtl ? currentStepData.descriptionAr : currentStepData.descriptionEn}
              </p>
            </div>

            {/* Bullet points or interactive features illustration */}
            <div className={`rounded-2xl p-5 ${
              siteTheme === "sudanese" ? "bg-[#FDFBF7]" : "bg-slate-950/50"
            }`}>
              <ul className="space-y-3">
                {(isRtl ? currentStepData.bulletsAr : currentStepData.bulletsEn).map((bullet, idx) => (
                  <motion.li
                    initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="flex items-start gap-3 text-3xs md:text-2xs font-extrabold"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentStep === idx 
                      ? "w-8 bg-earthgold" 
                      : `w-2 ${siteTheme === "sudanese" ? "bg-mud/20 hover:bg-mud/40" : "bg-slate-800 hover:bg-slate-700"}`
                  }`}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-mud/5">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  currentStep === 0
                    ? "opacity-0 pointer-events-none"
                    : siteTheme === "sudanese"
                      ? "bg-cream/55 hover:bg-cream/80 text-mud"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                {isRtl ? (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {currentStep === steps.length - 1 ? (
                  isRtl ? "ابدأ الآن 🚀" : "Get Started 🚀"
                ) : (
                  isRtl ? (
                    <>
                      <span>التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
