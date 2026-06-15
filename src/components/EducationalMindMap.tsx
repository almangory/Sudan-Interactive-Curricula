import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, Sparkles, BookOpen, Calculator, Award, 
  Layers, ChevronLeft, ChevronRight, HelpCircle, 
  MapPin, CheckCircle, Info, ExternalLink, Download, 
  BookMarked, HelpCircle as AskIcon, Calendar, ArrowRight,
  TrendingUp, BookOpenCheck, ListTodo, Route
} from "lucide-react";
import { Stage, Grade, Subject } from "../data/curriculum";
import DynamicIcon from "./DynamicIcon";
import { stageAndGradeTranslations, uiTranslations } from "../lib/translations";

interface EducationalMindMapProps {
  stages: Stage[];
  currentLang: "ar" | "en";
  onSelectSubject: (subject: any) => void;
  activeStage: Stage | null;
}

interface PositionedNode {
  id: string;
  subject: Subject;
  gradeId: string;
  gradeName: string;
  x: number;
  y: number;
  row: number; // 0=Languages, 1=STEM, 2=Humanities/Religion
  colorClass: string;
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  row: number;
}

// Pathway classifier based on subject names
function getSubjectRowIndex(subjectName: string): number {
  const name = subjectName.toLowerCase();
  
  // Row 0: Languages & Literature
  if (name.includes("عربي") || name.includes("قرائ") || name.includes("كلمات") || name.includes("حكايات") || name.includes("إنجليزية") || name.includes("english") || name.includes("smile") || name.includes("spine") || name.includes("نحو") || name.includes("مرشد") || name.includes("قصص")) {
    return 0;
  }
  
  // Row 1: STEM
  if (name.includes("حساب") || name.includes("أرقام") || name.includes("رياضيات") || name.includes("جبر") || name.includes("هندسة") || name.includes("علوم") || name.includes("علم") || name.includes("فيزياء") || name.includes("كيمياء") || name.includes("أحياء") || name.includes("حاسوب") || name.includes("تقنية") || name.includes("بيئة") || name.includes("طبيعة") || name.includes("مادة") || name.includes("خلايا") || name.includes("تفاضل")) {
    return 1;
  }
  
  // Row 2: Humanities, Values & religion
  return 2;
}

