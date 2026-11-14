"use client";

import React from "react";

export default function SubwayCityBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Sky Gradient: Twilight to Golden Hour Horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #1B2447 0%, #233568 38%, #2E4A85 62%, #B55A4E 82%, #FF9A5A 96%, #FFB67A 100%)",
        }}
      />

      {/* Stylized City Skyline Silhouette (Architecture only, no human figures) */}
      <svg
        className="absolute bottom-28 sm:bottom-36 left-0 right-0 w-full h-44 sm:h-64 opacity-80"
        preserveAspectRatio="none"
        viewBox="0 0 1200 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Distant Layer (Deep Indigo) */}
        <path
          d="M0 320V190H45V140H90V190H140V110H185V190H230V160H290V190H340V80H390V190H460V130H520V190H580V100H630V190H700V150H760V190H820V90H870V190H940V130H1000V190H1070V110H1120V190H1200V320H0Z"
          fill="#1A2244"
          opacity="0.85"
        />

        {/* Glowing skyscraper window grids (Transit Hub / Rail Towers) */}
        <rect x="150" y="125" width="6" height="8" rx="1" fill="#FFE875" opacity="0.7" />
        <rect x="165" y="125" width="6" height="8" rx="1" fill="#FFE875" opacity="0.6" />
        <rect x="150" y="145" width="6" height="8" rx="1" fill="#FFE875" opacity="0.5" />
        <rect x="165" y="145" width="6" height="8" rx="1" fill="#FFE875" opacity="0.8" />
        <rect x="355" y="95" width="8" height="10" rx="1" fill="#29D8FF" opacity="0.75" />
        <rect x="370" y="95" width="8" height="10" rx="1" fill="#29D8FF" opacity="0.6" />
        <rect x="355" y="115" width="8" height="10" rx="1" fill="#FFE875" opacity="0.7" />
        <rect x="370" y="115" width="8" height="10" rx="1" fill="#FFE875" opacity="0.8" />
        <rect x="595" y="115" width="7" height="9" rx="1" fill="#FFE875" opacity="0.6" />
        <rect x="610" y="115" width="7" height="9" rx="1" fill="#FFE875" opacity="0.7" />
        <rect x="835" y="105" width="8" height="10" rx="1" fill="#29D8FF" opacity="0.7" />
        <rect x="850" y="105" width="8" height="10" rx="1" fill="#FFE875" opacity="0.7" />

        {/* Radio antenna beacon lights */}
        <line x1="365" y1="80" x2="365" y2="45" stroke="#111629" strokeWidth="3" />
        <circle cx="365" cy="45" r="4" fill="#FF4757" className="signal-amber" />
        <line x1="845" y1="90" x2="845" y2="55" stroke="#111629" strokeWidth="3" />
        <circle cx="845" cy="55" r="4" fill="#FF4757" className="signal-amber" />

        {/* Midground Rail Viaduct & Elevated Metro Car Silhouette */}
        <rect x="0" y="240" width="1200" height="24" fill="#141C35" />
        <rect x="120" y="264" width="22" height="56" fill="#141C35" />
        <rect x="340" y="264" width="22" height="56" fill="#141C35" />
        <rect x="560" y="264" width="22" height="56" fill="#141C35" />
        <rect x="780" y="264" width="22" height="56" fill="#141C35" />
        <rect x="1000" y="264" width="22" height="56" fill="#141C35" />

        {/* Elevated Metro Car (Train silhouette only, empty windows) */}
        <rect x="420" y="222" width="160" height="18" rx="3" fill="#1C274A" stroke="#111629" strokeWidth="2" />
        <rect x="430" y="226" width="16" height="8" rx="1" fill="#FFE875" opacity="0.7" />
        <rect x="455" y="226" width="24" height="8" rx="1" fill="#FFE875" opacity="0.6" />
        <rect x="490" y="226" width="24" height="8" rx="1" fill="#FFE875" opacity="0.7" />
        <rect x="525" y="226" width="24" height="8" rx="1" fill="#FFE875" opacity="0.5" />
        <rect x="560" y="226" width="14" height="8" rx="1" fill="#FFE875" opacity="0.8" />
        <circle cx="580" cy="226" r="3" fill="#FF4757" opacity="0.9" />
      </svg>

      {/* Overhead Catenary Power Lines & Gantry Trusses */}
      <svg
        className="absolute top-0 left-0 right-0 w-full h-48 sm:h-64 opacity-50"
        preserveAspectRatio="none"
        viewBox="0 0 1200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sagging overhead power cables */}
        <path d="M0 40 Q300 95 600 45 Q900 95 1200 40" stroke="#0E1424" strokeWidth="3" fill="none" />
        <path d="M0 60 Q300 115 600 65 Q900 115 1200 60" stroke="#0E1424" strokeWidth="2" fill="none" />
        <path d="M0 90 Q300 145 600 95 Q900 145 1200 90" stroke="#0E1424" strokeWidth="1.5" fill="none" />

        {/* Steel Catenary Pylons */}
        <g stroke="#111629" strokeWidth="4">
          <line x1="180" y1="0" x2="180" y2="200" />
          <line x1="165" y1="35" x2="195" y2="35" />
          <line x1="165" y1="65" x2="195" y2="65" />
          <line x1="1020" y1="0" x2="1020" y2="200" />
          <line x1="1005" y1="35" x2="1035" y2="35" />
          <line x1="1005" y1="65" x2="1035" y2="65" />
        </g>
      </svg>

      {/* Perspective Rail Tracks Converging Toward Horizon */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-52 bg-[#0C1222] border-t-4 border-[#111629]">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ballast Stone Ground */}
          <rect width="1000" height="200" fill="#0C1222" />

          {/* Wooden Rail Ties with perspective spacing */}
          {Array.from({ length: 14 }).map((_, i) => {
            const y = 20 + i * 13 + Math.pow(i, 1.35) * 2;
            const leftX = 400 - i * 28;
            const rightX = 600 + i * 28;
            const width = rightX - leftX;
            const height = 4 + i * 0.7;
            return (
              <rect
                key={i}
                x={leftX}
                y={y}
                width={width}
                height={height}
                fill="#18233C"
                stroke="#111629"
                strokeWidth="1.5"
                rx="1.5"
              />
            );
          })}

          {/* Steel Rails converging to center vanishing point (500, 10) */}
          {/* Main Track Left Rail */}
          <line x1="500" y1="15" x2="80" y2="200" stroke="#4B638C" strokeWidth="6" />
          <line x1="500" y1="15" x2="80" y2="200" stroke="#7E9AC7" strokeWidth="2" />

          {/* Main Track Right Rail */}
          <line x1="500" y1="15" x2="920" y2="200" stroke="#4B638C" strokeWidth="6" />
          <line x1="500" y1="15" x2="920" y2="200" stroke="#7E9AC7" strokeWidth="2" />

          {/* Secondary Track Rail Left */}
          <line x1="495" y1="15" x2="280" y2="200" stroke="#3D5073" strokeWidth="4" />
          {/* Secondary Track Rail Right */}
          <line x1="505" y1="15" x2="720" y2="200" stroke="#3D5073" strokeWidth="4" />

          {/* Track Signal Gantry Left */}
          <g transform="translate(140, 40)">
            <rect x="0" y="0" width="14" height="120" fill="#111629" rx="2" />
            <rect x="-10" y="8" width="34" height="42" fill="#1C274A" stroke="#111629" strokeWidth="3" rx="6" />
            <circle cx="7" cy="20" r="5" fill="#16D466" className="signal-green" />
            <circle cx="7" cy="38" r="5" fill="#FFD21F" className="signal-amber" />
          </g>

          {/* Track Signal Gantry Right */}
          <g transform="translate(840, 30)">
            <rect x="0" y="0" width="14" height="130" fill="#111629" rx="2" />
            <rect x="-10" y="8" width="34" height="42" fill="#1C274A" stroke="#111629" strokeWidth="3" rx="6" />
            <circle cx="7" cy="20" r="5" fill="#16D466" className="signal-green" />
            <circle cx="7" cy="38" r="5" fill="#FF4757" className="signal-amber" />
          </g>
        </svg>

        {/* Hazard Stripe Platform Edge Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-3 hazard-stripes border-t-2 border-[#111629]" />
      </div>
    </div>
  );
}
