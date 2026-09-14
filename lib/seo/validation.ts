/**
 * lib/seo/validation.ts
 * ────────────────────────────────────────────────────────────────
 * Technical SEO Validator for Moha Gaming Lab.
 * Inspects page metadata, titles, descriptions, canonical URLs, and content
 * to prevent ranking penalties, truncated SERP snippets, or duplicate content.
 */

export interface SeoIssue {
  field: "title" | "description" | "canonical" | "content" | "structuredData";
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}

export interface SeoValidationResult {
  score: number; // 0 to 100
  isValid: boolean;
  issues: SeoIssue[];
}

/**
 * Validates metadata fields according to modern search engine guidelines.
 */
export function validateSeoMetadata(input: {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  wordCount?: number;
}): SeoValidationResult {
  const issues: SeoIssue[] = [];

  const title = input.title?.trim() || "";
  const description = input.description?.trim() || "";
  const canonical = input.canonicalUrl?.trim() || "";
  const wordCount = input.wordCount ?? 250;

  // 1. Title Checks (Target: 30 - 60 chars)
  if (!title) {
    issues.push({
      field: "title",
      severity: "error",
      message: "Page title is missing.",
      recommendation: "Provide a unique, descriptive title between 30 and 60 characters.",
    });
  } else if (title.length < 25) {
    issues.push({
      field: "title",
      severity: "warning",
      message: `Title is too brief (${title.length} characters).`,
      recommendation: "Expand title to at least 30 characters to improve click-through relevance.",
    });
  } else if (title.length > 65) {
    issues.push({
      field: "title",
      severity: "warning",
      message: `Title is too long (${title.length} characters) and will truncate on Google desktop & mobile.`,
      recommendation: "Keep primary keywords in the first 55-60 characters.",
    });
  }

  // 2. Meta Description Checks (Target: 70 - 155 chars)
  if (!description) {
    issues.push({
      field: "description",
      severity: "error",
      message: "Meta description is missing.",
      recommendation: "Add a concise summary between 70 and 155 characters.",
    });
  } else if (description.length < 60) {
    issues.push({
      field: "description",
      severity: "warning",
      message: `Meta description is short (${description.length} characters).`,
      recommendation: "Provide more descriptive context about the technical utility or guide.",
    });
  } else if (description.length > 160) {
    issues.push({
      field: "description",
      severity: "warning",
      message: `Meta description exceeds 160 characters (${description.length} chars) and will truncate.`,
      recommendation: "Tighten copy to 140-155 characters for optimal snippet presentation.",
    });
  }

  // 3. Canonical Checks
  if (canonical) {
    if (!canonical.startsWith("https://") && !canonical.startsWith("http://localhost")) {
      issues.push({
        field: "canonical",
        severity: "error",
        message: "Canonical URL must be a valid absolute HTTPS URL.",
        recommendation: "Format as https://mohagaminglab.com/path",
      });
    }
    if (/[?&](utm_|fbclid|gclid)/i.test(canonical)) {
      issues.push({
        field: "canonical",
        severity: "error",
        message: "Canonical URL contains tracking or campaign parameters.",
        recommendation: "Strip all query parameters from canonical tags.",
      });
    }
  }

  // 4. Content Thinness Check
  if (wordCount < 100) {
    issues.push({
      field: "content",
      severity: "warning",
      message: `Thin content detected (~${wordCount} words).`,
      recommendation: "Ensure the page delivers substantive diagnostic explanations or technical steps.",
    });
  }

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 25;
    else if (issue.severity === "warning") score -= 10;
  }
  score = Math.max(0, score);

  return {
    score,
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
