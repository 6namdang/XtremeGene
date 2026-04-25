from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator
from urllib.parse import urljoin

import requests
import trafilatura
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from lxml import html as lxml_html
from pydantic import BaseModel

# Load .env from the backend package directory (not the shell's cwd), so
# `fastapi dev` / uvicorn from the repo root still see OPENAI_API_KEY, etc.
BACKEND_DIR = Path(__file__).resolve().parent
# override=True: values in backend/.env win over an empty `export OPENAI_API_KEY=`
load_dotenv(BACKEND_DIR / ".env", override=True)

app = FastAPI(title="XtremeGene Evidence Backend")


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _resolve_db_path() -> str:
    raw = os.getenv("EVIDENCE_DB_PATH", "./evidence.db").strip() or "./evidence.db"
    candidate = Path(raw).expanduser()
    if not candidate.is_absolute():
        candidate = BACKEND_DIR / candidate
    return str(candidate.resolve())


EVIDENCE_DB_PATH = _resolve_db_path()
OPENALEX_USER_AGENT = os.getenv(
    "OPENALEX_USER_AGENT", "https://github.com/6namdang/XtremeGene"
)
PAPER_FETCH_DELAY_SECONDS = _env_float("PAPER_FETCH_DELAY_SECONDS", 0.2)
OPENALEX_PER_PAGE_MULTIPLIER = _env_int("OPENALEX_PER_PAGE_MULTIPLIER", 5)
OPENALEX_TIMEOUT_SECONDS = _env_int("OPENALEX_TIMEOUT_SECONDS", 30)
PMC_TIMEOUT_SECONDS = _env_int("PMC_TIMEOUT_SECONDS", 30)
MAX_PAPERS_DEFAULT = _env_int("MAX_PAPERS_DEFAULT", 10)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
# Reasoning / thinking models: o3-mini, o1, gpt-4o, etc.
OPENAI_AGENT1_MODEL = os.getenv("OPENAI_AGENT1_MODEL", "o3-mini")


class PaperSummary(BaseModel):
    pmcid: str
    openalex_id: str | None = None
    title: str
    source_url: str
    preview: str
    fetched_at: str


class PaperDetail(PaperSummary):
    text: str
    text_sha256: str
    figures: list[dict[str, str]]
    tables: list[dict[str, Any]]


@contextmanager
def db_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(EVIDENCE_DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    with db_connection() as conn:
        conn.executescript(
            """
            PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS papers (
              id           INTEGER PRIMARY KEY,
              pmcid        TEXT UNIQUE NOT NULL,
              openalex_id  TEXT,
              title        TEXT,
              source_url   TEXT,
              text         TEXT,
              text_sha256  TEXT,
              figures_json TEXT,
              tables_json  TEXT,
              fetched_at   TEXT
            );

            CREATE TABLE IF NOT EXISTS paper_queries (
              pmcid       TEXT NOT NULL,
              query       TEXT NOT NULL,
              fetched_at  TEXT NOT NULL,
              PRIMARY KEY (pmcid, query)
            );

            CREATE INDEX IF NOT EXISTS idx_paper_queries_query
              ON paper_queries(query);
            """
        )
        existing_columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(papers)").fetchall()
        }
        if "figures_json" not in existing_columns:
            conn.execute("ALTER TABLE papers ADD COLUMN figures_json TEXT")
        if "tables_json" not in existing_columns:
            conn.execute("ALTER TABLE papers ADD COLUMN tables_json TEXT")
        conn.commit()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_pmcid(raw: str | None) -> str | None:
    if not raw:
        return None
    normalized = raw.strip()
    if normalized.isdigit():
        return normalized
    match = re.search(r"PMC(\d+)", raw, flags=re.IGNORECASE)
    if not match:
        return None
    return match.group(1)


def extract_pmcid_from_work(work: dict[str, Any]) -> str | None:
    ids = work.get("ids", {}) or {}
    for candidate in [
        ids.get("pmcid"),
        ids.get("pmid"),
        (work.get("open_access", {}) or {}).get("oa_url"),
    ]:
        pmcid = parse_pmcid(candidate)
        if pmcid:
            return pmcid

    locations = work.get("locations") or []
    for location in locations:
        if not isinstance(location, dict):
            continue
        for key in ("landing_page_url", "pdf_url", "id"):
            pmcid = parse_pmcid(location.get(key))
            if pmcid:
                return pmcid
    return None


