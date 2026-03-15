// PATH: app/projects/[id]/milestones/[milestoneId]/submit/page.tsx
// CRITICAL FIX: folder must be [milestoneId] with brackets, not milestoneId
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/hooks/useUser";

interface Milestone {
  id:          string;
  project_id:  string;
  title:       string;
  description: string;
  amount:      number;
  status:      string;
}

interface Evaluation {
  score:      number;
  approved:   boolean;
  feedback:   string;
  suggestion: string;
}

function ScoreRing({ score }: { score: number }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <motion.circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          transform="rotate(-90 48 48)" />
        <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="20" fontWeight="700">{score}</text>
      </svg>
      <p className="text-xs font-medium text-slate-400">AI Score</p>
    </div>
  );
}

export default function MilestoneSubmitPage() {
  const params      = useParams();
  const router      = useRouter();
  const { user }    = useUser();
  const projectId   = params.id as string;
  const milestoneId = params.milestoneId as string;

  const [milestone,  setMilestone]  = useState<Milestone | null>(null);
  const [submission, setSubmission] = useState("");
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    if (!milestoneId) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("milestones").select("*").eq("id", milestoneId).single();
      if (err || !data) setError("Milestone not found.");
      else setMilestone(data);
      setLoading(false);
    })();
  }, [milestoneId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!submission.trim())            { setError("Please describe your submission."); return; }
    if (submission.trim().length < 20) { setError("At least 20 characters required."); return; }
    if (!milestone || !user)           { setError("Not ready — please refresh."); return; }

    setSubmitting(true);
    try {
      // ── Step 1: Call the API route (uses server-side GROQ_API_KEY) ────────
      // The API route handles Groq evaluation — never call Groq from the browser
      const res = await fetch(`/api/milestones/${milestoneId}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          milestoneTitle:       milestone.title,
          milestoneDescription: milestone.description,
          submission:           submission.trim(),
        }),
      });

      // Check content type before parsing
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("API route returned HTML — check that /api/milestones/[id]/submit/route.ts exists");
      }

      const evalData = await res.json();
      if (!res.ok) throw new Error(evalData.error ?? "Evaluation failed");

      const eval_result: Evaluation = {
        score:      evalData.score      ?? 0,
        approved:   evalData.approved   ?? false,
        feedback:   evalData.feedback   ?? "Evaluation complete.",
        suggestion: evalData.suggestion ?? "",
      };

      // ── Step 2: Update milestone status in DB ─────────────────────────────
      await supabase.from("milestones").update({
        status:              eval_result.approved ? "approved" : "rejected",
        submission_text:     submission.trim(),
        evaluation_feedback: eval_result.feedback,
        submitted_at:        new Date().toISOString(),
        evaluated_at:        new Date().toISOString(),
      }).eq("id", milestoneId);

      // ── Step 3: If approved, release payment + update PFI ─────────────────
      if (eval_result.approved) {
        const { data: proj } = await supabase
          .from("projects")
          .select("escrow_balance, freelancer_id")
          .eq("id", projectId)
          .single();

        if (proj) {
          await supabase.from("projects").update({
            escrow_balance: Math.max(0, (proj.escrow_balance ?? 0) - milestone.amount),
          }).eq("id", projectId);

          await supabase.from("transactions").insert({
            project_id: Number(projectId),
            amount:     milestone.amount,
            type:       "milestone_payout",
            status:     "completed",
          });

          if (proj.freelancer_id) {
            const { data: pf } = await supabase
              .from("profiles").select("pfi").eq("id", proj.freelancer_id).single();
            if (pf) {
              await supabase.from("profiles")
                .update({ pfi: (pf.pfi ?? 0) + 5 })
                .eq("id", proj.freelancer_id);
            }
          }
        }
      } else {
        // -3 PFI on rejection
        const { data: proj } = await supabase
          .from("projects").select("freelancer_id").eq("id", projectId).single();
        if (proj?.freelancer_id) {
          const { data: pf } = await supabase
            .from("profiles").select("pfi").eq("id", proj.freelancer_id).single();
          if (pf) {
            await supabase.from("profiles")
              .update({ pfi: Math.max(0, (pf.pfi ?? 0) - 3) })
              .eq("id", proj.freelancer_id);
          }
        }
      }

      setEvaluation(eval_result);
      setSubmitted(true);
      if (eval_result.approved) {
        setTimeout(() => router.push(`/projects/${projectId}`), 4000);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!milestone) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>Milestone not found</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>milestoneId: {milestoneId || "undefined — folder name bug!"}</p>
        <button onClick={() => router.push(`/projects/${projectId}`)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">
          ← Back to Project
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "var(--bg-from)" }}>
      <div className="mx-auto max-w-2xl space-y-5">

        <button onClick={() => router.push(`/projects/${projectId}`)}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-2)" }}>
          ← Back to Project
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: "var(--accent)" }}>
            Submit Work
          </p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>Milestone Submission</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Your work will be evaluated by Groq AI instantly.
          </p>
        </motion.div>

        {/* Milestone info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>
                Milestone
              </p>
              <h2 className="text-base font-black" style={{ color: "var(--text-1)" }}>{milestone.title}</h2>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>{milestone.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black" style={{ color: "var(--accent)" }}>${milestone.amount.toFixed(2)}</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>reward</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        <AnimatePresence>
          {!submitted && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-1)" }}>
                      Describe your work <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={7}
                      value={submission}
                      onChange={e => { setSubmission(e.target.value); setError(null); }}
                      disabled={submitting}
                      placeholder={"What did you build?\n\nInclude:\n• What was implemented\n• How it meets the requirements\n• Any links, repos, or deployed URLs"}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all disabled:opacity-60"
                      style={{
                        background:   "var(--surface-hover)",
                        border:       "1px solid var(--border-strong)",
                        color:        "var(--text-1)",
                      }}
                    />
                    <p className="text-xs text-right mt-1" style={{ color: "var(--text-3)" }}>
                      {submission.length} chars
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl py-3.5 text-sm font-black text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Evaluating with Groq AI…
                      </span>
                    ) : "Submit for AI Evaluation"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitted && evaluation && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4">

              <div className="rounded-xl px-5 py-4 border" style={{
                background:   evaluation.approved ? "#ecfdf5" : "#fffbeb",
                borderColor:  evaluation.approved ? "#6ee7b7" : "#fcd34d",
              }}>
                <p className="text-sm font-black" style={{ color: evaluation.approved ? "#065f46" : "#92400e" }}>
                  {evaluation.approved
                    ? "Milestone approved — payment released!"
                    : "Needs revision — see feedback below"}
                </p>
                {evaluation.approved && (
                  <p className="text-xs mt-0.5" style={{ color: "#047857" }}>
                    Redirecting to project in 4 seconds…
                  </p>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
                  AI Evaluation · Groq · Llama 3.3 70B
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <ScoreRing score={evaluation.score} />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Feedback</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-1)" }}>{evaluation.feedback}</p>
                    </div>
                    {evaluation.suggestion && (
                      <div className="rounded-xl p-3" style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-black mb-1" style={{ color: "var(--accent)" }}>Suggestion</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{evaluation.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => router.push(`/projects/${projectId}`)}
                  className="flex-1 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--text-1)", background: "var(--surface)" }}>
                  Back to Project
                </button>
                {!evaluation.approved && (
                  <button onClick={() => { setSubmitted(false); setEvaluation(null); setSubmission(""); }}
                    className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
                    style={{ background: "var(--accent)" }}>
                    Revise & Resubmit
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}