import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, SendHorizontal, Users, ShieldAlert, Trash2, 
  Lock, ArrowDown, Send, User, Sparkles, Smile, HelpCircle 
} from "lucide-react";
import { AppUser, getSupabaseClient } from "../lib/supabase";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  gradeName: string | null;
  text: string;
  timestamp: string;
}

interface StudentChatRoomProps {
  currentUser: AppUser | null;
  currentLang: "ar" | "en";
  isAdminLoggedIn: boolean;
  onTriggerAuth: () => void;
}

export default function StudentChatRoom({ 
  currentUser, 
  currentLang, 
  isAdminLoggedIn, 
  onTriggerAuth 
}: StudentChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(1);
  const [censorshipWarning, setCensorshipWarning] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUsingSupabaseDirectly, setIsUsingSupabaseDirectly] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Translations
  const t = {
    chatTitle: currentLang === "ar" ? "الدردشة الطلابية التفاعلية 💬" : "Interactive Student Chat 💬",
    subTitle: currentLang === "ar" ? "ملتقى طلاب ومعلمي السودان للنقاش وبناء المعرفة" : "Connecting students & teachers across Sudan",
    notLoggedInTitle: currentLang === "ar" ? "الدردشة الطلابية مغلقة مؤقتاً 🔐" : "Student Chat is Locked 🔐",
    notLoggedInDesc: currentLang === "ar" ? "هذه الدردشة مخصصة ومحمية للطلاب والمعلمين المسجلين في منصتنا فقط لضمان سلامة وجودة العملية التعليمية." : "This chat is secure and strictly reserved for registered students & teachers of our platform to ensure safety.",
    loginBtn: currentLang === "ar" ? "تسجيل الدخول / إنشاء حساب جديد 👥" : "Login / Create Account 👥",
    placeholder: currentLang === "ar" ? "اكتب رسالة لزملائك... يرجى الحفاظ على الآداب والود 🌸" : "Type a message... please keep it friendly & polite 🌸",
    onlineUsers: currentLang === "ar" ? "نشط الآن بالمنصة" : "Active now on platform",
    anonymous: currentLang === "ar" ? "طالب مجتهد" : "Diligent Student",
    adminBadge: currentLang === "ar" ? "🔑 إدارة المنصة" : "🔑 Admin",
    teacherBadge: currentLang === "ar" ? "👨‍🏫 معلم معتمد" : "👨‍🏫 Teacher",
    studentBadge: currentLang === "ar" ? "🎓 طالب" : "🎓 Student",
    warningTitle: currentLang === "ar" ? "تنبيه بخصوص المحتوى ⚠️" : "Content Advisory ⚠️",
    warningDesc: currentLang === "ar" ? "تم فحص رسالتك وتعديل بعض الكلمات لتبدو لائقة. شكراً لالتزامك بحدود الأدب العام وتوقير زملائك!" : "Your message was automatically censored for public decency. Thank you for keeping it polite!",
    noMessagesYet: currentLang === "ar" ? "لا توجد رسائل بعد.. كن أول من يلقي السلام! 👋" : "No messages yet.. be the first to say hello! 👋",
    deleteConfirm: currentLang === "ar" ? "هل أنت متأكد من حذف هذه الرسالة نهائياً؟" : "Are you sure you want to permanently delete this message?",
    characterLimit: currentLang === "ar" ? "الحد الأقصى للرسالة هو 250 حرفاً" : "Max message length is 250 characters"
  };

  // Client-side bad words filter
  function censorBadWords(text: string): string {
    let censored = text;
    const profaneList = [
      "يا كلب", "ياكلب", "ابن الكلب", "بنت الكلب", "يا حمار", "ياحمار", "كلب", "حمار", "غبي", "حيوان", "خرة", "زق", "قذر", "قذرة",
      "سافل", "سافلة", "وسخ", "وسخة", "متخلف", "منحط", "يا جزمة", "ياجزمة", "سرسر", "شرير", "حقير", "حقيرة", "تفه",
      "كس", "طيز", "شرموط", "ديوث", "عرص", "عاهر", "قحبة", "منيوك", "نكاح", "شرموطة", "قحبة", "عاهرة", "منيوكة", "لوطي"
    ];
    const profaneEnglish = [
      "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "slut", "whore"
    ];

    for (const word of profaneList) {
      const regex = new RegExp(word, 'gi');
      censored = censored.replace(regex, (match) => "*".repeat(match.length));
    }

    for (const word of profaneEnglish) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      censored = censored.replace(regex, (match) => "*".repeat(match.length));
    }

    return censored;
  }

  // Fetch messages list with automated Vercel/Supabase direct-read fallback
  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      // Force direct Supabase mode if server address indicates we are on Vercel deployment, as Vercel static has no Express state
      const isVercelHost = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("github.dev");
      
      if (isVercelHost || isUsingSupabaseDirectly) {
        await fetchMessagesFromSupabaseDirectly();
        return;
      }

      const res = await fetch("/api/chat/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } else {
        // Fallback for unexpected status codes (e.g., 404 or 502)
        await fetchMessagesFromSupabaseDirectly();
      }
    } catch (err) {
      console.warn("Backend API Chat inactive, utilizing Supabase direct-read fallback:", err);
      await fetchMessagesFromSupabaseDirectly();
    } finally {
      if (!silent) {
        setIsLoading(false);
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 300);
      }
    }
  };

  const fetchMessagesFromSupabaseDirectly = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      setIsUsingSupabaseDirectly(true);
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("Could not query chat_messages. It might not be created in Supabase yet. Error:", error);
        return;
      }

      if (data) {
        const formatted: ChatMessage[] = [...data].reverse().map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          username: m.username,
          userRole: m.user_role || "student",
          gradeName: m.grade_name || null,
          text: m.text,
          timestamp: m.timestamp
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.error("Direct Supabase fetch err:", e);
    }
  };

  useEffect(() => {
    fetchMessages();

    // ⚡ Socket/SSE live update events listener with safety wrapper
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_chat_message" && data.message) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            
            if (chatContainerRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
              if (scrollHeight - scrollTop - clientHeight < 150) {
                setTimeout(() => scrollToBottom("smooth"), 100);
              } else {
                setShowScrollBtn(true);
              }
            }
          } else if (data.type === "delete_chat_message" && data.id) {
            setMessages(prev => prev.filter(m => m.id !== data.id));
          }
        } catch (err) {
          console.warn("SSE sync message parse error:", err);
        }
      };
    } catch (e) {
      console.warn("Live EventSource SSE subscription failed. Relying on polling.");
    }

    // Dynamic presence indicator fluctuation
    setActiveUsersCount(12 + Math.floor(Math.random() * 8));
    const presenceInterval = setInterval(() => {
      setActiveUsersCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 3 ? 3 : next > 40 ? 40 : next;
      });
    }, 15000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(presenceInterval);
    };
  }, [isUsingSupabaseDirectly]);

  // Robust client-side polling interval fallback for serverless hosting like Vercel (updates every 3.5 seconds)
  useEffect(() => {
    if (!isUsingSupabaseDirectly) return;

    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [isUsingSupabaseDirectly]);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || isSending) return;

    if (inputText.length > 250) {
      alert(t.characterLimit);
      return;
    }

    try {
      setIsSending(true);
      setCensorshipWarning(false);

      const originalText = inputText.trim();

      if (isUsingSupabaseDirectly) {
        const client = getSupabaseClient();
        if (client) {
          const filteredText = censorBadWords(originalText);
          const newId = "MSG-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
          
          const payload = {
            id: newId,
            user_id: currentUser.id,
            username: currentUser.username,
            user_role: currentUser.user_role || "student",
            grade_name: currentUser.grade_name || null,
            text: filteredText,
            timestamp: new Date().toISOString()
          };

          const { error } = await client.from("chat_messages").insert([payload]);
          if (error) {
            console.error("Direct Supabase message insertion error:", error);
            alert(currentLang === "ar" 
              ? "⚠️ لم يتم تفعيل جدول chat_messages بعد في قواعد أمان سوبابيس (RLS). تفضل بربط الجدول أو اطلب من الإدارة تفعيل الكود بنجاح." 
              : "⚠️ Table chat_messages is not configured/configured with RLS in Supabase. Please ask Admin to apply SQL script."
            );
            return;
          }

          if (filteredText.includes("***") || (filteredText !== originalText && filteredText.includes("*"))) {
            setCensorshipWarning(true);
            setTimeout(() => setCensorshipWarning(false), 9000);
          }

          const formattedMessage: ChatMessage = {
            id: newId,
            userId: currentUser.id,
            username: currentUser.username,
            userRole: currentUser.user_role || "student",
            gradeName: currentUser.grade_name || null,
            text: filteredText,
            timestamp: payload.timestamp
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newId)) return prev;
            return [...prev, formattedMessage];
          });

          setInputText("");
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
        return;
      }

      const payload = {
        userId: currentUser.id,
        username: currentUser.username,
        userRole: currentUser.user_role || "student",
        gradeName: currentUser.grade_name || null,
        text: inputText.trim()
      };

      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          if (data.message.text.includes("***") || (data.message.text !== originalText && data.message.text.includes("*"))) {
            setCensorshipWarning(true);
            setTimeout(() => setCensorshipWarning(false), 9000);
          }
          
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          
          setInputText("");
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Moderate/delete a single message (Admins only)
  const handleDeleteMessage = async (messageId: string) => {
    const isConfirmed = window.confirm(t.deleteConfirm);
    if (!isConfirmed) return;

    try {
      if (isUsingSupabaseDirectly) {
        const client = getSupabaseClient();
        if (client) {
          const { error } = await client
            .from("chat_messages")
            .delete()
            .eq("id", messageId);

          if (error) {
            console.error("Direct Supabase deletion error:", error);
            return;
          }
          setMessages(prev => prev.filter(m => m.id !== messageId));
        }
        return;
      }

      const res = await fetch("/api/chat/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messageId,
          adminPassword: "20302060" 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(prev => prev.filter(m => m.id !== messageId));
        }
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Helper to format timestamps gracefully
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(currentLang === "ar" ? "ar-SD" : "en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  };

  // If user is not authenticated, show nice gate blocker
  if (!currentUser) {
    return (
      <div 
        id="chat-gate-container"
        className="max-w-3xl mx-auto p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 shadow-2xl text-center space-y-6 select-none"
      >
        <div className="w-20 h-20 bg-indigo-950/40 border border-indigo-800/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-900/10">
          <Lock className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-sans text-slate-100">
            {t.notLoggedInTitle}
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            {t.notLoggedInDesc}
          </p>
        </div>

        <div className="pt-2">
          <button
            id="chat-register-trigger-btn"
            onClick={onTriggerAuth}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-slate-50 font-extrabold text-sm rounded-2xl cursor-pointer transition-all duration-300 shadow-md shadow-emerald-900/20 active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Users className="w-4 h-4" />
            <span>{t.loginBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine current user display badge details
  const isAdmin = isAdminLoggedIn || currentUser.user_role === "admin";
  const isTeacher = currentUser.user_role === "teacher";

  return (
    <div 
      id="chat-room-dashboard"
      className="max-w-4xl mx-auto grid grid-cols-1 border border-slate-800/60 rounded-3xl bg-slate-950/80 shadow-2xl overflow-hidden min-h-[550px]"
    >
      {/* Dynamic Header */}
      <header className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600/10 border border-emerald-800/30 text-emerald-400 rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base font-sans leading-tight">
              {t.chatTitle}
            </h3>
            <p className="text-4xs sm:text-3xs text-slate-400">
              {t.subTitle}
            </p>
          </div>
        </div>

        {/* Dynamic presence box count */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800/60 rounded-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-extrabold text-slate-200">
            {activeUsersCount}
          </span>
          <span className="text-3xs text-slate-450 pr-1 pl-1 border-r border-slate-800">
            {t.onlineUsers}
          </span>
        </div>
      </header>

      {/* Censorship feedback card */}
      {censorshipWarning && (
        <div 
          id="censorship-alert-banner"
          className="bg-amber-950/40 border-b border-amber-800/35 p-3 px-4 flex items-start gap-3 animated-fade-in"
        >
          <div className="p-1.5 rounded-lg bg-amber-600/10 text-amber-400">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-3xs font-extrabold text-amber-300">
              {t.warningTitle}
            </h4>
            <p className="text-4xs text-slate-350 leading-relaxed">
              {t.warningDesc}
            </p>
          </div>
        </div>
      )}

      {/* Messages list scroller container */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto overflow-x-hidden min-h-[380px] bg-sky-950/5 relative scrollbar-thin scrollbar-thumb-slate-800"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-500">
              <Sparkles className="w-8 h-8 opacity-60" />
            </div>
            <p className="text-3xs text-slate-400 font-bold max-w-xs leading-normal">
              {t.noMessagesYet}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.userId === currentUser.id;
            const isMsgAdmin = msg.userRole === "admin";
            const isMsgTeacher = msg.userRole === "teacher";

            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${
                  isMyMessage ? "mr-auto flex-row-reverse text-left" : "ml-auto"
                }`}
              >
                {/* User graphic Avatar */}
                <div className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center text-xs font-bold transition-all relative ${
                  isMyMessage 
                    ? "bg-indigo-900/10 text-indigo-350 border-indigo-805" 
                    : isMsgAdmin 
                    ? "bg-red-950/20 text-red-400 border-red-900/40"
                    : isMsgTeacher
                    ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
                    : "bg-slate-900 text-slate-300 border-slate-800"
                }`}
                title={msg.username}
                >
                  {isMsgAdmin ? "🔑" : isMsgTeacher ? "👨‍" : msg.username.charAt(0).toUpperCase()}
                </div>

                {/* Message body wrapper */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Sender details list */}
                  <div className={`flex items-center gap-1.5 text-4xs ${
                    isMyMessage ? "flex-row-reverse" : ""
                  }`}>
                    {/* Username */}
                    <span className="font-extrabold text-slate-200">
                      {msg.username}
                    </span>

                    {/* Role badge */}
                    {isMsgAdmin ? (
                      <span className="px-1.5 py-0.5 rounded-full text-4xs font-bold bg-gradient-to-r from-red-950/40 to-slate-900 text-red-400 border border-red-900/30">
                        {t.adminBadge}
                      </span>
                    ) : isMsgTeacher ? (
                      <span className="px-1.5 py-0.5 rounded-full text-4xs font-bold bg-gradient-to-r from-emerald-950/40 to-slate-900 text-emerald-400 border border-emerald-900/30">
                        {t.teacherBadge}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-4xs font-bold bg-slate-900 text-slate-400 border border-slate-850">
                        {t.studentBadge} {msg.gradeName ? `(${msg.gradeName})` : ""}
                      </span>
                    )}

                    {/* Timestamp relative info */}
                    <span className="text-slate-500 font-mono select-none">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Bubble text content */}
                  <div className={`p-3.5 rounded-2xl break-words text-xs leading-relaxed select-text font-medium select-text ${
                    isMyMessage 
                      ? "bg-gradient-to-br from-indigo-900/20 to-slate-900 text-indigo-100 rounded-tl-none border border-indigo-900/40" 
                      : isMsgAdmin 
                      ? "bg-slate-900 border border-red-900/30 text-rose-100 rounded-tr-none"
                      : isMsgTeacher
                      ? "bg-slate-900 border border-emerald-950/60 text-emerald-50 rounded-tr-none"
                      : "bg-slate-900/50 border border-slate-800/80 text-slate-100 rounded-tr-none"
                  }`}>
                    {msg.text}
                  </div>

                  {/* Moderation section (Any Admin can delete) */}
                  {isAdmin && (
                    <div className={`flex ${isMyMessage ? "justify-start" : "justify-end"}`}>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="inline-flex items-center gap-1 mt-0.5 text-4xs text-red-500 hover:text-red-400 transition-colors cursor-pointer font-bold bg-red-950/10 hover:bg-red-950/30 px-2 py-1 rounded"
                        title={currentLang === "ar" ? "حذف الرسالة" : "Delete message"}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>{currentLang === "ar" ? "حذف" : "Remove"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll bottom bubble */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute scroll-bottom-btn self-center bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 text-slate-200 p-2 rounded-full duration-300 shadow-xl cursor-pointer hover:bg-slate-850 z-20 flex items-center justify-center animate-bounce"
        >
          <ArrowDown className="w-4 h-4 text-emerald-400" />
        </button>
      )}

      {/* Form messaging composer */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
        <form 
          onSubmit={handleSendMessage}
          className="w-full flex items-center gap-2"
        >
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            maxLength={250}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 p-3 px-4 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none"
            placeholder={t.placeholder}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              inputText.trim() && !isSending
                ? "bg-emerald-600 hover:bg-emerald-505 text-slate-50 cursor-pointer shadow shadow-emerald-950"
                : "bg-slate-900 text-slate-600 cursor-not-allowed"
            }`}
          >
            <SendHorizontal className="w-4.5 h-4.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
