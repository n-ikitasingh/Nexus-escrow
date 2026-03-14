// PATH: app/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/components/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: number; title: string; status: string;
  total_budget: number; escrow_balance: number; created_at: string;
  freelancer_id: string | null;
  freelancer?: { full_name: string | null; pfi: number } | null;
}
interface Milestone {
  id: number; title: string; amount: number; status: string;
  evaluation_feedback: string | null; evaluated_at: string | null;
  project: { title: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  draft: "#94a3b8", open: "#3b82f6", in_progress: "#f59e0b",
  completed: "#10b981", disputed: "#ef4444",
  pending: "#94a3b8", approved: "#10b981", rejected: "#ef4444", submitted: "#3b82f6",
};
const STATUS_BG: Record<string, string> = {
  draft: "#f1f5f9", open: "#eff6ff", in_progress: "#fffbeb",
  completed: "#ecfdf5", disputed: "#fef2f2",
  pending: "#f1f5f9", approved: "#ecfdf5", rejected: "#fef2f2", submitted: "#eff6ff",
};
function Badge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: STATUS_BG[status] ?? "#f1f5f9", color: STATUS_COLOR[status] ?? "#64748b" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[status] ?? "#64748b" }} />
      {status.replace("_", " ")}
    </span>
  );
}

function Skeleton() {
  return <div className="h-16 rounded-xl animate-pulse bg-slate-100" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYER PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function EmployerProfile({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*, freelancer:profiles!projects_freelancer_id_fkey(full_name, pfi)")
      .eq("employer_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setProjects(data ?? []); setLoading(false); });
  }, [userId]);

  const total      = projects.reduce((s, p) => s + p.total_budget, 0);
  const inEscrow   = projects.reduce((s, p) => s + p.escrow_balance, 0);
  const active     = projects.filter(p => ["open","in_progress"].includes(p.status)).length;
  const completed  = projects.filter(p => p.status === "completed").length;

  // Best performer = hired freelancer with highest PFI across completed projects
  const hired = projects
    .filter(p => p.freelancer)
    .map(p => p.freelancer!)
    .filter((f, i, arr) => arr.findIndex(x => x.full_name === f.full_name) === i)
    .sort((a, b) => (b.pfi ?? 0) - (a.pfi ?? 0));

  const bestPerformer = hired[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black">
              {name[0]?.toUpperCase() ?? "E"}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{name}</h2>
              <p className="text-sm text-slate-400">{email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700">
                Employer
              </span>
            </div>
          </div>
          <Link href="/projects/new">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors">
              + New Project
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Projects",  value: projects.length, color: "#4f46e5", icon: "📁" },
          { label: "Active Now",      value: active,           color: "#f59e0b", icon: "⚡" },
          { label: "Completed",       value: completed,        color: "#10b981", icon: "✓"  },
          { label: "Total Budget",    value: `$${total.toLocaleString()}`, color: "#7c3aed", icon: "💰" },
        ].map(({ label, value, color, icon }) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Best performer + escrow summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Best performer */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Best Performer</p>
          {bestPerformer ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-sm">
                {bestPerformer.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 text-sm">{bestPerformer.full_name ?? "Unknown"}</p>
                <p className="text-xs text-slate-400">Freelancer</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-600 tabular-nums">{(bestPerformer.pfi ?? 0).toFixed(1)}</p>
                <p className="text-[10px] font-bold text-emerald-500">PFI Score</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center">
              <p className="text-sm text-slate-400">No hired freelancers yet.</p>
              <Link href="/projects" className="text-xs text-indigo-600 font-semibold mt-1 block">Browse open projects →</Link>
            </div>
          )}
        </div>

        {/* Escrow health */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Escrow Summary</p>
          <div className="space-y-2.5">
            {[
              { label: "Locked in escrow", value: `$${inEscrow.toLocaleString()}`, color: "#4f46e5" },
              { label: "Deployed budget",  value: `$${total.toLocaleString()}`,    color: "#10b981" },
              { label: "Active projects",  value: active,                           color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="font-black" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All projects with hired freelancers */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Your Projects</h3>
          <Link href="/projects" className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">View all →</Link>
        </div>
        {loading
          ? <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} />)}</div>
          : projects.length === 0
          ? <div className="py-16 text-center">
              <p className="text-sm text-slate-400 mb-3">No projects created yet.</p>
              <Link href="/projects/new">
                <button className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white">Create your first project →</button>
              </Link>
            </div>
          : projects.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                style={{ borderBottom: i < projects.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${p.id}`}>
                    <p className="text-sm font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors">{p.title}</p>
                  </Link>
                  {p.freelancer
                    ? <p className="text-xs text-slate-400 mt-0.5">Hired: <span className="font-semibold text-slate-600">{p.freelancer.full_name ?? "Unknown"}</span> · PFI {p.freelancer.pfi?.toFixed(1) ?? "0.0"}</p>
                    : <p className="text-xs text-slate-400 mt-0.5">No freelancer assigned yet</p>
                  }
                </div>
                <Badge status={p.status} />
                <span className="text-sm font-black text-indigo-600 w-20 text-right">${p.total_budget.toLocaleString()}</span>
                <Link href={`/projects/${p.id}`}>
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    View →
                  </button>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FREELANCER PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function FreelancerProfile({ userId, name, email, pfi }: {
  userId: string; name: string; email: string; pfi: number;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects,   setProjects]   = useState<{ id: number; title: string; status: string; total_budget: number; employer_id: string }[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("milestones").select("id, title, amount, status, evaluation_feedback, evaluated_at, project:projects(title)")
        .in("status", ["approved","rejected","submitted"])
        .order("evaluated_at", { ascending: false }).limit(20),
      supabase.from("projects").select("id, title, status, total_budget, employer_id")
        .eq("freelancer_id", userId).order("created_at", { ascending: false }),
    ]).then(([msRes, prRes]) => {
      setMilestones((msRes.data ?? []) as unknown as Milestone[]);
      setProjects(prRes.data ?? []);
      setLoading(false);
    });
  }, [userId]);

  const pfiColor = pfi >= 80 ? "#10b981" : pfi >= 50 ? "#f59e0b" : pfi >= 20 ? "#3b82f6" : "#94a3b8";
  const pfiTier  = pfi >= 80 ? "Excellent" : pfi >= 50 ? "Good" : pfi >= 20 ? "Building" : "New";
  const earned   = milestones.filter(m => m.status === "approved").reduce((s, m) => s + m.amount, 0);
  const approved = milestones.filter(m => m.status === "approved").length;
  const rejected = milestones.filter(m => m.status === "rejected").length;
  const approvalRate = approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-black">
              {name[0]?.toUpperCase() ?? "F"}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{name}</h2>
              <p className="text-sm text-slate-400">{email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700">
                Freelancer
              </span>
            </div>
          </div>
          {/* PFI badge */}
          <div className="rounded-2xl border-2 px-6 py-4 text-center min-w-[120px]"
            style={{ borderColor: `${pfiColor}40`, background: `${pfiColor}08` }}>
            <p className="text-4xl font-black tabular-nums" style={{ color: pfiColor }}>{pfi.toFixed(1)}</p>
            <p className="text-xs font-black uppercase tracking-widest mt-0.5" style={{ color: pfiColor }}>{pfiTier}</p>
            <p className="text-[10px] text-slate-400 mt-1">PFI Score</p>
          </div>
        </div>

        {/* PFI bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Professional Fidelity Index</span>
            <span className="font-semibold" style={{ color: pfiColor }}>
              {pfi >= 80 ? "Top 15% of platform" : pfi >= 50 ? "Above average" : "Keep going!"}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pfi, 100)}%` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${pfiColor}, ${pfiColor}bb)` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            PFI = (approvals × 5) + (partials × 2) − (rejections × 3) + speed bonus
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Earned",   value: `$${earned.toLocaleString()}`, color: "#10b981"  },
          { label: "Approved",       value: approved,                       color: "#4f46e5"  },
          { label: "Approval Rate",  value: `${approvalRate}%`,             color: "#f59e0b"  },
          { label: "Active Projects",value: projects.filter(p => p.status === "in_progress").length, color: "#0ea5e9" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-200 p-4 text-center">
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* My Projects */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">My Projects</h3>
          <Link href="/projects" className="text-xs text-indigo-600 font-semibold">Find more →</Link>
        </div>
        {loading
          ? <div className="p-4 space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} />)}</div>
          : projects.length === 0
          ? <div className="py-12 text-center">
              <p className="text-sm text-slate-400 mb-3">No accepted projects yet.</p>
              <Link href="/projects"><button className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white">Browse open projects →</button></Link>
            </div>
          : projects.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4"
                style={{ borderBottom: i < projects.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div className="flex-1">
                  <Link href={`/projects/${p.id}`}>
                    <p className="text-sm font-bold text-slate-900 hover:text-indigo-600">{p.title}</p>
                  </Link>
                </div>
                <Badge status={p.status} />
                <span className="text-sm font-black text-indigo-600">${p.total_budget.toLocaleString()}</span>
              </div>
            ))}
      </div>

      {/* Milestone history */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Milestone History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Every AI evaluation, transparently shown</p>
        </div>
        {loading
          ? <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} />)}</div>
          : milestones.length === 0
          ? <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No milestone submissions yet. Accept a project to get started.</p>
            </div>
          : milestones.map((m, i) => (
              <div key={m.id} className="px-5 py-4"
                style={{ borderBottom: i < milestones.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">{m.title}</p>
                    <p className="text-[10px] text-slate-400">{m.project?.title ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={m.status} />
                    <span className="text-sm font-black"
                      style={{ color: m.status === "approved" ? "#10b981" : m.status === "rejected" ? "#ef4444" : "#f59e0b" }}>
                      {m.status === "approved" ? `+$${m.amount}` : `$${m.amount}`}
                    </span>
                  </div>
                </div>
                {m.evaluation_feedback && (
                  <p className="text-[11px] px-3 py-2 rounded-lg mt-1.5"
                    style={{
                      background: m.status === "approved" ? "#ecfdf5" : "#fef2f2",
                      color:      m.status === "approved" ? "#059669" : "#dc2626",
                    }}>
                    AI: {m.evaluation_feedback}
                  </p>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [user, userLoading, router]);

  if (userLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-0">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">My Profile</p>
            <h1 className="text-2xl font-black text-slate-900">
              {profile.role === "employer" ? "Employer Overview" : "Freelancer Portfolio"}
            </h1>
          </div>
          <ThemeToggle />
        </motion.div>

        {profile.role === "employer"
          ? <EmployerProfile userId={user.id} name={profile.full_name ?? user.email ?? "Employer"} email={user.email ?? ""} />
          : <FreelancerProfile userId={user.id} name={profile.full_name ?? user.email ?? "Freelancer"} email={user.email ?? ""} pfi={profile.pfi ?? 0} />
        }
      </div>
    </div>
  );
}