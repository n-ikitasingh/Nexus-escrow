// PATH: app/demo/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─────────────────────────────────────────────────────────────────────────────
// Simulation state machine
// ─────────────────────────────────────────────────────────────────────────────

type SimStep =
  | "idle"
  | "generating"
  | "milestones_ready"
  | "funded"
  | "accepted"
  | "submitting"
  | "evaluating"
  | "approved"
  | "rejected";

const SAMPLE_BRIEF =
  "Build a REST API for a task management app with user auth, CRUD for tasks, and email notifications when tasks are due.";

const AI_MILESTONES = [
  { title: "Project Architecture & Auth Setup",    amount: 800,  pct: 20, criteria: "JWT auth endpoints, user model, DB schema" },
  { title: "Task CRUD API",                        amount: 1200, pct: 30, criteria: "Create/read/update/delete endpoints, validation, error handling" },
  { title: "Email Notification Service",           amount: 800,  pct: 20, criteria: "Triggered on due-date, SendGrid integration, templates" },
  { title: "Testing & Documentation",              amount: 1200, pct: 30, criteria: "≥80% test coverage, Swagger/OpenAPI docs" },
];

const EVAL_CHECKS = [
  { label: "Endpoints return correct status codes", pass: true  },
  { label: "JWT auth validates correctly",           pass: true  },
  { label: "Task CRUD operations functional",        pass: true  },
  { label: "Email triggers on due-date",             pass: true  },
  { label: "Unit test coverage ≥ 80%",               pass: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Typing animation
// ─────────────────────────────────────────────────────────────────────────────
function TypedText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-3 ml-0.5 bg-current animate-pulse" />}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step badge
// ─────────────────────────────────────────────────────────────────────────────
function StepBadge({ active, done, n }: { active: boolean; done: boolean; n: number }) {
  if (done) return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
      <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
      active ? "text-white" : ""
    }`} style={{ background: active ? "var(--accent)" : "var(--surface-hover)", color: active ? "#fff" : "var(--text-3)" }}>
      {n}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [step,      setStep]      = useState<SimStep>("idle");
  const [brief,     setBrief]     = useState(SAMPLE_BRIEF);
  const [budget,    setBudget]    = useState("4000");
  const [evalIdx,   setEvalIdx]   = useState(0);   // which check is being revealed
  const [rejected,  setRejected]  = useState(false);
  const timeouts                  = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearAll() { timeouts.current.forEach(clearTimeout); timeouts.current = []; }

  function addTimeout(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timeouts.current.push(t);
  }

  function reset() {
    clearAll();
    setStep("idle");
    setEvalIdx(0);
    setRejected(false);
  }

  // ── Simulation flow ────────────────────────────────────────────────────────
  function runSimulation(approveAll: boolean) {
    clearAll();
    setEvalIdx(0);
    setRejected(!approveAll);

    setStep("generating");
    addTimeout(() => setStep("milestones_ready"), 2200);
    addTimeout(() => setStep("funded"),           3600);
    addTimeout(() => setStep("accepted"),         5000);
    addTimeout(() => setStep("submitting"),       6400);
    addTimeout(() => setStep("evaluating"),       7800);

    // Reveal eval checks one by one
    for (let i = 0; i < EVAL_CHECKS.length; i++) {
      addTimeout(() => setEvalIdx(i + 1), 7800 + i * 600);
    }

    addTimeout(() => setStep(approveAll ? "approved" : "rejected"), 7800 + EVAL_CHECKS.length * 600 + 400);
  }

  useEffect(() => () => clearAll(), []);

  // ── Step progress tracker ──────────────────────────────────────────────────
  const STEPS = ["Brief posted", "Milestones generated", "Escrow funded", "Freelancer accepted", "Work evaluated", "Payment released"];
  const stepIndex: Record<SimStep, number> = {
    idle: -1, generating: 0, milestones_ready: 1, funded: 2,
    accepted: 3, submitting: 3, evaluating: 4, approved: 5, rejected: 5,
  };
  const currentStepIdx = stepIndex[step];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-from)" }}>

      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)", backdropFilter: "blur(16px)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="font-black text-sm" style={{ color: "var(--text-1)" }}>Nexus</span>
          <span className="text-xs ml-1 rounded-full px-2 py-0.5 font-semibold"
            style={{ background: "var(--accent)18", color: "var(--accent)" }}>Demo</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/signup">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="rounded-lg px-4 py-1.5 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              Sign Up Free
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>
            Interactive Demo
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Watch the full AI agent cycle live — from brief to payment — in 10 seconds.
            No login needed.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">

          {/* ── LEFT: simulation panel ─────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Input panel */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Step 1 — Project Brief
              </p>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-1)" }}>
                  What do you need built?
                </label>
                <textarea
                  rows={3}
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  disabled={step !== "idle"}
                  className="w-full rounded-xl px-3 py-2.5 text-xs resize-none outline-none"
                  style={{
                    background:   "var(--surface-hover)",
                    border:       "1px solid var(--border-strong)",
                    color:        "var(--text-1)",
                    opacity:      step !== "idle" ? 0.6 : 1,
                  }}
                />
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-1)" }}>
                    Budget (USD)
                  </label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                    disabled={step !== "idle"}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{
                      background: "var(--surface-hover)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-1)",
                      opacity: step !== "idle" ? 0.6 : 1,
                    }} />
                </div>
                {step === "idle" ? (
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => runSimulation(true)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                      Simulate Approval
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => runSimulation(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold border"
                      style={{ borderColor: "var(--border-strong)", color: "var(--text-2)", background: "transparent" }}>
                      Simulate Rejection
                    </motion.button>
                  </div>
                ) : (
                  <button onClick={reset}
                    className="rounded-xl px-4 py-2 text-xs font-semibold border"
                    style={{ borderColor: "var(--border-strong)", color: "var(--text-2)", background: "transparent" }}>
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* AI milestone generation */}
            <AnimatePresence>
              {(step === "generating" || currentStepIdx >= 1) && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 space-y-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
                      AI Agent — Milestone Generation
                    </p>
                    {step === "generating" && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                        <div className="h-2.5 w-2.5 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: "#0ea5e9", borderTopColor: "transparent" }} />
                        Analysing brief…
                      </div>
                    )}
                    {currentStepIdx >= 1 && (
                      <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
                        Generated in 1.8s
                      </span>
                    )}
                  </div>

                  {step === "generating" && (
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>
                      <TypedText text={`Parsing: "${brief.slice(0,60)}…"`} />
                    </p>
                  )}

                  {currentStepIdx >= 1 && (
                    <div className="space-y-2">
                      {AI_MILESTONES.map((m, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                          style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{m.title}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{m.criteria}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black" style={{ color: "var(--accent)" }}>${m.amount}</p>
                            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{m.pct}%</p>
                          </div>
                        </motion.div>
                      ))}
                      <p className="text-[10px] pt-1 font-medium" style={{ color: "var(--text-3)" }}>
                        Generated by Groq · Llama 3.3 70B
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Escrow funded */}
            <AnimatePresence>
              {currentStepIdx >= 2 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid #059669" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                      <path d="M8 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" stroke="white" strokeWidth="1.2"/>
                      <path d="M2 12c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>
                      Escrow vault funded — ${parseInt(budget).toLocaleString()} locked
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      Freelancer "Marcus Chen" accepted the project
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI evaluation */}
            <AnimatePresence>
              {(step === "evaluating" || step === "approved" || step === "rejected") && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 space-y-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
                      AI Agent — Quality Evaluation
                    </p>
                    {step === "evaluating" && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                        <div className="h-2.5 w-2.5 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: "#0ea5e9", borderTopColor: "transparent" }} />
                        Evaluating…
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {EVAL_CHECKS.map((c, i) => {
                      const visible = i < evalIdx;
                      // In rejection sim, last check is still false; in approval, we force all pass
                      const pass = rejected ? c.pass : true;
                      return (
                        <AnimatePresence key={c.label}>
                          {visible && (
                            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2.5 text-xs">
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${pass ? "bg-emerald-500" : "bg-red-400"}`}>
                                <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                                  {pass
                                    ? <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    : <path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                  }
                                </svg>
                              </div>
                              <span style={{ color: "var(--text-2)" }}>{c.label}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      );
                    })}
                  </div>

                  {/* Final verdict */}
                  <AnimatePresence>
                    {(step === "approved" || step === "rejected") && (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl p-4 mt-2"
                        style={{
                          background: step === "approved" ? "#10b98112" : "#ef444412",
                          border:     `1px solid ${step === "approved" ? "#10b98130" : "#ef444430"}`,
                        }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold" style={{ color: step === "approved" ? "#10b981" : "#ef4444" }}>
                            {step === "approved"
                              ? "All criteria met — Full payment released"
                              : "Test coverage unmet — Partial release (80%)"}
                          </p>
                          <span className="text-sm font-black" style={{ color: step === "approved" ? "#10b981" : "#f59e0b" }}>
                            {step === "approved" ? `$${parseInt(budget).toLocaleString()}` : `$${Math.round(parseInt(budget)*0.8).toLocaleString()}`}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-2)" }}>
                          {step === "approved"
                            ? "5/5 acceptance criteria verified. Escrow released to freelancer instantly."
                            : "4/5 criteria met. 80% payout released. Remaining 20% unlocks when test coverage is submitted."}
                        </p>
                        <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--text-3)" }}>
                          Evaluated by Groq · Llama 3.3 70B · {step === "approved" ? "~1.2s" : "~1.4s"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: live progress tracker ──────────────────────────────── */}
          <div className="space-y-4">
            {/* Progress panel */}
            <div className="rounded-2xl p-5 space-y-4 lg:sticky lg:top-24"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Live System Status
              </p>

              <div className="space-y-3">
                {STEPS.map((label, i) => {
                  const done   = i < currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <StepBadge n={i + 1} done={done} active={active} />
                      <span className={`text-xs font-medium transition-colors ${
                        done ? "" : active ? "" : "opacity-40"
                      }`} style={{
                        color: done ? "#10b981" : active ? "var(--text-1)" : "var(--text-3)",
                      }}>
                        {label}
                      </span>
                      {active && step !== "idle" && (
                        <div className="ml-auto h-2.5 w-2.5 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Escrow balance meter */}
              {currentStepIdx >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-3)" }}>Escrow balance</span>
                    <span className="font-black" style={{ color: "var(--accent)" }}>
                      {step === "approved" ? "$0" : step === "rejected"
                        ? `$${Math.round(parseInt(budget)*0.2).toLocaleString()}`
                        : `$${parseInt(budget).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-strong)" }}>
                    <motion.div
                      animate={{
                        width: step === "approved" ? "0%" : step === "rejected" ? "20%" : "100%"
                      }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    {step === "approved"
                      ? "Full amount paid to freelancer"
                      : step === "rejected"
                      ? "80% paid, 20% held pending resubmission"
                      : "Locked — releases on approval"}
                  </p>
                </motion.div>
              )}

              {/* PFI change */}
              {(step === "approved" || step === "rejected") && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3"
                  style={{
                    background: step === "approved" ? "#10b98112" : "#f59e0b12",
                    border: `1px solid ${step === "approved" ? "#10b98130" : "#f59e0b30"}`,
                  }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-3)" }}>
                    PFI Score Updated
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black" style={{ color: step === "approved" ? "#10b981" : "#f59e0b" }}>
                      {step === "approved" ? "+5 PFI" : "+1 PFI"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-2)" }}>
                      {step === "approved" ? "Full approval" : "Partial completion"}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* CTA after sim */}
              {(step === "approved" || step === "rejected") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }} className="space-y-2 pt-2">
                  <Link href="/signup">
                    <button className="w-full rounded-xl py-2.5 text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                      Try with real projects →
                    </button>
                  </Link>
                  <button onClick={reset}
                    className="w-full rounded-xl py-2.5 text-xs font-semibold border"
                    style={{ borderColor: "var(--border-strong)", color: "var(--text-2)", background: "transparent" }}>
                    Run simulation again
                  </button>
                </motion.div>
              )}
            </div>

            {/* Note */}
            <p className="text-[10px] text-center" style={{ color: "var(--text-3)" }}>
              This simulation uses static mock data. Real platform connects to Supabase + Groq AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}