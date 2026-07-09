import React from "react";

interface WebsiteLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function WebsiteLogo({ className = "", size = 44, showText = false }: WebsiteLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md hover:scale-105 transition-transform duration-300 active:scale-95 cursor-pointer"
      >
        <defs>
          {/* Premium Metallic Gold Gradient */}
          <linearGradient id="comp-gold-metallic" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9B6F1A" />
            <stop offset="20%" stopColor="#D4AF37" />
            <stop offset="45%" stopColor="#F3D993" />
            <stop offset="55%" stopColor="#FFF8E1" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#845D10" />
          </linearGradient>

          {/* Subtle Shadow Filter */}
          <filter id="comp-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#comp-shadow)">
          {/* 📖 THE GOLDEN OPEN BOOK (Bottom Section) */}
          <path d="M 250,225 L 250,295" stroke="url(#comp-gold-metallic)" strokeWidth="4.5" strokeLinecap="round" />
          
          {/* Book Outer Cover / Bottom Rim */}
          <path d="M 250,290 C 210,274 150,274 110,300 C 150,308 210,308 250,293" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 250,290 C 290,274 350,274 390,300 C 350,308 290,308 250,293" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="3" strokeLinejoin="round" />

          {/* Left Page Layer 1 */}
          <path d="M 250,285 C 210,268 150,268 112,295 L 125,215 C 160,192 215,192 250,208 Z" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="3.5" strokeLinejoin="round" />
          {/* Left Page Layer 2 */}
          <path d="M 250,288 C 213,272 160,272 122,297 L 133,222 C 168,200 218,200 250,214" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
          {/* Left Page Layer 3 */}
          <path d="M 250,291 C 216,276 170,276 132,299 L 141,229 C 176,208 221,208 250,220" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />

          {/* Right Page Layer 1 */}
          <path d="M 250,285 C 290,268 350,268 388,295 L 375,215 C 340,192 285,192 250,208 Z" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="3.5" strokeLinejoin="round" />
          {/* Right Page Layer 2 */}
          <path d="M 250,288 C 287,272 340,272 378,297 L 367,222 C 332,200 282,200 250,214" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
          {/* Right Page Layer 3 */}
          <path d="M 250,291 C 284,276 330,276 368,299 L 359,229 C 324,208 279,208 250,220" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />

          {/* 📈 THE GROWTH CHART & LEAF SPROUT (Center) */}
          <path d="M 250,225 L 250,150" stroke="url(#comp-gold-metallic)" strokeWidth="4" strokeLinecap="round" />

          {/* Left Sprout Leaves */}
          <path d="M 250,210 C 225,200 215,180 230,170 C 245,160 250,190 250,210 Z" fill="url(#comp-gold-metallic)" opacity="0.9" />
          <path d="M 250,175 C 220,165 210,140 228,132 C 246,124 250,155 250,175 Z" fill="url(#comp-gold-metallic)" />
          <path d="M 250,140 C 240,120 240,95 250,90 C 260,95 260,120 250,140 Z" fill="url(#comp-gold-metallic)" />

          {/* Growth Bar-Chart/Geometric Lines */}
          <path d="M 200,212 L 300,212" stroke="url(#comp-gold-metallic)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 210,212 L 235,185 L 265,195 L 302,145 L 302,175" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 275,212 L 275,175" stroke="url(#comp-gold-metallic)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 290,212 L 290,150" stroke="url(#comp-gold-metallic)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 315,212 L 315,130" stroke="url(#comp-gold-metallic)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Bold Upward Trend Arrow */}
          <path d="M 250,205 L 300,140 L 335,95" fill="none" stroke="url(#comp-gold-metallic)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 310,93 L 340,90 L 337,120 Z" fill="url(#comp-gold-metallic)" stroke="url(#comp-gold-metallic)" strokeWidth="1.5" strokeLinejoin="round" />
        </g>

        {/* 🔠 NAQLA TYPOGRAPHY */}
        <g id="naqla-text" transform="translate(145, 345)" filter="url(#comp-shadow)">
          {/* N */}
          <path d="M 5,35 L 5,5 M 5,5 L 28,35 M 28,35 L 28,5" stroke="#1C0E0A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="5" cy="5" r="3.5" fill="url(#comp-gold-metallic)" />
          <circle cx="28" cy="35" r="3.5" fill="url(#comp-gold-metallic)" />
          
          {/* A */}
          <path d="M 38,35 L 50,5 L 62,35 M 43,23 L 57,23" stroke="#1C0E0A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* Q */}
          <path d="M 83,20 C 83,29 76,36 67,36 C 58,36 51,29 51,20 C 51,11 58,4 67,4 C 76,4 83,11 83,20 Z M 77,30 L 89,42" stroke="#1C0E0A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* L */}
          <path d="M 97,5 L 97,35 L 117,35" stroke="#1C0E0A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* A */}
          <path d="M 125,35 L 137,5 L 149,35 M 130,23 L 144,23" stroke="#1C0E0A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* 🇸🇩 ARABIC SUBTITLE */}
        <text
          x="250"
          y="422"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="16"
          fontWeight="900"
          fill="#5C2C16"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          منصة المناهج الإلكترونية التفاعلية
        </text>
      </svg>
      {showText && (
        <span className="font-sans font-black text-sm tracking-wide bg-gradient-to-r from-amber-600 via-amber-800 to-amber-950 bg-clip-text text-transparent">
          نقلة للمناهج الإلكترونية
        </span>
      )}
    </div>
  );
}
