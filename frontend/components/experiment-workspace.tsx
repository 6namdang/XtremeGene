"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Beaker,
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Coins,
  FlaskConical,
  Layers,
  Loader2,
  Sparkles,
  Timer,
  Wand2,
} from "lucide-react";
import { fetchExperimentPlan, fetchLiteratureQC } from "@/lib/api-client";
import type { ExperimentPlan, LiteratureQCResult } from "@/lib/types";
import { NoveltyBadge, noveltyHelp } from "./novelty-badge";
import { PaperEvidencePanel } from "./paper-evidence-panel";

const SAMPLE_QUESTIONS = [
  {
    label: "Diagnostics",
    text: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    label: "Gut health",
    text: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell biology",
    text: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose’s superior membrane stabilization at low temperatures.",
  },
  {
    label: "Climate",
    text: "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
] as const;

type Step = "input" | "literature" | "plan";

const SECTION_IDS = [
  "overview",
  "protocol",
  "materials",
  "budget",
  "timeline",
  "validation",
] as const;

export function ExperimentWorkspace() {
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [literature, setLiterature] = useState<LiteratureQCResult | null>(null);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [qcLoading, setQcLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<(typeof SECTION_IDS)[number]>("overview");

  const charCount = question.length;
  const canRunQc = question.trim().length >= 20;

  const runLiteratureQc = useCallback(async () => {
    setError(null);
    setQcLoading(true);
    setLiterature(null);
    setPlan(null);
    try {
      const res = await fetchLiteratureQC(question.trim());
      setLiterature(res);
      setStep("literature");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setQcLoading(false);
    }
  }, [question]);

  const runPlan = useCallback(async () => {
    if (!literature) return;
    setError(null);
    setPlanLoading(true);
    setPlan(null);
    try {
      const res = await fetchExperimentPlan({
        question: question.trim(),
        literature,
      });
      setPlan(res);
      setStep("plan");
      setActiveSection("overview");
      requestAnimationFrame(() => {
        document
          .getElementById("experiment-plan")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlanLoading(false);
    }
  }, [question, literature]);

  const reset = useCallback(() => {
    setStep("input");
    setLiterature(null);
    setPlan(null);
    setError(null);
    setActiveSection("overview");
  }, []);

  const fmtMoney = useMemo(
    () => (n: number, c: string) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0,
      }).format(n),
    []
  );

  useEffect(() => {
    if (!plan) return;
    const ids = SECTION_IDS.map((id) => `section-${id}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        const key = visible.target.id.replace("section-", "") as (typeof SECTION_IDS)[number];
        if (SECTION_IDS.includes(key)) setActiveSection(key);
      },
      { rootMargin: "-42% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [plan]);

  return (
    <div className="relative min-h-dvh min-h-screen overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-emerald-950"
      >
        Skip to workflow
      </a>

      <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" />
      <div
        className="pointer-events-none absolute inset-0 hero-aurora opacity-90"
        aria-hidden
      />

      <nav
        aria-label="Page"
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)]/90 backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group flex min-w-0 items-center gap-2.5 rounded-lg pr-2 transition-colors hover:text-[var(--foreground)]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-emerald-400 shadow-[var(--shadow)] transition-transform group-hover:scale-105"
              aria-hidden
            >
              <FlaskConical className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--foreground)]">
                The AI Scientist
              </span>
              <span className="block truncate text-xs text-[var(--muted)]">
                XtremeGene
              </span>
            </span>
          </a>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <NavJump href="#panel-question" label="Question" current={step === "input"} />
            <span className="px-0.5 text-[var(--muted)] sm:px-1" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </span>
            <NavJump
              href="#panel-literature"
              label="Literature"
              current={step === "literature"}
              disabled={!literature}
            />
            <span className="px-0.5 text-[var(--muted)] sm:px-1" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </span>
            <NavJump
              href="#experiment-plan"
              label="Plan"
              current={step === "plan"}
              disabled={!plan}
            />
          </div>
        </div>
      </nav>

      <header className="relative border-b border-[var(--border)] bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Challenge 04 · The AI Scientist
            </p>
            <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
              From hypothesis to a lab-ready{" "}
              <span className="bg-gradient-to-r from-emerald-200 to-teal-300/90 bg-clip-text text-transparent">
                experiment plan
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              Literature QC, then protocol, materials, budget, timeline, and
              validation—so your team can execute with clarity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[var(--muted)] transition hover:border-zinc-600/50 hover:text-zinc-300">
              MIT Club NorCal
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[var(--muted)] transition hover:border-zinc-600/50 hover:text-zinc-300">
              MIT Club Germany
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-200/95 ring-1 ring-emerald-500/15">
              Powered by Fulcrum Science
            </span>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="relative mx-auto max-w-6xl scroll-mt-28 px-4 py-8 sm:px-6 sm:py-10"
      >
        <StepRail
          step={step}
          hasLiterature={!!literature}
          hasPlan={!!plan}
          onStepChange={setStep}
        />

        <div className="mb-8">
          <PaperEvidencePanel />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6" aria-label="Workflow">
            <div
              id="panel-question"
              className="interactive-surface scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
                    <FlaskConical className="h-5 w-5 text-emerald-400" aria-hidden />
                    Scientific question
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    State the intervention, measurable outcome, threshold, and
                    control where possible.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                    charCount >= 20
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-[var(--pill-idle)] text-[var(--muted)]"
                  }`}
                >
                  {charCount} chars
                </span>
              </div>

              <label htmlFor="hypothesis" className="sr-only">
                Hypothesis or scientific question
              </label>
              <textarea
                id="hypothesis"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={8}
                placeholder="Example: Replacing sucrose with trehalose in freezing medium will increase post-thaw HeLa viability by ≥15 percentage points vs standard 10% DMSO…"
                className="mt-4 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)] outline-none ring-emerald-500/0 transition placeholder:text-zinc-500 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/15"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="w-full text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Sample hypotheses
                </span>
                {SAMPLE_QUESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setQuestion(s.text)}
                    className="rounded-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-emerald-500/40 hover:bg-emerald-500/8 active:scale-[0.98] motion-reduce:active:scale-100"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canRunQc || qcLoading}
                  onClick={runLiteratureQc}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  {qcLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <BookOpenCheck className="h-4 w-4" aria-hidden />
                  )}
                  Run literature check
                </button>
                {(literature || plan) && (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
                  >
                    Start over
                  </button>
                )}
              </div>
              {!canRunQc && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Add a bit more detail (at least ~20 characters) so the check has
                  enough context.
                </p>
              )}
            </div>

            {literature && (
              <div
                id="panel-literature"
                className="animate-fade-up interactive-surface scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
                      <Layers className="h-5 w-5 text-sky-400" aria-hidden />
                      Literature QC
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {noveltyHelp(literature.novelty)}.{" "}
                      <span className="text-zinc-400">
                        This is a fast signal—not a full review.
                      </span>
                    </p>
                  </div>
                  <NoveltyBadge signal={literature.novelty} />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
                  {literature.summary}
                </p>

                {literature.references.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {literature.references.map((r) => (
                      <li
                        key={r.url + r.title}
                        className="group/reference rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4 transition hover:border-emerald-500/25"
                      >
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                        >
                          <span className="min-w-0 flex-1 leading-snug">
                            {r.title}
                          </span>
                          <ArrowUpRight
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/60 opacity-0 transition group-hover/reference:translate-x-0.5 group-hover/reference:-translate-y-0.5 group-hover/reference:opacity-100"
                            aria-hidden
                          />
                        </a>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {[r.authors, r.year].filter(Boolean).join(" · ")}
                          {r.source ? ` · ${r.source}` : ""}
                        </p>
                        {r.snippet && (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                            {r.snippet}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runPlan}
                    disabled={planLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 hover:shadow-sky-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 motion-reduce:active:scale-100"
                  >
                    {planLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Wand2 className="h-4 w-4" aria-hidden />
                    )}
                    Generate experiment plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("input")}
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:border-zinc-500 hover:bg-white/[0.04] hover:text-[var(--foreground)] active:scale-[0.99] motion-reduce:active:scale-100"
                  >
                    Edit question
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              >
                {error}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start">
            <div className="interactive-surface overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
              <div className="border-b border-[var(--border)] bg-gradient-to-br from-amber-500/10 to-transparent p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10">
                    <Sparkles
                      className="h-4 w-4 text-amber-200"
                      aria-hidden
                    />
                  </span>
                  At-a-glance
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  Live summary as you move through the workflow.
                </p>
              </div>
              <dl className="space-y-3 p-4 text-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted)]">Literature QC</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                    {literature ? (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        Done
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted)]">Experiment plan</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                    {plan ? (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        Ready
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                {plan && (
                  <>
                    <div className="border-t border-[var(--border)] pt-3" />
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Budget (est.)</dt>
                      <dd className="font-semibold tabular-nums text-emerald-300">
                        {fmtMoney(plan.budget.total, plan.budget.currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Timeline</dt>
                      <dd className="text-right font-medium text-[var(--foreground)]">
                        {Math.max(...plan.timeline.map((t) => t.endWeek), 0)} wk
                        <span className="block text-xs font-normal text-[var(--muted)]">
                          last phase ends week{" "}
                          {Math.max(...plan.timeline.map((t) => t.endWeek), 0)}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Materials</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {plan.materials.length} line items
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            <details className="group rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] text-left text-xs leading-relaxed text-[var(--muted)] open:border-zinc-600/30 open:bg-zinc-900/30">
              <summary className="cursor-pointer list-none p-4 font-medium text-zinc-400 transition marker:content-[''] hover:text-zinc-300 [&::-webkit-details-marker]:hidden sm:p-5">
                <span className="inline-flex w-full items-center justify-between gap-2">
                  <span>Integrate your backend (optional)</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" aria-hidden />
                </span>
              </summary>
              <div className="border-t border-[var(--border)] px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
                <p className="pt-2">
                  Wire a real backend by setting{" "}
                  <code className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-zinc-200">
                    BACKEND_URL
                  </code>{" "}
                  in{" "}
                  <code className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-zinc-200">
                    .env.local
                  </code>
                  . Next.js will forward to your{" "}
                  <code className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-zinc-200">
                    POST /api/literature-qc
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-zinc-200">
                    POST /api/experiment-plan
                  </code>{" "}
                  routes when present.
                </p>
              </div>
            </details>
          </aside>
        </div>

        {plan && (
          <section
            id="experiment-plan"
            className="animate-fade-up mt-12 scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-gradient-to-r from-emerald-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)]">
                  <ClipboardList className="h-6 w-6 text-emerald-400" aria-hidden />
                  Experiment plan
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
                  {plan.title}
                </p>
              </div>
              <nav
                aria-label="Plan sections"
                className="flex flex-wrap gap-2"
              >
                {SECTION_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveSection(id);
                      document
                        .getElementById(`section-${id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                      activeSection === id
                        ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/40"
                        : "bg-[var(--input-bg)] text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)] active:scale-95"
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </nav>
            </div>

            <div className="divide-y divide-[var(--border)]">
              <PlanBlock id="section-overview" title="Overview">
                <p className="text-sm leading-relaxed text-zinc-300">
                  {plan.hypothesisSummary}
                </p>
                {plan.protocolOriginNote && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    <span className="font-medium text-zinc-400">
                      Protocol grounding:{" "}
                    </span>
                    {plan.protocolOriginNote}
                  </p>
                )}
                {(plan.staffingNotes || plan.riskMitigation) && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {plan.staffingNotes && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Staffing
                        </h4>
                        <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                          {plan.staffingNotes.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.riskMitigation && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Risks
                        </h4>
                        <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                          {plan.riskMitigation.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </PlanBlock>

              <PlanBlock id="section-protocol" title="Protocol" icon={Beaker}>
                <ol className="space-y-4">
                  {plan.protocol.map((p) => (
                    <li
                      key={p.stepNumber}
                      className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-300">
                        {p.stepNumber}
                      </span>
                      <div>
                        <h4 className="font-semibold text-[var(--foreground)]">
                          {p.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                          {p.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                          {p.duration && (
                            <span className="rounded-md bg-black/30 px-2 py-0.5">
                              {p.duration}
                            </span>
                          )}
                          {p.notes && (
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-100/90">
                              {p.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </PlanBlock>

              <PlanBlock
                id="section-materials"
                title="Materials & supply chain"
                icon={FlaskConical}
              >
                <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-black/30 text-xs uppercase tracking-wide text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium">Supplier</th>
                        <th className="px-4 py-3 font-medium">Catalog</th>
                        <th className="px-4 py-3 font-medium">Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {plan.materials.map((m) => (
                        <tr
                          key={m.name + m.supplier}
                          className="bg-[var(--input-bg)] transition hover:bg-zinc-800/50"
                        >
                          <td className="px-4 py-3 font-medium text-zinc-200">
                            {m.name}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{m.supplier}</td>
                          <td className="px-4 py-3 text-zinc-400">
                            {m.catalogNumber ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{m.quantity}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                            {m.lineTotal != null
                              ? fmtMoney(
                                  m.lineTotal,
                                  m.currency ?? plan.budget.currency
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PlanBlock>

              <PlanBlock id="section-budget" title="Budget" icon={Coins}>
                <ul className="space-y-2">
                  {plan.budget.lines.map((line) => (
                    <li
                      key={line.description}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-zinc-200">{line.category}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {line.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-emerald-300">
                        {fmtMoney(line.amount, line.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/25">
                  <span className="text-sm font-semibold text-emerald-100">
                    Total (estimated)
                  </span>
                  <span className="text-lg font-bold tabular-nums text-emerald-200">
                    {fmtMoney(plan.budget.total, plan.budget.currency)}
                  </span>
                </div>
                <ul className="mt-3 list-inside list-disc text-xs text-[var(--muted)]">
                  {plan.budget.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </PlanBlock>

              <PlanBlock id="section-timeline" title="Timeline" icon={Timer}>
                <div className="relative pl-4">
                  <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--border)]" />
                  <ul className="space-y-4">
                    {plan.timeline.map((t) => (
                      <li key={t.phase} className="relative pl-6">
                        <span className="absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-emerald-400/80 bg-[var(--card)]" />
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-semibold text-[var(--foreground)]">
                              {t.phase}
                            </h4>
                            <span className="rounded-md bg-black/35 px-2 py-0.5 text-xs tabular-nums text-zinc-300">
                              wk {t.startWeek}–{t.endWeek}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{t.description}</p>
                          {t.dependencies && t.dependencies.length > 0 && (
                            <p className="mt-2 text-xs text-[var(--muted)]">
                              <span className="font-medium text-zinc-500">
                                Depends on:{" "}
                              </span>
                              {t.dependencies.join(", ")}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </PlanBlock>

              <PlanBlock
                id="section-validation"
                title="Validation"
                icon={BookOpenCheck}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <ValidationList
                    title="Primary endpoints"
                    items={plan.validation.primaryEndpoints}
                  />
                  <ValidationList
                    title="Success criteria"
                    items={plan.validation.successCriteria}
                  />
                  <ValidationList title="Controls" items={plan.validation.controls} />
                  <ValidationList
                    title="Analytical methods"
                    items={plan.validation.analyticalMethods}
                  />
                </div>
              </PlanBlock>
            </div>
          </section>
        )}
      </main>

      <footer className="relative mt-20 border-t border-[var(--border)] bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
              Demo responses ship with the app for judging UX. Connect your
              model by setting{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                BACKEND_URL
              </code>
              .
            </p>
            <a
              href="#main-content"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("panel-question")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-medium text-zinc-500 transition hover:text-emerald-300/90"
            >
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavJump({
  href,
  label,
  current,
  disabled,
}: {
  href: string;
  label: string;
  current: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-600 sm:px-3 sm:text-sm"
        aria-disabled
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        const id = href.slice(1);
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }}
      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
        current
          ? "bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-500/25"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      {label}
    </a>
  );
}

const STEP_RAIL: {
  id: Step;
  n: number;
  title: string;
  targetId: string;
}[] = [
  { id: "input", n: 1, title: "Question", targetId: "panel-question" },
  { id: "literature", n: 2, title: "Literature QC", targetId: "panel-literature" },
  { id: "plan", n: 3, title: "Experiment plan", targetId: "experiment-plan" },
];

function StepRail({
  step,
  hasLiterature,
  hasPlan,
  onStepChange,
}: {
  step: Step;
  hasLiterature: boolean;
  hasPlan: boolean;
  onStepChange: (s: Step) => void;
}) {
  const canGo = (s: Step) => {
    if (s === "input") return true;
    if (s === "literature") return hasLiterature;
    return hasPlan;
  };

  const go = (s: Step) => {
    if (!canGo(s)) return;
    onStepChange(s);
    const target = STEP_RAIL.find((x) => x.id === s)?.targetId;
    if (target) {
      requestAnimationFrame(() => {
        document
          .getElementById(target)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <div className="mb-10" role="navigation" aria-label="Workflow progress">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--muted)] sm:text-left">
        Your path
      </p>
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {STEP_RAIL.map((item) => {
          const available = canGo(item.id);
          const isActive = step === item.id;
          const isComplete =
            (item.id === "input" && step !== "input") ||
            (item.id === "literature" && step === "plan");
          const showCheck = isComplete;

          return (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => go(item.id)}
                disabled={!available}
                className={`group/step flex w-full flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition ${
                  isActive
                    ? "border-emerald-500/35 bg-emerald-500/[0.08] ring-1 ring-emerald-500/20"
                    : showCheck
                      ? "border-[var(--border)] bg-[var(--card)] hover:border-zinc-600/40"
                      : "border-[var(--border)] bg-[var(--card)]/80 opacity-70"
                } ${
                  available
                    ? "cursor-pointer hover:border-zinc-500/35 focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                    : "cursor-not-allowed"
                } sm:px-3 sm:py-5`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    showCheck
                      ? "bg-emerald-500/25 text-emerald-200"
                      : isActive
                        ? "bg-sky-500/20 text-sky-100 ring-2 ring-sky-500/35"
                        : "bg-[var(--pill-idle)] text-[var(--muted)]"
                  } ${
                    available
                      ? "group-hover/step:scale-[1.04]"
                      : ""
                  } motion-reduce:group-hover/step:scale-100`}
                >
                  {showCheck ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    item.n
                  )}
                </span>
                <span
                  className={`line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug sm:text-sm ${
                    isActive
                      ? "text-[var(--foreground)]"
                      : showCheck
                        ? "text-zinc-300"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {item.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlanBlock({
  id,
  title,
  children,
  icon: Icon,
}: {
  id: string;
  title: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div id={id} className="scroll-mt-24 p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold capitalize text-[var(--foreground)]">
        {Icon && <Icon className="h-5 w-5 text-emerald-400" aria-hidden />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function ValidationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h4>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
