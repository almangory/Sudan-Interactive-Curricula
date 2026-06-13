import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, Sparkles, MessageSquare, HelpCircle, RefreshCw, 
  CheckCircle, XCircle, Info, Trophy, ChevronRight, UserCheck, BookOpen 
} from "lucide-react";

interface AITutorProps {
  stageName: string;
  gradeName: string;
  subjectName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface Quiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export default function AITutor({ stageName, gradeName, subjectName, onClose }: AITutorProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: 'model',
      text: `مرحباً بك يا بطل! أنا المعلم السوداني الذكي ومساعدك الخاص في مادة (${subjectName}) لـ (${gradeName}). يسعدني جداً أن نراجع وندرس معاً اليوم. سلني عن أي موضوع في المنهج وسأبسطه لك بأجمل طريقة! 💡✨`
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send chat message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userText = inputVal.trim();
    setInputVal("");
    
    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Map frontend history format to backend format
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: history,
          grade: gradeName,
          subject: subjectName,
          stage: stageName
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: data.text
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: data.error || "عذراً يا بطل، حدث خطأ أثناء الاتصال بالخادم الذكي. يرجى التأكد من تشغيل الخادم."
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "يبدو أن هناك مشكلة في شبكة الاتصال بالمدرس السوداني الذكي. يرجى التحقق من الاتصال وإعادة التجربة."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate dynamic quiz using Gemini API
  const generateQuiz = async () => {
    setLoadingQuiz(true);
    setQuizzes(null);
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizFinished(false);
    setQuizScore(0);

    try {
      const response = await fetch("/api/tutor/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeName,
          subject: subjectName,
          stage: stageName
        })
      });

