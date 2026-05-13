# Nexus — AI-Powered Freelance Escrow Platform

🌐 Live Demo: [https://nexus-escrow.netlify.app/](https://nexus-escrow.netlify.app/)

> Autonomous milestone generation, AI-based work evaluation, escrow-backed payments, and reputation scoring — built for modern freelance workflows.

---

# Overview

Nexus is a full-stack AI-powered freelance escrow platform designed to reduce payment disputes, unclear project scopes, and manual verification overhead in remote work environments.

The platform uses LLM-driven workflows to:

* Convert project briefs into structured milestones
* Evaluate submitted work automatically
* Release escrow payments based on completion quality
* Maintain a dynamic reputation scoring system for freelancers

The system combines AI automation, secure workflow management, and modern UI/UX to simulate an intelligent project mediation layer between employers and freelancers.

---

# Core Features

## AI Milestone Generation

Generate structured deliverables, timelines, and acceptance criteria from natural-language project briefs.

## Escrow-Based Payment Workflow

Project funds remain locked until milestone validation is completed.

## AI Submission Evaluation

Integrated LLM evaluation pipeline reviews freelancer submissions and generates:

* Completion assessment
* Quality feedback
* Payment decision recommendations

## Professional Fidelity Index (PFI)

Custom reputation scoring system based on:

* Submission quality
* Delivery consistency
* Completion accuracy
* Turnaround efficiency

## Role-Based Dashboards

Separate interfaces for:

* Employers
* Freelancers

with real-time project tracking and milestone management.

## Responsive Modern UI

* Dark mode support
* Fully responsive layout
* Smooth animations and transitions
* Optimized for desktop and mobile

---

# Tech Stack

| Category       | Technologies                  |
| -------------- | ----------------------------- |
| Frontend       | Next.js 15, React, TypeScript |
| Styling        | Tailwind CSS, Framer Motion   |
| Backend        | Supabase, PostgreSQL          |
| Authentication | Supabase Auth                 |
| AI Integration | Groq API, Llama 3             |
| Deployment     | Netlify                       |

---

# System Workflow

1. Employer creates a project brief
2. AI generates milestones automatically
3. Employer funds escrow vault
4. Freelancer submits milestone work
5. AI evaluates submission quality
6. Payment is released automatically based on evaluation
7. Reputation score updates dynamically

---

# Installation

## Clone Repository

```bash
git clone https://github.com/n-ikitasingh/Nexus-escrow.git
cd Nexus-escrow
```

## Install Dependencies

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```
---

## Folder Structure

```txt
app/
components/
lib/
public/
```

---
## Start Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# Project Highlights

* AI-driven workflow automation
* LLM-based quality evaluation system
* Full-stack architecture with authentication and database integration
* Escrow-inspired transactional workflow simulation
* Clean responsive UI with production-style dashboard design
* Modular component architecture using Next.js App Router

---

# Future Improvements

* Blockchain-backed escrow integration
* Multi-agent evaluation system
* Real-time collaboration tools
* Smart contract automation
* Advanced analytics dashboard
* AI negotiation assistant



