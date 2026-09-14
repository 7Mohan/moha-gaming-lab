"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Activity, Wifi, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface VideoShowcaseProps {
  className?: string;
}

const VIDEOS = [
  {
    id: "hero-showcase",
    title: "Lab Performance Showcase",
    subtitle: "Real-time Android frame pacing & hardware benchmarks",
    src: "/videos/hero-showcase.mp4",
    badge: "120 FPS CAPTURE",
    fps: "120.0 FPS",
    latency: "1.2 ms",
    resolution: "4K UHD",
  },
  {
    id: "gaming-optimization",
    title: "Wi-Fi & Latency Diagnostics",
    subtitle: "5GHz routing, bufferbloat reduction & packet stabilization",
    src: "/videos/gaming-optimization.mp4",
    badge: "NETWORK TELEMETRY",
    fps: "60.0 FPS",
    latency: "8.4 ms",
    resolution: "1080p60",
  },
];

export function VideoShowcase({ className }: VideoShowcaseProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeVideo = VIDEOS[activeIdx] ?? VIDEOS[0]!;

  // Handle video change
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [activeIdx]);

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Video Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex flex-wrap gap-2">
          {VIDEOS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeIdx === i
                  ? "bg-accent/15 text-accent border border-accent/40 shadow-sm shadow-accent/10"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-border-default"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  activeIdx === i ? "bg-accent animate-pulse" : "bg-text-muted"
                )}
              />
              {v.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
          <span className="flex items-center gap-1">
            <Activity size={13} className="text-accent" />
            Live Buffer: Stable
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <ShieldCheck size={13} className="text-accent" />
            Hardware Accel
          </span>
        </div>
      </div>

      {/* Main Video Cinema Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative group w-full aspect-video rounded-xl overflow-hidden bg-black border border-border-strong shadow-2xl shadow-black/80 select-none"
      >
        {/* Glowing animated frame border */}
        <div
          className="absolute -inset-px rounded-xl opacity-40 pointer-events-none transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,229,160,0.3) 0%, transparent 40%, transparent 60%, rgba(59,130,246,0.3) 100%)",
          }}
          aria-hidden="true"
        />

        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          src={activeVideo.src}
          playsInline
          muted={isMuted}
          autoPlay
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Top Telemetry HUD Overlay */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent",
            "flex items-center justify-between transition-opacity duration-300 pointer-events-none",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-base/80 border border-accent/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-2xs font-mono font-bold text-accent tracking-wider uppercase">
                {activeVideo.badge}
              </span>
            </div>
            <span className="text-xs font-semibold text-text-primary hidden sm:inline drop-shadow">
              {activeVideo.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono bg-bg-base/80 border border-border-default backdrop-blur-md px-3 py-1 rounded-md text-text-secondary">
            <span className="text-accent font-semibold">{activeVideo.fps}</span>
            <span>•</span>
            <span>{activeVideo.resolution}</span>
            <span>•</span>
            <span className="text-emerald-400">{activeVideo.latency}</span>
          </div>
        </div>

        {/* Center Play Button Overlay (when paused) */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/90 text-bg-base flex items-center justify-center shadow-lg shadow-accent/30 hover:scale-105 transition-transform">
              <Play size={32} className="ml-1 fill-current" />
            </div>
          </div>
        )}

        {/* Bottom Custom Controls Bar */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent",
            "flex flex-col gap-3 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Progress Bar */}
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer relative transition-all duration-150 group/bar"
          >
            <div
              className="h-full bg-accent rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 shadow-sm" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
              </button>

              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
              >
                {isMuted ? (
                  <>
                    <VolumeX size={18} />
                    <span className="text-2xs font-mono text-accent">UNMUTE</span>
                  </>
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <span className="text-xs font-mono text-gray-300 hidden sm:inline">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono text-gray-400 hidden md:inline px-2 py-1 rounded bg-white/5">
                SPACE to Play • M to Mute
              </span>

              <button
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Metadata & Feature Strip */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider">
            <Sparkles size={14} />
            Visual Pacing
          </div>
          <p className="text-sm font-semibold text-text-primary">Micro-stutter Reduction</p>
          <p className="text-xs text-text-muted">
            Eliminates frame delta fluctuations via V-Sync and GPU scheduling alignment.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider">
            <Wifi size={14} />
            Network Jitter
          </div>
          <p className="text-sm font-semibold text-text-primary">Packet Queue Prioritization</p>
          <p className="text-xs text-text-muted">
            Stabilizes high-frequency UDP packets over 5GHz Wi-Fi and 5G cellular channels.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider">
            <Activity size={14} />
            Thermal Throttling
          </div>
          <p className="text-sm font-semibold text-text-primary">Sustained Clock Retention</p>
          <p className="text-xs text-text-muted">
            Prevents the aggressive 15-minute GPU clock drop common on Snapdragon and Dimensity chips.
          </p>
        </div>
      </div>
    </div>
  );
}
