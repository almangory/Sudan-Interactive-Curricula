import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Award, Compass, BookOpen, Clock, Heart, 
  Map, Sparkles, Star, ChevronLeft, ChevronDown, ChevronUp, CheckCircle, 
  Search, ShieldAlert, History, Globe, Plus, FileText, Video, Filter,
  Lock, Network, MessageSquare, X, Bell, MessagesSquare, UserCheck, Check, Link, ArrowLeftRight,
  User, LogOut, Settings, Wifi, WifiOff, RotateCw, UserPlus, LogIn, Image, Pencil, Gamepad2, HelpCircle,
  Baby, Backpack
} from "lucide-react";
import { stagesData, Stage, Grade, Subject } from "./data/curriculum";
import SubjectModal from "./components/SubjectModal";
import AddSubjectModal from "./components/AddSubjectModal";
import DynamicIcon from "./components/DynamicIcon";
import StudyCamp from "./components/StudyCamp";
import AdminDashboard from "./components/AdminDashboard";
import EducationalMindMap from "./components/EducationalMindMap";
import StudentChatRoom from "./components/StudentChatRoom";
import WebsiteLogo from "./components/WebsiteLogo";
import { OnboardingGuide } from "./components/OnboardingGuide";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { fetchCurriculumFromSupabase, verifyAdminInSupabase, saveCurriculumToSupabase, getSupabaseConfig, saveSupabaseConfig, AppUser, registerUser, loginUser, signInWithGoogle, checkAndSyncGoogleSession, getSupabaseClient, updateCurrentUserProfile, fetchLiveLessonsFromSupabase, LiveLesson, checkUserExistsAndActive, getApiUrl, obfuscateString, deobfuscateString, sha256, fetchAllRegisteredUsers } from "./lib/supabase";
import { stageAndGradeTranslations, uiTranslations } from "./lib/translations";

function getGoogleDriveFileId(url: string): string {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const dMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      return dMatch[1];
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
  }
  return "";
}

function convertGoogleDriveUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://docs.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
}

function getGoogleDriveEmbedUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

function convertGoogleDriveVideoUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

function getStageEnglishName(stageId: string): string {
  switch (stageId) {
    case "kindergarten":
      return "Kindergarten";
    case "primary":
      return "Primary Stage";
    case "intermediate":
    case "middle":
      return "Intermediate Stage";
    case "secondary":
      return "Secondary Stage";
    default:
      return "";
  }
}


const CustomSettingsIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer Gear Body (Standard Lucide Settings path) */}
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      {/* Inner Path: Custom Sudanese/Islamic 8-pointed star to reflect platform's identity */}
      <path 
        d="M 12 8.5 L 12.6 10.6 L 14.5 9.5 L 13.4 11.4 L 15.5 12 L 13.4 12.6 L 14.5 14.5 L 12.6 13.4 L 12 15.5 L 11.4 13.4 L 9.5 14.5 L 10.6 12.6 L 8.5 12 L 10.6 11.4 L 9.5 9.5 L 11.4 10.6 Z" 
        fill="currentColor"
      />
    </svg>
  );
};

const SudaneseHeritageDecor = () => {
  return (
    <>
      {/* Left Decoration: Nubian Clay House & Palm Tree */}
      <div className="absolute top-48 -left-12 lg:left-6 w-52 h-auto opacity-[0.18] select-none pointer-events-none hidden md:block z-0 transition-opacity duration-500">
        <svg viewBox="0 0 200 400" className="w-full h-full text-mud" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Clay House Towers */}
          <path d="M 20 380 L 20 200 L 40 160 L 60 200 L 60 380 Z" fill="#FDFBF7" />
          <path d="M 60 380 L 60 120 L 90 80 L 120 120 L 120 380 Z" fill="#FAF5EC" />
          <path d="M 120 380 L 120 180 L 140 140 L 160 180 L 160 380 Z" fill="#FDFBF7" />
          
          {/* Parapet Triangles on top of towers */}
          <path d="M 20 200 L 30 190 L 40 200 L 50 190 L 60 200" />
          <path d="M 60 120 L 70 110 L 80 120 L 90 110 L 100 120 L 110 110 L 120 120" />
          <path d="M 120 180 L 130 170 L 140 180 L 150 170 L 160 180" />
          
          {/* Arched Doors */}
          <path d="M 75 380 L 75 340 A 15 15 0 0 1 105 340 L 105 380 Z" fill="#EAD4A8" />
          <path d="M 32 380 L 32 355 A 8 8 0 0 1 48 355 L 48 380 Z" />
          
          {/* Arched Windows and triangular slots */}
          <path d="M 82 200 L 82 180 A 8 8 0 0 1 98 180 L 98 200 Z" />
          <path d="M 35 240 L 45 240 L 40 230 Z" fill="currentColor" />
          <path d="M 135 220 L 145 220 L 140 210 Z" fill="currentColor" />
          
          {/* Traditional wall carvings/engravings */}
          <path d="M 25 300 L 35 290 L 45 300 L 55 290" />
          <path d="M 25 310 L 35 300 L 45 310 L 55 300" />
          
          <path d="M 65 250 L 75 240 L 85 250 L 95 240 L 105 250 L 115 240" />
          <path d="M 65 260 L 75 250 L 85 260 L 95 250 L 105 260 L 115 250" />
          
          <path d="M 125 280 L 135 270 L 145 280 L 155 270" />
          <path d="M 125 290 L 135 280 L 145 290 L 155 280" />
          
          {/* Sudanese Palm Tree waving gently next to the house */}
          <path d="M 175 380 Q 182 310 178 250" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Palm Fronds */}
          <path d="M 178 250 Q 150 240 140 255" stroke="#007229" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 178 250 Q 155 220 152 232" stroke="#007229" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 178 250 Q 178 200 180 212" stroke="#007229" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 178 250 Q 200 220 204 232" stroke="#007229" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 178 250 Q 205 240 215 255" stroke="#007229" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Base ground line */}
          <line x1="10" y1="380" x2="190" y2="380" strokeWidth="2" />
        </svg>
      </div>

      {/* Right Decoration: Pyramids of Meroe & Traditional Jebena Coffee Pot */}
      <div className="absolute top-48 -right-12 lg:right-6 w-52 h-auto opacity-[0.18] select-none pointer-events-none hidden md:block z-0 transition-opacity duration-500">
        <svg viewBox="0 0 200 400" className="w-full h-full text-mud" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Pyramid 1 (Main Steep Meroe Pyramid) */}
          <path d="M 20 250 L 65 70 L 110 250 Z" fill="#FAF5EC" stroke="currentColor" strokeWidth="1.5" />
          {/* Horizontal tiers/brick layers on pyramid 1 */}
          <line x1="53" y1="120" x2="77" y2="120" stroke="currentColor" strokeWidth="1" />
          <line x1="42" y1="160" x2="88" y2="160" stroke="currentColor" strokeWidth="1" />
          <line x1="31" y1="200" x2="99" y2="200" stroke="currentColor" strokeWidth="1" />
          <line x1="22" y1="240" x2="108" y2="240" stroke="currentColor" strokeWidth="1" />
          
          {/* Pyramid 2 (Smaller overlapping steep pyramid) */}
          <path d="M 90 250 L 125 110 L 160 250 Z" fill="#FDFBF7" stroke="currentColor" strokeWidth="1.5" />
          {/* Tiers on pyramid 2 */}
          <line x1="114" y1="150" x2="136" y2="150" stroke="currentColor" strokeWidth="1" />
          <line x1="104" y1="190" x2="146" y2="190" stroke="currentColor" strokeWidth="1" />
          <line x1="94" y1="230" x2="156" y2="230" stroke="currentColor" strokeWidth="1" />

          {/* Traditional Sudanese Jebena (Coffee Pot) sitting on the ground next to pyramids */}
          {/* Jebena Body */}
          <circle cx="90" cy="330" r="22" fill="#FAF5EC" stroke="currentColor" strokeWidth="1.5" />
          {/* Jebena Neck */}
          <path d="M 84 309 L 84 275 L 96 275 L 96 309 Z" fill="#FAF5EC" stroke="currentColor" strokeWidth="1.5" />
          {/* Flared Rim */}
          <ellipse cx="90" cy="275" rx="8" ry="3.5" fill="currentColor" />
          {/* Handle */}
          <path d="M 84 290 Q 64 290 78 335" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Spout */}
          <path d="M 96 320 L 114 305 L 112 300 L 96 315 Z" fill="currentColor" />
          
          {/* Traditional Base (Al-Wiqaya / الوقاية) */}
          <ellipse cx="90" cy="353" rx="18" ry="5.5" fill="#FAF5EC" stroke="currentColor" strokeWidth="1.5" />
          
          {/* Little Finjal (coffee cup) next to it */}
          <path d="M 130 340 L 140 340 L 142 350 L 128 350 Z" fill="#FAF5EC" stroke="currentColor" strokeWidth="1" />
          {/* Steam rising from Finjal */}
          <path d="M 132 334 Q 135 328 132 322" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" className="animate-pulse" />
          <path d="M 137 335 Q 140 329 137 323" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" className="animate-pulse" />

          {/* Traditional patterns carved in space */}
          <path d="M 15 300 L 25 290 L 35 300 L 45 290" />
          <path d="M 15 310 L 25 300 L 35 310 L 45 300" />

          {/* Ground Line */}
          <line x1="10" y1="353" x2="190" y2="353" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </>
  );
};

function renderHeritageSubjectShelfIcon(subjectName: string) {
  const name = subjectName.toLowerCase();

  if (name.includes("عربية") || name.includes("arabic") || name.includes("حكايات") || name.includes("قرآن") || name.includes("إسلامية")) {
    return (
      <div className="relative w-full h-16 flex flex-col items-center justify-end">
        {/* Alphabet Blocks */}
        <div className="flex gap-1.5 items-end mb-1">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md border-b-2 border-amber-700 animate-bounce" style={{ animationDelay: '0.1s' }}>أ</div>
          <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md border-b-2 border-red-700 animate-bounce" style={{ animationDelay: '0.3s' }}>ب</div>
          <div className="w-7 h-7 bg-[#A35130] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md border-b-2 border-amber-900 animate-bounce" style={{ animationDelay: '0.5s' }}>ت</div>
        </div>
        {/* Wooden Shelf */}
        <div className="w-28 h-2 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-full shadow-md border-b border-[#5C2C16]"></div>
        <div className="w-20 h-1 bg-[#8B4513]/10 blur-xs rounded-full"></div>
      </div>
    );
  } else if (name.includes("رياضيات") || name.includes("أرقام") || name.includes("حساب") || name.includes("math")) {
    return (
      <div className="relative w-full h-16 flex flex-col items-center justify-end">
        {/* Custom Cute Abacus */}
        <div className="w-14 h-11 border-2 border-[#8B4513] rounded-lg bg-[#FAF5EC]/45 p-1 flex flex-col justify-between mb-1 shadow-inner relative">
          <div className="h-0.5 bg-[#8B4513]/40 w-full flex items-center justify-start gap-1 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs"></span>
          </div>
          <div className="h-0.5 bg-[#8B4513]/40 w-full flex items-center justify-end gap-1 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"></span>
          </div>
          <div className="h-0.5 bg-[#8B4513]/40 w-full flex items-center justify-center gap-1 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs"></span>
          </div>
        </div>
        {/* Wooden Shelf */}
        <div className="w-28 h-2 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-full shadow-md border-b border-[#5C2C16]"></div>
        <div className="w-20 h-1 bg-[#8B4513]/10 blur-xs rounded-full"></div>
      </div>
    );
  } else if (name.includes("english") || name.includes("إنجليزي") || name.includes("جغرافيا") || name.includes("علوم") || name.includes("science")) {
    return (
      <div className="relative w-full h-16 flex flex-col items-center justify-end">
        {/* Globe stand and earth sphere */}
        <div className="relative mb-1 flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
          <div className="w-9 h-9 rounded-full bg-sky-400 border-2 border-emerald-500 flex items-center justify-center shadow-md overflow-hidden relative">
            <div className="absolute top-1 left-2 w-4 h-2 bg-emerald-500 rounded-full opacity-80"></div>
            <div className="absolute bottom-2 right-1.5 w-3 h-3 bg-emerald-500 rounded-full opacity-80"></div>
            <div className="absolute top-4 right-1 w-2 h-2 bg-emerald-500 rounded-full opacity-80"></div>
          </div>
          <div className="absolute -bottom-1 w-10 h-10 rounded-full border-b-2 border-r-2 border-[#8B4513]/60 rotate-45 pointer-events-none"></div>
        </div>
        {/* Wooden Shelf */}
        <div className="w-28 h-2 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-full shadow-md border-b border-[#5C2C16]"></div>
        <div className="w-20 h-1 bg-[#8B4513]/10 blur-xs rounded-full"></div>
      </div>
    );
  } else {
    return (
      <div className="relative w-full h-16 flex flex-col items-center justify-end">
        <div className="flex gap-1 items-end mb-1 transform rotate-1">
          <div className="w-2.5 h-9 bg-red-600 rounded-xs shadow border-r border-red-700 transform -rotate-6"></div>
          <div className="w-2.5 h-10 bg-amber-500 rounded-xs shadow border-r border-amber-600 transform -rotate-3"></div>
          <div className="w-3.5 h-8 bg-emerald-600 rounded-xs shadow border-r border-emerald-700 transform rotate-12"></div>
        </div>
        {/* Wooden Shelf */}
        <div className="w-28 h-2 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-full shadow-md border-b border-[#5C2C16]"></div>
        <div className="w-20 h-1 bg-[#8B4513]/10 blur-xs rounded-full"></div>
      </div>
    );
  }
}

