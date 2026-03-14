// PATH: app/page.tsx
"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// ─── Frosted subheading wrapper ───────────────────────────────────────────────
// Adds a translucent backdrop so grid lines don't bleed through paragraph text
function GlassText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline ${className}`}
      style={{
        // Frosted glass pill behind the text — adapts to both light & dark
        background: "var(--glass-text-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: "6px",
        padding: "2px 0",
        // Spread the blur slightly outside the text
        boxShadow: "0 0 0 6px var(--glass-text-bg)",
      }}
    >
      {children}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-1 px-8 py-6 rounded-2xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <span className="text-4xl font-black tracking-tight" style={{ color: "var(--accent)" }}>
        {value}
      </span>
      <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{label}</span>
      <span className="text-xs" style={{ color: "var(--text-3)" }}>{sub}</span>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, description, accent, delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${accent}18, transparent 60%)` }}
      />
      <div
        className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div className="relative z-10">
        <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-1)" }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Step ─────────────────────────────────────────────────────────────────────
function Step({ n, title, body, delay }: { n: string; title: string; body: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-5"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {n}
      </div>
      <div>
        <h4 className="font-bold text-sm mb-1" style={{ color: "var(--text-1)" }}>{title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{body}</p>
      </div>
    </motion.div>
  );
}

// ─── PFI Meter ────────────────────────────────────────────────────────────────
function PFIMeter({ name, score, tier, delay }: { name: string; score: number; tier: string; delay: number }) {
  const pct = (score / 1000) * 100;
  const tierColor = tier === "Elite" ? "#059669" : tier === "Pro" ? "#7c3aed" : "#d97706";
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3"
    >
      <div className="w-20 text-xs font-mono font-semibold truncate" style={{ color: "var(--text-2)" }}>{name}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${tierColor}, ${tierColor}aa)` }}
        />
      </div>
      <div className="w-10 text-xs font-black font-mono" style={{ color: tierColor }}>{score}</div>
      <div
        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
        style={{ color: tierColor, borderColor: `${tierColor}40`, background: `${tierColor}12` }}
      >
        {tier}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      {/*
        ─── CSS VARIABLES ──────────────────────────────────────────────────────
        --glass-text-bg is the key addition:
          Light mode: semi-opaque white so grid doesn't bleed through text
          Dark mode:  semi-opaque dark so grid doesn't bleed through text
      */}
      <style>{`
        :root {
          --glass-text-bg: rgba(240, 249, 255, 0.82);
        }
        .dark {
          --glass-text-bg: rgba(10, 15, 30, 0.82);
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --glass-text-bg: rgba(10, 15, 30, 0.82);
          }
        }
      `}</style>

      <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--bg-from)" }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

          {/* Background grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "linear-gradient(var(--text-1) 1px, transparent 1px), linear-gradient(90deg, var(--text-1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Orbs */}
          <motion.div
            animate={{ y: [0, -24, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute right-[-100px] top-[10%] h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "var(--accent)" }}
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="pointer-events-none absolute left-[-80px] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "var(--accent-3)" }}
          />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-32 w-full"
          >
            {/* Badge — no hackathon reference */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 border"
              style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--accent)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI-Powered Freelance Escrow Platform
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              style={{ color: "var(--text-1)" }}
            >
              The AI Agent That{" "}
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Pays Fairly.
              </span>
              <br />
              Every Time.
            </motion.h1>

            {/* Subheadline — frosted glass backdrop so grid lines vanish */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl mb-10"
            >
              <div
                className="inline-block rounded-2xl px-5 py-4 text-lg sm:text-xl leading-relaxed font-medium"
                style={{
                  background: "var(--glass-text-bg)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "var(--text-1)",
                  border: "1px solid var(--border)",
                }}
              >
                Nexus eliminates payment disputes and project chaos. Our autonomous AI
                generates milestones, holds funds in escrow, evaluates submissions, and
                releases payments — with zero human bias.
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                >
                  Get Started Free →
                </motion.button>
              </Link>
              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-7 py-3.5 text-sm font-bold border"
                  style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text-1)" }}
                >
                  Try Live Demo
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              {["🔒 Escrow-protected funds", "🤖 AI quality assurance", "📊 Merit-based reputation", "⚡ Instant micropayouts"].map(chip => (
                <span
                  key={chip}
                  className="rounded-full px-3 py-1 text-xs font-medium border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-2)" }}
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{ color: "var(--text-3)" }}
          >
            <span className="text-xs">Scroll</span>
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </section>

        {/* ── STATS ──────────────────────────────────────────────────────────── */}
        <section className="py-16 border-y" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: "100%", label: "Automated Payouts",  sub: "Zero manual intervention"     },
                { value: "AI",   label: "Quality Assurance",  sub: "LLM-powered evaluation"        },
                { value: "PFI",  label: "Reputation Score",   sub: "Merit-based freelancer credit" },
                { value: "0",    label: "Payment Disputes",   sub: "With transparent escrow logic" },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16"
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
                Core Pillars
              </p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5" style={{ color: "var(--text-1)" }}>
                Every layer is autonomous.
              </h2>
              {/* Frosted subheading */}
              <div className="flex justify-center">
                <div
                  className="inline-block rounded-xl px-4 py-2.5 text-base max-w-xl font-medium leading-relaxed"
                  style={{
                    background: "var(--glass-text-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Four integrated systems that remove humans from the payment loop — without removing accountability.
                </div>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard
                delay={0.05} accent="#7c3aed"
                icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                title="Intelligent Milestone Generation"
                description="Paste a project brief. The AI decomposes it into precise, time-bound technical milestones with acceptance criteria — in seconds."
              />
              <FeatureCard
                delay={0.1} accent="#059669"
                icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                title="Autonomous Escrow Vault"
                description="Employer funds the project once. The AI holds it securely and releases micro-payouts per milestone — fully automated, tamper-proof."
              />
              <FeatureCard
                delay={0.15} accent="#d97706"
                icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                title="Automated Quality Assurance"
                description="AI evaluates every submission. Fully done → payout. Partial → pro-rated + feedback. Unmet → employer refund protocol triggered."
              />
              <FeatureCard
                delay={0.2} accent="#db2777"
                icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M16 8v8m-8-5v5m4-9v9M5 20h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                title="Professional Fidelity Index"
                description="Every freelancer earns a dynamic PFI credit score — built from milestone accuracy, speed, and quality. Verifiable, bias-free reputation."
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
        <section className="py-24 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
                  How it works
                </p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ color: "var(--text-1)" }}>
                  Five steps.<br />Zero disputes.
                </h2>
                {/* Frosted subheading */}
                <div
                  className="inline-block rounded-xl px-4 py-3 text-sm leading-relaxed font-medium mb-8"
                  style={{
                    background: "var(--glass-text-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  From rough idea to final payment — the entire lifecycle is managed by the AI agent.
                  No email chains. No "I thought you meant…" No waiting.
                </div>

                {/* PFI leaderboard */}
                <div
                  className="rounded-2xl p-5 border space-y-3"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
                    Live PFI Leaderboard
                  </p>
                  <PFIMeter name="alex.dev"   score={932} tier="Elite"  delay={0.05} />
                  <PFIMeter name="sara_ux"    score={847} tier="Elite"  delay={0.10} />
                  <PFIMeter name="marco.io"   score={711} tier="Pro"    delay={0.15} />
                  <PFIMeter name="priya_code" score={589} tier="Rising" delay={0.20} />
                </div>
              </motion.div>

              <div className="flex flex-col gap-6">
                {[
                  { n: "1", title: "Employer posts a project",     body: "Describes goals, tech stack, and budget. No milestone planning required."            },
                  { n: "2", title: "AI generates milestones",      body: "LLM decomposes the brief into granular, verifiable tasks with acceptance criteria."   },
                  { n: "3", title: "Funds locked in escrow",       body: "Full project budget is deposited. Freelancer accepts. Work begins."                   },
                  { n: "4", title: "AI evaluates each submission", body: "Freelancer submits. AI scores the work. Payment releases or feedback is returned."    },
                  { n: "5", title: "PFI score updated",            body: "Freelancer's reputation score updates in real-time based on outcome quality."         },
                ].map((s, i) => <Step key={s.n} {...s} delay={i * 0.07} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR WHOM ───────────────────────────────────────────────────────── */}
        <section className="py-24 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-black tracking-tight mb-4" style={{ color: "var(--text-1)" }}>
                Built for both sides of the table.
              </h2>
              {/* Frosted subheading */}
              <div className="flex justify-center">
                <div
                  className="inline-block rounded-xl px-4 py-2 text-sm font-medium"
                  style={{
                    background: "var(--glass-text-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Whether you're hiring or delivering, Nexus has your back.
                </div>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                {
                  role: "Employers",
                  color: "#7c3aed",
                  icon: "💼",
                  points: [
                    "Translate vague ideas into precise milestones",
                    "Only pay for verified, completed work",
                    "Automatic refund if work is unacceptable",
                    "Full audit trail of every decision",
                  ],
                },
                {
                  role: "Freelancers",
                  color: "#059669",
                  icon: "🧑‍💻",
                  points: [
                    "Guaranteed payment for approved work",
                    "Clear scope — no scope creep debates",
                    "Build a verifiable, portable PFI score",
                    "Instant micropayments per milestone",
                  ],
                },
              ].map(({ role, color, icon, points }, i) => (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{role}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {points.map(p => (
                      <li key={p} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
                        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 mt-0.5 shrink-0" style={{ color }}>
                          <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ───────────────────────────────────────────────────────── */}
        <section className="py-20 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-2xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5" style={{ color: "var(--text-1)" }}>
                Ready to work without friction?
              </h2>
              {/* Frosted subheading */}
              <div className="flex justify-center mb-8">
                <div
                  className="inline-block rounded-xl px-5 py-3 text-base font-medium"
                  style={{
                    background: "var(--glass-text-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Join Nexus and experience the first truly autonomous freelance payment system.
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    Create Free Account
                  </motion.button>
                </Link>
                <Link href="/demo">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl px-8 py-3.5 text-sm font-bold border"
                    style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text-1)" }}
                  >
                    Explore Demo
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer className="border-t py-12" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))" }}
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                    <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9" />
                    <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.45" />
                  </svg>
                </div>
                <span className="font-black text-base" style={{ color: "var(--text-1)" }}>Nexus</span>
              </div>

              <div className="flex gap-6 text-xs" style={{ color: "var(--text-3)" }}>
                {["Terms", "Privacy", "Docs", "Status", "Contact"].map(l => (
                  <Link key={l} href="#" className="hover:opacity-70 transition-opacity">{l}</Link>
                ))}
              </div>

              <a
                href="https://groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-opacity hover:opacity-70"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-3)" }}
              >
                <span style={{ color: "#f97316" }}>⚡</span> Powered by Groq
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}