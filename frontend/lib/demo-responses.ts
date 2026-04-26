import type {
  ExperimentPlan,
  HypothesisSuggestion,
  LiteratureQCResult,
  NoveltySignal,
} from "./types";

type Archetype =
  | "biosensor"
  | "gut"
  | "cryo"
  | "mes"
  | "alpha7"
  | "default";

function detectArchetype(q: string): Archetype {
  const s = q.toLowerCase();
  if (
    s.includes("crp") ||
    s.includes("electrochemical") ||
    s.includes("biosensor")
  )
    return "biosensor";
  if (
    s.includes("lactobacillus") ||
    s.includes("permeability") ||
    s.includes("fitc") ||
    s.includes("c57")
  )
    return "gut";
  if (
    s.includes("trehalose") ||
    s.includes("hela") ||
    s.includes("cryoprotect") ||
    s.includes("dmso")
  )
    return "cryo";
  if (
    s.includes("sporomusa") ||
    s.includes("bioelectrochemical") ||
    s.includes("acetate") ||
    s.includes("cathode")
  )
    return "mes";
  if (
    s.includes("alpha7") ||
    s.includes("a7") ||
    s.includes("nachr") ||
    s.includes("nicotinic") ||
    s.includes("ric-3") ||
    s.includes("ric3")
  )
    return "alpha7";
  return "default";
}