def _openalex_fetch_works_page(
    search_query: str, page: int, per_page: int
) -> list[dict[str, Any]]:
    response = requests.get(
        "https://api.openalex.org/works",
        params={
            "search": search_query,
            "filter": "open_access.is_oa:true",
            "per_page": per_page,
            "page": page,
            "select": "id,title,ids,open_access,locations",
        },
        headers={"User-Agent": OPENALEX_USER_AGENT},
        timeout=OPENALEX_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json().get("results", [])


def find_papers_merged(search_queries: list[str], n: int) -> list[dict[str, str]]:
    """Run OpenAlex in relevance order: try each search string, dedupe PMCIDs, stop at n."""
    per_page = min(max(n * OPENALEX_PER_PAGE_MULTIPLIER, 50), 200)
    max_pages = 5
    papers: list[dict[str, str]] = []
    seen: set[str] = set()
    for raw_q in search_queries:
        q = (raw_q or "").strip()
        if not q:
            continue
        for page in range(1, max_pages + 1):
            works = _openalex_fetch_works_page(q, page, per_page)
            if not works:
                break
            for work in works:
                pmcid = extract_pmcid_from_work(work)
                if not pmcid or pmcid in seen:
                    continue
                seen.add(pmcid)
                papers.append(
                    {
                        "pmcid": pmcid,
                        "title": (work.get("title") or f"PMC{pmcid}").strip(),
                        "openalex_id": (work.get("id") or "").strip(),
                        "source_url": f"https://pmc.ncbi.nlm.nih.gov/articles/PMC{pmcid}/",
                    }
                )
                if len(papers) >= n:
                    return papers
    return papers


def find_papers(query: str, n: int) -> list[dict[str, str]]:
    return find_papers_merged([query], n)


def _parse_json_object_loose(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def agent1_research_queries(user_query: str) -> dict[str, Any]:
    """
    One OpenAI (thinking) call: rewrite for OpenAlex + up to 2 alternates.
    Falls back to raw user text if no key or API error.
    """
    clean = user_query.strip()
    base: dict[str, Any] = {
        "primary": clean,
        "alternates": [],
        "rationale": "",
        "used_openai": False,
    }
    if not OPENAI_API_KEY or len(clean) < 3:
        base["rationale"] = "OPENAI_API_KEY not set or query too short; using your text as-is."
        return base

    prompt = f"""The user is searching open-access full-text papers indexed in OpenAlex/PMC for biomedical or life-science work.

User question (verbatim):
{clean!r}

Task: Produce search strings (not a paragraph) to find the ~10 most relevant papers.

Respond with ONLY valid JSON (no markdown):
{{
  "primary": "short OpenAlex-optimized search string, English, <= 20 words",
  "alternates": ["optional second search string", "optional third search string"],
  "rationale": "one short sentence: how you interpreted the question"
}}

Rules: alternates has at most 2 strings; use [] if a single string is enough. If the phrasing is ambiguous, pick the most likely scientific reading."""

    try:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_API_KEY)
        completion = client.chat.completions.create(
            model=OPENAI_AGENT1_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=1000,
        )
    except Exception as exc:  # noqa: BLE001 — surface any SDK/network error
        base["rationale"] = f"OpenAI call failed: {exc!s}"[:500]
        return base

    raw = (completion.choices[0].message.content or "").strip() if completion.choices else ""
    if not raw:
        base["rationale"] = "Model returned no text; using your question as the search string."
        return base

    data = _parse_json_object_loose(raw)
    if not data:
        base["rationale"] = "Could not parse model JSON; using your question as the search string."
        return base

    primary = (data.get("primary") or clean).strip() or clean
    alts = data.get("alternates")
    if isinstance(alts, str):
        alts = [alts]
    if not isinstance(alts, list):
        alts = []
    alts = [a.strip() for a in alts if isinstance(a, str) and a.strip()][:2]
    rationale = (data.get("rationale") or "").strip()

    return {
        "primary": primary,
        "alternates": alts,
        "rationale": rationale,
        "used_openai": True,
    }


def slice_text(full_text: str) -> str:
    text = full_text.strip()
    if not text:
        return ""

    lines = [line.rstrip() for line in text.splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)

    sliced = "\n".join(lines).strip()
    cutoff_pattern = re.compile(
        r"(?im)^\s*(Acknowledgments?|References?|Footnotes?|Abbreviations?)\s*$"
    )
    match = cutoff_pattern.search(sliced)
    if match:
        sliced = sliced[: match.start()].strip()
    return sliced


def is_bot_challenge(text: str) -> bool:
    lowered = text.lower()
    return (
        "checking your browser before accessing" in lowered
        or "just a moment..." in lowered
        or "cloudflare" in lowered
    )


def node_text(node: Any) -> str:
    return " ".join((node.text_content() or "").split())


def extract_figures(doc: Any, base_url: str) -> list[dict[str, str]]:
    figures: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for fig in doc.xpath("//figure"):
        img_nodes = fig.xpath(".//img[@src]")
        if not img_nodes:
            continue
        img_src = img_nodes[0].get("src") or ""
        image_url = urljoin(base_url, img_src.strip())
        if not image_url or image_url in seen_urls:
            continue
        seen_urls.add(image_url)
        caption_node = fig.xpath(".//figcaption")
        label_node = fig.xpath(".//*[contains(@class,'fig-label')]")
        caption = node_text(caption_node[0]) if caption_node else ""
        label = node_text(label_node[0]) if label_node else ""
        figures.append(
            {
                "image_url": image_url,
                "caption": caption or label or "Figure",
                "label": label,
            }
        )
    return figures


def extract_tables(doc: Any) -> list[dict[str, Any]]:
    tables: list[dict[str, Any]] = []
    for table_idx, table in enumerate(doc.xpath("//table"), start=1):
        rows = []
        for row in table.xpath(".//tr"):
            cells = [node_text(cell) for cell in row.xpath("./th|./td")]
            if any(cells):
                rows.append(cells)
        if not rows:
            continue

        caption_node = table.xpath("./caption")
        nearest_label_node = table.xpath("ancestor::figure[1]//*[contains(@class,'label')]")
        caption = node_text(caption_node[0]) if caption_node else ""
        label = node_text(nearest_label_node[0]) if nearest_label_node else f"Table {table_idx}"
        tables.append(
            {
                "label": label or f"Table {table_idx}",
                "caption": caption,
                "rows": rows,
            }
        )
    return tables


def fetch_paper_content(pmcid: str) -> tuple[str, list[dict[str, str]], list[dict[str, Any]]]:
    url = f"https://pmc.ncbi.nlm.nih.gov/articles/PMC{pmcid}/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }

    for attempt in range(1, 4):
        response = requests.get(url, headers=headers, timeout=PMC_TIMEOUT_SECONDS)
        response.raise_for_status()
        html = response.text
        if is_bot_challenge(html):
            time.sleep(attempt)
            continue

        extracted = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            include_links=False,
            favor_precision=True,
        )
        if not extracted:
            time.sleep(attempt)
            continue
        clean_text = slice_text(extracted)
        if is_bot_challenge(clean_text) or len(clean_text) < 300:
            time.sleep(attempt)
            continue
        doc = lxml_html.fromstring(html)
        figures = extract_figures(doc, url)
        tables = extract_tables(doc)
        return clean_text, figures, tables

    raise ValueError(f"Failed to fetch clean text for PMC{pmcid}")


