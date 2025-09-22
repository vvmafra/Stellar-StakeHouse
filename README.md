# Stellar StakeHouse

Daily token-rewards staking prototype built on the **Stellar** ecosystem.  
StakeHouse lets a project create a reward pool (e.g., `10,000 KALE` over 1 year) and distribute daily rewards to participants **pro-rata** to their delegated balances.

> **Status:** WIP / hackathon prototype — frontend is live, contracts and backend are under active development.

**Live demo:** https://stellar-stake-house.vercel.app/  
**Repository:** https://github.com/vvmafra/Stellar-StakeHouse

---

## ✨ Features (current & planned)

- **Create & view stakes**: Projects can define a token, total rewards, and distribution period. Participants can discover open stakes. *(UI present; contract wiring WIP)*
- **Delegation model**: Users “delegate” balances for reward share without transferring custody. *(Contract mechanics WIP)*
- **Daily distribution logic**: Rewards split by participant share snapshots (e.g., once per day). *(Indexing/keeper strategy WIP)*
- **Stellar-first**: Designed to integrate with Soroban contracts and popular Stellar wallets. *(Wallet wiring WIP)*
- **Modern UI**: React + Vite + Tailwind + shadcn/ui.

---

## 🧱 Architecture
apps/
└─ (root) React + Vite frontend (TypeScript, Tailwind, shadcn/ui)
backend/
└─ WIP Node/Express helpers (e.g., snapshots/cron, read APIs)
contracts/
└─ stellar-stake-house/ (Rust, Soroban scaffolding)

- **Frontend** renders stake lists, details, and create/join flows.
- **Contracts (Rust/Soroban)** hold core reward accounting (indexes, emission rate, snapshots, claim).
- **Backend (Node/Express)** optional:
  - run periodic snapshot/keeper jobs if you choose off-chain scheduling,
  - offer read-optimized endpoints and indexing for the UI.

> You can run *pure on-chain* with permissionless snapshot triggers **or** hybrid with a small backend job. Pick one model and stick to it for consistency.

---

## 🧰 Tech Stack

- **Frontend:** Vite • React • TypeScript • Tailwind CSS • shadcn/ui  
- **Smart Contracts:** Rust (Soroban)  
- **Backend (optional):** Node.js/Express (WIP)  
- **Deploy:** Vercel (frontend)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or Bun, if you prefer)
- PNPM/NPM/Yarn (examples use NPM)

### 1) Clone & Install
git clone https://github.com/vvmafra/Stellar-StakeHouse.git
cd Stellar-StakeHouse
npm i

### 2) Run the Frontend
npm run dev
The dev server should start at http://localhost:5173.

### 3) (Optional) Run the Backend
cd backend
npm i
npm run dev

🧪 How the Rewards Work (Design)
Daily emission: A stake defines totalRewards over durationDays.
Per-day payout = totalRewards / durationDays.

Splitting:

userShare(D) = userDelegated(D) / totalDelegated(D)
userReward(D) = perDayPayout * userShare(D)

Snapshots:
- Option A: Permissionless on-chain function callable once per period.
- Option B: Off-chain keeper/cron calls a function at the end of each period.
Mitigations: re-entrancy guards, timestamp checks, anti-front-running at boundaries.

🔌 Wallet & Network
Default network: Stellar Testnet
Wallets: integrate with Stellar wallet (e.g., Freighter).

⚠️ Disclaimer
This is experimental software built for learning and hackathon prototyping. Do not use in production without audits and testing.