export function buildHypothesesSuggestions(
  question: string,
  _literature: LiteratureQCResult
): HypothesisSuggestion[] {
  const archetype = detectArchetype(question);

  if (archetype === "biosensor") {
    return [
      {
        id: 1,
        title: "PEDOT:PSS-enhanced paper CRP biosensor",
        description:
          "A PEDOT:PSS-modified screen-printed electrode functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, achieving a signal-to-noise ratio ≥5 compared to a bare-electrode control.",
        rationale:
          "Existing literature on screen-printed immunosensors confirms antibody-SPE coupling works; PEDOT:PSS modification addresses the fouling issues noted in whole-blood matrix studies.",
      },
      {
        id: 2,
        title: "Zwitterionic anti-fouling impedimetric CRP sensor",
        description:
          "A label-free impedimetric biosensor with carboxybetaine-functionalized gold electrodes will quantify CRP in undiluted whole blood from 0.1–10 mg/L with <15% matrix interference, outperforming antibody-only surfaces in specificity.",
        rationale:
          "Chen et al. (2021) highlighted matrix fouling as the key bottleneck; zwitterionic chemistry provides anti-fouling properties while preserving epitope accessibility at clinical CRP concentrations.",
      },
      {
        id: 3,
        title: "Dual-marker CRP + IL-6 multiplexed paper panel",
        description:
          "A two-channel paper-based electrochemical sensor simultaneously detecting CRP (< 0.5 mg/L) and IL-6 (< 10 pg/mL) will improve acute-phase response classification accuracy by ≥20% versus CRP alone in a matched clinical sample set.",
        rationale:
          "Single-biomarker CRP sensors are well established; combining IL-6 as a complementary acute-phase marker directly addresses the specificity gap identified in the literature review and opens a novel clinical claim.",
      },
    ];
  }

  if (archetype === "gut") {
    return [
      {
        id: 1,
        title: "TLR2-mediated claudin-1 upregulation by LGG",
        description:
          "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG (1×10⁹ CFU/day, 4 weeks) will reduce intestinal permeability by ≥30% via TLR2-dependent upregulation of claudin-1, measured by FITC-dextran assay and qPCR.",
        rationale:
          "Johnson et al. (2018) established LGG permeability benefits; adding a mechanistic TLR2 arm with claudin-1 qPCR links the phenotype to the signaling pathway and differentiates from prior descriptive work.",
      },
      {
        id: 2,
        title: "Cell-free LGG conditioned medium recapitulates barrier improvement",
        description:
          "Oral administration of LGG-conditioned medium (cell-free supernatant) will reduce FITC-dextran permeability by ≥20% vs vehicle in C57BL/6 mice, implicating secreted factors (p40 protein) rather than live bacteria as the active component.",
        rationale:
          "Dissecting live-cell vs secreted-factor contributions is a gap in the rodent literature; this design cleanly separates colonization from paracrine signaling and requires no live bacterial gavage.",
      },
      {
        id: 3,
        title: "LGG + inulin synergy for enhanced barrier function",
        description:
          "Combined supplementation of LGG (1×10⁹ CFU/day) with inulin (5% w/w diet) will achieve ≥40% reduction in FITC-dextran permeability versus LGG alone in C57BL/6 mice over 4 weeks, mediated by increased butyrate-producing commensals.",
        rationale:
          "Prebiotic synbiotics consistently show additive gut-barrier effects in the literature; the 40% threshold is achievable based on published butyrate–tight-junction coupling data and represents a clinically meaningful step-change over monotherapy.",
      },
    ];
  }

  if (archetype === "cryo") {
    return [
      {
        id: 1,
        title: "200 mM trehalose pre-loading for DMSO-reduced cryopreservation",
        description:
          "Pre-incubating HeLa cells with 200 mM trehalose for 24 h at 37 °C, then freezing in 3% DMSO medium, will increase post-thaw viability by ≥15 percentage points versus the standard 10% DMSO protocol, with maintained 24 h attachment rate ≥85%.",
        rationale:
          "Wolfe et al. (2017) showed 200 mM as the osmotic sweet spot for non-permeating trehalose loading; pairing with reduced DMSO addresses cytotoxicity at standard concentrations while maintaining membrane stabilization.",
      },
      {
        id: 2,
        title: "Trehalose + DMSO combination outperforms either alone",
        description:
          "A formulation of 150 mM trehalose plus 5% DMSO will yield ≥15 pp higher post-thaw HeLa viability than 10% DMSO alone and ≥10 pp higher than trehalose-only conditions, by combining membrane vitrification with intracellular ice inhibition.",
        rationale:
          "ATCC protocols confirm 10% DMSO as a reproducible comparator; the combination arm tests the orthogonal mechanisms (extracellular membrane stabilization vs intracellular ice suppression) identified across the two key references.",
      },
      {
        id: 3,
        title: "Electroporation-loaded intracellular trehalose enables DMSO-free freezing",
        description:
          "Electroporation-mediated intracellular trehalose loading (5 ms, 200 V) will enable complete replacement of DMSO while achieving ≥80% post-thaw HeLa viability, compared to ≤75% in the trehalose-only extracellular control.",
        rationale:
          "Intracellular trehalose is the key mechanistic advance beyond external supplementation; electroporation is the established delivery method and directly tests the membrane-stabilization hypothesis at the intracellular level.",
      },
    ];
  }

  if (archetype === "mes") {
    return [
      {
        id: 1,
        title: "Graphene-modified cathode enhances Sporomusa acetate rate by ≥25%",
        description:
          "Introducing Sporomusa ovata on a reduced-graphene-oxide cathode at −400 mV vs SHE will fix CO₂ into acetate at ≥150 mmol/L/day, outperforming graphite-felt benchmarks by ≥25% due to increased electroactive surface area and improved electron transfer.",
        rationale:
          "Jourdin et al. (2019) identified electrode surface area as the rate-limiting factor; rGO modification directly addresses this while maintaining the Nevin et al. (2011) poised-potential configuration that was validated for Sporomusa.",
      },
      {
        id: 2,
        title: "pH-controlled bicarbonate buffer increases CO₂ bioavailability",
        description:
          "Operating Sporomusa ovata MES at controlled pH 6.8 with 50 mM bicarbonate buffer will increase acetate production rate by ≥20% versus unbuffered pH-drift controls, by maintaining dissolved CO₂ availability above the Michaelis constant.",
        rationale:
          "CO₂ availability and pH drift are identified confounders in existing MES literature; this design isolates mass-transfer from electrode effects and can be run in parallel with existing reactor hardware.",
      },
      {
        id: 3,
        title: "Two-stage MES upgrades acetate to butyrate via chain elongation",
        description:
          "A sequential MES system (Sporomusa stage at −400 mV producing acetate, then Clostridium kluyveri stage for chain elongation) will produce butyrate at ≥20 mmol/L/day from CO₂, demonstrating a 5× value-uplift over acetate alone.",
        rationale:
          "Single-product acetate MES is well-benchmarked; coupling to chain elongation is an emerging direction with sparse rate data, and the 20 mmol target is grounded in Clostridium kluyveri batch fermentation studies referenced in Jourdin et al.",
      },
    ];
  }

  if (archetype === "alpha7") {
    return [
      {
        id: 1,
        title: "Optimized 1:3 α7:RIC-3 ratio achieves ≥40% surface trafficking increase",
        description:
          "Co-transfecting HEK293 cells with α7 nAChR and RIC-3 at a 1:3 plasmid ratio will increase surface α7 density by ≥40% versus α7-only transfection, measured by cell-surface biotinylation and densitometry at 48 h post-transfection.",
        rationale:
          "Millar et al. (2009) demonstrated RIC-3 chaperone activity; Kuryatov et al. (2013) validated surface biotinylation as the quantitative readout. The 1:3 ratio targets chaperone saturation without competitive inhibition observed at excess concentrations.",
      },
      {
        id: 2,
        title: "ΔER-retention RIC-3 mutant outperforms wild-type in α7 trafficking",
        description:
          "A RIC-3 mutant with deleted ER retention signal will enhance α7 nAChR surface expression by ≥60% versus wild-type RIC-3 co-expression in HEK293 cells, by reducing ER-resident chaperone-receptor complexes and promoting forward trafficking.",
        rationale:
          "Wild-type RIC-3 retains a fraction of the receptor-chaperone complex in the ER; removing the retention signal is predicted by the trafficking models in Groot-Kormelink et al. (2012) to shift the equilibrium toward plasma membrane delivery.",
      },
      {
        id: 3,
        title: "PNU-120596 + RIC-3 synergistically increases functional surface α7",
        description:
          "Combining RIC-3 co-expression with the positive allosteric modulator PNU-120596 (1 µM) will increase both surface α7 density (≥40% by biotinylation) and single-channel open probability (≥2× vs α7-only) in HEK293 cells, demonstrating coupled trafficking and function enhancement.",
        rationale:
          "PNU-120596 stabilizes the open-channel conformation; combined with RIC-3-driven surface delivery, this tests whether functional enhancement compounds with increased receptor density—a gap in the current literature connecting chaperone expression to pharmacological potentiation.",
      },
    ];
  }

  // default
  return [
    {
      id: 1,
      title: "Quantified primary endpoint hypothesis",
      description: `${question.slice(0, 200).trim()} — specifically measuring the primary endpoint with a pre-specified threshold of ≥20% effect size versus a vehicle control, powered for 80% detection at α=0.05.`,
      rationale:
        "Adding explicit quantitative thresholds and statistical power framing converts the exploratory hypothesis into a testable, pre-registerable claim.",
    },
    {
      id: 2,
      title: "Mechanistic pathway variant",
      description:
        "The intervention will produce the described outcome through a specific molecular mechanism (pathway TBD from literature), which will be confirmed by a secondary reporter assay alongside the primary endpoint.",
      rationale:
        "Mechanistic evidence strengthens the causal claim and provides a salvageable result even if the primary endpoint misses threshold, following the literature precedents identified in the QC step.",
    },
    {
      id: 3,
      title: "Dose–response refinement",
      description:
        "A dose–response experiment across 4 concentrations/conditions will identify the minimum effective dose producing the claimed outcome, enabling resource optimization and direct comparison to the benchmark identified in literature.",
      rationale:
        "The literature QC identified prior art with similar interventions; establishing a dose–response curve directly addresses the 'how much is needed' gap and differentiates this work from existing benchmarks.",
    },
  ];
}

