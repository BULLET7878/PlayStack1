# 🏌️‍♂️ Fairway Rewards: Play Your Game. Change Their World.

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-626cd9)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fairway Rewards is a premium, full-stack golf reward platform that transforms every Stableford point into a force for good. Golfers can log their scores, enter tiered monthly draws for legendary prizes, and support life-changing charity causes—all within a cinematic, high-performance UI.

---

## 🚀 Key Features

- **🏆 Integrated Scoring-to-Reward Engine**: Log your latest rounds. Every point counts towards matching frequency in the monthly prize draw.
- **❤️ Charity-First Subscriptions**: A significant percentage of every membership goes directly to featured impact partners (veterans, youth golf, and more).
- **⏱️ Live Draw Countdown**: Real-time momentum with a dynamic countdown to the next algorithmic prize distribution.
- **💎 Premium Tiers**: Three levels of membership (Birdie, Eagle, Albatross) with escalating prize pool access and hospitality perks.
- **⚡ Pro-level Dashboards**: Comprehensive analytics for both players and administrators.
- **📱 Responsive & Cinematic**: A full-bleed, golf-centric design built with Framer Motion for a luxury feel.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Custom CSS (Golf Aesthetic).
- **Backend**: Node.js, Express, JWT Authentication, Helmet.
- **Database**: Supabase (PostgreSQL) with custom triggers for rolling 5-score limits.
- **Payments**: Stripe (Subscription Management & Webhooks).

---

## 📦 Getting Started

### 1. Database Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Run the provided SQL in the **SQL Editor**:
   - [database/schema.sql](database/schema.sql) - This initializes all tables, triggers, and seed data.

### 2. Environment Configuration
Create a `.env` file in the `server/` directory (see [.env.example](server/.env.example)):
```env
PORT=5001
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_random_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Installation & Execution
```bash
# Terminal 1: Backend
cd server
npm install
npm start

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

---

## 📜 Development History
This project followed a professional, sequential development cycle documented through 20 detailed Git commits (April 16-17, 2026), moving from architecture foundations to the final premium UI delivery.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Play Your Game. Change Their World.* ⛳✨