def upsert_paper(
    *,
    pmcid: str,
    openalex_id: str,
    title: str,
    source_url: str,
    text: str,
    figures: list[dict[str, str]],
    tables: list[dict[str, Any]],
    query: str,
) -> dict[str, str]:
    fetched_at = now_iso()
    text_sha256 = hashlib.sha256(text.encode("utf-8")).hexdigest()

    with db_connection() as conn:
        conn.execute(
            """
            INSERT INTO papers (pmcid, openalex_id, title, source_url, text, text_sha256, figures_json, tables_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(pmcid) DO UPDATE SET
              openalex_id=excluded.openalex_id,
              title=excluded.title,
              source_url=excluded.source_url,
              text=excluded.text,
              text_sha256=excluded.text_sha256,
              figures_json=excluded.figures_json,
              tables_json=excluded.tables_json,
              fetched_at=excluded.fetched_at
            """,
            (
                pmcid,
                openalex_id,
                title,
                source_url,
                text,
                text_sha256,
                json.dumps(figures, ensure_ascii=False),
                json.dumps(tables, ensure_ascii=False),
                fetched_at,
            ),
        )
        conn.execute(
            """
            INSERT INTO paper_queries (pmcid, query, fetched_at)
            VALUES (?, ?, ?)
            ON CONFLICT(pmcid, query) DO UPDATE SET
              fetched_at=excluded.fetched_at
            """,
            (pmcid, query, fetched_at),
        )
        conn.commit()

    return {
        "pmcid": pmcid,
        "openalex_id": openalex_id,
        "title": title,
        "source_url": source_url,
        "text_sha256": text_sha256,
        "fetched_at": fetched_at,
        "figure_count": str(len(figures)),
        "table_count": str(len(tables)),
    }


def preview_text(text: str, size: int = 300) -> str:
    normalized = re.sub(r"\s+", " ", text).strip()
    if len(normalized) <= size:
        return normalized
    return normalized[:size].rstrip() + "..."


def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=True)}\n\n"


