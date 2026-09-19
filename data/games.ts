import type {
  Game,
  CommonProblem,
  OptimizationRecommendation,
} from "@/types/game";

/* ── Shared problems library ──────────────────────────────── */

const PROBLEM_FPS_DROP: CommonProblem = {
  id: "fps-drop-thermal",
  title: "FPS drops after 10–15 minutes",
  what: "Frame rate decreases noticeably mid-session, often 15–25% below the initial rate. Most common on mid-range devices during extended sessions.",
  causes: [
    "Thermal throttling: SoC reduces clock speed to control heat",
    "Background services consuming CPU after OS delays them",
    "Memory pressure triggering garbage collection pauses",
    "Power governor switching to a lower power state",
  ],
  steps: [
    "Enable airplane mode to reduce background radio activity",
    "Close all background apps before starting a session",
    "Avoid playing while charging — this increases thermal load",
    "Check if the device case is trapping heat",
    "Use our FPS Calculator to understand your device's sustained ceiling",
  ],
  relatedToolSlugs: ["fps-calculator"],
  relatedGuideSlugs: ["diagnose-fps-drops-android", "understanding-frame-time"],
};

const PROBLEM_FRAME_PACING: CommonProblem = {
  id: "frame-pacing",
  title: "Stuttering despite high FPS reading",
  what: "The game reports 60 FPS but feels choppy. Frame delivery is inconsistent — some frames take 8ms, others 25ms — creating a jerky feel even though the counter looks fine.",
  causes: [
    "Poor frame pacing from the game engine (common in Unreal Engine mobile titles)",
    "GPU driver scheduling overhead on mid-range SoCs",
    "vsync misalignment when frame time doesn't divide evenly into 16.6ms",
    "Thermal throttling affecting only some frames",
  ],
  steps: [
    "Enable '90 FPS' mode if available — a stable 60 often appears smoother than an unstable 90",
    "Reduce graphics settings by one tier to give the GPU headroom",
    "Disable 'Smooth controls' or similar in-game frame interpolation options",
    "Check frame time with an overlay tool, not just the FPS counter",
  ],
  relatedToolSlugs: ["fps-calculator"],
  relatedGuideSlugs: ["understanding-frame-time"],
};

const PROBLEM_HIGH_PING: CommonProblem = {
  id: "high-ping",
  title: "High or unstable ping",
  what: "Ping readings above 80ms or ping that fluctuates widely during gameplay. Can cause teleporting enemies, delayed hit registration, and desync.",
  causes: [
    "Distance to selected game server region",
    "Router QoS not prioritizing gaming traffic",
    "Wi-Fi interference or congestion on 2.4GHz",
    "ISP routing issues to the game's CDN nodes",
    "VPN adding unnecessary hops",
  ],
  steps: [
    "Switch to the closest server region in game settings",
    "Move to 5GHz Wi-Fi or use a wired connection via USB-C adapter",
    "Disable Wi-Fi power-saving mode in Android developer options",
    "Test ping to game servers using our Ping Tester tool",
    "If using a VPN, try disabling it — VPNs often increase latency for gaming",
  ],
  relatedToolSlugs: ["ping-tester"],
  relatedGuideSlugs: ["mobile-gaming-network-latency-jitter"],
};

const PROBLEM_TOUCH_DELAY: CommonProblem = {
  id: "touch-delay",
  title: "Touch input feels delayed or imprecise",
  what: "Actions register slightly after the tap or swipe. Particularly noticeable during rapid fire, quick scope, or drag movements. Can be the difference between 120fps feeling fast or sluggish.",
  causes: [
    "Display touch sampling rate lower than game's expected input rate",
    "Game engine running touch event processing on the same thread as rendering",
    "System-level touch latency from accessibility services or display overlays",
    "Low-quality screen protector absorbing touch input",
  ],
  steps: [
    "Remove third-party screen protectors if possible",
    "Disable all accessibility services not in active use",
    "Remove third-party launcher or floating apps that intercept touch",
    "Check if the game has 'Extreme Touch Response' or similar — enable if available",
    "Ensure the display is set to its maximum refresh rate (not power-saving mode)",
  ],
  relatedGuideSlugs: ["touch-latency-input-delay-guide"],
};

const PROBLEM_BATTERY_DRAIN: CommonProblem = {
  id: "battery-drain",
  title: "Excessive battery drain during gameplay",
  what: "Battery depletes significantly faster than expected. A 1-hour gaming session consuming more than 20–25% on a 4500mAh battery indicates high power draw.",
  causes: [
    "Maximum brightness and volume increasing power draw",
    "5G radio scanning using significant background power",
    "Game engine keeping CPU and GPU pegged at maximum clock speeds",
    "Location services and background sync during gameplay",
  ],
  steps: [
    "Reduce screen brightness to 60–70% — brightness is the biggest battery draw",
    "Switch to 4G LTE from 5G if signal quality is similar",
    "Enable game-specific battery optimization in Android's battery settings",
    "Disable location and background app refresh for apps not in use",
    "Cap FPS in game settings if the display is capped at 60Hz anyway",
  ],
};

