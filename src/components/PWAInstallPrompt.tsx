import React, { useState, useEffect } from "react";
import { ArrowDown, X, Share2, PlusSquare, Smartphone, Download, Check } from "lucide-react";
import WebsiteLogo from "./WebsiteLogo";

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as standalone (installed)
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes("android-app://");
    
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event for Android / Chrome / PC
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if the user hasn't explicitly dismissed it in this session
      const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed");
      if (!isDismissed && !isStandaloneMode) {
        // Delay slightly for better UX
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also detect if iOS user can install
    if (isIOSDevice && !isStandaloneMode) {
      const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed");
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }

    // Listen to successful installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Confetti or visual feedback can be triggered here
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone, isIOS]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native browser installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === "accepted") {
      setInstalled(true);
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Suppress prompt for the current session to avoid annoying the user
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  // If already installed or shouldn't show, render nothing
  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 flex justify-center items-end md:items-center md:inset-0 md:bg-black/40 md:backdrop-blur-sm transition-all duration-300 animate-fade-in animate-in">
      {/* Container Card */}
      <div 
        id="pwa-prompt-card"
        className="w-full max-w-md bg-[#F7F3EB] border-2 border-[#E5C185] rounded-3xl shadow-2xl overflow-hidden relative dir-rtl text-right transform transition-all duration-300 scale-100"
      >
        {/* Background Decorative patterns */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#A35130]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 left-4 p-2 rounded-full bg-[#3D2314]/10 hover:bg-[#3D2314]/20 transition-colors text-[#3D2314] hover:scale-105 active:scale-95"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo & Title */}
        <div className="p-6 pb-4 border-b border-[#E5C185]/40 flex items-start gap-4">
          <div className="p-1 bg-[#3D2314] rounded-2xl shadow-inner shrink-0 border border-[#E5C185]">
            {/* Small Premium Golden Logo */}
            <svg viewBox="0 0 500 500" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="prompt-gold-metallic" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9B6F1A" />
                  <stop offset="20%" stopColor="#D4AF37" />
                  <stop offset="45%" stopColor="#F3D993" />
                  <stop offset="55%" stopColor="#FFF8E1" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#845D10" />
                </linearGradient>
              </defs>
              <path d="M 250,225 L 250,295" stroke="url(#prompt-gold-metallic)" strokeWidth="16" strokeLinecap="round" />
              <path d="M 250,290 C 210,274 150,274 110,300 C 150,308 210,308 250,293" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="12" strokeLinejoin="round" />
              <path d="M 250,290 C 290,274 350,274 390,300 C 350,308 290,308 250,293" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="12" strokeLinejoin="round" />
              <path d="M 250,285 C 210,268 150,268 112,295 L 125,215 C 160,192 215,192 250,208 Z" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="14" strokeLinejoin="round" />
              <path d="M 250,285 C 290,268 350,268 388,295 L 375,215 C 340,192 285,192 250,208 Z" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="14" strokeLinejoin="round" />
              <path d="M 250,225 L 250,150" stroke="url(#prompt-gold-metallic)" strokeWidth="16" strokeLinecap="round" />
              <path d="M 250,210 C 225,200 215,180 230,170 C 245,160 250,190 250,210 Z" fill="url(#prompt-gold-metallic)" />
              <path d="M 250,175 C 220,165 210,140 228,132 C 246,124 250,155 250,175 Z" fill="url(#gold-metallic)" />
              <path d="M 250,140 C 240,120 240,95 250,90 C 260,95 260,120 250,140 Z" fill="url(#prompt-gold-metallic)" />
              <path d="M 200,212 L 300,212" stroke="url(#prompt-gold-metallic)" strokeWidth="11" strokeLinecap="round" />
              <path d="M 210,212 L 235,185 L 265,195 L 302,145 L 302,175" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M 275,212 L 275,175" stroke="url(#prompt-gold-metallic)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 290,212 L 290,150" stroke="url(#prompt-gold-metallic)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 315,212 L 315,130" stroke="url(#prompt-gold-metallic)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 250,205 L 300,140 L 335,95" fill="none" stroke="url(#prompt-gold-metallic)" strokeWidth="18" strokeLinecap="round" />
              <path d="M 310,93 L 340,90 L 337,120 Z" fill="url(#prompt-gold-metallic)" stroke="url(#prompt-gold-metallic)" strokeWidth="5" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold bg-[#A35130]/10 text-[#A35130] rounded-full border border-[#A35130]/20">
              تطبيق تفاعلي ذكي 🇸🇩
            </span>
            <h3 className="text-lg font-black text-[#3D2314] leading-tight font-sans">
              تثبيت منصة نقلة التعليمية
            </h3>
            <p className="text-xs text-[#A35130] font-semibold mt-0.5">
              للمناهج السودانية الموحدة
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 py-4 space-y-4">
          <p className="text-sm text-[#5C2C16] font-medium leading-relaxed">
            ثبّت منصة <span className="font-extrabold text-[#A35130]">نقلة</span> على شاشة جوالك الرئيسية لتصفح أسرع، استهلاك أقل للبيانات، ومتابعة الدروس والاختبارات التفاعلية كـ تطبيق ذكي متكامل في أي وقت!
          </p>

          {/* Dynamic OS Guide */}
          {isIOS ? (
            /* iOS Specific Instructions */
            <div className="bg-amber-50 border border-[#E5C185] rounded-2xl p-4 space-y-3 shadow-inner">
              <span className="text-xs font-bold text-[#A35130] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> تعليمات التثبيت لأجهزة الآيفون (iOS):
              </span>
              <ol className="text-xs text-[#5C2C16] space-y-2.5 font-semibold list-decimal pr-4">
                <li>
                  اضغط على زر المشاركة <span className="inline-flex items-center align-middle justify-center p-1 bg-white border border-slate-200 rounded-lg mx-1 text-blue-500"><Share2 className="w-3.5 h-3.5" /></span> في أسفل المتصفح (Safari).
                </li>
                <li>
                  اسحب القائمة للأعلى ثم اختر <span className="font-extrabold text-[#3D2314]">"إضافة إلى الشاشة الرئيسية"</span> (Add to Home Screen) <span className="inline-flex items-center align-middle justify-center p-1 bg-white border border-slate-200 rounded-lg mx-1"><PlusSquare className="w-3.5 h-3.5 text-slate-800" /></span>.
                </li>
                <li>
                  اضغط على <span className="font-extrabold text-[#A35130]">"إضافة"</span> (Add) في الزاوية العلوية لتأكيد التثبيت.
                </li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome Specific / Standard PWA */
            <div className="bg-amber-50 border border-[#E5C185] rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-[#A35130]/10 flex items-center justify-center text-[#A35130] shrink-0 border border-[#A35130]/20 animate-bounce">
                <Download className="w-4 h-4" />
              </div>
              <p className="text-xs text-[#5C2C16] font-semibold leading-relaxed">
                متوافق تماماً مع جهازك. اضغط على زر التثبيت أدناه للحصول على التطبيق فوراً وبكبسة واحدة.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 pb-6 flex gap-3">
          <button 
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl border border-[#E5C185] text-xs font-bold text-[#5C2C16] hover:bg-[#3D2314]/5 transition-colors active:scale-95 duration-200"
          >
            لاحقاً
          </button>
          
          {!isIOS ? (
            <button 
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className={`flex-[2] py-3 px-4 rounded-xl shadow-md font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 ${
                deferredPrompt 
                  ? "bg-[#A35130] text-white hover:bg-[#8D4426] border border-[#A35130]" 
                  : "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              تثبيت التطبيق الآن
            </button>
          ) : (
            <button 
              onClick={handleDismiss}
              className="flex-[2] py-3 px-4 rounded-xl shadow-md font-bold text-xs bg-[#A35130] text-white hover:bg-[#8D4426] border border-[#A35130] flex items-center justify-center gap-2 transition-all active:scale-95 duration-200"
            >
              <Check className="w-4 h-4" />
              فهمت التعليمات
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
