import type {
  Tool,
  ToolCategory,
  ToolPlatform,
  ToolStatus,
  ToolCategoryMeta,
} from "@/types/tool";

/* ── Category metadata ────────────────────────────────────── */

export const TOOL_CATEGORIES: ToolCategoryMeta[] = [
  {
    id: "performance",
    name: "Performance",
    description: "FPS, frame timing, rendering stability, and frame-drop analysis.",
    iconName: "Gauge",
  },
  {
    id: "network",
    name: "Network",
    description: "Latency, jitter, connection type, and round-trip diagnostics.",
    iconName: "Wifi",
  },
  {
    id: "display",
    name: "Display",
    description: "Refresh rate, resolution, aspect ratio, and color capability tests.",
    iconName: "Monitor",
  },
  {
    id: "device",
    name: "Device",
    description: "Hardware concurrency, device memory, viewport, and client specs.",
    iconName: "Cpu",
  },
  {
    id: "browser",
    name: "Browser",
    description: "API capability matrix, feature detection, and graphics standard support.",
    iconName: "Compass",
  },
  {
    id: "storage",
    name: "Storage",
    description: "Quota inspection, IndexedDB, LocalStorage, and Cache API estimates.",
    iconName: "HardDrive",
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Gamepad and controller inputs, axis calibration, and button testing.",
    iconName: "Gamepad2",
  },
  {
    id: "diagnostics",
    name: "Diagnostics",
    description: "Touch sampling rates, pointer input frequencies, and multi-touch diagnostics.",
    iconName: "Activity",
  },
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  performance: "Performance",
  network: "Network",
  display: "Display",
  device: "Device",
  storage: "Storage",
  browser: "Browser",
  diagnostics: "Diagnostics",
  gaming: "Gaming",
};

export const PLATFORM_LABELS: Record<ToolPlatform, string> = {
  web: "Web",
  android: "Android",
  windows: "Windows",
};

export const STATUS_LABELS: Record<ToolStatus, string> = {
  available: "Live",
  beta: "Beta",
  "coming-soon": "In Development",
  deprecated: "Deprecated",
};

/* ── Filter interface ─────────────────────────────────────── */

export interface ToolFilterOptions {
  query?: string;
  category?: ToolCategory | "all";
  platform?: ToolPlatform | "all";
  difficulty?: "beginner" | "intermediate" | "advanced" | "all";
}

/* ── Filtering implementation ─────────────────────────────── */

export function filterTools(tools: Tool[], options: ToolFilterOptions = {}): Tool[] {
  const {
    query = "",
    category = "all",
    platform = "all",
    difficulty = "all",
  } = options;

  const normalizedQuery = query.trim().toLowerCase();

  return tools.filter((tool) => {
    // Category match
    if (category !== "all" && tool.category !== category) {
      return false;
    }

    // Platform match
    if (platform !== "all" && !tool.platforms.includes(platform)) {
      return false;
    }

    // Difficulty match
    if (difficulty !== "all" && tool.difficulty !== difficulty) {
      return false;
    }

    // Search query match
    if (normalizedQuery) {
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const searchSpace = [
        tool.name,
        tool.shortDescription,
        tool.description,
        tool.whatItDoes,
        ...tool.whatItMeasures,
        ...tool.tags,
        CATEGORY_LABELS[tool.category] || "",
        ...tool.platforms,
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => searchSpace.includes(token));
    }

    return true;
  });
}
