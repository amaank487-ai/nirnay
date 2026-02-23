const USER_ID = "guest";

const decisionEl = document.getElementById("decision");
const categoryEl = document.getElementById("category");
const horizonEl = document.getElementById("horizon");
const riskToleranceEl = document.getElementById("riskTolerance");
const clarifyBtn = document.getElementById("clarifyBtn");
const hintEl = document.getElementById("hint");
const questionsSection = document.getElementById("questionsSection");
const scenariosSection = document.getElementById("scenariosSection");
const entitlementSummaryEl = document.getElementById("entitlementSummary");

let prompts = [];
let latestScenarios = null;
let followUpInsights = [];
let latestEntitlements = null;

const suggestedFollowUps = [
  "Re-run assuming income grows slower than expected",
  "Add family dependency constraint",
  "Stress test for higher living costs",
  "Evaluate downside if timeline extends by 6 months"
];

function getAnswers() {
  return prompts.map((prompt, index) => {
    const input = document.querySelector(`[data-answer-index="${index}"]`);
    return { prompt, answer: input ? input.value.trim() : "" };
  });
}

function renderEntitlements(entitlements) {
  if (!entitlementSummaryEl || !entitlements) return;

  const usageText =
    entitlements.simulationLimitPerDay === null
      ? "Unlimited daily simulations"
      : `${entitlements.usage.usedToday}/${entitlements.simulationLimitPerDay} used today · ${entitlements.usage.remainingToday} remaining`;

  entitlementSummaryEl.innerHTML = `
    <strong>${entitlements.planName} plan</strong>
    <p class="hint">${usageText}</p>
    <p class="hint">Premium Decision Reports: ${entitlements.premiumReportsEnabled ? "Unlocked" : "Locked"}</p>
  `;
}

async function loadEntitlements() {
  try {
    const res = await fetch(`/api/entitlements?userId=${encodeURIComponent(USER_ID)}`);
    const data = await res.json();
    if (!res.ok) return;

    latestEntitlements = data;
    renderEntitlements(data);
  } catch (_) {
    // Best-effort display only; avoid breaking main flow.
  }
}

function buildFollowUpInsight(question) {
  const normalized = question.toLowerCase();

  if (normalized.includes("family") || normalized.includes("depend")) {
    return {
      title: "Family obligation sensitivity",
      points: [
        "Decisions with fixed family outflows have lower tolerance for prolonged uncertainty.",
        "Maintain a protected monthly support threshold before increasing risk exposure.",
        "Reversibility becomes more important than upside in the first 6-9 months."
      ]
    };
  }

  if (normalized.includes("cost") || normalized.includes("rent") || normalized.includes("emi")) {
    return {
      title: "Cost pressure check",
      points: [
        "A modest increase in fixed costs can materially reduce execution runway.",
        "Budget resilience improves when discretionary spending is separated from essentials.",
        "Scenario quality improves with city-specific rent and commute validation."
      ]
    };
  }

  if (normalized.includes("timeline") || normalized.includes("month") || normalized.includes("delay")) {
    return {
      title: "Timeline extension impact",
      points: [
        "Longer timelines increase emotional and financial carrying costs.",
        "Milestone-based reviews can prevent delayed decisions from compounding risk.",
        "A fallback trigger date reduces drift and preserves option value."
      ]
    };
  }

  return {
    title: "Refinement insight",
    points: [
      "This follow-up changes the risk distribution more than the headline upside.",
      "Prioritize constraints that affect cash flow, reversibility, and execution bandwidth.",
      "Use this insight as an additional assumption layer, not a single definitive answer."
    ]
  };
}

function renderQuestions() {
  questionsSection.innerHTML = `
    <h2>Clarifying Questions</h2>
    <p class="hint">Focused prompts to reduce uncertainty before simulation.</p>
    <div class="question-grid">
      ${prompts
        .map(
          (prompt, index) => `
            <label class="question-card">
              <span>${prompt}</span>
              <input data-answer-index="${index}" placeholder="Add your response" />
            </label>
          `
        )
        .join("")}
    </div>
    <button id="simulateBtn">Generate results</button>
  `;

  questionsSection.classList.remove("hidden");
  scenariosSection.classList.add("hidden");

  document.getElementById("simulateBtn").addEventListener("click", onSimulate);
}

