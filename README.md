# KeywordTool - Functional Build

A production-ready keyword research tool built with Next.js 15, Tailwind CSS 4, and Zustand.

## Features

- **Functional Search**: Real-time keyword analysis with mock data engine.
- **Credit Tracking**: Local credit management (30 searches free limit) with persistent storage.
- **Project Management**: Save keywords to your local workspace for future reference.
- **Modern UI**: Dark-mode first, glassmorphic design inspired by premium SaaS tools.
- **Responsive**: Fully optimized for mobile and desktop experiences.

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env.local`.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Visit**: [http://localhost:3001](http://localhost:3001)

## Mock Engine Logic

The tool currenty uses a mock engine (`/api/keywords`) to simulate:
- Long-tail keyword expansion.
- Search volume & Competition scoring.
- CPC estimation.
- Keyword intent classification.

## Future Upgrades (Supabase + Stripe)

- [ ] Connect Supabase Auth.
- [ ] Migrate credits to Supabase DB.
- [ ] Integrate Stripe for Pro plan upgrades.
- [ ] Connect Gemini API for real-time long-tail analysis.
