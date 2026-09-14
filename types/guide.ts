/**
 * Guide Data Models & Types — Moha Gaming Lab
 * Scalable architecture for technical guides, tutorials, and knowledge base articles.
 */

export type GuideCategory =
  | "Android Gaming"
  | "Performance"
  | "FPS & Frame Time"
  | "Touch & Input"
  | "Network"
  | "Thermals"
  | "Battery"
  | "Graphics"
  | "Troubleshooting"
  | "Device Optimization"
  | "Gaming Settings";

export type GuideContentType =
  | "Guide"
  | "Tutorial"
  | "Troubleshooting"
  | "Explainer"
  | "Reference";

export type GuideDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

export interface GuideAuthor {
  name: string;
  role?: string;
}

export type CalloutType = "important" | "warning" | "tip" | "note";

export interface GuideCallout {
  type: CalloutType;
  title?: string;
  content: string;
}

export interface GuideCodeBlock {
  language: string;
  code: string;
  caption?: string;
  explanation?: string;
}

export interface GuideTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface GuideSection {
  id: string;
  title: string;
  level: "h2" | "h3";
  paragraphs?: string[];
  listItems?: string[];
  orderedList?: boolean;
  callout?: GuideCallout;
  codeBlock?: GuideCodeBlock;
  table?: GuideTable;
  subSections?: GuideSection[];
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  category: GuideCategory;
  contentType: GuideContentType;
  difficulty: GuideDifficulty;
  author: GuideAuthor;
  readingTimeMinutes: number;
  publishedAt: string; // ISO 8601
  updatedAt?: string;  // ISO 8601
  version: string;
  featured: boolean;
  tags: string[];
  gameIds?: string[];
  toolIds?: string[];
  appIds?: string[];
  relatedGuideSlugs?: string[];
  summary?: string[];
  sections: GuideSection[];
  faqs?: GuideFaq[];
  status: "published" | "draft" | "review" | "archived";
  reviewNote?: string;
}

/** Helper to generate SEO metadata */
export function buildGuideOgTitle(guide: Guide): string {
  return `${guide.title} | Moha Gaming Lab`;
}

export function buildGuideOgDescription(guide: Guide): string {
  return `${guide.excerpt} Learn technical Android gaming performance concepts, metrics, and tuning strategies.`;
}
