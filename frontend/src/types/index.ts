export interface DocumentAnalysis {
  content_hash: string;
  domain: string;
  doc_type: string;
  summary: DocumentSummary;
  risk_score: RiskScore;
  ai_training_clause: boolean;
  dark_patterns_detected: DarkPattern[];
  created_at: string;
  cached: boolean;
}

export interface DocumentSummary {
  executive_summary: string;
  key_clauses: string[];
  ai_training_impact: string;
  subscription_terms: string;
  privacy_analysis: string;
  risks: string[];
  recommendation: string;
  disclaimer: string;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: RedFlag[];
}

export interface RedFlag {
  code: string;
  category: string;
  weight: number;
  description: string;
}

export interface DarkPattern {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DetectedDocument {
  docType: string;
  content: string;
  confidence: number;
}
