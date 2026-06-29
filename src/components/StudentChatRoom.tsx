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

const getAvatarGradient = (username: string) => {
  const gradients = [
    "from-pink-500 to-rose-500 text-white shadow-rose-500/20",
    "from-purple-500 to-indigo-500 text-white shadow-indigo-500/20",
    "from-blue-500 to-cyan-500 text-white shadow-cyan-500/20",
    "from-emerald-500 to-teal-500 text-white shadow-teal-500/20",
    "from-amber-500 to-orange-500 text-white shadow-orange-500/20",
    "from-violet-500 to-fuchsia-500 text-white shadow-fuchsia-500/20",
    "from-red-500 to-orange-500 text-white shadow-red-500/20",
    "from-sky-500 to-indigo-500 text-white shadow-sky-500/20"
  ];
  
  let hash = 0;
  const name = username || "Student";
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

interface UserAvatarProps {
  username: string;
  role: string;
  size?: "sm" | "md" | "lg" | "xl";
  siteTheme?: string;
  showStatus?: boolean;
  statusColor?: string;
  style?: React.CSSProperties;
}

export function UserAvatar({ username, role, size = "md", siteTheme = "sudanese", showStatus = false, statusColor = "bg-emerald-500", style }: UserAvatarProps) {
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  
  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl"
  };
  
  const roleBadge = () => {
    if (isAdmin) return "👑";
    if (isTeacher) return "👨‍🏫";
    return null;
  };

  const initial = username ? username.trim().charAt(0).toUpperCase() : "🎓";
  const gradient = getAvatarGradient(username);
  
  return (
    <div className="relative shrink-0 select-none" style={style}>
      <div 
        className={`rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-black shadow-sm border border-white/80 transition-all duration-300 hover:scale-105 active:scale-95 ${sizeClasses[size]}`}
      >
        {roleBadge() || initial}
      </div>
      {showStatus && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5 animate-pulse ${statusColor}`} />
      )}
    </div>
  );
}

interface StudentChatRoomProps {
  currentUser: AppUser | null;
  currentLang: "ar" | "en";
  isAdminLoggedIn: boolean;
  onTriggerAuth: () => void;
  onClose?: () => void;
  siteTheme?: "sudanese" | "legacy";
}

export default function StudentChatRoom({ 
  currentUser, 
  currentLang, 
  isAdminLoggedIn, 
  onTriggerAuth,
  onClose,
  siteTheme: passedSiteTheme
}: StudentChatRoomProps) {
  const siteTheme = passedSiteTheme || (localStorage.getItem("sudan_site_theme") as "sudanese" | "legacy") || "sudanese";
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

  const [activeChatWith, setActiveChatWith] = useState<AppUser | null>(null);
  const [selectedPeerDetails, setSelectedPeerDetails] = useState<AppUser | null>(null);

  const handleOpenUserDetails = (msg: ChatMessage) => {
    const foundPeer = allUsers.find(u => String(u.id) === String(msg.userId));
    if (foundPeer) {
      setSelectedPeerDetails(foundPeer);
    } else {
      setSelectedPeerDetails({
        id: msg.userId,
        username: msg.username,
        email: "",
        provider: "email",
        user_role: msg.userRole,
        grade_name: msg.gradeName || undefined,
      } as AppUser);
    }
  };

  const cleanMessageText = (text: string): string => {
    if (text.startsWith("[DM:")) {
      return text.replace(/^\[DM:[^\]]+\]/, "");
    }
    return text;
  };

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

    // Setup local mock users directory fallback
    const mockGrId = currentUser.grade_id || "g1";
    const demoPeers = [
      { id: 1001, username: "أحمد السوداني", email: "ahmed@sudan.edu", user_role: "student", grade_id: mockGrId },
      { id: 1002, username: "سارة الفاتح", email: "sara@sudan.edu", user_role: "student", grade_id: mockGrId },
      { id: 1003, username: "عمر الفاروق", email: "omar@sudan.edu", user_role: "student", grade_id: mockGrId },
      { id: 1004, username: "آية عبد المجيد", email: "aya@sudan.edu", user_role: "student", grade_id: mockGrId }
    ];

    let localFriendships = [];
    try {
      const stored = localStorage.getItem("sudan_edu_local_friendships");
      localFriendships = stored ? JSON.parse(stored) : [];
    } catch {
      localFriendships = [];
    }

    if (!client) {
      setFriendships(localFriendships);
      setAllUsers(demoPeers);
      return;
    }

    try {
      setIsRelationsLoading(true);

      // 1. Fetch all friendships where current user is sender or receiver
      const { data: friendshipsData, error: relationError } = await client
        .from("friendships")
        .select("*")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (!relationError && friendshipsData) {
        setFriendships(friendshipsData as Friendship[]);
        localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(friendshipsData));
      } else {
        setFriendships(localFriendships);
      }

      // 2. Fetch all registered users to construct the students directory
      const { data: usersData, error: usersError } = await client
        .from("users")
        .select("*")
        .limit(200);

      if (!usersError && usersData) {
        const filteredPeers = (usersData as AppUser[]).filter(u => u.id !== currentUser.id);
        setAllUsers(filteredPeers.length > 0 ? filteredPeers : demoPeers);
      } else {
        setAllUsers(demoPeers);
      }
    } catch (e) {
      console.warn("Error fetching friendship states, using local fallbacks:", e);
      setFriendships(localFriendships);
      setAllUsers(demoPeers);
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
          approvedFriendIds.add(String(rel.sender_id) === String(currentUser.id) ? rel.receiver_id : rel.sender_id);
        }
      });

      // Also include ourselves and admin postings
      approvedFriendIds.add(String(currentUser.id));

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
          .filter((m: any) => approvedFriendIds.has(String(m.user_id)) || m.user_role === "admin")
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

  // Robust real-time subscription & safe polling sync fallback
  useEffect(() => {
    if (!currentUser) return;
    const client = getSupabaseClient();
    if (!client) return;

    // 1. Supabase Secure Realtime Channel Subscription
    const channel = client
      .channel("chat-room-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const newMsg = payload.new;
          if (!newMsg) return;

          try {
            // Retrieve latest friendships on-the-fly to filter realtime inserts
            const { data: relations } = await client
              .from("friendships")
              .select("*")
              .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

            const approvedFriendIds = new Set<string>();
            approvedFriendIds.add(String(currentUser.id));

            if (relations) {
              relations.forEach((rel: any) => {
                if (rel.status === "accepted") {
                  approvedFriendIds.add(String(rel.sender_id) === String(currentUser.id) ? rel.receiver_id : rel.sender_id);
                }
              });
            }

            // Strictly filter realtime message inserts
            if (approvedFriendIds.has(String(newMsg.user_id)) || newMsg.user_role === "admin") {
              const formatted: ChatMessage = {
                id: newMsg.id,
                userId: newMsg.user_id,
                username: newMsg.username,
                userRole: newMsg.user_role || "student",
                gradeName: newMsg.grade_name || null,
                text: newMsg.text,
                timestamp: newMsg.timestamp
              };

              setMessages(prev => {
                if (prev.some(m => m.id === formatted.id)) return prev;
                return [...prev, formatted];
              });

              // Smoothly scroll down
              setTimeout(() => {
                if (chatContainerRef.current) {
                  const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                  if (scrollHeight - scrollTop - clientHeight < 150) {
                    scrollToBottom("smooth");
                  }
                }
              }, 120);
            }
          } catch (err) {
            console.warn("Realtime insert processing fallback error:", err);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const oldMsg = payload.old;
          if (oldMsg && oldMsg.id) {
            setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          fetchFriendshipsAndPeers();
        }
      )
      .subscribe();

    // 2. High-reliability Polling Fallback (syncs everything perfectly)
    const syncInterval = setInterval(() => {
      fetchMessagesDirect(true);
      if (Math.random() > 0.75) {
        fetchFriendshipsAndPeers();
      }
    }, 3800);

    return () => {
      client.removeChannel(channel);
      clearInterval(syncInterval);
    };
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

      // Prepend DM metadata if a private chat with a friend is selected
      const finalPayloadText = activeChatWith 
        ? `[DM:${activeChatWith.id}]${filteredText}`
        : filteredText;

      const client = getSupabaseClient();
      if (!client) return;

      const payload = {
        id: newId,
        user_id: currentUser.id,
        username: currentUser.username,
        user_role: currentUser.user_role || "student",
        grade_name: currentUser.grade_name || null,
        text: finalPayloadText,
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
        text: finalPayloadText,
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
    if (!currentUser) return;

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

      // Always save to localStorage immediately for instant local UI updates and offline use!
      let localFriendships = [];
      try {
        const stored = localStorage.getItem("sudan_edu_local_friendships");
        localFriendships = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn(e);
      }
      localFriendships.push(payload);
      localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(localFriendships));

      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from("friendships").insert([payload]);
        if (error) {
          console.error("Could not insert friendship in Supabase:", error);
        }
      }

      alert(t.sentSuccess);
      fetchFriendshipsAndPeers();
      window.dispatchEvent(new Event("sudan_edu_notification_update"));
    } catch (e) {
      console.error("Add friend error:", e);
    }
  };

  // 1.5. Simulate receiving Friend Request
  const handleSimulateIncomingRequest = (senderPeer: AppUser) => {
    if (!currentUser) return;
    const friendshipId = `FRND-SIM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const payload = {
      id: friendshipId,
      sender_id: senderPeer.id,
      receiver_id: currentUser.id,
      status: "pending",
      senderName: senderPeer.username
    };

    let localFriendships = [];
    try {
      const stored = localStorage.getItem("sudan_edu_local_friendships");
      localFriendships = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn(e);
    }
    // Remove duplicate sims
    localFriendships = localFriendships.filter((f: any) => 
      !(String(f.sender_id) === String(senderPeer.id) && String(f.receiver_id) === String(currentUser.id))
    );
    localFriendships.push(payload);
    localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(localFriendships));

    const client = getSupabaseClient();
    if (client) {
      client.from("friendships").insert([payload]).then(({ error }) => {
        if (error) console.warn("Supabase simulate insert error:", error);
      });
    }

    alert(currentLang === "ar"
      ? `🔔 تم محاكاة استقبال طلب صداقة وارد من الزميل "${senderPeer.username}"! تفقد جرس الإشعارات في الأعلى الآن 🎈`
      : `🔔 Simulated an incoming friend request from "${senderPeer.username}"! Check the notification bell above 🎈`
    );

    fetchFriendshipsAndPeers();
    window.dispatchEvent(new Event("sudan_edu_notification_update"));
  };

  // 2. Accept Friend Request with Strict same-stage condition verification
  const handleAcceptFriend = async (friendshipId: string, senderUser: AppUser) => {
    if (!currentUser) return;

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

      // Update locally
      let localFriendships = [];
      try {
        const stored = localStorage.getItem("sudan_edu_local_friendships");
        localFriendships = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn(e);
      }
      localFriendships = localFriendships.map((f: any) => {
        if (f.id === friendshipId) {
          return { ...f, status: "accepted" };
        }
        return f;
      });
      localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(localFriendships));

      const client = getSupabaseClient();
      if (client) {
        const { error } = await client
          .from("friendships")
          .update({ status: "accepted" })
          .eq("id", friendshipId);

        if (error) {
          console.error("Could not accept friendship:", error);
        }
      }

      alert(t.acceptSuccess);
      fetchFriendshipsAndPeers();
      fetchMessagesDirect();
      window.dispatchEvent(new Event("sudan_edu_notification_update"));
    } catch (e) {
      console.error("Accept friend error:", e);
    }
  };

  // 3. Decline / Ignore Friend Request
  const handleDeclineFriend = async (friendshipId: string) => {
    // Update locally
    let localFriendships = [];
    try {
      const stored = localStorage.getItem("sudan_edu_local_friendships");
      localFriendships = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn(e);
    }
    localFriendships = localFriendships.filter((f: any) => f.id !== friendshipId);
    localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(localFriendships));

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from("friendships")
          .delete()
          .eq("id", friendshipId);

        if (error) {
          console.error("Could not delete/decline friendship:", error);
        }
      } catch (e) {
        console.warn("DB friendship delete error:", e);
      }
    }

    alert(t.declineSuccess);
    fetchFriendshipsAndPeers();
    window.dispatchEvent(new Event("sudan_edu_notification_update"));
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
        className={`max-w-3xl mx-auto p-12 rounded-3xl border shadow-2xl text-center space-y-6 select-none ${
          siteTheme === "sudanese"
            ? "bg-cream/95 border-mud/15 text-mud"
            : "bg-slate-900/40 border-slate-800/80 text-slate-100"
        }`}
      >
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg border ${
          siteTheme === "sudanese"
            ? "bg-[#FAF5EC] border-mud/10 text-mud"
            : "bg-emerald-955/20 border-emerald-800/30 text-emerald-400"
        }`}>
          <Lock className="w-10 h-10 animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <h2 className={`text-2xl font-black font-sans ${
             siteTheme === "sudanese" ? "text-[#5C2C16]" : "text-slate-100"
          }`}>
            {currentLang === "ar" ? "يرجى تسجيل الدخول أولاً لتتمكن من استخدام الدردشة 🔐" : "Please login first to use the Chat 🔐"}
          </h2>
          <p className={`text-xs max-w-md mx-auto leading-relaxed ${
             siteTheme === "sudanese" ? "text-mud/80" : "text-slate-400"
          }`}>
            {t.notLoggedInDesc}
          </p>
        </div>

        <div className="pt-2">
          <button
            id="chat-trigger-login-btn"
            onClick={onTriggerAuth}
            className={`px-8 py-4 font-extrabold text-sm rounded-2xl cursor-pointer transition-all duration-350 shadow-md active:scale-95 flex items-center gap-2 mx-auto ${
              siteTheme === "sudanese"
                ? "bg-earthgold hover:bg-earthgold/90 text-white shadow-sm"
                : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-slate-50 shadow-emerald-900/20"
            }`}
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
  const pendingIncoming = friendships.filter(f => String(f.receiver_id) === String(currentUser.id) && f.status === "pending");
  const pendingOutgoing = friendships.filter(f => String(f.sender_id) === String(currentUser.id) && f.status === "pending");
  const activeFriendIds = new Set<string>();

  friendships.forEach(f => {
    if (f.status === "accepted") {
      activeFriendIds.add(String(f.sender_id) === String(currentUser.id) ? f.receiver_id : f.sender_id);
    }
  });

  // Clean, verified list of current friends
  const friendsList = allUsers.filter(peer => {
    if (String(peer.id) === String(currentUser?.id)) return false;
    return activeFriendIds.has(String(peer.id));
  });

  // Filter messages to show either General Chat or Private Chat with a specified friend
  const displayedMessages = messages.filter(msg => {
    const isDM = msg.text.startsWith("[DM:");
    if (activeChatWith) {
      if (!isDM) return false;
      const dmMatch = msg.text.match(/^\[DM:([^\]]+)\]/);
      if (!dmMatch) return false;
      const recipientId = dmMatch[1];
      
      const isSentByMeToFriend = (String(msg.userId) === String(currentUser?.id)) && (String(recipientId) === String(activeChatWith.id));
      const isSentByFriendToMe = (String(msg.userId) === String(activeChatWith.id)) && (String(recipientId) === String(currentUser?.id));
      
      return isSentByMeToFriend || isSentByFriendToMe;
    } else {
      return !isDM;
    }
  });

  // Calculate matching users
  const renderedUsers = allUsers.filter(user => {
    if (userSearchText.trim() === "") return true;
    const nameMatch = user.username.toLowerCase().includes(userSearchText.toLowerCase());
    const gradeMatch = user.grade_name && user.grade_name.toLowerCase().includes(userSearchText.toLowerCase());
    return nameMatch || gradeMatch;
  }).sort((a, b) => {
    const aStage = getStageOfGrade(a.grade_id);
    const bStage = getStageOfGrade(b.grade_id);
    const aSame = aStage === myStageId;
    const bSame = bStage === myStageId;
    
    const aIsFriend = activeFriendIds.has(String(a.id));
    const bIsFriend = activeFriendIds.has(String(b.id));
    
    // 1. Same educational stage first
    if (aSame && !bSame) return -1;
    if (!aSame && bSame) return 1;

    // 2. Friends first
    if (aIsFriend && !bIsFriend) return -1;
    if (!aIsFriend && bIsFriend) return 1;
    
    // 3. Teachers first
    if (a.user_role === "teacher" && b.user_role !== "teacher") return -1;
    if (a.user_role !== "teacher" && b.user_role === "teacher") return 1;
    
    // 4. Alphabetically by username
    return a.username.localeCompare(b.username, "ar");
  });

  return (
    <div 
      id="friends-chat-dashboard"
      className={`max-w-5xl mx-auto border rounded-3xl overflow-hidden min-h-[580px] ${
        siteTheme === "sudanese"
          ? "bg-cream border-mud/15 text-mud shadow-xl"
          : "bg-slate-950 border-slate-800/60 shadow-2xl"
      }`}
    >
      {/* Dynamic Hub Banner Header */}
      <span className={`h-1 block ${
        siteTheme === "sudanese"
          ? "bg-gradient-to-r from-mud via-earthgold to-mud"
          : "bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-700"
      }`} />
      <header className={`p-4 sm:p-5 border-b flex flex-col md:flex-row items-center justify-between gap-4 select-none relative ${
        siteTheme === "sudanese"
          ? "bg-[#FAF5EC] border-mud/10 text-mud"
          : "bg-slate-900/80 border-snug text-slate-100"
      }`}>
        {onClose && (
          <button 
            onClick={onClose}
            className={`absolute top-3.5 end-3.5 p-1.5 rounded-full border cursor-pointer transition-all z-20 ${
              siteTheme === "sudanese"
                ? "bg-cream border-mud/15 hover:border-red-500/40 hover:bg-[#FAF5EC] text-mud/75 hover:text-red-650"
                : "bg-slate-950/80 border-slate-800 hover:border-red-500/40 hover:bg-slate-900 text-slate-400 hover:text-red-400"
            }`}
            title={currentLang === "ar" ? "إغلاق الدردشة" : "Close Chat"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl shadow-inner border ${
            siteTheme === "sudanese"
              ? "bg-earthgold/10 border-earthgold/30 text-mud"
              : "bg-indigo-600/15 border-indigo-800/35 text-indigo-400"
          }`}>
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 text-center md:text-right">
            <h3 className={`font-extrabold text-sm sm:text-base font-sans leading-tight ${
              siteTheme === "sudanese" ? "text-mud font-black" : "text-slate-100"
            }`}>
              {t.chatTitle}
            </h3>
            <p className={`text-4xs sm:text-3xs font-medium ${
              siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
            }`}>
              {t.subTitle}
            </p>
          </div>
        </div>

        {/* Current logged student's active stage details badge info */}
        <div className={`text-center md:text-left px-3.5 py-1.5 rounded-2xl border select-none ${
          siteTheme === "sudanese"
            ? "bg-earthgold/10 border-earthgold/30 text-mud"
            : "bg-indigo-950/20 border-indigo-900/40 text-slate-400"
        }`}>
          <span className={`text-4xs block font-bold ${
            siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
          }`}>
            {t.yourStageMsg}
          </span>
          <span className={`text-3xs font-black block ${
            siteTheme === "sudanese" ? "text-mud" : "text-indigo-400"
          }`}>
            🎓 {getStageLabel(myStageId)} ({currentUser.grade_name || "عام"})
          </span>
        </div>
      </header>

      {/* Segmented Controls Interface Tabs */}
      <div className={`flex justify-between items-center border-b p-2 text-xs font-bold gap-2 ${
        siteTheme === "sudanese"
          ? "bg-[#FAF5EC] border-mud/10"
          : "bg-slate-900/40 border-slate-800/60"
      }`}>
        <div className="grid grid-cols-3 gap-2 w-full md:max-w-md">
          <button
            onClick={() => setActiveCategoryTab("chat")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all ${
              activeCategoryTab === "chat"
                ? siteTheme === "sudanese"
                  ? "bg-mud text-cream shadow-md font-black"
                  : "bg-indigo-650 text-slate-50 shadow-md font-black"
                : siteTheme === "sudanese"
                  ? "text-mud/60 hover:text-mud bg-mud/5 hover:bg-mud/10"
                  : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            {t.tabChat} ({activeFriendIds.size})
          </button>
          <button
            onClick={() => setActiveCategoryTab("directory")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all ${
              activeCategoryTab === "directory"
                ? siteTheme === "sudanese"
                  ? "bg-mud text-cream shadow-md font-black"
                  : "bg-indigo-650 text-slate-50 shadow-md font-black"
                : siteTheme === "sudanese"
                  ? "text-mud/60 hover:text-mud bg-mud/5 hover:bg-mud/10"
                  : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            {t.tabDirectory}
          </button>
          <button
            onClick={() => setActiveCategoryTab("requests")}
            className={`p-2.5 rounded-xl cursor-pointer text-center duration-300 transition-all relative ${
              activeCategoryTab === "requests"
                ? siteTheme === "sudanese"
                  ? "bg-mud text-cream shadow-md font-black"
                  : "bg-indigo-650 text-slate-50 shadow-md font-black"
                : siteTheme === "sudanese"
                  ? "text-mud/60 hover:text-mud bg-mud/5 hover:bg-mud/10"
                  : "text-slate-400 hover:text-slate-100 bg-slate-900/30"
            }`}
          >
            <span>{t.tabRequests}</span>
            {pendingIncoming.length > 0 && (
              <span className={`absolute -top-1.5 -left-1.5 border px-1.5 py-0.5 rounded-full text-4xs min-w-[18px] text-center font-bold animate-bounce ${
                siteTheme === "sudanese"
                  ? "bg-earthgold text-mud border-mud/20"
                  : "bg-[#4F46E5] text-slate-50 border-indigo-500"
              }`}>
                {pendingIncoming.length}
              </span>
            )}
          </button>
        </div>
      </div>
        {activeCategoryTab === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[420px]">
            {/* Left sidebar listing of current friends inside chat tab */}
            <div className={`hidden md:block col-span-1 border-l p-4 space-y-5 ${
              siteTheme === "sudanese"
                ? "border-mud/10 bg-cream/30"
                : "border-slate-900 bg-slate-900/20"
            }`}>
              <div className="space-y-3">
                <h4 className={`text-3xs font-black uppercase tracking-wider ${
                  siteTheme === "sudanese" ? "text-mud/80" : "text-indigo-400"
                }`}>
                  {currentLang === "ar" ? "أصدقاؤك المقبولين 🟢" : "My Friends 🟢"}
                </h4>
                <div className="space-y-2 max-h-[190px] overflow-y-auto">
                  {allUsers.filter(u => activeFriendIds.has(String(u.id)) || activeFriendIds.has(u.id)).length === 0 ? (
                    <p className={`text-5xs italic leading-relaxed ${
                      siteTheme === "sudanese" ? "text-mud/50" : "text-slate-500"
                    }`}>
                      {currentLang === "ar" ? "لا يوجد أصدقاء بعد. تصفح دليل الطلاب وأرسل لهم طلبات صداقة!" : "No friends added. Use Finder to add peers!"}
                    </p>
                  ) : (
                    allUsers.filter(u => activeFriendIds.has(String(u.id)) || activeFriendIds.has(u.id))
                      .sort((a, b) => a.username.localeCompare(b.username, "ar"))
                      .map((friend, idx) => (
                      <div 
                        key={friend.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 text-3xs font-bold group relative ${
                          siteTheme === "sudanese"
                            ? "bg-cream border-mud/10 text-mud"
                            : "bg-slate-900/60 border border-slate-800 text-slate-350"
                        }`}
                        style={idx === 0 ? { height: "95.264px" } : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar username={friend.username} role={friend.user_role || "student"} size="sm" siteTheme={siteTheme} showStatus={true} />
                          <div className="min-w-0 text-right">
                            <span className={`block truncate text-4xs ${
                              siteTheme === "sudanese" ? "text-mud font-black" : "text-slate-205"
                            }`}>{friend.username}</span>
                            <span className={`block text-5xs font-medium ${
                              siteTheme === "sudanese" ? "text-mud/60" : "text-slate-500"
                            }`}>{friend.grade_name || "عام"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const friendRel = friendships.find(f => 
                              f.status === "accepted" && (
                                (String(f.sender_id) === String(currentUser.id) && String(f.receiver_id) === String(friend.id)) ||
                                (String(f.sender_id) === String(friend.id) && String(f.receiver_id) === String(currentUser.id))
                              )
                            );
                            if (friendRel) {
                              if (window.confirm(currentLang === "ar" ? `هل أنت متأكد من إلغاء الصداقة مع ${friend.username}؟` : `Are you sure you want to unfriend ${friend.username}?`)) {
                                handleDeclineFriend(friendRel.id);
                              }
                            }
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 ${
                            siteTheme === "sudanese"
                              ? "hover:bg-mud/10 text-mud/60 hover:text-red-650"
                              : "hover:bg-rose-950/40 text-slate-500 hover:text-rose-400"
                          }`}
                          title={currentLang === "ar" ? "إلغاء الصداقة" : "Unfriend"}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Incoming Friend Requests Side Panel with direct Accept/Decline Actions */}
              {pendingIncoming.length > 0 && (
                <div className={`space-y-3 pt-3 border-t ${
                  siteTheme === "sudanese" ? "border-mud/10" : "border-slate-900/60"
                }`}>
                  <h4 className={`text-3xs font-black uppercase tracking-wider flex items-center gap-1.5 select-none ${
                    siteTheme === "sudanese" ? "text-[#C57530]" : "text-amber-500"
                  }`}>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    <span>{currentLang === "ar" ? "طلبات معلقة 🔔" : "Pending Requests 🔔"}</span>
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {pendingIncoming.map(req => {
                      const sender = allUsers.find(u => String(u.id) === String(req.sender_id));
                      if (!sender) return null;
                      return (
                        <div key={req.id} className={`p-2 rounded-xl border space-y-2 ${
                          siteTheme === "sudanese" ? "bg-cream border-mud/10" : "bg-slate-955/85 border border-slate-850/80"
                        }`}>
                          <div className="flex items-center gap-2">
                            <UserAvatar username={sender.username} role={sender.user_role || "student"} size="sm" siteTheme={siteTheme} />
                            <span className={`text-4xs font-bold truncate block max-w-[100px] ${
                              siteTheme === "sudanese" ? "text-mud" : "text-slate-200"
                            }`}>{sender.username}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAcceptFriend(req.id, sender)}
                              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-100 rounded text-[9px] font-black cursor-pointer text-center select-none active:scale-95 transition-all outline-none"
                            >
                              {t.acceptBtn}
                            </button>
                            <button
                              onClick={() => handleDeclineFriend(req.id)}
                              className={`flex-1 py-1 rounded text-[9px] font-black cursor-pointer text-center select-none active:scale-95 transition-all outline-none border ${
                                siteTheme === "sudanese"
                                  ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                  : "bg-rose-955/40 hover:bg-rose-900/40 border-rose-900/20 text-rose-405"
                              }`}
                            >
                              {t.declineBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Middle chat thread messages screen */}
            <div className="col-span-1 md:col-span-3 flex flex-col min-h-[420px] relative">
              {/* Horizontal Active Chats & Friend DMs Picker Bar */}
              <div className={`p-3 border-b flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 select-none ${
                siteTheme === "sudanese"
                  ? "bg-[#FCFAF3] border-mud/10"
                  : "bg-slate-900/60 border-slate-900"
              }`} dir={currentLang === "ar" ? "rtl" : "ltr"}>
                <span className={`text-[10px] sm:text-xs font-bold leading-none shrink-0 border-l pl-2 select-none ${
                  siteTheme === "sudanese" ? "text-mud border-mud/15" : "text-indigo-400 border-slate-800"
                }`}>
                  {currentLang === "ar" ? "دردش مع:" : "Chat with:"}
                </span>

                {/* General Group Chat Button */}
                <button
                  onClick={() => {
                    setActiveChatWith(null);
                    setTimeout(() => scrollToBottom("smooth"), 120);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 duration-200 ${
                    activeChatWith === null
                      ? siteTheme === "sudanese"
                        ? "bg-mud text-cream shadow-sm"
                        : "bg-indigo-650 text-slate-50 shadow-md"
                      : siteTheme === "sudanese"
                        ? "bg-[#EDF2EE]/30 border border-mud/10 text-mud hover:bg-mud/5"
                        : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{currentLang === "ar" ? "💬  عام" : "💬 Public "}</span>
                </button>

                {/* Friends List Button Mapping for Private Chat selection */}
                <div className="flex items-center gap-2 shrink-0" style={{ width: "auto", height: "auto" }}>
                  {friendsList.map((friend, idx) => {
                    const isSelected = activeChatWith !== null && String(activeChatWith.id) === String(friend.id);
                    const hasDMs = messages.some(msg => 
                      String(msg.userId) === String(friend.id) && 
                      msg.text.startsWith(`[DM:${currentUser.id}]`)
                    );

                    const isSecondFriend = idx === 1;

                    return (
                      <div
                        key={friend.id}
                        role="button"
                        onClick={() => {
                          setActiveChatWith(friend);
                          setTimeout(() => scrollToBottom("smooth"), 120);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-3xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 duration-200 relative ${
                          isSelected
                            ? siteTheme === "sudanese"
                              ? "bg-earthgold text-mud border-mud/30 shadow-sm"
                              : "bg-indigo-900/60 border border-indigo-500 text-indigo-300"
                            : siteTheme === "sudanese"
                              ? "bg-white border border-mud/10 text-mud hover:bg-[#FCFAF3]"
                              : "bg-slate-900/80 border border-slate-805 text-slate-350 hover:text-slate-100"
                        }`}
                      >
                        <UserAvatar 
                          username={friend.username} 
                          role={friend.user_role || "student"} 
                          size="sm" 
                          siteTheme={siteTheme} 
                          style={isSecondFriend ? { width: "auto", height: "auto" } : undefined}
                        />
                        
                        <span 
                          className="truncate max-w-[80px]"
                          style={isSecondFriend ? { fontSize: "8px" } : undefined}
                        >
                          {friend.username.split(" ")[0]}
                        </span>

                        {/* Online Status Marker Dot */}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shrink-0" />

                        {/* Realtime DM Presence Unread/New Message Alert Badge */}
                        {hasDMs && !isSelected && (
                          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {censorshipWarning && (
                <div 
                  id="chat-censor-banner"
                  className={`border-b p-3 px-4 flex items-start gap-3 absolute top-0 left-0 right-0 z-10 animated-fade-in ${
                    siteTheme === "sudanese"
                      ? "bg-amber-100/40 border-amber-250 text-mud"
                      : "bg-amber-955/40 border-amber-805 text-slate-200"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${siteTheme === "sudanese" ? "bg-amber-100 text-[#C57530]" : "bg-amber-600/10 text-amber-400"}`}>
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="space-y-0.5 text-right">
                    <h4 className={`text-3xs font-extrabold ${siteTheme === "sudanese" ? "text-mud" : "text-amber-300"}`}>
                      {t.warningTitle}
                    </h4>
                    <p className={`text-4xs leading-relaxed ${siteTheme === "sudanese" ? "text-mud/85" : "text-slate-350"}`}>
                      {t.warningDesc}
                    </p>
                  </div>
                </div>
              )}

              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className={`flex-1 p-4 sm:p-5 space-y-4 max-h-[380px] overflow-y-auto overflow-x-hidden pt-14 min-h-[320px] relative scrollbar-thin scroll-smooth ${
                  siteTheme === "sudanese"
                    ? "bg-cream/10 scrollbar-thumb-mud/20"
                    : "bg-sky-950/5 scrollbar-thumb-slate-800"
                }`}
              >
                {isLoading ? (
                  <div className={`absolute inset-0 flex items-center justify-center ${siteTheme === "sudanese" ? "bg-cream/40" : "bg-slate-955/30"}`}>
                    <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
                      siteTheme === "sudanese" ? "border-earthgold" : "border-indigo-600"
                    }`} />
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
                      siteTheme === "sudanese" ? "bg-[#FAF5EC] border-mud/10 text-earthgold" : "bg-slate-900 border-slate-800/80 text-indigo-405"
                    }`}>
                      <MessageSquare className="w-8 h-8 opacity-60 animate-pulse" />
                    </div>
                    <p className={`text-3xs font-bold max-w-sm leading-relaxed ${
                      siteTheme === "sudanese" ? "text-mud" : "text-slate-400"
                    }`}>
                      {activeChatWith
                        ? (currentLang === "ar" ? `هذه هي بداية محادثتك الخاصة الآمنة مع ${activeChatWith.username} 👋` : `This is the start of your secure private chat with ${activeChatWith.username} 👋`)
                        : t.noMessagesYet
                      }
                    </p>
                  </div>
                ) : (
                  displayedMessages.map((msg) => {
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
                        {/* Clickable Name Icon (UserAvatar) */}
                        <div 
                          onClick={() => handleOpenUserDetails(msg)}
                          className="cursor-pointer hover:scale-105 active:scale-95 duration-150 transition-all shrink-0"
                          title={currentLang === "ar" ? "اضغط لعرض تفاصيل المستخدم" : "Click to view user details"}
                        >
                          <UserAvatar username={msg.username} role={msg.userRole} size="md" siteTheme={siteTheme} />
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className={`p-3 px-4 rounded-2xl break-words text-xs sm:text-[13px] leading-relaxed font-medium select-text text-right shadow-2xs border ${
                            isMyMsg 
                              ? siteTheme === "sudanese"
                                ? "bg-[#5C2C16] text-[#FDFBF7] rounded-tl-none border-[#5C2C16]"
                                : "bg-indigo-600 text-white rounded-tl-none border-indigo-750 shadow-sm shadow-indigo-950/10" 
                              : isMsgAdmin 
                              ? "bg-red-50/10 border-red-900/30 text-red-400 rounded-tr-none"
                              : isMsgTeacher
                              ? "bg-emerald-50/10 border-emerald-900/30 text-emerald-400 rounded-tr-none"
                              : siteTheme === "sudanese"
                              ? "bg-white border-mud/15 text-mud rounded-tr-none font-sans"
                              : "bg-slate-900 border-slate-850 text-slate-100 rounded-tr-none"
                          }`}>
                            {cleanMessageText(msg.text)}

                            {/* Message timestamp shown neatly inside the bubble */}
                            <div className={`text-[9.5px] opacity-60 font-mono mt-1 text-left select-none ${
                              isMyMsg ? "text-indigo-200" : siteTheme === "sudanese" ? "text-mud/50" : "text-slate-400"
                            }`}>
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>

                          {isAdminLoggedIn && (
                            <div className={`flex ${isMyMsg ? "justify-end" : "justify-start"}`}>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="inline-flex items-center gap-1 mt-1 text-[10px] text-rose-400 hover:text-rose-350 cursor-pointer font-bold bg-rose-950/20 hover:bg-rose-950/45 border border-rose-900/30 px-2 py-0.5 rounded-lg active:scale-95 duration-100"
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
                  className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 border p-2 rounded-full duration-200 shadow-xl cursor-pointer z-20 flex items-center justify-center animate-bounce animate-duration-3000 ${
                    siteTheme === "sudanese"
                      ? "bg-cream border-mud/15 text-mud"
                      : "bg-slate-900 border-slate-805 text-slate-205 hover:bg-slate-800"
                  }`}
                >
                  <ArrowDown className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-mud" : "text-indigo-400"}`} />
                </button>
              )}

              {/* Secure Chat Box Composer Form */}
              <footer className={`p-4 border-t ${
                siteTheme === "sudanese" ? "border-mud/15 bg-cream/80" : "border-slate-910 bg-slate-900/40"
              }`}>
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
                    className={`flex-1 p-3 px-4 rounded-xl text-xs outline-none transition-all focus:outline-none ${
                      siteTheme === "sudanese"
                        ? "bg-white border border-mud/20 text-mud placeholder:text-mud/50 focus:border-mud"
                        : "bg-slate-905 border border-slate-850 text-slate-101 placeholder:text-slate-505 focus:border-indigo-605"
                    }`}
                    placeholder={t.placeholder}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      inputText.trim() && !isSending
                        ? siteTheme === "sudanese"
                          ? "bg-mud hover:bg-mud/90 text-[#FDFBF7] cursor-pointer shadow-sm"
                          : "bg-indigo-600 hover:bg-indigo-505 text-slate-50 cursor-pointer shadow"
                        : siteTheme === "sudanese"
                          ? "bg-cream text-mud/30 border border-mud/10 cursor-not-allowed"
                          : "bg-[#1E293B] text-slate-600 cursor-not-allowed"
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
                className={`w-full p-3 pr-10 rounded-2xl text-xs outline-none transition-all border ${
                  siteTheme === "sudanese"
                    ? "bg-white border-mud/20 text-mud placeholder:text-mud/40 focus:border-mud"
                    : "bg-slate-900/55 border border-slate-800 focus:border-indigo-605 text-slate-100 placeholder:text-slate-505"
                }`}
              />
            </div>

            {/* Students List Grid with Scrollable Wrapper */}
            <div className="max-h-[50vh] sm:max-h-[460px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
              {isRelationsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 hover:scale-100 gap-4">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className={`p-4 rounded-xl border h-20 animate-pulse ${
                      siteTheme === "sudanese" ? "bg-mud/5 border-mud/10" : "bg-slate-900/30 border-slate-850"
                    }`} />
                  ))}
                </div>
              ) : renderedUsers.length === 0 ? (
                <div className={`text-center p-12 italic text-sm ${siteTheme === "sudanese" ? "text-mud/50" : "text-slate-505"}`}>
                  {t.noUsers}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 select-none pb-4">
                  {renderedUsers.map(peer => {
                    const peerStage = getStageOfGrade(peer.grade_id);
                    const isSameStage = peerStage === myStageId;
                    
                    return (
                      <div 
                        key={peer.id}
                        onClick={() => setSelectedPeerDetails(peer)}
                        className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 text-center ${
                          siteTheme === "sudanese"
                            ? isSameStage 
                              ? "bg-white border-mud/10 hover:border-mud/30 text-mud shadow-sm" 
                              : "bg-[#FAFAF6]/80 border-mud/5 opacity-80"
                            : isSameStage 
                              ? "bg-slate-900/50 border-slate-850 hover:border-indigo-650/50 hover:bg-slate-900 text-slate-100" 
                              : "bg-slate-925/25 border-slate-900/70 opacity-60 text-slate-400"
                        }`}
                        title={currentLang === "ar" ? "اضغط لعرض تفاصيل الطالب" : "Click to view student details"}
                      >
                        {/* Avatar name icon */}
                        <UserAvatar username={peer.username} role={peer.user_role || "student"} size="lg" siteTheme={siteTheme} showStatus={isSameStage} />

                        {/* Details */}
                        <div className="mt-3 space-y-0.5 w-full">
                          <h4 className={`font-extrabold text-2xs truncate ${
                            siteTheme === "sudanese" ? "text-mud font-black" : "text-slate-100"
                          }`}>
                            {peer.username}
                          </h4>
                          <span className={`block text-6xs font-bold truncate opacity-85 ${
                            siteTheme === "sudanese" ? "text-mud/75" : "text-slate-400"
                          }`}>
                            {peer.grade_name || "عام"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FRIEND REQUESTS TAB (INCOMING & OUTGOING SUB-DIVISIONS) */}
        {activeCategoryTab === "requests" && (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-6 select-none max-h-[50vh] sm:max-h-[460px] overflow-y-auto overscroll-contain scrollbar-thin">
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
                          <UserAvatar username={sender.username} role={sender.user_role || "student"} size="sm" siteTheme={siteTheme} />
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
                          <UserAvatar username={receiver.username} role={receiver.user_role || "student"} size="sm" siteTheme={siteTheme} />
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

        {/* Selected Student Details Popup Modal */}
        {selectedPeerDetails && (() => {
          const isPeerFriend = activeFriendIds.has(String(selectedPeerDetails.id));
          const sentPeerPending = pendingOutgoing.some(f => String(f.receiver_id) === String(selectedPeerDetails.id));
          const receivedPeerPending = pendingIncoming.some(f => String(f.sender_id) === String(selectedPeerDetails.id));
          const peerStageId = getStageOfGrade(selectedPeerDetails.grade_id);
          const isPeerSameStage = peerStageId === myStageId;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs transition-opacity duration-300">
              <div 
                className={`w-full max-w-sm rounded-3xl border overflow-hidden p-6 relative shadow-2xl animate-in scale-in duration-200 text-right ${
                  siteTheme === "sudanese"
                    ? "bg-[#FCFAF6] border-mud/20 text-mud"
                    : "bg-slate-925 border-slate-800 text-[#F1F5F9]"
                }`}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedPeerDetails(null)}
                  className={`absolute top-4 left-4 p-2 rounded-full cursor-pointer hover:scale-110 active:scale-95 duration-150 border ${
                    siteTheme === "sudanese"
                      ? "bg-mud/5 hover:bg-mud/10 text-mud/60 border-mud/10"
                      : "bg-slate-900/50 hover:bg-slate-800 border-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Main Identity Info */}
                <div className="flex flex-col items-center text-center mt-4 mb-6">
                  <UserAvatar 
                    username={selectedPeerDetails.username} 
                    role={selectedPeerDetails.user_role || "student"} 
                    size="xl" 
                    siteTheme={siteTheme} 
                    showStatus={true} 
                    statusColor={isPeerSameStage ? "bg-emerald-500" : "bg-rose-500"}
                  />

                  <h3 className={`text-sm font-black mb-1 ${
                    siteTheme === "sudanese" ? "text-mud font-black" : "text-white"
                  }`}>
                    {selectedPeerDetails.username}
                  </h3>

                  <span className={`text-6xs font-black uppercase px-2.5 py-1 rounded-full ${
                    siteTheme === "sudanese"
                      ? "bg-mud/5 text-mud/70"
                      : "bg-slate-900 text-slate-400"
                  }`}>
                    {selectedPeerDetails.grade_name || "صف دراسي غير محدد"} ({getStageLabel(peerStageId)})
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Info Row: Availability Status */}
                  <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-2xs ${
                    siteTheme === "sudanese" ? "bg-mud/5" : "bg-slate-900/40"
                  }`}>
                    <span className={`text-5xs font-bold leading-none ${
                        siteTheme === "sudanese" ? "text-mud/60" : "text-slate-400"
                      }`}>
                      {currentLang === "ar" ? "حالة الإضافة" : "Status"}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPeerSameStage ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      <span>
                        {isPeerSameStage 
                          ? (currentLang === "ar" ? "متاح للإضافة في نفس مرحلتك ✅" : "Available in your stage ✅")
                          : (currentLang === "ar" ? "غير متاح (مرحلة دراسية مختلفة) ❌" : "Unavailable (Different stage) ❌")
                        }
                      </span>
                    </span>
                  </div>

                  {/* Actions Block */}
                  <div className="flex flex-col gap-2 pt-2">
                    {isPeerFriend ? (
                      <div className="space-y-2">
                        <button 
                          onClick={() => { 
                            setActiveChatWith(selectedPeerDetails); 
                            setActiveCategoryTab("chat"); 
                            setSelectedPeerDetails(null); 
                            setTimeout(() => scrollToBottom("smooth"), 120); 
                          }} 
                          className={`w-full py-2.5 rounded-2xl text-xs font-black cursor-pointer select-none active:scale-95 duration-150 transition-all flex items-center justify-center gap-1.5 ${
                            siteTheme === "sudanese" 
                              ? "bg-mud hover:bg-mud/90 text-[#FDFBF7]" 
                              : "bg-indigo-650 hover:bg-indigo-505 text-[#F1F5F9]"
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{currentLang === "ar" ? "بدء دردشة خاصة 💬" : "Send Private Message 💬"}</span>
                        </button>

                        <button
                          onClick={() => {
                            const friendRel = friendships.find(f => 
                              f.status === "accepted" && (
                                (String(f.sender_id) === String(currentUser.id) && String(f.receiver_id) === String(selectedPeerDetails.id)) ||
                                (String(f.sender_id) === String(selectedPeerDetails.id) && String(f.receiver_id) === String(currentUser.id))
                              )
                            );
                            if (friendRel) {
                              if (window.confirm(currentLang === "ar" ? `هل أنت متأكد من إلغاء الصداقة مع ${selectedPeerDetails.username}؟` : `Are you sure you want to unfriend ${selectedPeerDetails.username}?`)) {
                                handleDeclineFriend(friendRel.id);
                                setSelectedPeerDetails(null);
                              }
                            }
                          }}
                          className="w-full py-2.5 bg-rose-950/20 hover:bg-rose-950/35 border border-rose-900/30 text-rose-400 rounded-2xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 duration-150 flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "ar" ? "إلغاء الصداقة ❌" : "Unfriend ❌"}</span>
                        </button>
                      </div>
                    ) : sentPeerPending ? (
                      <div className="space-y-2 text-center">
                        <div className="py-2 px-3 bg-amber-950/20 border border-amber-900/30 text-amber-405 rounded-2xl text-5xs font-black flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{currentLang === "ar" ? "طلب الصداقة قيد الانتظار..." : "Request is pending..."}</span>
                        </div>
                        <button
                          onClick={() => {
                            const friendRel = pendingOutgoing.find(f => String(f.receiver_id) === String(selectedPeerDetails.id));
                            if (friendRel) {
                              handleDeclineFriend(friendRel.id);
                              setSelectedPeerDetails(null);
                            }
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 text-slate-400 rounded-2xl text-5xs font-black transition-all cursor-pointer select-none active:scale-95 duration-150 flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "ar" ? "التراجع عن طلب الصداقة" : "Cancel Request"}</span>
                        </button>
                      </div>
                    ) : receivedPeerPending ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-indigo-950/10 border border-indigo-900/30 text-indigo-400 rounded-2xl text-5xs font-bold text-center">
                          {currentLang === "ar" ? "أرسل إليك طلب صداقة 🔔" : "Sent you a friend request 🔔"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const friendObj = pendingIncoming.find(f => String(f.sender_id) === String(selectedPeerDetails.id));
                              if (friendObj) {
                                handleAcceptFriend(friendObj.id, selectedPeerDetails);
                                setSelectedPeerDetails(null);
                              }
                            }}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-2xs font-extrabold rounded-2xl cursor-pointer flex items-center justify-center gap-1 select-none active:scale-95 duration-150"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>{t.acceptBtn}</span>
                          </button>
                          <button
                            onClick={() => {
                              const friendObj = pendingIncoming.find(f => String(f.sender_id) === String(selectedPeerDetails.id));
                              if (friendObj) {
                                handleDeclineFriend(friendObj.id);
                                setSelectedPeerDetails(null);
                              }
                            }}
                            className="py-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/35 text-2xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-1 select-none active:scale-95 duration-150"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t.declineBtn}</span>
                          </button>
                        </div>
                      </div>
                    ) : isPeerSameStage ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            handleAddFriend(selectedPeerDetails);
                            setSelectedPeerDetails(null);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white text-2xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-1 select-none active:scale-95 duration-150"
                        >
                          <UserPlus className="w-4 h-4 text-white" />
                          <span>{t.addFriend}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleSimulateIncomingRequest(selectedPeerDetails);
                            setSelectedPeerDetails(null);
                          }}
                          className="w-full py-2 bg-amber-900/10 hover:bg-amber-900/20 border border-amber-900/30 text-amber-400 text-5xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-1 select-none active:scale-95 duration-150"
                          title="اضغط لتجربة واستقبال طلب صداقة وهمي من هذا الطالب على حسابك"
                        >
                          <span>محاكاة استلام طلب 📥</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-950/10 border border-rose-900/20 text-rose-400 rounded-2xl text-5xs font-black text-center select-none leading-relaxed">
                        {currentLang === "ar" ? "عذراً، لا يمكنك إضافة طالب من مرحلة دراسية مختلفة لعدم حدوث تشتيت للمناهج." : "Sorry, you cannot add a student from a different educational stage."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