/* ── Shared optimization recs library ─────────────────────── */

const OPT_LOWER_GRAPHICS: OptimizationRecommendation = {
  id: "lower-graphics",
  category: "graphics",
  title: "Set graphics to Balanced or Smooth",
  description: "High or Ultra graphics settings increase GPU workload significantly. For competitive play, Smooth or Balanced often delivers more consistent frame pacing with lower thermal output.",
  difficulty: "easy",
  risk: "low",
};

const OPT_CLOSE_BACKGROUND: OptimizationRecommendation = {
  id: "close-background",
  category: "performance",
  title: "Close all background apps before sessions",
  description: "Background apps compete for RAM and trigger periodic CPU wake-ups. Closing them before starting reduces memory pressure and OS scheduling overhead during gameplay.",
  difficulty: "easy",
  risk: "low",
};

const OPT_AIRPLANE_MODE: OptimizationRecommendation = {
  id: "airplane-mode-wifi",
  category: "performance",
  title: "Use airplane mode + Wi-Fi during sessions",
  description: "Enabling airplane mode then re-enabling only Wi-Fi disconnects the cellular radio, which reduces CPU interrupts and thermal load without losing network connectivity.",
  difficulty: "easy",
  risk: "low",
};

const OPT_DISABLE_BATTERY_OPT: OptimizationRecommendation = {
  id: "disable-battery-opt",
  category: "performance",
  title: "Exclude the game from battery optimization",
  description: "Android's battery optimizer can kill or throttle background processes. Excluding the game prevents the OS from suspending threads during rendering.",
  difficulty: "easy",
  risk: "low",
};

const OPT_SERVER_REGION: OptimizationRecommendation = {
  id: "server-region",
  category: "network",
  title: "Select the geographically closest server region",
  description: "Network latency scales with physical distance to the server. Choosing the correct region can reduce ping by 30–120ms depending on your location.",
  difficulty: "easy",
  risk: "low",
};

const OPT_5GHZ_WIFI: OptimizationRecommendation = {
  id: "5ghz-wifi",
  category: "network",
  title: "Connect to 5GHz Wi-Fi instead of 2.4GHz",
  description: "5GHz Wi-Fi has less interference and higher throughput than 2.4GHz, though shorter range. For gaming where the phone is near the router, it consistently delivers lower and more stable latency.",
  difficulty: "easy",
  risk: "low",
};

const OPT_TOUCH_RESPONSE: OptimizationRecommendation = {
  id: "touch-response",
  category: "touch",
  title: "Enable maximum touch response mode",
  description: "Most flagship devices and gaming phones have a high-touch-polling rate mode in display settings. Enabling this increases touch event frequency, reducing perceived input lag.",
  difficulty: "easy",
  risk: "low",
};

const OPT_DISABLE_ACCESSIBILITY: OptimizationRecommendation = {
  id: "disable-accessibility",
  category: "touch",
  title: "Disable unused accessibility services",
  description: "Accessibility services intercept touch events system-wide. Services like screen readers or gesture controls that you do not actively use add latency to every touch event.",
  difficulty: "moderate",
  risk: "low",
};

const OPT_THERMALS_NO_CHARGE: OptimizationRecommendation = {
  id: "no-charging-during-play",
  category: "thermal",
  title: "Avoid playing while charging",
  description: "Charging generates additional heat that compounds with the SoC thermal output. This accelerates thermal throttling and shortens the duration before FPS drops occur.",
  difficulty: "easy",
  risk: "low",
};

/* ── Games data ───────────────────────────────────────────── */

