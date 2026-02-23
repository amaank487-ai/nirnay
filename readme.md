# NirnayAI (GitHub-ready MVP)

NirnayAI is a production-style MVP web app for **decision simulation** (not chat) with:
- Node.js + Express backend
- SQLite persistence
- Plain HTML/CSS/JS frontend
- Monetization-ready tier and feature gating layer (no payment provider yet)

---

## 1) Tech stack

- **Backend:** Node.js, Express
- **Database:** SQLite (file-based)
- **Frontend:** Static HTML + CSS + vanilla JS
- **Architecture pattern:**
  - Simulation engine (`aiService`)
  - Monetization/plan logic (`monetizationService`)
  - Access enforcement (`accessControlService`)
  - API/controller layer (`server.js`)
  - Persistence (`db.js`)

---

## 2) Full folder structure

```text
nirnay/
├── .gitignore
├── package.json
├── README.md
├── server.js
├── public/
│   ├── index.html          # Landing
│   ├── auth.html           # Login / Signup
│   ├── home.html           # Decision input + clarifying + results + refinement
│   ├── history.html        # Saved simulations
│   ├── profile.html        # Profile view
│   ├── app.js              # Frontend product flow logic
│   └── styles.css          # Global UI system
└── src/
    ├── data/
    │   └── db.js           # SQLite schema + queries + usage tracking
    └── services/
        ├── aiService.js            # Clarifying engine + scenario generation
        ├── monetizationService.js  # Plans + entitlements abstraction
        └── accessControlService.js # Tier limits + feature gating checks
```

---

## 3) package.json

```json
{
  "name": "nirnayai-mvp",
  "version": "0.2.0",
  "private": true,
  "description": "NirnayAI MVP - decision simulation engine",
  "main": "server.js",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "sqlite3": "^5.1.7"
  }
}
```

---

## 4) Run instructions (required flow)

### Install
```bash
npm install
```

### Start
```bash
npm start
```

### Open app
- Landing: `http://localhost:3000/`
- Home: `http://localhost:3000/home.html`
- History: `http://localhost:3000/history.html`

> This project is set up so the runtime command is exactly `npm start`.

---

## 5) API overview

- `GET /health`
- `GET /api/meta/categories`
- `GET /api/entitlements` (plan + usage)
- `POST /api/clarify`
- `POST /api/simulate` (free-tier usage checks enforced)
- `POST /api/reports/premium` (subscription-gated)
- `GET /api/simulations` (user-scoped)

---

## 6) Monetization-ready model (no provider yet)

### Free tier
- Daily simulation limits enforced server-side.
- Premium reports locked.

### Pro subscription
- Unlimited simulations.
- Premium report access enabled.

### Separation for future payment integration
- `monetizationService` owns plan resolution.
- `accessControlService` owns entitlement checks.
- `server.js` only orchestrates routes + calls service checks.

This means Stripe/Razorpay/other billing can be integrated later by replacing mock subscription resolution without rewriting scenario generation.

---

## 7) Deployment suggestions

### Option A: Render (simple Node deploy)
1. Push repo to GitHub.
2. Create Render Web Service.
3. Build command: `npm install`
4. Start command: `npm start`
5. Set persistent disk if you want SQLite data persistence across deploys.

### Option B: Railway
1. Connect GitHub repo.
2. Railway auto-runs install/start from `package.json`.
3. Attach persistent volume for SQLite durability.

### Option C: VPS (Ubuntu)
1. `git clone`
2. `npm install`
3. `npm start` (or use PM2)
4. Reverse proxy with Nginx.

---

## 8) Product UX constraints implemented

- Non-chat interface
- Card-based structured outputs
- Clarifying-question step
- Results + follow-up refinement
- Prior simulation remains visible while new insights append
- Minimal, premium, mobile-first UI

---

## 9) Notes

- Current user identity defaults to `guest` unless `x-user-id` or `userId` is provided.
- SQLite DB file is created at runtime (`nirnayai.sqlite`) and ignored in Git.
