function saveHistory(item) {
  const key = "nirnayai_history";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(item);
  localStorage.setItem(key, JSON.stringify(existing));
}

function loadHistory() {
  const key = "nirnayai_history";
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function simulate() {
  const dilemma = document.getElementById("dilemma").value.trim();
  if (!dilemma) {
    alert("Please write your dilemma first.");
    return;
  }

  // MVP: mock output (later we connect real AI)
  const result = {
    optimistic: "If your finances stay stable and the bike fits your routine, this can improve mobility and save time.",
    likely: "Most likely outcome depends on EMI + running costs. Keep a monthly cap to avoid stress.",
    risk: "Big risk is underestimating total ownership cost or adding EMIs without a buffer.",
    tradeoffs: "Hidden factors: gear cost, monsoon riding, parking/security, service quality, resale value.",
    assumptions: "Assumptions: based on typical Indian purchase patterns. Add a profile later."
  };

  // Save to history
  saveHistory({
    id: Date.now(),
    dilemma,
    result,
    createdAt: new Date().toISOString()
  });

  // Render
  document.getElementById("output").innerHTML = `
    <div class="card"><b>Optimistic Path</b><div class="small">${result.optimistic}</div></div>
    <div class="card"><b>Most Likely Path</b><div class="small">${result.likely}</div></div>
    <div class="card"><b>Risk Path</b><div class="small">${result.risk}</div></div>
    <div class="card"><b>Hidden Trade-offs</b><div class="small">${result.tradeoffs}</div></div>
    <div class="card"><b>Assumptions Used</b><div class="small">${result.assumptions}</div></div>
  `;
}

function renderHistory() {
  const list = loadHistory();
  const el = document.getElementById("historyList");
  if (!el) return;

  if (list.length === 0) {
    el.innerHTML = `<div class="card">No history yet.</div>`;
    return;
  }

  el.innerHTML = list.map(item => `
    <div class="card">
      <b>${item.dilemma}</b>
      <div class="small">${new Date(item.createdAt).toLocaleString()}</div>
    </div>
  `).join("");
}
