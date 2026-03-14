# Nexus – Autonomous AI Freelance Escrow Platform

🌐 **Live demo:** [https://nexus-escrow.netlify.app/](https://nexus-escrow.netlify.app/)

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/nexus-escrow/deploys)

> **The AI Agent That Pays Fairly. Every Time.**  
> Nexus eliminates payment disputes and project chaos. Our autonomous AI generates milestones, holds funds in escrow, evaluates submissions, and releases payments — with zero human bias.

---

## Overview

Nexus is a full‑stack Next.js application that reimagines freelancing by introducing an **autonomous AI intermediary**. Employers post project briefs, and the AI:

- Decomposes vague requirements into **structured, time‑bound milestones**.
- Holds project funds in a secure **escrow vault**.
- Evaluates freelancer submissions using **LLM‑powered quality assurance**.
- Automatically releases **micropayments** upon milestone completion.
- Maintains a **Professional Fidelity Index (PFI)** – a merit‑based reputation score for freelancers.

This removes the "trust gap", manual oversight, and payment delays that plague traditional freelancing platforms.

---

## Key Features

- **AI Milestone Generation** – Paste a project brief; the AI returns a detailed roadmap with acceptance criteria.
- **Autonomous Escrow** – Funds are locked and released only for verified work.
- **Automated Quality Assurance** – Every submission is evaluated by an LLM (Groq/Llama 3). Fully done → immediate payout; partial → pro‑rated feedback; unmet → refund triggered.
- **Professional Fidelity Index (PFI)** – Dynamic reputation score based on milestone accuracy, speed, and quality. Transparent and bias‑free.
- **Role‑Specific Dashboards** – Separate views for employers and freelancers, with real‑time project tracking.
- **Dark Mode** – Full theme support with a sleek, modern UI.
- **Responsive Design** – Works seamlessly on desktop, tablet, and mobile.

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + CSS variables for theming
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Authentication & Database:** [Supabase](https://supabase.com/) (PostgreSQL, RLS, Auth)
- **AI:** [Groq](https://groq.com/) (Llama‑3.3‑70b‑versatile) for milestone generation and submission evaluation
- **Deployment:** [Netlify](https://www.netlify.com/) (with continuous deployment from GitHub)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project (with the provided SQL schema)
- Groq API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nexus-escrow.git
   cd nexus-escrow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root with your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app.

### Database Setup
The required SQL schema is included in the repository (see `schema.sql`). Run it in your Supabase SQL editor to create tables, enable RLS, and set up the profile trigger.

---

## Testing the Flow

1. **Sign up as an employer** – create a project, let AI generate milestones, fund it.
2. **Sign up as a freelancer** – accept the project, submit work, watch AI evaluation and payment release.
3. **Check PFI updates** – visit the profile page to see reputation changes.

A guest demo page is also available at `/demo` with simulated data.

---

## Problem Statement Addressed

This project was built for the **BitByBit 36‑Hour Fullstack Hackathon** at IIT Roorkee. It directly solves the challenge of **manual intermediation in freelancing** by providing an autonomous AI agent that handles project scoping, escrow, quality assurance, and reputation scoring. The core pillars – intelligent requirement analysis, automated escrow, AI quality assurance, and PFI – are fully implemented.

---

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Groq](https://groq.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Netlify](https://www.netlify.com/)

