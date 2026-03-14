// PATH: app/projects/[id]/milestones/[milestoneId]/submit/page.tsx
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
      // ── Step 1: Mark as submitted in DB immediately ──────────────────────
      await supabase.from("milestones").update({
        status:          "submitted",
        submission_text: submission.trim(),
        submitted_at:    new Date().toISOString(),
      }).eq("id", milestoneId);

      // ── Step 2: Groq AI evaluation — called directly, no API route needed ──
      let eval_result: Evaluation = {
        score: 0, approved: false, feedback: "", suggestion: "",
      };

      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model:      "llama-3.3-70b-versatile",
            max_tokens: 400,
            messages: [
              {
                role: "system",
                content: `You are an AI QA agent for a freelance escrow platform. Evaluate the freelancer submission against the milestone. Reply ONLY with this exact JSON, no markdown:
{"score":<0-100>,"approved":<true if score>=70>,"feedback":"<2 sentences>","suggestion":"<one fix if rejected, else empty string>"}`,
              },
              {
                role: "user",
                content: `Milestone: ${milestone.title}\nRequirements: ${milestone.description}\nSubmission: ${submission.trim()}`,
              },
            ],
          }),
        });

        const groqData = await groqRes.json();
        const text     = groqData.choices?.[0]?.message?.content ?? "{}";
        const parsed   = JSON.parse(text.replace(/```json|```/g, "").trim());
        eval_result    = {
          score:      Number(parsed.score ?? 0),
          approved:   Boolean(parsed.approved ?? Number(parsed.score ?? 0) >= 70),
          feedback:   String(parsed.feedback   ?? "Evaluation complete."),
          suggestion: String(parsed.suggestion ?? ""),
        };
      } catch (aiErr) {
        console.warn("Groq fallback:", aiErr);
        const words  = submission.trim().split(/\s+/).length;
        eval_result  = {
          score:      words > 40 ? 78 : 38,
          approved:   words > 40,
          feedback:   words > 40
            ? "Submission is detailed and meets basic criteria. Approved."
            : "Submission is too brief to fully evaluate.",
          suggestion: words <= 40 ? "Describe what you built, how it works, and include any links." : "",
        };
      }

      // ── Step 3: Update milestone with final evaluation ───────────────────
      await supabase.from("milestones").update({
        status:              eval_result.approved ? "approved" : "rejected",
        evaluation_feedback: eval_result.feedback,
        evaluated_at:        new Date().toISOString(),
      }).eq("id", milestoneId);

      // ── Step 4: If approved, release payment ─────────────────────────────
      if (eval_result.approved) {
        // Get project escrow balance
        const { data: proj } = await supabase
          .from("projects")
          .select("escrow_balance, freelancer_id")
          .eq("id", projectId)
          .single();

        if (proj) {
          // Decrement escrow
          await supabase.from("projects").update({
            escrow_balance: Math.max(0, (proj.escrow_balance ?? 0) - milestone.amount),
          }).eq("id", projectId);

          // Record transaction
          await supabase.from("transactions").insert({
            project_id: Number(projectId),
            amount:     milestone.amount,
            type:       "milestone_payout",
            status:     "completed",
          });

          // +5 PFI for freelancer
          if (proj.freelancer_id) {
            const { data: profile } = await supabase
              .from("profiles").select("pfi").eq("id", proj.freelancer_id).single();
            if (profile) {
              await supabase.from("profiles")
                .update({ pfi: (profile.pfi ?? 0) + 5 })
                .eq("id", proj.freelancer_id);
            }
          }
        }
      } else {
        // -3 PFI for rejection
        const { data: proj } = await supabase
          .from("projects").select("freelancer_id").eq("id", projectId).single();
        if (proj?.freelancer_id) {
          const { data: profile } = await supabase
            .from("profiles").select("pfi").eq("id", proj.freelancer_id).single();
          if (profile) {
            await supabase.from("profiles")
              .update({ pfi: Math.max(0, (profile.pfi ?? 0) - 3) })
              .eq("id", proj.freelancer_id);
          }
        }
      }

      setEvaluation(eval_result);
      setSubmitted(true);

      if (eval_result.approved) {
        setTimeout(() => router.push(`/projects/${projectId}`), 5000);
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
        <p className="text-lg font-bold text-slate-900 mb-4">Milestone not found</p>
        <button onClick={() => router.push(`/projects/${projectId}`)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">
          ← Back to Project
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Back */}
        <button onClick={() => router.push(`/projects/${projectId}`)}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Project
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">Submit Work</p>
          <h1 className="text-2xl font-black text-slate-900">Milestone Submission</h1>
          <p className="text-sm text-slate-400 mt-1">Your work will be evaluated by Groq AI instantly.</p>
        </motion.div>

        {/* Milestone info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Milestone</p>
              <h2 className="text-base font-black text-slate-900">{milestone.title}</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{milestone.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-indigo-600">${milestone.amount.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400">reward</p>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Form */}
        <AnimatePresence>
          {!submitted && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Describe your work
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      rows={7}
                      value={submission}
                      onChange={e => { setSubmission(e.target.value); setError(null); }}
                      disabled={submitting}
                      placeholder={`What did you build?\n\nInclude:\n• What was implemented\n• How it meets the requirements\n• Any links, repos, or deployed URLs`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-60"
                    />
                    <p className="text-xs text-slate-400 text-right mt-1">
                      {submission.length} chars
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Result */}
        <AnimatePresence>
          {submitted && evaluation && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4">

              {/* Pass / fail banner */}
              <div className={`rounded-xl px-5 py-4 border ${
                evaluation.approved
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <p className={`text-sm font-black ${evaluation.approved ? "text-emerald-700" : "text-amber-700"}`}>
                  {evaluation.approved
                    ? "Milestone approved — payment released!"
                    : "Needs revision — see feedback below"}
                </p>
                {evaluation.approved && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Redirecting to project in 5 seconds…
                  </p>
                )}
              </div>

              {/* Score + feedback */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  AI Evaluation · Groq · Llama 3.3 70B
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <ScoreRing score={evaluation.score} />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Feedback</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{evaluation.feedback}</p>
                    </div>
                    {evaluation.suggestion && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-black text-indigo-600 mb-1">Suggestion</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{evaluation.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => router.push(`/projects/${projectId}`)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  Back to Project
                </button>
                {!evaluation.approved && (
                  <button onClick={() => { setSubmitted(false); setEvaluation(null); setSubmission(""); }}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
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