export default function App() {
  const [siteTheme, setSiteTheme] = useState<"heritage" | "sudanese" | "legacy">(() => {
    return (localStorage.getItem("sudan_site_theme") as "heritage" | "sudanese" | "legacy") || "heritage";
  });

  const toggleSiteTheme = () => {
    let nextTheme: "heritage" | "sudanese" | "legacy" = "heritage";
    if (siteTheme === "heritage") {
      nextTheme = "sudanese";
    } else if (siteTheme === "sudanese") {
      nextTheme = "legacy";
    } else {
      nextTheme = "heritage";
    }
    setSiteTheme(nextTheme);
    localStorage.setItem("sudan_site_theme", nextTheme);
  };

  const isWarmTheme = siteTheme === "sudanese" || siteTheme === "heritage";

  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Curriculum data is retrieved directly from the server-side compiled curriculum.ts (stagesData)
  // We use local storage fallback for cross-environment consistency (e.g. on Vercel)
  const [curriculumData, setCurriculumData] = useState<Stage[]>(() => {
    const cached = localStorage.getItem("sudan_custom_curriculum_v3");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached curriculum", e);
      }
    }
    return stagesData;
  });

  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [recentSubjects, setRecentSubjects] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("sudan_edu_recent_subjects");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [addSubjectState, setAddSubjectState] = useState<{
    stageId: string;
    gradeId: string;
    gradeName: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showTopSearch, setShowTopSearch] = useState(false);
  const [publicLibraryUrl, setPublicLibraryUrl] = useState(() => {
    return localStorage.getItem("sudan_public_library_url") || "https://sd-books-library.vercel.app/";
  });
  const [educationalGamesUrl, setEducationalGamesUrl] = useState(() => {
    return localStorage.getItem("sudan_educational_games_url") || "https://naqla-game.vercel.app/";
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showStudyCamp, setShowStudyCamp] = useState(false);
  const [showEducationalMindMap, setShowEducationalMindMap] = useState(false);
  const [showStudentChat, setShowStudentChat] = useState(false);
  const [showGamesSidebar, setShowGamesSidebar] = useState(false);
  const [showUserSettingsIcons, setShowUserSettingsIcons] = useState(false);
  const [showParentPortal, setShowParentPortal] = useState(false);
  const [parentChildrenLinks, setParentChildrenLinks] = useState<any[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<AppUser[]>([]);
  const [isParentPortalLoading, setIsParentPortalLoading] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [selectedChildForReport, setSelectedChildForReport] = useState<AppUser | null>(null);
  const [activeMiniGame, setActiveMiniGame] = useState<string | null>(null);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(() => {
    return !localStorage.getItem("sudan_edu_guide_completed");
  });

  const handleCloseOnboarding = () => {
    localStorage.setItem("sudan_edu_guide_completed", "true");
    setShowOnboardingGuide(false);
  };

  // States for Math Kid Wizard game
  const [mathQuestion, setMathQuestion] = useState<{ questionText: string; answer: number; options: number[] } | null>(null);
  const [mathScore, setMathScore] = useState(0);
  const [mathStreak, setMathStreak] = useState(0);
  const [mathFeedback, setMathFeedback] = useState<string | null>(null);
  const [mathStatus, setMathStatus] = useState<"unanswered" | "correct" | "incorrect">("unanswered");

  // States for Word Hero game
  const [wordPuzzleIndex, setWordPuzzleIndex] = useState(0);
  const [wordScore, setWordScore] = useState(0);
  const [wordFeedback, setWordFeedback] = useState<string | null>(null);
  const [wordStatus, setWordStatus] = useState<"unanswered" | "correct" | "incorrect">("unanswered");

  // States for Memory Cards game
  const [memoryCards, setMemoryCards] = useState<{ id: number; symbol: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatchedCount, setMemoryMatchedCount] = useState(0);
  const [memoryActiveIndices, setMemoryActiveIndices] = useState<number[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<"playing" | "won">("playing");

  // States for Little Painter pixel art coloring game
  const [currentColor, setCurrentColor] = useState("#ec4899"); // Default to hot pink
  const [pixelGrid, setPixelGrid] = useState<string[]>(Array(64).fill("#1e293b")); // 8x8 slate-800 default

  // Generate random Math question
  const generateNewMathQuestion = () => {
    const isAddition = Math.random() > 0.5;
    const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
    const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
    const questionText = isAddition ? `${num1} + ${num2}` : `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
    const answer = isAddition ? num1 + num2 : Math.max(num1, num2) - Math.min(num1, num2);
    
    const optionsSet = new Set<number>();
    optionsSet.add(answer);
    while (optionsSet.size < 3) {
      const offset = Math.floor(Math.random() * 5) + 1;
      const fakeAnswer = Math.max(1, answer + (Math.random() > 0.5 ? offset : -offset));
      optionsSet.add(fakeAnswer);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    
    setMathQuestion({ questionText, answer, options });
    setMathFeedback(null);
    setMathStatus("unanswered");
  };

  // Reset/Initialize Math game
  const initMathGame = () => {
    setMathScore(0);
    setMathStreak(0);
    generateNewMathQuestion();
  };

  // Word Puzzles list
  const wordPuzzles = [
    { word: "تفـ_حة", missing: "ا", options: ["ا", "و", "ي"], display: "تُفّاحة 🍎" },
    { word: "أسـ_د", missing: "ـد", options: ["ـد", "ـر", "ـب"], display: "أَسَد 🦁" },
    { word: "كـ_اب", missing: "ت", options: ["ت", "ب", "ج"], display: "كِتاب 📚" },
    { word: "مـ_رسة", missing: "د", options: ["د", "ر", "س"], display: "مَدْرَسة 🏫" },
    { word: "جـ_ل", missing: "م", options: ["م", "ب", "ت"], display: "جَمَل 🐪" },
    { word: "قـ_م", missing: "ل", options: ["ل", "ر", "m"], display: "قَلَم ✏️" },
    { word: "شـ_س", missing: "م", options: ["م", "و", "ج"], display: "شَمْس ☀️" },
    { word: "هـ_ال", missing: "ل", options: ["ل", "م", "ف"], display: "هِلَال 🌙" }
  ];

  // Initialize Word game
  const initWordGame = () => {
    setWordPuzzleIndex(0);
    setWordScore(0);
    setWordFeedback(null);
    setWordStatus("unanswered");
  };

  // Initialize Memory game
  const initMemoryGame = () => {
    const symbols = ["🍎", "🦁", "📚", "🏫", "🌟", "🎈", "🐪", "🎨"];
    const duplicated = [...symbols, ...symbols];
    const shuffled = duplicated
      .map((symbol, index) => ({ id: index, symbol, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
    setMemoryMoves(0);
    setMemoryMatchedCount(0);
    setMemoryActiveIndices([]);
    setMemoryStatus("playing");
  };

  // Initialize Pixel Art game
  const initPixelGame = () => {
    setPixelGrid(Array(64).fill("#1e293b"));
  };

  useEffect(() => {
    if (activeMiniGame === "math") {
      initMathGame();
    } else if (activeMiniGame === "word") {
      initWordGame();
    } else if (activeMiniGame === "memory") {
      initMemoryGame();
    } else if (activeMiniGame === "color") {
      initPixelGame();
    }
  }, [activeMiniGame]);

  const handleMathAnswer = (selected: number) => {
    if (mathStatus !== "unanswered" || !mathQuestion) return;
    
    if (selected === mathQuestion.answer) {
      setMathScore(prev => prev + 10);
      setMathStreak(prev => prev + 1);
      setMathStatus("correct");
      setMathFeedback(currentLang === "ar" ? "أحسنت يا بطل! إجابة صحيحة عبقرية 🎉" : "Excellent work, champion! Genius correct answer 🎉");
      setTimeout(() => {
        generateNewMathQuestion();
      }, 1500);
    } else {
      setMathStreak(0);
      setMathStatus("incorrect");
      setMathFeedback(currentLang === "ar" ? "حاول مجدداً يا بطل، أنت قادر على حلها! 💪" : "Try again, champion, you can do this! 💪");
      setTimeout(() => {
        setMathStatus("unanswered");
        setMathFeedback(null);
      }, 1500);
    }
  };

  const handleWordAnswer = (selected: string) => {
    if (wordStatus !== "unanswered") return;
    const currentPuzzle = wordPuzzles[wordPuzzleIndex];
    
    if (selected === currentPuzzle.missing) {
      setWordScore(prev => prev + 10);
      setWordStatus("correct");
      setWordFeedback(currentLang === "ar" ? `أحسنت! الكلمة كاملة هي: ${currentPuzzle.display} ✨` : `Great! The completed word is: ${currentPuzzle.display} ✨`);
      setTimeout(() => {
        if (wordPuzzleIndex < wordPuzzles.length - 1) {
          setWordPuzzleIndex(prev => prev + 1);
          setWordStatus("unanswered");
          setWordFeedback(null);
        } else {
          setWordFeedback(currentLang === "ar" ? "🏆 تهانينا! لقد أكملت كل كلمات الحروف الهجائية بنجاح!" : "🏆 Congratulations! You have completed all words successfully!");
        }
      }, 2000);
    } else {
      setWordStatus("incorrect");
      setWordFeedback(currentLang === "ar" ? "حاول مجدداً، اختر الحرف الصحيح لتكتمل الكلمة 🌟" : "Try again, pick the correct letter to complete the word 🌟");
      setTimeout(() => {
        setWordStatus("unanswered");
        setWordFeedback(null);
      }, 1500);
    }
  };

  const handleMemoryCardClick = (clickedIndex: number) => {
    if (memoryStatus === "won" || memoryActiveIndices.length >= 2) return;
    const clickedCard = memoryCards[clickedIndex];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip the clicked card
    const updated = [...memoryCards];
    updated[clickedIndex].isFlipped = true;
    setMemoryCards(updated);

    const newActive = [...memoryActiveIndices, clickedIndex];
    setMemoryActiveIndices(newActive);

    if (newActive.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = newActive;
      const firstCard = memoryCards[firstIdx];
      const secondCard = memoryCards[secondIdx];

      if (firstCard.symbol === secondCard.symbol) {
        // Match found!
        setTimeout(() => {
          const matched = [...updated];
          matched[firstIdx].isMatched = true;
          matched[secondIdx].isMatched = true;
          setMemoryCards(matched);
          setMemoryActiveIndices([]);
          const newMatchedCount = memoryMatchedCount + 1;
          setMemoryMatchedCount(newMatchedCount);
          if (newMatchedCount === 8) {
            setMemoryStatus("won");
          }
        }, 600);
      } else {
        // Not a match, flip back
        setTimeout(() => {
          const reverted = [...updated];
          reverted[firstIdx].isFlipped = false;
          reverted[secondIdx].isFlipped = false;
          setMemoryCards(reverted);
          setMemoryActiveIndices([]);
        }, 1000);
      }
    }
  };

  const handlePixelCellClick = (index: number) => {
    const updated = [...pixelGrid];
    updated[index] = updated[index] === currentColor ? "#1e293b" : currentColor;
    setPixelGrid(updated);
  };

  const [categoryFilter, setCategoryFilter] = useState<"all" | "books" | "videos" | "interactive">("all");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([]);

  const handleLibraryClick = () => {
    // 🔒 Check if logged in as registered user or admin
    if ((!currentUser || currentUser.user_role === "guest") && !isAdminLoggedIn) {
      setUserAuthError(
        currentLang === "ar"
          ? "⚠️ الدخول إلى المكتبة العامة متاح للأعضاء المسجلين فقط. يرجى تسجيل الدخول أو إنشاء حساب جديد مجاناً للمتابعة!"
          : "⚠️ Access to the Public Library is available for registered members only. Please log in or create a new free account to continue!"
      );
      setUserModalTab("login");
      setShowUserModal(true);
      return;
    }

    if (publicLibraryUrl) {
      window.open(publicLibraryUrl, "_blank");
    } else {
      if (isAdminLoggedIn) {
        const newUrl = prompt(
          currentLang === "ar" 
            ? "أدخل رابط موقع المكتبة العامة الجديد لحفظه:" 
            : "Enter new Public Library URL to save:", 
          "https://sd-books-library.vercel.app/"
        );
        if (newUrl !== null) {
          setPublicLibraryUrl(newUrl);
          localStorage.setItem("sudan_public_library_url", newUrl);
          setSaveStatus(
            currentLang === "ar" 
              ? "🎉 تم حفظ رابط المكتبة العامة بنجاح!" 
              : "🎉 Public Library link saved successfully!"
          );
          setTimeout(() => setSaveStatus(null), 4000);
        }
      } else {
        alert(
          currentLang === "ar"
            ? "📚 المكتبة العامة الرقمية:\nسيتم إضافة رابط موقع المكتبة العامة قريباً من قبل إدارة المنصة! ترقبوا كتباً تفاعلية ومصادر خارجية قيمة. ✨"
            : "📚 Digital Public Library:\nThe direct link will be added soon by the platform administration! Stay tuned for valuable interactive books & external resources. ✨"
        );
      }
    }
  };

  const handleGamesClick = () => {
    // 🔒 Check if logged in as registered user or admin
    if ((!currentUser || currentUser.user_role === "guest") && !isAdminLoggedIn) {
      setUserAuthError(
        currentLang === "ar"
          ? "⚠️ الدخول إلى الألعاب التعليمية متاح للأعضاء المسجلين فقط. يرجى تسجيل الدخول أو إنشاء حساب جديد مجاناً للمرح والتعلم!"
          : "⚠️ Access to Educational Games is available for registered members only. Please log in or create a new free account to play and learn!"
      );
      setUserModalTab("login");
      setShowUserModal(true);
      return;
    }

    setShowGamesSidebar(true);
    setActiveMiniGame(null); // default view shows the vertical games list
  };

  // 📢 Breaking News & Live Broadcasting Settings
  const [breakingNews, setBreakingNews] = useState(() => {
    try {
      const stored = localStorage.getItem("sudan_edu_breaking_news_setting_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.bgColor === "bg-[#D21034]/95" || parsed.bgColor === "bg-[#D21034]" || parsed.bgColor === "bg-red-950/90" || parsed.bgColor === "bg-slate-100") {
          parsed.bgColor = "bg-slate-900";
          parsed.textColor = "text-slate-100";
          localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(parsed));
        }
        return parsed;
      }
      return {
        enabled: true,
        textAr: "🔴 عاجل: تم تفعيل منصة التعليم لمساندة الطلاب السودانيين للعام الجديد - تصفح المقررات والملخصات والدروس المرئية الآن مجاناً 🇸🇩",
        textEn: "🔴 Breaking: Education platform enabled to support Sudanese students - browse courses, summaries, and video lessons now for free! 🇸🇩",
        speed: "normal",
        bgColor: "bg-slate-900",
        textColor: "text-slate-100",
        direction: "rtl"
      };
    } catch {
      return {
        enabled: true,
        textAr: "🔴 عاجل: تم تفعيل منصة التعليم لمساندة الطلاب السودانيين للعام الجديد - تصفح المقررات والملخصات والدروس المرئية الآن مجاناً 🇸🇩",
        textEn: "🔴 Breaking: Education platform enabled to support Sudanese students - browse courses, summaries, and video lessons now for free! 🇸🇩",
        speed: "normal",
        bgColor: "bg-slate-900",
        textColor: "text-slate-100",
        direction: "rtl"
      };
    }
  });

  const [isTickerDismissed, setIsTickerDismissed] = useState(() => {
    return sessionStorage.getItem("sudan_edu_ticker_dismissed") === "true";
  });

  const [tickerDirection, setTickerDirection] = useState<"rtl" | "ltr">(() => {
    return (localStorage.getItem("sudan_edu_ticker_direction") as "rtl" | "ltr") || "rtl";
  });

  // 🔔 Notification States & Realtime counters
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationDropdownRef.current && 
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationsDropdown(false);
      }
    }
    if (showNotificationsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationsDropdown]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [recentChatMessages, setRecentChatMessages] = useState<any[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [lastCheckedChat, setLastCheckedChat] = useState<string>(() => localStorage.getItem("sudan_chat_last_read") || new Date(0).toISOString());
  const [lastCheckedUpdates, setLastCheckedUpdates] = useState<string>(() => localStorage.getItem("sudan_updates_last_read") || new Date(0).toISOString());
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showPushPrompt, setShowPushPrompt] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return false;
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasPermission = Notification.permission;
    const dismissed = localStorage.getItem("sudan_push_dismissed") === "true";
    return isMobileOrTablet && hasPermission === "default" && !dismissed;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [currentLang, setCurrentLang] = useState<"ar" | "en">(() => {
    return (localStorage.getItem("sudan_edu_lang") as "ar" | "en") || "ar";
  });

  const t = (key: string): string => {
    if (uiTranslations[currentLang] && (uiTranslations[currentLang] as any)[key]) {
      return (uiTranslations[currentLang] as any)[key];
    }
    if (currentLang === "en" && stageAndGradeTranslations[key]) {
      return stageAndGradeTranslations[key];
    }
    return key;
  };



  const refreshLiveLessonsList = async () => {
    try {
      const cloudLessons = await fetchLiveLessonsFromSupabase();
      setLiveLessons(cloudLessons);
    } catch (err) {
      console.error("Failed to refresh live lessons:", err);
    }
  };

  // Global ripple click effect initializer for superb touch and click response
  useEffect(() => {
    const handleGlobalRipple = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find closest button, link, role="button", or elements categorized as card/trigger/pointer
      const trigger = target.closest('button, a, [role="button"], .cursor-pointer, .group, .ripple-trigger') as HTMLElement | null;

      if (!trigger) return;

      // Avoid triggering on standard editable fields to preserve focus flow
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Ensure the clickable element is styled with relative position so ripple is masked
      const computedStyle = window.getComputedStyle(trigger);
      if (computedStyle.position === "static") {
        trigger.style.position = "relative";
      }

      const prevOverflow = trigger.style.overflow;
      trigger.style.overflow = "hidden";

      // Calculate absolute click offsets relative to the parent bounding coordinates
      const rect = trigger.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Select maximum bounding radius to cover the diagonal corners smoothly
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple-circle";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Smart color selector: use dark ripple on light backgrounds, light ripple on dark backgrounds
      const isLightBg = trigger.classList.contains("bg-white") || 
                        trigger.classList.contains("bg-yellow-400") || 
                        trigger.classList.contains("bg-yellow-350") || 
                        trigger.classList.contains("bg-pink-400") || 
                        trigger.classList.contains("bg-emerald-400") ||
                        trigger.classList.contains("bg-emerald-300") ||
                        trigger.classList.contains("bg-slate-100");

      ripple.style.backgroundColor = isLightBg 
        ? "rgba(0, 0, 0, 0.16)" 
        : "rgba(255, 255, 255, 0.28)";

      trigger.appendChild(ripple);

      // Clean up DOM node once animation ends
      ripple.addEventListener("animationend", () => {
        ripple.remove();
        if (prevOverflow) {
          trigger.style.overflow = prevOverflow;
        }
      });
    };

    document.addEventListener("mousedown", handleGlobalRipple);
    return () => {
      document.removeEventListener("mousedown", handleGlobalRipple);
    };
  }, []);

  // 📈 تحميل وزيادة عداد زوار المنصة التعليمية
  useEffect(() => {
    const handleVisitorCount = async () => {
      try {
        const sessionKey = "nakla_visitor_counted_v1";
        const hasVisited = sessionStorage.getItem(sessionKey);
        
        let url = getApiUrl("/api/visitor-count");
        let method = "GET";
        
        if (!hasVisited) {
          url = getApiUrl("/api/visitor-count/increment");
          method = "POST";
        }
        
        const res = await fetch(url, { method });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && typeof data.count === "number") {
            setVisitorCount(data.count);
            if (!hasVisited) {
              sessionStorage.setItem(sessionKey, "true");
            }
          }
        }
      } catch (err) {
        console.error("Failed to process visitor count:", err);
      }
    };
    
    handleVisitorCount();
  }, []);

  // Load from Supabase on start if available and subscribe to Webhook SSE events
  useEffect(() => {
    const hasBackendUrl = !!localStorage.getItem("sudan_backend_url");
    const isStaticDeployment = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("github.io");

    const loadSupabaseData = async () => {
      try {
        // 1. Try to fetch dynamic Supabase keys from the server first to bootstrap all client instances
        if (!isStaticDeployment || hasBackendUrl) {
          try {
            const configRes = await fetch(getApiUrl("/api/config/supabase"));
            if (configRes.ok) {
              const configData = await configRes.json();
              if (configData.isConfigured && configData.url && configData.anonKey) {
                const currentCfg = getSupabaseConfig();
                // Only save if it's different to prevent redundant writes
                if (currentCfg.url !== configData.url || currentCfg.anonKey !== configData.anonKey) {
                  console.log("Bootstrapping client Supabase connection parameters from production server environmental keys...");
                  saveSupabaseConfig(configData.url, configData.anonKey);
                }
              }
            }
          } catch (configErr) {
            console.warn("Could not check backend Supabase config fallback, continuing client-side check.", configErr);
          }
        }

        // 2. Fetch the actual content from Supabase
        const cloudData = await fetchCurriculumFromSupabase();
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          setCurriculumData(cloudData);
          console.log("Successfully loaded dynamic curriculum from Supabase database!");
        }

        // Fetch live lessons
        try {
          const cloudLessons = await fetchLiveLessonsFromSupabase();
          setLiveLessons(cloudLessons);
        } catch (err) {
          console.error("Failed to load initial live lessons from Supabase:", err);
        }
      } catch (err) {
        console.error("Failed to load dynamic curriculum from Supabase", err);
      }
    };
    loadSupabaseData();

    // Verify and synchronize active Google OAuth session
    const syncGoogleUserSession = async () => {
      try {
        const checkUser = await checkAndSyncGoogleSession();
        if (checkUser) {
          console.log("Synchronized and logged in Google active session:", checkUser);
          setCurrentUser(checkUser);
          localStorage.setItem("sudan_auth_user", JSON.stringify(checkUser));
          setSaveStatus(`👋 مرحبًا بك مجددًا يا ${checkUser.username}! تم تسجيل دخولك بنجاح بنظام سوبابيس.`);
          setTimeout(() => setSaveStatus(null), 5000);
        }
      } catch (e) {
        console.warn("Failed checking/syncing active Google session:", e);
      }
    };
    syncGoogleUserSession();

    // ⚡ Subscribe to server-sent events for instant Supabase Webhook notification updates
    let eventSource: EventSource | null = null;
    if (!isStaticDeployment || hasBackendUrl) {
      try {
        eventSource = new EventSource(getApiUrl("/api/events"));
        
        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "reload_curriculum") {
              console.log("Received instant sync webhook trigger from server:", data);
              setSaveStatus("⚡ تحديث تلقائي فوري: تم رصد تعديل في قاعدة البيانات سوبابيس، جاري مزامنة الموقع...");
              const freshData = await fetchCurriculumFromSupabase();
              if (freshData && Array.isArray(freshData) && freshData.length > 0) {
                setCurriculumData(freshData);
                localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(freshData));
                setSaveStatus("✅ تم مزامنة وتحديث بيانات المناهج فورياً دون الحاجة لتحديث الصفحة! ⚡");
                setTimeout(() => setSaveStatus(null), 4000);
              } else {
                setSaveStatus(null);
              }
            }
          } catch (err) {
            console.error("SSE parsing error:", err);
          }
        };
      } catch (err) {
        console.warn("Failed to initialize backend EventSource:", err);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // 🔐 Admin state variables & credentials management
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("sudan_edu_admin") === "true";
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [showHiddenAdminGate, setShowHiddenAdminGate] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.search.includes("admin") || window.location.search.includes("management") || localStorage.getItem("sudan_edu_admin") === "true";
    }
    return false;
  });
  const [trimClickCount, setTrimClickCount] = useState(0);

  const handleTrimClick = () => {
    const nextCount = trimClickCount + 1;
    setTrimClickCount(nextCount);
    if (nextCount >= 5) {
      setShowHiddenAdminGate(true);
      setShowAdminLogin(true);
      setAdminLoginError("");
      setAdminUsername("");
      setAdminPassword("");
      setSaveStatus("🔓 تم تنشيط وإظهار بوابة دخول الإدارة السرية ونموذج تسجيل الدخول بنجاح.");
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // 🖼️ Custom Banner Image/Video settings (defined directly in the code for developers)
  // To change the banner media, edit the initial state values directly in the code here:
  const [bannerImageUrl, setBannerImageUrl] = useState<string>("");
  const [bannerMediaType, setBannerMediaType] = useState<"image" | "video">("https://drive.google.com/file/d/1GbK99NfvbfVHIvRlv7F0XWfOIgVTIx0X/view?usp=sharing");
  
  // Dummy handlers to disable the UI-based banner editor modal
  const showBannerEditModal = false;
  const tempBannerUrl = "" as string;
  const tempBannerMediaType = "image" as "image" | "video";
  const setTempBannerUrl = (val: string) => {};
  const setTempBannerMediaType = (val: "image" | "video") => {};
  const setShowBannerEditModal = (val: boolean) => {};

  // 👤 Student & general user registration & login states (for standard 'users' table)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem("sudan_auth_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn("Could not load user session cached:", e);
      }
    }
    return null;
  });

  // 🎈 Kid-Friendly Mode States (المرحلة الابتدائية وبراعم الأطفال)
  const [kidModeOverride, setKidModeOverride] = useState<boolean | null>(null);
  const [mascotMessage, setMascotMessage] = useState<string>("مرحباً بك يا بطل المناهج! أنا صديقك سمسم الفُضولي الذكي، اضغط عليّ لتسمع أهم مغامرة في السودان اليوم! 🦊🌟");
  const [mascotAnimState, setMascotAnimState] = useState<"idle" | "celebrate" | "speak">("idle");

  const isKidModeActive = React.useMemo(() => {
    if (kidModeOverride !== null) return kidModeOverride;
    // Auto-detect based on profile (grade ID starting with "pri-" or "kg-")
    const isKidProfile = currentUser?.user_role === "student" && (
      currentUser?.grade_id?.startsWith("pri-") || 
      currentUser?.grade_id?.startsWith("kg-")
    );
    // Or if currently active/selected stage is primary (elementary) or kindergarten
    const isKidStage = selectedStage?.id === "primary" || selectedStage?.id === "kindergarten";
    return !!(isKidProfile || isKidStage);
  }, [kidModeOverride, currentUser, selectedStage]);

  // 🔐 Verify if current user account is registered and not deleted/inactive in Supabase
  useEffect(() => {
    const verifyUserExistence = async () => {
      if (currentUser) {
        try {
          const { exists, active } = await checkUserExistsAndActive(currentUser.id);
          if (!exists || !active) {
            // Log out
            setCurrentUser(null);
            localStorage.removeItem("sudan_auth_user");
            setUserAuthError("⚠️ لا يوجد حساب نشط حالياً، نأمل التسجيل بالموقع.");
            setUserModalTab("register");
            setShowUserModal(true);
            alert("⚠️ لا يوجد حساب نشط حالياً، نأمل التسجيل بالموقع.");
          }
        } catch (e) {
          console.error("Error verifying user session:", e);
        }
      }
    };
    verifyUserExistence();
  }, [currentUser]);

  // 🔔 Push Notification permission request on mobile devices
  useEffect(() => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileDevice && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Mobile notification permission request result:", permission);
        }).catch((err) => {
          console.warn("Notification request failed:", err);
        });
      }
    }
  }, []);

  // Gentle happy sound synth specifically safe for modern browsers
  const playKidChime = (type: 'success' | 'click' | 'magic' = 'click') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        const playNote = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + start + 0.12);
          gain.gain.setValueAtTime(0.04, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.2);
        };
        playNote(523.25, 0); // C5
        playNote(659.25, 0.06); // E5
        playNote(783.99, 0.12); // G5
      } else {
        const playNote = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.03, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.3);
        };
        playNote(880, 0);       // A5
        playNote(1046.50, 0.08); // C6
        playNote(1318.51, 0.16); // E6
      }
    } catch (e) {
      console.warn("Audio feedback suspended or unsupported by platform sandbox.", e);
    }
  };

  const [showUserModal, setShowUserModal] = useState(() => {
    return !localStorage.getItem("sudan_auth_user");
  });
  const [userModalTab, setUserModalTab] = useState<"login" | "register" | "profile">("login");
  const [loginRole, setLoginRole] = useState<"student" | "parent" | "admin">("student");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userAuthError, setUserAuthError] = useState("");
  const [userAuthSuccess, setUserAuthSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 🔔 HELPER LOG RETRIEVAL & CREATION ENGINE FOR NOTIFICATIONS
  const logSiteUpdate = async (category: string, titleAr: string, titleEn: string, bodyAr: string, bodyEn: string) => {
    const updateId = `UPD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newUpdate = {
      id: updateId,
      title_ar: titleAr,
      title_en: titleEn,
      body_ar: bodyAr,
      body_en: bodyEn,
      category: category,
      created_at: new Date().toISOString()
    };

    // Update local state and local storage immediately so it reflects in the UI instantly
    setSiteUpdates(prev => {
      const filtered = prev.filter(x => x.id !== updateId);
      const updated = [newUpdate, ...filtered].slice(0, 30);
      try {
        localStorage.setItem("sudan_edu_local_updates_v1", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save site updates to local storage:", err);
      }
      return updated;
    });

    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from("site_updates").insert([newUpdate]);
    } catch (err) {
      console.warn("Could not log site update automatically to Supabase:", err);
    }
  };

  const handleUpdateBreakingNews = async (updated: {
    enabled: boolean;
    textAr: string;
    textEn: string;
    speed: string;
    bgColor: string;
    textColor: string;
    direction?: "rtl" | "ltr";
  }) => {
    // 1. Update state immediately
    setBreakingNews(updated);
    if (updated.direction) {
      setTickerDirection(updated.direction);
      localStorage.setItem("sudan_edu_ticker_direction", updated.direction);
    }
    localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(updated));
    // Reset dismissed state since it's a freshly updated announcement!
    setIsTickerDismissed(false);
    sessionStorage.removeItem("sudan_edu_ticker_dismissed");

    // 2. Broadcast via existing site_updates table
    const configPayload = {
      enabled: updated.enabled,
      speed: updated.speed,
      bgColor: updated.bgColor,
      textColor: updated.textColor,
      direction: updated.direction || "rtl"
    };

    try {
      await logSiteUpdate(
        "breaking_news",
        updated.textAr,
        updated.textEn,
        JSON.stringify(configPayload),
        "broadcast_config"
      );
    } catch (err) {
      console.warn("Could not broadcast news configuration:", err);
    }
  };

  const fetchNotificationData = async () => {
    // 1. Fetch site updates (load local storage first)
    let updates = [];
    try {
      const stored = localStorage.getItem("sudan_edu_local_updates_v1");
      updates = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn(e);
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("site_updates")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && data) {
          updates = data;
          try {
            localStorage.setItem("sudan_edu_local_updates_v1", JSON.stringify(data));
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.warn("Could not fetch cloud site updates, using local cache:", err);
      }
    }
    setSiteUpdates(updates);

    if (!currentUser) {
      setPendingFriendRequests([]);
      return;
    }

    // 2. Fetch pending incoming friend requests
    let frData = [];
    try {
      const storedFr = localStorage.getItem("sudan_edu_local_friendships");
      frData = storedFr ? JSON.parse(storedFr) : [];
    } catch (e) {
      console.warn(e);
    }

    // Always capture pending incoming ones locally
    let pendingFr = frData.filter((f: any) => 
      String(f.receiver_id) === String(currentUser.id) && f.status === "pending"
    );

    if (client) {
      try {
        const { data, error } = await client
          .from("friendships")
          .select("*")
          .eq("receiver_id", String(currentUser.id))
          .eq("status", "pending");

        if (!error && data) {
          frData = data;
          pendingFr = data;
          try {
            localStorage.setItem("sudan_edu_local_friendships", JSON.stringify(data));
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.warn("Could not fetch cloud friendships, using local storage:", err);
      }
    }

    // Translate senderName from users if online, otherwise fallback
    if (client && pendingFr.length > 0) {
      try {
        const senderIds = pendingFr.map((f: any) => parseInt(String(f.sender_id), 10)).filter(id => !isNaN(id));
        if (senderIds.length > 0) {
          const { data: usersData } = await client
            .from("users")
            .select("id, username")
            .in("id", senderIds);
          
          const userMap = new Map(usersData?.map((u: any) => [String(u.id), u.username]) || []);
          const requestsWithSender = pendingFr.map((f: any) => ({
            ...f,
            senderName: f.senderName || userMap.get(String(f.sender_id)) || (currentLang === "ar" ? "طالب آخر" : "Another Peer")
          }));
          setPendingFriendRequests(requestsWithSender);
        } else {
          setPendingFriendRequests([]);
        }
      } catch (err) {
        console.warn("Error parsing sender names, falling back:", err);
        const requestsWithSenderFallback = pendingFr.map((f: any) => ({
          ...f,
          senderName: f.senderName || (currentLang === "ar" ? "زميل دراسة" : "Study Peer")
        }));
        setPendingFriendRequests(requestsWithSenderFallback);
      }
    } else {
      const requestsWithSenderFallback = pendingFr.map((f: any) => ({
        ...f,
        senderName: f.senderName || (currentLang === "ar" ? "زميل دراسة" : "Study Peer")
      }));
      setPendingFriendRequests(requestsWithSenderFallback);
    }

    // 3. Fetch recent chat messages for parsing unread notifications
    if (client) {
      try {
        const { data: msgs, error: msgsError } = await client
          .from("chat_messages")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(30);

        if (!msgsError && msgs) {
          setRecentChatMessages(msgs);
        }
      } catch (err) {
        console.warn("Could not fetch recent chat messages for notifications:", err);
      }
    }
  };

  // Realtime subscription and high-reliability polling fallback
  useEffect(() => {
    fetchNotificationData();

    // 1. Hook instant local custom event listener
    const handleLocalNotificationUpdate = () => {
      fetchNotificationData();
    };
    window.addEventListener("sudan_edu_notification_update", handleLocalNotificationUpdate);

    // 2. High-reliability polling fallback
    const timer = setInterval(() => {
      fetchNotificationData();
    }, 12500);

    // 3. Realtime Supabase channel (if configured)
    const client = getSupabaseClient();
    let channel: any = null;
    let curriculaDebounceTimer: any = null;
    
    if (client) {
      channel = client
        .channel("global-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friendships" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_updates" },
          () => {
            fetchNotificationData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "curricula_links" },
          async () => {
            if (curriculaDebounceTimer) {
              clearTimeout(curriculaDebounceTimer);
            }
            curriculaDebounceTimer = setTimeout(async () => {
              console.log("⚡ Realtime Update: Curriculum links updated on Supabase, refreshing data...");
              try {
                const freshData = await fetchCurriculumFromSupabase();
                if (freshData && Array.isArray(freshData) && freshData.length > 0) {
                  setCurriculumData(freshData);
                  localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(freshData));
                }
              } catch (err) {
                console.warn("Realtime curriculum refresh failed:", err);
              }
            }, 1000); // 1 second debounce
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "live_lessons" },
          async () => {
            console.log("⚡ Realtime Update: Live lessons updated on Supabase, refreshing data...");
            try {
              const freshLessons = await fetchLiveLessonsFromSupabase();
              setLiveLessons(freshLessons);
            } catch (err) {
              console.warn("Realtime live lessons refresh failed:", err);
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener("sudan_edu_notification_update", handleLocalNotificationUpdate);
      clearInterval(timer);
      if (curriculaDebounceTimer) {
        clearTimeout(curriculaDebounceTimer);
      }
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [currentUser]);

  // Synchronize breaking news whenever site updates load or refresh from either storage or database
  useEffect(() => {
    const breakingUpdate = siteUpdates.find(upd => upd.category === "breaking_news");
    if (breakingUpdate) {
      try {
        let config: any = {};
        if (breakingUpdate.body_ar) {
          try {
            config = JSON.parse(breakingUpdate.body_ar);
          } catch {
            // fallback
          }
        }
        const updated = {
          enabled: config.enabled !== undefined ? config.enabled : true,
          textAr: breakingUpdate.title_ar || "",
          textEn: breakingUpdate.title_en || "",
          speed: config.speed || "normal",
          bgColor: config.bgColor || "bg-slate-900",
          textColor: config.textColor || "text-slate-100",
          direction: config.direction || "rtl"
        };
        setBreakingNews(updated);
        if (config.direction) {
          setTickerDirection(config.direction);
          localStorage.setItem("sudan_edu_ticker_direction", config.direction);
        }
        localStorage.setItem("sudan_edu_breaking_news_setting_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not parse sync breaking news:", e);
      }
    }
  }, [siteUpdates]);

  // Filter stages based on logged-in student profile, parent selected grades, or admin view
  const displayedStages = React.useMemo(() => {
    if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
      const studentStage = curriculumData.find(stage => 
        stage.grades.some(g => g.id === currentUser.grade_id)
      );
      if (studentStage) {
        return [studentStage];
      }
    }
    if (currentUser && currentUser.user_role === "parent" && currentUser.specialties) {
      const parentGrades = currentUser.specialties.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (parentGrades.length > 0) {
        return curriculumData
          .map(stage => {
            const filteredGrades = stage.grades.filter(grade => parentGrades.includes(grade.name));
            return {
              ...stage,
              grades: filteredGrades
            };
          })
          .filter(stage => stage.grades.length > 0);
      }
    }
    return curriculumData;
  }, [curriculumData, currentUser]);

  const triggerEditProfile = () => {
    if (!currentUser) return;
    setUserEmail(currentUser.email);
    setUserUsername(currentUser.username);
    setUserPassword(""); // Keep password input blank unless they want to change it
    const currentRole = currentUser.user_role === "teacher" 
      ? "teacher" 
      : currentUser.user_role === "parent" 
        ? "parent" 
        : "student";
    setRegUserRole(currentRole);
    setRegGradeId(currentUser.grade_id || "");
    setRegContactMethod(currentUser.contact_method || "");
    if (currentRole === "parent" && currentUser.specialties) {
      setSelectedParentStages(currentUser.specialties.split(",").map((x: string) => x.trim()));
    } else {
      setSelectedParentStages([]);
    }
    if (currentRole === "teacher" && currentUser.specialties) {
      setSelectedSpecialties(currentUser.specialties.split(", ").map((x: string) => x.trim()));
    } else {
      setSelectedSpecialties([]);
    }
    setUserAuthError("");
    setUserAuthSuccess("");
    setUserModalTab("profile");
    setShowUserModal(true);
  };

  // =========================================================================
  // 👪 Parent Portal & Children Monitoring Feature Engine
  // =========================================================================

  const fetchParentRelations = async () => {
    if (!currentUser || currentUser.user_role !== "parent") return;
    try {
      setIsParentPortalLoading(true);
      const client = getSupabaseClient();
      
      // Fetch all registered users to construct the directory
      const users = await fetchAllRegisteredUsers();
      setAllRegisteredUsers(users);

      let links: any[] = [];
      if (client) {
        const { data, error } = await client
          .from("friendships")
          .select("*")
          .eq("sender_id", currentUser.id)
          .eq("status", "parent_child");
        
        if (!error && data) {
          links = data;
        }
      } else {
        // Local fallback
        const stored = localStorage.getItem(`sudan_parent_links_${currentUser.id}`);
        links = stored ? JSON.parse(stored) : [];
      }
      setParentChildrenLinks(links);
    } catch (err) {
      console.warn("Error fetching parent relations:", err);
    } finally {
      setIsParentPortalLoading(false);
    }
  };

  const handleLinkChild = async (student: AppUser) => {
    if (!currentUser) return;
    try {
      const client = getSupabaseClient();
      const linkId = "_" + Math.random().toString(36).substr(2, 9);
      const payload = {
        id: linkId,
        sender_id: currentUser.id,
        receiver_id: student.id,
        status: "parent_child",
        created_at: new Date().toISOString()
      };

      if (client) {
        const { error } = await client.from("friendships").insert([payload]);
        if (error) {
          console.warn("Supabase insert error, falling back:", error);
        }
      }

      // Update local storage and state
      setParentChildrenLinks(prev => {
        const updated = [...prev, payload];
        localStorage.setItem(`sudan_parent_links_${currentUser.id}`, JSON.stringify(updated));
        return updated;
      });

      alert(currentLang === "ar" 
        ? `🎉 تم ربط حساب الابن (${student.username}) بنجاح بمتابعتك!` 
        : `🎉 Student (${student.username}) linked to your monitoring account successfully!`
      );
      
      // Refresh relations
      fetchParentRelations();
    } catch (err: any) {
      alert("⚠️ Error linking child: " + (err.message || err));
    }
  };

  const handleUnlinkChild = async (linkId: string, childName: string) => {
    if (!window.confirm(currentLang === "ar" 
      ? `هل أنت متأكد من إلغاء ربط حساب ${childName}؟` 
      : `Are you sure you want to unlink ${childName}?`
    )) return;

    try {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from("friendships").delete().eq("id", linkId);
        if (error) {
          console.warn("Supabase delete error, falling back:", error);
        }
      }

      setParentChildrenLinks(prev => {
        const updated = prev.filter(l => l.id !== linkId);
        localStorage.setItem(`sudan_parent_links_${currentUser!.id}`, JSON.stringify(updated));
        return updated;
      });

      if (selectedChildForReport && String(parentChildrenLinks.find(l => l.id === linkId)?.receiver_id) === String(selectedChildForReport.id)) {
        setSelectedChildForReport(null);
      }
      
      fetchParentRelations();
    } catch (err: any) {
      alert("⚠️ Error: " + (err.message || err));
    }
  };

  // Student stay duration tracking
  const logStudentSubjectTime = async (userId: string, subjectId: string, subjectName: string, elapsedSeconds: number) => {
    try {
      let logs: any[] = [];
      const localKey = `sudan_edu_student_logs_${userId}`;
      const localStored = localStorage.getItem(localKey);
      
      // Try to get logs from currentUser first
      if (currentUser?.contact_method && currentUser.contact_method.trim().startsWith("[")) {
        try {
          logs = JSON.parse(currentUser.contact_method);
        } catch {
          logs = [];
        }
      } else if (localStored) {
        try {
          logs = JSON.parse(localStored);
        } catch {
          logs = [];
        }
      }

      const existingIndex = logs.findIndex(item => item.subjectId === subjectId);
      if (existingIndex > -1) {
        logs[existingIndex].totalDurationSeconds = (logs[existingIndex].totalDurationSeconds || 0) + elapsedSeconds;
        logs[existingIndex].openCount = (logs[existingIndex].openCount || 0) + 1;
        logs[existingIndex].lastOpened = new Date().toISOString();
      } else {
        logs.push({
          subjectId,
          subjectName,
          openCount: 1,
          totalDurationSeconds: elapsedSeconds,
          lastOpened: new Date().toISOString()
        });
      }

      const logsString = JSON.stringify(logs);
      
      // Update local storage
      localStorage.setItem(localKey, logsString);
      
      // Update currentUser state locally so it's fresh
      setCurrentUser(prev => prev ? { ...prev, contact_method: logsString } : null);

      // Save to Supabase
      await updateCurrentUserProfile(userId, {
        contact_method: logsString
      });
      
      console.log(`Successfully logged ${elapsedSeconds}s for ${subjectName}`);
    } catch (err) {
      console.warn("Error logging student subject stay time:", err);
    }
  };

  const subjectStartTimeRef = useRef<number | null>(null);
  const activeSubjectRef = useRef<any>(null);

  useEffect(() => {
    // If there was an active subject and user is student, calculate stay time on close
    if (activeSubjectRef.current && currentUser?.user_role === "student") {
      const startTime = subjectStartTimeRef.current;
      if (startTime) {
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        if (elapsedSeconds >= 1) { // Track if they stayed at least 1 second
          const subjectToLog = activeSubjectRef.current;
          
          // Save the log!
          logStudentSubjectTime(currentUser.id, subjectToLog.id, subjectToLog.name, elapsedSeconds);
        }
      }
    }

    // Set up new subject tracking
    if (activeSubject && currentUser?.user_role === "student") {
      subjectStartTimeRef.current = Date.now();
      activeSubjectRef.current = activeSubject;
    } else {
      subjectStartTimeRef.current = null;
      activeSubjectRef.current = null;
    }
  }, [activeSubject, currentUser]);

  // Handle Parent Portal loading when current user role is parent
  useEffect(() => {
    if (currentUser && currentUser.user_role === "parent") {
      fetchParentRelations();
    }
  }, [currentUser]);

  // Guard function: Don't allow opening materials/subjects if not logged in or if logged in as a guest
  const handleOpenSubject = (subject: any) => {
    // Resolve correct stageId, gradeId, and gradeName by searching curriculumData tree
    let resolvedStageId = subject.stageId || "";
    let resolvedGradeId = subject.gradeId || "";
    let resolvedGradeName = subject.gradeName || "";

    let found = false;
    for (const stage of curriculumData) {
      for (const grade of stage.grades) {
        if (grade.subjects.some(sub => sub.id === subject.id)) {
          resolvedStageId = stage.id;
          resolvedGradeId = grade.id;
          resolvedGradeName = grade.name;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const enrichedSubject = {
      ...subject,
      stageId: resolvedStageId,
      gradeId: resolvedGradeId,
      gradeName: resolvedGradeName
    };

    setActiveSubject(enrichedSubject);
    setRecentSubjects(prev => {
      const filtered = prev.filter(s => s.id !== subject.id);
      const updated = [enrichedSubject, ...filtered].slice(0, 3);
      try {
        localStorage.setItem("sudan_edu_recent_subjects", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save recent subjects to localStorage", err);
      }
      return updated;
    });
  };

  // 🎓 Student, Teacher, & Parent Custom Fields
  const [regUserRole, setRegUserRole] = useState<"student" | "teacher" | "parent">("student");
  const [regGradeId, setRegGradeId] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedParentStages, setSelectedParentStages] = useState<string[]>([]);
  const [regContactMethod, setRegContactMethod] = useState("");

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = adminUsername.trim();
    
    // 1. First try to authenticate against the Supabase DB
    let authenticated = false;
    try {
      authenticated = await verifyAdminInSupabase(cleanUser, adminPassword);
    } catch (err) {
      console.warn("DB authentication check yielded error:", err);
    }

    // 2. If DB validation succeeded, or fallback user matched standard offline password (securely obfuscated)
    const isOfflineFallback = 
      (cleanUser.toLowerCase() === deobfuscateString("3219090000220b074b") || cleanUser.toLowerCase() === deobfuscateString("321109080005170056515c18350814")) && 
      (adminPassword === deobfuscateString("614557515c755245") || adminPassword === deobfuscateString("200000000077544704"));

    if (authenticated || isOfflineFallback) {
      setIsAdminLoggedIn(true);
      localStorage.setItem("sudan_edu_admin", "true");
      setShowAdminLogin(false);
      setShowAdminDashboard(true); // Automatically toggle on dynamic edit panel
      setAdminLoginError("");
      
      // Clear password inputs immediately on success to prevent them from remaining in memory
      setAdminPassword("");
      setUserPassword("");

      const welcomeMsg = authenticated 
        ? `مرحباً بك يا ${cleanUser}! تم التحقق من هويتك سحابياً عبر جدول admin_users بنجاح 🔑`
        : `مرحباً بك يا أستاذ عثمان المنقوري! تم تفعيل دخول الإدارة والمزامنة بالهوية الاحتياطية بنجاح 🔑`;
        
      setSaveStatus(welcomeMsg);
      setTimeout(() => setSaveStatus(null), 6000);
    } else {
      setAdminLoginError("اسم المستخدم أو كلمة المرور غير صحيحة! يرجى التحقق من جدول admin_users في سوبابيس أو استخدام كلمة المرور الاحتياطية.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminDashboard(false);
    setShowHiddenAdminGate(false);
    setTrimClickCount(0);
    localStorage.removeItem("sudan_edu_admin");
    // Clear all credentials inputs to protect user data on shared devices
    setAdminUsername("");
    setAdminPassword("");
    setUserEmail("");
    setUserPassword("");
    setUserUsername("");
    setSaveStatus("تم تسجيل الخروج من لوحة الإدارة بنجاح.");
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    try {
      if (!userUsername.trim()) {
        setUserAuthError("⚠️ يرجى تزويد اسم مستخدم أو اسم ثلاثي صحيح.");
        setIsAuthLoading(false);
        return;
      }
      if (!userEmail.includes("@")) {
        setUserAuthError("⚠️ يرجى تزويد بريد إلكتروني صحيح لتسجيل الدخول.");
        setIsAuthLoading(false);
        return;
      }
      if (userPassword.length < 4) {
        setUserAuthError("⚠️ كلمة المرور يجب أن لا تقل عن ٤ خانات لتأمين حسابك.");
        setIsAuthLoading(false);
        return;
      }

      const checkConfig = getSupabaseConfig();
      if (!checkConfig.isConfigured) {
        setUserAuthError("⚠️ سوبابيس (Supabase) غير مهيأة بعد من قبل مسؤول النظام. يرجى تهيئتها أولاً.");
        setIsAuthLoading(false);
        return;
      }

      // Extract Student Grade Details
      let resolvedGradeId = undefined;
      let resolvedGradeName = undefined;
      if (regUserRole === "student") {
        const fallbackGradeId = regGradeId || curriculumData[0]?.grades[0]?.id || "";
        resolvedGradeId = fallbackGradeId;
        const matchedGrade = curriculumData.flatMap(stage => stage.grades).find(g => g.id === fallbackGradeId);
        resolvedGradeName = matchedGrade ? matchedGrade.name : "";
      }

      // Extract Teacher Specialties & Contact Methods or Parent Stages
      let resolvedSpecialties = undefined;
      let resolvedContactMethod = undefined;
      if (regUserRole === "teacher") {
        if (selectedSpecialties.length === 0) {
          setUserAuthError("⚠️ يرجى تحديد مادة واحدة على الأقل لتخصصك الدراسي.");
          setIsAuthLoading(false);
          return;
        }
        if (!regContactMethod.trim()) {
          setUserAuthError("⚠️ يرجى تزويد رقم الهاتف أو وسيلة تواصل صحيحة لتلقي التراخيص.");
          setIsAuthLoading(false);
          return;
        }
        resolvedSpecialties = selectedSpecialties.join(", ");
        resolvedContactMethod = regContactMethod.trim();
      } else if (regUserRole === "parent") {
        if (selectedParentStages.length === 0) {
          setUserAuthError("⚠️ يرجى تحديد صف دراسي واحد على الأقل لأبنائك.");
          setIsAuthLoading(false);
          return;
        }
        resolvedSpecialties = selectedParentStages.join(",");
      }

      const res = await registerUser(
        userUsername, 
        userEmail, 
        userPassword, 
        "email",
        regUserRole,
        resolvedGradeId,
        resolvedGradeName,
        resolvedSpecialties,
        resolvedContactMethod
      );

      if (res.success && res.user) {
        if (regUserRole === "teacher") {
          setUserAuthSuccess("🎉 تم تسجيل حسابك كمعلم بنجاح! يخضع حسابك المبرمج حالياً للمراجعة من قبل الإدارة وسنتواصل معك قريباً.");
        } else if (regUserRole === "parent") {
          setUserAuthSuccess("🎉 تم تسجيل حسابك كولي أمر بنجاح! يمكنك الآن تصفح المنصة والتواصل مع المعلمين ومتابعة المناهج.");
        } else {
          setUserAuthSuccess("🎉 تم تسجيل حسابك والدخول كطالب بنجاح!");
          // Save registration grade selection timestamp for student
          localStorage.setItem("sudan_grade_updated_at_" + res.user.id, String(Date.now()));
        }
        setCurrentUser(res.user);
        localStorage.setItem("sudan_auth_user", JSON.stringify(res.user));
        
        setSaveStatus(`👋 مرحبًا بك يا ${res.user.username}! تم تسجيل حسابك وعملك كسوبابيس.`);
        setTimeout(() => setSaveStatus(null), 5000);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 3000);
      } else {
        setUserAuthError(res.error || "فشل التسجيل. يرجى مراجعة إعدادات قاعدة البيانات.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء عملية التسجيل: ${err.message || err}`);
    } {
      setIsAuthLoading(false);
    }
  };

  const handleEnterAsGuest = () => {
    const guestUser: AppUser = {
      id: "guest_" + Math.random().toString(36).substr(2, 6),
      username: currentLang === "ar" ? "زائر المنصة 👤" : "Guest User 👤",
      email: "guest@sudan-edu.com",
      provider: "guest",
      user_role: "guest",
      created_at: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    localStorage.setItem("sudan_auth_user", JSON.stringify(guestUser));
    setShowUserModal(false);
    setSaveStatus(currentLang === "ar" ? "مرحباً بك كزائر للمنصة! يمكنك التصفح بحرية كاملة 🚪✨" : "Welcome as a guest! You can now browse freely 🚪✨");
    setTimeout(() => setSaveStatus(null), 5000);
  };

  const handleRequestPushPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSaveStatus("🔔 تم تفعيل إشعارات الجوال بنجاح! ستصلك التنبيهات مباشرة.");
        new Notification("المناهج السودانية 🇸🇩", {
          body: "شكراً لتفعيل الإشعارات! ستصلك تحديثات المناهج هنا فوراً.",
        });
      } else {
        setSaveStatus("⚠️ لم يتم تفعيل الإشعارات. يمكنك تفعيلها من إعدادات المتصفح.");
      }
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err) {
      console.warn("Could not request notification permission:", err);
    }
    setShowPushPrompt(false);
    localStorage.setItem("sudan_push_dismissed", "true");
  };

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false);
    localStorage.setItem("sudan_push_dismissed", "true");
  };

  // 📱 Mobile screen hardware / virtual back button management
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If user went back, let's close open sections one by one
      if (activeSubject) {
        setActiveSubject(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (addSubjectState) {
        setAddSubjectState(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showStudentChat) {
        setShowStudentChat(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showStudyCamp) {
        setShowStudyCamp(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showEducationalMindMap) {
        setShowEducationalMindMap(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (showAdminDashboard) {
        setShowAdminDashboard(false);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (activeGrade) {
        setActiveGrade(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
      if (selectedStage) {
        setSelectedStage(null);
        event.preventDefault();
        window.history.pushState({ app: "sudan-edu" }, "");
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

  // Push state to history whenever any view changes to enable the back button
  useEffect(() => {
    const hasActiveSubView = 
      !!activeSubject || 
      !!addSubjectState || 
      showStudentChat || 
      showStudyCamp || 
      showEducationalMindMap || 
      showAdminDashboard || 
      !!activeGrade || 
      !!selectedStage;

    if (hasActiveSubView) {
      if (window.history.state?.app !== "subview") {
        window.history.pushState({ app: "subview" }, "");
      }
    }
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

  // Exit prompt confirmation to avoid accidental close on exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActiveSubView = 
        !!activeSubject || 
        !!addSubjectState || 
        showStudentChat || 
        showStudyCamp || 
        showEducationalMindMap || 
        showAdminDashboard || 
        !!activeGrade || 
        !!selectedStage;
      
      if (!hasActiveSubView) {
        e.preventDefault();
        e.returnValue = "هل أنت متأكد من مغادرة التطبيق؟";
        return "هل أنت متأكد من مغادرة التطبيق؟";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    activeSubject,
    addSubjectState,
    showStudentChat,
    showStudyCamp,
    showEducationalMindMap,
    showAdminDashboard,
    activeGrade,
    selectedStage
  ]);

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    try {
      const cleanEmail = userEmail.trim().toLowerCase();
      
      // Admin Login Option inside Student/User modal
      if (cleanEmail === deobfuscateString("321109080005170056515c18350814") && (sha256(userPassword) === "7322a90b9246e190b817891970e4ed6fb2f622509e17eebfe33cfff81f69e0a2" || sha256(userPassword) === "99653fbcbba0a2b7e6b8a032c8beb3385e2fc85c0f6eb6484f4e48c00d607944")) {
        setIsAdminLoggedIn(true);
        localStorage.setItem("sudan_edu_admin", "true");
        setShowHiddenAdminGate(true);
        setShowAdminDashboard(true);
        
        const adminUser: AppUser = {
          id: "admin-master-id-123",
          username: "عثمان المنقوري 👑",
          email: "admin@sudan.edu",
          provider: "database",
          user_role: "teacher",
          created_at: new Date().toISOString()
        };
        setCurrentUser(adminUser);
        localStorage.setItem("sudan_auth_user", JSON.stringify(adminUser));

        // Clear password immediately on success to prevent it from remaining in memory
        setUserPassword("");
        setAdminPassword("");
 
        setUserAuthSuccess("🟢 تم تسجيل دخول المسؤول بنجاح! جاري تفعيل لوحة الإدارة...");
        setSaveStatus("مرحباً بك يا أستاذ عثمان المنقوري! تم تفعيل لوحة التحكم والمزامنة بالهوية الاحتياطية بنجاح 🔑");
        setTimeout(() => setSaveStatus(null), 6000);
 
        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
        return;
      }
 
      if (!userEmail.includes("@")) {
        setUserAuthError("⚠️ يرجى إدخال بريد إلكتروني صحيح.");
        setIsAuthLoading(false);
        return;
      }
 
      const checkConfig = getSupabaseConfig();
      if (!checkConfig.isConfigured) {
        setUserAuthError("⚠️ سوبابيس غير مهيأة بعد من قبل المسؤول.");
        setIsAuthLoading(false);
        return;
      }
 
      // Try table login
      const res = await loginUser(userEmail, userPassword);
      if (res.success && res.user) {
        setUserAuthSuccess("🟢 تم التحقق وتسجيل الدخول بنجاح!");
        setCurrentUser(res.user);
        localStorage.setItem("sudan_auth_user", JSON.stringify(res.user));
        
        // Clear password immediately on success to prevent it from remaining in memory
        setUserPassword("");
        setAdminPassword("");
 
        setSaveStatus(`👋 مرحبًا بك مجددًا يا ${res.user.username}! تصفح ممتع للمناهج السودانية.`);
        setTimeout(() => setSaveStatus(null), 5050);
 
        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
      } else {
        setUserAuthError(res.error || "خطأ غير معروف في التحقق من الحساب.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء عملية الدخول: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleMascotClick = () => {
    const messages = [
      currentLang === "ar"
        ? "يا بطل المناهج! أنا فخور جداً بوجودك هنا لتتعلم اليوم وتفهم المنهج السوداني الرائع! 🦊✨"
        : "Yay champ! I'm so proud of you for being here to learn and understand the wonderful Sudanese curriculum! 🦊✨",
      currentLang === "ar"
        ? "هل علمت؟ التعليم هو سلاحك لتبني وطناً جميلاً وتصبح مخترعاً أو مهندساً عظيماً! 🇸🇩❤️"
        : "Did you know? Education is your tool to build our beautiful homeland and become a great scientist or architect! 🇸🇩❤️",
      currentLang === "ar"
        ? "أنت ذكي ومميز جداً! واصل حل التدريب واكسب نجوم التلميذ المتميز اليوم وشاركها مع أهلك! ⭐🏆"
        : "You are super smart and special! Continue completing lessons and win today's brilliant pupil stars! ⭐🏆",
      currentLang === "ar"
        ? "أهلاً بك في سفينة العلوم والرياضيات واللغة العربية.. لننطلق للفضاء سوياً ونكتشف الكواكب! 🚀👽"
        : "Welcome to the ship of science, math, and Arabic... let's launch into space together and explore planets! 🚀👽",
      currentLang === "ar"
        ? "منصة السودان تسعد برؤية ضحكتك ومذاكرتك اليومية! مذاكرة ممتعة وسهلة جداً! 😊🍭"
        : "Sudan platform loves to see your smile and daily study logs! Have a fun and easy study session! 😊🍭"
    ];
    
    let nextMsg = messages[Math.floor(Math.random() * messages.length)];
    while (nextMsg === mascotMessage) {
      nextMsg = messages[Math.floor(Math.random() * messages.length)];
    }
    
    setMascotMessage(nextMsg);
    setMascotAnimState("celebrate");
    playKidChime("magic");
    setTimeout(() => {
      setMascotAnimState("idle");
    }, 850);
  };

  const handleUserProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUserAuthError("");
    setUserAuthSuccess("");
    setIsAuthLoading(true);

    type ProfileUpdateFields = {
      username: string;
      password?: string;
      grade_id?: string;
      grade_name?: string;
      specialties?: string;
      contact_method?: string;
    };

    try {
      if (!userUsername.trim()) {
        setUserAuthError("⚠️ اسم المستخدم مطلوب.");
        setIsAuthLoading(false);
        return;
      }

      // Prepare updated details
      let resolvedGradeId = undefined;
      let resolvedGradeName = undefined;
      if (currentUser.user_role === "student") {
        resolvedGradeId = regGradeId;
        const matchedGrade = curriculumData.flatMap(stage => stage.grades).find(g => g.id === regGradeId);
        resolvedGradeName = matchedGrade ? matchedGrade.name : "";

        // Enforce 15 days check
        if (resolvedGradeId && resolvedGradeId !== currentUser.grade_id) {
          let lastUpdatedTime = 0;
          const localLastUpdated = localStorage.getItem("sudan_grade_updated_at_" + currentUser.id);
          if (localLastUpdated) {
            lastUpdatedTime = parseInt(localLastUpdated, 10);
          } else if (currentUser.createdAt) {
            lastUpdatedTime = new Date(currentUser.createdAt).getTime();
          }

          if (lastUpdatedTime > 0) {
            const diffTime = Date.now() - lastUpdatedTime;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays < 15) {
              const remainingDays = Math.ceil(15 - diffDays);
              const alertMsg = currentLang === "ar"
                ? `⚠️ عذراً، بصفتك طالباً، لا يمكنك تعديل المرحلة الدراسية الرسمية إلا بعد مرور 15 يوماً من تحديدها عند التسجيل أو آخر تعديل (متبقي ${remainingDays} يوم على إمكانية التعديل).`
                : `⚠️ Sorry, as a student you cannot modify your official educational grade until 15 days have passed since registration or last change (${remainingDays} days remaining).`;
              setUserAuthError(alertMsg);
              setIsAuthLoading(false);
              return;
            }
          }
        }
      }

      let resolvedSpecialties = undefined;
      let resolvedContactMethod = undefined;
      if (currentUser.user_role === "teacher") {
        resolvedSpecialties = selectedSpecialties.join(", ");
        resolvedContactMethod = regContactMethod.trim();
      } else if (currentUser.user_role === "parent") {
        if (selectedParentStages.length === 0) {
          setUserAuthError("⚠️ يرجى تحديد صف دراسي واحد على الأقل لأبنائك.");
          setIsAuthLoading(false);
          return;
        }
        resolvedSpecialties = selectedParentStages.join(",");
      }

      const updatePayload: ProfileUpdateFields = {
        username: userUsername,
        password: userPassword || undefined,
        grade_id: resolvedGradeId,
        grade_name: resolvedGradeName,
        specialties: resolvedSpecialties,
        contact_method: resolvedContactMethod
      };

      const res = await updateCurrentUserProfile(currentUser.id, updatePayload);

      if (res.success) {
        let updatedUser = res.user;
        if (!updatedUser) {
          updatedUser = {
            ...currentUser,
            username: userUsername,
            grade_id: resolvedGradeId,
            grade_name: resolvedGradeName,
            specialties: resolvedSpecialties,
            contact_method: resolvedContactMethod
          };
        }

        // If student successfully changed their grade, record it!
        if (currentUser.user_role === "student" && resolvedGradeId !== currentUser.grade_id) {
          localStorage.setItem("sudan_grade_updated_at_" + currentUser.id, String(Date.now()));
        }

        setCurrentUser(updatedUser);
        localStorage.setItem("sudan_auth_user", JSON.stringify(updatedUser));
        
        setUserAuthSuccess("🎉 تم تحديث بياناتك الشخصية بنجاح سحابياً!");
        setSaveStatus(`✅ تم تحديث بيانات حسابك بنجاح يا ${userUsername}!`);
        setTimeout(() => setSaveStatus(null), 5000);

        setTimeout(() => {
          setShowUserModal(false);
          setUserAuthSuccess("");
        }, 1500);
      } else {
        setUserAuthError(res.error || "فشل تعديل البيانات.");
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء تعديل البيانات: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleOAuthLogin = async () => {
    setUserAuthError("");
    setUserAuthSuccess("");
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setUserAuthSuccess("جاري تحويلك إلى قوقل للمصادقة وتخزين البيانات...");
      } else {
        const errorMsg = res.error || "";
        if (errorMsg.includes("provider is not enabled") || errorMsg.includes("Unsupported provider")) {
          setUserAuthError(
            "⚠️ تسجيل الدخول الاجتماعي بـ (Google) غير مفعّل في لوحة تحكّم Supabase الخاصة بمشروعك بعد!\n\n" +
            "لتفعيله وحل هذا الخطأ بسهولة:\n" +
            "١. افتح لوحة تحكم Supabase Dashboard الخاصة بك.\n" +
            "٢. توجه إلى القائمة الجانبية: Authentication ➔ Providers.\n" +
            "٣. اضغط على Google وقم بتمكينه (Enable) مع إضافة الـ Client ID والـ Client Secret من حساب مطوري Google.\n\n" +
            "👑 نصيحة: يمكنك استخدام خيار 'إنشاء حساب جديد' بالبريد الإلكتروني وكلمة المرور بالأعلى مباشرة، فهو جاهز ومفعّل لحفظ بياناتك فورياً في جدول الـ users سحابياً دون أي إعداد إضافي!"
          );
        } else {
          setUserAuthError(`فشل بدء تسجيل الدخول بقوقل: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      setUserAuthError(`خطأ أثناء تسجيل قوقل: ${err.message || err}`);
    }
  };

  const [copySuccess, setCopySuccess] = useState(false);

  const downloadCurriculumFile = () => {
    const fileContent = `export interface Subject {
  id: string;
  name: string;
  iconName: string; // Used to select Lucide icon dynamically
  colorClass: string; // Tailwind bg/text/border color classes
  interactiveUrl: string; // External interactive website url
  interactiveLabel: string; // Friendly label for the external link
  curriculumSummary: string; // Short summary of what is taught in Sudan
  pdfUrl?: string; // Optional download link for the E-Book
  memoPdfUrl?: string; // Optional link to a PDF memorandum
  videoUrl?: string; // Optional YouTube channel or lesson video link
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // Tailwind color theme for this stage
  icon: string; // Lucide icon
  grades: Grade[];
}

export const stagesData: Stage[] = ${JSON.stringify(curriculumData, null, 2)};
`;

    const blob = new Blob([fileContent], { type: "text/typescript;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "curriculum.ts");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCurriculumCode = () => {
    const fileContent = `export interface Subject {
  id: string;
  name: string;
  iconName: string; // Used to select Lucide icon dynamically
  colorClass: string; // Tailwind bg/text/border color classes
  interactiveUrl: string; // External interactive website url
  interactiveLabel: string; // Friendly label for the external link
  curriculumSummary: string; // Short summary of what is taught in Sudan
  pdfUrl?: string; // Optional download link for the E-Book
  memoPdfUrl?: string; // Optional link to a PDF memorandum
  videoUrl?: string; // Optional YouTube channel or lesson video link
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // Tailwind color theme for this stage
  icon: string; // Lucide icon
  grades: Grade[];
}

export const stagesData: Stage[] = ${JSON.stringify(curriculumData, null, 2)};
`;

    navigator.clipboard.writeText(fileContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    }).catch(err => {
      console.error("Could not copy curriculum code", err);
    });
  };

  const resetCurriculumToDefault = async () => {
    if (window.confirm("هل أنت متأكد من رغبتك في استعادة المنهج الدراسي الافتراضي الأصلي وحذف كل التعديلات المحلية الحالية؟")) {
      localStorage.removeItem("sudan_custom_curriculum_v3");
      setCurriculumData(stagesData);
      setSaveStatus("🔄 جاري استعادة المنهج الدراسي الافتراضي وتحديث السحابة...");
      try {
        await saveCurriculumToCloudAutomatically(stagesData);
        setSaveStatus("✅ تمت استعادة المنهج الدراسي بنجاح ومزامنته سحابياً! 🔄");
      } catch (err) {
        console.error("Failed to sync default curriculum reset to Supabase:", err);
        setSaveStatus("🔄 تم الحفظ محلياً وفشلت المزامنة التلقائية مع سوبابيس");
      }
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Clean up any stale client-side curriculum caches to ensure the app loads the fresh server compiled code
  useEffect(() => {
    localStorage.removeItem("sudan_custom_curriculum_v2");
    localStorage.removeItem("sudan_custom_curriculum"); // Purge very old version if any
  }, []);

  // Do not select any stage by default on mount to keep the home page clean and showing no tabs/stages open.
  useEffect(() => {
    // Left empty intentionally to prevent automatic selections of stage or grade on opening the website.
  }, [curriculumData, currentUser]);

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
            if (!currentUser && !isAdminLoggedIn) {
              setUserAuthError("⚠️ يرجى تسجيل الدخول أو إنشاء حساب طالب/أستاذ أولاً لتصفح هذا المنهج الدراسي بالكامل!");
              setShowUserModal(true);
              setUserModalTab("login");
              break;
            }
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
  }, [curriculumData, currentUser, isAdminLoggedIn]);

  // 📱 Automatic scroll to newly opened sections/subjects for enhanced mobile usability
  useEffect(() => {
    if (selectedStage) {
      setTimeout(() => {
        const el = document.getElementById("selected-stage-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [selectedStage]);

  useEffect(() => {
    if (activeGrade) {
      setTimeout(() => {
        const el = document.getElementById(`grade-card-${activeGrade.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [activeGrade]);

  useEffect(() => {
    if (showOnlyFavorites) {
      setTimeout(() => {
        const el = document.getElementById("favorites-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showOnlyFavorites]);

  useEffect(() => {
    if (showStudyCamp) {
      setTimeout(() => {
        const el = document.getElementById("study-camp-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showStudyCamp]);

  useEffect(() => {
    if (showEducationalMindMap) {
      setTimeout(() => {
        const el = document.getElementById("mind-map-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showEducationalMindMap]);

  useEffect(() => {
    if (showAdminDashboard) {
      setTimeout(() => {
        const el = document.getElementById("admin-dashboard-view-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [showAdminDashboard]);

  // تم الاستغناء بالكامل عن الطريقة القديمة لحفظ الملفات محلياً على السيرفر (والتي كانت تفشل على فيرسل Vercel)
  // لصالح مزامنة سحابية ديناميكية وتلقائية بالكامل بنسبة 100% تعتمد على سوبابيس (Supabase Realtime Database)


  const saveCurriculumToCloudAutomatically = async (newData: Stage[]) => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      console.log("Supabase not configured, skipping background cloud sync.");
      return;
    }

    try {
      setSaveStatus("☁️ جاري مزامنة وحفظ التعديلات تلقائياً في سوبابيس (Supabase)...");
      const result = await saveCurriculumToSupabase(newData);
      if (result && result.success) {
        setSaveStatus("✅ تم مزامنة وحفظ كافة التعديلات في قاعدة البيانات سوبابيس بنجاح! ☁️");
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        console.warn("Background cloud sync errors:", result.errors);
        const errorDetail = result.errors && result.errors.length > 0 ? result.errors.join(" | ") : "خطأ مجهول بالـ RLS أو الصلاحيات";
        setSaveStatus(`⚠️ فشلت المزامنة التلقائية مع سوبابيس: ${errorDetail}`);
        setTimeout(() => setSaveStatus(null), 10000);
      }
    } catch (err: any) {
      console.error("Background cloud sync error:", err);
      setSaveStatus(`⚠️ خطأ في المزامنة التلقائية: ${err.message || err}`);
      setTimeout(() => setSaveStatus(null), 8000);
    }
  };

  const updateSubject = async (stageId: string, gradeId: string, subjectId: string, updatedFields: Partial<Subject>) => {
    let finalStageId = stageId;
    let finalGradeId = gradeId;

    // Auto-resolve correct stageId and gradeId from curriculum tree to avoid mismatch
    let found = false;
    for (const stage of curriculumData) {
      for (const grade of stage.grades) {
        if (grade.subjects.some(sub => sub.id === subjectId)) {
          finalStageId = stage.id;
          finalGradeId = grade.id;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newData = curriculumData.map(stg => {
      if (stg.id !== finalStageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== finalGradeId) return grd;
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
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));
    
    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // Dynamically post a site update notifications alert if links/lessons were added/modified
    if (updatedFields.pdfUrl || updatedFields.memoPdfUrl || updatedFields.videoUrl || updatedFields.interactiveUrl) {
      const subjectName = updatedFields.name || "مادة دراسية";
      logSiteUpdate(
        "resource_update",
        `تم تحديث محتوى مادة: ${subjectName}`,
        `Curriculum contents refreshed: ${subjectName}`,
        `تم تعديل الروابط الدراسية ونشر مصادر إضافية/حصص مرئية جديدة لمادة "${subjectName}".`,
        `The online notes, teaching folders, or digital files for "${subjectName}" have been synced.`
      );
    }

    // Update active subject if it is currently open
    if (activeSubject && activeSubject.id === subjectId) {
      setActiveSubject({
        ...activeSubject,
        ...updatedFields
      } as any);
    }
  };

  const deleteSubject = async (stageId: string, gradeId: string, subjectId: string) => {
    let finalStageId = stageId;
    let finalGradeId = gradeId;

    // Auto-resolve correct stageId and gradeId from curriculum tree to avoid mismatch
    let found = false;
    for (const stage of curriculumData) {
      for (const grade of stage.grades) {
        if (grade.subjects.some(sub => sub.id === subjectId)) {
          finalStageId = stage.id;
          finalGradeId = grade.id;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newData = curriculumData.map(stg => {
      if (stg.id !== finalStageId) return stg;
      return {
        ...stg,
        grades: stg.grades.map(grd => {
          if (grd.id !== finalGradeId) return grd;
          return {
            ...grd,
            subjects: grd.subjects.filter(sub => sub.id !== subjectId)
          };
        })
      };
    });
    setCurriculumData(newData);
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));
    
    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // If activeSubject is deleted, close the modal
    if (activeSubject && activeSubject.id === subjectId) {
      setActiveSubject(null);
    }
  };

  const addSubject = async (stageId: string, gradeId: string, newSubject: Subject) => {
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
    localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newData));

    // Auto sync to Supabase database directly!
    await saveCurriculumToCloudAutomatically(newData);

    // Dynamic user updates alert log
    const targetStage = curriculumData.find(s => s.id === stageId);
    const targetStageName = targetStage ? targetStage.name : "";
    logSiteUpdate(
      "new_subject",
      `إضافة مادة دراسية جديدة: ${newSubject.name}`,
      `New subject course loaded: ${newSubject.name}`,
      `تم إدراج منهج ومقرر مادة "${newSubject.name}" في المرحلة الدراسية بنجاح سيدي. تصفحوا الحصص الإلكترونية الآن.`,
      `The educational material syllabus for "${newSubject.name}" has been registered inside ${targetStageName}.`
    );
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
      // Play a happy success sound in Kid Mode
      if (isKidModeActive) {
        playKidChime("success");
      }
    }
    setCompletedLessons(newCompleted);
    localStorage.setItem("sudan_edu_lessons", JSON.stringify(newCompleted));
  };

  // Kid Mode Emoji helper for attractive kid-friendly cards
  const getKidSubjectEmoji = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("رياضيات") || lower.includes("math") || lower.includes("حساب")) return "🧮";
    if (lower.includes("علوم") || lower.includes("science") || lower.includes("أحياء") || lower.includes("كيمياء") || lower.includes("فيزياء") || lower.includes("طبيعة")) return "🚀";
    if (lower.includes("عربي") || lower.includes("arabic") || lower.includes("لغة عربية") || lower.includes("تربية وطنية")) return "🦁";
    if (lower.includes("إنجليزي") || lower.includes("english") || lower.includes("لغة إنجليزية")) return "🦜";
    if (lower.includes("إسلام") || lower.includes("دين") || lower.includes("islamic") || lower.includes("قرآن") || lower.includes("حديث") || lower.includes("فقه")) return "🌙";
    if (lower.includes("تاريخ") || lower.includes("جغراف") || lower.includes("سيرة") || lower.includes("سودان") || lower.includes("وطن") || lower.includes("دراسات")) return "🗺️";
    if (lower.includes("حاسوب") || lower.includes("كمبيوتر") || lower.includes("computer") || lower.includes("تكنولوجيا")) return "🤖";
    if (lower.includes("فني") || lower.includes("art") || lower.includes("رسم") || lower.includes("أشغال")) return "🎨";
    if (lower.includes("ألعاب") || lower.includes("ترفيه") || lower.includes("kindergarten") || lower.includes("نشاط") || lower.includes("روضة")) return "🧸";
    return "⭐";
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

  // Compute if the logged in user or admin has license to modify content (Admin or Approved Teacher)
  const hasEditPermissions = isAdminLoggedIn || (!!currentUser && currentUser.user_role === "teacher" && !!currentUser.is_approved_teacher);

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

  // 🔔 Compute Dynamic Notifications List
  const formattedNotifications = React.useMemo(() => {
    const list: any[] = [];

    // 1. Pending Friend Requests
    pendingFriendRequests.forEach((req: any) => {
      list.push({
        id: `friendship-${req.id}`,
        type: "friend_request",
        title: currentLang === "ar" ? "طلب صداقة وارد 👥" : "Incoming Friend Request 👥",
        body: currentLang === "ar" 
          ? `الزميل *${req.senderName}* يرغب في إضافتك لقائمته لتتمكنا من الدردشة والمذاكرة معاً.`
          : `Peer *${req.senderName}* wants to add you to chat and study together in the same stage.`,
        timeLabel: currentLang === "ar" ? "معلق وبانتظارك ⏳" : "Pending your approval ⏳",
        isUnread: true,
        icon: <UserCheck className="w-4 h-4 text-amber-500" />,
        iconBg: "bg-amber-955/20 border border-amber-900/40",
        action: "open_chat"
      });
    });

    // 2. Unread Chat Messages (Only public chats or DMs directed specifically to this user)
    const unreadMsgs = recentChatMessages.filter((m: any) => {
      if (!currentUser) return false;
      const mUserId = m.userId || m.user_id;
      if (String(mUserId) === String(currentUser.id)) return false;
      
      const isDM = m.text && m.text.startsWith("[DM:");
      if (isDM) {
        const dmMatch = m.text.match(/^\[DM:([^\]]+)\]/);
        if (dmMatch) {
          const recipientId = dmMatch[1];
          if (String(recipientId) !== String(currentUser.id)) {
            return false; // This private DM is not for this user!
          }
        } else {
          return false;
        }
      }
      
      return new Date(m.timestamp) > new Date(lastCheckedChat);
    });

    if (unreadMsgs.length > 0) {
      if (unreadMsgs.length === 1) {
        const m = unreadMsgs[0];
        // Clean out private DM tag for display if needed
        const cleanBodyText = m.text.startsWith("[DM:") ? m.text.replace(/^\[DM:[^\]]+\]/, "💬 [رسالة خاصة]: ") : m.text;
        list.push({
          id: `msg-${m.id}`,
          type: "message",
          title: currentLang === "ar" ? "رسالة جديدة 💬" : "New Message 💬",
          body: `*${m.username}*: ${cleanBodyText}`,
          timeLabel: new Date(m.timestamp).toLocaleTimeString(currentLang === "ar" ? "ar-SD" : "en-US", { hour: '2-digit', minute: '2-digit' }),
          isUnread: true,
          icon: <MessagesSquare className="w-4 h-4 text-indigo-400" />,
          iconBg: "bg-indigo-950/20 border border-indigo-900/30",
          action: "open_chat"
        });
      } else {
        const uniqueSenders = Array.from(new Set(unreadMsgs.map((m: any) => m.username)));
        list.push({
          id: `msgs-grouped`,
          type: "message",
          title: currentLang === "ar" ? "رسائل جديدة غير مقروءة 💬" : "Unread Chat Messages 💬",
          body: currentLang === "ar" 
            ? `لديك ${unreadMsgs.length} رسالة جديدة من: ${uniqueSenders.join(", ")}`
            : `You have ${unreadMsgs.length} new messages from: ${uniqueSenders.join(", ")}`,
          timeLabel: currentLang === "ar" ? "نشط الآن ⚡" : "Active now ⚡",
          isUnread: true,
          icon: <MessagesSquare className="w-4 h-4 text-indigo-400 animate-bounce" />,
          iconBg: "bg-indigo-950/35 border border-indigo-900/40",
          action: "open_chat"
        });
      }
    }

    // 3. Site Curricula / updates (Filtered dynamically by user permissions, grade, specialties, and targeted recipients)
    const teacherSpecs = currentUser && currentUser.user_role === "teacher" && currentUser.specialties
      ? currentUser.specialties.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    let studentGradeName = "";
    let studentStageName = "";
    if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
      curriculumData.forEach(stage => {
        const g = stage.grades.find(gr => gr.id === currentUser.grade_id);
        if (g) {
          studentGradeName = g.name.toLowerCase();
          studentStageName = stage.name.toLowerCase();
        }
      });
    }

    siteUpdates.forEach((upd: any) => {
      if (upd.category === "breaking_news" || (upd.body_ar && upd.body_ar.includes('"bgColor"')) || (upd.body_ar && upd.body_ar.includes('"enabled"'))) return; // Skip internal system config payloads
      
      const isUnread = new Date(upd.created_at) > new Date(lastCheckedUpdates);
      const isNewSubject = upd.category === "new_subject";

      const titleArLower = (upd.title_ar || "").toLowerCase();
      const bodyArLower = (upd.body_ar || "").toLowerCase();
      const titleEnLower = (upd.title_en || "").toLowerCase();
      const bodyEnLower = (upd.body_en || "").toLowerCase();

      // Check for targeted/private supervisor/admin messages
      const isTargeted = titleArLower.includes("موجه") || bodyArLower.includes("موجه") ||
                          titleArLower.includes("خاص ب") || bodyArLower.includes("خاص ب");
      if (isTargeted && currentUser) {
        const matchesMe = 
          titleArLower.includes(currentUser.username.toLowerCase()) || 
          bodyArLower.includes(currentUser.username.toLowerCase()) ||
          titleArLower.includes(currentUser.email.toLowerCase()) || 
          bodyArLower.includes(currentUser.email.toLowerCase()) ||
          (currentUser.user_role === "teacher" && (titleArLower.includes("معلم") || bodyArLower.includes("معلم") || titleArLower.includes("أساتذ") || bodyArLower.includes("أساتذ"))) ||
          (currentUser.user_role === "student" && (titleArLower.includes("طالب") || bodyArLower.includes("طالب") || titleArLower.includes("طلاب") || bodyArLower.includes("طلاب")));
        if (!matchesMe) return; // Skip if targeted message but not for this user
      }

      // Check role permissions: Teacher specialties
      if (currentUser && currentUser.user_role === "teacher" && teacherSpecs.length > 0) {
        const isSubjectUpdate = upd.category === "new_subject" || 
                                titleArLower.includes("مادة") || bodyArLower.includes("مادة") ||
                                titleArLower.includes("درس") || bodyArLower.includes("درس");
        if (isSubjectUpdate) {
          const matchesSpecialty = teacherSpecs.some(spec => 
            titleArLower.includes(spec) || bodyArLower.includes(spec) ||
            titleEnLower.includes(spec) || bodyEnLower.includes(spec)
          );
          if (!matchesSpecialty) return; // Skip notification if teacher is not specialized in this subject
        }
      }

      // Check role permissions: Student grade/stage
      if (currentUser && currentUser.user_role === "student" && currentUser.grade_id) {
        const isSubjectUpdate = upd.category === "new_subject" || 
                                titleArLower.includes("مادة") || bodyArLower.includes("مادة") ||
                                titleArLower.includes("درس") || bodyArLower.includes("درس") ||
                                titleArLower.includes("صف") || bodyArLower.includes("صف");
        if (isSubjectUpdate) {
          const mentionsMyGrade = (studentGradeName && (titleArLower.includes(studentGradeName) || bodyArLower.includes(studentGradeName))) ||
                                  (studentStageName && (titleArLower.includes(studentStageName) || bodyArLower.includes(studentStageName)));
          if (!mentionsMyGrade) {
            // If it mentions other specific grades but not ours, skip it
            const otherGrades = curriculumData.flatMap(st => st.grades.map(gr => gr.name.toLowerCase())).filter(name => name !== studentGradeName);
            const mentionsOtherGrade = otherGrades.some(otherName => 
              titleArLower.includes(otherName) || bodyArLower.includes(otherName)
            );
            if (mentionsOtherGrade) {
              return; // Skip since it's for another grade
            }
          }
        }
      }

      list.push({
        id: `update-${upd.id}`,
        type: upd.category,
        title: currentLang === "ar" ? upd.title_ar : upd.title_en,
        body: currentLang === "ar" ? upd.body_ar : upd.body_en,
        timeLabel: new Date(upd.created_at).toLocaleDateString(currentLang === "ar" ? "ar-SD" : "en-US", { month: 'short', day: 'numeric' }),
        isUnread: isUnread,
        icon: isNewSubject ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-cyan-400" />,
        iconBg: isNewSubject ? "bg-emerald-955/20 border border-emerald-900/30" : "bg-cyan-955/20 border border-cyan-900/30",
        action: "open_curriculum"
      });
    });

    return list;
  }, [pendingFriendRequests, recentChatMessages, siteUpdates, currentUser, lastCheckedChat, lastCheckedUpdates, currentLang]);

  const unreadCount = React.useMemo(() => {
    return formattedNotifications.filter(n => n.isUnread).length;
  }, [formattedNotifications]);

  const handleNotificationClick = (item: any) => {
    if (item.action === "open_chat") {
      setShowStudentChat(true);
      
      const nowStr = new Date().toISOString();
      localStorage.setItem("sudan_chat_last_read", nowStr);
      setLastCheckedChat(nowStr);
    } else {
      const nowStr = new Date().toISOString();
      localStorage.setItem("sudan_updates_last_read", nowStr);
      setLastCheckedUpdates(nowStr);
    }
    setShowNotificationsDropdown(false);
  };

  // =========================================================================
  // 👪 Parent Portal Custom Render Function
  // =========================================================================
  const renderParentPortal = () => {
    // Filter out student users for searching (strictly exclude teachers/instructors/parents/admins)
    const studentUsers = allRegisteredUsers.filter(u => {
      const role = (u.user_role || "").toLowerCase();
      const isStudentRole = role === "student";
      const isNotTeacherOrParentOrAdmin = role !== "teacher" && role !== "parent" && role !== "admin" && role !== "instructor";
      const hasTeacherFlags = !!u.is_approved_teacher;
      const usernameLower = (u.username || "").toLowerCase();
      const emailLower = (u.email || "").toLowerCase();
      
      const hasTeacherIndicator = 
        usernameLower.includes("أستاذ") || 
        usernameLower.includes("استاذ") || 
        usernameLower.includes("معلم") || 
        usernameLower.includes("معلمة") || 
        usernameLower.includes("أستاذة") ||
        usernameLower.includes("teacher") ||
        usernameLower.includes("instructor") ||
        usernameLower.includes("admin") ||
        emailLower.includes("teacher") ||
        emailLower.includes("admin");

      return isStudentRole && isNotTeacherOrParentOrAdmin && !hasTeacherFlags && !hasTeacherIndicator;
    });
    const filteredStudents = studentUsers.filter(student => {
      const q = parentSearchQuery.toLowerCase();
      return student.username.toLowerCase().includes(q) || 
             (student.grade_name || "").toLowerCase().includes(q) ||
             (student.email || "").toLowerCase().includes(q);
    });

    return (
      <div className="bg-[#FAF7F0] border border-[#D4AF37]/20 rounded-3xl p-5 md:p-8 space-y-8 select-text text-right" dir="rtl">
        {/* Header Title with traditional Sudanese theme */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-6">
          <div className="space-y-1.5 text-center md:text-right">
            <span className="text-4xs text-earthgold font-black uppercase tracking-widest block">بوابة المتابعة الذكية للأسرة 👪</span>
            <h3 className="text-xl md:text-2xl font-black text-mud flex items-center justify-center md:justify-start gap-2">
              <span>🏠</span>
              <span>لوحة متابعة الأبناء والتقارير الأكاديمية</span>
            </h3>
            <p className="text-3xs text-mud/75">
              يمكنك ربط حسابات أبنائك، ومتابعتهم بشكل مستمر، والاطلاع على تفاصيل أدائهم والوقت الذي يقضونه في دراسة ومراجعة المناهج السودانية.
            </p>
          </div>
          
          <div className="bg-white border border-mud/15 rounded-2xl px-4 py-2 text-center md:text-right shrink-0">
            <span className="text-4xs font-bold text-mud/60 block">عدد الأبناء المرتبطين</span>
            <span className="text-base font-black text-earthgold">{parentChildrenLinks.length} طلاب</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right/Main Side: My Linked Children (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-mud/10 rounded-2xl p-5 md:p-6 space-y-5">
              <h4 className="font-black text-mud text-sm md:text-base border-b border-mud/5 pb-3 flex items-center gap-2">
                <span>🧒</span>
                <span>الأبناء المرتبطين بالحساب حالياً</span>
              </h4>

              {isParentPortalLoading ? (
                <div className="text-center py-8 space-y-2">
                  <RotateCw className="w-6 h-6 animate-spin text-earthgold mx-auto" />
                  <p className="text-3xs text-mud/60">جاري تحميل بيانات الأبناء والتقارير...</p>
                </div>
              ) : parentChildrenLinks.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-4xl">🧸</div>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-mud text-xs">لا يوجد أبناء مرتبطين بحسابك بعد</h5>
                    <p className="text-4xs text-mud/60 max-w-sm mx-auto">
                      يمكنك ربط حسابات أبنائك بالبحث عنهم باسم المستخدم في "دليل الطلاب" المتاح في الجانب الأيسر، ثم الضغط على "ربط الحساب".
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parentChildrenLinks.map(link => {
                    const student = allRegisteredUsers.find(u => String(u.id) === String(link.receiver_id));
                    if (!student) return null;
                    const isSelected = selectedChildForReport && String(selectedChildForReport.id) === String(student.id);

                    return (
                      <div 
                        key={link.id}
                        onClick={() => setSelectedChildForReport(student)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                          isSelected 
                            ? "bg-earthgold/5 border-earthgold shadow-sm ring-2 ring-earthgold/20" 
                            : "bg-[#FDFBF7] hover:bg-cream/40 border-mud/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-cream border border-mud/10 flex items-center justify-center text-lg">
                            🎒
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="font-extrabold text-mud text-xs">{student.username}</h5>
                            <span className="text-[10px] text-earthgold font-bold block bg-[#FAF7F0] px-2 py-0.5 rounded-full border border-mud/5 w-fit">
                              {student.grade_name || "مرحلة غير محددة"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-mud/5 pt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkChild(link.id, student.username);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg text-4xs font-extrabold cursor-pointer transition-colors"
                          >
                            إلغاء الربط ❌
                          </button>
                          
                          <span className="text-4xs font-bold text-mud/60 flex items-center gap-1">
                            {isSelected ? "📋 جاري العرض" : "🔍 اضغط للتقرير"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Child Reports Panel */}
            {selectedChildForReport && (() => {
              let logs: any[] = [];
              if (selectedChildForReport.contact_method && selectedChildForReport.contact_method.startsWith("[")) {
                try {
                  logs = JSON.parse(selectedChildForReport.contact_method);
                } catch {
                  logs = [];
                }
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-mud/10 rounded-2xl p-5 md:p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-mud/5 pb-3">
                    <h4 className="font-black text-mud text-sm md:text-base flex items-center gap-2">
                      <span>📊</span>
                      <span>تقارير النشاط الدراسي للابن: {selectedChildForReport.username}</span>
                    </h4>
                    <span className="text-4xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                      مفعل ومراقب نشط ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FAF7F0] border border-mud/5 p-3 rounded-xl text-center">
                      <span className="text-4xs text-mud/60 block mb-0.5">المواد المفتوحة</span>
                      <span className="text-sm font-black text-mud">{logs.length} مواد</span>
                    </div>
                    <div className="bg-[#FAF7F0] border border-mud/5 p-3 rounded-xl text-center">
                      <span className="text-4xs text-mud/60 block mb-0.5">إجمالي مرات التصفح</span>
                      <span className="text-sm font-black text-mud">
                        {logs.reduce((sum, item) => sum + (item.openCount || 0), 0)} مرات
                      </span>
                    </div>
                    <div className="bg-[#FAF7F0] border border-mud/5 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
                      <span className="text-4xs text-mud/60 block mb-0.5">إجمالي وقت البقاء والتركيز</span>
                      <span className="text-sm font-black text-emerald-700">
                        {(() => {
                          const totalSec = logs.reduce((sum, item) => sum + (item.totalDurationSeconds || 0), 0);
                          if (totalSec < 60) return `${totalSec} ثوانٍ`;
                          const mins = Math.floor(totalSec / 60);
                          const remainingSec = totalSec % 60;
                          return `${mins} دقيقة ${remainingSec > 0 ? `و ${remainingSec}ث` : ""}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-extrabold text-mud text-xs">📖 سجل تصفح ومتابعة المواد بالتفصيل:</h5>
                    
                    {logs.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-mud/10 rounded-xl">
                        <p className="text-3xs text-mud/50">لم يقم {selectedChildForReport.username} بفتح أي مادة تفاعلية بعد في هذه الجلسة.</p>
                      </div>
                    ) : (
                      <div className="border border-mud/10 rounded-xl overflow-hidden bg-[#FAF7F0]/30">
                        <table className="w-full text-right text-3xs">
                          <thead>
                            <tr className="bg-[#FAF7F0] text-mud font-black border-b border-mud/10">
                              <th className="p-3">اسم المادة</th>
                              <th className="p-3 text-center">مرات الفتح</th>
                              <th className="p-3 text-center">مدة بقاء الطالب واستخدامه</th>
                              <th className="p-3 text-left">آخر تصفح ونشاط</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-mud/5">
                            {logs.map((log, index) => {
                              return (
                                <tr key={index} className="hover:bg-cream/20">
                                  <td className="p-3 font-extrabold text-mud">{log.subjectName}</td>
                                  <td className="p-3 text-center font-bold text-mud">{log.openCount || 1} مرات</td>
                                  <td className="p-3 text-center font-bold text-emerald-700">
                                    {(() => {
                                      const sec = log.totalDurationSeconds || 0;
                                      if (sec < 60) return `${sec} ثانية`;
                                      const mins = Math.floor(sec / 60);
                                      const remSec = sec % 60;
                                      return `${mins} دقيقة ${remSec > 0 ? `و ${remSec}ث` : ""}`;
                                    })()}
                                  </td>
                                  <td className="p-3 text-left text-mud/60">
                                    {log.lastOpened ? new Date(log.lastOpened).toLocaleTimeString("ar-SD", { hour: '2-digit', minute: '2-digit' }) : "غير متوفر"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </div>

          {/* Left Side: Directory Student Search for linking (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-mud/10 rounded-2xl p-5 md:p-6 space-y-5">
              <h4 className="font-black text-mud text-sm md:text-base border-b border-mud/5 pb-3 flex items-center gap-2">
                <span>🔍</span>
                <span>البحث في دليل المسجلين للربط</span>
              </h4>

              <div className="relative">
                <Search className="w-4 h-4 text-mud/40 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب، السنة الدراسية، أو البريد الإلكتروني..."
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-mud/15 hover:border-mud/30 focus:border-earthgold focus:outline-hidden text-3xs font-medium text-mud [font-family:inherit] bg-[#FAF7F0]/30"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <p className="text-center py-6 text-4xs text-mud/50 font-bold">لم يتم العثور على طلاب مطابقين للبحث.</p>
                ) : (
                  filteredStudents.map(student => {
                    const isLinked = parentChildrenLinks.some(link => String(link.receiver_id) === String(student.id));

                    return (
                      <div key={student.id} className="p-3 bg-[#FAF7F0] hover:bg-cream/25 border border-mud/5 rounded-xl flex items-center justify-between gap-3 text-right">
                        <div className="space-y-0.5">
                          <p className="font-bold text-mud text-3xs">{student.username}</p>
                          {student.email && (
                            <p className="text-[9px] text-mud/60 font-mono select-all select-text">{student.email}</p>
                          )}
                          <p className="text-4xs text-earthgold font-semibold">{student.grade_name || "مرحلة غير محددة"}</p>
                        </div>

                        {isLinked ? (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            مرتبط بالحساب ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLinkChild(student)}
                            className="px-3 py-1.5 bg-earthgold hover:bg-earthgold/90 text-white rounded-lg text-4xs font-black cursor-pointer transition-colors shadow-xs"
                          >
                            ربط 👪
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans pb-16 transition-all duration-300 relative ${
      isWarmTheme 
        ? "bg-cream text-mud selection:bg-earthgold/20 selection:text-mud" 
        : "bg-slate-950 text-slate-100 selection:bg-emerald-600 selection:text-white"
    }`} dir={currentLang === "ar" ? "rtl" : "ltr"}>
      {siteTheme === "heritage" && <SudaneseHeritageDecor />}
      {/* Upper Flag Trim (Sudan Flag Colors: Red, White, Black, Green) */}
      <div 
        onClick={handleTrimClick}
        className="h-2 w-full flex cursor-pointer hover:opacity-95 active:opacity-80 transition-opacity" 
        title=" منصة نقلة للمناهج الالكترونية التفاعلية  "
      >
        <div className="bg-[#D21034] flex-1"></div>
        <div className="bg-white flex-1"></div>
        <div className="bg-[#000000] flex-1"></div>
        <div className="bg-[#007229] flex-1"></div>
      </div>

      {/* 📢 Breaking News Moving Ticker Bar */}
      {breakingNews && breakingNews.enabled && !isTickerDismissed && (
        <div 
          className={`relative w-full ${breakingNews.bgColor} ${breakingNews.textColor} text-xs py-2 px-4 md:px-6 select-none overflow-hidden flex items-center border-b border-white/5 z-40 transition-all shadow-lg shadow-black/10`}
          dir={currentLang === "ar" ? "rtl" : "ltr"}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            
            {/* Red alert badge with pulsing dot */}
            <div className="flex items-center gap-1.5 font-black bg-black/30 px-2.5 py-1 rounded-xl text-[10px] uppercase shadow-inner shrink-0 relative z-10 select-none border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-[10px] md:text-[11px] font-black">{currentLang === "ar" ? "" : "Breaking News 🔴"}</span>
            </div>

            {/* Animated Ticker container */}
            <div className="flex-1 overflow-hidden relative mx-2" dir="ltr">
              <div 
                className={tickerDirection === "rtl" ? "animate-marquee text-right" : "animate-marquee-ltr text-left"}
                style={{ 
                  "--marquee-duration": breakingNews.speed === "slow" ? "50s" : breakingNews.speed === "fast" ? "14s" : "26s" 
                } as React.CSSProperties}
              >
                <span className="px-6 text-[11px] md:text-xs font-black tracking-wide" dir={currentLang === "ar" ? "rtl" : "ltr"}>
                  {currentLang === "ar" ? breakingNews.textAr : breakingNews.textEn}
                </span>
                <span className="px-6 text-[11px] md:text-xs font-black tracking-wide opacity-90 select-none" dir={currentLang === "ar" ? "rtl" : "ltr"}>
                  🔴 {currentLang === "ar" ? breakingNews.textAr : breakingNews.textEn}
                </span>
              </div>
            </div>

            {/* Actions: Admin direct shortcut, Direction toggle & Dismiss key */}
            <div className="flex items-center gap-2 relative z-10 shrink-0">
              {currentUser && (currentUser.user_role === "admin" || currentUser.username === "almangory") && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="hidden md:inline-flex items-center gap-0.5 bg-black/40 hover:bg-black/60 text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg cursor-pointer transition-all border border-white/10 active:scale-95 text-slate-200"
                  title="تعديل محتوى وبث هذا الإعلان فوراً"
                >
                  <span>تعديل ⚙️</span>
                </button>
              )}

              {/* Direction selector Toggle key */}
              <button
                onClick={() => {
                  const newDir = tickerDirection === "rtl" ? "ltr" : "rtl";
                  setTickerDirection(newDir);
                  localStorage.setItem("sudan_edu_ticker_direction", newDir);
                }}
                className="hover:bg-black/35 px-2 py-1 rounded-xl text-[10px] text-white/90 hover:text-white transition-all active:scale-90 cursor-pointer border border-white/10 flex items-center gap-1.5 font-bold select-none"
                title={currentLang === "ar" ? "تغيير اتجاه حركة شريط الأخبار" : "Toggle Ticker Scroll Direction"}
              >
                <ArrowLeftRight className="w-3 h-3 text-white/90" />
                <span className="text-[9px] md:text-[10px] font-black hidden xs:inline">
                  {tickerDirection === "rtl" ? "يمين ⏪" : "⏪ يسار"}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setIsTickerDismissed(true);
                  sessionStorage.setItem("sudan_edu_ticker_dismissed", "true");
                }}
                className="hover:bg-black/35 p-1 rounded-lg text-white/80 hover:text-[#ffffff] transition-opacity active:scale-90 cursor-pointer border border-transparent hover:border-white/10"
                title={currentLang === "ar" ? "إخفاء الشريط" : "Hide Announcement"}
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Header Bar for Admin Portal */}
      {siteTheme === "heritage" ? (
        <div className="max-w-7xl mx-auto px-4 pt-4 relative z-50">
          <div className="bg-[#FFFDF9] rounded-3xl border border-mud/10 shadow-sm px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-right lg:w-[1100px] max-w-full mx-auto" dir="rtl">
            
            {/* Right side: Logo & Title */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none" 
              onClick={() => { 
                setSelectedStage(null); 
                setShowOnlyFavorites(false); 
                setShowStudyCamp(false); 
                setShowEducationalMindMap(false); 
                setShowStudentChat(false); 
                setShowAdminDashboard(false);
                setShowParentPortal(false);
                setActiveGrade(null);
              }}
            >
              <div className="w-11 h-11 rounded-full bg-[#3D2314] flex items-center justify-center border border-[#E5C185] relative overflow-hidden group shadow-md shrink-0">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg viewBox="0 0 500 500" className="w-8 h-8 hover:scale-110 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="header-gold-metallic" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9B6F1A" />
                      <stop offset="20%" stopColor="#D4AF37" />
                      <stop offset="45%" stopColor="#F3D993" />
                      <stop offset="55%" stopColor="#FFF8E1" />
                      <stop offset="70%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#845D10" />
                    </linearGradient>
                  </defs>
                  <path d="M 250,225 L 250,295" stroke="url(#header-gold-metallic)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 250,290 C 210,274 150,274 110,300 C 150,308 210,308 250,293" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="8" strokeLinejoin="round" />
                  <path d="M 250,290 C 290,274 350,274 390,300 C 350,308 290,308 250,293" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="8" strokeLinejoin="round" />
                  <path d="M 250,285 C 210,268 150,268 112,295 L 125,215 C 160,192 215,192 250,208 Z" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="9" strokeLinejoin="round" />
                  <path d="M 250,285 C 290,268 350,268 388,295 L 375,215 C 340,192 285,192 250,208 Z" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="9" strokeLinejoin="round" />
                  <path d="M 250,225 L 250,150" stroke="url(#header-gold-metallic)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 250,210 C 225,200 215,180 230,170 C 245,160 250,190 250,210 Z" fill="url(#header-gold-metallic)" />
                  <path d="M 250,175 C 220,165 210,140 228,132 C 246,124 250,155 250,175 Z" fill="url(#header-gold-metallic)" />
                  <path d="M 250,140 C 240,120 240,95 250,90 C 260,95 260,120 250,140 Z" fill="url(#header-gold-metallic)" />
                  <path d="M 200,212 L 300,212" stroke="url(#header-gold-metallic)" strokeWidth="7" strokeLinecap="round" />
                  <path d="M 210,212 L 235,185 L 265,195 L 302,145 L 302,175" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M 275,212 L 275,175" stroke="url(#header-gold-metallic)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 290,212 L 290,150" stroke="url(#header-gold-metallic)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 315,212 L 315,130" stroke="url(#header-gold-metallic)" strokeWidth="9" strokeLinecap="round" />
                  <path d="M 250,205 L 300,140 L 335,95" fill="none" stroke="url(#header-gold-metallic)" strokeWidth="12" strokeLinecap="round" />
                  <path d="M 310,93 L 340,90 L 337,120 Z" fill="url(#header-gold-metallic)" stroke="url(#header-gold-metallic)" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-right">
                <h1 className="text-[#3D2314] font-black text-sm sm:text-base leading-tight font-sans">نقلة للمناهج الإلكترونية</h1>
                <p className="text-[#A35130] font-extrabold text-3xs tracking-widest leading-none">السودانية الموحدة</p>
              </div>
            </div>

            {/* Middle: Navigation Links */}
            <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-black text-[#5C2C16]">
              <button 
                onClick={() => { 
                  setSelectedStage(null); 
                  setShowOnlyFavorites(false); 
                  setShowStudyCamp(false); 
                  setShowEducationalMindMap(false); 
                  setShowStudentChat(false); 
                  setShowAdminDashboard(false);
                  setShowParentPortal(false);
                  setActiveGrade(null);
                }} 
                className="hover:text-[#A35130] transition-colors border-b-2 border-transparent hover:border-[#A35130] pb-1 cursor-pointer select-none"
              >
                الرئيسية
              </button>
              <button 
                onClick={() => {
                  setSelectedStage(null); 
                  setShowOnlyFavorites(false); 
                  setShowStudyCamp(false); 
                  setShowEducationalMindMap(false); 
                  setShowStudentChat(false); 
                  setShowAdminDashboard(false);
                  setShowParentPortal(false);
                  setActiveGrade(null);
                  setTimeout(() => {
                    const stagesEl = document.getElementById("stages-section-anchor");
                    stagesEl?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 120);
                }} 
                className="hover:text-[#A35130] transition-colors border-b-2 border-transparent hover:border-[#A35130] pb-1 cursor-pointer select-none"
              >
                المراحل الدراسية
              </button>
              <button 
                onClick={handleLibraryClick} 
                className="hover:text-[#A35130] transition-colors border-b-2 border-transparent hover:border-[#A35130] pb-1 cursor-pointer select-none"
              >
                الموارد التعليمية
              </button>
              <button 
                onClick={() => setShowOnboardingGuide(true)} 
                className="hover:text-[#A35130] transition-colors border-b-2 border-transparent hover:border-[#A35130] pb-1 cursor-pointer select-none"
              >
                عن المنصة
              </button>
            </div>

            {/* Left side: Search input & Login Pill */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              
              {/* Search Bar */}
              <div className="relative flex items-center bg-[#FAF5EC] border border-mud/10 rounded-2xl px-3 py-1.5 w-36 sm:w-48 text-[#5C2C16] shadow-inner">
                <Search className="w-3.5 h-3.5 opacity-60 ml-1.5 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث عن مادة..." 
                  className="bg-transparent text-3xs font-extrabold outline-none text-right w-full placeholder-mud/40"
                />
              </div>

              {/* Login/Profile Pill */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-[#FAF5EC] border border-mud/10 rounded-2xl px-2.5 py-1.5 text-3xs sm:text-2xs">
                  <User className="w-3 h-3 text-[#A35130]" />
                  <button 
                    onClick={triggerEditProfile}
                    className="text-[#A35130] font-black hover:underline max-w-[70px] sm:max-w-[100px] truncate"
                    title="تعديل الحساب"
                  >
                    {currentUser.username}
                  </button>
                  <span className="text-[#A35130]/30">|</span>
                  <button 
                    onClick={() => { 
                      setCurrentUser(null); 
                      localStorage.removeItem("sudan_auth_user"); 
                    }} 
                    className="text-rose-600 hover:text-rose-500 font-extrabold" 
                    title="تسجيل الخروج"
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setShowUserModal(true); setUserModalTab("login"); }}
                  className="bg-[#A35130] hover:bg-[#8E4122] text-white font-black text-3xs sm:text-2xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer select-none"
                >
                  تسجيل الدخول
                </button>
              )}

              {/* Functional Mini Utilities for complete integration */}
              <div className="flex items-center gap-1">
                {currentUser && currentUser.user_role !== "guest" && (
                  <button 
                    onClick={() => { setShowNotificationsDropdown(prev => !prev); setShowTopSearch(false); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5EC] hover:bg-cream border border-mud/10 flex items-center justify-center relative text-[#A35130] cursor-pointer"
                  >
                    <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? "text-amber-500 animate-bounce" : "text-[#A35130]"}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {currentUser && currentUser.user_role !== "guest" && (
                  <button 
                    onClick={() => setShowStudentChat(prev => !prev)}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer ${showStudentChat ? "bg-[#A35130] text-white border-[#A35130]" : "bg-[#FAF5EC] hover:bg-cream border-mud/10 text-[#A35130]"}`}
                    title="الدردشة الطلابية"
                  >
                    <MessagesSquare className="w-3.5 h-3.5" />
                  </button>
                )}

                <button 
                  onClick={() => setShowUserSettingsIcons(prev => !prev)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer ${showUserSettingsIcons ? "bg-[#A35130] text-white border-[#A35130]" : "bg-[#FAF5EC] hover:bg-cream border-mud/10 text-[#A35130]"}`}
                  title="أدوات ومظهر المنصة"
                >
                  <CustomSettingsIcon className={`w-3.5 h-3.5 ${showUserSettingsIcons ? "animate-spin-slow" : ""}`} />
                </button>
              </div>

            </div>

          </div>

          <AnimatePresence>
            {showUserSettingsIcons && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-[#FFFDF9] rounded-2xl border border-mud/10 p-3 shadow-md max-w-sm ml-auto mr-0 text-right space-y-3 font-sans relative z-[99]"
                dir="rtl"
              >
                <div className="flex items-center justify-between border-b border-mud/5 pb-2">
                  <span className="text-3xs font-black text-[#5C2C16]">إعدادات ومظهر المنصة 🛠️</span>
                  <button onClick={() => setShowUserSettingsIcons(false)} className="text-3xs text-mud/50 hover:text-mud">إغلاق ×</button>
                </div>
                
                <div className="flex flex-col gap-2 text-3xs font-extrabold text-[#5C2C16]">
                  <div className="flex items-center justify-between gap-4">
                    <span>مظهر المنصة:</span>
                    <button 
                      onClick={toggleSiteTheme}
                      className="px-2.5 py-1 bg-[#FAF5EC] border border-mud/15 rounded-lg text-[#A35130]"
                    >
                      {siteTheme === "heritage" ? "التصميم التراثي 🌾" : siteTheme === "sudanese" ? "التصميم السوداني 🇸🇩" : "التصميم الداكن 🌙"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>لغة العرض:</span>
                    <button 
                      onClick={() => {
                        const nextLang = currentLang === "ar" ? "en" : "ar";
                        setCurrentLang(nextLang);
                        localStorage.setItem("sudan_edu_lang", nextLang);
                      }}
                      className="px-2.5 py-1 bg-[#FAF5EC] border border-mud/15 rounded-lg text-[#A35130]"
                    >
                      {currentLang === "ar" ? "العربية 🇸🇩" : "English 🇬🇧"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>حالة المزامنة:</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] ${isOnline ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {isOnline ? "متصل سحابياً ⚡" : "تصفح أوفلاين 📡"}
                    </span>
                  </div>

                  {currentUser && currentUser.user_role === "student" && (currentUser?.grade_id?.startsWith("pri-") || currentUser?.grade_id?.startsWith("kg-")) && (
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-mud/5">
                      <span>واجهة الأطفال البراعم:</span>
                      <button 
                        onClick={() => {
                          const nextVal = !isKidModeActive;
                          setKidModeOverride(nextVal);
                          playKidChime(nextVal ? 'success' : 'click');
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] ${isKidModeActive ? "bg-pink-100 text-pink-700 border-pink-300" : "bg-[#FAF5EC] text-[#5C2C16] border-mud/15"}`}
                      >
                        {isKidModeActive ? "مفعلة 🎈" : "تفعيل 🎈"}
                      </button>
                    </div>
                  )}

                  {!isAdminLoggedIn && (
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-mud/5">
                      <span>بوابة إدارة المنهج:</span>
                      <button 
                        onClick={() => { setShowAdminLogin(true); setShowUserSettingsIcons(false); }}
                        className="px-2.5 py-1 bg-[#FAF5EC] border border-mud/15 rounded-lg text-[#8a1111]"
                      >
                        دخول الإدارة 🔐
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className={`transition-all duration-300 border-b px-3 sm:px-6 py-2.5 relative z-50 ${
          isWarmTheme
            ? "bg-white shadow-sm shadow-[#5C2C16]/5 border-mud/10 text-mud"
            : "bg-slate-900/90 border-slate-800/60 text-slate-100"
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full" dir="ltr">
          
          {/* LEFT SIDE: Helper Icons Group (Positioned next to the left side of the page and hidden until user settings is clicked) */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {showUserSettingsIcons && (
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className="flex items-center flex-wrap gap-1.5 sm:gap-2"
                  dir={currentLang === "ar" ? "rtl" : "ltr"}
                >
                  {/* Elegant Offline Indicator Badge & Wifi Indicator */}
                  <div className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
                    <div 
                      className={`inline-flex items-center justify-center p-1.5 rounded-xl border transition-all duration-300 ${
                        isOnline 
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                          : 'bg-amber-950/20 text-amber-400 border-amber-900/40 animate-pulse'
                      }`}
                      title={isOnline ? "مزامنة ذكية مفعلة - جميع المواد المفتوحة تُحمل تلقائياً" : "وضع عدم الاتصال مفعل - تصفح ما تم فتحه مسبقاً بدقة عالية"}
                    >
                      {isOnline ? (
                        <Wifi className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  {/* Page Refresh Button */}
                  <button
                    onClick={() => {
                      window.location.reload();
                    }}
                    className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                      isWarmTheme
                        ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                        : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
                    }`}
                    title={currentLang === "ar" ? "تحديث الصفحة" : "Refresh Page"}
                  >
                    <RotateCw className="w-3.5 h-3.5 text-earthgold-600" />
                  </button>

                  {/* Theme Switcher Button */}
                  <button
                    onClick={toggleSiteTheme}
                    className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                      isWarmTheme
                        ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                        : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
                    }`}
                    title={currentLang === "ar" ? "تغيير مظهر المنصة" : "Switch Theme"}
                  >
                    <span className="text-[14px]">🎨</span>
                    <span className="hidden sm:inline">
                      {currentLang === "ar" 
                        ? (siteTheme === "heritage" ? "التصميم التراثي" : siteTheme === "sudanese" ? "التصميم السوداني" : "التصميم الداكن") 
                        : (siteTheme === "heritage" ? "Heritage Style" : siteTheme === "sudanese" ? "Sudanese Style" : "Dark Legacy")}
                    </span>
                  </button>

                  {/* Language Toggle Button */}
                  <button
                    onClick={() => {
                      const nextLang = currentLang === "ar" ? "en" : "ar";
                      setCurrentLang(nextLang);
                      localStorage.setItem("sudan_edu_lang", nextLang);
                    }}
                    className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                      siteTheme === "sudanese"
                        ? "bg-white hover:bg-cream/50 border-mud/25 text-mud hover:border-earthgold/60"
                        : "bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60 text-slate-200"
                    }`}
                    title={currentLang === "ar" ? "Switch to English" : "التحويل للغة العربية"}
                  >
                    <Globe className={`w-3.5 h-3.5 ${siteTheme === "sudanese" ? "text-earthgold" : "text-emerald-400"}`} />
                    <span className="text-[10px] font-black ml-1 sm:hidden">{currentLang === "ar" ? "EN" : "AR"}</span>
                    <span className="hidden sm:inline">{currentLang === "ar" ? " English" : " العربية"}</span>
                  </button>

                  {/* Platform User Guide (دليل المنصة) */}
                  <button
                    id="platform-guide-button"
                    onClick={() => setShowOnboardingGuide(true)}
                    className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer font-sans border ${
                      siteTheme === "sudanese"
                        ? "bg-[#FAF5EC] hover:bg-[#F3EFE6] border-mud/25 text-[#5C2C16] hover:border-earthgold/60"
                        : "bg-emerald-950/20 hover:bg-emerald-900/35 border-[#e5e5e5] text-emerald-300 hover:border-emerald-500/60"
                    }`}
                    title={currentLang === "ar" ? "دليل استخدام المنصة" : "Platform Guide"}
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline ml-1">
                      {currentLang === "ar" ? "دليل المنصة" : "Platform Guide"}
                    </span>
                  </button>

                  {/* Kid Mode (البراعم) Playful Toggle Button - only visible to registered primary/kindergarten stage students */}
                  {currentUser && currentUser.user_role === "student" && (currentUser?.grade_id?.startsWith("pri-") || currentUser?.grade_id?.startsWith("kg-")) && (
                    <button
                      onClick={() => {
                        const nextVal = !isKidModeActive;
                        setKidModeOverride(nextVal);
                        playKidChime(nextVal ? 'success' : 'click');
                      }}
                      className={`relative rounded-full shadow-lg transition-all duration-305 cursor-pointer flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 shrink-0 ${
                        isKidModeActive
                          ? "bg-pink-500/25 border-2 border-pink-400 ring-4 ring-pink-500/35 scale-110 shadow-pink-500/30 animate-bounce"
                          : "bg-slate-950/75 border border-slate-800 hover:border-pink-500/60 hover:scale-110 shadow-inner"
                      }`}
                      title={currentLang === "ar" ? "اضغط على البالون للانتقال لواجهة الأطفال اللطيفة! 🎈" : "Click the balloon to launch children mode! 🎈"}
                    >
                      <span className={`text-[16px] sm:text-[20px] select-none transition-all duration-300 ${isKidModeActive ? "scale-110" : "hover:scale-115"}`} style={{ transformOrigin: 'center' }}>
                        🎈
                      </span>
                      {isKidModeActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  )}

                  {/* Live Student Chat Tab */}
                  {currentUser && currentUser.user_role !== "guest" && (
                    <button
                      onClick={() => {
                        const targetState = !showStudentChat;
                        setShowStudentChat(targetState);
                        
                        // Clear unread indicator
                        const nowStr = new Date().toISOString();
                        localStorage.setItem("sudan_chat_last_read", nowStr);
                        setLastCheckedChat(nowStr);

                        // Seamless mobile focus scroll
                        if (targetState && window.innerWidth < 1024) {
                          setTimeout(() => {
                            const chatEl = document.getElementById("friends-chat-dashboard") || document.getElementById("chat-visitor-blocked");
                            chatEl?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 250);
                        }
                      }}
                      className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 border font-sans font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer ${
                        showStudentChat
                          ? "bg-indigo-650/25 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-slate-950/60 border-slate-800 hover:bg-slate-900 hover:border-indigo-500/50 text-slate-200"
                      }`}
                      title={currentLang === "ar" ? "الدردشة الطلابية" : "Student Chat"}
                    >
                      <MessagesSquare className="w-4 h-4 text-indigo-400" />
                      <span className="hidden sm:inline">
                        {currentLang === "ar" ? " الدردشة" : " Chat"}
                      </span>
                    </button>
                  )}

                  {/* Search Lens Button and Popover */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowTopSearch(prev => !prev);
                        setShowNotificationsDropdown(false);
                      }}
                      className={`inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl shadow-sm transition-all duration-305 cursor-pointer relative ${
                        showTopSearch 
                          ? "bg-[#5C2C16] text-[#FAF5EC] ring-2 ring-[#5C2C16]/20" 
                          : "bg-[#D4AF37] hover:bg-[#D4AF37]/90 border border-[#D4AF37]/20 text-white shadow-md shadow-[#D4AF37]/10"
                      }`}
                      style={!showTopSearch ? { backgroundColor: '#D4AF37' } : {}}
                      title={currentLang === "ar" ? "البحث السريع والترشيح" : "Quick Search & Filter"}
                    >
                      <Search className="w-3.5 h-3.5 text-white" style={{ color: '#ffffff' }} />
                    </button>

                    <AnimatePresence>
                      {showTopSearch && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={`absolute left-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl p-5 z-[9999] text-right font-sans border ${
                            siteTheme === "sudanese"
                              ? "bg-white border-mud/15 text-mud"
                              : "bg-slate-900 border-slate-800 text-slate-100"
                          }`}
                          dir={currentLang === "ar" ? "rtl" : "ltr"}
                        >
                          <div className="flex items-center justify-between border-b border-mud/10 pb-2.5 mb-4">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Search className={`w-4 h-4 ${siteTheme === "sudanese" ? "text-earthgold" : "text-emerald-400"}`} />
                              <h5 className="text-xs font-black">
                                {currentLang === "ar" ? "البحث والترشيح السريع 🔍" : "Quick Search & Filter 🔍"}
                              </h5>
                            </div>
                            <button
                              onClick={() => setShowTopSearch(false)}
                              className="text-[10px] text-mud/50 hover:text-mud transition-colors cursor-pointer"
                            >
                              {currentLang === "ar" ? "إغلاق ✕" : "Close ✕"}
                            </button>
                          </div>

                          <div className="space-y-4 text-right" dir="rtl">
                            {/* Search Input Box */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold block mb-1">
                                {currentLang === "ar" ? "كلمة البحث" : "Search Query"}
                              </label>
                              <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                                siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                              }`}>
                                <Search className="w-4 h-4 opacity-50 shrink-0 select-none ml-2" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder={currentLang === "ar" ? "اكتب اسم المادة..." : "Type subject..."}
                                  className="bg-transparent w-full outline-none text-xs font-semibold text-right"
                                />
                              </div>
                            </div>

                            {/* Stage selection */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold block mb-1">
                                {currentLang === "ar" ? "المرحلة الدراسية" : "Educational Level"}
                              </label>
                              <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                                siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                              }`}>
                                <select
                                  value={selectedStage ? selectedStage.id : ""}
                                  onChange={(e) => {
                                    const stageId = e.target.value;
                                    if (stageId === "") {
                                      setSelectedStage(null);
                                      setActiveGrade(null);
                                    } else {
                                      const stg = curriculumData.find(s => s.id === stageId);
                                      if (stg) {
                                        setSelectedStage(stg);
                                        setActiveGrade(null);
                                        setShowOnlyFavorites(false);
                                        setShowStudyCamp(false);
                                        setShowEducationalMindMap(false);
                                      }
                                    }
                                  }}
                                  className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                                >
                                  <option value="" className="text-slate-855">{currentLang === "ar" ? "جميع المراحل التعليمية" : "All Stages"}</option>
                                  {curriculumData.map(st => (
                                    <option key={st.id} value={st.id} className="text-slate-855">
                                      {st.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Grade selection */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold block mb-1">
                                {currentLang === "ar" ? "الصف الدراسي" : "Class / Grade"}
                              </label>
                              <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                                siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                              }`}>
                                <select
                                  value={activeGrade ? activeGrade.id : ""}
                                  onChange={(e) => {
                                    const gradeId = e.target.value;
                                    if (gradeId === "") {
                                      setActiveGrade(null);
                                    } else {
                                      if (selectedStage) {
                                        const gr = selectedStage.grades.find(g => g.id === gradeId);
                                        if (gr) {
                                          setActiveGrade(gr);
                                        }
                                      } else {
                                        let fs = null;
                                        let fg = null;
                                        curriculumData.forEach(st => {
                                          const gr = st.grades.find(g => g.id === gradeId);
                                          if (gr) {
                                            fs = st;
                                            fg = gr;
                                          }
                                        });
                                        if (fs && fg) {
                                          setSelectedStage(fs);
                                          setActiveGrade(fg);
                                        }
                                      }
                                    }
                                  }}
                                  className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                                >
                                  <option value="" className="text-slate-855">{currentLang === "ar" ? "اختر الصف الدراسي..." : "Select Class..."}</option>
                                  {(selectedStage ? selectedStage.grades : curriculumData.flatMap(st => st.grades)).map(gr => (
                                    <option key={gr.id} value={gr.id} className="text-slate-855">
                                      {gr.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Subject selection */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold block mb-1">
                                {currentLang === "ar" ? "قائمة المواد" : "Subject Filter"}
                              </label>
                              <div className={`relative flex items-center rounded-xl p-2.5 border shadow-inner ${
                                siteTheme === "sudanese" ? "bg-[#FDFBF7] border-mud/15 text-mud" : "bg-slate-950 border-slate-800 text-slate-200"
                              }`}>
                                <select
                                  value={activeSubject ? activeSubject.id : ""}
                                  onChange={(e) => {
                                    const subId = e.target.value;
                                    if (subId) {
                                      let foundSub = null;
                                      curriculumData.forEach(st => {
                                        st.grades.forEach(g => {
                                          const sub = g.subjects.find(s => s.id === subId);
                                          if (sub) foundSub = sub;
                                        });
                                      });
                                      if (foundSub) handleOpenSubject(foundSub);
                                    }
                                  }}
                                  className="w-full bg-transparent outline-none appearance-none text-xs font-bold cursor-pointer text-right"
                                >
                                  <option value="" className="text-slate-855">{currentLang === "ar" ? "تصفح المواد..." : "Go to Subject..."}</option>
                                  {(activeGrade ? activeGrade.subjects : curriculumData.flatMap(st => st.grades.flatMap(g => g.subjects))).map(s => (
                                    <option key={s.id} value={s.id} className="text-slate-855">
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute left-3 w-4 h-4 opacity-60 pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notification Bell Dropdown Component */}
                  {currentUser && currentUser.user_role !== "guest" && (
                    <div className="relative" ref={notificationDropdownRef}>
                      <button
                        onClick={() => {
                          setShowNotificationsDropdown(prev => !prev);
                          setShowTopSearch(false);
                          if (!showNotificationsDropdown) {
                            const nowStr = new Date().toISOString();
                            localStorage.setItem("sudan_updates_last_read", nowStr);
                            setLastCheckedUpdates(nowStr);
                          }
                        }}
                        className={`inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl shadow-sm transition-all duration-300 cursor-pointer relative ${
                          showNotificationsDropdown 
                            ? "bg-amber-955/35 border-amber-500 text-amber-300 ring-2 ring-amber-500/20" 
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-200"
                        }`}
                        title={currentLang === "ar" ? "الإشعارات" : "Notifications"}
                      >
                        <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? "text-amber-400 animate-bounce" : "text-slate-400"}`} />
                        {unreadCount > 0 && (
                          <span 
                            className="absolute -top-1 -right-1 z-20 min-w-[16px] h-4 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-slate-950 animate-pulse px-1"
                            style={{ backgroundColor: '#8a1111', zIndex: 20 }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showNotificationsDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[9999] text-right font-sans"
                            dir={currentLang === "ar" ? "rtl" : "ltr"}
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-1.5">
                                <Bell className="w-4 h-4 text-amber-500" />
                                <h5 className="text-xs font-black text-slate-100">
                                  {currentLang === "ar" ? "الإشعارات والتحديثات 🔔" : "Notifications & Updates 🔔"}
                                </h5>
                              </div>
                              <button
                                onClick={() => {
                                  const nowStr = new Date().toISOString();
                                  localStorage.setItem("sudan_chat_last_read", nowStr);
                                  setLastCheckedChat(nowStr);
                                  localStorage.setItem("sudan_updates_last_read", nowStr);
                                  setLastCheckedUpdates(nowStr);
                                  setShowNotificationsDropdown(false);
                                }}
                                className="text-[9px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                {currentLang === "ar" ? "تحديد كالمقروءة وإغلاق ✓" : "Mark read & close ✓"}
                              </button>
                            </div>

                            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                              {formattedNotifications.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 text-2xs space-y-1">
                                  <p className="font-extrabold text-slate-400">
                                    {currentLang === "ar" ? "لا توجد إشعارات جديدة حالياً." : "No new notifications yet."}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {currentLang === "ar" 
                                      ? "سيتم تنبيهك هنا عند تلقي طلب صداقة، رسائل جديدة، أو إضافة مواد وروابط." 
                                      : "You will be notified of requests, replies, new subjects, or resource links here."}
                                  </p>
                                </div>
                              ) : (
                                formattedNotifications.map(item => (
                                  <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                      item.isUnread
                                        ? "bg-amber-955/5 border-amber-900/40 hover:bg-slate-850 hover:border-amber-500/30"
                                        : "bg-slate-950/40 border-slate-900/40 hover:bg-slate-850"
                                    }`}
                                  >
                                    <div className="flex gap-2.5 items-start">
                                      <div className={`p-1.5 rounded-lg shrink-0 ${item.iconBg}`}>
                                        {item.icon}
                                      </div>
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-black text-slate-100 truncate block">{item.title}</span>
                                          {item.isUnread && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                          )}
                                        </div>
                                        <p className="text-[9px] text-slate-350 leading-normal font-medium whitespace-pre-line text-right">
                                          {item.body}
                                        </p>
                                        <span className="text-[8px] text-slate-500 block pt-0.5 font-mono text-right">{item.timeLabel}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Admin Portal Lock Icon next to User / Wifi */}
                  <div className="relative">
                    {isAdminLoggedIn ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded-lg border border-emerald-900/30">إدارة</span>
                        <button
                          onClick={handleAdminLogout}
                          className="p-1 bg-rose-955/20 hover:bg-rose-900/20 border border-rose-900/40 text-rose-450 hover:text-rose-350 rounded-lg transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
                          title={t("logout")}
                        >
                          <LogOut className="w-3 h-3 text-rose-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowAdminLogin(prev => !prev);
                          setAdminLoginError("");
                          setAdminUsername("");
                          setAdminPassword("");
                        }}
                        className="inline-flex items-center justify-center p-1.5 bg-red-950/20 hover:bg-red-900/20 border border-red-900/40 text-red-500 hover:text-red-400 rounded-xl shadow-sm transition-all duration-300 cursor-pointer animate-pulse"
                        title={currentLang === "ar" ? "دخول المسؤول المفوّض" : "Authorized Administrator Portal Login"}
                      >
                        <Lock className="w-3.5 h-3.5 text-[#8a1111]" style={{ color: '#8a1111' }} />
                      </button>
                    )}

                    {/* Admin Login Dialog dropdown */}
                    <AnimatePresence>
                      {showAdminLogin && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[9999] space-y-3 font-sans text-right"
                          style={{ direction: 'rtl' }}
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h5 className="text-[10px] font-black text-slate-100 flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-emerald-400" />
                              <span>دخول إدارة المنهج التعليمي 🇸🇩</span>
                            </h5>
                            <button 
                              onClick={() => setShowAdminLogin(false)}
                              className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAdminLoginSubmit(e);
                            }} 
                            className="space-y-2.5"
                          >
                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">اسم المسؤول</label>
                              <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500/50 text-right"
                                value={adminUsername}
                                onChange={(e) => setAdminUsername(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">كلمة المرور</label>
                              <input
                                type="password"
                                autoComplete="new-password"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500/50 text-right"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                              />
                            </div>

                            {adminLoginError && (
                              <p className="text-[9px] text-rose-400 font-bold bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30 text-right">
                                {adminLoginError}
                              </p>
                            )}

                            <button
                              type="submit"
                              className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-[10px] rounded-lg shadow transition-all active:scale-95"
                            >
                              تسجيل الدخول كمسؤول
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDE: User settings & login pill */}
          <div className="flex items-center gap-2 shrink-0" dir={currentLang === "ar" ? "rtl" : "ltr"}>
            {currentUser ? (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-950 px-2 sm:px-3 py-1.5 border border-slate-800 rounded-xl shadow-inner select-none">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
                
                {/* Clickable Username to edit profile */}
                <motion.button
                  onClick={triggerEditProfile}
                  className="inline-flex items-center gap-1 text-3xs sm:text-2xs text-indigo-300 hover:text-indigo-200 transition-colors font-extrabold max-w-[90px] sm:max-w-[130px] truncate cursor-pointer"
                  title={t("editProfile")}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <User className="w-3.5 h-3.5 text-indigo-455 shrink-0" />
                  <span className="truncate">{currentUser.username}</span>
                </motion.button>

                <div className="h-4 w-px bg-slate-800 shrink-0" />

                {/* Settings Toggle for Hidden Icons (اعدادات المستخدم) */}
                <button
                  onClick={() => setShowUserSettingsIcons(prev => !prev)}
                  className={`inline-flex items-center gap-1 text-3xs sm:text-2xs transition-all duration-300 cursor-pointer font-extrabold px-1 rounded-lg ${
                    showUserSettingsIcons 
                      ? "text-emerald-400 bg-emerald-950/30 border border-emerald-900/30" 
                      : "text-amber-500 hover:text-amber-400"
                  }`}
                  title={currentLang === "ar" ? "أدوات وتعديلات المنصة" : "Platform Settings & Tools"}
                >
                  <CustomSettingsIcon className={`w-3.5 h-3.5 ${showUserSettingsIcons ? "text-emerald-400 animate-spin-slow" : "text-amber-500"}`} />
                  <span className="hidden sm:inline">
                    {currentLang === "ar" ? "الأدوات" : "Tools"}
                  </span>
                </button>

                <div className="h-4 w-px bg-slate-800 shrink-0" />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem("sudan_auth_user");
                    // Clear all credentials inputs to protect user data on shared devices
                    setUserEmail("");
                    setUserPassword("");
                    setUserUsername("");
                    setAdminUsername("");
                    setAdminPassword("");
                    const client = getSupabaseClient();
                    if (client) {
                      client.auth.signOut();
                    }
                    setSaveStatus(t("logoutSuccess"));
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  className="inline-flex items-center gap-1 text-3xs sm:text-2xs text-rose-555 hover:text-rose-455 transition-colors cursor-pointer font-extrabold"
                  title={t("logout")}
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span className="hidden sm:inline">{t("logout")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Settings Toggle for Hidden Icons when logged out */}
                <motion.button
                  onClick={() => setShowUserSettingsIcons(prev => !prev)}
                  className={`inline-flex items-center justify-center p-1.5 rounded-xl border transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                    showUserSettingsIcons 
                      ? "bg-emerald-955/35 hover:bg-emerald-900/50 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20" 
                      : "bg-slate-950/60 hover:bg-slate-900/90 hover:border-slate-700 text-slate-350"
                  }`}
                  title={currentLang === "ar" ? "أدوات وتعديلات المنصة" : "Platform Settings & Tools"}
                  animate={{ scale: [1, 1.04, 1] }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <CustomSettingsIcon className={`w-3.5 h-3.5 ${showUserSettingsIcons ? "animate-spin-slow" : ""}`} />
                </motion.button>

                <button
                  onClick={() => {
                    setShowUserModal(true);
                    setUserModalTab("login");
                    setUserEmail("");
                    setUserPassword("");
                    setUserUsername("");
                    setUserAuthError("");
                    setUserAuthSuccess("");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/65 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 font-extrabold text-3xs md:text-2xs rounded-xl shadow-sm transition-all duration-300 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-455" />
                  <span className="hidden xs:inline">{t("studentAccount")}</span>
                  <span className="xs:hidden">{currentLang === "ar" ? "حسابي" : "Account"}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      )}
          {siteTheme === "legacy" && (
            <header className="relative py-12 md:py-16 px-6 overflow-hidden">
              {/* Abstract Geometrics */}
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-emerald-950/20 via-slate-950/30 to-slate-950 pointer-events-none" />
              <div className="absolute -left-36 top-12 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -right-36 top-0 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl text-center md:text-right">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-955/50 border border-emerald-900/40 text-emerald-400 text-xs font-semibold shadow-inner">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("siteForSudan")}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight md:leading-normal font-sans">
                    {currentLang === "ar" ? (
                      <>منصة السودان <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-400">التعليمية التفاعلية</span></>
                    ) : (
                      <>Sudanese <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-500 to-yellow-400">Interactive Platform</span></>
                    )}
                  </h1>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
                    {t("gatewayDesc")}
                  </p>
                </div>

                {/* Simple Statistics & Admin Gate widgets */}
                <div className={`w-full md:w-auto grid gap-4 flex-shrink-0 ${
                  isAdminLoggedIn || showHiddenAdminGate 
                    ? "grid-cols-2 md:grid-cols-4" 
                    : "grid-cols-2 md:grid-cols-3"
                }`}>
                  <div 
                    onClick={() => {
                      setShowOnlyFavorites(prev => !prev);
                      setShowStudyCamp(false);
                      setShowEducationalMindMap(false);
                      setShowStudentChat(false);
                      setShowAdminDashboard(false);
                    }}
                    className={`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 select-none ${
                      showOnlyFavorites 
                        ? "bg-amber-955/20 border-yellow-500/80 ring-2 ring-yellow-500/30 text-amber-400 hover:bg-amber-955/40 shadow-yellow-955/40" 
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-yellow-500/40"
                    }`}
                  >
                    <Star className={`w-5 h-5 mx-auto transition-all ${showOnlyFavorites ? "text-yellow-400 fill-yellow-400 scale-110" : "text-yellow-400"}`} />
                    <span className="text-xl font-bold text-slate-100 block">{favoriteSubjects.length}</span>
                    <span className="text-2xs text-slate-400 block font-bold">
                      {showOnlyFavorites ? (currentLang === "ar" ? "المناهج الكاملة" : "Full Curricula") : (currentLang === "ar" ? "المواد المفضلة ⭐" : "My Favorites ⭐")}
                    </span>
                  </div>

                  {(selectedStage?.id === "kindergarten" || selectedStage?.id === "primary" || (currentUser?.user_role === "student" && (currentUser?.grade_id?.startsWith("pri-") || currentUser?.grade_id?.startsWith("kg-")))) && (
                    <div 
                      onClick={handleGamesClick}
                      className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 p-4 border border-white/20 rounded-2xl text-center flex flex-col justify-center items-center gap-2 min-w-[140px] shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.08] hover:rotate-1 animate-bounce select-none group"
                      style={{ animationDuration: '4s' }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🍭</span>
                        <span className="text-sm animate-pulse">🎮</span>
                      </div>
                      <span className="text-2xs text-white block font-black uppercase tracking-wide">
                        {currentLang === "ar" ? "ألعاب تعليمية" : "Educational Games"}
                      </span>
                    </div>
                  )}

                  {/* 📚 Premium Vintage Book Cover Card for Public Library (المكتبة العامة) - Legacy Theme */}
                  <div 
                    onClick={handleLibraryClick}
                    className="p-4 bg-gradient-to-br from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 rounded-2xl text-center space-y-1 shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between select-none group"
                    style={{ width: '200px', height: '250px' }}
                  >
                    <div className="bg-[#1E0D06]/70 px-1 py-0.5 rounded border border-amber-500/20 text-[7px] font-bold text-amber-400 text-center w-fit mx-auto leading-none">
                      كنوز المعرفة 📜
                    </div>
                    <div className="py-1">
                      <span className="text-xs font-black text-amber-300 block leading-tight">المكتبة العامة</span>
                      <span className="text-[9px] text-amber-400/80 leading-none block">الكتب التفاعلية والمصادر</span>
                    </div>
                    
                    {/* Golden Seal Stamp */}
                    <div className="relative z-10 mx-auto flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/10 group-hover:animate-spin">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          )}

          {siteTheme !== "legacy" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
               {/* Visual Sudanese Heritage Gottia Pattern Backdrop Hero */}
               <div className="bg-[#FDFBF7] border border-mud/15 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-inner lg:w-[1100px] max-w-full mx-auto">
                  
                  {/* Backdrop styling depending on theme */}
                  {siteTheme === "heritage" ? (
                     <div className="absolute inset-0 bg-[#FFFDF9] opacity-40 mix-blend-multiply pointer-events-none" />
                  ) : (
                     <div className="absolute inset-0 bg-gradient-to-tr from-cream via-white to-cream opacity-50 mix-blend-multiply pointer-events-none" />
                  )}

                  {/* Left side: welcome content and counters */}
                  <div className="space-y-4 max-w-2xl text-center md:text-right relative z-10">
                     <h2 className="text-sm sm:text-2xl md:text-3xl font-black text-mud leading-snug">
                        {currentLang === "ar" ? " بوابة نقلة للمناهج الالكترونية التعليمية التفاعلية " : "Interactive Gateway to Sudanese Unified Curricula"}
                     </h2>
                     <p className="text-[10px] sm:text-xs text-mud/85 leading-relaxed max-w-lg font-sans">
                        {currentLang === "ar" 
                          ? "نهدف لتوفير وصول دائم ومجاني لجميع المناهج الدراسية، الكتب، المذكرات التلخيصية، الشروحات التفاعلية، ومعامل الذكاء الاصطناعي المساندة للتعليم في السودان." 
                          : "Dedicated to providing free interactive school books, summaries, simulations, and virtual assistance for teachers and students."}
                     </p>

                     {/* Beautiful Traditional Sudanese Heritage Stats/Favorites/Admin Counters */}
                     <div className="flex flex-wrap gap-1.5 sm:gap-2.5 pt-1 sm:pt-2 font-sans">
                        {/* 📈 Beautiful Heritage Visitor Counter Badge */}
                        <div 
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[#EAD4A8]/15 border border-[#D4AF37]/35 text-[10px] sm:text-2xs font-extrabold text-mud/90 shadow-2xs hover:scale-105 transition-all duration-300 select-none cursor-pointer"
                           title={currentLang === "ar" ? "عدد زوار منصة نقلة للتعليم التفاعلي" : "Total visitors of Nakla interactive platform"}
                        >
                           <span className="text-xs">🇸🇩</span>
                           <span className="text-[#A35130] font-black tracking-wide text-[11px] sm:text-xs">
                             {visitorCount !== null 
                               ? (currentLang === "ar" 
                                   ? visitorCount.toLocaleString("ar-EG") 
                                   : visitorCount.toLocaleString("en-US")) 
                               : "..."}
                           </span>
                           <span>
                             {currentLang === "ar" ? "زائر سعيد" : "Happy Visitors"}
                           </span>
                        </div>

                        <button 
                           onClick={() => {
                              setShowOnlyFavorites(prev => !prev);
                              setShowStudyCamp(false);
                              setShowEducationalMindMap(false);
                              setShowStudentChat(false);
                              setShowAdminDashboard(false);
                              setShowParentPortal(false);
                              setSelectedStage(null);
                              setActiveGrade(null);
                           }}
                           className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs ${
                              showOnlyFavorites 
                                ? "bg-[#D4AF37] text-white border-[#D4AF37] ring-4 ring-[#D4AF37]/20" 
                                : "bg-white hover:bg-cream border-mud/15 text-mud"
                           }`}
                        >
                           <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${showOnlyFavorites ? "fill-white text-white" : "text-amber-500 fill-[#D4AF37]"}`} />
                           <span className="font-extrabold">{favoriteSubjects.length}</span>
                           <span>
                              {showOnlyFavorites ? (currentLang === "ar" ? "تصفح جميع المناهج 📋" : "Browse All Curricula 📋") : (currentLang === "ar" ? "المواد المفضلة ⭐" : "My Favorites ⭐")}
                           </span>
                        </button>

                        {currentUser?.user_role === "parent" && (
                           <button 
                              onClick={() => {
                                 setShowParentPortal(prev => !prev);
                                 setShowOnlyFavorites(false);
                                 setShowStudyCamp(false);
                                 setShowEducationalMindMap(false);
                                 setShowStudentChat(false);
                                 setShowAdminDashboard(false);
                                 setSelectedStage(null);
                                 setActiveGrade(null);
                                 if (!showParentPortal) {
                                    fetchParentRelations();
                                 }
                              }}
                              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs ${
                                 showParentPortal 
                                   ? "bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-600/20" 
                                   : "bg-white hover:bg-cream border-mud/15 text-mud"
                              }`}
                           >
                              <span className="text-xs">👪</span>
                              <span>
                                 {currentLang === "ar" ? "بوابة الآباء ومتابعة الأبناء" : "Parent Portal & Monitoring"}
                              </span>
                           </button>
                        )}

                        {(selectedStage?.id === "kindergarten" || selectedStage?.id === "primary" || (currentUser?.user_role === "student" && (currentUser?.grade_id?.startsWith("pri-") || currentUser?.grade_id?.startsWith("kg-")))) && (
                           <button 
                              onClick={handleGamesClick}
                              className="flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 text-white font-black text-[11px] sm:text-xs shadow-md border-2 border-white/40 hover:border-white transition-all duration-300 hover:scale-[1.08] hover:rotate-1 cursor-pointer select-none animate-bounce"
                              style={{ animationDuration: '4s' }}
                           >
                              <span className="text-xs sm:text-sm">🍭</span>
                              <span>{currentLang === "ar" ? "ألعاب تعليمية" : "Educational Games"}</span>
                              <span className="text-xs sm:text-sm animate-pulse">🎮</span>
                           </button>
                        )}
                        
                        {(isAdminLoggedIn || showHiddenAdminGate) && (
                          <button 
                             onClick={() => {
                                if (isAdminLoggedIn) {
                                   setShowAdminDashboard(prev => !prev);
                                   setSelectedStage(null);
                                   setActiveGrade(null);
                                   setShowStudyCamp(false);
                                   setShowEducationalMindMap(false);
                                   setShowStudentChat(false);
                                   setShowOnlyFavorites(false);
                                } else {
                                   setShowAdminLogin(true);
                                   setAdminLoginError("");
                                   setAdminUsername("");
                                   setAdminPassword("");
                                }
                             }}
                             className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs ${
                                showAdminDashboard 
                                  ? "bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-700/20" 
                                  : "bg-white hover:bg-cream border-mud/15 text-mud"
                             }`}
                          >
                             <Lock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${showAdminDashboard ? "text-white" : "text-mud/60"}`} />
                             <span>
                                {isAdminLoggedIn ? (currentLang === "ar" ? "لوحة التحكم" : "Admin Dashboard") : (currentLang === "ar" ? "بوابة الإدارة" : "Admin Gate")}
                             </span>
                          </button>
                        )}
                     </div>
                  </div>

                  {/* Right side containers: Wisdom Grandmother Banner + Public Library Card */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shrink-0 mt-4 md:mt-0">
                     {/* SVG or Custom Animated Image/Video from Google Drive or Direct Link */}
                     <div 
                       onClick={() => {
                         if (isAdminLoggedIn) {
                           const newUrl = prompt(
                             currentLang === "ar" 
                               ? "أدخل رابط صورة أو فيديو الغلاف الجديد (دعها فارغة للافتراضي):" 
                               : "Enter new cover image/video URL (leave empty for default):", 
                             bannerImageUrl || ""
                           );
                           if (newUrl !== null) {
                             setBannerImageUrl(newUrl);
                             localStorage.setItem("sudan_edu_banner_image_v1", newUrl);
                             const newType = newUrl && (newUrl.endsWith(".mp4") || newUrl.includes("video") || newUrl.includes("drive.google.com/file/d/")) ? "video" : "image";
                             setBannerMediaType(newType);
                             localStorage.setItem("sudan_edu_banner_media_type_v1", newType);
                           }
                         }
                       }}
                       className="w-32 h-24 sm:w-64 sm:h-44 shrink-0 relative bg-white/20 rounded-2xl border border-mud/10 flex items-center justify-center shadow-inner overflow-hidden select-none transition-all duration-300 cursor-pointer group/banner"
                     >
                       {bannerImageUrl ? (
                         bannerMediaType === "video" ? (
                           <video
                             src={bannerImageUrl.includes("drive.google.com") ? convertGoogleDriveVideoUrl(bannerImageUrl) : bannerImageUrl}
                             autoPlay
                             loop
                             muted
                             playsInline
                             className="w-full h-full object-cover rounded-2xl pointer-events-none"
                             onError={(e) => {
                               console.warn("Custom banner video failed to load");
                             }}
                           />
                         ) : (
                           <img 
                             src={convertGoogleDriveUrl(bannerImageUrl)} 
                             alt="Banner Custom" 
                             className="w-full h-full object-cover rounded-2xl pointer-events-none"
                             referrerPolicy="no-referrer"
                             onError={(e) => {
                               console.warn("Custom banner image failed to load, fallback to default icon");
                             }}
                           />
                         )
                       ) : (
                          siteTheme === "heritage" ? (
                            <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
                              <defs>
                                 <linearGradient id="heritageSky" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FDFBF7" />
                                    <stop offset="100%" stopColor="#FAF5EC" />
                                 </linearGradient>
                                 <linearGradient id="gottiaStraw" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#D4AF37" />
                                    <stop offset="100%" stopColor="#AA7C11" />
                                 </linearGradient>
                                 <linearGradient id="thobeGold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="100%" stopColor="#FAF0DD" />
                                 </linearGradient>
                              </defs>
                              <rect width="200" height="150" fill="url(#heritageSky)" />
                              
                              {/* Golden Sun setting over the desert */}
                              <circle cx="165" cy="45" r="22" fill="#D4AF37" opacity="0.2" className="animate-pulse" />
                              <circle cx="165" cy="45" r="14" fill="#D4AF37" opacity="0.75" />

                              {/* Desert Sand Dunes */}
                              <path d="M -20 135 Q 40 105, 110 128 T 220 115 L 220 150 L -20 150 Z" fill="#E8DFCF" />
                              <path d="M -10 142 Q 60 128, 140 136 T 210 125 L 210 150 L -10 150 Z" fill="#F4EFE6" />

                              {/* Traditional Gottia Hut 1 (القاطية السودانية التراثية) */}
                              <g transform="translate(110, 80)">
                                 {/* Straw cone roof */}
                                 <polygon points="18,0 0,26 36,26" fill="url(#gottiaStraw)" stroke="#5C2C16" strokeWidth="0.8" />
                                 {/* Mud/brick wall */}
                                 <rect x="3" y="25" width="30" height="18" fill="#C57530" stroke="#5C2C16" strokeWidth="0.8" rx="1.5" />
                                 {/* Arched door */}
                                 <path d="M 14 33 A 4 4 0 0 1 22 33 L 22 43 L 14 43 Z" fill="#5C2C16" />
                              </g>

                              {/* Traditional Gottia Hut 2 */}
                              <g transform="translate(150, 88)">
                                 <polygon points="14,0 0,20 28,20" fill="#8C6239" stroke="#3D2314" strokeWidth="0.8" />
                                 <rect x="2" y="19" width="24" height="15" fill="#E4A054" stroke="#3D2314" strokeWidth="0.8" rx="1" />
                                 <path d="M 11 26 A 3 3 0 0 1 17 26 L 17 34 L 11 34 Z" fill="#3D2314" />
                              </g>

                              {/* Palm Tree swaying under the sun */}
                              <g transform="translate(155, 80)">
                                 <path d="M 10 0 Q 3 -25, -8 -38 Q 3 -15, 10 0 Z" fill="#5C2C16" />
                                 {/* Palm leaves in elegant gold and green tones */}
                                 <path d="M -8 -38 Q -24 -46, -32 -35" stroke="#3D2314" strokeWidth="1.8" fill="none" />
                                 <path d="M -8 -38 Q -18 -52, -5 -48" stroke="#3D2314" strokeWidth="2.2" fill="none" />
                                 <path d="M -8 -38 Q 6 -48, 12 -38" stroke="#3D2314" strokeWidth="1.8" fill="none" />
                                 <path d="M -8 -38 Q -12 -30, -18 -25" stroke="#3D2314" strokeWidth="1.2" fill="none" />
                              </g>

                              {/* Magnificent kind Sudanese Grandmother (الحبوبة السودانية الحكيمة) */}
                              <g transform="translate(48, 48)">
                                 {/* Flowing white Thobe body wrapper */}
                                 <path d="M 12 90 Q 22 55, 42 55 T 72 90 Z" fill="url(#thobeGold)" stroke="#D4AF37" strokeWidth="1.2" />
                                 <path d="M 22 90 Q 42 65, 62 90" fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
                                 
                                 {/* Thobe shawl draping around her head */}
                                 <path d="M 27 48 C 24 32, 58 32, 55 48 C 55 58, 27 58, 27 48 Z" fill="#FFFFFF" stroke="#E5C185" strokeWidth="1" />
                                 <path d="M 29 45 C 33 36, 49 36, 53 45" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
                                 
                                 {/* Warm, smiling golden-brown skin face */}
                                 <circle cx="41" cy="49" r="10" fill="#8D5524" />
                                 
                                 {/* Golden Traditional Ring Nose Jewel & Earrings */}
                                 <circle cx="31" cy="51" r="1.5" fill="#D4AF37" />
                                 <circle cx="51" cy="51" r="1.5" fill="#D4AF37" />

                                 {/* Kind smiling eyes (curved lines) */}
                                 <path d="M 35 48 Q 37 50, 39 48" fill="none" stroke="#FAF5EC" strokeWidth="1" strokeLinecap="round" />
                                 <path d="M 43 48 Q 45 50, 47 48" fill="none" stroke="#FAF5EC" strokeWidth="1" strokeLinecap="round" />
                                 
                                 {/* Soft warm smile */}
                                 <path d="M 38 54 Q 41 57, 44 54" fill="none" stroke="#FAF5EC" strokeWidth="1" strokeLinecap="round" />

                                 {/* Hands holding an Ancient Open Book of Wisdom */}
                                 <g transform="translate(27, 65)">
                                   {/* Leather Book Cover */}
                                   <rect x="0" y="4" width="28" height="18" rx="2.5" fill="#3D1E12" stroke="#D4AF37" strokeWidth="1" transform="rotate(-3)" />
                                   {/* Open Pages */}
                                   <path d="M 2 12 Q 14 10, 26 11 L 26 5 Q 14 4, 2 6 Z" fill="#FFFDF9" stroke="#5C2C16" strokeWidth="0.5" />
                                   <line x1="14" y1="5" x2="14" y2="12" stroke="#5C2C16" strokeWidth="0.5" />
                                   <path d="M 4 8 L 12 8 M 4 10 L 11 10 M 16 8 L 24 8 M 17 10 L 24 10" stroke="#C57530" strokeWidth="0.6" opacity="0.7" />
                                 </g>

                                 {/* Golden sparkles of wisdom rising from the open book */}
                                 <g transform="translate(41, 62)" className="animate-pulse">
                                    <line x1="-12" y1="-10" x2="-22" y2="-25" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="1 2" />
                                    <line x1="0" y1="-8" x2="0" y2="-28" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="1 2" />
                                    <line x1="12" y1="-10" x2="22" y2="-25" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="1 2" />
                                    <polygon points="0,-31 -3,-28 0,-25 3,-28" fill="#D4AF37" />
                                    <circle cx="-22" cy="-27" r="1.5" fill="#D4AF37" />
                                    <circle cx="22" cy="-27" r="1.5" fill="#D4AF37" />
                                 </g>
                              </g>

                              {/* Floating Wisdom Symbols */}
                              <text x="25" y="40" fontFamily="sans-serif" fontSize="11" fill="#D4AF37" className="animate-bounce">📖</text>
                              <text x="80" y="30" fontFamily="sans-serif" fontSize="10" fill="#5C2C16" opacity="0.65">✍️</text>
                              <text x="110" y="55" fontFamily="sans-serif" fontSize="12" fill="#D4AF37">🌟</text>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
                              <defs>
                                 <linearGradient id="sandSky" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FDFBF7" />
                                    <stop offset="100%" stopColor="#FAF5EC" />
                                 </linearGradient>
                              </defs>
                              <rect width="200" height="150" fill="url(#sandSky)" />
                              
                              <circle cx="160" cy="50" r="18" fill="#D4AF37" opacity="0.35" className="animate-pulse" />
                              <circle cx="160" cy="50" r="12" fill="#D4AF37" opacity="0.8" />

                              <path d="M 0 135 Q 60 115, 120 125 T 200 120 L 200 150 L 0 150 Z" fill="#E8DFCF" />
                              <path d="M 0 142 Q 80 132, 160 138 T 200 130 L 200 150 L 0 150 Z" fill="#FAF5EC" />

                              <g transform="translate(45, 80)">
                                 <polygon points="25,0 0,35 50,35" fill="#D4AF37" stroke="#5C2C16" strokeWidth="1" />
                                 <rect x="5" y="34" width="40" height="25" fill="#C57530" stroke="#5C2C16" strokeWidth="1" rx="2" />
                                 <path d="M 20 45 A 5 5 0 0 1 30 45 L 30 59 L 20 59 Z" fill="#5C2C16" />
                              </g>

                              <g transform="translate(100, 88)">
                                 <polygon points="20,0 0,28 40,28" fill="#5C2C16" opacity="0.85" />
                                 <rect x="4" y="27" width="32" height="22" fill="#E4A054" stroke="#5C2C16" strokeWidth="1" rx="1" />
                                 <path d="M 16 38 A 4 4 0 0 1 24 38 L 24 49 L 16 49 Z" fill="#5C2C16" />
                              </g>

                              <g transform="translate(145, 85)">
                                 <path d="M 10 0 Q 3 -25, -10 -40 Q 3 -15, 10 0 Z" fill="#C57530" />
                                 <path d="M -10 -40 Q -25 -52, -35 -40" stroke="#D4AF37" strokeWidth="2" fill="none" />
                                 <path d="M -10 -40 Q -20 -58, -5 -55" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
                                 <path d="M -10 -40 Q 5 -55, 12 -45" stroke="#D4AF37" strokeWidth="2" fill="none" />
                                 <path d="M -10 -40 Q -15 -32, -22 -28" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
                              </g>

                              <text x="25" y="45" fontFamily="sans-serif" fontSize="11" fill="#D4AF37" className="animate-bounce">📖</text>
                              <text x="80" y="35" fontFamily="sans-serif" fontSize="10" fill="#5C2C16" opacity="0.6">✍️</text>
                              <text x="135" y="65" fontFamily="sans-serif" fontSize="12" fill="#D4AF37">⭐</text>
                           </svg>
                          )
                       )}

                       {/* Hover Overlay indicating editable */}
                       {isAdminLoggedIn && (
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-all duration-300">
                            <Pencil className="w-5 h-5 text-amber-400 animate-pulse" />
                            <span className="text-[10px] font-black tracking-wider bg-black/35 px-2.5 py-0.5 rounded-full border border-white/10">
                              {currentLang === "ar" ? "تعديل المظهر 🖼️🎥" : "Change Media 🖼️🎥"}
                            </span>
                         </div>
                       )}
                     </div>

                     {/* 📚 Premium Vintage Book Cover Card for Public Library (المكتبة العامة) - Sudanese Theme */}
                     <div
                       onClick={handleLibraryClick}
                       className="shrink-0 bg-gradient-to-b from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 hover:border-amber-400 p-2.5 flex flex-col justify-between rounded-2xl shadow-xl relative cursor-pointer hover:shadow-amber-500/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] overflow-hidden select-none group"
                       style={{ width: "200px", height: "250px" }}>
                        {/* Dashed Gold Inner Stitches */}
                        <div className="absolute inset-1.5 border border-dashed border-amber-500/20 rounded-xl pointer-events-none" />
                        
                        {/* Vintage Top Ribbon */}
                        <div className="bg-[#1E0D06]/70 px-1.5 py-0.5 rounded border border-amber-500/20 text-[7px] sm:text-[8px] font-bold text-amber-400 text-center relative z-10 mx-auto w-fit tracking-wider">
                          كنوز المعرفة 📜
                        </div>
                        
                        {/* Book Title & Subtitle */}
                        <div className="text-center space-y-0.5 relative z-10 my-auto">
                          <h4 className="text-[11px] sm:text-[13px] font-black text-amber-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] leading-tight font-sans">
                            المكتبة العامة
                          </h4>
                          <p className="text-[7px] sm:text-[8px] font-medium text-amber-400/80 leading-none">
                            الكتب التفاعلية والمصادر
                          </p>
                        </div>
                        
                        {/* Golden Seal Stamp */}
                        <div className="relative z-10 mx-auto flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/10 group-hover:animate-spin">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

                {/* 🎥 Live Lessons Widget for Students */}
                {liveLessons.length > 0 && (
                   <div className="bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-3xl p-6 text-right space-y-4 mb-6 shadow-2xs" dir="rtl">
                      <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
                         <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D21034] opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D21034]"></span>
                            </span>
                            <h3 className="font-extrabold text-[#5C2C16] text-sm md:text-base flex items-center gap-1.5">
                               <span>🎥 البث المباشر والحصص التفاعلية الفورية</span>
                            </h3>
                         </div>
                         <span className="text-4xs font-bold text-mud/60 bg-cream px-2 py-0.5 rounded-full border border-mud/5">
                            {liveLessons.filter(l => new Date(l.scheduledTime).getTime() + (l.duration * 60 * 1000) > Date.now()).length} حصص نشطة/قادمة
                         </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {liveLessons
                           .filter(l => new Date(l.scheduledTime).getTime() + (l.duration * 60 * 1000) > Date.now()) // Only show active/future
                           .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                           .slice(0, 6) // Max 6 lessons
                           .map((lesson) => {
                              const isPassed = new Date(lesson.scheduledTime).getTime() + (lesson.duration * 60 * 1000) < Date.now();
                              const isActiveNow = new Date(lesson.scheduledTime).getTime() <= Date.now() && !isPassed;

                              // Resolve stage/grade names
                              const stageObj = curriculumData.find(s => s.id === lesson.stageId);
                              const gradeObj = stageObj?.grades.find(g => g.id === lesson.gradeId);
                              const subjObj = gradeObj?.subjects.find(s => s.id === lesson.subjectId);

                              return (
                                 <div 
                                   key={lesson.id} 
                                   className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                                      isActiveNow 
                                        ? "bg-white border-emerald-550 shadow-md shadow-emerald-550/5" 
                                        : "bg-white border-mud/10 hover:border-earthgold/40 hover:shadow-2xs"
                                   }`}
                                 >
                                    <div className="space-y-2 text-right">
                                       <div className="flex items-center justify-between gap-2">
                                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                                             isActiveNow 
                                               ? "bg-emerald-600 text-white" 
                                               : "bg-earthgold/10 text-earthgold border border-earthgold/20"
                                          }`}>
                                             {isActiveNow ? "🔴 جارية الآن" : "📅 حصة مجدولة"}
                                          </span>
                                          <span className="text-[10px] font-bold text-mud/60 font-mono">
                                             ⏱️ {lesson.duration} دقيقة
                                          </span>
                                       </div>

                                       <h4 className="text-xs font-black text-mud line-clamp-2">{lesson.title}</h4>

                                       <div className="flex flex-wrap gap-1.5 text-[9px] text-mud/75">
                                          <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">📚 {stageObj?.name || lesson.stageId}</span>
                                          <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">🏫 {gradeObj?.name || lesson.gradeId}</span>
                                          {subjObj && (
                                             <span className="bg-[#FAF5EC] px-2 py-0.5 rounded border border-mud/5">📖 {subjObj.name}</span>
                                          )}
                                       </div>

                                       <div className="space-y-1 text-[10px] text-mud/80 bg-[#FAF5EC]/40 p-2 rounded-xl border border-mud/5 text-right">
                                          <p className="flex items-center gap-1">
                                             <span>👤 المعلم:</span>
                                             <strong className="text-mud font-black">{lesson.teacherName}</strong>
                                          </p>
                                          <p className="flex items-center gap-1">
                                             <span>📅 الموعد:</span>
                                             <span className="font-mono text-earthgold font-bold">
                                                {new Date(lesson.scheduledTime).toLocaleString("ar-SD", { dateStyle: "short", timeStyle: "short" })}
                                             </span>
                                          </p>
                                          {lesson.notes && (
                                             <p className="text-[9px] text-mud/60 border-t border-mud/5 pt-1 mt-1 text-right">
                                                💡 {lesson.notes}
                                             </p>
                                          )}
                                       </div>
                                    </div>

                                    <a
                                      href={lesson.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 duration-150 shadow-2xs ${
                                         isActiveNow
                                           ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                           : "bg-earthgold hover:bg-earthgold/90 text-white"
                                      }`}
                                    >
                                       <Video className="w-3.5 h-3.5 text-white" />
                                       <span>دخول الحصة المباشرة ({lesson.meetingPlatform === "google_meet" ? "Google Meet" : lesson.meetingPlatform === "zoom" ? "Zoom" : "رابط الحصة"})</span>
                                    </a>
                                 </div>
                              );
                           })}
                      </div>
                   </div>
                )}

                {siteTheme !== "legacy" ? (
                  <>
                <div id="stages-section-anchor" className="space-y-4">
                   <div className="flex items-center justify-between border-b border-mud/10 pb-[9px] mb-[16px] lg:w-[1100px] max-w-full mx-auto">
                      <div>
                         <h3 className="font-bold text-[#5C2C16] text-base">{currentLang === "ar" ? "المراحل التعليمية المتاحة" : "Available Educational Stages"}</h3>
                         <p className="text-3xs text-mud/60">{currentLang === "ar" ? "اختر المرحلة لعرض الصفوف والمقررات التفاعلية" : "Select a stage to view school levels and interactive books"}</p>
                      </div>
                      <span className="text-3xs font-extrabold bg-[#D4AF37]/10 text-mud px-2.5 py-1 rounded-lg border border-[#D4AF37]/20">
                         {curriculumData.length} {currentLang === "ar" ? "مراحل مضافة" : "Stages Available"}
                      </span>
                   </div>

                   {/* Elegant Cards Grid */}
                   <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1 lg:w-[1100px] max-w-full mx-auto">
                      {displayedStages.map((stage, idx) => { const isHeritage = siteTheme === "heritage";
                         const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat;
                         const totalSubjects = stage.grades.reduce((sum, g) => sum + g.subjects.length, 0);
                         
                         return (
                            <div
                              key={stage.id}
                              onClick={() => {
                                 if (isSelected) {
                                    setSelectedStage(null);
                                    setActiveGrade(null);
                                 } else {
                                    setSelectedStage(stage);
                                    setActiveGrade(null);
                                    setShowOnlyFavorites(false);
                                    setShowStudyCamp(false);
                                    setShowEducationalMindMap(false);
                                    setShowStudentChat(false);
                                    setShowParentPortal(false);
                                 }
                              }}
                              className={`group relative p-3 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer transform select-none ${
                                  isSelected
                                    ? "bg-[#A35130] border-2 border-[#E5C185] shadow-xl scale-[1.01]"
                                    : "bg-[#B76240] border border-[#B76240] hover:border-[#E5C185]/40 shadow-md hover:translate-y-[-4px] hover:shadow-lg"
                               } ${
                                  idx === 0
                                    ? "lg:w-[250px] lg:h-[250px] w-full"
                                    : "lg:w-[250px] w-full"
                               }`}
                             >
                                {/* Circle Portrait Badge representing stage */}
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-[#DFAB79] shrink-0 mb-2 sm:mb-4 shadow-inner group-hover:scale-105 transition-all">
                                   {(() => {
                                      const iconProps = { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2C1810]", strokeWidth: 1.5 };
                                      if (stage.id === "kindergarten") {
                                         return <Baby {...iconProps} />;
                                      } else if (stage.id === "primary") {
                                         return <Backpack {...iconProps} />;
                                      } else {
                                         return <GraduationCap {...iconProps} />;
                                      }
                                   })()}
                                </div>

                                <h3 className="text-white font-black text-xs sm:text-sm md:text-base line-clamp-1">{t(stage.name)}</h3>
                                {(() => {
                                   const englishName = getStageEnglishName(stage.id);
                                   return englishName ? (
                                      <p className="text-[7px] sm:text-4xs text-[#E7C7B7] font-bold mt-0.5 sm:mt-1 tracking-wide uppercase">
                                         {englishName}
                                      </p>
                                   ) : null;
                                })()}
                                
                                <div className="mt-1 sm:mt-2 text-[8px] sm:text-3xs text-[#E7C7B7]/90 font-bold">
                                   {currentLang === "ar" ? `${totalSubjects} مادة` : `${totalSubjects} Subjects`}
                                </div>

                                <button
                                  className={`w-full mt-3 sm:mt-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black transition-all duration-155 cursor-pointer flex items-center justify-center gap-1 shadow-md ${
                                      isSelected
                                        ? "bg-white text-[#2C1810] border-2 border-[#E5C185] shadow-[#E5C185]/10 scale-[0.98]"
                                        : "bg-[#E5C185] text-[#2C1810] hover:bg-[#EAD4A8]"
                                  }`}
                                >
                                  <span>{isSelected ? (currentLang === "ar" ? "مفتوح حالياً" : "Opened") : (currentLang === "ar" ? "تصفح المواد" : "Browse")}</span>
                                </button>
                             </div>
                         );
                      })}
                   </div>
                </div>

                {/* Custom Section for Selected Stage expanded lists below the grid! */}
                 <AnimatePresence mode="wait">
                   {selectedStage && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat && (() => {
                      const renderedGrades = currentUser && currentUser.user_role === "student" && currentUser.grade_id
                        ? selectedStage.grades.filter(g => g.id === currentUser.grade_id)
                        : selectedStage.grades;

                      return (
                         <motion.div
                           key={selectedStage.id}
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -15 }}
                           transition={{ duration: 0.35, ease: "easeInOut" }}
                           id="selected-stage-section"
                           className="bg-white/95 rounded-3xl p-6 border border-mud/15 shadow-md mt-6 space-y-6 select-text text-right lg:w-[1100px] max-w-full mx-auto"
                           dir="rtl"
                         >
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-mud/10 pb-4 p-4 rounded-2xl" style={{ backgroundColor: '#76615d' }}>
                              <div className="space-y-1 text-center sm:text-right">
                                 <span className="text-[10px] text-earthgold font-black uppercase tracking-widest block">{t("gradesLevels")}</span>
                                 <h4 className="text-base font-black text-mud flex items-center justify-center sm:justify-start gap-1.5">
                                    <span className="w-7 h-7 rounded-full bg-[#DFAB79]/25 flex items-center justify-center shrink-0">
                                       {selectedStage.id === "kindergarten" ? (
                                          <Baby className="w-4 h-4 text-[#B76240]" strokeWidth={2} />
                                       ) : selectedStage.id === "primary" ? (
                                          <Backpack className="w-4 h-4 text-[#B76240]" strokeWidth={2} />
                                       ) : (
                                          <GraduationCap className="w-4 h-4 text-[#B76240]" strokeWidth={2} />
                                       )}
                                    </span>
                                    <span style={{ color: '#f7f7f7', fontSize: '20px' }}>{currentLang === "ar" ? `مناهج تفصيلية: ${selectedStage.name}` : `${t(selectedStage.name)} Detailed Curriculae`}</span>
                                 </h4>
                              </div>

                              <div className="text-3xs text-mud bg-[#FDFBF7] px-3.5 py-1.5 rounded-xl border border-mud/10 font-bold flex items-center gap-1">
                                 <CheckCircle className="w-3.5 h-3.5 text-earthgold animate-pulse" />
                                 {currentLang === "ar" ? (
                                    <span>الصفوف: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مادة دراسية متاحة)</span>
                                 ) : (
                                    <span>Levels: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} interactive classes)</span>
                                 )}
                              </div>
                            </div>

                            {/* List of Grades (Accordion) with light beautiful cream boxes */}
                            <div className="space-y-4">
                               {renderedGrades.map((grade) => {
                                  const isGradeExpanded = activeGrade?.id === grade.id;

                                  const filteredSubjects = grade.subjects.filter(subj => {
                                     if (subj.hidden && !isAdminLoggedIn) return false;
                                     const matchesSearch = !searchQuery || 
                                       subj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       subj.curriculumSummary.toLowerCase().includes(searchQuery.toLowerCase());
                                     
                                     if (!matchesSearch) return false;

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

                                  if (searchQuery && filteredSubjects.length === 0) return null;

                                  return (
                                     <div key={grade.id} id={`grade-card-${grade.id}`} className="bg-[#FDFBF7] border border-mud/10 rounded-2xl overflow-hidden shadow-2xs text-right">
                                        <button
                                          onClick={() => {
                                             if (isGradeExpanded) {
                                                setActiveGrade(null);
                                             } else {
                                                setActiveGrade(grade);
                                             }
                                          }}
                                           className={`w-full px-5 py-4 flex items-center justify-between text-right cursor-pointer group transition-colors bg-[#fddda1] hover:bg-[#ebd097] text-[#5C2C16]`}
                                        >
                                           <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-xl bg-white border border-mud/15 flex items-center justify-center text-mud font-extrabold shadow-sm">
                                                 {grade.subjects.length}
                                              </div>
                                              <div>
                                                 <h5 className="font-extrabold text-mud text-xs sm:text-sm group-hover:text-earthgold transition-colors">{grade.name}</h5>
                                                 <p className="text-4xs text-mud/60 mt-0.5">{currentLang === "ar" ? "اضغط لعرض الكتب والمذكرات والروابط التفاعلية" : "Click to view textbooks, cheat sheets & courses"}</p>
                                              </div>
                                           </div>
                                           <ChevronDown className={`w-4 h-4 text-mud/65 transform transition-transform ${isGradeExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isGradeExpanded && (
                                           <div className="border-t border-mud/5 p-5 bg-white space-y-4">
                                              {/* Categorizer tabs */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FDFBF7] p-2.5 rounded-2xl border border-mud/5">
                                                 <span className="text-4xs font-bold text-mud/70 pr-1">{currentLang === "ar" ? "تصفية المحتويات:" : "Content filters:"}</span>
                                                 <div className="flex flex-wrap gap-1">
                                                    <button onClick={() => setCategoryFilter("all")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "all" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>الكل</button>
                                                    <button onClick={() => setCategoryFilter("books")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "books" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>📚 كتب الدراسية</button>
                                                    <button onClick={() => setCategoryFilter("videos")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "videos" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>🎥 شروحات الفيديو</button>
                                                    <button onClick={() => setCategoryFilter("interactive")} className={`px-2.5 py-1 rounded-lg text-4xs font-extrabold cursor-pointer ${categoryFilter === "interactive" ? "bg-earthgold text-white" : "bg-white text-mud/60 border border-mud/10"}`}>🔬 معامل تفاعلية</button>
                                                 </div>
                                              </div>

                                              {/* Grid of Subject items */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                 {filteredSubjects.map((subject) => {
                                                    const isFav = favoriteSubjects.includes(subject.id);
                                                    const isDone = completedLessons.includes(subject.id);

                                                    return (
                                                       <div
                                                         key={subject.id}
                                                         onClick={() => handleOpenSubject(subject as any)}
                                                         className="relative p-4 bg-[#FDFBF7] hover:bg-white border rounded-xl transition-all duration-150 cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-sm"
                                                          style={{ borderColor: '#c85600' }}
                                                       >
                                                          {/* Star / Done checklists */}
                                                          <div className="flex justify-between items-start gap-2 mb-3">
                                                             <div className="p-2 bg-white rounded-lg border border-mud/5 text-base shadow-sm">
                                                                {siteTheme === "heritage" ? renderHeritageSubjectShelfIcon(subject.name) : "🌱"}
                                                             </div>
                                                             <div className="flex gap-1">
                                                                <button onClick={(e) => toggleFavorite(subject.id, e)} className={`p-1 bg-white rounded border cursor-pointer text-3xs ${isFav ? 'text-amber-500 border-amber-400' : 'text-mud/40 border-mud/10'}`}>⭐</button>
                                                                <button onClick={(e) => toggleLessonComplete(subject.id, e)} className={`p-1 bg-white rounded border cursor-pointer text-3xs ${isDone ? 'text-emerald-500 border-emerald-400' : 'text-mud/40 border-mud/10'}`}>✓</button>
                                                             </div>
                                                          </div>

                                                          <div className="space-y-1">
                                                             <h3 className="font-bold text-mud text-xs group-hover:text-earthgold truncate">{subject.name}</h3>
                                                             <p className="text-[10px] text-mud/70 leading-relaxed line-clamp-2">{subject.curriculumSummary}</p>
                                                          </div>

                                                          <div className="mt-4 pt-2 border-t border-mud/5 flex items-center justify-between text-4xs text-[#C57530] font-medium">
                                                             <span className="flex items-center gap-1">
                                                                ✨ {currentLang === "ar" ? "المنهج التفاعلي" : "Interactive Class"}
                                                             </span>
                                                             <span className="group-hover:text-mud font-semibold flex items-center gap-0.5">
                                                                {currentLang === "ar" ? "تصفح" : "Open"} 
                                                             </span>
                                                          </div>
                                                       </div>
                                                    );
                                                 })}
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  );
                               })}
                            </div>
                         </motion.div>
                      );
                   })()}
                 </AnimatePresence>
                  </>
        ) : (
          // Stage selection selector tabs
          <section id="stages-section-anchor" className="space-y-4 relative overflow-hidden p-1 rounded-2xl">
          {/* Ambient kid-friendly background sparkles or clouds */}
          {isKidModeActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none z-0">
              <div className="absolute top-4 left-[10%] text-3xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '4s' }}>🎈</div>
              <div className="absolute bottom-10 left-[25%] text-2xl animate-pulse" style={{ animationDelay: '1.2s' }}>⭐</div>
              <div className="absolute top-10 right-[15%] text-4xl animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '6s' }}>✨</div>
              <div className="absolute bottom-4 right-[5%] text-2xl animate-pulse" style={{ animationDelay: '1.9s' }}>🎈</div>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-4 relative z-10">
            <div>
              <h2 className="text-base font-bold text-slate-300">{t("stagesTitle")}</h2>
              <p className="text-2xs text-slate-500 mt-1">{t("stagesSub")}</p>
            </div>
            
            {/* Quick notification of custom structure */}
            <div className="text-2xs text-amber-450 bg-amber-955/10 border border-amber-900/30 rounded-lg py-1.5 px-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("structureNote")}</span>
            </div>
          </div>

          {/* Grid of Stage Selector Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
            {displayedStages.map((stage) => {
              const isSelected = selectedStage?.id === stage.id && !showOnlyFavorites && !showStudyCamp && !showEducationalMindMap && !showStudentChat;
              
              return (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStage(null);
                        setActiveGrade(null);
                      } else {
                        setSelectedStage(stage);
                        setActiveGrade(null);
                        setShowOnlyFavorites(false);
                        setShowStudyCamp(false);
                        setShowEducationalMindMap(false);
                        setShowStudentChat(false);
                      }
                    }}
                    className={
                      isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                        ? `relative p-3 sm:p-5 rounded-3xl text-center xs:text-right border-2 transition-all text-xs md:text-sm shadow-md overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? "bg-gradient-to-br from-pink-900/40 via-amber-900/20 to-indigo-900/40 border-pink-400 ring-4 ring-pink-500/20 shadow-lg shadow-pink-500/10 scale-[1.02]" 
                              : "bg-slate-900/70 border-pink-500/30 hover:border-pink-400 hover:bg-slate-900/90"
                          }`
                        : `relative p-3 sm:p-5 rounded-2xl text-center xs:text-right border transition-all text-xs md:text-sm shadow-sm overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? "bg-slate-900 border-emerald-600 shadow-md shadow-emerald-950/20" 
                              : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-800"
                          }`
                    }
                  >
                    {/* Decorative Subtle Accent Tag for selected */}
                    {isSelected && (
                      <span className={`absolute top-0 right-0 bottom-0 w-1.5 ${
                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                          ? "bg-gradient-to-b from-pink-400 via-yellow-400 to-indigo-400"
                          : "bg-gradient-to-b from-emerald-500 to-emerald-700"
                      }`} />
                    )}

                    <div className="flex flex-col xs:flex-row items-center xs:items-start gap-2 sm:gap-4">
                      <div className={`p-2.5 sm:p-3 rounded-2xl transition-all shrink-0 ${
                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                          ? isSelected
                            ? "bg-pink-500/30 text-pink-350 scale-110 rotate-3"
                            : "bg-pink-950/40 text-pink-400 group-hover:scale-105"
                          : isSelected 
                            ? "bg-emerald-600/20 text-emerald-400" 
                            : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                      }`}>
                        {getStageIcon(stage.icon)}
                      </div>
                      <div className="space-y-1 text-center xs:text-right min-w-0 w-full">
                        <h3 className={`font-black tracking-wide truncate ${
                          isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-300 font-sans text-xs md:text-sm"
                            : "font-bold text-slate-100 text-xs md:text-sm"
                        }`}>
                          {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                            ? `🎈 ${t(stage.name)} 🍭`
                            : t(stage.name)}
                        </h3>
                        {((currentLang === "ar" && stage.description) || currentLang === "en") && (
                          <p className="text-[10px] sm:text-2xs text-slate-400 line-clamp-1">
                            {currentLang === "ar" 
                              ? stage.description 
                              : (stage.id === "kindergarten" 
                                 ? "Kindergarten classes and infant development curriculum." 
                                 : stage.id === "elementary" 
                                   ? "Comprehensive elementary primary school courses." 
                                   : stage.id === "intermediate" 
                                     ? "Intermediate general education classes." 
                                     : stage.id === "secondary" 
                                       ? "High school secondary general curricula." 
                                       : stage.description)}
                          </p>
                        )}
                        <span className="text-[9px] sm:text-3xs text-emerald-400 font-bold block mt-1">
                          {currentLang === "ar" 
                            ? `الصفوف: ${stage.grades.length}` 
                            : `Classes: ${stage.grades.length}`}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Inline Expanded Grades & Classes for the Selected Stage */}
                  <AnimatePresence mode="wait">
                    {isSelected && (() => {
                      const renderedGrades = currentUser && currentUser.user_role === "student" && currentUser.grade_id
                        ? stage.grades.filter(g => g.id === currentUser.grade_id)
                        : stage.grades;

                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          id="selected-stage-section"
                          className="col-span-2 md:col-span-3 lg:col-span-5 bg-slate-900/50 border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-6 mt-1 mb-4 select-text"
                        >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-850 pb-4">
                          <div className="space-y-1 text-center sm:text-right">
                            <span className="text-3xs text-emerald-400 font-mono font-black uppercase tracking-widest block">{t("gradesLevels")}</span>
                            <h4 className="text-sm font-black text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                              {getStageIcon(stage.icon)}
                              <span>{currentLang === "ar" ? `مناهج ${stage.name}` : `${t(stage.name)} Curricula`}</span>
                            </h4>
                          </div>
                          
                          <div className="text-3xs text-slate-400 font-bold flex items-center gap-1.5 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-855 animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            {currentLang === "ar" ? (
                              <span>مجموع الصفوف: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} مادة تفاعلية مضافة)</span>
                            ) : (
                              <span>Total Levels: {renderedGrades.length} ({renderedGrades.reduce((sum, g) => sum + g.subjects.length, 0)} interactive subjects)</span>
                            )}
                          </div>
                        </div>

                        {/* 🎈 Kid mode mascot & study companion block */}
                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") && (
                          <div className="bg-gradient-to-br from-pink-600/10 via-amber-500/5 to-indigo-600/10 border-2 border-pink-500/35 rounded-3xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl select-none">
                            {/* Floating elements inside mascot banner */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 text-xs text-slate-300">
                              <span className="absolute top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎈</span>
                              <span className="absolute bottom-3 left-20 text-xl animate-pulse" style={{ animationDelay: '0.8s' }}>⭐</span>
                              <span className="absolute top-1/2 right-12 text-lg animate-bounce" style={{ animationDelay: '1.2s' }}>🧸</span>
                              <span className="absolute bottom-2 right-1/4 text-2xl animate-pulse" style={{ animationDelay: '1.8s' }}>🚀</span>
                            </div>

                            {/* Cute Fox Mascot face */}
                            <div 
                              onClick={handleMascotClick}
                              className={`relative w-20 h-20 shrink-0 flex items-center justify-center bg-transparent cursor-pointer transform transition-transform duration-300 active:scale-95 ${
                                mascotAnimState === "celebrate" 
                                  ? "animate-bounce scale-110" 
                                  : mascotAnimState === "speak" 
                                    ? "scale-105 rotate-3" 
                                    : "hover:scale-105"
                              }`}
                              title={currentLang === "ar" ? "اضغط على سمسم الثعلب ليقول شيئاً ممتعاً!" : "Tap Semsem to hear a tip!"}
                            >
                              {/* Floppy ears */}
                              <div className="absolute -top-1 -right-1 w-8 h-10 bg-amber-500 rounded-ellipse rotate-45 transform origin-bottom-left border-2 border-slate-900 flex items-center justify-center p-0.5">
                                <span className="w-5 h-7 bg-pink-300 rounded-ellipse" />
                              </div>
                              <div className="absolute -top-1 -left-1 w-8 h-10 bg-amber-500 rounded-ellipse -rotate-45 transform origin-bottom-right border-2 border-slate-900 flex items-center justify-center p-0.5">
                                <span className="w-5 h-7 bg-pink-300 rounded-ellipse" />
                              </div>
                              
                              {/* Round face */}
                              <div className="w-16 h-16 bg-amber-400 rounded-full border-2 border-slate-900 shadow-md relative flex items-center justify-center">
                                {/* Shiny eyes */}
                                <div className="absolute top-5 left-3.5 w-3.5 h-3.5 bg-slate-900 rounded-full flex items-start justify-start p-0.5">
                                  <span className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                <div className="absolute top-5 right-3.5 w-3.5 h-3.5 bg-slate-900 rounded-full flex items-start justify-start p-0.5">
                                  <span className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                {/* Cheeks */}
                                <div className="absolute top-8 left-1.5 w-3 h-1.5 bg-rose-400 rounded-full opacity-80" />
                                <div className="absolute top-8 right-1.5 w-3 h-1.5 bg-rose-400 rounded-full opacity-80" />
                                {/* Muzzle & nose */}
                                <div className="absolute bottom-3.5 w-5 h-3 bg-white rounded-full border border-slate-900 flex items-center justify-center">
                                  <span className="w-1.5 h-1 bg-slate-900 rounded-full -mt-1" />
                                </div>
                                {/* Sparkle sticker */}
                                <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white rounded-full p-0.5 border border-slate-900">
                                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                                </div>
                              </div>
                            </div>

                            {/* Talk Speech Bubble */}
                            <div className="flex-1 space-y-2 relative text-right">
                              <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 shadow-inner">
                                <span className="text-[10px] text-pink-400 font-extrabold block mb-1">
                                  🦊 {currentLang === "ar" ? "ثعلب الفنك السوداني العبقري سمسم يقول لك:" : "Smart Sudan Fox Semsem says:"}
                                </span>
                                <p className="text-xs md:text-sm font-black text-slate-100 leading-relaxed font-sans">
                                  {mascotMessage}
                                </p>
                              </div>
                            </div>

                            {/* Kid's Star Badges Tracker (لوحة أوسمة النجوم للطلاب) */}
                            <div className="w-full md:w-auto flex flex-col items-center md:items-end justify-center bg-slate-950/40 p-3 rounded-2xl border border-slate-850/80 shrink-0 gap-2 font-sans">
                              <span className="text-[10px] font-black text-pink-400">🏅 {currentLang === "ar" ? "نقاط البطل وأوسمة النجوم:" : "Little Champion Medal Board:"}</span>
                              <div className="flex gap-3">
                                {/* Badge 1 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 1 
                                      ? "bg-amber-955/40 border-yellow-500/60 text-yellow-400 shadow-md shadow-yellow-950/30 scale-105" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام البطل المبتدئ: أكمل دراسة مادة واحدة تفاعلية" : "Bud Champion: complete 1 lesson"}
                                >
                                  <span className="text-lg">⭐</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "وسام البطل" : "Bud Medal"}
                                  </span>
                                </div>

                                {/* Badge 2 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 3 
                                      ? "bg-emerald-955/40 border-emerald-500/60 text-emerald-400 shadow-md shadow-emerald-950/30 scale-105" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام البطل المستكشف: أكمل دراسة ٣ مواد تفاعلية" : "Smart Explorer: complete 3 lessons"}
                                >
                                  <span className="text-lg">🏆</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "ذكي ومكتشف" : "Explorer"}
                                  </span>
                                </div>

                                {/* Badge 3 */}
                                <div 
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    completedLessons.length >= 5 
                                      ? "bg-pink-955/40 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/30 scale-105 animate-pulse" 
                                      : "bg-slate-950/80 border-slate-900 text-slate-655 opacity-40 grayscale"
                                  }`}
                                  title={currentLang === "ar" ? "وسام ملك الذكاء السوداني: أكمل دراسة ٥ مواد تفاعلية" : "Sudan Star: complete 5 lessons"}
                                >
                                  <span className="text-lg">🚀</span>
                                  <span className="text-[8px] font-bold mt-1 max-w-[50px] leading-tight block truncate">
                                    {currentLang === "ar" ? "سوبرمان المذاكرة" : "Superstar"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          {renderedGrades.map((grade) => {
                            const isGradeExpanded = activeGrade?.id === grade.id;
                            
                            // Interactive grade filtering logic
                            const filteredSubjects = grade.subjects.filter(subj => {
                              // If subject is hidden, only show to logged-in administrator
                              if (subj.hidden && !isAdminLoggedIn) return false;

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

                            if (searchQuery && filteredSubjects.length === 0) return null;

                            return (
                              <motion.div 
                                key={grade.id}
                                id={`grade-card-${grade.id}`}
                                layout
                                className={
                                  isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                    ? "bg-slate-900 border-2 border-pink-500/40 rounded-3xl overflow-hidden shadow-md shadow-pink-950/10 hover:border-pink-400 transition-all"
                                    : "bg-slate-950/45 border border-slate-850 rounded-xl overflow-hidden shadow-sm"
                                }
                              >
                                <button
                                  onClick={() => {
                                    if (isGradeExpanded) {
                                      setActiveGrade(null);
                                    } else {
                                      setActiveGrade(grade);
                                    }
                                  }}
                                  className={`w-full px-5 py-4 flex items-center justify-between text-right cursor-pointer group transition-all ${
                                    isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                      ? "hover:bg-pink-500/10"
                                      : "hover:bg-slate-900/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 text-right w-full">
                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 border border-slate-900 flex items-center justify-center text-lg shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0 select-none">
                                        ⭐
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 font-extrabold text-xs shadow-inner shrink-0 leading-none">
                                        {grade.subjects.length}
                                      </div>
                                    )}
                                    <div className="text-right">
                                      <h5 className={`font-black tracking-wide text-xs sm:text-sm transition-colors ${
                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                          ? "text-yellow-300 group-hover:text-yellow-250 font-sans text-[13px] sm:text-sm"
                                          : "text-slate-100 group-hover:text-emerald-300"
                                      }`}>
                                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? `${t(grade.name)} 🍭` : t(grade.name)}
                                      </h5>
                                      {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                        <p className="text-2xs text-pink-300/90 font-bold mt-1 flex items-center gap-1 leading-snug">
                                          <span className="animate-pulse">🎈</span>
                                          <span>{currentLang === "ar" ? "اضغط هنا للبدء بأروع مغامرة لليوم!" : "Tap to play today's sweet class!"}</span>
                                        </p>
                                      ) : (
                                        <p className="text-3xs text-slate-500 mt-0.5 flex items-center gap-1">
                                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                          <span>{currentLang === "ar" ? "اضغط لتصفح الكتب والمقررات والفيديوهات التفاعلية" : "Click to view books, handouts and interactive lessons"}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`transition-colors shrink-0 ${isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? "text-pink-400 group-hover:text-yellow-355" : "text-slate-400 group-hover:text-slate-200"}`}>
                                    <ChevronDown className={`w-4 h-4 transform transition-transform duration-250 ${isGradeExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isGradeExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="border-t border-slate-800/80 bg-slate-950/80"
                                    >
                                      <div className="p-4 sm:p-5 space-y-4">
                                        {/* Category Filter Bar */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/20 p-2 rounded-xl border border-slate-800/80">
                                          <div className="flex items-center gap-1.5 text-slate-400 text-3xs font-extrabold pb-0.5 sm:pb-0">
                                            <Filter className="w-3 h-3 text-emerald-400" />
                                            <span>{currentLang === "ar" ? "تصنيف محتوى المواد وعرض المقررات:" : "Content filter & material view:"}</span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("all")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                                                categoryFilter === "all"
                                                  ? "bg-emerald-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-slate-205"
                                              }`}
                                            >
                                              {currentLang === "ar" ? "الكل" : "All"} ({grade.subjects.length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("books")}
                                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "books"
                                                  ? "bg-blue-600 text-white shadow-sm"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-blue-405"
                                              }`}
                                            >
                                              📚 {currentLang === "ar" ? "كتب ومذكرات" : "Books & Handouts"} ({grade.subjects.filter(s => !!s.pdfUrl || !!s.memoPdfUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("videos")}
                                              className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "videos"
                                                  ? "bg-rose-600 text-white shadow-md shadow-rose-955/30"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-rose-400"
                                              }`}
                                            >
                                              🎥 {currentLang === "ar" ? "فيديوهات شروحات" : "Video Explanations"} ({grade.subjects.filter(s => !!s.videoUrl).length})
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCategoryFilter("interactive")}
                                              className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                categoryFilter === "interactive"
                                                  ? "bg-purple-600 text-white shadow-md shadow-purple-955/30"
                                                  : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-purple-400"
                                              }`}
                                            >
                                              🔬 {currentLang === "ar" ? "معامل وبوابات تفاعلية" : "Interactive Labs"} ({grade.subjects.filter(s => !!s.interactiveUrl).length})
                                            </button>
                                          </div>
                                        </div>

                                        {/* Grid of subjects */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {filteredSubjects.map((subject) => {
                                            let isFavorite = favoriteSubjects.includes(subject.id);
                                            let isLessonComplete = completedLessons.includes(subject.id);

                                            return (
                                              <div
                                                key={subject.id}
                                                onClick={() => handleOpenSubject({ ...subject, gradeName: grade.name, gradeId: grade.id } as any)}
                                                className={
                                                  isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                    ? "group relative p-5 bg-gradient-to-br from-indigo-950 via-purple-900/20 to-pink-950/20 border-2 border-pink-500/40 hover:border-yellow-400 rounded-3xl transition-all duration-305 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
                                                    : "group relative p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-650/80 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
                                                }
                                              >
                                                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {/* Action buttons (Favorites, studied toggle) */}
                                                <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(subject.id, e); }}
                                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                      isFavorite 
                                                        ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800/60 scale-105' 
                                                        : 'bg-slate-950/60 text-slate-500 hover:text-yellow-400 border-slate-800 hover:border-yellow-950/30'
                                                    }`}
                                                    title="المفضلة"
                                                  >
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                  </button>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); toggleLessonComplete(subject.id, e); }}
                                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                      isLessonComplete 
                                                        ? 'bg-emerald-950/45 text-emerald-400 border-emerald-900/60 scale-105' 
                                                        : 'bg-slate-950/60 text-slate-500 hover:text-emerald-400 border-slate-800 hover:border-emerald-950/30'
                                                    }`}
                                                    title="تميز بالاكتمال"
                                                  >
                                                    <CheckCircle className="w-3.5 h-3.5 fill-current" />
                                                  </button>
                                                </div>

                                                <div className="space-y-4">
                                                  {/* Subject Title and Icon */}
                                                  <div className="flex items-start gap-3.5">
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-350 to-pink-500 border border-pink-400/40 flex items-center justify-center text-2xl shadow-md group-hover:scale-115 group-hover:rotate-6 transition-all duration-300 shrink-0 select-none mt-1">
                                                        {getKidSubjectEmoji(subject.name)}
                                                      </div>
                                                    ) : (
                                                      <div className={`p-2.5 rounded-lg ${subject.colorClass} border flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                                                        <DynamicIcon name={subject.iconName} className="w-5 h-5" />
                                                      </div>
                                                    )}
                                                    <div className="space-y-0.5 max-w-[65%]">
                                                      <h6 className={`font-black tracking-wide transition-colors truncate ${
                                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? "text-yellow-300 group-hover:text-yellow-250 font-sans text-sm"
                                                          : "text-white text-xs font-extrabold group-hover:text-emerald-300"
                                                      }`}>{t(subject.name)}</h6>
                                                      <span className={`text-3xs truncate block ${
                                                        isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? "text-pink-300 font-bold"
                                                          : "text-slate-500"
                                                      }`}>
                                                        {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                          ? (currentLang === "ar" ? "🪐 مغامرة ذكية ولذيذة" : "🪐 Happy Fun Lesson")
                                                          : (currentLang === "ar" ? "السودان • مادة دراسية أساسية" : "Sudan • Interactive Course")}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {/* Abstract brief summary of curriculum */}
                                                  <p className="text-2xs text-slate-400 leading-relaxed line-clamp-2 h-7 overflow-hidden text-ellipsis">
                                                    {subject.curriculumSummary}
                                                  </p>

                                                  {/* Mini resource indicators */}
                                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {subject.hidden && (
                                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-yellow-950/45 border border-yellow-850/45 text-[9px] text-amber-400 font-bold animate-pulse">
                                                        👁️‍قيد الإخفاء
                                                      </span>
                                                    )}
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
                                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-955/30 border border-purple-900/30 text-[9px] text-purple-400 font-bold">
                                                        <Compass className="w-2.5 h-2.5" />
                                                        تفاعلي
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950/20 border border-slate-900 text-[9px] text-slate-600 line-through">
                                                        لا بوابة
                                                      </span>
                                                    )}

                                                    {subject.videoUrl ? (
                                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-955/30 border border-rose-900/30 text-[9px] text-rose-400 font-bold">
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

                                                <div className="mt-3.5 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-3xs">
                                                  <span className="text-emerald-400/90 font-black flex items-center gap-0.5">
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                      <span className="text-sm select-none animate-bounce mr-1">🎈</span>
                                                    ) : (
                                                      <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                                                    )}
                                                    {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten")
                                                      ? (currentLang === "ar" ? "🪐 العب وانطلق يا بطل!" : "🪐 Let's Play & Learn!")
                                                      : (currentLang === "ar" ? "شرح المعلم التفاعلي نشط" : "Join Interactive Class")}
                                                  </span>
                                                   {isKidModeActive && (stage.id === "primary" || stage.id === "kindergarten") ? (
                                                    <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black group-hover:scale-110 active:scale-95 transition-all shadow select-none leading-none">
                                                      {currentLang === "ar" ? "ابدأ 🍭" : "Start 🍭"}
                                                    </span>
                                                   ) : (
                                                    <span className="text-slate-400 font-bold group-hover:text-emerald-400 group-hover:translate-x-[-1px] transition-all flex items-center gap-0.5">
                                                      دخول
                                                      <ChevronLeft className="w-3 h-3 text-emerald-500" />
                                                    </span>
                                                   )}
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Add Subject Card */}
                                          <div
                                            onClick={() => setAddSubjectState({
                                              stageId: selectedStage.id,
                                              gradeId: grade.id,
                                              gradeName: grade.name
                                            })}
                                            className="relative p-5 bg-slate-900/30 border border-dashed border-slate-800 hover:border-emerald-600/60 rounded-2xl transition-all duration-200 hover:bg-slate-900/50 cursor-pointer flex flex-col justify-center items-center text-center space-y-3 min-h-[180px]"
                                          >
                                            <div className="p-3 bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition-colors">
                                              <Plus className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div className="space-y-1">
                                              <h6 className="font-bold text-slate-200 text-xs">إضافة مادة مخصصة جديدة</h6>
                                              <p className="text-3xs text-slate-500 leading-relaxed max-w-[200px]">
                                                انقر هنا لإضافة بطاقة مادة مقرر إضافية لهذا الصف (مطلوب رمز المعلم).
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {filteredSubjects.length === 0 && (
                                          <div className="text-center py-12 px-6 bg-slate-905/20 border border-slate-800/60 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
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
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                </React.Fragment>
              );
            })}

            {/* 📚 Premium Digital Book Cover Card for Public Library (المكتبة العامة) - Legacy Theme */}
            <button
              onClick={handleLibraryClick}
              className="relative p-5 rounded-2xl text-right border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 hover:bg-slate-900 hover:border-amber-500 hover:scale-[1.05] transition-all duration-300 text-xs md:text-sm shadow-lg hover:shadow-amber-500/20 overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[140px] select-none"
            >
              {/* Subtle pulsing background glow */}
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Top Row / Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 group-hover:text-amber-400 group-hover:bg-amber-950/40 group-hover:border-amber-500/30 bg-emerald-950/60 border border-emerald-500/25 px-2 py-0.5 rounded-full transition-all duration-300">
                  المكتبة الرقمية 🌐
                </span>
                <BookOpen className="w-4 h-4 text-emerald-400 group-hover:text-amber-400 transition-colors duration-300 group-hover:animate-bounce" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mt-3">
                <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-amber-300 transition-colors duration-300">
                  المكتبة العامة السودانية
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal group-hover:text-slate-200 transition-colors duration-300">
                  مصادر دراسية خارجية مثرية وكتب تفاعلية قيّمة
                </p>
              </div>

              {/* Action indicator */}
              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between w-full text-[10px]">
                <span className="text-emerald-400 group-hover:text-amber-400 font-extrabold flex items-center gap-1 transition-colors duration-300">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>تصفح الكتب والمصادر</span>
                </span>
                <span className="text-slate-500 font-bold group-hover:text-amber-400 transition-colors duration-300">
                  دخول 🚀
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

        {/* Render Admin Dashboard, Favorited Subjects when filtered, otherwise Stage Exploration */}
        {showAdminDashboard ? (
          <motion.div
            id="admin-dashboard-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminDashboard 
              stages={curriculumData}
              onUpdateCurriculum={(newStages) => {
                setCurriculumData(newStages);
                localStorage.setItem("sudan_custom_curriculum_v3", JSON.stringify(newStages));
                saveCurriculumToCloudAutomatically(newStages);
              }}
              onClose={() => setShowAdminDashboard(false)}
              breakingNews={breakingNews}
              onUpdateBreakingNews={handleUpdateBreakingNews}
            />
          </motion.div>
        ) : showOnlyFavorites ? (
          <motion.div
            id="favorites-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`flex flex-col sm:flex-row items-center justify-between p-6 md:p-8 rounded-3xl gap-6 shadow-md border ${
              siteTheme === "sudanese"
                ? "bg-white border-mud/15 text-mud"
                : "bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/10 border-slate-800/85 text-slate-100 shadow-xl"
            }`}>
              <div className="space-y-2 text-center sm:text-right">
                <span className={`text-xs font-bold uppercase tracking-widest ${siteTheme === "sudanese" ? "text-earthgold" : "text-amber-400"}`}>تصفح قائمتك الخاصة:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <h3 className={`text-xl md:text-2xl font-black ${siteTheme === "sudanese" ? "text-[#5C2C16]" : "text-slate-100 animate-pulse"}`}>المواد المفضلة لديك ⭐</h3>
                </div>
                <p className={`text-xs ${siteTheme === "sudanese" ? "text-mud/80" : "text-slate-400"}`}>لقد قمت بإضافة {favoritedSubjectsList.length} مادة للمفضلة لتسهيل مراجعتها والمتابعة السريعة للفيديوهات والمعامل التفاعلية.</p>
              </div>
              
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition-all shadow-md shrink-0 ${
                  siteTheme === "sudanese"
                    ? "bg-[#5C2C16] text-[#FDFBF7] hover:bg-[#4A200B] border-[#4A200B]"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200"
                }`}
              >
                العودة للمنهج السوداني الكامل 🇸🇩
              </button>
            </div>

            {favoritedSubjectsList.length === 0 ? (
              <div className={`text-center py-20 rounded-3xl border border-dashed space-y-4 max-w-2xl mx-auto ${
                siteTheme === "sudanese"
                  ? "bg-white border-mud/20 text-mud"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-200"
              }`}>
                <div className={`p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border ${
                  siteTheme === "sudanese"
                    ? "bg-earthgold/5 text-earthgold border-earthgold/10"
                    : "bg-yellow-500/5 text-yellow-500 border-yellow-500/10"
                }`}>
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${siteTheme === "sudanese" ? "text-mud" : "text-slate-200"}`}>لا توجد مواد مفضلة حتى الآن</p>
                  <p className={`text-xs max-w-md mx-auto leading-relaxed ${siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"}`}>
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
                        onClick={() => handleOpenSubject({ ...subject } as any)}
                        className={`relative p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                          siteTheme === "sudanese"
                            ? "bg-white hover:bg-cream/20 border-mud/10 hover:border-earthgold hover:shadow-md"
                            : "bg-slate-900 border-slate-800 hover:border-emerald-600 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-950/60"
                        }`}
                      >
                        {/* Action buttons (Favorites, studied toggle) */}
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(subject.id, e); }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isFavorite 
                                ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800/40' 
                                : siteTheme === "sudanese"
                                  ? 'bg-[#FDFBF7] text-mud/40 hover:text-mud border-mud/10'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-200 border-slate-700'
                            }`}
                            title="المفضلة"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLessonComplete(subject.id, e); }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isLessonComplete 
                                ? 'bg-emerald-955/40 text-emerald-400 border-emerald-900/50' 
                                : siteTheme === "sudanese"
                                  ? 'bg-[#FDFBF7] text-mud/40 hover:text-mud border-mud/10'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-200 border-slate-700'
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
                              <h6 className={`font-extrabold text-sm truncate ${
                                siteTheme === "sudanese" ? "text-mud" : "text-white"
                              }`}>{subject.name}</h6>
                              <span className="text-3xs text-emerald-450 font-bold block truncate">
                                {subject.stageName} • {subject.gradeName}
                              </span>
                            </div>
                          </div>

                          {/* Abstract brief summary of curriculum */}
                          <p className={`text-2xs leading-relaxed line-clamp-3 ${
                            siteTheme === "sudanese" ? "text-mud/85" : "text-slate-400"
                          }`}>
                            {subject.curriculumSummary}
                          </p>
                        </div>

                        {/* Footer: entering triggers interaction */}
                        <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-2xs ${
                          siteTheme === "sudanese" ? "border-mud/10" : "border-slate-800/50"
                        }`}>
                          <span className="text-emerald-455 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {currentLang === "ar" ? "بوابة المدرس والمناهج التفاعلية" : "Interactive Portal"}
                          </span>
                          <span className={`font-medium flex items-center gap-0.5 ${
                            siteTheme === "sudanese" ? "text-mud/70" : "text-slate-400"
                          }`}>
                            {currentLang === "ar" ? "دخول" : "Open"}
                            <ChevronLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        ) : showEducationalMindMap ? (
          <motion.div
            key="mind-map-view"
            id="mind-map-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <EducationalMindMap 
              stages={curriculumData}
              currentLang={currentLang}
              onSelectSubject={handleOpenSubject}
              activeStage={selectedStage}
            />
          </motion.div>
        ) : showStudyCamp ? (
          <motion.div
            key="study-camp-view"
            id="study-camp-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <StudyCamp stages={displayedStages} />
          </motion.div>
        ) : showParentPortal ? (
          <motion.div
            key="parent-portal-view"
            id="parent-portal-view-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {renderParentPortal()}
          </motion.div>
        ) : (
          null
        )}

        {/* Sidebar Vertical Chat Space */}
        <AnimatePresence>
          {showStudentChat && (
            <>
              {/* Mobile/Tablet Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/70 z-45"
                onClick={() => setShowStudentChat(false)}
              />

              <motion.div
                initial={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                transition={{ type: "spring", damping: 28, stiffness: 140 }}
                className="fixed lg:static inset-y-0 right-0 lg:inset-auto z-50 lg:z-40 w-full max-w-[460px] lg:w-[480px] shrink-0 border-s border-slate-800/60 bg-slate-950/95 lg:bg-slate-950/20 shadow-2xl lg:shadow-none flex flex-col"
              >
                <div className="h-full lg:h-[calc(100vh-100px)] lg:sticky lg:top-4 overflow-y-auto p-4 lg:p-6 w-full flex flex-col justify-between">
                  {/* Drawer Header for Mobile */}
                  <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60">
                    <span className="font-extrabold text-xs text-slate-200">
                      {currentLang === "ar" ? "غرفة نقاش ومذاكرة الطلاب 🤝" : "Student Discussion Room 🤝"}
                    </span>
                    <button 
                      onClick={() => setShowStudentChat(false)}
                      className="p-1 px-3 text-2xs font-extrabold text-rose-400 bg-rose-955/30 border border-rose-900/40 rounded-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {currentLang === "ar" ? "إغلاق" : "Close"}
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <StudentChatRoom 
                      currentUser={currentUser}
                      currentLang={currentLang}
                      isAdminLoggedIn={isAdminLoggedIn}
                      onTriggerAuth={() => {
                        setShowUserModal(true);
                        setUserModalTab("login");
                      }}
                      onClose={() => setShowStudentChat(false)}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar Vertical Educational Games Space */}
        <AnimatePresence>
          {showGamesSidebar && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-45"
                onClick={() => {
                  setShowGamesSidebar(false);
                  setActiveMiniGame(null);
                }}
              />

              <motion.div
                initial={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentLang === "ar" ? 120 : -120 }}
                transition={{ type: "spring", damping: 28, stiffness: 140 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-[460px] border-s border-slate-800/60 bg-slate-950/95 shadow-2xl flex flex-col font-sans text-slate-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍭</span>
                    <h3 className="font-black text-sm text-pink-400">
                      {currentLang === "ar" ? "بوابة الألعاب التعليمية" : "Educational Games Portal"}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowGamesSidebar(false);
                      setActiveMiniGame(null);
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sidebar Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {activeMiniGame === null ? (
                    /* GAMES LIST VIEW */
                    <div className="space-y-4">
                      <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 text-center space-y-2">
                        <span className="text-3xl animate-bounce inline-block">🎮</span>
                        <h4 className="font-extrabold text-xs text-pink-300">
                          {currentLang === "ar" ? "أهلاً بك يا بطل في عالم المرح والتعلم!" : "Welcome champion to the world of fun & learning!"}
                        </h4>
                        <p className="text-3xs text-slate-400 leading-relaxed">
                          {currentLang === "ar" 
                            ? "اختر أي لعبة من القائمة بالأسفل لتبدأ اللعب فوراً وتنمي مهاراتك العبقرية!" 
                            : "Choose any game from the list below to start playing immediately and grow your genius skills!"}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Game 1: Math Kid Wizard */}
                        <div
                          onClick={() => setActiveMiniGame("math")}
                          className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/30 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              🧮
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs text-slate-200 block">
                                {currentLang === "ar" ? "تحدي عباقرة الحساب" : "Math Kid Wizard"}
                              </span>
                              <span className="text-3xs text-slate-400 block">
                                {currentLang === "ar" ? "مسائل حسابية بسيطة مع نقاط وهدايا" : "Simple math puzzles with scores & badges"}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                            {currentLang === "ar" ? "العب 🚀" : "Play 🚀"}
                          </span>
                        </div>

                        {/* Game 2: Word Hero */}
                        <div
                          onClick={() => setActiveMiniGame("word")}
                          className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/30 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              ✏️
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs text-slate-200 block">
                                {currentLang === "ar" ? "فرسان الحروف الهجائية" : "Word spelling Hero"}
                              </span>
                              <span className="text-3xs text-slate-400 block">
                                {currentLang === "ar" ? "أكمل الكلمات العربية والإنجليزية الناقصة" : "Complete the missing letters to win"}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {currentLang === "ar" ? "العب 🚀" : "Play 🚀"}
                          </span>
                        </div>

                        {/* Game 3: Smart Memory Cards */}
                        <div
                          onClick={() => setActiveMiniGame("memory")}
                          className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              🃏
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs text-slate-200 block">
                                {currentLang === "ar" ? "بطاقات الذاكرة الذكية" : "Smart Memory Match"}
                              </span>
                              <span className="text-3xs text-slate-400 block">
                                {currentLang === "ar" ? "درّب ذاكرتك وطابق البطاقات المتماثلة" : "Train your brain by matching cards"}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            {currentLang === "ar" ? "العب 🚀" : "Play 🚀"}
                          </span>
                        </div>

                        {/* Game 4: Little Painter */}
                        <div
                          onClick={() => setActiveMiniGame("color")}
                          className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              🎨
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs text-slate-200 block">
                                {currentLang === "ar" ? "لوحة التلوين والبراعم" : "Little Painter Grid"}
                              </span>
                              <span className="text-3xs text-slate-400 block">
                                {currentLang === "ar" ? "ارسم ولوّن لوحات بكسل إبداعية ولطيفة" : "Color and paint beautiful pixel drawings"}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            {currentLang === "ar" ? "العب 🚀" : "Play 🚀"}
                          </span>
                        </div>

                        {/* Game 5: Naqla Web Game Hub (External Portal) */}
                        <div
                          onClick={() => {
                            if (educationalGamesUrl) {
                              window.open(educationalGamesUrl, "_blank");
                            }
                          }}
                          className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              🌐
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-xs text-slate-200 block">
                                {currentLang === "ar" ? "منصة ألعاب نقلة الشاملة 🇸🇩" : "Naqla Full Interactive Portal 🇸🇩"}
                              </span>
                              <span className="text-3xs text-slate-400 block">
                                {currentLang === "ar" ? "افتح مئات الألعاب التفاعلية الخارجية المميزة" : "Access hundreds of external premium educational games"}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {currentLang === "ar" ? "زيارة 🔗" : "Visit 🔗"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SINGLE MINI-GAME INTERACTIVE PLAYGROUND VIEW */
                    <div className="space-y-5">
                      <button
                        onClick={() => setActiveMiniGame(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>{currentLang === "ar" ? "العودة لقائمة الألعاب" : "Back to Games"}</span>
                      </button>

                      {/* GAME 1: MATH GAME */}
                      {activeMiniGame === "math" && mathQuestion && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center space-y-6">
                          <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-3">
                            <span>🏆 {currentLang === "ar" ? `النقاط: ${mathScore}` : `Score: ${mathScore}`}</span>
                            <span>🔥 {currentLang === "ar" ? `سلسلة الانتصارات: ${mathStreak}` : `Streak: ${mathStreak}`}</span>
                          </div>

                          <div className="space-y-2">
                            <span className="text-4xs font-bold text-pink-400 uppercase tracking-widest block">
                              {currentLang === "ar" ? "كم حاصل العملية التالية؟" : "What is the answer?"}
                            </span>
                            <div className="text-4xl font-black text-white py-4 tracking-wide font-mono bg-slate-950/40 rounded-2xl border border-slate-850">
                              {mathQuestion.questionText}
                            </div>
                          </div>

                          {mathFeedback && (
                            <div className={`p-3 rounded-xl text-3xs font-black transition-all ${
                              mathStatus === "correct" 
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                            }`}>
                              {mathFeedback}
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-3">
                            {mathQuestion.options.map((option, idx) => (
                              <button
                                key={idx}
                                disabled={mathStatus !== "unanswered"}
                                onClick={() => handleMathAnswer(option)}
                                className={`p-4 rounded-xl font-bold font-mono text-base border transition-all cursor-pointer ${
                                  mathStatus === "unanswered"
                                    ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-pink-300 active:scale-95"
                                    : option === mathQuestion.answer
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                      : "bg-slate-950/40 border-slate-900 text-slate-500"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GAME 2: WORD SPELLING HERO */}
                      {activeMiniGame === "word" && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center space-y-6">
                          <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-3">
                            <span>🏆 {currentLang === "ar" ? `النقاط: ${wordScore}` : `Score: ${wordScore}`}</span>
                            <span>🧩 {currentLang === "ar" ? `اللغز: ${wordPuzzleIndex + 1} من ${wordPuzzles.length}` : `Puzzle: ${wordPuzzleIndex + 1} of ${wordPuzzles.length}`}</span>
                          </div>

                          <div className="space-y-3">
                            <span className="text-4xs font-bold text-purple-400 uppercase tracking-widest block">
                              {currentLang === "ar" ? "أكمل الحرف المفقود المناسب!" : "Choose the correct missing letter!"}
                            </span>
                            <div className="text-3xl font-black text-white py-4 tracking-wider bg-slate-950/40 rounded-2xl border border-slate-850">
                              {wordPuzzles[wordPuzzleIndex].word}
                            </div>
                          </div>

                          {wordFeedback && (
                            <div className={`p-3 rounded-xl text-3xs font-black transition-all ${
                              wordStatus === "correct"
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-bounce"
                                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                            }`}>
                              {wordFeedback}
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-3">
                            {wordPuzzles[wordPuzzleIndex].options.map((option, idx) => (
                              <button
                                key={idx}
                                disabled={wordStatus !== "unanswered"}
                                onClick={() => handleWordAnswer(option)}
                                className={`p-4 rounded-xl font-bold text-lg border transition-all cursor-pointer ${
                                  wordStatus === "unanswered"
                                    ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-purple-300 active:scale-95"
                                    : option === wordPuzzles[wordPuzzleIndex].missing
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                      : "bg-slate-950/40 border-slate-900 text-slate-500"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GAME 3: SMART MEMORY MATCH */}
                      {activeMiniGame === "memory" && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center space-y-4">
                          <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-3">
                            <span>🧠 {currentLang === "ar" ? "تطابق ذكي" : "Brain Matching"}</span>
                            <span>🔄 {currentLang === "ar" ? `عدد الحركات: ${memoryMoves}` : `Moves: ${memoryMoves}`}</span>
                          </div>

                          {memoryStatus === "won" ? (
                            <div className="space-y-4 py-6 text-center">
                              <span className="text-5xl block animate-bounce">🏆 🌟</span>
                              <h4 className="font-extrabold text-xs text-amber-400">
                                {currentLang === "ar" ? "أنت عبقري حقيقي بذاكرة حديدية! 🎉" : "You are a genius with a steel memory! 🎉"}
                              </h4>
                              <p className="text-3xs text-slate-400">
                                {currentLang === "ar" 
                                  ? `لقد تمكنت من حل اللغز في ${memoryMoves} خطوة فقط!` 
                                  : `You solved the puzzle in only ${memoryMoves} moves!`}
                              </p>
                              <button
                                onClick={initMemoryGame}
                                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-3xs cursor-pointer active:scale-95 hover:bg-amber-400 transition-all"
                              >
                                {currentLang === "ar" ? "العب مرة أخرى 🔄" : "Play Again 🔄"}
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {memoryCards.map((card, idx) => {
                                const isOpen = card.isFlipped || card.isMatched;
                                return (
                                  <button
                                    key={card.id}
                                    onClick={() => handleMemoryCardClick(idx)}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all border duration-300 ${
                                      isOpen
                                        ? "bg-slate-950 border-amber-500/40 text-slate-100 rotate-180"
                                        : "bg-gradient-to-br from-amber-500 to-yellow-600 border-white/20 text-white cursor-pointer hover:scale-105"
                                    }`}
                                  >
                                    <span style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                                      {isOpen ? card.symbol : "⭐"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* GAME 4: LITTLE PAINTER (Pixel Art 8x8 Grid) */}
                      {activeMiniGame === "color" && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center space-y-4">
                          <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-2">
                            <span>🎨 {currentLang === "ar" ? "مرسم الألوان للأطفال" : "Little Painter"}</span>
                            <button
                              onClick={initPixelGame}
                              className="text-4xs text-rose-400 border border-rose-955/35 bg-rose-955/10 px-2 py-0.5 rounded-md hover:bg-rose-955/30 transition-all"
                            >
                              {currentLang === "ar" ? "مسح الرسم" : "Clear Canvas"}
                            </button>
                          </div>

                          {/* Color Palette Row */}
                          <div className="flex justify-center gap-2 py-1">
                            {[
                              "#ec4899", // hot pink
                              "#3b82f6", // blue
                              "#10b981", // emerald
                              "#f59e0b", // amber
                              "#8b5cf6", // purple
                              "#ef4444", // red
                              "#ffffff"  // white
                            ].map((colorHex, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentColor(colorHex)}
                                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                                  currentColor === colorHex 
                                    ? "border-yellow-400 scale-125 ring-2 ring-yellow-400/30" 
                                    : "border-transparent hover:scale-110"
                                }`}
                                style={{ backgroundColor: colorHex }}
                              />
                            ))}
                          </div>

                          {/* 8x8 Grid */}
                          <div className="mx-auto w-[200px] h-[200px] grid grid-cols-8 gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800">
                            {pixelGrid.map((cellColor, idx) => (
                              <button
                                key={idx}
                                onClick={() => handlePixelCellClick(idx)}
                                className="w-full h-full rounded-sm transition-colors border border-black/10 hover:opacity-85 cursor-pointer"
                                style={{ backgroundColor: cellColor }}
                              />
                            ))}
                          </div>

                          <p className="text-4xs text-slate-400">
                            {currentLang === "ar"
                              ? "اختر لوناً من الأعلى ثم اضغط على المربعات لترسم لوحتك الخاصة المبدعة! 🌟"
                              : "Choose a color from the palette, then tap on the grids to draw your masterpiece! 🌟"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer status counter */}
                <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-4xs text-slate-400">
                  <span>🚀 {currentLang === "ar" ? "التعليم التفاعلي السوداني" : "Sudanese Interactive Education"}</span>
                  <span className="text-pink-400 font-extrabold">🎖️ {currentLang === "ar" ? "الذكاء والتميز للبراعم" : "Smart Kids Platform"}</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
            onDeleteSubject={deleteSubject}
            isAdminActive={hasEditPermissions}
            isAdminLoggedIn={isAdminLoggedIn}
            currentLang={currentLang}
            siteTheme={siteTheme}
            liveLessons={liveLessons}
            onRefreshLiveLessons={refreshLiveLessonsList}
            currentUser={currentUser}
            onPromptLogin={(msg) => {
              setUserAuthError(msg || "⚠️ هذا المحتوى متاح فقط للأعضاء المسجلين. يرجى تسجيل الدخول أو إنشاء حساب جديد مجاناً!");
              setShowUserModal(true);
              setUserModalTab("login");
            }}
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
            isAdminActive={hasEditPermissions}
            isAdminLoggedIn={isAdminLoggedIn}
            currentLang={currentLang}
            siteTheme={siteTheme}
          />
        )}
      </AnimatePresence>

      {/* 👤 Student/User Registration and Login Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md max-h-[96vh] sm:max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-right font-sans"
              dir="rtl"
            >
              {/* Pattern Background Accent */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
              
              {/* Modal Upper Top Bar */}
              <div className="p-4 sm:p-5 pb-3 sm:pb-3.5 border-b border-slate-800/60 flex items-center justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <WebsiteLogo size={32} />
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-slate-100">
                      {userModalTab === "profile" ? "تعديل بيانات الحساب ⚙️" : "بوابة الطالب والزائر 🇸🇩"}
                    </h5>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                      {userModalTab === "profile" ? "تعديل معلومات حسابك الدراسي لعام ٢٠٢٦" : "منصة نقلة للمناهج الالكترونية السودانية  لعام ٢٠٢٦"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (currentUser) {
                      setShowUserModal(false);
                    } else {
                      handleEnterAsGuest();
                    }
                  }}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={currentUser ? "إغلاق" : "تصفح كزائر"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Container for Modal Body to fit all mobile viewports */}
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col">

              {/* Tabs list (Sign-in / Register) */}
              {userModalTab !== "profile" && (
                <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex gap-2 relative z-10 shrink-0">
                  <button
                    onClick={() => {
                      setUserModalTab("login");
                      setUserAuthError("");
                      setUserAuthSuccess("");
                    }}
                    className={`flex-1 py-1.5 text-3xs sm:text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      userModalTab === "login"
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                        : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-205"
                    }`}
                  >
                    تسجيل الدخول للطلاب
                  </button>
                  <button
                    onClick={() => {
                      setUserModalTab("register");
                      setUserAuthError("");
                      setUserAuthSuccess("");
                    }}
                    className={`flex-1 py-1.5 text-3xs sm:text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      userModalTab === "register"
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                        : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-205"
                    }`}
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              )}

              {/* Form segment */}
              <div className="p-4 sm:p-6 relative z-10 space-y-3 sm:space-y-4 flex-1">
                <form
                  onSubmit={
                    userModalTab === "profile"
                      ? handleUserProfileUpdateSubmit
                      : userModalTab === "login"
                      ? handleUserLoginSubmit
                      : handleUserRegisterSubmit
                  }
                  className="space-y-2.5 sm:space-y-3.5"
                >
                  {userModalTab === "profile" && (
                    <>
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">الاسم بالكامل (أو اسم المستخدم):</label>
                        <input
                          type="text"
                          required
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          placeholder="مثال: يوسف أحمد التكينة"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                        />
                      </div>

                      {/* Display Class Selector for Students */}
                      {currentUser?.user_role === "student" && (
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] text-slate-400 font-bold block">الصف والمرحلة الدراسية الخاصة بك:</label>
                          <select
                            value={regGradeId}
                            onChange={(e) => setRegGradeId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-200 outline-none focus:border-indigo-600"
                          >
                            <option value="">-- اختر صفّك الدراسي --</option>
                            {curriculumData.flatMap(stage => 
                              stage.grades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                  {stage.name} - {grade.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      {/* Display Specialty selections for Teachers */}
                      {currentUser?.user_role === "teacher" && (
                        <>
                          <div className="space-y-2 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              المواد المتخصص بتدريسها لمناهج السودان (تحديد متعدد):
                            </label>
                            <div className="max-h-28 overflow-y-auto border border-slate-850 bg-slate-950 p-2.5 rounded-xl text-right">
                              {Array.from(new Set(
                                curriculumData.flatMap(stage => 
                                  stage.grades.flatMap(grade => 
                                    grade.subjects.map(subj => subj.name)
                                  )
                                )
                              )).map((subjectName) => {
                                const isSelected = selectedSpecialties.includes(subjectName);
                                return (
                                  <button
                                    type="button"
                                    key={subjectName}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSpecialties(prev => prev.filter(x => x !== subjectName));
                                      } else {
                                        setSelectedSpecialties(prev => [...prev, subjectName]);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 ml-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-600/20 text-amber-400 border-amber-600 font-extrabold"
                                        : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                    <span>{subjectName}</span>
                                    {isSelected && <span>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">جوال المعلم أو وسيلة تواصل سريعة (إيميل/رقم):</label>
                            <input
                              type="text"
                              required
                              value={regContactMethod}
                              onChange={(e) => setRegContactMethod(e.target.value)}
                              placeholder="مثال: 0123456789 أو whatsapp"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-100 outline-none focus:border-amber-600 transition-all font-sans text-right"
                            />
                          </div>
                        </>
                      )}

                      {currentUser?.user_role === "parent" && (
                        <div className="space-y-3 text-right animate-fade-in">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            الصفوف الدراسية لأبنائك (تحديد متعدد من كافة المراحل) 👪:
                          </label>
                          <div className="space-y-3 max-h-40 sm:max-h-60 overflow-y-auto border border-slate-850 bg-slate-950 p-3 rounded-xl scrollbar-thin scrollbar-thumb-slate-800 text-right">
                            {curriculumData.map((stage) => (
                              <div key={stage.id} className="space-y-1.5 border-b border-slate-900 last:border-0 pb-2 last:pb-0">
                                <span className="text-[10px] font-black text-emerald-400 block mb-1">
                                  ✦ {stage.name === "kindergarten" ? "مرحلة الروضة" : stage.name === "primary" ? "المرحلة الابتدائية" : stage.name === "middle" ? "المرحلة المتوسطة" : stage.name === "high" ? "المرحلة الثانوية" : stage.name}
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {stage.grades.map((grade) => {
                                    const isSelected = selectedParentStages.includes(grade.name);
                                    return (
                                      <button
                                        type="button"
                                        key={grade.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedParentStages(prev => prev.filter(x => x !== grade.name));
                                          } else {
                                            setSelectedParentStages(prev => [...prev, grade.name]);
                                          }
                                        }}
                                        className={`inline-flex items-center justify-between px-2.5 py-1.5 text-3xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-emerald-600/20 text-emerald-400 border-emerald-600 font-black"
                                            : "bg-slate-900 text-slate-400 border-slate-850 hover:border-slate-800"
                                        }`}
                                      >
                                        <span>{grade.name}</span>
                                        {isSelected ? <span className="text-emerald-400 font-black">✓</span> : <span className="text-slate-600">+</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {userModalTab === "register" && (
                    <>
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">الاسم بالكامل (أو اسم المستخدم):</label>
                        <input
                          type="text"
                          required
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          placeholder="مثال: يوسف أحمد التكينة"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                        />
                      </div>

                      {/* نوع الحساب Segmented Button */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] text-slate-400 font-bold block">نوع الحساب الأساسي:</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100/5 p-1 rounded-xl border border-slate-805">
                          <button
                            type="button"
                            onClick={() => setRegUserRole("student")}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                              regUserRole === "student"
                                ? "bg-indigo-650 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-slate-205"
                            }`}
                          >
                            🎓 طالب
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegUserRole("teacher")}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                              regUserRole === "teacher"
                                ? "bg-amber-650 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-slate-205"
                            }`}
                          >
                            👨‍🏫 معلم
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegUserRole("parent")}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                              regUserRole === "parent"
                                ? "bg-emerald-650 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-slate-205"
                            }`}
                          >
                            👪 ولي أمر
                          </button>
                        </div>
                      </div>

                      {/* Conditional Display: Student Class Dropdown */}
                      {regUserRole === "student" && (
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] text-slate-400 font-bold block">الصف والمرحلة الدراسية الخاصة بك:</label>
                          <select
                            value={regGradeId}
                            onChange={(e) => setRegGradeId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-200 outline-none focus:border-indigo-600"
                          >
                            <option value="">-- اختر صفّك الدراسي --</option>
                            {curriculumData.flatMap(stage => 
                              stage.grades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                  {stage.name} - {grade.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      {/* Conditional Display: Teacher specialties list of checkable badges */}
                      {regUserRole === "teacher" && (
                        <>
                          <div className="space-y-2 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              المواد المتخصص بتدريسها لمناهج السودان (تحديد متعدد):
                            </label>
                            <div className="max-h-28 overflow-y-auto border border-slate-850 bg-slate-950 p-2.5 rounded-xl text-right">
                              {Array.from(new Set(
                                curriculumData.flatMap(stage => 
                                  stage.grades.flatMap(grade => 
                                    grade.subjects.map(subj => subj.name)
                                  )
                                )
                              )).map((subjectName) => {
                                const isSelected = selectedSpecialties.includes(subjectName);
                                return (
                                  <button
                                    type="button"
                                    key={subjectName}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSpecialties(prev => prev.filter(x => x !== subjectName));
                                      } else {
                                        setSelectedSpecialties(prev => [...prev, subjectName]);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 ml-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-600/20 text-amber-400 border-amber-600 font-extrabold"
                                        : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                    <span>{subjectName}</span>
                                    {isSelected && <span>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">جوال المعلم أو وسيلة تواصل سريعة (إيميل/رقم):</label>
                            <input
                              type="text"
                              required
                              value={regContactMethod}
                              onChange={(e) => setRegContactMethod(e.target.value)}
                              placeholder="مثال: 0123456789 أو whatsapp"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-100 outline-none focus:border-amber-600 transition-all font-sans text-right"
                            />
                          </div>
                        </>
                      )}

                      {/* Conditional Display: Parent Stage Selector */}
                      {regUserRole === "parent" && (
                        <div className="space-y-3 text-right animate-fade-in">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            الصفوف الدراسية لأبنائك (تحديد متعدد من كافة المراحل) 👪:
                          </label>
                          <div className="space-y-3 max-h-40 sm:max-h-60 overflow-y-auto border border-slate-850 bg-slate-950 p-3 rounded-xl scrollbar-thin scrollbar-thumb-slate-800 text-right">
                            {curriculumData.map((stage) => (
                              <div key={stage.id} className="space-y-1.5 border-b border-slate-900 last:border-0 pb-2 last:pb-0">
                                <span className="text-[10px] font-black text-emerald-400 block mb-1">
                                  ✦ {stage.name === "kindergarten" ? "مرحلة الروضة" : stage.name === "primary" ? "المرحلة الابتدائية" : stage.name === "middle" ? "المرحلة المتوسطة" : stage.name === "high" ? "المرحلة الثانوية" : stage.name}
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {stage.grades.map((grade) => {
                                    const isSelected = selectedParentStages.includes(grade.name);
                                    return (
                                      <button
                                        type="button"
                                        key={grade.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedParentStages(prev => prev.filter(x => x !== grade.name));
                                          } else {
                                            setSelectedParentStages(prev => [...prev, grade.name]);
                                          }
                                        }}
                                        className={`inline-flex items-center justify-between px-2.5 py-1.5 text-3xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-emerald-600/20 text-emerald-400 border-emerald-600 font-black"
                                            : "bg-slate-900 text-slate-400 border-slate-850 hover:border-slate-800"
                                        }`}
                                      >
                                        <span>{grade.name}</span>
                                        {isSelected ? <span className="text-emerald-400 font-black">✓</span> : <span className="text-slate-600">+</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {userModalTab === "login" && (
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100/5 p-1 rounded-xl border border-slate-800/60 mb-4">
                      <button
                        type="button"
                        onClick={() => setLoginRole("student")}
                        className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          loginRole === "student"
                            ? "bg-indigo-650 text-white shadow-sm font-black"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        🎓 دخول الطلاب
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRole("parent")}
                        className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          loginRole === "parent"
                            ? "bg-indigo-650 text-white shadow-sm font-black"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        👪 دخول أولياء الأمور
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRole("admin")}
                        className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          loginRole === "admin"
                            ? "bg-indigo-650 text-white shadow-sm font-black"
                            : "text-slate-400 hover:text-slate-205"
                        }`}
                      >
                        🔑 دخول المعلمين والإدارة
                      </button>
                    </div>
                  )}


                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      {userModalTab === "profile" ? "البريد الإلكتروني (غير قابل للتعديل):" : "البريد الإلكتروني:"}
                    </label>
                    <input
                      type="email"
                      required
                      disabled={userModalTab === "profile"}
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder={loginRole === "admin" && userModalTab === "login" ? "admin@example.com" : loginRole === "parent" ? "parent@example.com" : "student@example.com"}
                      className={`w-full border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs outline-none transition-all font-sans text-left ${userModalTab === "profile" ? "bg-slate-950/60 text-slate-400 pointer-events-none" : "bg-slate-950 text-slate-100 focus:border-indigo-600"}`}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      {userModalTab === "profile" ? "تعديل كلمة المرور السرية (اتركها فارغة للإبقاء على الحالية):" : "كلمة المرور السرية:"}
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required={userModalTab !== "profile"}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={userModalTab === "profile" ? "•••••••• (تغيير كلمة المرور)" : "••••••••"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs text-slate-100 outline-none focus:border-indigo-600 transition-all font-sans"
                    />
                  </div>

                  {userAuthError && (
                    <div className="text-[10px] text-rose-400 font-bold text-right leading-relaxed bg-rose-955/20 border border-rose-900/30 p-3 rounded-xl whitespace-pre-line" dir="rtl">
                      {userAuthError}
                    </div>
                  )}

                  {userAuthSuccess && (
                    <div className="text-[10px] text-emerald-450 font-bold text-center leading-relaxed bg-emerald-955/20 border border-emerald-900/30 p-2.5 rounded-xl">
                      {userAuthSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {isAuthLoading ? "جاري التحقق والمزامنة..." : userModalTab === "profile" ? "حفظ وتعديل البيانات الشخصية 💾" : userModalTab === "login" ? "تسجيل المزامنة والدخول 🚀" : "إتمام إنشاء الحساب وحفظه فورياً ✨"}
                  </button>

                  {userModalTab !== "profile" && (
                    <div className="mt-3">
                      <div className="relative flex py-1.5 items-center">
                        <div className="flex-grow border-t border-slate-800/50"></div>
                        <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold select-none">أو</span>
                        <div className="flex-grow border-t border-slate-800/50"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleEnterAsGuest}
                        className="w-full py-2 sm:py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-350 text-2xs font-extrabold rounded-xl transition-all cursor-pointer border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 flex items-center justify-center gap-1.5 active:scale-95 shadow-inner"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>تصفح المنصة كـ زائر (بدون حساب) 🚪✨</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Informative Footer */}
              <div className="bg-slate-955/80 px-6 py-4 border-t border-slate-800/45 text-center">
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  {userModalTab === "profile" ? "الحساب مجاناً وبدون أي تكاليف ويمنع نهائياً استخدام المنصة لأغراض تجارية 🛡️" : "           الحساب مجانا وبدون أي تكاليف ويمنع  نهائيا استخدام المنصة لأغراض تجارية ."}
                </p>
              </div>
              </div> {/* End scrollable container */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky footer info */}
      <footer className="mt-20 border-t border-slate-800/80 pt-10 text-center max-w-7xl mx-auto px-6">


        <div className="space-y-4 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <WebsiteLogo size={24} />
            <p className="font-semibold text-slate-300">🇸🇩منصة نقلة للمناهج الالكترونية السودانية التفاعلية لعام 2026</p>
          </div>
          <p className="max-w-xl mx-auto text-2xs text-slate-500 leading-relaxed">
             تم تطوير هذا المنصة بواسطة عثمان المنقوري لمساعدة المنظومة التعليمية وطلاب السودان الأحباء لتسهيل التعلم ولملاحظاتكم واستفساراتكم يمكنكم التواصل على البريد الالكتروني  almangoryo@gmail.com               .
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
            className={`fixed bottom-6 left-6 md:left-auto md:right-6 z-[9999] bg-slate-950 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-2xl border ${
              saveStatus.includes("⚠️") || saveStatus.includes("❌")
                ? "border-amber-500/60 text-amber-400"
                : saveStatus.includes("جاري م") || saveStatus.includes("جاري M")
                ? "border-indigo-500/60 text-indigo-400"
                : "border-emerald-500/60 text-emerald-400"
            }`}
          >
            {saveStatus.includes("⚠️") || saveStatus.includes("❌") ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
            ) : saveStatus.includes("جاري م") || saveStatus.includes("جاري M") ? (
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
            )}
            <span className="text-xs font-extrabold text-slate-200">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Mobile & Tablet Custom Notification Permission Prompt */}
      <AnimatePresence>
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-20 inset-x-4 mx-auto max-w-sm bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/40 p-4 rounded-2xl shadow-2xl z-[9999] flex flex-col gap-3 font-sans"
            dir="rtl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-650/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
                <Bell className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1 text-right flex-1 min-w-0">
                <h5 className="text-xs font-black text-slate-100">
                  تفعيل إشعارات الجوال 🔔
                </h5>
                <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
                  احصل على تنبيهات فورية ضمن بار الجوال للمواد الدراسية الجديدة، الدردشات، ورسائل الأساتذة الخاصة بك لمتابعة الدروس أولاً بأول.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDismissPushPrompt}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-[10px] font-bold text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-800"
              >
                ليس الآن
              </button>
              <button
                onClick={handleRequestPushPermission}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black text-white rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/50 flex items-center gap-1 active:scale-95"
              >
                <span>🔔</span>
                <span>تفعيل الآن</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ Custom Banner Image & Video Customizer Modal (with Google Drive animated links integration) */}
      <AnimatePresence>
        {showBannerEditModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white border border-earthgold/30 rounded-3xl overflow-hidden shadow-2xl relative text-right font-sans"
              dir="rtl"
            >
              {/* Pattern Header Background Accent */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF5EC] to-transparent pointer-events-none" />
              
              {/* Modal Upper Top Bar */}
              <div className="p-6 pb-4 border-b border-mud/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600">
                    <Image className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-mud">
                      تعديل مظهر صندوق البانر 🖼️🎥
                    </h5>
                    <p className="text-3xs text-mud/60 mt-0.5 font-medium">
                      يمكنك استخدام صور متحركة GIF أو فيديوهات تفاعلية من قوقل درايف أو روابط مباشرة
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBannerEditModal(false)}
                  className="p-1.5 bg-cream hover:bg-cream/80 border border-mud/10 rounded-xl text-mud/60 hover:text-mud transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 relative z-10">
                {/* Media Type Toggle */}
                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold text-mud/80">
                    نوع المحتوى المرفق 📂
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-cream/40 p-1 rounded-xl border border-mud/10">
                    <button
                      type="button"
                      onClick={() => setTempBannerMediaType("image")}
                      className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tempBannerMediaType === "image"
                          ? "bg-[#D4AF37] text-white shadow-xs"
                          : "text-mud/70 hover:bg-cream/70 hover:text-mud"
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      <span>صورة أو متحركة GIF 🖼️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempBannerMediaType("video")}
                      className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tempBannerMediaType === "video"
                          ? "bg-[#D4AF37] text-white shadow-xs"
                          : "text-mud/70 hover:bg-cream/70 hover:text-mud"
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>فيديو تفاعلي 🎥</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold text-mud/80">
                    رابط ملف قوقل درايف أو رابط خارجي مباشر 🔗
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder={tempBannerMediaType === "video" ? "أدخل رابط فيديو قوقل درايف أو رابط فيديو MP4 مباشر..." : "أدخل رابط صورة قوقل درايف أو أي رابط صورة مباشر..."}
                      value={tempBannerUrl}
                      onChange={(e) => setTempBannerUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs bg-cream/50 hover:bg-cream/80 focus:bg-white border border-mud/15 rounded-xl text-mud font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                    />
                    {tempBannerUrl && (
                      <button
                        onClick={() => setTempBannerUrl("")}
                        className="px-3 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-600 text-3xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        مسح 🗑️
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-mud/55 leading-relaxed font-sans">
                    💡 **صيغة قوقل درايف المدعومة**: الصق رابط المشاركة العادي (مثال: <code className="bg-cream px-1 py-0.5 rounded text-[9px] font-mono break-all text-amber-700">https://drive.google.com/file/d/.../view</code>) وسنقوم تلقائياً بتحويله وتفعيله كمشغل تفاعلي!
                  </p>
                </div>

                {/* Live Preview Block */}
                <div className="space-y-2">
                  <span className="block text-3xs font-black text-mud/50 uppercase tracking-wider">
                    معاينة حية للمظهر الجديد 👁️
                  </span>
                  <div className="h-36 rounded-2xl border border-dashed border-mud/20 bg-cream/20 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {tempBannerUrl ? (
                      tempBannerMediaType === "video" ? (
                        tempBannerUrl.includes("drive.google.com") ? (
                          <iframe
                            src={getGoogleDriveEmbedUrl(tempBannerUrl)}
                            title="Preview Banner Video"
                            className="w-full h-full object-cover rounded-2xl scale-[1.1]"
                            allow="autoplay"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <video
                            src={tempBannerUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        )
                      ) : (
                        <img
                          src={convertGoogleDriveUrl(tempBannerUrl)}
                          alt="Preview Banner"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Warning preview
                          }}
                        />
                      )
                    ) : (
                      <div className="text-center p-4 space-y-1 text-mud/40">
                        <Image className="w-8 h-8 mx-auto stroke-1" />
                        <span className="block text-4xs font-bold">
                          المعالم التراثية التقليدية السودانية الافتراضية
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Helpful tips */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1">
                  <h6 className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
                    <span>🌟</span>
                    <span>خطوات مشاركة الملف (صورة أو فيديو) بشكل صحيح:</span>
                  </h6>
                  <ul className="list-decimal list-inside text-4xs text-mud/70 space-y-1 leading-relaxed font-sans">
                    <li>اضغط بالزر الأيمن على الصورة أو الفيديو داخل قوقل درايف (Google Drive).</li>
                    <li>اختر **مشاركة (Share)** ثم **مشاركة مع الآخرين**.</li>
                    <li>تأكد من تغيير الوصول العام إلى **أي شخص لديه الرابط (Anyone with the link)**.</li>
                    <li>اضغط على **نسخ الرابط (Copy Link)** ثم الصقه في الحقل أعلاه!</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="p-6 bg-[#FAF5EC]/50 border-t border-mud/10 flex gap-3 justify-end relative z-10">
                <button
                  onClick={() => setShowBannerEditModal(false)}
                  className="px-4 py-2 bg-white hover:bg-cream border border-mud/15 text-xs font-bold text-mud rounded-xl transition-all cursor-pointer"
                >
                  إلغاء التغييرات
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("sudan_banner_image_url", tempBannerUrl);
                    localStorage.setItem("sudan_banner_media_type", tempBannerMediaType);
                    setBannerImageUrl(tempBannerUrl);
                    setBannerMediaType(tempBannerMediaType);
                    setShowBannerEditModal(false);
                    setSaveStatus("✨ تم تحديث وحفظ مظهر صندوق البانر وتفعيله بنجاح!");
                    setTimeout(() => setSaveStatus(null), 4000);
                  }}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#bfa032] active:scale-95 text-xs font-black text-white rounded-xl transition-all cursor-pointer shadow-md shadow-amber-950/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتطبيق المظهر الجديد 💾</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OnboardingGuide 
        isOpen={showOnboardingGuide} 
        onClose={handleCloseOnboarding} 
        currentLang={currentLang} 
        siteTheme={siteTheme} 
      />

      <PWAInstallPrompt />

    </div>
  );
}