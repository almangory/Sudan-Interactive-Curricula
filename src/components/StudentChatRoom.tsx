import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, SendHorizontal, Users, ShieldAlert, Trash2, 
  Lock, ArrowDown, Send, User, Sparkles, Smile, HelpCircle,
  Check, X, UserPlus, UserCheck, Search, Bell
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

interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted";
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
  
  // Friendship & user list states
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isRelationsLoading, setIsRelationsLoading] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<"chat" | "directory" | "requests">("chat");
  const [userSearchText, setUserSearchText] = useState("");
  const [friendMessageIdMap, setFriendMessageIdMap] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Translations dictionary
  const t = {
    chatTitle: currentLang === "ar" ? "الدردشة الآمنة بين أصدقاء الدراسة 💬" : "Secure Friendship Chat 💬",
    subTitle: currentLang === "ar" ? "تواصل وتناقش مع أصدقائك المقبولين من نفس المرحلة الدراسية" : "Chat with approved peers from your stage",
    notLoggedInTitle: currentLang === "ar" ? "يرجى تسجيل الدخول أولاً لتتمكن من استخدام الدردشة 🔐" : "Please login first to use the Chat 🔐",
    notLoggedInDesc: currentLang === "ar" ? "هذه الدردشة مخصصة ومحمية للطلاب والمعلمين المسجلين في منصتنا فقط لضمان سلامة وجودة العملية التعليمية." : "This chat is secure and strictly reserved for registered students & teachers of our platform to ensure safety.",
    loginBtn: currentLang === "ar" ? "تسجيل الدخول / إنشاء حساب جديد 👥" : "Login / Create Account 👥",
    placeholder: currentLang === "ar" ? "اكتب رسالة لأصدقائك الدراسيين... يرجى الحفاظ على الود 🌸" : "Type a message... please keep it friendly & polite 🌸",
    onlineUsers: currentLang === "ar" ? "متصل الآن بالمنصة" : "Active now on platform",
    anonymous: currentLang === "ar" ? "طالب مجتهد" : "Diligent Student",
    adminBadge: currentLang === "ar" ? "🔑 إدارة المنصة" : "🔑 Admin",
    teacherBadge: currentLang === "ar" ? "👨‍🏫 معلم معتمد" : "👨‍🏫 Teacher",
    studentBadge: currentLang === "ar" ? "🎓 طالب" : "🎓 Student",
    warningTitle: currentLang === "ar" ? "تنبيه بخصوص المحتوى ⚠️" : "Content Advisory ⚠️",
    warningDesc: currentLang === "ar" ? "تم فحص رسالتك وتعديل بعض الكلمات لتبدو لائقة. شكراً لالتزامك بحدود الأدب العام وتوقير زملائك!" : "Your message was automatically censored for public decency. Thank you for keeping it polite!",
    noMessagesYet: currentLang === "ar" ? "لا توجد رسائل بين الأصدقاء بعد.. أرسل الطلبات وتحدث مع زملائك! 👋" : "No messages yet between friends.. send requests to chat! 👋",
    deleteConfirm: currentLang === "ar" ? "هل أنت متأكد من حذف هذه الرسالة نهائياً؟" : "Are you sure you want to permanently delete this message?",
    characterLimit: currentLang === "ar" ? "الحد الأقصى للرسالة هو 250 حرفاً" : "Max message length is 255 characters",
    
    // Friend terms
    tabChat: currentLang === "ar" ? "غرفة دردشة الأصدقاء 💬" : "Friends Chat Room 💬",
    tabDirectory: currentLang === "ar" ? "دليل الطلاب الدراسيين 👥" : "Students Finder 👥",
    tabRequests: currentLang === "ar" ? "طلبات الصداقة 🔔" : "Friend Requests 🔔",
    searchPlaceholder: currentLang === "ar" ? "البحث بالاسم أو الصف الدراسي..." : "Search by name or grade...",
    differentStage: currentLang === "ar" ? "مرحلة دراسية مختلفة 🔒" : "Different stage 🔒",
    sameStageLabel: currentLang === "ar" ? "نفس مرحلتك الدراسية ✅" : "Same Educational Stage ✅",
    addFriend: currentLang === "ar" ? "إرسال طلب صداقة ➕" : "Add Friend ➕",
    pendingRequest: currentLang === "ar" ? "طلب معلق ⏳" : "Pending ⏳",
    friendsNow: currentLang === "ar" ? "صديق مضاف 🟢" : "Friends 🟢",
    acceptBtn: currentLang === "ar" ? "قبول ✅" : "Accept ✅",
    declineBtn: currentLang === "ar" ? "رفض ❌" : "Decline ❌",
    incomingTitle: currentLang === "ar" ? "طلبات الصداقة المعلقة الواردة إليك" : "Incoming friend requests awaiting response",
    outgoingTitle: currentLang === "ar" ? "طلبات الصداقة المرسلة من قبلك" : "Outgoing requests sent",
    noRequests: currentLang === "ar" ? "لا توجد طلبات صداقة معلقة حالياً." : "No pending friend requests found.",
    noUsers: currentLang === "ar" ? "لم يتم العثور على أية طلاب يطابقون بحثك." : "No student peers matching search.",
    stageRestricted: currentLang === "ar" ? "قصر التواصل على الطلاب من نفس المرحلة الدراسية" : "Communications restricted to the same educational stage",
    stageRestrictedDesc: currentLang === "ar" ? "وفقاً لإعدادات الأمان وحماية الأطفال بالمنصة، لا يمكن التواصل ولا تبادل الرسائل إلا بين الطلاب في نفس المرحلة التعليمية (ابتدائي، متوسط، أو ثانوي) لضمان تقارب المستويات وتوفير بيئة تعليمية سليمة." : "According to the platform's student protection policy, communication is only permitted between students in the same educational stage.",
    yourStageMsg: currentLang === "ar" ? "مرحلتك التعليمية الحالية:" : "Your current education stage:",
    sentSuccess: currentLang === "ar" ? "تم إرسال طلب الصداقة بنجاح 🚀" : "Friend request sent successfully! 🚀",
    acceptSuccess: currentLang === "ar" ? "تم قبول الصداقة! يمكنكما الآن الدردشة سحرياً 🎉" : "Friend request accepted! You can now chat 🎉",
    declineSuccess: currentLang === "ar" ? "تم رفض الطلب وحذفه بنجاح." : "Request declined successfully."
  };

  // Helper: Calculate stage category based on grade identity
  const getStageOfGrade = (gradeId: string | null | undefined): string => {
    if (!gradeId) return "unknown";
    const idLower = gradeId.toLowerCase();
    if (idLower.includes("kg") || idLower.includes("kinder")) return "kindergarten";
    if (idLower.includes("elem") || idLower.includes("prim") || idLower.match(/^(grade-1|grade-2|grade-3|grade-4|grade-5|grade-6)$/)) return "primary";
    if (idLower.includes("mid") || idLower.includes("inter") || idLower.includes("prep") || idLower.match(/^(grade-7|grade-8|grade-9)$/)) return "middle";
    if (idLower.includes("high") || idLower.includes("sec") || idLower.match(/^(grade-10|grade-11|grade-12)$/)) return "high";
    return "primary"; // Fallback to common Stage
  };

  const getStageLabel = (stageId: string): string => {
    if (stageId === "kindergarten") return currentLang === "ar" ? "التعليم المبكر (الروضة)" : "Early Education (KG)";
    if (stageId === "primary") return currentLang === "ar" ? "المرحلة الابتدائية" : "Primary School";
    if (stageId === "middle") return currentLang === "ar" ? "المرحلة المتوسطة" : "Middle School";
    if (stageId === "high") return currentLang === "ar" ? "المرحلة الثانوية" : "High School";
    return currentLang === "ar" ? "مرحلة تعليمية عامة" : "General Stage";
  };

  // Client-side bad words filter
  function filterTextCensor(text: string): string {
    return censorBadWords(text);
  }

  // Fetch users directory and friendships list
  const fetchFriendshipsAndPeers = async () => {
    if (!currentUser) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      setIsRelationsLoading(true);

      // 1. Fetch all friendships where current user is sender or receiver
      const { data: friendshipsData, error: relationError } = await client
        .from("friendships")
        .select("*")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (!relationError && friendshipsData) {
        setFriendships(friendshipsData as Friendship[]);
      }

      // 2. Fetch all registered users to construct the students directory
      const { data: usersData, error: usersError } = await client
        .from("users")
        .select("*")
        .limit(200);

      if (!usersError && usersData) {
        // Exclude ourselves from the directory
        const filteredPeers = (usersData as AppUser[]).filter(u => u.id !== currentUser.id);
        setAllUsers(filteredPeers);
      }
    } catch (e) {
      console.warn("Error fetching friendship states:", e);
    } finally {
      setIsRelationsLoading(false);
    }
  };

  // Fetch chat messages history securely
  const fetchMessagesDirect = async (silent = false) => {
    const client = getSupabaseClient();
    if (!client || !currentUser) return;

    try {
      if (!silent) setIsLoading(true);

      // Retrieve friendships list first to verify who is accepted
      const { data: relations } = await client
        .from("friendships")
        .select("*")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      const friendshipList = (relations || []) as Friendship[];
      const approvedFriendIds = new Set<string>();

      friendshipList.forEach(rel => {
        if (rel.status === "accepted") {
          approvedFriendIds.add(rel.sender_id === currentUser.id ? rel.receiver_id : rel.sender_id);
        }
      });

      // Also include ourselves and admin postings
      approvedFriendIds.add(currentUser.id);

      // Fetch messages from Supabase directly
      const { data: msgs, error } = await client
        .from("chat_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(120);

      if (error) {
        console.warn("Could not query chat_messages. Exception:", error);
        return;
      }

      if (msgs) {
        // Filter messages to strictly match only accepted friendships
        // This acts as a client-side layer to double-guarantee RLS compliance and safety
        const secureMessages = msgs
          .filter((m: any) => approvedFriendIds.has(m.user_id) || m.user_role === "admin")
          .map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            username: m.username,
            userRole: m.user_role || "student",
            gradeName: m.grade_name || null,
            text: m.text,
            timestamp: m.timestamp
          }));

        // Reverse to maintain chronological order in chat view
        setMessages([...secureMessages].reverse());
      }
    } catch (e) {
      console.error("Direct Supabase message fetch error:", e);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 300);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFriendshipsAndPeers();
      fetchMessagesDirect();
    }
  }, [currentUser]);

  // Robust polling for instant real-time sync when on Vercel state
  useEffect(() => {
    if (!currentUser) return;

    const syncInterval = setInterval(() => {
      fetchMessagesDirect(true);
      // Fetch friendships sparingly to conserve DB quota
      if (Math.random() > 0.75) {
        fetchFriendshipsAndPeers();
      }
    }, 3800);

    return () => clearInterval(syncInterval);
  }, [currentUser]);

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

  // SEND MESSAGE HANDLER
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
      const filteredText = filterTextCensor(originalText);
      const newId = "MSG-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

      const client = getSupabaseClient();
      if (!client) return;

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
          ? "⚠️ لم يتم تفعيل الشات لجميع المستخدمين حالياً أو أن الطرف الآخر ليس صديقاً معتمداً بعد." 
          : "⚠️ Post message failed. Make sure you are chatting with accepted friends only."
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
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // DELETE MESSAGE (Admin only)
  const handleDeleteMessage = async (messageId: string) => {
    const isConfirmed = window.confirm(t.deleteConfirm);
    if (!isConfirmed) return;

    try {
      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client
        .from("chat_messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("Direct Supabase deletion error:", error);
        return;
      }
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // FRIENDSHIP OPERATIONAL ACTIONS
  // 1. Send Friend Request
  const handleAddFriend = async (targetUser: AppUser) => {
    const client = getSupabaseClient();
    if (!client || !currentUser) return;

    try {
      // Rule validation: can only add friends from the exact same stage ("من نفس المرحلة فقط")
      const myStage = getStageOfGrade(currentUser.grade_id);
      const targetStage = getStageOfGrade(targetUser.grade_id);

      if (myStage !== targetStage) {
        alert(currentLang === "ar"
          ? `⚠️ عذراً! يتيح النظام إرسال طلبات الصداقة للطلاب من نفس المرحلة التعليمية فقط. (أنت في ${getStageLabel(myStage)} والزميل في ${getStageLabel(targetStage)})`
          : `⚠️ Sorry! You can only send friend requests to students in the same educational stage.`
        );
        return;
      }

      const friendshipId = `FRND-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload = {
        id: friendshipId,
        sender_id: currentUser.id,
        receiver_id: targetUser.id,
        status: "pending"
      };

      const { error } = await client.from("friendships").insert([payload]);
      if (error) {
        console.error("Could not insert friendship:", error);
        return;
      }

      alert(t.sentSuccess);
      fetchFriendshipsAndPeers();
    } catch (e) {
      console.error("Add friend error:", e);
    }
  };

  // 2. Accept Friend Request with Strict same-stage condition verification
  const handleAcceptFriend = async (friendshipId: string, senderUser: AppUser) => {
    const client = getSupabaseClient();
    if (!client || !currentUser) return;

    try {
      // Validate the mandatory same stage condition before accepting
      const myStage = getStageOfGrade(currentUser.grade_id);
      const senderStage = getStageOfGrade(senderUser.grade_id);

      if (myStage !== senderStage) {
        alert(currentLang === "ar"
          ? `⚠️ غير مسموح بالقبول! لا يمكنك إقامة صداقة مع طالب من مرحلة دراسية مختلفة لضمان سلامة وجودة العملية التعليمية بالمنصة.`
          : `⚠️ Restriction! You can only accept requests from peers within the same stage.`
        );
        return;
      }

      const { error } = await client
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) {
        console.error("Could not accept friendship:", error);
        return;
      }

      alert(t.acceptSuccess);
      fetchFriendshipsAndPeers();
      fetchMessagesDirect();
    } catch (e) {
      console.error("Accept friend error:", e);
    }
  };

  // 3. Decline / Ignore Friend Request
  const handleDeclineFriend = async (friendshipId: string) => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) {
        console.error("Could not delete/decline friendship:", error);
        return;
      }

      alert(t.declineSuccess);
      fetchFriendshipsAndPeers();
    } catch (e) {
      console.error("Decline friend error:", e);
    }
  };

  // Helper formatting for message timestamps
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

  // BLOCK VISITOR IF NOT LOGGED IN
  if (!currentUser) {
    return (
      <div 
        id="chat-visitor-blocked"
        className="max-w-3xl mx-auto p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-2xl text-center space-y-6 select-none"
      >
        <div className="w-20 h-20 bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-10 h-10 animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-black font-sans text-slate-100">
            {currentLang === "ar" ? "يرجى تسجيل الدخول أولاً لتتمكن من استخدام الدردشة 🔐" : "Please login first to use the Chat 🔐"}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {t.notLoggedInDesc}
          </p>
        </div>

        <div className="pt-2">
          <button
            id="chat-trigger-login-btn"
            onClick={onTriggerAuth}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-slate-50 font-extrabold text-sm rounded-2xl cursor-pointer transition-all duration-350 shadow-md shadow-emerald-900/20 active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Users className="w-4 h-4" />
            <span>{t.loginBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate my active educational stage
  const myStageId = getStageOfGrade(currentUser.grade_id);

  // Parse direct list of relationships of current user
  const pendingIncoming = friendships.filter(f => f.receiver_id === currentUser.id && f.status === "pending");
  const pendingOutgoing = friendships.filter(f => f.sender_id === currentUser.id && f.status === "pending");
  const activeFriendIds = new Set<string>();

  friendships.forEach(f => {
    if (f.status === "accepted") {
      activeFriendIds.add(f.sender_id === currentUser.id ? f.receiver_id : f.sender_id);
    }
  });

  // Calculate matching users
  const renderedUsers = allUsers.filter(user => {
    if (userSearchText.trim() === "") return true;
    const nameMatch = user.username.toLowerCase().includes(userSearchText.toLowerCase());
    const gradeMatch = user.grade_name && user.grade_name.toLowerCase().includes(userSearchText.toLowerCase());
    return nameMatch || gradeMatch;
  });

  return (
    <div 
      id="friends-chat-dashboard"
      className="max-w-5xl mx-auto border border-slate-800/60 rounded-3xl bg-slate-950 shadow-2xl overflow-hidden min-h-[580px]"
    >
      {/* Dynamic Hub Banner Header */}
      <span className="h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-700 block" />
      <header className="p-4 sm:p-5 border-b border-secondary bg-slate-900/80 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/15 border border-indigo-800/35 text-indigo-400 rounded-2xl shadow-inner">
            <MessageSquare className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-1 text-center md:text-right">
            <h3 className="font-extrabold text-slate-100 text-sm sm:text-base font-sans leading-tight">
              {t.chatTitle}
            </h3>
            <p className="text-4xs sm:text-3xs text-slate-400 font-medium">
              {t.subTitle}
            </p>
          </div>
        </div>

        {/* Current logged student's active stage details badge info */}
        <div className="text-center md:text-left bg-indigo-950/20 px-3.5 py-1.5 rounded-2xl border border-indigo-900/40 select-none">
          <span className="text-4xs text-slate-400 block font-bold">
            {t.yourStageMsg}
          </span>
          <span className="text-3xs font-black text-indigo-400 block">
            🎓 {getStageLabel(myStageId)} ({currentUser.grade_name || "عام"})
          </span>
        </div>
      </header>

      {/* Segmented Controls Interface Tabs */}
      <div className="flex justify-between items-center bg-slate-900/40 border-b border-slate-800/60 p-2 text-xs font-bold gap-2">
        <div className="grid grid-cols-3 gap-2 w-full md:max-w-md">
          <button
            onClick={() => setActiveCategoryTab("chat")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all ${
              activeCategoryTab === "chat"
                ? "bg-indigo-650 text-slate-50 shadow-md font-black"
                : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            {t.tabChat} ({activeFriendIds.size})
          </button>
          <button
            onClick={() => setActiveCategoryTab("directory")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all ${
              activeCategoryTab === "directory"
                ? "bg-indigo-650 text-slate-50 shadow-md font-black"
                : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            {t.tabDirectory}
          </button>
          <button
            onClick={() => setActiveCategoryTab("requests")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all relative ${
              activeCategoryTab === "requests"
                ? "bg-indigo-650 text-slate-50 shadow-md font-black"
                : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            <span>{t.tabRequests}</span>
            {pendingIncoming.length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-600 border border-slate-950 text-slate-100 px-1.5 py-0.5 rounded-full text-4xs min-w-[18px] text-center font-bold animate-bounce">
                {pendingIncoming.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic status presence helper line */}
        <div className="hidden md:flex items-center gap-2 pr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse animate-duration-2000" />
          <span className="text-4xs font-bold text-slate-400">
            {activeFriendIds.size + 1} {currentLang === "ar" ? "أصدقاء متصلين بالمنطقة" : "friends online"}
          </span>
        </div>
      </div>

      {/* Safety Policy Tip Banner */}
      <div className="bg-slate-900/20 p-3 px-4 text-slate-400 border-b border-slate-800/40 select-none flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-4xs font-black text-indigo-400 block">
            🔒 {t.stageRestricted}
          </span>
          <span className="text-5xs text-slate-400 block leading-normal">
            {t.stageRestrictedDesc}
          </span>
        </div>
      </div>

      {/* MAIN VIEW AREA BY ACTIVE TAB */}
      <div className="flex-1 select-none min-h-[420px] bg-slate-950 relative">

        {/* TAB 1: SECURE FRIENDS CHAT ROOM */}
        {activeCategoryTab === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[420px]">
            {/* Left sidebar listing of current friends inside chat tab */}
            <div className="hidden md:block col-span-1 border-l border-slate-900 bg-slate-900/20 p-4 space-y-4">
              <h4 className="text-3xs font-black text-indigo-400 uppercase tracking-wider">
                {currentLang === "ar" ? "أصدقاؤك المقبولين 🟢" : "My Friends 🟢"}
              </h4>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {allUsers.filter(u => activeFriendIds.has(u.id)).length === 0 ? (
                  <p className="text-5xs text-slate-500 italic">
                    {currentLang === "ar" ? "لا يوجد أصدقاء بعد. تصفح دليل الطلاب وأرسل لهم طلبات صداقة!" : "No friends added. Use Finder to add peers!"}
                  </p>
                ) : (
                  allUsers.filter(u => activeFriendIds.has(u.id)).map(friend => (
                    <div 
                      key={friend.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-3xs font-bold text-slate-305"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-950/40 text-indigo-400 flex items-center justify-center font-black">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-205 truncate">{friend.username}</span>
                        <span className="block text-5xs text-slate-500 font-medium">{friend.grade_name || "عام"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Middle chat thread messages screen */}
            <div className="col-span-1 md:col-span-3 flex flex-col min-h-[420px] relative">
              {censorshipWarning && (
                <div 
                  id="chat-censor-banner"
                  className="bg-amber-950/40 border-b border-amber-800/35 p-3 px-4 flex items-start gap-3 absolute top-0 left-0 right-0 z-10 animated-fade-in"
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

              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 sm:p-5 space-y-4 max-h-[380px] overflow-y-auto overflow-x-hidden pt-14 min-h-[320px] bg-sky-950/5 relative scrollbar-thin scrollbar-thumb-slate-800 scroll-smooth"
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-8 h-8 opacity-60 animate-pulse text-indigo-400" />
                    </div>
                    <p className="text-3xs text-slate-400 font-bold max-w-sm leading-relaxed text-slate-305">
                      {t.noMessagesYet}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMsg = msg.userId === currentUser.id;
                    const isMsgAdmin = msg.userRole === "admin";
                    const isMsgTeacher = msg.userRole === "teacher";

                    return (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${
                          isMyMsg ? "mr-auto flex-row-reverse text-left" : "ml-auto"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center text-xs font-bold relative ${
                          isMyMsg 
                            ? "bg-indigo-900/20 text-indigo-350 border-indigo-800" 
                            : isMsgAdmin 
                            ? "bg-red-955/20 text-red-400 border-red-900/40"
                            : isMsgTeacher
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
                            : "bg-slate-900 text-slate-300 border-slate-800"
                        }`}
                        title={msg.username}
                        >
                          {isMsgAdmin ? "🔑" : isMsgTeacher ? "👨‍🏫" : msg.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className={`flex items-center gap-1.5 text-4xs ${
                            isMyMsg ? "flex-row-reverse" : ""
                          }`}>
                            <span className="font-extrabold text-slate-200">
                              {msg.username}
                            </span>

                            {isMsgAdmin ? (
                              <span className="px-1.5 py-0.5 rounded-full text-5xs font-bold bg-gradient-to-r from-red-950/40 to-slate-900 text-red-400 border border-red-900/30">
                                {t.adminBadge}
                              </span>
                            ) : isMsgTeacher ? (
                              <span className="px-1.5 py-0.5 rounded-full text-5xs font-bold bg-gradient-to-r from-emerald-950/40 to-slate-900 text-emerald-400 border border-emerald-900/30">
                                {t.teacherBadge}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-5xs font-bold bg-slate-900 text-slate-400 border border-slate-800">
                                {t.studentBadge} {msg.gradeName ? `(${msg.gradeName})` : ""}
                              </span>
                            )}

                            <span className="text-slate-500 font-mono text-5xs">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>

                          <div className={`p-3.5 rounded-2xl break-words text-xs leading-relaxed font-semibold select-text ${
                            isMyMsg 
                              ? "bg-gradient-to-br from-indigo-900/25 to-slate-900 text-indigo-100 rounded-tl-none border border-indigo-900/50" 
                              : isMsgAdmin 
                              ? "bg-slate-900 border border-red-900/40 text-rose-105 rounded-tr-none"
                              : isMsgTeacher
                              ? "bg-slate-900 border border-emerald-950 text-emerald-100 rounded-tr-none"
                              : "bg-slate-900/60 border border-slate-800 text-slate-100 rounded-tr-none"
                          }`}>
                            {msg.text}
                          </div>

                          {isAdminLoggedIn && (
                            <div className={`flex ${isMyMsg ? "justify-start" : "justify-end"}`}>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="inline-flex items-center gap-1 mt-0.5 text-5xs text-rose-500 hover:text-rose-400 cursor-pointer font-bold bg-rose-950/10 hover:bg-rose-950/30 px-2 py-0.5 rounded"
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

              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom("smooth")}
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-full duration-200 shadow-xl cursor-pointer hover:bg-slate-800 z-20 flex items-center justify-center animate-bounce animate-duration-3000"
                >
                  <ArrowDown className="w-4 h-4 text-indigo-400" />
                </button>
              )}

              {/* Secure Chat Box Composer Form */}
              <footer className="p-4 border-t border-slate-900 bg-slate-900/40">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    maxLength={250}
                    className="flex-1 bg-slate-950 border border-slate-805 focus:border-indigo-600 p-3 px-4 rounded-xl text-xs text-slate-100 placeholder:text-slate-505 transition-all focus:outline-none"
                    placeholder={t.placeholder}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      inputText.trim() && !isSending
                        ? "bg-indigo-600 hover:bg-indigo-500 text-slate-50 cursor-pointer shadow"
                        : "bg-slate-900 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <SendHorizontal className="w-4.5 h-4.5" />
                  </button>
                </form>
              </footer>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED STUDENTS DIRECTORY (FINDER) */}
        {activeCategoryTab === "directory" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Search Input Filter Panel */}
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-900/55 border border-slate-800 focus:border-indigo-605 p-3 pr-10 rounded-2xl text-xs text-slate-100 outline-none transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Students List Grid */}
            {isRelationsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 hover:scale-100 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-850 h-20 animate-pulse" />
                ))}
              </div>
            ) : renderedUsers.length === 0 ? (
              <div className="text-center p-12 text-slate-505 italic text-sm">
                {t.noUsers}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderedUsers.map(peer => {
                  const peerStage = getStageOfGrade(peer.grade_id);
                  const isSameStage = peerStage === myStageId;
                  
                  // Friendship Status computation
                  const isFriend = activeFriendIds.has(peer.id);
                  const sentPending = pendingOutgoing.some(f => f.receiver_id === peer.id);
                  const receivedPending = pendingIncoming.some(f => f.sender_id === peer.id);

                  return (
                    <div 
                      key={peer.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                        isSameStage 
                          ? "bg-slate-900/50 border-slate-850 hover:border-indigo-650/50 hover:bg-slate-900" 
                          : "bg-slate-925/25 border-slate-900/70 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center font-bold text-xs ${
                          isSameStage ? "bg-indigo-950/30 text-indigo-400 border-indigo-900/30" : "bg-slate-900 text-slate-500 border-slate-850"
                        }`}>
                          {peer.user_role === "teacher" ? "👨‍🏫" : peer.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="space-y-1 flex-1 min-w-0 text-right">
                          <h4 className="font-bold text-slate-100 text-xs truncate">
                            {peer.username}
                          </h4>
                          <span className="block text-5xs font-semibold text-slate-400">
                            {peer.grade_name || "صف دراسي غير محدد"} ( {getStageLabel(peerStage)} )
                          </span>

                          <div className="pt-2">
                            {/* Actions / Status pills */}
                            {isFriend ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-5xs font-bold text-emerald-400">
                                <UserCheck className="w-3 h-3 text-emerald-400" />
                                <span>{t.friendsNow}</span>
                              </span>
                            ) : sentPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/20 border border-amber-900/40 rounded-xl text-5xs font-bold text-amber-405">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>{t.pendingRequest}</span>
                              </span>
                            ) : receivedPending ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const friendObj = pendingIncoming.find(f => f.sender_id === peer.id);
                                    if (friendObj) handleAcceptFriend(friendObj.id, peer);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-5xs font-extrabold rounded-lg cursor-pointer flex items-center gap-1 select-none active:scale-95"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                  <span>{t.acceptBtn}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const friendObj = pendingIncoming.find(f => f.sender_id === peer.id);
                                    if (friendObj) handleDeclineFriend(friendObj.id);
                                  }}
                                  className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/35 text-5xs font-black rounded-lg cursor-pointer flex items-center gap-1 select-none active:scale-95"
                                >
                                  <X className="w-3 h-3" />
                                  <span>{t.declineBtn}</span>
                                </button>
                              </div>
                            ) : isSameStage ? (
                              <button
                                onClick={() => handleAddFriend(peer)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-50 text-5xs font-extrabold rounded-xl cursor-pointer inline-flex items-center gap-1 select-none active:scale-95 duration-200"
                              >
                                <UserPlus className="w-3 h-3 text-white" />
                                <span>{t.addFriend}</span>
                              </button>
                            ) : (
                              <span className="inline-flex py-1 text-5xs font-bold text-rose-500 bg-rose-950/10 px-2 rounded-lg leading-none select-none">
                                {t.differentStage}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FRIEND REQUESTS TAB (INCOMING & OUTGOING SUB-DIVISIONS) */}
        {activeCategoryTab === "requests" && (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {/* Left Column: Pending Incoming Requests */}
            <div className="space-y-3">
              <h4 className="text-3xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" />
                <span>{t.incomingTitle} ({pendingIncoming.length})</span>
              </h4>

              {pendingIncoming.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-900 rounded-2xl text-slate-505 text-4xs italic">
                  {t.noRequests}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingIncoming.map(req => {
                    const sender = allUsers.find(u => u.id === req.sender_id);
                    if (!sender) return null;

                    return (
                      <div 
                        key={req.id}
                        className="p-3 bg-slate-900/80 border border-slate-805 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-right">
                          <div className="w-8 h-8 rounded-lg bg-indigo-950/40 text-indigo-405 flex items-center justify-center font-bold">
                            {sender.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate min-w-0">
                            <span className="block text-slate-100 font-extrabold truncate text-xs">{sender.username}</span>
                            <span className="block text-5xs text-slate-400 font-medium">{sender.grade_name || "صف دراسي"}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAcceptFriend(req.id, sender)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-5xs font-extrabold rounded-lg cursor-pointer flex items-center gap-1 active:scale-95 duration-200"
                          >
                            <Check className="w-3 h-3 text-white" />
                            <span>{t.acceptBtn}</span>
                          </button>
                          <button
                            onClick={() => handleDeclineFriend(req.id)}
                            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-rose-450 text-5xs font-extrabold rounded-lg cursor-pointer flex items-center gap-1 active:scale-95 duration-200"
                          >
                            <X className="w-3 h-3 text-rose-500" />
                            <span>{t.declineBtn}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Active Pending Outgoing Requests */}
            <div className="space-y-3 border-t md:border-t-0 md:border-r border-slate-900 pt-5 md:pt-0 md:pr-6">
              <h4 className="text-3xs font-black text-slate-400 uppercase tracking-widest">
                {t.outgoingTitle} ({pendingOutgoing.length})
              </h4>

              {pendingOutgoing.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-900 rounded-2xl text-slate-505 text-4xs italic">
                  {t.noRequests}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingOutgoing.map(req => {
                    const receiver = allUsers.find(u => u.id === req.receiver_id);
                    if (!receiver) return null;

                    return (
                      <div 
                        key={req.id}
                        className="p-3 bg-slate-900/45 border border-slate-900/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-right">
                          <div className="w-8 h-8 rounded-lg bg-slate-950/50 text-slate-400 flex items-center justify-center font-bold">
                            {receiver.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate min-w-0">
                            <span className="block text-slate-205 font-extrabold truncate text-xs">{receiver.username}</span>
                            <span className="block text-5xs text-slate-500 font-medium">{receiver.grade_name || "صف دراسي"}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeclineFriend(req.id)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-804 text-slate-400 text-5xs font-extrabold rounded-lg cursor-pointer select-none"
                          title={currentLang === "ar" ? "إلغاء الطلب المرسل" : "Cancel request"}
                        >
                          {currentLang === "ar" ? "إلغاء الطلب ❌" : "Cancel ❌"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Inline bad words lists dictionary
const badarabic = [
  "يا كلب", "ياكلب", "ابن الكلب", "بنت الكلب", "يا حمار", "ياحمار", "كلب", "حمار", "غبي", "حيوان", "خرة", "زق", "قذر", "قذرة",
  "سافل", "سافلة", "وسخ", "وسخة", "متخلف", "منحط", "يا جزمة", "ياجزمة", "سرسر", "شرير", "حقير", "حقيرة", "تفه",
  "كس", "طيز", "شرموط", "ديوث", "عرص", "عاهر", "قحبة", "منيوك", "نكاح", "شرموطة", "قحبة", "عاهرة", "منيوكة", "لوطي"
];
const badenglish = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "slut", "whore"
];

function censorBadWords(text: string): string {
  let censored = text;
  
  for (const word of badarabic) {
    const regex = new RegExp(word, 'gi');
    censored = censored.replace(regex, (match) => "*".repeat(match.length));
  }

  for (const word of badenglish) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, (match) => "*".repeat(match.length));
  }

  return censored;
}
