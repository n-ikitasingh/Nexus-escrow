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
