import { NextResponse } from "next/server";
import { buildHypothesesSuggestions } from "@/lib/demo-responses";
import { tryBackendJson } from "@/lib/backend-proxy";
import type { HypothesesRequest, HypothesisSuggestion } from "@/lib/types";

export async function POST(req: Request) {
  let body: HypothesesRequest;
  try {
    body = (await req.json()) as HypothesesRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.question || typeof body.question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const remote = await tryBackendJson<HypothesisSuggestion[]>(
    "/api/hypotheses",
    body
  );
  if (remote) return NextResponse.json(remote);

  const demo = buildHypothesesSuggestions(body.question.trim(), body.literature);
  return NextResponse.json(demo);
}