export const games: Game[] = [
  /* ───────── PUBG Mobile ───────── */
  {
    id: "game-1",
    name: "PUBG Mobile",
    altNames: ["PlayerUnknown's Battlegrounds Mobile", "BGMI"],
    slug: "pubg-mobile",
    platform: "android",
    category: "battle-royale",
    status: "active",
    description:
      "PUBG Mobile demands consistent 60–90 FPS delivery, stable network under sustained combat load, and responsive touch during aim and vehicle movement. On mid-range hardware it frequently hits thermal limits after 15–20 minutes, causing noticeable frame rate drops.",
    excerpt: "Battle royale — GPU, network, and thermal stability.",
    iconUrl: null,
    minAndroidVersion: "5.1",
    deviceTier: "mid",
    featured: true,
    performanceAreas: ["fps", "frame-time", "network", "thermal", "touch-latency"],
    guideSlug: "optimize-pubg-mobile-android",
    relatedToolSlugs: ["fps-calculator", "ping-tester"],
    relatedAppSlugs: ["moha-fps-toolkit", "moha-network-monitor"],
    relatedGuideSlugs: ["improve-fps-android", "reduce-ping-mobile-games", "android-soc-gaming-performance"],
    commonProblems: [PROBLEM_FPS_DROP, PROBLEM_HIGH_PING, PROBLEM_FRAME_PACING, PROBLEM_TOUCH_DELAY],
    optimizationRecs: [
      OPT_LOWER_GRAPHICS,
      OPT_CLOSE_BACKGROUND,
      OPT_AIRPLANE_MODE,
      OPT_SERVER_REGION,
      OPT_THERMALS_NO_CHARGE,
      OPT_TOUCH_RESPONSE,
    ],
    tags: ["battle-royale", "fps", "network-sensitive", "90fps"],
    updatedAt: "2025-09-01",
  },

  /* ───────── PUBG Mobile KR ───────── */
  {
    id: "game-2",
    name: "PUBG Mobile (KR)",
    altNames: ["PUBG KR", "PUBG JP", "PUBG Korea"],
    slug: "pubg-mobile-kr",
    platform: "android",
    category: "battle-royale",
    status: "active",
    description:
      "The Korean/Japanese regional build of PUBG Mobile uses dedicated East Asia servers and separate update cadence. Optimization focuses on routing latency to KR/JP nodes, 90/120 FPS profile configuration, and preventing thermal throttling on sustained sessions.",
    excerpt: "Korean build — latency routing, 90/120 FPS profiles, ping stability.",
    iconUrl: null,
    minAndroidVersion: "5.1.1",
    deviceTier: "mid",
    featured: true,
    performanceAreas: ["fps", "network", "thermal", "frame-time"],
    relatedToolSlugs: ["fps-calculator", "ping-tester"],
    relatedAppSlugs: ["moha-fps-toolkit", "moha-network-monitor"],
    relatedGuideSlugs: ["improve-fps-android", "reduce-ping-mobile-games"],
    commonProblems: [PROBLEM_HIGH_PING, PROBLEM_FPS_DROP, PROBLEM_FRAME_PACING],
    optimizationRecs: [
      OPT_SERVER_REGION,
      OPT_5GHZ_WIFI,
      OPT_LOWER_GRAPHICS,
      OPT_CLOSE_BACKGROUND,
      OPT_THERMALS_NO_CHARGE,
    ],
    tags: ["battle-royale", "fps", "korean-version", "krjp-server", "120fps"],
    updatedAt: "2025-09-01",
  },

  /* ───────── Call of Duty: Mobile ───────── */
  {
    id: "game-3",
    name: "Call of Duty: Mobile",
    altNames: ["CoD Mobile", "CODM"],
    slug: "call-of-duty-mobile",
    platform: "android",
    category: "fps",
    status: "active",
    description:
      "Call of Duty: Mobile runs at up to 120 FPS on supported hardware and relies heavily on fast touch sampling for gyroscope aim and rapid ads. Shader preloading at launch is required to prevent initial match stuttering. High-performance profiles help avoid thermal clock drops during ranked matches.",
    excerpt: "Fast-paced FPS — 120 FPS tuning, touch latency, and shader pre-compilation.",
    iconUrl: null,
    minAndroidVersion: "6.0",
    deviceTier: "high",
    featured: true,
    performanceAreas: ["fps", "touch-latency", "frame-time", "thermal", "graphics"],
    relatedToolSlugs: ["fps-calculator", "ping-tester"],
    relatedAppSlugs: ["moha-fps-toolkit", "moha-network-monitor"],
    relatedGuideSlugs: ["improve-fps-android", "android-soc-gaming-performance"],
    commonProblems: [PROBLEM_TOUCH_DELAY, PROBLEM_FRAME_PACING, PROBLEM_FPS_DROP, PROBLEM_HIGH_PING],
    optimizationRecs: [
      OPT_TOUCH_RESPONSE,
      OPT_DISABLE_ACCESSIBILITY,
      OPT_LOWER_GRAPHICS,
      OPT_CLOSE_BACKGROUND,
      OPT_THERMALS_NO_CHARGE,
      OPT_5GHZ_WIFI,
    ],
    tags: ["fps", "shooter", "120fps", "multiplayer", "gyroscope"],
    updatedAt: "2025-09-01",
  },

  /* ───────── eFootball ───────── */
  {
    id: "game-4",
    name: "eFootball™",
    altNames: ["eFootball 2024", "eFootball 2025", "PES Mobile"],
    slug: "efootball",
    platform: "android",
    category: "sports",
    status: "active",
    description:
      "eFootball Mobile is built on Unreal Engine and requires consistent 60 FPS pacing with low touch input latency. Frame time irregularities make dribbling feel unresponsive even when the FPS counter reads correctly. GPU thread balancing and RAM cache management are the primary optimization targets.",
    excerpt: "Unreal Engine sports — 60 FPS frame pacing and touch responsiveness.",
    iconUrl: null,
    minAndroidVersion: "7.0",
    deviceTier: "mid",
    featured: true,
    performanceAreas: ["fps", "frame-time", "touch-latency", "memory", "battery"],
    relatedToolSlugs: ["fps-calculator"],
    relatedAppSlugs: ["moha-fps-toolkit"],
    relatedGuideSlugs: ["improve-fps-android", "android-soc-gaming-performance"],
    commonProblems: [PROBLEM_FRAME_PACING, PROBLEM_TOUCH_DELAY, PROBLEM_FPS_DROP, PROBLEM_BATTERY_DRAIN],
    optimizationRecs: [
      OPT_LOWER_GRAPHICS,
      OPT_CLOSE_BACKGROUND,
      OPT_DISABLE_BATTERY_OPT,
      OPT_TOUCH_RESPONSE,
      OPT_THERMALS_NO_CHARGE,
    ],
    tags: ["sports", "football", "unreal-engine", "60fps", "input-latency"],
    updatedAt: "2025-09-01",
  },

  /* ───────── Mobile Legends ───────── */
  {
    id: "game-5",
    name: "Mobile Legends: Bang Bang",
    altNames: ["MLBB", "Mobile Legends"],
    slug: "mobile-legends",
    platform: "android",
    category: "moba",
    status: "active",
    description:
      "Mobile Legends is a fast-paced MOBA where frame stability and input latency directly impact competitive performance. The game runs on a wide range of hardware from Snapdragon 4xx to 8 Gen series. Frame drops during team fights are the most common complaint on mid-range devices.",
    excerpt: "MOBA — frame stability during team fights, low input latency.",
    iconUrl: null,
    minAndroidVersion: "4.4",
    deviceTier: "low",
    featured: true,
    performanceAreas: ["fps", "network", "touch-latency", "stability"],
    relatedToolSlugs: ["fps-calculator", "ping-tester"],
    relatedAppSlugs: ["moha-fps-toolkit", "moha-network-monitor"],
    relatedGuideSlugs: ["improve-fps-android", "reduce-ping-mobile-games"],
    commonProblems: [PROBLEM_FPS_DROP, PROBLEM_HIGH_PING, PROBLEM_TOUCH_DELAY],
    optimizationRecs: [
      OPT_LOWER_GRAPHICS,
      OPT_CLOSE_BACKGROUND,
      OPT_SERVER_REGION,
      OPT_5GHZ_WIFI,
      OPT_DISABLE_BATTERY_OPT,
    ],
    tags: ["moba", "competitive", "low-end-friendly", "120fps"],
    updatedAt: "2025-09-01",
  },

  /* ───────── Free Fire ───────── */
  {
    id: "game-6",
    name: "Free Fire",
    altNames: ["Garena Free Fire", "FF", "Free Fire MAX"],
    slug: "free-fire",
    platform: "android",
    category: "battle-royale",
    status: "active",
    description:
      "Garena Free Fire is engineered for lower-end Android hardware, but it still benefits from thermal management and memory optimization. Devices with 2–3GB RAM frequently experience memory-related stutters during the final circle. Thermal throttling on budget SoCs causes noticeable FPS reduction after 20 minutes.",
    excerpt: "Battle royale for low-end hardware — memory and thermal optimization.",
    iconUrl: null,
    minAndroidVersion: "4.4",
    deviceTier: "low",
    featured: false,
    performanceAreas: ["fps", "thermal", "memory", "battery"],
    relatedToolSlugs: ["fps-calculator", "device-tier-checker"],
    relatedAppSlugs: ["moha-fps-toolkit"],
    relatedGuideSlugs: ["improve-fps-android", "android-soc-gaming-performance"],
    commonProblems: [PROBLEM_FPS_DROP, PROBLEM_BATTERY_DRAIN, PROBLEM_FRAME_PACING],
    optimizationRecs: [
      OPT_CLOSE_BACKGROUND,
      OPT_LOWER_GRAPHICS,
      OPT_THERMALS_NO_CHARGE,
      OPT_DISABLE_BATTERY_OPT,
      OPT_AIRPLANE_MODE,
    ],
    tags: ["battle-royale", "low-end", "thermal-sensitive"],
    updatedAt: "2025-09-01",
  },
];

/* ── Query helpers ────────────────────────────────────────── */

export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function getFeaturedGames(): Game[] {
  return games.filter((g) => g.featured && g.status === "active");
}

export function getActiveGames(): Game[] {
  return games.filter((g) => g.status === "active");
}
