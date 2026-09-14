"use client";

import * as React from "react";
import { SceneWrapper } from "@/components/three/SceneWrapper";
import { Play, Pause, Volume2, VolumeX, Box, Film } from "lucide-react";
import { cn } from "@/lib/cn";

export function HeroVisual() {
  const [viewMode, setViewMode] = React.useState<"3d" | "video">("video");
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg lg:max-w-none">
      {/* Mode Switcher Pill */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-bg-surface border border-border-default">
          <button
            onClick={() => setViewMode("video")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all duration-150",
              viewMode === "video"
                ? "bg-accent text-bg-base font-bold shadow-sm shadow-accent/20"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Film size={13} />
            Video Engine
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all duration-150",
              viewMode === "3d"
                ? "bg-accent text-bg-base font-bold shadow-sm shadow-accent/20"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Box size={13} />
            3D Simulation
          </button>
        </div>

        <span className="text-2xs font-mono text-accent flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          ACTIVE STREAM
        </span>
      </div>

      {/* Main Display Container */}
      <div className="relative rounded-2xl overflow-hidden border border-border-strong bg-bg-surface shadow-2xl shadow-black/80 aspect-square sm:aspect-[4/3] lg:aspect-square flex items-center justify-center">
        {/* Subtle accent border glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
          style={{
            boxShadow: "inset 0 0 24px rgba(0, 229, 160, 0.15)",
          }}
          aria-hidden="true"
        />

        {viewMode === "3d" ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <SceneWrapper scene="device" heightClass="h-full w-full" />
          </div>
        ) : (
          <div className="relative w-full h-full group">
            <video
              ref={videoRef}
              src="/videos/hero-showcase.mp4"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Video Overlay Info */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-accent/30 text-2xs font-mono font-semibold text-accent">
                120 FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-border-default text-2xs font-mono text-gray-300">
                4K HDR
              </span>
            </div>

            {/* Bottom Quick Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 opacity-90 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                  aria-label={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1"
                  aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span className="text-2xs font-mono text-accent">
                    {isMuted ? "MUTED" : "LIVE"}
                  </span>
                </button>
              </div>

              <span className="text-2xs font-mono text-gray-400">
                Interactive Engine Demo
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
