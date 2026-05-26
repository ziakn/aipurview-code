export interface QualityScore {
  relevance: number;
  completeness: number;
  recency: number;
  reliability: number;
  specificity: number;
  overall: number;
}

export interface SuggestedControlLink {
  framework: string;
  control_id: number;
  confidence: number;
}

export interface KeyFinding {
  finding: string;
  relevance: "high" | "medium" | "low";
}

export interface EvidenceAiAnalysis {
  id: number;
  file_id: number;
  summary: string | null;
  key_findings: KeyFinding[] | null;
  compliance_areas: string[] | null;
  quality_score: QualityScore | null;
  overall_quality_score: number | null;
  suggested_control_links: SuggestedControlLink[] | null;
  analysis_model: string | null;
  analysis_version: number;
  analyzed_at: string;
  analyzed_by: number | null;
}
