const express = require("express");
const path = require("path");
const { initDb, saveSimulation, listSimulations, getSimulationCountToday } = require("./src/data/db");
const { getClarifyingQuestions, generateScenarioCards, categories } = require("./src/services/aiService");
const {
  getUsageSnapshot,
  canRunSimulation,
  canGeneratePremiumReport
} = require("./src/services/accessControlService");

const app = express();
const PORT = process.env.PORT || 3000;

initDb();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function resolveUserId(req) {
  return req.header("x-user-id") || req.query.userId || "guest";
}

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "nirnayai", timestamp: new Date().toISOString() });
});

app.get("/api/meta/categories", (_, res) => {
  res.json({ categories });
});

app.get("/api/entitlements", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const snapshot = await getUsageSnapshot({ userId, getSimulationCountToday });
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load entitlements", details: error.message });
  }
});

app.post("/api/clarify", (req, res) => {
  const { decision, category } = req.body;

  if (!decision || decision.trim().length < 20) {
    return res.status(400).json({ error: "Decision context must be at least 20 characters." });
  }

  const prompts = getClarifyingQuestions(category || "other", decision);
  return res.json({ prompts });
});

app.post("/api/simulate", async (req, res) => {
  const { decision, category, horizon, riskTolerance, answers } = req.body;
  const userId = resolveUserId(req);

  if (!decision || decision.trim().length < 20) {
    return res.status(400).json({ error: "Decision context must be at least 20 characters." });
  }

  try {
    const usageSnapshot = await getUsageSnapshot({ userId, getSimulationCountToday });
    const access = canRunSimulation(usageSnapshot);
    if (!access.allowed) {
      return res.status(403).json({
        error: access.message,
        code: access.reason,
        entitlements: usageSnapshot
      });
    }

    const payload = {
      decision: decision.trim(),
      category: category || "other",
      horizon: horizon || "12 months",
      riskTolerance: riskTolerance || "balanced",
      answers: answers || []
    };

    const scenarios = generateScenarioCards(payload);
    const id = await saveSimulation({ userId, ...payload, scenarios });
    const updatedEntitlements = await getUsageSnapshot({ userId, getSimulationCountToday });

    return res.json({ id, scenarios, entitlements: updatedEntitlements });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save simulation", details: error.message });
  }
});

app.post("/api/reports/premium", async (req, res) => {
  const userId = resolveUserId(req);
  const { decision } = req.body;

  try {
    const usageSnapshot = await getUsageSnapshot({ userId, getSimulationCountToday });
    const access = canGeneratePremiumReport(usageSnapshot);

    if (!access.allowed) {
      return res.status(403).json({
        error: access.message,
        code: access.reason,
        entitlements: usageSnapshot
      });
    }

    const report = {
      title: "Premium Decision Report",
      summary: `Deep-dive report for: ${decision || "your decision context"}`,
      sections: [
        "Sensitivity analysis (income, costs, timeline)",
        "Downside guardrails and reversal triggers",
        "Execution checkpoints for the next 90 days"
      ]
    };

    return res.json({ report, entitlements: usageSnapshot });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate premium report", details: error.message });
  }
});

app.get("/api/simulations", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await listSimulations(20, userId);
    return res.json({ simulations: rows });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load simulations", details: error.message });
  }
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`NirnayAI server running on http://localhost:${PORT}`);
});
