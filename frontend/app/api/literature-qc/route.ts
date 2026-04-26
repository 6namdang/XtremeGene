import { NextResponse } from "next/server";
import { tryBackendJson } from "@/lib/backend-proxy";
import type { LiteratureQCRequest, LiteratureQCResult } from "@/lib/types";

export async function POST(req: Request) {
  let body: LiteratureQCRequest;
  try {
    body = (await req.json()) as LiteratureQCRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.question || typeof body.question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const remote = await tryBackendJson<LiteratureQCResult>(
    "/api/literature-qc",
    body
  );
  if (!remote) {
    return NextResponse.json(
      { error: "Backend literature QC unavailable. Start backend and verify OPENAI_API_KEY." },
      { status: 502 }
    );
  }
  return NextResponse.json(remote);
}
