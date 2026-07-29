"use client";

import React from "react";

interface PixelArtLogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export function PixelArtLogo({
  variant = "full",
  size = "md",
  className = "",
  showSubtitle = false,
}: PixelArtLogoProps) {
  const sizeMap = {
    sm: {
      icon: "w-7 h-7",
      textSize: "text-lg",
      dotSize: "w-2 h-2 -top-1",
      subtitle: "text-[9px]",
    },
    md: {
      icon: "w-9 h-9",
      textSize: "text-2xl",
      dotSize: "w-2.5 h-2.5 -top-1.5",
      subtitle: "text-[10px]",
    },
    lg: {
      icon: "w-11 h-11",
      textSize: "text-3xl",
      dotSize: "w-3 h-3 -top-2",
      subtitle: "text-[11px]",
    },
    xl: {
      icon: "w-14 h-14",
      textSize: "text-4xl md:text-5xl",
      dotSize: "w-3.5 h-3.5 -top-2.5 md:w-4 md:h-4 md:-top-3",
      subtitle: "text-xs",
    },
  }[size];

  const logoMark = (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800/90 p-1.5 shadow-lg shadow-emerald-950/30 group hover:border-[#65D22A]/40 transition-all ${sizeMap.icon}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform group-hover:scale-105 transition-transform"
      >
        {/* Dark Slate Pixel Grid Elements */}
        <rect x="18" y="18" width="26" height="26" rx="5" fill="#ffffff" />
        <rect x="48" y="18" width="26" height="26" rx="5" fill="#ffffff" />
        <rect x="18" y="48" width="26" height="26" rx="5" fill="#ffffff" />
        <rect x="18" y="78" width="26" height="26" rx="5" fill="#ffffff" />
        
        {/* Signature Vibrant Lime Green Pixel Blocks */}
        <rect x="78" y="18" width="22" height="22" rx="4" fill="#65D22A" />
        <rect x="48" y="48" width="26" height="26" rx="5" fill="#65D22A" />
        <rect x="78" y="78" width="22" height="22" rx="4" fill="#65D22A" />
      </svg>
    </div>
  );

  if (variant === "icon") {
    return logoMark;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {variant === "full" && logoMark}

      <div className="flex flex-col justify-center">
        <div className={`font-black tracking-tight flex items-baseline leading-none ${sizeMap.textSize}`}>
          {/* 'p' */}
          <span className="text-white font-extrabold">p</span>

          {/* 'i' with Signature Lime Green Pixel Square Dot */}
          <span className="relative inline-flex flex-col items-center mx-[0.5px]">
            {/* The Green Pixel Dot directly above 'i' */}
            <span
              className={`absolute bg-[#65D22A] rounded-[2px] shadow-[0_0_8px_#65D22A] ${sizeMap.dotSize}`}
            />
            <span className="text-white font-extrabold leading-none mt-[0.1em]">ı</span>
          </span>

          {/* 'xel' */}
          <span className="text-white font-extrabold">xel</span>

          {/* 'art' in Lime Green */}
          <span className="text-[#65D22A] font-extrabold ml-[1px] drop-shadow-[0_0_12px_rgba(101,210,42,0.3)]">
            art
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`text-[#65D22A] font-semibold tracking-wider uppercase mt-1 opacity-90 ${sizeMap.subtitle}`}
          >
            Finans & Yönetim
          </span>
        )}
      </div>
    </div>
  );
}
