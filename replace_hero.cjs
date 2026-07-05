const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');

const targetStartText = '{siteTheme === "legacy" && (';
const targetEndText = '{/* 🎥 Live Lessons Widget for Students */}';

const startIndex = content.indexOf(targetStartText);
const endIndex = content.indexOf(targetEndText);

if (startIndex === -1) {
  console.error("Could not find start index!");
  process.exit(1);
}
if (endIndex === -1) {
  console.error("Could not find end index!");
  process.exit(1);
}

console.log("Start Index:", startIndex, "End Index:", endIndex);

// We want to replace everything from the start of the line containing targetStartText
// to the start of the line containing targetEndText
const lineStart = content.lastIndexOf('\n', startIndex) + 1;
const lineEnd = content.lastIndexOf('\n', endIndex) + 1;

console.log("Line Start Index:", lineStart, "Line End Index:", lineEnd);

const cleanReplacement = `          {siteTheme === "legacy" && (
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
                <div className={\`w-full md:w-auto grid gap-4 flex-shrink-0 \${
                  isAdminLoggedIn || showHiddenAdminGate 
                    ? "grid-cols-2 md:grid-cols-4" 
                    : "grid-cols-2 md:grid-cols-3"
                }\`}>
                  <div 
                    onClick={() => {
                      setShowOnlyFavorites(prev => !prev);
                      setShowStudyCamp(false);
                      setShowEducationalMindMap(false);
                      setShowStudentChat(false);
                      setShowAdminDashboard(false);
                    }}
                    className={\`p-4 border rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 select-none \${
                      showOnlyFavorites 
                        ? "bg-amber-955/20 border-yellow-500/80 ring-2 ring-yellow-500/30 text-amber-400 hover:bg-amber-955/40 shadow-yellow-955/40" 
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-yellow-500/40"
                    }\`}
                  >
                    <Star className={\`w-5 h-5 mx-auto transition-all \${showOnlyFavorites ? "text-yellow-400 fill-yellow-400 scale-110" : "text-yellow-400"}\`} />
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
                    className="p-4 bg-gradient-to-br from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 rounded-2xl text-center space-y-1 min-w-[140px] shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between min-h-[110px] select-none group"
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
               <div className="bg-[#FDFBF7] border border-mud/15 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-inner">
                  
                  {/* Backdrop styling depending on theme */}
                  {siteTheme === "heritage" ? (
                     <div className="absolute inset-0 bg-[#FFFDF9] opacity-40 mix-blend-multiply pointer-events-none" />
                  ) : (
                     <div className="absolute inset-0 bg-gradient-to-tr from-cream via-white to-cream opacity-50 mix-blend-multiply pointer-events-none" />
                  )}

                  {/* Left side: welcome content and counters */}
                  <div className="space-y-4 max-w-2xl text-center md:text-right relative z-10">
                     <h2 className="text-sm sm:text-2xl md:text-3xl font-black text-mud leading-snug">
                        {currentLang === "ar" ? "أهلاً بك في البوابة التعليمية التفاعلية الموحدة" : "Interactive Gateway to Sudanese Unified Curricula"}
                     </h2>
                     <p className="text-[10px] sm:text-xs text-mud/85 leading-relaxed max-w-lg font-sans">
                        {currentLang === "ar" 
                          ? "نهدف لتوفير وصول دائم ومجاني لجميع المناهج الدراسية، الكتب، المذكرات التلخيصية، الشروحات التفاعلية، ومعامل الذكاء الاصطناعي المساندة للتعليم في السودان." 
                          : "Dedicated to providing free interactive school books, summaries, simulations, and virtual assistance for teachers and students."}
                     </p>

                     {/* Beautiful Traditional Sudanese Heritage Stats/Favorites/Admin Counters */}
                     <div className="flex flex-wrap gap-1.5 sm:gap-2.5 pt-1 sm:pt-2 font-sans">
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
                           className={\`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs \${
                              showOnlyFavorites 
                                ? "bg-[#D4AF37] text-white border-[#D4AF37] ring-4 ring-[#D4AF37]/20" 
                                : "bg-white hover:bg-cream border-mud/15 text-mud"
                           }\`}
                        >
                           <Star className={\`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 \${showOnlyFavorites ? "fill-white text-white" : "text-amber-500 fill-[#D4AF37]"}\`} />
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
                              className={\`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs \${
                                 showParentPortal 
                                   ? "bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-600/20" 
                                   : "bg-white hover:bg-cream border-mud/15 text-mud"
                              }\`}
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
                             className={\`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-[10px] sm:text-2xs font-bold transition-all duration-300 cursor-pointer select-none shadow-xs \${
                                showAdminDashboard 
                                  ? "bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-700/20" 
                                  : "bg-white hover:bg-cream border-mud/15 text-mud"
                             }\`}
                          >
                             <Lock className={\`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 \${showAdminDashboard ? "text-white" : "text-mud/60"}\`} />
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
                       className="w-28 h-36 sm:w-32 sm:h-44 shrink-0 bg-gradient-to-b from-[#3D1E12] via-[#2B140B] to-[#1E0D06] border-2 border-amber-500/40 hover:border-amber-400 p-2.5 flex flex-col justify-between rounded-2xl shadow-xl relative cursor-pointer hover:shadow-amber-500/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] overflow-hidden select-none group"
                     >
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
\n`;

const beforeContent = content.substring(0, lineStart);
const afterContent = content.substring(lineEnd);

fs.writeFileSync('./src/App.tsx', beforeContent + cleanReplacement + afterContent, 'utf8');
console.log("Successfully replaced the entire broken section!");
