import { NextResponse } from "next/server";
import { buildExperimentPlan } from "@/lib/demo-responses";
import { tryBackendJson } from "@/lib/backend-proxy";
import type {
  ExperimentPlan,
  ExperimentPlanRequest,
  LiteratureQCResult,
} from "@/lib/types";

export async function POST(req: Request) {
  let body: ExperimentPlanRequest;
  try {
    body = (await req.json()) as ExperimentPlanRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.question || typeof body.question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const lit = body.literature as LiteratureQCResult | undefined;
  if (!lit || !lit.novelty) {
    return NextResponse.json(
      { error: "literature result with novelty is required" },
      { status: 400 }
    );
  }

  const remote = await tryBackendJson<ExperimentPlan>(
    "/api/experiment-plan",
    body
  );
  if (remote) return NextResponse.json(remote);

  const demo = buildExperimentPlan(body.question.trim(), lit);
  return NextResponse.json(demo);
}
