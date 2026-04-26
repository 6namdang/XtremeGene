"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  BookOpenCheck,
  Loader2,
} from "lucide-react";
import { fetchExperimentPlan, fetchHypotheses, fetchLiteratureQC } from "@/lib/api-client";
import type { ExperimentPlan, HypothesisSuggestion, LiteratureQCResult } from "@/lib/types";
import { NoveltyBadge, noveltyHelp } from "./novelty-badge";
import { HeroSphere } from "./hero-sphere";

const SAMPLE_QUESTIONS = [
  {
    label: "RIC-3 Folding",
    text: "Will C. elegans RIC-3 co-expression support correct folding and surface trafficking of human α7 nAChR in HEK293 cells at levels at least 40% higher than human RIC-3, measured by surface biotinylation assay?",
  },
  {
    label: "Transmembrane stability",
    text: "Will the transmembrane domain of human α7 nAChR show significantly reduced membrane insertion efficiency without RIC-3 chaperone support, measured by patch-clamp electrophysiology showing at least 30% reduction in channel open probability?",
  },
  {
    label: "GTS-21 agonism",
    text: "Will GTS-21 partial agonist activate human α7 nAChR with at least 50% lower desensitization rate compared to acetylcholine, measured by whole-cell patch clamp in HEK293 cells expressing α7 with C. elegans RIC-3?",
  },
] as const;

type Step = "input" | "literature" | "hypotheses" | "plan";

const SECTION_IDS = [
  "overview",
  "protocol",
  "materials",
  "budget",
  "timeline",
  "validation",
] as const;

