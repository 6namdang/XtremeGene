export type NoveltySignal =
  | "not_found"
  | "similar_work_exists"
  | "exact_match_found";

export interface LiteratureReference {
  title: string;
  authors?: string;
  year?: number;
  url: string;
  snippet?: string;
  source?: string;
}

export interface LiteratureQCResult {
  novelty: NoveltySignal;
  summary: string;
  references: LiteratureReference[];
}

export interface ProtocolStep {
  stepNumber: number;
  title: string;
  description: string;
  duration?: string;
  notes?: string;
}

export interface MaterialItem {
  name: string;
  catalogNumber?: string;
  supplier: string;
  quantity: string;
  estimatedUnitCost?: number;
  lineTotal?: number;
  currency?: string;
}

export interface BudgetLine {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

export interface TimelinePhase {
  phase: string;
  startWeek: number;
  endWeek: number;
  description: string;
  dependencies?: string[];
}

export interface ExperimentPlan {
  title: string;
  hypothesisSummary: string;
  protocolOriginNote?: string;
  protocol: ProtocolStep[];
  materials: MaterialItem[];
  budget: {
    lines: BudgetLine[];
    total: number;
    currency: string;
    assumptions: string[];
  };
  timeline: TimelinePhase[];
  validation: {
    primaryEndpoints: string[];
    successCriteria: string[];
    controls: string[];
    analyticalMethods: string[];
  };
  staffingNotes?: string[];
  riskMitigation?: string[];
}

export interface LiteratureQCRequest {
  question: string;
}

export interface ExperimentPlanRequest {
  question: string;
  literature: LiteratureQCResult;
}

export interface PaperPreview {
  pmcid: string;
  openalex_id?: string | null;
  title: string;
  source_url: string;
  preview: string;
  fetched_at: string;
  figure_count?: number;
  table_count?: number;
}

export interface PaperFigure {
  image_url: string;
  caption: string;
  label?: string;
}

export interface PaperTable {
  label: string;
  caption?: string;
  rows: string[][];
}

export interface PaperDetail extends PaperPreview {
  text: string;
  text_sha256: string;
  figures: PaperFigure[];
  tables: PaperTable[];
}
