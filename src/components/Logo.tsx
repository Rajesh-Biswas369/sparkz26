import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={`w-full max-w-md mx-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lightbulb outline */}
      <path
        d="M200 40 C160 40 130 75 130 115 C130 140 145 160 160 175 L160 200 C160 210 168 220 180 220 L220 220 C232 220 240 210 240 200 L240 175 C255 160 270 140 270 115 C270 75 240 40 200 40 Z"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Lightbulb base rings */}
      <line x1="165" y1="210" x2="235" y2="210" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M175 230 Q200 245 225 230" stroke="white" strokeWidth="6" strokeLinecap="round" />
      
      {/* Light rays */}
      <line x1="200" y1="10" x2="200" y2="25" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
      <line x1="280" y1="40" x2="265" y2="55" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <line x1="120" y1="40" x2="135" y2="55" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <line x1="300" y1="90" x2="280" y2="90" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
      <line x1="100" y1="90" x2="120" y2="90" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />

      {/* Lightning Bolt inside bulb */}
      <path d="M205 70 L185 110 L205 110 L195 150 L225 100 L200 100 Z" fill="#facc15" />
      <path d="M185 130 Q195 145 200 160 Q205 145 215 130" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Circuit lines left */}
      <path d="M40 160 L60 160 L70 150 L110 150 L120 160 L140 160" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="160" r="4" fill="#facc15" />
      
      {/* Circuit lines right */}
      <path d="M360 140 L340 140 L330 150 L290 150 L280 140 L260 140" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="360" cy="140" r="4" fill="#facc15" />

      <path d="M40 210 L50 220 L100 220 L110 230" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="210" r="4" fill="#facc15" />
      
      <path d="M360 210 L350 220 L300 220 L290 230" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="360" cy="210" r="4" fill="#facc15" />

      {/* SPARKZ Text */}
      <text x="50" y="195" fill="white" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="56" letterSpacing="2">
        SP<tspan fill="#facc15">A</tspan>RKZ
      </text>

      {/* 2026 Text */}
      <text x="240" y="225" fill="white" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="32">
        202<tspan fill="#facc15">6</tspan>
      </text>

      {/* Heartbeat Line */}
      <path d="M40 250 L120 250 L130 265 L150 235 L170 280 L190 250 L360 250" stroke="#facc15" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="250" r="4" fill="#facc15" />
      <circle cx="360" cy="250" r="4" fill="#facc15" />

      {/* Jadavpur University Text */}
      <text x="200" y="295" fill="#facc15" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" letterSpacing="4" textAnchor="middle">
        JADAVPUR UNIVERSITY
      </text>
    </svg>
  );
}