init_db()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/papers/stream")
def stream_papers(
    query: str = Query(..., min_length=3),
    n: int = Query(default=MAX_PAPERS_DEFAULT, ge=1, le=50),
) -> StreamingResponse:
    clean_query = query.strip()

    def event_stream() -> Generator[str, None, None]:
        yield sse(
            "agent1_start",
            {"message": "Agent 1 is reasoning about your search…"},
        )
        try:
            agent1 = agent1_research_queries(clean_query)
        except Exception as exc:  # noqa: BLE001
            yield sse("error", {"message": f"Agent 1 failed: {exc}"})
            return

        search_order: list[str] = []
        if agent1.get("used_openai"):
            yield sse(
                "agent1_queries",
                {
                    "user_query": clean_query,
                    "primary": agent1.get("primary", clean_query),
                    "alternates": agent1.get("alternates", []),
                    "rationale": agent1.get("rationale", ""),
                },
            )
            search_order = [agent1["primary"]] + list(agent1.get("alternates", []))
        else:
            yield sse(
                "agent1_skipped",
                {
                    "message": agent1.get("rationale", "Using your text for OpenAlex."),
                    "user_query": clean_query,
                },
            )
            search_order = [clean_query]

        search_order = [s.strip() for s in search_order if s and s.strip()]
        if not search_order:
            search_order = [clean_query]

        try:
            papers = find_papers_merged(search_order, n)
        except Exception as exc:  # noqa: BLE001
            yield sse("error", {"message": f"OpenAlex search failed: {exc}"})
            return

        yield sse(
            "candidates",
            {
                "query": clean_query,
                "search_queries": search_order,
                "total": len(papers),
                "papers": [
                    {
                        "pmcid": paper["pmcid"],
                        "title": paper["title"],
                        "source_url": paper["source_url"],
                    }
                    for paper in papers
                ],
            },
        )

        total = len(papers)
        done = 0
        for idx, paper in enumerate(papers, start=1):
            pmcid = paper["pmcid"]
            try:
                text, figures, tables = fetch_paper_content(pmcid)
                stored = upsert_paper(
                    pmcid=pmcid,
                    openalex_id=paper["openalex_id"],
                    title=paper["title"],
                    source_url=paper["source_url"],
                    text=text,
                    figures=figures,
                    tables=tables,
                    query=clean_query,
                )
                done += 1
                yield sse(
                    "paper",
                    {
                        "pmcid": pmcid,
                        "openalex_id": stored["openalex_id"],
                        "title": stored["title"],
                        "source_url": stored["source_url"],
                        "preview": preview_text(text),
                        "fetched_at": stored["fetched_at"],
                        "figure_count": int(stored["figure_count"]),
                        "table_count": int(stored["table_count"]),
                        "done": done,
                        "total": total,
                    },
                )
                yield sse("progress", {"done": done, "total": total})
            except Exception as exc:
                yield sse(
                    "paper_error",
                    {
                        "pmcid": pmcid,
                        "title": paper["title"],
                        "message": str(exc),
                        "done": done,
                        "total": total,
                    },
                )

            if idx < total:
                time.sleep(PAPER_FETCH_DELAY_SECONDS)

        yield sse("done", {"done": done, "total": total})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/papers/{pmcid}", response_model=PaperDetail)
def get_paper_detail(pmcid: str) -> PaperDetail:
    clean_pmcid = parse_pmcid(pmcid)
    if not clean_pmcid:
        raise HTTPException(status_code=400, detail="Invalid PMCID")
    with db_connection() as conn:
        row = conn.execute(
            """
            SELECT pmcid, openalex_id, title, source_url, text, text_sha256, figures_json, tables_json, fetched_at
            FROM papers
            WHERE pmcid = ?
            """,
            (clean_pmcid,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Paper not found")

    text = row["text"] or ""
    figures = json.loads(row["figures_json"]) if row["figures_json"] else []
    tables = json.loads(row["tables_json"]) if row["tables_json"] else []
    return PaperDetail(
        pmcid=row["pmcid"],
        openalex_id=row["openalex_id"],
        title=row["title"] or f"PMC{row['pmcid']}",
        source_url=row["source_url"] or f"https://pmc.ncbi.nlm.nih.gov/articles/PMC{row['pmcid']}/",
        preview=preview_text(text),
        fetched_at=row["fetched_at"] or "",
        text=text,
        text_sha256=row["text_sha256"] or "",
        figures=figures,
        tables=tables,
    )


if __name__ == "__main__":
    import uvicorn

    _port = _env_int("PORT", 8000)
    uvicorn.run("main:app", host="127.0.0.1", port=_port, reload=True)