import React from "react";

interface WebsiteLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function WebsiteLogo({ className = "", size = 32, showText = false }: WebsiteLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm hover:scale-105 transition-transform duration-300 active:scale-95 cursor-pointer"
      >
        <defs>
          {/* Rich metallic gold gradient */}
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E1" />
            <stop offset="30%" stopColor="#FFD54F" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA7C11" />
          </linearGradient>

          {/* Golden glow effect for the trend arrow */}
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Deep royal background for the circular seal */}
          <radialGradient id="seal-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2E1B15" />
            <stop offset="60%" stopColor="#1C0E0A" />
            <stop offset="100%" stopColor="#0B0503" />
          </radialGradient>

          {/* Sudan Flag Gradients & Colors */}
          <linearGradient id="sudan-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E53935" />
            <stop offset="100%" stopColor="#C62828" />
          </linearGradient>
          <linearGradient id="sudan-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>

        {/* Outer Circular Seal Frame */}
        <circle cx="50" cy="50" r="47" fill="url(#seal-bg)" />
        <circle cx="50" cy="50" r="45" stroke="url(#gold-grad)" strokeWidth="2.5" opacity="0.85" />
        <circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

        {/* Decorative inner circular gears/stars representing science & progress */}
        <g opacity="0.25" stroke="url(#gold-grad)" strokeWidth="0.5" fill="none">
          <circle cx="50" cy="50" r="36" />
          <path d="M 50 14 L 50 86 M 14 50 L 86 50 M 24.5 24.5 L 75.5 75.5 M 24.5 75.5 L 75.5 24.5" />
        </g>

        {/* The Open Book representing Knowledge */}
        {/* Book spine & gold backing outline */}
        <path
          d="M 50 71 Q 38 64 20 66 L 20 40 Q 38 38 50 45 Q 62 38 80 40 L 80 66 Q 62 64 50 71 Z"
          fill="#1C0E0A"
          stroke="url(#gold-grad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Book Pages with paper white-gold premium gradient overlay */}
        <path
          d="M 48.5 69.5 Q 38 63 21.5 64.5 L 21.5 41.5 Q 38 40 48.5 46.5 Z"
          fill="#FFFDF9"
          opacity="0.95"
        />
        <path
          d="M 51.5 69.5 Q 62 63 78.5 64.5 L 78.5 41.5 Q 62 40 51.5 46.5 Z"
          fill="#FFFDF9"
          opacity="0.95"
        />

        {/* Page lines inside book (Right and Left pages) */}
        <g stroke="#E5D9C4" strokeWidth="0.75" opacity="0.7">
          {/* Left page text lines */}
          <line x1="26" y1="47" x2="44" y2="49" />
          <line x1="26" y1="52" x2="44" y2="54" />
          <line x1="26" y1="57" x2="44" y2="59" />
          
          {/* Right page text lines */}
          <line x1="56" y1="49" x2="74" y2="47" />
          <line x1="56" y1="54" x2="74" y2="52" />
          <line x1="56" y1="59" x2="74" y2="57" />
        </g>

        {/* Sudanese Flag Badge on the Left Page */}
        <g transform="translate(25, 43.5) scale(0.6)" opacity="0.9">
          {/* Flag container rect */}
          <rect x="0" y="0" width="15" height="9" fill="#FFFFFF" rx="0.5" />
          {/* Red band */}
          <rect x="0" y="0" width="15" height="3" fill="url(#sudan-red)" />
          {/* Black band */}
          <rect x="0" y="6" width="15" height="3" fill="#000000" />
          {/* Green triangle */}
          <path d="M 0 0 L 5 4.5 L 0 9 Z" fill="url(#sudan-green)" />
          {/* Gold border */}
          <rect x="0" y="0" width="15" height="9" stroke="url(#gold-grad)" strokeWidth="0.5" fill="none" />
        </g>

        {/* Small gold geometric star (Sudan traditional design) on the Right Page */}
        <g transform="translate(64, 45) scale(0.4)" stroke="url(#gold-grad)" strokeWidth="1.5" fill="none">
          <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" />
          <polygon points="10,3 15,10 10,17 5,10" fill="url(#gold-grad)" opacity="0.5" />
        </g>

        {/* Rising Golden Trend Arrow (representing "نقلة" - Digital Leap / Progress) */}
        {/* Glow effect outline */}
        <path
          d="M 28 65 L 42 53 L 49 58 L 72 35"
          stroke="#FFD54F"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          filter="url(#gold-glow)"
        />

        {/* Main Golden Arrow Line */}
        <path
          d="M 28 65 L 42 53 L 49 58 L 70 37"
          stroke="url(#gold-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Golden Arrowhead */}
        <path
          d="M 64 36 L 73 34 L 71 43 Z"
          fill="url(#gold-grad)"
          stroke="url(#gold-grad)"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Tech Circuit Nodes (circles at arrow vertices) representing interactive technology */}
        <circle cx="28" cy="65" r="3" fill="#FFF8E1" stroke="url(#gold-grad)" strokeWidth="1" />
        <circle cx="42" cy="53" r="2.5" fill="#FFF8E1" stroke="url(#gold-grad)" strokeWidth="1" />
        <circle cx="49" cy="58" r="2.5" fill="#FFF8E1" stroke="url(#gold-grad)" strokeWidth="1" />
        <circle cx="71" cy="36" r="1.5" fill="#FFFFFF" />

        {/* Tech circuit connection lines */}
        <line x1="42" y1="53" x2="42" y2="47" stroke="url(#gold-grad)" strokeWidth="0.75" />
        <circle cx="42" cy="46" r="1" fill="url(#gold-grad)" />
        
        <line x1="49" y1="58" x2="53" y2="62" stroke="url(#gold-grad)" strokeWidth="0.75" />
        <circle cx="54" cy="63" r="1" fill="url(#gold-grad)" />

        {/* Subtle decorative scroll or shine ribbon at the very bottom */}
        <path
          d="M 30 84 Q 50 89 70 84"
          stroke="url(#gold-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        
        <circle cx="50" cy="86.5" r="1" fill="url(#gold-grad)" opacity="0.8" />
      </svg>
      {showText && (
        <span className="font-sans font-black text-xs tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
          نقلة للمناهج الإلكترونية
        </span>
      )}
    </div>
  );
}