function renderScenarios(scenarios) {
  scenariosSection.innerHTML = `
    <h2>Results</h2>
    <div class="scenario-grid">
      <article class="scenario-card optimistic">
        <h3>Optimistic Path</h3>
        <ul>${scenarios.optimisticPath.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
      <article class="scenario-card likely">
        <h3>Most Likely Path</h3>
        <ul>${scenarios.mostLikelyPath.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
      <article class="scenario-card risk">
        <h3>Risk Path</h3>
        <ul>${scenarios.riskPath.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
      <article class="scenario-card blindspots">
        <h3>Hidden Trade-offs</h3>
        <ul>${scenarios.hiddenTradeOffs.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
      <article class="scenario-card assumptions">
        <h3>Assumptions Used</h3>
        <ul>${scenarios.assumptionsUsed.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
    </div>

    <section class="panel refinement-panel">
      <div class="refinement-head">
        <h3>Follow-up refinement</h3>
        <button id="openRefinementBtn" class="secondary-action">Refine this simulation</button>
      </div>

      <div id="refinementControls" class="hidden">
        <label>
          Ask one follow-up question
          <input id="followUpInput" placeholder="Example: What changes if my monthly rent is 20% higher?" />
        </label>

        <p class="hint">Suggested follow-ups</p>
        <div class="chip-row">
          ${suggestedFollowUps
            .map((chip) => `<button type="button" class="chip" data-chip="${chip}">${chip}</button>`)
            .join("")}
        </div>

        <button id="applyRefinementBtn">Generate refinement insights</button>
      </div>
    </section>

    <section class="panel premium-panel">
      <div class="refinement-head">
        <h3>Premium Decision Report</h3>
        <button id="premiumReportBtn">Generate premium report</button>
      </div>
      <div id="premiumReportOutput" class="hint"></div>
    </section>

    <section id="insightsSection" class="panel ${followUpInsights.length ? "" : "hidden"}">
      <h3>New Insights</h3>
      <div class="insight-grid">
        ${followUpInsights
          .map(
            (insight) => `
              <article class="insight-card">
                <h4>${insight.title}</h4>
                <ul>${insight.points.map((point) => `<li>${point}</li>`).join("")}</ul>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;

  scenariosSection.classList.remove("hidden");

  const openBtn = document.getElementById("openRefinementBtn");
  const controls = document.getElementById("refinementControls");
  const applyBtn = document.getElementById("applyRefinementBtn");
  const input = document.getElementById("followUpInput");
  const premiumBtn = document.getElementById("premiumReportBtn");
  const premiumOutput = document.getElementById("premiumReportOutput");

  if (openBtn && controls) {
    openBtn.addEventListener("click", () => {
      controls.classList.remove("hidden");
      input?.focus();
    });
  }

  document.querySelectorAll(".chip").forEach((chipBtn) => {
    chipBtn.addEventListener("click", () => {
      if (!input) return;
      input.value = chipBtn.getAttribute("data-chip") || "";
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const question = input ? input.value.trim() : "";
      if (!question) return;

      const insight = buildFollowUpInsight(question);
      followUpInsights = [
        ...followUpInsights,
        {
          ...insight,
          points: [...insight.points, `Follow-up considered: ${question}.`]
        }
      ];

      renderScenarios(latestScenarios);
    });
  }

  if (premiumBtn) {
    premiumBtn.addEventListener("click", async () => {
      premiumOutput.textContent = "Generating premium report...";
      const res = await fetch("/api/reports/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
        body: JSON.stringify({ decision: decisionEl.value.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        premiumOutput.textContent = data.error || "Premium report is currently unavailable.";
        if (data.entitlements) {
          latestEntitlements = data.entitlements;
          renderEntitlements(data.entitlements);
        }
        return;
      }

      premiumOutput.innerHTML = `
        <strong>${data.report.title}</strong>
        <p>${data.report.summary}</p>
        <ul>${data.report.sections.map((item) => `<li>${item}</li>`).join("")}</ul>
      `;
    });
  }
}

async function onClarify() {
  const decision = decisionEl.value.trim();
  if (decision.length < 20) {
    hintEl.textContent = "Please add at least 20 characters so the simulation has enough context.";
    return;
  }

  hintEl.textContent = "";

  const res = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
    body: JSON.stringify({ decision, category: categoryEl.value })
  });

  const data = await res.json();
  if (!res.ok) {
    hintEl.textContent = data.error || "Could not generate clarifying questions.";
    return;
  }

  prompts = data.prompts || [];
  followUpInsights = [];
  renderQuestions();
}

async function onSimulate() {
  const payload = {
    decision: decisionEl.value.trim(),
    category: categoryEl.value,
    horizon: horizonEl.value.trim(),
    riskTolerance: riskToleranceEl.value,
    answers: getAnswers()
  };

  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    hintEl.textContent = data.error || "Failed to generate results.";
    if (data.entitlements) {
      latestEntitlements = data.entitlements;
      renderEntitlements(data.entitlements);
    }
    return;
  }

  latestScenarios = data.scenarios;
  if (data.entitlements) {
    latestEntitlements = data.entitlements;
    renderEntitlements(data.entitlements);
  }
  renderScenarios(data.scenarios);
}

if (clarifyBtn) {
  clarifyBtn.addEventListener("click", onClarify);
}

loadEntitlements();
