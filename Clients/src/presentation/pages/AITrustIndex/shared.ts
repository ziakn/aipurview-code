// Clients/src/presentation/pages/AITrustIndex/shared.ts
export interface TrustIndexAppData {
  slug: string; name: string; vendor: string; domain: string; category: string;
  scoreOutOf100: number; letterGrade: string; displayedGrade: string; confidence: string;
  dealbreakerFlags: string[]; summary: string; highlights: { label: string; text: string }[];
  policyUrl: string; policyLastUpdated: string | null; modalities: string[]; processesBiometrics: boolean;
}

export interface TrustIndexRow {
  slug: string; name: string; vendor?: string; category?: string;
  letter_grade?: string; score_out_of_100?: number; data: TrustIndexAppData;
  is_tracked?: boolean; is_active?: boolean; no_longer_in_index?: boolean;
}

/** Map a letter grade to a theme-aligned chip color (our palette, not the feed's design block). */
export const GRADE_COLOR: Record<string, string> = {
  A: "#13715B", B: "#3b82a0", C: "#b7791f", D: "#c2410c", F: "#b42318",
};

export function faviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