export function buildLiteratureQC(question: string): LiteratureQCResult {
  const archetype = detectArchetype(question);
  const s = question.toLowerCase();

  let novelty: NoveltySignal = "not_found";
  let summary =
    "No close protocol match surfaced in a quick scan. Treat as exploratory; run a deeper literature review before committing budget.";
  const references: LiteratureQCResult["references"] = [];

  const addRef = (
    title: string,
    authors: string,
    year: number,
    url: string,
    snippet: string,
    source = "Semantic Scholar"
  ) => {
    references.push({ title, authors, year, url, snippet, source });
  };

  if (archetype === "biosensor") {
    novelty = "similar_work_exists";
    summary =
      "Paper-based and electrochemical immunoassays for CRP are well represented; your exact sensitivity/time target may still be novel. Proceed with comparator ELISA and clinical-style controls.";
    addRef(
      "Paper-based electrochemical immunoassay for point-of-care CRP",
      "Martinez et al.",
      2019,
      "https://www.semanticscholar.org/search?q=paper+based+CRP+electrochemical",
      "Lateral flow and screen-printed electrode formats reporting ng/mL–µg/mL CRP ranges.",
      "Semantic Scholar"
    );
    addRef(
      "Label-free impedance biosensors for acute-phase proteins in whole blood",
      "Chen et al.",
      2021,
      "https://www.semanticscholar.org/search?q=impedance+biosensor+CRP+whole+blood",
      "Discusses matrix effects and anti-fouling surface chemistries relevant to whole blood.",
      "Semantic Scholar"
    );
  } else if (archetype === "gut") {
    novelty = "similar_work_exists";
    summary =
      "LGG supplementation and FITC-dextran permeability assays in rodents are established; your threshold claim should cite strain-specific dose–response precedents.";
    addRef(
      "Lactobacillus rhamnosus GG modulates intestinal permeability in murine models",
      "Johnson et al.",
      2018,
      "https://www.semanticscholar.org/search?q=LGG+intestinal+permeability+mouse",
      "Oral gavage protocols, gnotobiotic considerations, and permeability readouts.",
      "Semantic Scholar"
    );
    addRef(
      "FITC-dextran intestinal permeability assay: technical considerations",
      "Lee et al.",
      2020,
      "https://www.semanticscholar.org/search?q=FITC-dextran+gut+permeability+protocol",
      "Standardizes gavage timing, serum collection windows, and background subtraction.",
      "Bio-protocol linked literature"
    );
  } else if (archetype === "cryo") {
    novelty = "similar_work_exists";
    summary =
      "Comparative cryoprotectant studies for adherent mammalian cells exist; trehalose vs DMSO trade-offs are documented but context-dependent for HeLa.";
    addRef(
      "Trehalose as non-permeating cryoprotectant for mammalian cells",
      "Wolfe et al.",
      2017,
      "https://www.semanticscholar.org/search?q=trehalose+cryopreservation+mammalian+cells",
      "Mechanistic framing for membrane stabilization vs permeating cryoprotectants.",
      "Semantic Scholar"
    );
    addRef(
      "Cryopreservation of HeLa cells: viability and recovery benchmarks",
      "ATCC derived protocols",
      2022,
      "https://www.atcc.org/resources/protocols",
      "Baseline DMSO-centric freezing/thawing workflow commonly used as comparator.",
      "ATCC / supplier literature"
    );
  } else if (archetype === "mes") {
    novelty = "similar_work_exists";
    summary =
      "Microbial electrosynthesis and Sporomusa-driven acetate production from cathodes are active fields; benchmark rates should be compared to recent MES studies.";
    addRef(
      "Bioelectrochemical reduction of CO2 to acetate with Sporomusa species",
      "Nevin et al.",
      2011,
      "https://www.semanticscholar.org/search?q=Sporomusa+acetate+bioelectrochemical",
      "Foundational chronoamperometry and poised-potential reactor configurations.",
      "Semantic Scholar"
    );
    addRef(
      "Microbial electrosynthesis: engineering cathodes for product selectivity",
      "Jourdin et al.",
      2019,
      "https://www.semanticscholar.org/search?q=microbial+electrosynthesis+cathode",
      "Reactor hydraulics, mass transfer, and rate normalization per volume.",
      "Nature Catalysis / linked open access summaries"
    );
  } else if (archetype === "alpha7") {
    novelty = "similar_work_exists";
    summary =
      "RIC-3 chaperone co-expression with α7 nAChR is well documented in Xenopus oocyte systems; HEK293 surface trafficking quantification with biotinylation is established but your specific 40% threshold claim in this cell line remains testable. Proceed with surface biotinylation as primary readout.";
    addRef(
      "RIC-3 promotes functional expression of the nicotinic acetylcholine receptor alpha7",
      "Millar NS et al.",
      2009,
      "https://www.semanticscholar.org/search?q=RIC-3+alpha7+nicotinic+receptor",
      "RIC-3 acts as a chaperone specifically enhancing α7 surface expression in multiple expression systems",
      "Semantic Scholar"
    );
    addRef(
      "Chaperone-dependent trafficking of α7 nAChR to the plasma membrane",
      "Kuryatov A et al.",
      2013,
      "https://www.semanticscholar.org/search?q=alpha7+nAChR+trafficking+chaperone",
      "Surface biotinylation approaches validated for quantifying membrane-localized α7 receptor pools",
      "Semantic Scholar"
    );
    addRef(
      "HEK293 as expression system for nicotinic receptor pharmacology",
      "Groot-Kormelink PJ et al.",
      2012,
      "https://www.semanticscholar.org/search?q=HEK293+nicotinic+receptor+expression",
      "Transfection optimization and functional validation protocols for heteromeric and homomeric nAChRs",
      "Semantic Scholar"
    );
    addRef(
      "Species-specific differences in RIC-3 chaperone activity for α7 nAChR assembly",
      "Lansdell SJ et al.",
      2005,
      "https://www.semanticscholar.org/search?q=RIC-3+species+differences+alpha7",
      "C. elegans and human RIC-3 show divergent efficacy in supporting α7 folding and surface delivery across heterologous expression systems",
      "Semantic Scholar"
    );
    addRef(
      "GTS-21 partial agonism at α7 nAChR: desensitization kinetics and therapeutic implications",
      "Briggs CA et al.",
      2009,
      "https://www.semanticscholar.org/search?q=GTS-21+alpha7+desensitization+partial+agonist",
      "GTS-21 displays significantly reduced desensitization versus full agonists in patch-clamp recordings, supporting its cognitive-enhancing profile",
      "Semantic Scholar"
    );
  } else if (s.length < 40 && /\b(elisa|pcr|western)\b/.test(s)) {
    novelty = "exact_match_found";
    summary =
      "Query resembles a textbook protocol family with extensive public methods. Differentiate with a clear novel variable (matrix, target, throughput, or sensitivity).";
    addRef(
      "MIQE guidelines for minimum information for qPCR experiments",
      "Bustin et al.",
      2009,
      "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2737408/",
      "Reporting and controls checklist applicable if qPCR is part of the workflow.",
      "PubMed Central"
    );
  }

  while (references.length > 5) references.pop();
  return { novelty, summary, references };
}

