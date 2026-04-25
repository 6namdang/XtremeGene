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
  Beaker,
  BookOpenCheck,
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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.14),transparent_55%)]" />

      <header className="relative border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Challenge 04 · The AI Scientist
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Hypothesis to runnable experiment
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Literature QC, then a full operational plan—protocol, materials,
              budget, timeline, and validation—so a lab could execute with
              confidence.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1">
              MIT Club NorCal
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1">
              MIT Club Germany
            </span>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-200/90">
              Powered by Fulcrum Science
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ol className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StepPill
            n={1}
            title="Question"
            active={step === "input"}
            done={step !== "input"}
          />
          <StepPill
            n={2}
            title="Literature QC"
            active={step === "literature"}
            done={step === "plan"}
          />
          <StepPill n={3} title="Experiment plan" active={step === "plan"} />
        </ol>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
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
                    className="rounded-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-emerald-500/35 hover:bg-emerald-500/5"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
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
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
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
                        className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4"
                      >
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                        >
                          {r.title}
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:border-zinc-500 hover:text-[var(--foreground)]"
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

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
                At-a-glance
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">QC status</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {literature ? "Complete" : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Plan</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {plan ? "Ready" : "—"}
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

            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-5 text-xs leading-relaxed text-[var(--muted)]">
              Wire a real backend by setting{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[11px] text-zinc-300">
                BACKEND_URL
              </code>{" "}
              in{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[11px] text-zinc-300">
                .env.local
              </code>
              . Next.js will forward to your{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[11px] text-zinc-300">
                POST /api/literature-qc
              </code>{" "}
              and{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[11px] text-zinc-300">
                POST /api/experiment-plan
              </code>{" "}
              routes when present.
            </div>
          </aside>
        </div>

        {plan && (
          <section
            id="experiment-plan"
            className="mt-12 scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"
          >
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
                        : "bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
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
                        <tr key={m.name + m.supplier} className="bg-[var(--input-bg)]">
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

      <footer className="relative mt-16 border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        Demo responses ship with the app for judging UX; connect your model via{" "}
        <code className="text-zinc-400">BACKEND_URL</code>.
      </footer>
    </div>
  );
}

function StepPill({
  n,
  title,
  active,
  done,
}: {
  n: number;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <li className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? "bg-emerald-500/20 text-emerald-200"
            : active
              ? "bg-sky-500/20 text-sky-200"
              : "bg-[var(--pill-idle)] text-[var(--muted)]"
        }`}
      >
        {n}
      </span>
      <span
        className={`text-sm font-medium ${
          active ? "text-[var(--foreground)]" : "text-[var(--muted)]"
        }`}
      >
        {title}
      </span>
    </li>
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
