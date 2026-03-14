"use client";
// PATH: app/projects/[id]/page.tsx
// PAGE: /projects/abc123 — shows one project's details, milestones, and role actions

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/hooks/useUser";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert }  from "@/components/ui/Alert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Milestone {
  id:          string;
  title:       string;
  description: string;
  amount:      number;
  percentage:  number;
  status:      "pending" | "submitted" | "approved" | "rejected";
}

interface Project {
  id:             string;
  title:          string;
  description:    string;
  total_budget:   number;
  escrow_balance: number;
  status:         "draft" | "open" | "in_progress" | "completed" | "cancelled";
  employer_id:    string;
  freelancer_id:  string | null;
  created_at:     string;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft:       { bg: "bg-gray-100  dark:bg-gray-800",   text: "text-gray-600  dark:text-gray-400",  label: "Draft"       },
  open:        { bg: "bg-blue-100  dark:bg-blue-900/40", text: "text-blue-700  dark:text-blue-300",  label: "Open"        },
  in_progress: { bg: "bg-amber-100 dark:bg-amber-900/40",text: "text-amber-700 dark:text-amber-300", label: "In Progress" },
  completed:   { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Completed" },
  cancelled:   { bg: "bg-red-100   dark:bg-red-900/40",  text: "text-red-700   dark:text-red-300",   label: "Cancelled"   },
  pending:     { bg: "bg-gray-100  dark:bg-gray-800",   text: "text-gray-500  dark:text-gray-400",  label: "Pending"     },
  submitted:   { bg: "bg-blue-100  dark:bg-blue-900/40", text: "text-blue-700  dark:text-blue-300",  label: "Submitted"   },
  approved:    { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Approved" },
  rejected:    { bg: "bg-red-100   dark:bg-red-900/40",  text: "text-red-700   dark:text-red-300",   label: "Rejected"    },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params     = useParams();
  const router     = useRouter();
  const projectId  = params.id as string;
  const { user, profile, loading: userLoading } = useUser();

  const [project,    setProject]    = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks which button is loading

  // ── Fetch project + milestones ────────────────────────────────────────────

  async function loadProject() {
    setLoading(true);
    setError(null);
    try {
      const [{ data: proj, error: projErr }, { data: ms, error: msErr }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("milestones").select("*").eq("project_id", projectId).order("created_at"),
      ]);

      if (projErr || !proj) throw new Error("Project not found.");
      if (msErr) throw new Error("Failed to load milestones.");

      setProject(proj);
      setMilestones(ms ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  // ── Fund project (employer) ───────────────────────────────────────────────
  // Direct Supabase client — no API route needed. The same authenticated
  // client that loads project data can also update it (RLS allows employer
  // to update their own project).

  async function handleFund() {
    setActionLoading("fund");
    setError(null);
    try {
      if (!project) throw new Error("Project not loaded");
      if (!user)    throw new Error("Not logged in");

      // Step 1: update project status + escrow
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          escrow_balance: project.total_budget,
          status:         "open",
        })
        .eq("id", projectId)
        .eq("employer_id", user.id); // RLS safety — only own projects

      if (updateErr) throw new Error(updateErr.message);

      // Step 2: record the deposit transaction
      await supabase.from("transactions").insert({
        project_id: Number(projectId),
        amount:     project.total_budget,
        type:       "deposit",
        status:     "completed",
      });

      await loadProject();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Accept project (freelancer) ───────────────────────────────────────────
  // Direct Supabase client — no API route. RLS policy "Freelancer can accept
  // project" covers exactly this: freelancer_id IS NULL AND status = 'open'.

  async function handleAccept() {
    setActionLoading("accept");
    setError(null);
    try {
      if (!project) throw new Error("Project not loaded");
      if (!user)    throw new Error("Not logged in");

      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          freelancer_id: user.id,
          status:        "in_progress",
        })
        .eq("id", projectId)
        .is("freelancer_id", null)    // safety: only unassigned projects
        .eq("status", "open");        // safety: only open projects

      if (updateErr) throw new Error(updateErr.message);

      await loadProject();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading || userLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Loading project…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="relative z-10 text-center">
          <p className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Project not found</p>
          <Button variant="ghost" size="md" onClick={() => router.push("/projects")} className="mt-4">
            ← Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isEmployer   = user?.id === project.employer_id;
  const isFreelancer = user?.id === project.freelancer_id;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">

        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-2)" }}>
            ← All Projects
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
        )}

        {/* Project header card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
                    {project.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={project.status} />
                    {isEmployer   && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-hover)", color: "var(--text-3)" }}>Your project</span>}
                    {isFreelancer && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-hover)", color: "var(--accent)" }}>Assigned to you</span>}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                    ${project.total_budget.toLocaleString()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    Escrow: ${project.escrow_balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                {project.description}
              </p>

              {/* Role-specific action buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                {/* Employer: fund if draft */}
                {isEmployer && project.status === "draft" && (
                  <div style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", borderRadius: "0.75rem" }}>
                    <Button
                      variant="primary"
                      size="md"
                      loading={actionLoading === "fund"}
                      onClick={handleFund}
                      className="!bg-transparent hover:!bg-transparent"
                    >
                      Fund Project (${project.total_budget.toLocaleString()})
                    </Button>
                  </div>
                )}

                {/* Freelancer: accept if open and unassigned */}
                {profile?.role === "freelancer" && project.status === "open" && !project.freelancer_id && (
                  <div style={{ background: "linear-gradient(135deg, #10b981, #34d399)", borderRadius: "0.75rem" }}>
                    <Button
                      variant="primary"
                      size="md"
                      loading={actionLoading === "accept"}
                      onClick={handleAccept}
                      className="!bg-transparent hover:!bg-transparent"
                    >
                      Accept Project
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text-1)" }}>
            Milestones ({milestones.length})
          </h2>

          {milestones.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No milestones yet.</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                >
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: "var(--text-3)" }}>#{i + 1}</span>
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{m.title}</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{m.description}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={m.status} />
                        <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                          ${m.amount.toFixed(2)}
                          <span className="text-xs font-normal ml-1" style={{ color: "var(--text-3)" }}>
                            ({m.percentage}%)
                          </span>
                        </p>

                        {/* Freelancer submit button */}
                        {isFreelancer && m.status === "pending" && (
                          <Link href={`/projects/${projectId}/milestones/${m.id}/submit`}>
                            <Button variant="secondary" size="sm">Submit Work</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}