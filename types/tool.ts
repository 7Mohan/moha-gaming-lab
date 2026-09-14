import type { Metadata } from "next";

/** Tool availability status */
export type ToolStatus = "available" | "beta" | "coming-soon" | "deprecated";

/** Tool category */
export type ToolCategory =
  | "performance"
  | "network"
  | "display"
  | "device"
  | "storage"
  | "browser"
  | "diagnostics"
  | "gaming";

/** Target/supported execution platforms */
export type ToolPlatform = "web" | "android" | "windows";

/** System requirements for a tool */
export interface ToolRequirements {
  minApiLevel: number | null;
  requiresRoot: boolean;
  isWebBased: boolean;
  notes?: string;
}

/** Rich tool definition interface */
export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  platforms: ToolPlatform[];
  status: ToolStatus;
  whatItDoes: string;
  whatItMeasures: string[];
  capabilities: string[];
  limitations: string[];
  technicalExplanation: string;
  howToInterpret: string[];
  relatedToolSlugs: string[];
  relatedGuideSlugs: string[];
  relatedGameSlugs: string[];
  featured?: boolean;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  browserSupport?: string;
  requiresWebGl?: boolean;
  requiresRoot?: boolean;
  updatedAt?: string;
}

/** Backward-compatible Tool alias for components expecting existing shape */
export type Tool = ToolDefinition & {
  excerpt: string;
  requirements: ToolRequirements;
};

/** Category metadata structure */
export interface ToolCategoryMeta {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
}

export function buildToolOgTitle(tool: Pick<ToolDefinition, "name">): string {
  return `${tool.name} | Moha Gaming Lab Tools`;
}

export function buildToolOgDescription(tool: Pick<ToolDefinition, "shortDescription">): string {
  return `${tool.shortDescription} Free, client-side diagnostic utility by Moha Gaming Lab.`;
}
