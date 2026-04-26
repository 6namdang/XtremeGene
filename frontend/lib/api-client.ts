import type {
  ExperimentPlan,
  ExperimentPlanRequest,
  HypothesesRequest,
  HypothesisSuggestion,
  LiteratureQCResult,
} from "./types";

export async function fetchLiteratureQC(
  question: string
): Promise<LiteratureQCResult> {
  const res = await fetch("/api/literature-qc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Literature QC failed");
  }
  return res.json();
}

export async function fetchHypotheses(
  payload: HypothesesRequest
): Promise<HypothesisSuggestion[]> {
  const res = await fetch("/api/hypotheses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Hypothesis generation failed");
  }
  return res.json();
}

export async function fetchExperimentPlan(
  payload: ExperimentPlanRequest
): Promise<ExperimentPlan> {
  const res = await fetch("/api/experiment-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Plan generation failed");
  }
  return res.json();
}