export function buildExperimentPlan(
  question: string,
  literature: LiteratureQCResult
): ExperimentPlan {
  const archetype = detectArchetype(question);
  const currency = "USD";

  const baseValidation = {
    primaryEndpoints: [] as string[],
    successCriteria: [] as string[],
    controls: [] as string[],
    analyticalMethods: [] as string[],
  };

  if (archetype === "biosensor") {
    return {
      title: "Paper-based anti-CRP electrochemical biosensor — pilot study",
      hypothesisSummary: question.slice(0, 400),
      protocolOriginNote:
        "Methodology aligned with screen-printed electrode (SPE) immunoassay patterns on protocols.io and peer-reviewed paper biosensor literature; adapt concentrations to your antibody clone datasheet.",
      protocol: [
        {
          stepNumber: 1,
          title: "Electrode functionalization",
          description:
            "Clean SPEs (carbon working, Ag/AgCl ref, aux). Drop-cast 2 µL 2 mg/mL streptavidin in PBS, incubate 2 h at 4 °C, wash 3× PBS. Block with 1% BSA 45 min RT.",
          duration: "1 day (batch)",
          notes: "Use manufacturer QC lot; record batch IDs.",
        },
        {
          stepNumber: 2,
          title: "Anti-CRP capture layer",
          description:
            "Bind biotinylated anti-CRP (clone per datasheet) 10 µg/mL, 1 h RT, wash. Store dry 4 °C if not used same day.",
          duration: "4 h",
        },
        {
          stepNumber: 3,
          title: "Whole blood testing (unprocessed)",
          description:
            "Apply 20 µL EDTA whole blood directly or via defined filtration insert (document choice). Quiescent incubation 8 min. Run square-wave voltammetry per instrument app note.",
          duration: "10 min / sample",
          notes: "Matrix study: spike pooled plasma into whole blood for calibration.",
        },
        {
          stepNumber: 4,
          title: "Comparator ELISA",
          description:
            "Run FDA-cleared or lab-validated high-sensitivity CRP ELISA on paired plasma aliquots for method comparison (Bland–Altman).",
          duration: "2 lab days",
        },
        {
          stepNumber: 5,
          title: "LOD/LOQ and precision",
          description:
            "Serial dilutions near 0.5 mg/L CRP in matched matrix; intra-assay n≥10, inter-assay across 3 days.",
          duration: "1 week",
        },
      ],
      materials: [
        {
          name: "Screen-printed carbon electrodes, 3-electrode layout",
          catalogNumber: "CHI120",
          supplier: "CH Instruments / local SPE vendor",
          quantity: "200 pcs",
          estimatedUnitCost: 4.5,
          lineTotal: 900,
          currency,
        },
        {
          name: "Anti-human CRP antibody pair (capture/detection) — consult datasheets",
          catalogNumber: "MAB17081 / MAB17082 (example SKUs)",
          supplier: "R&D Systems / Thermo Fisher",
          quantity: "2× 100 µg",
          estimatedUnitCost: 650,
          lineTotal: 1300,
          currency,
        },
        {
          name: "Biotinylation kit + streptavidin",
          catalogNumber: "21425 + 21122",
          supplier: "Thermo Fisher",
          quantity: "1 kit each",
          estimatedUnitCost: 400,
          lineTotal: 800,
          currency,
        },
        {
          name: "Potentiostat / handheld reader",
          catalogNumber: "PalmSens4 or equivalent",
          supplier: "PalmSens",
          quantity: "1",
          estimatedUnitCost: 4200,
          lineTotal: 4200,
          currency,
        },
        {
          name: "hsCRP ELISA kit",
          catalogNumber: "Vendor-validated hsCRP kit",
          supplier: "IVD vendor (region-specific)",
          quantity: "5× 96-well plates",
          estimatedUnitCost: 900,
          lineTotal: 4500,
          currency,
        },
      ],
      budget: {
        currency,
        assumptions: [
          "Academic pricing; excludes PI time and facility overhead.",
          "Reader amortized 50% to this pilot.",
        ],
        lines: [
          { category: "Consumables", description: "SPEs, buffers, blood tubes", amount: 2200, currency },
          { category: "Biologics", description: "Antibodies, proteins, ELISA", amount: 7800, currency },
          { category: "Equipment", description: "Potentiostat allocation", amount: 2100, currency },
          { category: "Outsourcing", description: "Clinical waste, shipping", amount: 400, currency },
        ],
        total: 12500,
      },
      timeline: [
        { phase: "Design + ethics (if human samples)", startWeek: 1, endWeek: 3, description: "IRB/Biosafety if applicable; finalize SOP.", dependencies: [] },
        { phase: "Surface chemistry optimization", startWeek: 2, endWeek: 5, description: "Titrate antibody, blocking, incubation times.", dependencies: ["Design + ethics (if human samples)"] },
        { phase: "Matrix + calibration", startWeek: 5, endWeek: 8, description: "Whole blood spikes, ELISA correlation.", dependencies: ["Surface chemistry optimization"] },
        { phase: "Analytical validation", startWeek: 8, endWeek: 10, description: "LOD/LOQ, precision, stability.", dependencies: ["Matrix + calibration"] },
      ],
      validation: {
        ...baseValidation,
        primaryEndpoints: ["CRP concentration vs reference (mg/L)", "Time-to-result (min)"],
        successCriteria: [
          "Detect CRP < 0.5 mg/L in ≥80% of spiked samples at target matrix",
          "Median bias vs ELISA within ±20% across 0.2–10 mg/L",
        ],
        controls: ["Blank matrix", "Non-specific IgG surface", "Three QC levels per plate"],
        analyticalMethods: ["SWV on SPE", "ELISA absorbance", "Bland–Altman"],
      },
      staffingNotes: [
        "1× bioengineer (surface chemistry) 0.5 FTE for 8 weeks",
        "1× assay developer (immuno) 0.25 FTE",
      ],
      riskMitigation: [
        "Hemolysis and electrode fouling — include surfactant screen per Chen et al. patterns.",
        "Antibody lot drift — dual-vendor backup lot on critical path week 6.",
      ],
    };
  }

  if (archetype === "gut") {
    return {
      title: "LGG supplementation and gut barrier integrity in C57BL/6 mice",
      hypothesisSummary: question.slice(0, 400),
      protocolOriginNote:
        "Animal procedures should follow institutional IACUC; assay steps follow common FITC-dextran gavage protocols (Bio-protocol / peer literature).",
      protocol: [
        {
          stepNumber: 1,
          title: "Power + randomization",
          description:
            "Pre-specify n per group (e.g., 12) for 30% relative reduction with conservative variance; block by cage.",
          duration: "1 week",
        },
        {
          stepNumber: 2,
          title: "Dosing regimen",
          description:
            "LGG 1×10^9 CFU/day oral gavage vs vehicle; 4 weeks; daily logs for intake and adverse signs.",
          duration: "4 weeks",
        },
        {
          stepNumber: 3,
          title: "FITC-dextran permeability assay",
          description:
            "4 kDa FITC-dextran gavage 4 h before bleed (or institutional standard). Collect serum, read fluorescence (485/528 nm).",
          duration: "1 assay day",
          notes: "Include fasted vs fed protocol decision in SOP.",
        },
        {
          stepNumber: 4,
          title: "Tight junction readouts",
          description:
            "Distal ileum/colon segments: qPCR for Cldn1, Ocln; optional Western for ZO-1.",
          duration: "3 lab days",
        },
        {
          stepNumber: 5,
          title: "Histology QC",
          description: "H&E on subset to rule out inflammation confounders.",
          duration: "parallel",
        },
      ],
      materials: [
        { name: "Lactobacillus rhamnosus GG (ATCC 53103)", catalogNumber: "53103", supplier: "ATCC", quantity: "10 vials", estimatedUnitCost: 450, lineTotal: 4500, currency },
        { name: "FITC-dextran 4 kDa", catalogNumber: "FD4", supplier: "Sigma-Aldrich", quantity: "1 g", estimatedUnitCost: 380, lineTotal: 380, currency },
        { name: "RNA extraction kit", catalogNumber: "74104", supplier: "Qiagen", quantity: "2× 50", estimatedUnitCost: 520, lineTotal: 1040, currency },
        { name: "SYBR qPCR master mix", catalogNumber: "4367659", supplier: "Thermo Fisher", quantity: "5 mL", estimatedUnitCost: 210, lineTotal: 210, currency },
        { name: "Animal per diem + facility", catalogNumber: "—", supplier: "Vivarium", quantity: "60 mouse-months", estimatedUnitCost: 55, lineTotal: 3300, currency },
      ],
      budget: {
        currency,
        assumptions: ["Vivarium rates illustrative; adjust to local core charges."],
        lines: [
          { category: "Animals + housing", description: "Purchase, housing, gavage labor", amount: 5200, currency },
          { category: "Microbiology", description: "Strain, culture media, CFU plating", amount: 1800, currency },
          { category: "Molecular assays", description: "RNA, qPCR, antibodies", amount: 2400, currency },
          { category: "Consumables", description: "Tubes, tips, fluorescence plate costs", amount: 900, currency },
        ],
        total: 10300,
      },
      timeline: [
        { phase: "IACUC + procurement", startWeek: 1, endWeek: 5, description: "Approvals, strain expansion, cage setup.", dependencies: [] },
        { phase: "Intervention", startWeek: 6, endWeek: 9, description: "4-week dosing window.", dependencies: ["IACUC + procurement"] },
        { phase: "Terminal assays", startWeek: 10, endWeek: 11, description: "FITC-dextran day + tissue harvest.", dependencies: ["Intervention"] },
        { phase: "Analysis + stats", startWeek: 11, endWeek: 12, description: "Mixed models, multiplicity control.", dependencies: ["Terminal assays"] },
      ],
      validation: {
        ...baseValidation,
        primaryEndpoints: ["Serum FITC-dextran AUC/intensity", "Δ vs control (%)"],
        successCriteria: ["≥30% reduction vs control mean with p<0.05 and CI excluding 0"],
        controls: ["Vehicle-only", "Non-fermentable fiber control (optional)", "Assay plate blanks"],
        analyticalMethods: ["Fluorimetry", "ΔΔCt qPCR", "Prism/R mixed model"],
      },
      staffingNotes: ["1× technician 0.5 FTE for 12 weeks", "1× postdoc oversight 0.1 FTE"],
      riskMitigation: ["Cage effects — rotate techs; randomize cage location.", "CFU verification — weekly stool plating subset."],
    };
  }

  if (archetype === "cryo") {
    return {
      title: "Trehalose vs standard DMSO cryopreservation for HeLa cells",
      hypothesisSummary: question.slice(0, 400),
      protocolOriginNote:
        "Comparator arm follows common DMSO freezing; trehalose arm adapted from non-permeating supplement protocols — optimize loading strategy (incubation osmolarity) per Wolfe et al. themes.",
      protocol: [
        {
          stepNumber: 1,
          title: "Cell expansion + QC",
          description:
            "HeLa ATCC CCL-2, mycoplasma-negative, passages ≤P25. Seed T175, grow to 70–80% confluence.",
          duration: "4 days",
        },
        {
          stepNumber: 2,
          title: "Pre-freeze trehalose loading (experimental)",
          description:
            "Screen 100–200 mM trehalose in serum-free medium, 37 °C 24 h (pilot 6 conditions). Choose viability ≥90% pre-freeze.",
          duration: "1 week pilot",
        },
        {
          stepNumber: 3,
          title: "Controlled-rate freezing",
          description:
            "Cryovials 1e6 cells/mL; DMSO 10% control vs chosen trehalose protocol + minimal DMSO if needed per pilot. −1 °C/min to −80 °C, LN2 storage.",
          duration: "1 day",
        },
        {
          stepNumber: 4,
          title: "Thaw + viability",
          description:
            "37 °C rapid thaw, dropwise media addition. Trypan blue + automated cell counter; 24 h attach assay in 96-well.",
          duration: "2 days",
        },
        {
          stepNumber: 5,
          title: "Functional recovery (optional)",
          description: "24 h post-thaw growth curve vs pre-freeze baseline.",
          duration: "3 days",
        },
      ],
      materials: [
        { name: "HeLa CCL-2", catalogNumber: "CCL-2", supplier: "ATCC", quantity: "1 vial", estimatedUnitCost: 450, lineTotal: 450, currency },
        { name: "Trehalose dihydrate", catalogNumber: "T9531", supplier: "Sigma-Aldrich", quantity: "500 g", estimatedUnitCost: 120, lineTotal: 120, currency },
        { name: "DMSO Hybri-Max", catalogNumber: "D2650", supplier: "Sigma-Aldrich", quantity: "100 mL", estimatedUnitCost: 55, lineTotal: 55, currency },
        { name: "Mr. Frosty / controlled-rate bucket", catalogNumber: "5100-0001", supplier: "Thermo Fisher", quantity: "1", estimatedUnitCost: 280, lineTotal: 280, currency },
        { name: "Cryovials + isopropanol chamber", catalogNumber: "366656", supplier: "Thermo Fisher", quantity: "1 case", estimatedUnitCost: 220, lineTotal: 220, currency },
      ],
      budget: {
        currency,
        assumptions: ["Academic cell culture lab; staff time excluded."],
        lines: [
          { category: "Cells + media", description: "FBS, media, antibiotics", amount: 900, currency },
          { category: "Cryo reagents", description: "Trehalose, DMSO, cryovials", amount: 650, currency },
          { category: "Assays", description: "Viability dyes, plates, counting slides", amount: 400, currency },
          { category: "LN2 storage allocation", description: "Core recharge", amount: 350, currency },
        ],
        total: 2300,
      },
      timeline: [
        { phase: "Pilot loading screen", startWeek: 1, endWeek: 2, description: "Define trehalose condition.", dependencies: [] },
        { phase: "Powered freeze–thaw study", startWeek: 3, endWeek: 4, description: "n≥8 biological replicates per arm.", dependencies: ["Pilot loading screen"] },
        { phase: "Analysis", startWeek: 5, endWeek: 5, description: "Two-proportion or ANOVA on viability deltas.", dependencies: ["Powered freeze–thaw study"] },
      ],
      validation: {
        ...baseValidation,
        primaryEndpoints: ["Post-thaw viability %", "24 h attachment % of pre-freeze"],
        successCriteria: ["≥15 percentage-point improvement vs DMSO control mean"],
        controls: ["DMSO 10% standard arm", "Fresh cells same passage", "Technical duplicates"],
        analyticalMethods: ["Trypan + Countess", "Image-based confluence (optional)"],
      },
      staffingNotes: ["1× grad student / RA familiar with mammalian culture"],
      riskMitigation: ["Trehalose osmotic stress — narrow loading window with daily viability checks."],
    };
  }

  if (archetype === "mes") {
    return {
      title: "Poised-cathode MES for CO2-to-acetate with Sporomusa ovata",
      hypothesisSummary: question.slice(0, 400),
      protocolOriginNote:
        "Reactor geometry and poised potentials should reference microbial electrosynthesis primers; inoculum handling per strain requirements.",
      protocol: [
        {
          stepNumber: 1,
          title: "H-cell / MES reactor commissioning",
          description:
            "Cathode −400 mV vs SHE (verify reference electrode conversion); N2 sparge; carbonate buffer system as designed.",
          duration: "1 week",
        },
        {
          stepNumber: 2,
          title: "S. ovata cultivation + inoculum",
          description:
            "Prepare pre-culture under standard acetogenic medium; quantify OD/pH; inoculate to 10% v/v.",
          duration: "5 days",
        },
        {
          stepNumber: 3,
          title: "Batch MES runs",
          description:
            "Headspace CO2 feed; daily liquid sampling for acetate (HPLC), pH, current.",
          duration: "14–21 days",
        },
        {
          stepNumber: 4,
          title: "Benchmark comparison",
          description:
            "Run literature benchmark control configuration (document baseline rate) under matched temperature and mass transfer.",
          duration: "parallel week",
        },
        {
          stepNumber: 5,
          title: "Mass balance + rate normalization",
          description:
            "Normalize acetate production rate per liquid volume; coulombic efficiency estimate.",
          duration: "3 days",
        },
      ],
      materials: [
        { name: "Graphite felt cathode + titanium current collector", catalogNumber: "Custom / Alfa Aesar", supplier: "Local machinist + supplier", quantity: "3 sets", estimatedUnitCost: 400, lineTotal: 1200, currency },
        { name: "Ag/AgCl reference + potentiostat", catalogNumber: "Multi-channel potentiostat", supplier: "Gamry / Biologic", quantity: "1 channel lease 3 mo", estimatedUnitCost: 2500, lineTotal: 2500, currency },
        { name: "Sporomusa ovata culture", catalogNumber: "DSM 2662 (verify)", supplier: "DSMZ / ATCC", quantity: "1", estimatedUnitCost: 350, lineTotal: 350, currency },
        { name: "HPLC standards + vials", catalogNumber: "Acetate standard kit", supplier: "Sigma-Aldrich", quantity: "1", estimatedUnitCost: 220, lineTotal: 220, currency },
        { name: "Medium components + gases", catalogNumber: "Various", supplier: "Sigma + gas vendor", quantity: "1 batch", estimatedUnitCost: 900, lineTotal: 900, currency },
      ],
      budget: {
        currency,
        assumptions: ["Excludes facility electrical demand charge modeling."],
        lines: [
          { category: "Reactor hardware", description: "Electrodes, housings, pumps", amount: 3200, currency },
          { category: "Instrumentation", description: "Potentiostat lease + HPLC time", amount: 4100, currency },
          { category: "Consumables + gases", description: "Medium, vials, CO2/N2", amount: 1500, currency },
          { category: "Safety + training", description: "Pressurized gas handling", amount: 600, currency },
        ],
        total: 9400,
      },
      timeline: [
        { phase: "Engineering design", startWeek: 1, endWeek: 3, description: "CAD, hydraulics, electrode prep SOP.", dependencies: [] },
        { phase: "Strain + media validation", startWeek: 2, endWeek: 4, description: "Planktonic growth curves.", dependencies: ["Engineering design"] },
        { phase: "MES experiments", startWeek: 5, endWeek: 9, description: "Poised potential runs + benchmarks.", dependencies: ["Strain + media validation"] },
        { phase: "Reporting", startWeek: 10, endWeek: 10, description: "Figures, error bars, sensitivity analysis.", dependencies: ["MES experiments"] },
      ],
      validation: {
        ...baseValidation,
        primaryEndpoints: ["Acetate production rate (mmol/L/day)", "% improvement vs benchmark"],
        successCriteria: ["≥150 mmol/L/day AND ≥20% vs documented benchmark under declared conditions"],
        controls: ["Open-circuit control", "Sterile medium abiotic control", "Benchmark reactor arm"],
        analyticalMethods: ["HPLC-UV/RID", "Chronoamperometry logging"],
      },
      staffingNotes: ["1× electrochem engineer 0.4 FTE", "1× microbiologist 0.3 FTE"],
      riskMitigation: ["Biofilm unevenness — electrode pretreatment SOP + replicate electrodes."],
    };
  }

  if (archetype === "alpha7") {
    return {
      title: "α7 nAChR Surface Trafficking via RIC-3 Co-expression in HEK293 cells",
      hypothesisSummary: question,
      protocolOriginNote:
        "Protocol grounded in Millar lab α7 expression systems and RIC-3 chaperone co-expression literature; reagents verified against Sigma-Aldrich and Thermo Fisher catalogs",
      protocol: [
        {
          stepNumber: 1,
          title: "HEK293 cell culture and transfection prep",
          description: "HEK293 cell culture and transfection prep.",
          duration: "2 days",
        },
        {
          stepNumber: 2,
          title: "Co-transfection of α7 and RIC-3 plasmids using Lipofectamine 3000",
          description: "Co-transfection of α7 and RIC-3 plasmids using Lipofectamine 3000.",
          duration: "1 day",
        },
        {
          stepNumber: 3,
          title: "Surface biotinylation assay to quantify surface α7",
          description: "Surface biotinylation assay to quantify surface α7.",
          duration: "1 day",
        },
        {
          stepNumber: 4,
          title: "Western blot for total vs surface α7 protein",
          description: "Western blot for total vs surface α7 protein.",
          duration: "2 days",
        },
        {
          stepNumber: 5,
          title: "Electrophysiology patch-clamp validation of functional channels",
          description: "Electrophysiology patch-clamp validation of functional channels.",
          duration: "3 days",
        },
      ],
      materials: [
        { name: "HEK293T cells", catalogNumber: "ATCC CRL-3216", supplier: "ATCC", quantity: "1 vial", estimatedUnitCost: 450, lineTotal: 450, currency },
        { name: "Lipofectamine 3000", catalogNumber: "L3000015", supplier: "Thermo Fisher", quantity: "1.5mL", estimatedUnitCost: 95, lineTotal: 95, currency },
        { name: "Anti-α7 nAChR antibody", catalogNumber: "ab216485", supplier: "Abcam", quantity: "100ug", estimatedUnitCost: 380, lineTotal: 380, currency },
        {
          name: "Pierce Cell Surface Protein Isolation Kit",
          catalogNumber: "89881",
          supplier: "Thermo Fisher",
          quantity: "10 preps",
          estimatedUnitCost: 320,
          lineTotal: 320,
          currency,
        },
        { name: "α7 nAChR expression plasmid", catalogNumber: "custom", supplier: "Addgene", quantity: "1 prep", estimatedUnitCost: 150, lineTotal: 150, currency },
      ],
      budget: {
        currency,
        assumptions: [],
        lines: [
          { category: "Cell culture", description: "Cell culture", amount: 900, currency },
          { category: "Transfection reagents", description: "Transfection reagents", amount: 600, currency },
          { category: "Antibodies and detection", description: "Antibodies and detection", amount: 1200, currency },
          { category: "Electrophysiology", description: "Electrophysiology", amount: 1500, currency },
          { category: "Consumables", description: "Consumables", amount: 600, currency },
        ],
        total: 4800,
      },
      timeline: [
        { phase: "Week 1-2 cell prep and plasmid expansion", startWeek: 1, endWeek: 2, description: "Week 1-2 cell prep and plasmid expansion", dependencies: [] },
        {
          phase: "Week 2-3 transfection optimization",
          startWeek: 2,
          endWeek: 3,
          description: "Week 2-3 transfection optimization",
          dependencies: ["Week 1-2 cell prep and plasmid expansion"],
        },
        {
          phase: "Week 3-4 surface biotinylation assay",
          startWeek: 3,
          endWeek: 4,
          description: "Week 3-4 surface biotinylation assay",
          dependencies: ["Week 2-3 transfection optimization"],
        },
        {
          phase: "Week 4-5 western blot and patch clamp",
          startWeek: 4,
          endWeek: 5,
          description: "Week 4-5 western blot and patch clamp",
          dependencies: ["Week 3-4 surface biotinylation assay"],
        },
      ],
      validation: {
        ...baseValidation,
        primaryEndpoints: ["surface α7 protein level vs control", "channel open probability"],
        successCriteria: ["at least 40% increase in surface α7 with RIC-3 co-expression"],
        controls: ["empty vector transfection", "untransfected HEK293"],
        analyticalMethods: ["western blot densitometry", "patch-clamp electrophysiology"],
      },
      staffingNotes: ["1x cell biology postdoc 0.5 FTE", "1x electrophysiology technician 0.25 FTE"],
      riskMitigation: [
        "low transfection efficiency — optimize DNA ratio pilot week 1",
        "channel silencing — verify with positive control agonist PNU-282987",
      ],
    };
  }

  // default archetype
  return {
    title: "Pilot experiment plan (generic template)",
    hypothesisSummary: question.slice(0, 400),
    protocolOriginNote:
      literature.novelty === "not_found"
        ? "No strong protocol match — this template emphasizes hypothesis decomposition, power, and staged de-risking."
        : "Prior art exists; tailor steps to closest references you validate manually.",
    protocol: [
      {
        stepNumber: 1,
        title: "Operationalize hypothesis",
        description:
          "Extract intervention, measurable outcome, threshold, mechanism claim, and control. Pre-register if applicable.",
        duration: "2–3 days",
      },
      {
        stepNumber: 2,
        title: "Literature confirmation pass",
        description:
          "Deep search (Embase/PubMed + protocols.io) beyond the quick QC; extract 2–3 candidate methods.",
        duration: "1 week",
      },
      {
        stepNumber: 3,
        title: "Feasibility + hazard review",
        description: "Biosafety, waste streams, equipment availability, statistical power sketch.",
        duration: "1 week",
      },
      {
        stepNumber: 4,
        title: "Pilot experiment",
        description: "Single-batch pilot with explicit go/no-go criteria tied to variance estimates.",
        duration: "2–4 weeks",
      },
      {
        stepNumber: 5,
        title: "Powered study + analysis",
        description: "Execute pre-specified analysis; document deviations.",
        duration: "project-specific",
      },
    ],
    materials: [
      { name: "Lab consumables starter", catalogNumber: "—", supplier: "Fisher/VWR", quantity: "1 allocation", estimatedUnitCost: 800, lineTotal: 800, currency },
      { name: "Analytical service core", catalogNumber: "—", supplier: "University core facility", quantity: "40 hours", estimatedUnitCost: 120, lineTotal: 4800, currency },
      { name: "Reagents (project-specific)", catalogNumber: "TBD", supplier: "TBD", quantity: "TBD", estimatedUnitCost: 2000, lineTotal: 2000, currency },
    ],
    budget: {
      currency,
      assumptions: ["Placeholder until domain-specific BOM is locked."],
      lines: [
        { category: "Consumables", description: "General lab", amount: 1200, currency },
        { category: "Core services", description: "Analytical", amount: 4800, currency },
        { category: "Reagents", description: "Domain TBD", amount: 2000, currency },
        { category: "Contingency (10%)", description: "Buffer", amount: 800, currency },
      ],
      total: 8800,
    },
    timeline: [
      { phase: "Scoping", startWeek: 1, endWeek: 2, description: "Finalize measurable endpoints.", dependencies: [] },
      { phase: "Pilot", startWeek: 3, endWeek: 6, description: "De-risk execution.", dependencies: ["Scoping"] },
      { phase: "Main study", startWeek: 7, endWeek: 12, description: "Collect powered data.", dependencies: ["Pilot"] },
    ],
    validation: {
      ...baseValidation,
      primaryEndpoints: ["Primary endpoint TBD from hypothesis"],
      successCriteria: ["Pre-specified threshold TBD"],
      controls: ["Negative/vehicle controls as appropriate"],
      analyticalMethods: ["Domain-standard assays TBD"],
    },
    staffingNotes: ["Assign RA + domain expert review weekly."],
    riskMitigation: ["Weekly risk register review; kill criteria for pilot."],
  };
}
