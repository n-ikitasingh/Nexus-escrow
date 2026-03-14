// PATH: app/demo/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ShieldCheck, Star, ArrowRight, Briefcase,
  Search, CheckCircle2, Clock, DollarSign, ChevronRight, Info,
} from "lucide-react";

// ── Static demo data ──────────────────────────────────────────────
const DEMO_EMPLOYER = {
  name: "Alex Chen",
  projects: [
    { id: "d1", title: "AI Chatbot for E-commerce",  status: "in_progress", budget: 4500, milestones: 5, done: 2 },
    { id: "d2", title: "Brand Identity & Logo Pack",  status: "open",        budget: 1200, milestones: 3, done: 0 },
    { id: "d3", title: "Mobile App MVP – iOS",        status: "completed",   budget: 8000, milestones: 8, done: 8 },
  ],
};

const DEMO_FREELANCER = {
  name: "Priya Sharma",
  pfi: 86,
  myProjects: [
    { id: "f1", title: "AI Chatbot for E-commerce",  status: "in_progress", budget: 4500 },
    { id: "f2", title: "SaaS Dashboard Redesign",    status: "completed",   budget: 2800 },
  ],
  openProjects: [
    { id: "o1", title: "Brand Identity & Logo Pack",  budget: 1200, desc: "Complete brand kit — logo, colors, typography guide." },
    { id: "o2", title: "Data Pipeline Automation",    budget: 3200, desc: "Python ETL pipeline for AWS S3 → Redshift." },
    { id: "o3", title: "React Component Library",     budget: 2100, desc: "Design system with 20+ reusable Tailwind components." },
  ],
};

const statusConfig: Record<string, { label: string; color: string; bgAlpha: string }> = {
  open:        { label: "Open",        color: "#06b6d4", bgAlpha: "rgba(6,182,212,0.12)"  },
  in_progress: { label: "In Progress", color: "#a78bfa", bgAlpha: "rgba(167,139,250,0.12)" },
  completed:   { label: "Completed",   color: "#34d399", bgAlpha: "rgba(52,211,153,0.12)"  },
};

// ── Demo banner ───────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div
      className="glass rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3 mb-8"
      style={{ borderColor: "rgba(245,158,11,0.3)" }}
    >
      <Info size={15} style={{ color: "#f59e0b" }} className="flex-shrink-0" />
      <p className="text-sm flex-1" style={{ color: "var(--text-2)" }}>
        You&rsquo;re in a{" "}
        <strong style={{ color: "#f59e0b" }}>demo environment</strong> — all data
        is illustrative. No real payments or actions occur here.
      </p>
      <Link href="/signup">
        <button
          className="glow-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all hover:scale-[1.04] whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))", color: "#fff" }}
        >
          Sign Up Free <ArrowRight size={11} />
        </button>
      </Link>
    </div>
  );
}