      const data = await response.json();
      if (response.ok && data.quizzes && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes);
      } else {
        // Fallback static high quality quiz context if API isn't fully ready/secret is missing
        setQuizzes([
          {
            question: `أي مما يلي يعبر عن حقيقة أساسية في مادة ${subjectName} المقررة في المنهج السوداني؟`,
            options: ["الاستكشاف الدائم والتجربة", "الحفظ بدون فهم وتطبيق", "إهمال المراجعة المستمرة", "تأجيل الواجبات المدرسية"],
            answerIndex: 0,
            explanation: "أحسنت! الاستكشاف وتدقيق المفاهيم العلمية والأدبية في المدرسة هو أساس النجاح والتفوق في امتحانات المنهج السوداني."
          },
          {
            question: `ما هو أهم سلوك يسهم في نجاح طالب السودان في دراسة مادة  ${subjectName}؟`,
            options: ["التركيز مع الأستاذ وحل التمارين التفاعلية", "الغياب المتكرر عن الحصص", "التسرع وعدم سؤال المعلم", "شراء الملخصات دون فهم المواد"],
            answerIndex: 0,
            explanation: "رائع جداً! مراجعة الدروس وحل الأنشطة يدعم ترسيخ المعرفة وبناء مستقبل مشرق للسودان الحبيب."
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setQuizzes([
        {
          question: `أجب عن هذا السؤال التنشيطي في مادة ${subjectName}: ما هو حجر الأساس للتعلم النشط؟`,
          options: ["المثابرة وحل المسائل التفاعلية", "نسيان الدروس بسرعة", "عدم المشاركة مع المعلم", "الاقتصار على المعلومات السطحية"],
          answerIndex: 0,
          explanation: "ممتاز! المثابرة وحل التمارين التفاعلية هو أقصر طريق للريادة العلمية والتفوق الدراسي."
        }
      ]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Trigger quiz generation when switching to quiz tab if none exists
  useEffect(() => {
    if (activeTab === 'quiz' && !quizzes && !loadingQuiz && !quizFinished) {
      generateQuiz();
    }
  }, [activeTab]);

  const handleSelectOption = (optIdx: number) => {
    if (selectedAnswer !== null) return; // Cant change answer
    setSelectedAnswer(optIdx);
    setShowExplanation(true);
    
    if (quizzes && optIdx === quizzes[currentQuizIdx].answerIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (!quizzes) return;
    
    if (currentQuizIdx < quizzes.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-755 shadow-2xl text-right" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 border-b border-emerald-900/35 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-700/30 rounded-xl text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-emerald-400 font-mono tracking-wide">{gradeName} • {stageName}</span>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
              <span>بوابة تفاعلية:</span>
              <span className="text-emerald-300">{subjectName}</span>
            </h3>
          </div>
        </div>
        
        {/* Tab Controls */}
        <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'chat' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-205'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            أستاذك السوداني الذكي
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'quiz' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-205'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            اختبارات مبسطة
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex flex-col justify-between">
        {activeTab === 'chat' ? (
          /* Chat Section */
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none ml-auto'
                        : 'bg-slate-800/90 text-slate-10 w-full border border-slate-700/30 rounded-bl-none text-right mr-auto'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-emerald-400">
                        <UserCheck className="w-3.5 h-3.5" />
                        المرشد التعليمي السوداني
                      </div>
                    )}
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-slate-800/90 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 text-xs border border-slate-700/30 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span>الأستاذ يفكر في الإجابة...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="اسأل المعلم عن درس اليوم (مثال: اشرح لي حالات المادة...)"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 text-right"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded-lg disabled:opacity-40 disabled:hover:bg-emerald-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </form>
          </div>
        ) : (
          /* Quiz Section */
          <div className="flex flex-col h-full items-center justify-center">
            {loadingQuiz ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <RefreshCw className="w-10 h-10 text-emerald-450 animate-spin" />
                <p className="text-sm text-slate-400">جاري صياغة أسئلة ممتعة وتفاعلية لمستواك الدراسي...</p>
              </div>
            ) : quizFinished ? (
              /* Finish Screen */
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-5 p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm mt-4 shadow-xl"
              >
                <div className="w-16 h-16 bg-emerald-650/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-100">أبشر يا بطل، أحسنت!</h4>
                  <p className="text-sm text-slate-400 mt-2">لقد أكملت اختبار مادة {subjectName} القصير بنجاح.</p>
                </div>
                
                <div className="p-3.5 bg-slate-950 rounded-lg">
                  <span className="text-xs text-slate-400 block mb-1">النتيجة النهائية</span>
                  <span className="text-3xl font-black text-emerald-400">{quizScore} / {quizzes?.length}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={generateQuiz}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    تحدي جديد
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    اسأل الأستاذ
                  </button>
                </div>
              </motion.div>
            ) : quizzes && quizzes.length > 0 ? (
              /* Play Screen */
              <div className="flex-1 flex flex-col justify-between w-full space-y-4">
                {/* Score Tracker and Progress */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                  <span>النتيجة: <strong className="text-emerald-400 text-sm">{quizScore}</strong></span>
                  <span>السؤال {currentQuizIdx + 1} من {quizzes.length}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuizIdx) / quizzes.length) * 100}%` }}
                  ></div>
                </div>

                {/* Question */}
                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl">
                  <h4 className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
                    {quizzes[currentQuizIdx].question}
                  </h4>
                </div>

                {/* Options List */}
                <div className="space-y-2 flex-1">
                  {quizzes[currentQuizIdx].options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === quizzes[currentQuizIdx].answerIndex;
                    let optionStyle = "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white";
                    
                    if (selectedAnswer !== null) {
                      if (isCorrect) {
                        optionStyle = "bg-emerald-950/70 border-emerald-500 text-emerald-200";
                      } else if (isSelected) {
                        optionStyle = "bg-rose-950/70 border-rose-500 text-rose-200";
                      } else {
                        optionStyle = "bg-slate-900/40 text-slate-500 border-slate-800";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-3.5 border rounded-xl text-right text-xs md:text-sm font-medium transition-all flex items-center justify-between group ${optionStyle} ${selectedAnswer === null ? 'cursor-pointer' : ''}`}
                      >
                        <span>{option}</span>
                        {selectedAnswer !== null && isCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-2" />
                        )}
                        {selectedAnswer !== null && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mr-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-emerald-950/20 text-emerald-300/90 text-xs p-4 rounded-xl border border-emerald-900/40 overflow-hidden leading-relaxed"
                    >
                      <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
                        <Info className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>معلومة مفيدة:</span>
                      </div>
                      <p>{quizzes[currentQuizIdx].explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next Button */}
                <button
                  onClick={handleNextQuiz}
                  disabled={selectedAnswer === null}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg disabled:opacity-45 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{currentQuizIdx === quizzes.length - 1 ? "إنهاء التحدي ورؤية النتيجة" : "السؤال التالي"}</span>
                  <ChevronRight className="w-4 h-4 transform rotate-180" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">لم يتم العثور على أسئلة اختبار نشطة لهذا الموضوع.</p>
                <button 
                  onClick={generateQuiz} 
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                >
                  توليد الأسئلة مجدداً
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
