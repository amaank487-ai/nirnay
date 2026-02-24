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

function fillExample(text){
  const el = document.getElementById("dilemma");
  if (el) el.value = text;
}

function clearOutput(){
  const out = document.getElementById("output");
  if (out) out.innerHTML = "";
}

function renderResult(result){
  const out = document.getElementById("output");
  if (!out) return;

  out.innerHTML = `
    <div class="resultGrid">
      <div class="resultCard">
        <div class="resultHead">
          <div class="icon good">✓</div>
          <b>Optimistic Path</b>
        </div>
        <p>${result.optimistic}</p>
      </div>

      <div class="resultCard">
        <div class="resultHead">
          <div class="icon likely">≈</div>
          <b>Most Likely Path</b>
        </div>
        <p>${result.likely}</p>
      </div>

      <div class="resultCard">
        <div class="resultHead">
          <div class="icon risk">!</div>
          <b>Risk Path</b>
        </div>
        <p>${result.risk}</p>
      </div>

      <div class="resultCard">
        <div class="resultHead">
          <div class="icon trade">⟡</div>
          <b>Hidden Trade-offs</b>
        </div>
        <p>${result.tradeoffs}</p>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="label">Assumptions Used</div>
      <div class="small">${result.assumptions}</div>
    </div>
  `;
}

function simulate() {
  const dilemma = document.getElementById("dilemma")?.value?.trim();
  if (!dilemma) {
    alert("Please write your dilemma first.");
    return;
  }

  // MVP: mock output (later we connect real AI)
  const result = {
    optimistic: "If your monthly surplus comfortably covers EMI + running costs, the bike improves mobility and saves time quickly.",
    likely: "Most likely this becomes a 'budget discipline' decision. If you cap (EMI + fuel + maintenance) and keep an emergency buffer, it stays positive.",
    risk: "The biggest risk is underestimating total ownership cost (gear, insurance, servicing, unexpected repairs) or stacking EMIs without a buffer.",
    tradeoffs: "Hidden factors: monsoon riding, parking/security, service quality near you, brand resale value, and safety gear costs.",
    assumptions: "MVP assumptions (India): EMIs impact monthly stress, surprise expenses are common, and resale/service network matters."
  };

  saveHistory({
    id: Date.now(),
    dilemma,
    result,
    createdAt: new Date().toISOString()
  });

  renderResult(result);
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
      <b>${escapeHtml(item.dilemma)}</b>
      <div class="small">${new Date(item.createdAt).toLocaleString()}</div>
    </div>
  `).join("");
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}