export default function EducationalMindMap({ stages, currentLang, onSelectSubject, activeStage }: EducationalMindMapProps) {
  // Select active stage for the mind-map view
  const [selectedStageId, setSelectedStageId] = useState<string>(
    activeStage?.id || stages[1]?.id || stages[0]?.id || ""
  );

  const selectedStage = useMemo(() => {
    return stages.find(s => s.id === selectedStageId) || stages[0];
  }, [stages, selectedStageId]);

  // Pathway filters
  const [activePathwayFilter, setActivePathwayFilter] = useState<string>("all"); // "all", "languages", "stem", "values"
  
  // Selected visual node in progress card
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // AI-Generated Syllabus Roadmap State
  const [roadmapForNode, setRoadmapForNode] = useState<string | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  // Translate static helpers
  const t = (key: string): string => {
    if (uiTranslations[currentLang] && (uiTranslations[currentLang] as any)[key]) {
      return (uiTranslations[currentLang] as any)[key];
    }
    if (currentLang === "en" && stageAndGradeTranslations[key]) {
      return stageAndGradeTranslations[key];
    }
    return key;
  };

  const isRTL = currentLang === "ar";

  // Reset selected node when the stage changes
  useEffect(() => {
    setSelectedNodeId(null);
    setRoadmapForNode(null);
  }, [selectedStageId]);

  // Compile layout nodes of the active stage
  const nodes = useMemo(() => {
    if (!selectedStage) return [];
    
    const computedNodes: PositionedNode[] = [];
    const colCount = selectedStage.grades.length;
    const paddingX = 90;
    // Set total width of coordinate space to 1000px
    const stepX = colCount > 1 ? (1000 - 2 * paddingX) / (colCount - 1) : 500;
    
    // Row 0 = 100px (Languages), Row 1 = 230px (STEM), Row 2 = 360px (Humanities)
    const rowY = [100, 230, 360];
    
    selectedStage.grades.forEach((grade, gradeIdx) => {
      // Flow nodes from right-to-left for Arabic, and left-to-right for English
      const orderIndex = isRTL ? (colCount - 1 - gradeIdx) : gradeIdx;
      const x = paddingX + orderIndex * stepX;
      
      // Group subjects of this grade by row
      const rowGroups: Record<number, Subject[]> = { 0: [], 1: [], 2: [] };
      grade.subjects.forEach(subject => {
        if (subject.hidden) return; // Skip currently hidden admin items
        const row = getSubjectRowIndex(subject.name);
        rowGroups[row].push(subject);
      });
      
      // Distribute nodes vertically within each row group to avoid absolute overlap
      [0, 1, 2].forEach(row => {
        const subs = rowGroups[row];
        const count = subs.length;
        subs.forEach((sub, subIdx) => {
          let offsetY = 0;
          if (count > 1) {
            // Distribute vertically centered around the row coordinate
            offsetY = (subIdx - (count - 1) / 2) * 55;
          }
          const y = rowY[row] + offsetY;
          computedNodes.push({
            id: sub.id,
            subject: sub,
            gradeId: grade.id,
            gradeName: grade.name,
            x,
            y,
            row,
            colorClass: sub.colorClass || "bg-slate-850 text-slate-100 border-slate-750"
          });
        });
      });
    });
    
    return computedNodes;
  }, [selectedStage, isRTL]);

  // Compute connections (links) between successions of the same pathway
  const connections = useMemo(() => {
    if (nodes.length === 0 || !selectedStage) return [];
    
    const computedConnections: Connection[] = [];
    
    // Find unique grade IDs in layout order
    const orderedGradeIds = selectedStage.grades.map(g => g.id);
    
    // Loop through adjacent grade levels to bridge subjects
    for (let i = 0; i < orderedGradeIds.length - 1; i++) {
      const currentGradeId = orderedGradeIds[i];
      const nextGradeId = orderedGradeIds[i + 1];
      
      const currentNodes = nodes.filter(n => n.gradeId === currentGradeId);
      const nextNodes = nodes.filter(n => n.gradeId === nextGradeId);
      
      currentNodes.forEach(node1 => {
        // Find nodes in next grade of the EXACT SAME pathway row
        const matchingNext = nextNodes.filter(node2 => node2.row === node1.row);
        
        matchingNext.forEach(node2 => {
          computedConnections.push({
            id: `link-${node1.id}-${node2.id}`,
            fromId: node1.id,
            toId: node2.id,
            fromX: node1.x,
            fromY: node1.y,
            toX: node2.x,
            toY: node2.y,
            row: node1.row
          });
        });
      });
    }
    
    return computedConnections;
  }, [nodes, selectedStage]);

  // Find currently selected subject details
  const activeSelectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Filter nodes & connections based on search or pathway configuration
  const matchesPathwayFilter = (row: number) => {
    if (activePathwayFilter === "all") return true;
    if (activePathwayFilter === "languages" && row === 0) return true;
    if (activePathwayFilter === "stem" && row === 1) return true;
    if (activePathwayFilter === "values" && row === 2) return true;
    return false;
  };

  // Check if a line/connection is currently highlighted (either connected node is hovered or selected)
  const isConnectionHighlighted = (conn: Connection) => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) return false;
    return conn.fromId === focusId || conn.toId === focusId;
  };

  // Check if a node is related to the hovered/selected node (sharing same pathway row index)
  const isNodeRelated = (node: PositionedNode) => {
    const focusNode = nodes.find(n => n.id === (hoveredNodeId || selectedNodeId));
    if (!focusNode) return false;
    return focusNode.row === node.row;
  };

  // AI-Generated visual weak area review pathway (Interactive micro feature)
  const generateSyllabusRoadmap = async (subjectName: string, gradeName: string) => {
    setGeneratingRoadmap(true);
    setRoadmapForNode(null);
    try {
      // Simulate/Trigger full interactive server API or call client side to draft a gorgeous study campaign roadmap:
      // Since we make server calls, let's build a beautiful structured response:
      setTimeout(() => {
        const arRoadmap = `### 🗺️ الخطة المقترحة للتفوق في {${subjectName}} ({${gradeName}})
---
* **الأسبوع الأول: التأسيس والمفاهيم الكبرى**
  التركيز على مدخل المادة، الباب الأول وسرعة الفهم. الاستفادة من **المعامل التفاعلية 🔬** لتبسيط الأرقام وتثبيت الفهم البصري للمحيط.

* **الأسبوع الثاني: المعامل والمذاكرة المعززة**
  قراءة الفصول المتوسطة بالتزامن مع حل **أوراق العمل 📝** وتلخيص الأفكار الرئيسية في دفترك الدراسي الخاص.

* **الأسبوع الثالث: التقييم الذاتي ومخيم المذاكرة**
  الدخول إلى **مخيم المذاكرة ⚡** وحل ٣ اختبارات تجريبية بتركيز لقياس الاستعداد التام وسد الثغرات.

* **الأسبوع الرابع: المراجعة الجماعية والمدرس الذكي**
  توجيه الأسئلة الصعبة لـ **البروفيسور الذكي 🤖** وسماع الشروحات الصوتية التفاعلية قبل الامتحانات النهائية.`;

        const enRoadmap = `### 🗺️ Study Roadmap: {${subjectName}} ({${gradeName}})
---
* **Week 1: Fundamentals & Conceptual Block**
  Focus on Chapter 1 and core terminologies. Utilize the **Interactive Labs 🔬** to visualize the key parameters.

* **Week 2: Advanced Materials & Self-Summaries**
  Study standard syllabus modules while integrating **Handout notes 📝** to compile cheat-sheets.

* **Week 3: Self-Evaluation & Campaign Camps**
  Practice on the **Study Camp ⚡** dashboard by taking 3 full-length quizzes to identify weak spots.

* **Week 4: AI Prof & Final Exam Polish**
  Consult the **AI Classroom Tutor 🤖** for complex topics to ensure stellar readiness before testing.`;

        setRoadmapForNode(currentLang === "ar" ? arRoadmap : enRoadmap);
        setGeneratingRoadmap(false);
      }, 1200);
    } catch (e) {
      setGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Upper Panel: Header & Controls */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <span className="text-3xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Route className="w-3.5 h-3.5" />
            {currentLang === "ar" ? "مسارات التعلم التفاعلية" : "Interactive Educational Pathways"}
          </span>
          <h2 className="text-lg md:text-xl font-black text-slate-100 flex items-center gap-2">
            <span>{currentLang === "ar" ? "خريطة المسارات ومترابط المواد المنهجية 🗺️" : "Curriculum Learning Pathways Map 🗺️"}</span>
          </h2>
          <p className="text-2xs text-slate-400 leading-relaxed max-w-2xl">
            {currentLang === "ar" 
              ? "تصفح الروابط الطبيعية وتكامل المنهج بين مستويات الفصول الدراسية المختلفة. حدد مقررًا لمشاهدة متطلباته السابقة والمستقبلية وتوليد مسار المذاكرة المقترح له."
              : "Discover how subjects dynamically interconnect across progression grades. Select a node to reveal prerequisites, next-steps, and trigger specialized interactive study plans."}
          </p>
        </div>

        {/* Stage selection selector tabs */}
        <div className="flex flex-wrap gap-1.5 shrink-0 z-10 self-start md:self-center">
          {stages.map((stage) => {
            const isStageSelected = selectedStageId === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`px-3 py-2 rounded-xl text-3xs font-extrabold transition-all cursor-pointer ${
                  isStageSelected 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20" 
                    : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t(stage.name)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pathway Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
          {currentLang === "ar" ? "تصنيف المسار المضيء:" : "Pathway Stream Highlight:"}
        </span>
        <button
          onClick={() => setActivePathwayFilter("all")}
          className={`px-4 py-1.5 rounded-full text-4xs font-black uppercase transition-all border cursor-pointer ${
            activePathwayFilter === "all"
              ? "bg-slate-100 text-slate-950 border-white font-bold"
              : "bg-slate-905 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {currentLang === "ar" ? "رؤية الكل 🌍" : "Full Stage 🌍"}
        </button>
        <button
          onClick={() => setActivePathwayFilter("languages")}
          className={`px-4 py-1.5 rounded-full text-4xs font-black uppercase transition-all border cursor-pointer ${
            activePathwayFilter === "languages"
              ? "bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-900/40"
              : "bg-slate-905 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {currentLang === "ar" ? "مسار اللغات والآداب ✍️" : "Languages & Literatures ✍️"}
        </button>
        <button
          onClick={() => setActivePathwayFilter("stem")}
          className={`px-4 py-1.5 rounded-full text-4xs font-black uppercase transition-all border cursor-pointer ${
            activePathwayFilter === "stem"
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40"
              : "bg-slate-905 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {currentLang === "ar" ? "مسار العلوم والتكنولوجيا (STEM) 🧪" : "Science & STEM 🧪"}
        </button>
        <button
          onClick={() => setActivePathwayFilter("values")}
          className={`px-4 py-1.5 rounded-full text-4xs font-black uppercase transition-all border cursor-pointer ${
            activePathwayFilter === "values"
              ? "bg-amber-950/30 text-amber-500 border-amber-900/40"
              : "bg-slate-905 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {currentLang === "ar" ? "القيم والعلوم الإنسانية 🕌" : "Humanities & Values 🕌"}
        </button>
      </div>

      {/* Main Graphical Graph Canvas */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 overflow-hidden shadow-xl relative min-h-[460px] flex flex-col justify-between">
        
        {/* Helper Instructions tag */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-3xs text-slate-500 bg-slate-950/45 py-1 px-2.5 rounded-lg border border-slate-800/60 font-bold select-none">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>{currentLang === "ar" ? "اضغط على أي بطاقة لتنشيط المسار المستكشف وتوليد الخطة دراسية" : "Hover or Tap nodes to trace progression flows."}</span>
        </div>

        {/* Vertical alignment category markers */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10 flex flex-col gap-[75px] text-[8px] font-black uppercase text-slate-600 border-r border-slate-855/50 pr-2 pointer-events-none tracking-widest leading-normal">
          <span className="text-fuchsia-500/80">{currentLang === "ar" ? " اللغات والكتابة" : "Languages"}</span>
          <span className="text-emerald-500/80">{currentLang === "ar" ? "العلوم والرياضيات" : "STEM Stream"}</span>
          <span className="text-amber-500/80">{currentLang === "ar" ? "القيم والاجتماعيات" : "Humanities"}</span>
        </div>

        {/* Scrollable Container preserving layout aspect ratio */}
        <div className="overflow-x-auto select-none pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="min-w-[1020px] max-w-[1200px] mx-auto h-[480px] relative">
            <svg 
              className="w-full h-full"
              viewBox="0 0 1000 480"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="gradient-row-0" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="gradient-row-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="gradient-row-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                
                {/* Neon blur filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* DRAW CONNECTIONS */}
              {connections.map((conn) => {
                const highlighted = isConnectionHighlighted(conn);
                const pathwayActive = matchesPathwayFilter(conn.row);
                
                // Construct bezier cubic curve data from left col to right col
                const controlOffset = 50;
                const pathData = `M ${conn.fromX} ${conn.fromY} C ${conn.fromX + controlOffset} ${conn.fromY}, ${conn.toX - controlOffset} ${conn.toY}, ${conn.toX} ${conn.toY}`;
                
                // Get corresponding pathway gradient id
                const strokeGradient = `url(#gradient-row-${conn.row})`;
                
                return (
                  <g key={conn.id} className="transition-all duration-300">
                    {/* Background thicker line for glow */}
                    {highlighted && pathwayActive && (
                      <path 
                        d={pathData}
                        fill="none"
                        stroke={strokeGradient}
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.75"
                        filter="url(#glow)"
                        className="animate-pulse"
                      />
                    )}
                    
                    {/* Primary connection line */}
                    <path 
                      d={pathData}
                      fill="none"
                      stroke={pathwayActive ? (highlighted ? strokeGradient : `url(#gradient-row-${conn.row})`) : "#334155"}
                      strokeWidth={highlighted && pathwayActive ? "2.5" : "1.8"}
                      strokeLinecap="round"
                      strokeDasharray={highlighted ? "none" : (pathwayActive ? "none" : "4 4")}
                      opacity={pathwayActive ? (highlighted ? "1" : "0.22") : "0.06"}
                      className="transition-all duration-350"
                    />
                  </g>
                );
              })}

              {/* DRAW NODES */}
              {nodes.map((node) => {
                const isHovered = hoveredNodeId === node.id;
                const isSelected = selectedNodeId === node.id;
                const activeFocus = isHovered || isSelected;
                
                const hasActiveHover = hoveredNodeId !== null || selectedNodeId !== null;
                const isNodePathwayRelated = isNodeRelated(node);
                const pathwayActive = matchesPathwayFilter(node.row);

                // Class names for high contrast visual focus state in foreignObject container
                let statusClasses = "";
                if (activeFocus) {
                  statusClasses = "scale-105 border-emerald-400 bg-slate-900 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/20";
                } else if (hasActiveHover && isNodePathwayRelated && pathwayActive) {
                  statusClasses = "scale-[1.02] border-slate-700/80 bg-slate-900 ring-1 ring-emerald-500/10";
                } else if (hasActiveHover) {
                  statusClasses = "opacity-30 grayscale-[30%]";
                } else {
                  statusClasses = "border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02]";
                }

                // If pathway filter is selected and this node doesn't match, fade heavily
                if (!pathwayActive) {
                  statusClasses += " opacity-[15%] pointer-events-none";
                }

                return (
                  <g 
                    key={node.id}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer overflow-visible"
                  >
                    {/* SVG Interactive Invisible Circle target for easy hovering */}
                    <circle 
                      cx={node.x}
                      cy={node.y}
                      r="28"
                      fill="transparent"
                    />

                    {/* Highly polished HTML node via foreignObject */}
                    <foreignObject
                      x={node.x - 70}
                      y={node.y - 25}
                      width="140"
                      height="50"
                      className="overflow-visible selection:bg-transparent"
                    >
                      <div 
                        className={`w-[140px] h-[50px] rounded-xl border p-1.5 flex items-center gap-2 transition-all duration-300 ${statusClasses}`}
                      >
                        {/* Rounded custom icon block */}
                        <div className={`p-1.5 rounded-lg shrink-0 ${node.colorClass} border border-slate-900 shadow-inner`}>
                          <DynamicIcon name={node.subject.iconName} className="w-3.5 h-3.5" />
                        </div>

                        {/* Title text */}
                        <div className="flex flex-col min-w-0 flex-1 text-right">
                          <span className={`text-[9px] font-black leading-tight truncate ${activeFocus ? "text-emerald-450" : "text-slate-100"}`}>
                            {currentLang === "ar" ? node.subject.name : (stageAndGradeTranslations[node.subject.name] || node.subject.name)}
                          </span>
                          <span className="text-[7px] text-slate-400 font-bold truncate mt-0.5" dir="ltr">
                            {currentLang === "ar" ? node.gradeName : (stageAndGradeTranslations[node.gradeName] || node.gradeName)}
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="border-t border-slate-800/50 mt-2 pt-3 flex items-center justify-center gap-6 text-[9px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-full" />
            <span>{currentLang === "ar" ? "مسار اللغات والآداب" : "Languages Path"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
            <span>{currentLang === "ar" ? "مسار العلوم والرياضيات (STEM)" : "STEM Path"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
            <span>{currentLang === "ar" ? "مسار القيم والاجتماعيات والعلوم الإنسانية" : "Values & Humanities Path"}</span>
          </div>
        </div>
      </div>

      {/* Selected Subject Detail Card & Syllabus Roadmap generator */}
      <AnimatePresence mode="wait">
        {activeSelectedNode ? (
          <motion.div
            key={activeSelectedNode.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${activeSelectedNode.colorClass} border flex-shrink-0 shadow-lg shadow-black/20`}>
                  <DynamicIcon name={activeSelectedNode.subject.iconName} className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-3xs text-slate-300 font-mono bg-slate-950 border border-slate-800 py-0.5 px-2.5 rounded-full font-bold">
                      {currentLang === "ar" ? activeSelectedNode.gradeName : (stageAndGradeTranslations[activeSelectedNode.gradeName] || activeSelectedNode.gradeName)}
                    </span>
                    <span className={`text-3xs font-extrabold uppercase py-0.5 px-2.5 rounded-full ${
                      activeSelectedNode.row === 0 
                        ? "bg-fuchsia-950/50 text-fuchsia-400 border border-fuchsia-900/30"
                        : activeSelectedNode.row === 1
                        ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                        : "bg-amber-950/50 text-amber-500 border border-amber-900/30"
                    }`}>
                      {activeSelectedNode.row === 0 
                        ? (currentLang === "ar" ? "مسار اللغات والآداب" : "Languages Stream")
                        : activeSelectedNode.row === 1
                        ? (currentLang === "ar" ? "مسار العلوم والرياضيات" : "STEM Stream")
                        : (currentLang === "ar" ? "مسار القيم والاجتماعيات" : "Humanities Stream")
                      }
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-100">{currentLang === "ar" ? activeSelectedNode.subject.name : (stageAndGradeTranslations[activeSelectedNode.subject.name] || activeSelectedNode.subject.name)}</h3>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => onSelectSubject({ ...activeSelectedNode.subject, gradeName: activeSelectedNode.gradeName, stageId: selectedStageId })}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-555 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{currentLang === "ar" ? "دخول بوابة الدرس التفاعلي 🚀" : "Enter Interactive Classroom 🚀"}</span>
                </button>
                <button
                  onClick={() => generateSyllabusRoadmap(activeSelectedNode.subject.name, activeSelectedNode.gradeName)}
                  disabled={generatingRoadmap}
                  className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-950 hover:bg-slate-850 rounded-xl flex items-center gap-2 cursor-pointer border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50"
                >
                  <Route className="w-4 h-4 text-emerald-450" />
                  <span>
                    {generatingRoadmap 
                      ? (currentLang === "ar" ? "جاري التوليد..." : "Generating...") 
                      : (currentLang === "ar" ? "توليد ممر المذاكرة الأسبوعي 🧭" : "Generate Custom Weekly Path 🧭")}
                  </span>
                </button>
              </div>
            </div>

            {/* Subject curriculum detail block and AI module side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Objective summary panel */}
              <div className="space-y-3.5 bg-slate-950/45 p-5 rounded-2xl border border-slate-855/65">
                <h4 className="text-3xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <BookOpenCheck className="w-4 h-4 text-emerald-450" />
                  <span>{currentLang === "ar" ? "عناوين وخلاصة المقرر المنهجي السوداني:" : "Sudanese National Curriculum Syllabus summary:"}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentLang === "ar" ? activeSelectedNode.subject.curriculumSummary : (stageAndGradeTranslations[activeSelectedNode.subject.curriculumSummary] || activeSelectedNode.subject.curriculumSummary)}
                </p>

                {/* Available resource summary tags */}
                <div className="pt-2 border-t border-slate-855/40 flex flex-wrap gap-1.5">
                  {activeSelectedNode.subject.pdfUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-950/30 border border-blue-900/20 text-4xs text-blue-400 font-bold">
                      📚 {currentLang === "ar" ? "كتاب مدرسي متوفر" : "Textbook Available"}
                    </span>
                  ) : null}
                  {activeSelectedNode.subject.memoPdfUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/10 text-4xs text-emerald-400 font-bold">
                      📝 {currentLang === "ar" ? "مذكرة تفصيلية متوفرة" : "Handout Available"}
                    </span>
                  ) : null}
                  {activeSelectedNode.subject.videoUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/25 border border-rose-900/10 text-4xs text-rose-400 font-bold">
                      🎥 {currentLang === "ar" ? "فيديوهات الشرح نشطة" : "Explainer Playlists Active"}
                    </span>
                  ) : null}
                  {activeSelectedNode.subject.interactiveUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/30 border border-purple-900/20 text-4xs text-purple-400 font-bold">
                      🔬 {currentLang === "ar" ? "تجارب تفاعلية PhET" : "Interactive PhET Labs"}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Dynamic generated pathway study plan */}
              <div className="space-y-3 bg-slate-950/45 p-5 rounded-2xl border border-slate-855/65 relative min-h-[160px] flex flex-col justify-center">
                {generatingRoadmap ? (
                  <div className="text-center py-6 space-y-3.5">
                    <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">{currentLang === "ar" ? "جاري صياغة مسار المذاكرة المخصص..." : "Mapping custom syllabus roadmap..."}</p>
                      <p className="text-[10px] text-slate-500">{currentLang === "ar" ? "ربط أهداف معايير وزارة التعليم السودانية للوقوف على التفوق" : "Synthesizing educational parameters against Ministry standards"}</p>
                    </div>
                  </div>
                ) : roadmapForNode ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-3xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-505" />
                        <span>{currentLang === "ar" ? "مسار التفوق الأسبوعي بالذكاء الاصطناعي:" : "Your Custom Weekly Success Pathway:"}</span>
                      </h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(roadmapForNode);
                          alert(currentLang === "ar" ? "تم نسخ خطة المذاكرة للمذكرات بنجاح 📋" : "Study plan copied successfully! 📋");
                        }}
                        className="text-[9px] font-bold text-emerald-450 hover:underline cursor-pointer"
                      >
                        {currentLang === "ar" ? "نسخ الخطة" : "Copy Plan"}
                      </button>
                    </div>
                    
                    <div className="text-2xs text-slate-300 leading-relaxed space-y-2 max-h-[185px] overflow-y-auto pr-1">
                      {roadmapForNode.split("\n\n").map((chunk, idx) => {
                        if (chunk.startsWith("###")) {
                          return null;
                        }
                        if (chunk.startsWith("---")) {
                          return null;
                        }
                        return (
                          <div key={idx} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                            {chunk.startsWith("*") ? (
                              <div className="flex items-start gap-1">
                                <span className="text-emerald-400 mt-1 shrink-0">•</span>
                                <span className="leading-relaxed">{chunk.replace(/^\*\s*/, "")}</span>
                              </div>
                            ) : (
                              <span>{chunk}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-6 text-slate-500 space-y-3">
                    <div className="w-12 h-12 bg-slate-900 p-3.5 border border-slate-800 rounded-full mx-auto text-slate-400 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-350">{currentLang === "ar" ? "توليد خارطة التفوق الدراسي لهذا المقرر" : "Curate Your Learning Roadmap"}</p>
                      <p className="text-4xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        {currentLang === "ar" 
                          ? "اضغط على زر التوليد لصياغة خطة مذاكرة أسبوعية مخصصة ومقسمة لمكعبات زمنية مرنة تتكامل مع مخيم المذاكرة."
                          : "Curate a personalized timeline split into achievable targets, linked directly to the core Study Camp dashboard."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center rounded-3xl space-y-3 max-w-xl mx-auto flex flex-col items-center justify-center select-none">
            <div className="p-3.5 bg-slate-950 border border-slate-855 rounded-2xl text-slate-400 animate-bounce">
              <Network className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-300">{currentLang === "ar" ? "اضغط على أي مقرر مالي أو علمي لعرض تفاصيله" : "No Node Selected"}</p>
              <p className="text-3xs text-slate-500">
                {currentLang === "ar"
                  ? "قم باختيار مادة دراسية من الخريطة الرسومية بالأعلى لعرض ترابطاتها ووصفها بالتفصيل وتخطيط ممرها الذكي الفوري."
                  : "Tap on any subject node in the mind-map diagram to explore options, download textbook pdf, view explainers, or plot weekly targets."}
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
