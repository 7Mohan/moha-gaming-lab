"use client";

import * as React from "react";
import Image from "next/image";

interface GameSlide {
  id: string;
  name: string;
  tag: string;
  image: string;
  accentColor: string;
  accentGlow: string;
  fps: string;
  ping: string;
}

const SLIDES: GameSlide[] = [
  {
    id: "pubg",
    name: "PUBG Mobile",
    tag: "Battle Royale",
    image: "/images/hero/pubg.jpg",
    accentColor: "#F59E0B",
    accentGlow: "rgba(245, 158, 11, 0.4)",
    fps: "90 FPS",
    ping: "18ms",
  },
  {
    id: "efootball",
    name: "eFootball 2024",
    tag: "Sports Simulation",
    image: "/images/hero/efootball.jpg",
    accentColor: "#00E5A0",
    accentGlow: "rgba(0, 229, 160, 0.4)",
    fps: "60 FPS",
    ping: "22ms",
  },
  {
    id: "codm",
    name: "Call of Duty: Mobile",
    tag: "Tactical FPS",
    image: "/images/hero/codm.jpg",
    accentColor: "#EF4444",
    accentGlow: "rgba(239, 68, 68, 0.4)",
    fps: "120 FPS",
    ping: "14ms",
  },
  {
    id: "freefire",
    name: "Garena Free Fire",
    tag: "Fast Battle Royale",
    image: "/images/hero/freefire.jpg",
    accentColor: "#F97316",
    accentGlow: "rgba(249, 115, 22, 0.4)",
    fps: "60 FPS",
    ping: "25ms",
  },
  {
    id: "ml",
    name: "Mobile Legends: Bang Bang",
    tag: "5v5 MOBA",
    image: "/images/hero/mobilelegends.jpg",
    accentColor: "#A855F7",
    accentGlow: "rgba(168, 85, 247, 0.4)",
    fps: "60 FPS",
    ping: "28ms",
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    tag: "Open-World RPG",
    image: "/images/hero/genshin.jpg",
    accentColor: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.4)",
    fps: "60 FPS",
    ping: "38ms",
  },
];

export function HeroGameSlider() {
  const [cur, setCur] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const nextSlide = React.useCallback(() => {
    setCur((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = React.useCallback(() => {
    setCur((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  React.useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const activeSlide = SLIDES[cur] ?? SLIDES[0]!;

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none pointer-events-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured mobile games slider"
    >
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1.08) translate(0, 0); }
          50% { transform: scale(1.03) translate(-1%, -1%); }
          100% { transform: scale(1.0) translate(0, 0); }
        }
        .slide-image-active {
          animation: kenBurns 5.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        .scanline-pulse {
          animation: scanlineMove 6s linear infinite;
        }
      `}</style>

      {/* Background Images with smooth Cross-Fade & Ken Burns motion */}
      {SLIDES.map((slide, idx) => {
        const isActive = idx === cur;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className={`relative w-full h-full ${isActive ? "slide-image-active" : ""}`}>
              <Image
                src={slide.image}
                alt={slide.name}
                fill
                priority={idx === 0 || idx === 1}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        );
      })}

      {/* Layer 1: Dark Vignette Gradient Overlay so text is 100% readable */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,11,16,0.92) 0%, rgba(8,11,16,0.78) 45%, rgba(8,11,16,0.65) 75%, rgba(8,11,16,0.88) 100%)",
        }}
      />

      {/* Layer 2: Dynamic Accent Glow from the active game */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 85% 25%, ${activeSlide.accentGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Layer 3: Tech Grid and Sweep Scanline */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="scanline-pulse absolute left-0 right-0 h-[2px] z-[3] pointer-events-none opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${activeSlide.accentColor} 50%, transparent 100%)`,
        }}
      />

      {/* Layer 4: Tactical HUD Corner Accents */}
      <div
        className="absolute top-3 left-3 w-4 h-4 z-[4] pointer-events-none transition-colors duration-500 border-t-2 border-l-2"
        style={{ borderColor: activeSlide.accentColor }}
      />
      <div
        className="absolute top-3 right-3 w-4 h-4 z-[4] pointer-events-none transition-colors duration-500 border-t-2 border-r-2"
        style={{ borderColor: activeSlide.accentColor }}
      />
      <div
        className="absolute bottom-3 left-3 w-4 h-4 z-[4] pointer-events-none transition-colors duration-500 border-b-2 border-l-2"
        style={{ borderColor: activeSlide.accentColor }}
      />
      <div
        className="absolute bottom-3 right-3 w-4 h-4 z-[4] pointer-events-none transition-colors duration-500 border-b-2 border-r-2"
        style={{ borderColor: activeSlide.accentColor }}
      />

      {/* Bottom Metadata Bar & Interactive Controls */}
      <div className="absolute bottom-3 left-4 right-4 z-[5] flex items-center justify-between gap-3 pointer-events-auto">
        {/* Active Game Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs shadow-lg">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeSlide.accentColor }}
          />
          <span className="font-semibold text-white tracking-wide">{activeSlide.name}</span>
          <span className="text-white/40">·</span>
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded uppercase"
            style={{
              color: activeSlide.accentColor,
              backgroundColor: `${activeSlide.accentColor}22`,
            }}
          >
            {activeSlide.fps}
          </span>
          <span className="font-mono text-[11px] text-white/60 hidden sm:inline">
            {activeSlide.ping}
          </span>
        </div>

        {/* Navigation Controls: Arrows & Indicators */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous game slide"
            className="w-6 h-6 rounded-md bg-black/50 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors text-xs"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 border border-white/10">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCur(idx)}
                aria-label={`Go to ${slide.name}`}
                className="transition-all duration-300 rounded-full h-1.5 focus:outline-none"
                style={{
                  width: idx === cur ? "16px" : "6px",
                  backgroundColor: idx === cur ? activeSlide.accentColor : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next game slide"
            className="w-6 h-6 rounded-md bg-black/50 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors text-xs"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