export function ExperimentWorkspace() {
  const [question, setQuestion] = useState<string>("");
  const [step, setStep] = useState<Step>("input");
  const [literature, setLiterature] = useState<LiteratureQCResult | null>(null);
  const [suggestions, setSuggestions] = useState<HypothesisSuggestion[] | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<HypothesisSuggestion | null>(null);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [deselectedRefs, setDeselectedRefs] = useState<Set<string>>(new Set());
  const [litKeywords, setLitKeywords] = useState<string>("");
  const [revealValidation, setRevealValidation] = useState(false);
  const [qcLoading, setQcLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<(typeof SECTION_IDS)[number]>("overview");
  const [sliderHeight, setSliderHeight] = useState<number | undefined>(undefined);
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0, hovered: false });
  const slideRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const heroRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const charCount = question.length;
  const canRunQc = question.trim().length >= 20;
  const stepIndex =
    step === "input" ? 0 :
    step === "literature" ? 1 :
    step === "hypotheses" ? 2 : 3;

  const goBack = useCallback(() => {
    if (step === "literature") setStep("input");
    else if (step === "hypotheses") setStep("literature");
    else if (step === "plan") setStep("hypotheses");
  }, [step]);

  const runLiteratureQc = useCallback(async () => {
    setError(null);
    setQcLoading(true);
    setRevealValidation(false);
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

  const runHypotheses = useCallback(async () => {
    if (!literature) return;
    setError(null);
    setSuggestionsLoading(true);
    setSuggestions(null);
    setSelectedSuggestion(null);
    try {
      const filteredLit = {
        ...literature,
        references: literature.references.filter(
          (r) => !deselectedRefs.has(r.url + r.title)
        ),
      };
      const res = await fetchHypotheses({ question: question.trim(), literature: filteredLit });
      setSuggestions(res);
      setStep("hypotheses");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [question, literature]);

  const runPlan = useCallback(async () => {
    if (!literature) return;
    setError(null);
    setPlanLoading(true);
    setPlan(null);
    try {
      const res = await fetchExperimentPlan({
        question: selectedSuggestion ? selectedSuggestion.description : question.trim(),
        literature,
      });
      setPlan(res);
      setStep("plan");
      setActiveSection("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlanLoading(false);
    }
  }, [question, literature]);

  const reset = useCallback(() => {
    setStep("input");
    setLiterature(null);
    setDeselectedRefs(new Set());
    setSuggestions(null);
    setSelectedSuggestion(null);
    setPlan(null);
    setRevealValidation(false);
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

  const minimalThemeVars: CSSProperties = {
    "--border": "rgba(255,255,255,0.12)",
    "--card": "#000000",
    "--card-muted": "#000000",
    "--input-bg": "#050505",
    "--foreground": "#ffffff",
    "--muted": "#a1a1aa",
    "--header-bg": "#000000",
    "--pill-idle": "rgba(255,255,255,0.08)",
    "--shadow": "none",
  } as CSSProperties;

  useEffect(() => {
    if (!literature) {
      setRevealValidation(false);
      setDeselectedRefs(new Set());
      return;
    }
    setDeselectedRefs(new Set());
    const timer = window.setTimeout(() => setRevealValidation(true), 30);
    return () => window.clearTimeout(timer);
  }, [literature]);

  useEffect(() => {
    const el = slideRefs.current[stepIndex];
    if (!el) return;
    setSliderHeight(el.scrollHeight);
    const obs = new ResizeObserver(() => setSliderHeight(el.scrollHeight));
    obs.observe(el);
    return () => obs.disconnect();
  }, [stepIndex]);

  useEffect(() => {
    if (!mainRef.current) return;
    const top = mainRef.current.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top, behavior: "smooth" });
  }, [stepIndex]);

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
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#000000] text-white"
      style={minimalThemeVars}
    >

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#000000]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="FoldForward" className="h-[54px] w-[54px] rounded-lg object-contain" style={{ filter: "invert(1)" }} />
              <p className="text-[22px] font-medium tracking-[-0.02em] text-white">
                <span className="font-semibold">Fold</span>
                <span className="font-normal text-white/90">Forward</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>Hack-Nation 2026</span>
              <span className="hidden sm:inline">α7 nAChR</span>
            </div>
          </div>
        </div>
      </header>

      <section
        ref={heroRef}
        className="relative flex min-h-[calc(100vh-49px)] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center"
        onMouseMove={(e) => {
          if (!heroRef.current) return;
          const r = heroRef.current.getBoundingClientRect();
          setHeroMouse({
            x:       ((e.clientX - r.left) / r.width)  * 2 - 1,
            y:      -((e.clientY - r.top)  / r.height) * 2 + 1,
            hovered: true,
          });
        }}
        onMouseLeave={() => setHeroMouse({ x: 0, y: 0, hovered: false })}
      >
        <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.55 }}>
          <HeroSphere mouseX={heroMouse.x} mouseY={heroMouse.y} isHovered={heroMouse.hovered} />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI-native science
          </div>
          <h1 className="max-w-2xl text-[44px] font-semibold tracking-[-0.03em] text-white sm:text-[68px] sm:leading-[0.93]">
            <span
              className="block transition-transform duration-700 ease-out"
              style={{ transform: `translate(${heroMouse.x * -18}px, ${heroMouse.y * -10}px)` }}
            >
              Research question to
            </span>
            <span
              className="block text-white/70 transition-transform duration-700 ease-out"
              style={{ transform: `translate(${heroMouse.x * -8}px, ${heroMouse.y * -5}px)` }}
            >
              runnable experiment.
            </span>
          </h1>
          <p className="mt-5 text-[18px] font-light tracking-[-0.01em] text-zinc-400">
            One question. Fifteen AI-agents. A complete experiment plan.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!mainRef.current) return;
              const top = mainRef.current.getBoundingClientRect().top + window.scrollY - 56;
              window.scrollTo({ top, behavior: "smooth" });
            }}
            className="mt-10 inline-flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-7 py-3.5 text-[15px] font-semibold text-emerald-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            Ask a research question
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </section>

      <main ref={mainRef} className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="relative">
          {step !== "input" && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="absolute -top-6 left-0 flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <StepTracker
            step={step}
            stepIndex={stepIndex}
            canOpenValidation={Boolean(literature)}
            canOpenHypotheses={Boolean(suggestions)}
            canOpenPlan={Boolean(plan)}
            onOpenHypothesis={() => setStep("input")}
            onOpenValidation={() => { if (!literature) return; setStep("literature"); }}
            onOpenHypotheses={() => { if (!suggestions) return; setStep("hypotheses"); }}
            onOpenPlan={() => { if (!plan) return; setStep("plan"); }}
          />
        </div>

        <div
          className="overflow-hidden transition-[height] duration-500 ease-in-out"
          style={{ height: sliderHeight }}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${stepIndex * 100}%)` }}
          >
            {/* Panel 0: Hypothesis */}
            <div ref={(el) => { slideRefs.current[0] = el; }} className="w-full min-w-full shrink-0">
              <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                  Your scientific question
                </h2>
                <label htmlFor="hypothesis" className="sr-only">
                  Research question
                </label>
                <textarea
                  id="hypothesis"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={6}
                  placeholder="What are you testing? What outcome do you expect? How will you measure it? What counts as success?"
                  className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)] outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/15"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="w-full text-xs font-medium text-zinc-500">
                    Example questions
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
                <div className="mt-4 flex flex-wrap items-center gap-3">
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
              </div>
              {error && step === "input" && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Panel 1: Literature QC */}
            <div ref={(el) => { slideRefs.current[1] = el; }} className="w-full min-w-full shrink-0">
              {literature && (
                <div
                  id="literature-qc"
                  className={`space-y-4 transition-all duration-500 ease-out ${
                    revealValidation
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  }`}
                >
                  {/* Novelty status */}
                  <div className={`rounded-2xl border p-5 sm:p-6 ${
                    literature.novelty === "exact_match_found"
                      ? "border-rose-500/25 bg-rose-500/8"
                      : literature.novelty === "similar_work_exists"
                      ? "border-amber-500/25 bg-amber-500/8"
                      : "border-emerald-500/25 bg-emerald-500/8"
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                        Literature
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                        literature.novelty === "exact_match_found"
                          ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
                          : literature.novelty === "similar_work_exists"
                          ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                      }`}>
                        {literature.novelty === "exact_match_found"
                          ? "Research question already answered"
                          : literature.novelty === "similar_work_exists"
                          ? "Similar work exists"
                          : "No prior work found"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                      {literature.summary}
                    </p>
                  </div>

                  {/* Papers */}
                  {literature.references.length > 0 && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold tracking-[-0.01em] text-white">
                          Top papers found
                        </h3>
                        <span className="text-xs text-zinc-500">
                          Deselect papers to exclude from hypothesis generation
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {literature.references.map((r) => {
                          const key = r.url + r.title;
                          const active = !deselectedRefs.has(key);
                          return (
                            <li key={key}>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeselectedRefs((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(key)) next.delete(key);
                                    else next.add(key);
                                    return next;
                                  })
                                }
                                className={`w-full rounded-xl border p-4 text-left transition ${
                                  active
                                    ? "border-[var(--border)] bg-[var(--input-bg)] hover:border-zinc-600"
                                    : "border-zinc-800 bg-transparent hover:border-zinc-700"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                    active
                                      ? "border-emerald-500/60 bg-emerald-500/20"
                                      : "border-zinc-600 bg-transparent"
                                  }`}>
                                    {active && (
                                      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 text-emerald-400" fill="none">
                                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </span>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${active ? "text-emerald-300" : "text-white"}`}>
                                      {r.title}
                                    </p>
                                    <p className={`mt-0.5 text-xs ${active ? "text-[var(--muted)]" : "text-zinc-500"}`}>
                                      {[r.authors, r.year].filter(Boolean).join(" · ")}
                                      {r.source ? ` · ${r.source}` : ""}
                                    </p>
                                    {r.snippet && (
                                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                                        {r.snippet}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
                    <label className="mb-2 block text-sm font-semibold tracking-[-0.01em] text-white">
                      Refine literature search
                    </label>
                    <input
                      type="text"
                      value={litKeywords}
                      onChange={(e) => setLitKeywords(e.target.value)}
                      placeholder="Add keywords to narrow results — e.g. assay type, model organism, target pathway, cell line…"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={runHypotheses}
                      disabled={suggestionsLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {suggestionsLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      )}
                      Generate top hypotheses
                    </button>
                  </div>
                </div>
              )}
              {error && step === "literature" && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Panel 2: Hypotheses */}
            <div ref={(el) => { slideRefs.current[2] = el; }} className="w-full min-w-full shrink-0">
              {suggestions && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                      Top 3 hypotheses
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Refined based on the literature. Select one to generate the experiment plan.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSuggestion(s)}
                          className={`w-full rounded-2xl border p-5 text-left transition ${
                            selectedSuggestion?.id === s.id
                              ? "border-emerald-500/60 bg-emerald-500/8 ring-1 ring-emerald-500/30"
                              : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/30 hover:bg-emerald-500/5"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition ${
                                selectedSuggestion?.id === s.id
                                  ? "bg-emerald-500/25 text-emerald-300"
                                  : "bg-[var(--input-bg)] text-zinc-500"
                              }`}
                            >
                              {s.id}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold tracking-[-0.01em] text-white">
                                {s.title}
                              </p>
                              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                                {s.description}
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                                {s.rationale}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={runPlan}
                      disabled={!selectedSuggestion || planLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {planLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      )}
                      Generate experiment plan
                    </button>
                  </div>
                </div>
              )}
              {error && step === "hypotheses" && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Panel 3: Experiment Plan */}
            <div ref={(el) => { slideRefs.current[3] = el; }} className="w-full min-w-full shrink-0 space-y-8">
              {plan && (
                <section
                  id="experiment-plan"
                  className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"
                >
                  <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                        Experiment plan
                      </h2>
                      <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
                        {plan.title}
                      </p>
                    </div>
                    <nav aria-label="Plan sections" className="flex flex-wrap gap-2">
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
                    <PlanBlock id="section-protocol" title="Protocol">
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
                                    ? fmtMoney(m.lineTotal, m.currency ?? plan.budget.currency)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </PlanBlock>
                    <PlanBlock id="section-budget" title="Budget">
                      <ul className="space-y-2">
                        {plan.budget.lines.map((line) => (
                          <li
                            key={line.description}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-zinc-200">{line.category}</p>
                              <p className="text-xs text-[var(--muted)]">{line.description}</p>
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
                    <PlanBlock id="section-timeline" title="Timeline">
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
                    <PlanBlock id="section-validation" title="Validation">
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

              {(literature || plan) && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      At-a-glance
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--muted)]">Check status</dt>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative mt-16 border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        Demo responses ship with the app for judging UX; connect your model via{" "}
        <code className="text-zinc-400">BACKEND_URL</code>.
      </footer>
    </div>
  );
}

function StepTracker({
  step,
  stepIndex,
  canOpenValidation,
  canOpenHypotheses,
  canOpenPlan,
  onOpenHypothesis,
  onOpenValidation,
  onOpenHypotheses,
  onOpenPlan,
}: {
  step: Step;
  stepIndex: number;
  canOpenValidation: boolean;
  canOpenHypotheses: boolean;
  canOpenPlan: boolean;
  onOpenHypothesis: () => void;
  onOpenValidation: () => void;
  onOpenHypotheses: () => void;
  onOpenPlan: () => void;
}) {
  const items = [
    {
      n: "01",
      title: "Question",
      active: step === "input",
      locked: false,
      onClick: onOpenHypothesis,
    },
    {
      n: "02",
      title: "Literature Check",
      active: step === "literature",
      locked: !canOpenValidation,
      onClick: onOpenValidation,
    },
    {
      n: "03",
      title: "Hypotheses",
      active: step === "hypotheses",
      locked: !canOpenHypotheses,
      onClick: onOpenHypotheses,
    },
    {
      n: "04",
      title: "Experiment",
      active: step === "plan",
      locked: !canOpenPlan,
      onClick: onOpenPlan,
    },
  ] as const;

  return (
    <ol className="relative mb-10 grid w-full grid-cols-2 gap-7 sm:grid-cols-4 sm:gap-4">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-white/15 sm:block"
      >
        <div
          className="h-full bg-white/60 transition-[width] duration-500 ease-in-out"
          style={{
            width: stepIndex === 3 ? "100%" : `calc(${(stepIndex + 1) * 25}% - 10px)`,
          }}
        />
      </div>
      {items.map((item) => (
        <li key={item.n} className="relative bg-transparent">
          <button
            type="button"
            disabled={item.locked}
            onClick={item.onClick}
            className={`text-left font-medium tracking-[-0.01em] transition ${
              item.locked ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <span className={`block text-[11px] tracking-[0.12em] ${item.active ? "text-white" : "text-zinc-500"}`}>
              {item.n}
            </span>
            <span
              className={`mt-4 block text-sm ${
                item.active
                  ? "text-white"
                  : item.locked
                    ? "text-zinc-600"
                    : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.title}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function PlanBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-semibold capitalize tracking-[-0.02em] text-white">
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
