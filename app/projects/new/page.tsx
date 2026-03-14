"use client";
// PATH: app/projects/new/page.tsx
// PAGE: /projects/new — employer fills form → AI generates milestones → creates project

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert }  from "@/components/ui/Alert";
import Input      from "@/components/ui/Input";
import { useUser } from "@/components/hooks/useUser"; // <-- ADD THIS IMPORT

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MilestoneDraft {
  title:       string;
  description: string;
  percentage:  number;
}

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const stepVariants: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.22, ease: "easeIn" } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function pctColor(total: number) {
  if (total === 100) return "text-emerald-500";
  if (total > 100)   return "text-red-500";
  return "text-amber-500";
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useUser(); // <-- GET THE CURRENT USER

  // Step 1 fields
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [budget,      setBudget]      = useState("");

  // Step state
  const [step,       setStep]       = useState<1 | 2>(1);
  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Generated / editable milestones
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);

  // Field-level errors for step 1
  const [titleErr, setTitleErr]   = useState("");
  const [descErr,  setDescErr]    = useState("");
  const [budgetErr,setBudgetErr]  = useState("");

  // ── Step 1 validation ────────────────────────────────────────────────────

  function validateStep1() {
    let ok = true;
    setTitleErr(""); setDescErr(""); setBudgetErr("");

    if (!title.trim())              { setTitleErr("Project title is required.");           ok = false; }
    if (!description.trim())        { setDescErr("Description is required.");               ok = false; }
    else if (description.length < 30) { setDescErr("Please provide at least 30 characters."); ok = false; }

    const b = parseFloat(budget);
    if (!budget || isNaN(b) || b <= 0) { setBudgetErr("Enter a valid budget greater than 0."); ok = false; }

    return ok;
  }

  // ── Generate milestones (step 1 → step 2) ────────────────────────────────

  async function handleGenerateMilestones() {
    setError(null);
    if (!validateStep1()) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-milestones", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description, budget: parseFloat(budget) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate milestones");

      // Expect array of { title, description, percentage }
      setMilestones(data.milestones ?? data);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Milestone editing helpers ─────────────────────────────────────────────

  function updateMilestone(index: number, field: keyof MilestoneDraft, value: string | number) {
    setMilestones(prev => prev.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    ));
  }

  function addMilestone() {
    setMilestones(prev => [...prev, { title: "", description: "", percentage: 0 }]);
  }

  function removeMilestone(index: number) {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  }

  const totalPct = milestones.reduce((s, m) => s + Number(m.percentage), 0);

  // ── Final save (step 2 submit) ────────────────────────────────────────────

  async function handleCreateProject() {
    setError(null);

    if (!user) {
      setError("You must be logged in to create a project.");
      return;
    }

    if (milestones.length === 0) {
      setError("Add at least one milestone.");
      return;
    }
    if (Math.abs(totalPct - 100) > 1) {
      setError(`Milestone percentages must sum to 100% (currently ${totalPct}%).`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:        title.trim(),
          description:  description.trim(),
          total_budget: parseFloat(budget),
          milestones,
          employer_id:  user.id, // <-- ADD THIS LINE
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");

      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="relative z-10 mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            {step === 1 ? "Create a New Project" : "Review AI-Generated Milestones"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            {step === 1
              ? "Describe your project and budget — AI will break it into milestones."
              : "Edit the milestones below, then create your project."}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                  style={{
                    background: step >= s ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "var(--surface-hover)",
                    color: step >= s ? "#fff" : "var(--text-3)",
                  }}
                >{s}</div>
                {s < 2 && <div className="h-px w-8" style={{ background: step > s ? "var(--accent)" : "var(--border-strong)" }} />}
              </div>
            ))}
            <span className="ml-2 text-xs" style={{ color: "var(--text-3)" }}>
              {step === 1 ? "Project details" : "Review milestones"}
            </span>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
          </motion.div>
        )}

        {/* ── STEP 1: Project details ── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
              <Card>
                <div className="space-y-5">
                  <Input
                    label="Project Title"
                    name="title"
                    placeholder="e.g. E-commerce website redesign"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setTitleErr(""); }}
                    error={titleErr}
                    required
                  />

                  {/* Textarea via styled div since Input may not support multiline */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      Project Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe the project in detail — the more context you provide, the better the AI-generated milestones will be."
                      value={description}
                      onChange={e => { setDescription(e.target.value); setDescErr(""); }}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-150 focus:ring-2"
                      style={{
                        background:   "var(--surface-hover)",
                        border:       `1px solid ${descErr ? "#ef4444" : "var(--border-strong)"}`,
                        color:        "var(--text-1)",
                        boxShadow:    "none",
                      }}
                    />
                    {descErr && <p className="mt-1.5 text-xs text-red-500">{descErr}</p>}
                  </div>

                  <Input
                    label="Total Budget (USD)"
                    name="budget"
                    type="number"
                    placeholder="e.g. 5000"
                    value={budget}
                    onChange={e => { setBudget(e.target.value); setBudgetErr(""); }}
                    error={budgetErr}
                    required
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    loading={generating}
                    onClick={handleGenerateMilestones}
                    className="w-full"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", border: "none" } as React.CSSProperties}
                  >
                    {generating ? "Generating milestones…" : "Generate Milestones with AI →"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: Review milestones ── */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">

              {/* Percentage summary */}
              <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-2)" }}>Total allocation</span>
                <span className={`text-sm font-bold ${pctColor(totalPct)}`}>{totalPct}% / 100%</span>
              </div>

              {/* Milestone cards */}
              {milestones.map((m, i) => (
                <motion.div key={i} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                  <Card>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                          Milestone {i + 1}
                        </span>
                        <button
                          onClick={() => removeMilestone(i)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <Input
                        label="Title"
                        name={`ms-title-${i}`}
                        value={m.title}
                        onChange={e => updateMilestone(i, "title", e.target.value)}
                        placeholder="Milestone title"
                      />

                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-1)" }}>
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={m.description}
                          onChange={e => updateMilestone(i, "description", e.target.value)}
                          placeholder="What should be delivered?"
                          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-150 focus:ring-2"
                          style={{
                            background: "var(--surface-hover)",
                            border:     "1px solid var(--border-strong)",
                            color:      "var(--text-1)",
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Input
                          label="Percentage (%)"
                          name={`ms-pct-${i}`}
                          type="number"
                          value={String(m.percentage)}
                          onChange={e => updateMilestone(i, "percentage", parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                        <div className="pt-5 text-sm font-medium" style={{ color: "var(--accent)" }}>
                          ${((m.percentage / 100) * parseFloat(budget || "0")).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Add milestone */}
              <button
                onClick={addMilestone}
                className="w-full rounded-xl py-3 text-sm font-medium transition-colors border-2 border-dashed"
                style={{ borderColor: "var(--border-strong)", color: "var(--text-2)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
              >
                + Add Milestone
              </button>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <div className="flex-1" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", borderRadius: "0.75rem" }}>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={saving}
                    onClick={handleCreateProject}
                    className="w-full !bg-transparent hover:!bg-transparent"
                    disabled={Math.abs(totalPct - 100) > 1}
                  >
                    {saving ? "Creating project…" : "Create Project"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}