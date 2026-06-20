// Clients/src/presentation/pages/AITrustIndex/shared.ts
export interface TrustIndexAppData {
  slug: string;
  name: string;
  vendor: string;
  domain: string;
  category: string;
  scoreOutOf100: number;
  letterGrade: string;
  displayedGrade: string;
  confidence: string;
  dealbreakerFlags: string[];
  summary: string;
  highlights: { label: string; text: string }[];
  policyUrl: string;
  policyLastUpdated: string | null;
  modalities: string[];
  processesBiometrics: boolean;
}

export interface TrustIndexRow {
  slug: string;
  app_slug?: string;
  name: string;
  vendor?: string;
  category?: string;
  letter_grade?: string;
  score_out_of_100?: number;
  data: TrustIndexAppData;
  is_tracked?: boolean;
  is_active?: boolean;
  no_longer_in_index?: boolean;
}

/** Map a letter grade to a theme-aligned chip color (our palette, not the feed's design block). */
export const GRADE_COLOR: Record<string, string> = {
  A: "#13715B",
  B: "#3b82a0",
  C: "#b7791f",
  D: "#c2410c",
  F: "#b42318",
};

/** Fallback color for categories not in CATEGORY_COLOR (and unknown values). */
export const CATEGORY_FALLBACK_COLOR = "#475467";

/**
 * Map a feed category to a distinct, soft-tinted chip color. Mirrors GRADE_COLOR.
 * Rendered as a 10% tint (`${color}1A`) with `color` as the text, so each
 * category reads as visually distinct without being loud.
 */
export const CATEGORY_COLOR: Record<string, string> = {
  "Assistant": "#2563eb", // blue
  "Image & video": "#7c3aed", // purple
  "Audio": "#0d9488", // teal
  "Companion": "#db2777", // pink
  "Productivity": "#b7791f", // amber
};

/** Resolve a category to its chip color, falling back for unknown categories. */
export function categoryColor(category?: string): string {
  if (!category) return CATEGORY_FALLBACK_COLOR;
  return CATEGORY_COLOR[category] ?? CATEGORY_FALLBACK_COLOR;
}

export function faviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
