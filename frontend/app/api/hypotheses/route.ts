import { NextResponse } from "next/server";
import { tryBackendJson } from "@/lib/backend-proxy";
import type { HypothesesRequest, HypothesesResult, LiteratureQCResult } from "@/lib/types";

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
  const lit = body.literature as LiteratureQCResult | undefined;
  if (!lit || !lit.novelty || !Array.isArray(lit.references)) {
    return NextResponse.json(
      { error: "literature result with references is required" },
      { status: 400 }
    );
  }

  const remote = await tryBackendJson<HypothesesResult>("/api/hypotheses", body);
  if (!remote) {
    return NextResponse.json(
      { error: "Backend hypotheses unavailable. Start backend and verify OPENAI/ESMFold connectivity." },
      { status: 502 }
    );
  }
  return NextResponse.json(remote);
}
