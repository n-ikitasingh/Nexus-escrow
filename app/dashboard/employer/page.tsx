// PATH: app/dashboard/employer/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useUser }  from "@/components/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { Card }     from "@/components/ui/Card";
import { Button }   from "@/components/ui/Button";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Project {
  id:             number;
  title:          string;
  status:         string;
  total_budget:   number;
  escrow_balance: number;
  created_at:     string;
  milestones:     { count: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; dot: string }> = {
  draft:       { label: "Draft",       bg: "bg-gray-100 dark:bg-gray-800",           dot: "bg-gray-400"    },
  open:        { label: "Open",        bg: "bg-blue-50 dark:bg-blue-900/30",          dot: "bg-blue-500"    },
  in_progress: { label: "In Progress", bg: "bg-amber-50 dark:bg-amber-900/30",        dot: "bg-amber-500"   },
  completed:   { label: "Completed",   bg: "bg-emerald-50 dark:bg-emerald-900/30",    dot: "bg-emerald-500" },
  disputed:    { label: "Disputed",    bg: "bg-red-50 dark:bg-red-900/30",            dot: "bg-red-500"     },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.bg}`}
      style={{ color: "var(--text-1)" }}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="h-4 flex-1 rounded" style={{ background: "var(--surface-hover)" }} />
      <div className="h-4 w-20 rounded" style={{ background: "var(--surface-hover)" }} />
      <div className="h-4 w-16 rounded" style={{ background: "var(--surface-hover)" }} />
      <div className="h-4 w-12 rounded" style={{ background: "var(--surface-hover)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
        <p className="text-2xl font-black" style={{ color: "var(--text-1)" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{sub}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (profile?.role !== "employer") { router.replace("/dashboard/freelancer"); }
  }, [user, profile, userLoading, router]);

  // ── Fetch projects ─────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("projects")
      .select("id, title, status, total_budget, escrow_balance, created_at, milestones(count)")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    if (err) { setError(err.message); }
    else     { setProjects(data ?? []); }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) loadProjects(); }, [user, loadProjects]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalBudget  = projects.reduce((s, p) => s + p.total_budget, 0);
  const inEscrow     = projects.reduce((s, p) => s + p.escrow_balance, 0);
  const activeCount  = projects.filter(p => ["open","in_progress"].includes(p.status)).length;

  // ── Loading / guard ────────────────────────────────────────────────────────
  if (userLoading || (!user && !userLoading)) return null;

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="relative z-10 mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
              Employer Dashboard
            </p>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>
              Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Here's an overview of your projects and escrow activity.
            </p>
          </div>
          <Link href="/projects/new">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              + New Project
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Projects"   value={projects.length} sub="All time"       color="#7c3aed"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M7 3a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2H7zM4 7a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zM2 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>}
          />
          <StatCard label="Active Projects"  value={activeCount}     sub="Open / running"  color="#059669"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd"/></svg>}
          />
          <StatCard label="Total Budget"     value={`$${totalBudget.toLocaleString()}`} sub="Across all projects" color="#d97706"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 0 1-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 0 1-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-13a1 1 0 1 0-2 0v.092a4.535 4.535 0 0 0-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 1 0-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 1 0 2 0v-.092a4.535 4.535 0 0 0 1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0 0 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 1 0 1.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>}
          />
          <StatCard label="In Escrow"        value={`$${inEscrow.toLocaleString()}`}   sub="Locked & protected"  color="#db2777"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zm8-2v2H7V7a3 3 0 0 1 6 0z" clipRule="evenodd"/></svg>}
          />
        </div>

        {/* Projects table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Your Projects
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-3)" }}>
                ({projects.length})
              </span>
            </h2>
            <Link href="/projects">
              <span className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>
                View all →
              </span>
            </Link>
          </div>

          {error && (
            <p className="px-5 py-4 text-sm text-red-500">{error}</p>
          )}

          {loading ? (
            <>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</>
          ) : projects.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>
                You haven't created any projects yet.
              </p>
              <Link href="/projects/new">
                <Button variant="primary" size="sm">Create your first project →</Button>
              </Link>
            </div>
          ) : (
            projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-opacity-50 transition-colors"
                style={{ borderBottom: i < projects.length - 1 ? "1px solid var(--border)" : "none",
                  background: "transparent" }}
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${p.id}`}>
                    <p className="text-sm font-semibold truncate hover:opacity-70 transition-opacity"
                      style={{ color: "var(--text-1)" }}>
                      {p.title}
                    </p>
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    {new Date(p.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <span className="text-sm font-bold w-24 text-right" style={{ color: "var(--accent)" }}>
                  ${p.total_budget.toLocaleString()}
                </span>
                <Link href={`/projects/${p.id}`}>
                  <Button variant="ghost" size="sm">View →</Button>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Create Project",  href: "/projects/new",  icon: "✦", color: "#7c3aed" },
            { label: "Browse Projects", href: "/projects",       icon: "◎", color: "#059669" },
            { label: "View Profile",    href: "/profile",        icon: "◐", color: "#d97706" },
          ].map(({ label, href, icon, color }) => (
            <Link key={label} href={href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 cursor-pointer transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-lg" style={{ color }}>{icon}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{label}</span>
                <svg viewBox="0 0 16 16" fill="none" className="ml-auto h-3.5 w-3.5" style={{ color: "var(--text-3)" }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </Link>
          ))}
        </motion.div>

      </div>
    </div>
  );
}