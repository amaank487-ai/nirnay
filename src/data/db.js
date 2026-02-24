const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "..", "nirnayai.sqlite");
const db = new sqlite3.Database(dbPath);

function ensureUserIdColumn() {
  db.all("PRAGMA table_info(simulations)", (err, rows) => {
    if (err || !rows) return;
    const hasUserId = rows.some((row) => row.name === "user_id");
    if (!hasUserId) {
      db.run("ALTER TABLE simulations ADD COLUMN user_id TEXT DEFAULT 'guest'");
    }
  });
}

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'guest',
        decision TEXT NOT NULL,
        category TEXT NOT NULL,
        horizon TEXT NOT NULL,
        risk_tolerance TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        scenarios_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    ensureUserIdColumn();
  });
}

function saveSimulation({ userId = "guest", decision, category, horizon, riskTolerance, answers, scenarios }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO simulations (user_id, decision, category, horizon, risk_tolerance, answers_json, scenarios_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        decision,
        category,
        horizon,
        riskTolerance,
        JSON.stringify(answers),
        JSON.stringify(scenarios)
      ],
      function onInsert(err) {
        if (err) return reject(err);
        return resolve(this.lastID);
      }
    );
  });
}

function listSimulations(limit = 20, userId = null) {
  return new Promise((resolve, reject) => {
    const sqlBase = `SELECT id, user_id as userId, decision, category, horizon, risk_tolerance as riskTolerance, created_at as createdAt
       FROM simulations`;

    const sql = userId
      ? `${sqlBase} WHERE user_id = ? ORDER BY id DESC LIMIT ?`
      : `${sqlBase} ORDER BY id DESC LIMIT ?`;

    const args = userId ? [userId, limit] : [limit];

    db.all(sql, args, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });
}

function getSimulationCountToday(userId = "guest") {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count
       FROM simulations
       WHERE user_id = ?
         AND date(created_at) = date('now', 'localtime')`,
      [userId],
      (err, row) => {
        if (err) return reject(err);
        return resolve(row?.count || 0);
      }
    );
  });
}

module.exports = {
  initDb,
  saveSimulation,
  listSimulations,
  getSimulationCountToday
};