// ── Employer demo view ────────────────────────────────────────────
function EmployerView() {
  const d = DEMO_EMPLOYER;
  const total = d.projects.reduce((s, p) => s + p.budget, 0);

  const cards = [
    { label: "Total",     value: d.projects.length, icon: Briefcase,    color: "var(--accent)" },
    { label: "Active",    value: 1,                 icon: Clock,        color: "#a78bfa" },
    { label: "Completed", value: 1,                 icon: CheckCircle2, color: "#34d399" },
    { label: "Budget",    value: `$${total.toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                {c.label}
              </span>
              <c.icon size={14} style={{ color: c.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>Projects</p>
      <div className="flex flex-col gap-3">
        {d.projects.map((p) => {
          const s = statusConfig[p.status];
          return (
            <div
              key={p.id}
              className="glass rounded-2xl px-6 py-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {p.done}/{p.milestones} milestones · AI managed
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ color: s.color, background: s.bgAlpha }}
                >
                  {s.label}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  ${p.budget.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Freelancer demo view ──────────────────────────────────────────
function FreelancerView() {
  const d = DEMO_FREELANCER;
  const pfi = d.pfi;
  const pfiColor = "#34d399";

  return (
    <>
      {/* PFI */}
      <div className="glass rounded-2xl p-7 mb-8">
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--text-3)" }}>
          Professional Fidelity Index
        </p>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-bold" style={{ color: pfiColor }}>{pfi}</span>
          <span className="text-xl mb-1" style={{ color: "var(--text-3)" }}>/100</span>
          <span
            className="ml-1 text-xs px-2.5 py-1 rounded-full font-semibold mb-1"
            style={{ color: pfiColor, background: "rgba(52,211,153,0.12)" }}
          >
            Excellent
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pfi}%` }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${pfiColor}60, ${pfiColor})` }}
          />
        </div>
      </div>

      {/* Open projects */}
      <div className="flex items-center gap-3 mb-4">
        <Search size={15} style={{ color: "#f59e0b" }} />
        <h3 className="font-semibold">Open Projects</h3>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        {d.openProjects.map((p) => (
          <div key={p.id} className="glass rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>{p.desc}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                ${p.budget.toLocaleString()}
              </span>
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold opacity-60 cursor-not-allowed"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                disabled
              >
                Accept (Demo)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My projects */}
      <div className="flex items-center gap-3 mb-4">
        <Briefcase size={15} style={{ color: "var(--accent)" }} />
        <h3 className="font-semibold">My Projects</h3>
      </div>
      <div className="flex flex-col gap-3">
        {d.myProjects.map((p) => {
          const s = statusConfig[p.status];
          return (
            <div
              key={p.id}
              className="glass rounded-2xl px-6 py-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: s.color, boxShadow: `0 0 7px ${s.color}` }}
                />
                <span className="font-medium">{p.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ color: s.color, background: s.bgAlpha }}
                >
                  {s.label}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  ${p.budget.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Main demo page ────────────────────────────────────────────────
export default function DemoPage() {
  const [view, setView] = useState<"employer" | "freelancer">("employer");

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ color: "var(--text-1)" }}>
      <div className="mesh-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-3" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--text-3)" }}>
            Interactive Demo
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            See NexusWork{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              in action.
            </span>
          </h1>
          <p className="max-w-xl" style={{ color: "var(--text-2)" }}>
            Explore the employer and freelancer views with realistic demo data. No signup required.
          </p>
        </motion.div>

        <DemoBanner />

        {/* Tab toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass w-fit flex gap-1 p-1.5 rounded-2xl mb-10"
        >
          {(["employer", "freelancer"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ color: view === v ? "#fff" : "var(--text-2)" }}
            >
              {view === v && (
                <motion.div
                  layoutId="demo-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative capitalize">{v}</span>
            </button>
          ))}
        </motion.div>

        {/* View label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            <div className="flex items-center gap-2 mb-5" style={{ color: "var(--text-3)" }}>
              <span className="text-sm">Viewing as</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {view === "employer" ? DEMO_EMPLOYER.name : DEMO_FREELANCER.name}
              </span>
              <span
                className="text-[10px] border px-2 py-0.5 rounded-full capitalize"
                style={{ borderColor: "var(--border)" }}
              >
                {view}
              </span>
            </div>

            {view === "employer" ? <EmployerView /> : <FreelancerView />}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass mt-14 rounded-3xl p-10 text-center relative overflow-hidden"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{ background: "radial-gradient(ellipse at 50% 0%, var(--glow) 0%, transparent 65%)" }}
          />
          <Zap size={30} className="mx-auto mb-4 relative" style={{ color: "var(--accent)" }} />
          <h2 className="text-3xl font-bold mb-3 relative">Like what you see?</h2>
          <p className="max-w-sm mx-auto mb-8 relative" style={{ color: "var(--text-2)" }}>
            Create an account to launch real AI-managed projects with automated escrow and instant payouts.
          </p>
          <Link href="/signup">
            <button
              className="glow-accent inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-[1.03] relative"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                color: "#fff",
              }}
            >
              Sign Up for Full Access <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>

      </div>
    </main>
  );
}