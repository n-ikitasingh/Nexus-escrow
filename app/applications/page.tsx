// PATH: app/applications/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser }    from "@/components/hooks/useUser";
import { supabase }   from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface ProjectWithFreelancer {
  id: number; title: string; description: string;
  status: string; total_budget: number; created_at: string;
  employer_id: string; freelancer_id: string | null;
  freelancer?: { full_name: string | null; pfi: number; id: string } | null;
  employer?:   { full_name: string | null } | null;
  milestones:  { count: number }[];
}

const S_COLOR: Record<string,string> = {
  draft:"#94a3b8", open:"#3b82f6", in_progress:"#f59e0b", completed:"#10b981", disputed:"#ef4444"
};
const S_BG: Record<string,string> = {
  draft:"#f1f5f9", open:"#eff6ff", in_progress:"#fffbeb", completed:"#ecfdf5", disputed:"#fef2f2"
};

function Badge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: S_BG[status]??"#f1f5f9", color: S_COLOR[status]??"#64748b" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: S_COLOR[status]??"#94a3b8" }} />
      {status.replace("_"," ")}
    </span>
  );
}

function Empty({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200">
      <p className="text-sm text-slate-400 mb-4">{text}</p>
      <Link href={href}>
        <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
          {cta}
        </button>
      </Link>
    </div>
  );
}

// ── EMPLOYER VIEW ─────────────────────────────────────────────────────────────
function EmployerApplications({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<ProjectWithFreelancer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"all"|"active"|"open"|"completed">("all");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, freelancer:profiles!projects_freelancer_id_fkey(id, full_name, pfi), milestones(count)")
      .eq("employer_id", userId)
      .order("created_at", { ascending: false });
    setProjects((data ?? []) as ProjectWithFreelancer[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function removeFreelancer(projectId: number) {
    const { error } = await supabase
      .from("projects")
      .update({ freelancer_id: null, status: "open" })
      .eq("id", projectId);
    if (error) { toast.error("Failed to remove freelancer."); return; }
    toast.success("Project reopened to new applicants.");
    load();
  }

  const filtered =
    tab === "all"       ? projects :
    tab === "active"    ? projects.filter(p => p.status === "in_progress") :
    tab === "open"      ? projects.filter(p => p.status === "open") :
    projects.filter(p => p.status === "completed");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 w-fit">
        {(["all","active","open","completed"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all"
            style={{
              background: tab === t ? "white"   : "transparent",
              color:      tab === t ? "#4f46e5" : "#64748b",
              boxShadow:  tab === t ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}>
            {t === "all"
              ? `All (${projects.length})`
              : `${t.replace("_"," ")} (${projects.filter(p => p.status === (t === "active" ? "in_progress" : t)).length})`
            }
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse bg-white border border-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty text="No projects in this category yet." cta="Create a new project →" href="/projects/new" />
      ) : filtered.map((p, i) => (
        <motion.div key={p.id}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md hover:shadow-slate-100 transition-shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link href={`/projects/${p.id}`}>
                  <h3 className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors">{p.title}</h3>
                </Link>
                <Badge status={p.status} />
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>Budget: <span className="font-bold text-indigo-600">${p.total_budget.toLocaleString()}</span></span>
                <span>{new Date(p.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            {p.freelancer ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {p.freelancer.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{p.freelancer.full_name ?? "Unknown"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(p.freelancer.pfi ?? 0, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600">PFI {(p.freelancer.pfi ?? 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${p.id}`}>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      View project
                    </button>
                  </Link>
                  {p.status !== "completed" && (
                    <button onClick={() => removeFreelancer(p.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                      Remove freelancer
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  Waiting for a freelancer to accept…
                </p>
                <Link href={`/projects/${p.id}`}>
                  <button className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                    View project
                  </button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── FREELANCER VIEW ───────────────────────────────────────────────────────────
function FreelancerApplications({ userId }: { userId: string }) {
  const [projects,     setProjects]     = useState<ProjectWithFreelancer[]>([]);
  const [openProjects, setOpenProjects] = useState<ProjectWithFreelancer[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("projects")
        .select("*, employer:profiles!projects_employer_id_fkey(full_name), milestones(count)")
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("projects")
        .select("*, employer:profiles!projects_employer_id_fkey(full_name), milestones(count)")
        .eq("status", "open").is("freelancer_id", null)
        .order("created_at", { ascending: false }).limit(6),
    ]).then(([myRes, openRes]) => {
      setProjects((myRes.data ?? []) as ProjectWithFreelancer[]);
      setOpenProjects((openRes.data ?? []) as ProjectWithFreelancer[]);
      setLoading(false);
    });
  }, [userId]);

  // ── FIXED: direct Supabase call — no API route, no token needed ────────────
  async function applyToProject(projectId: number) {
    const { error } = await supabase
      .from("projects")
      .update({ freelancer_id: userId, status: "in_progress" })
      .eq("id", projectId)
      .is("freelancer_id", null)
      .eq("status", "open");

    if (error) { toast.error(error.message); return; }

    toast.success("Applied! Project is now yours.");
    const accepted = openProjects.find(p => p.id === projectId);
    if (accepted) {
      setOpenProjects(prev => prev.filter(p => p.id !== projectId));
      setProjects(prev => [{ ...accepted, status: "in_progress", freelancer_id: userId }, ...prev]);
    }
  }

  return (
    <div className="space-y-8">
      {/* My applications */}
      <div>
        <h3 className="text-base font-black text-slate-900 mb-4">
          My Applications
          <span className="ml-2 text-sm font-normal text-slate-400">({projects.length})</span>
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white border border-slate-200" />)}
          </div>
        ) : projects.length === 0 ? (
          <Empty text="You haven't accepted any projects yet." cta="Browse open projects →" href="/projects" />
        ) : projects.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white border border-slate-200 p-5 mb-3 hover:shadow-md hover:shadow-slate-100 transition-shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link href={`/projects/${p.id}`}>
                    <h4 className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors">{p.title}</h4>
                  </Link>
                  <Badge status={p.status} />
                </div>
                <p className="text-xs text-slate-400">
                  Posted by: <span className="font-semibold text-slate-600">{p.employer?.full_name ?? "Employer"}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Budget: <span className="font-bold text-indigo-600">${p.total_budget.toLocaleString()}</span>
                  {" · "}Milestones: <span className="font-semibold">{(p.milestones as any)?.[0]?.count ?? 0}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: p.status === "in_progress" ? "#eff6ff" : p.status === "completed" ? "#ecfdf5" : "#f1f5f9",
                    color:      p.status === "in_progress" ? "#3b82f6" : p.status === "completed" ? "#10b981" : "#94a3b8",
                  }}>
                  <span className="h-1.5 w-1.5 rounded-full mr-1"
                    style={{ background: p.status === "in_progress" ? "#3b82f6" : p.status === "completed" ? "#10b981" : "#94a3b8" }} />
                  {p.status === "in_progress" ? "In progress" : p.status === "completed" ? "Completed" : p.status}
                </div>
                <Link href={`/projects/${p.id}`}>
                  <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    View & submit work →
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Open projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900">
            Open Projects — Apply Now
            <span className="ml-2 text-sm font-normal text-slate-400">({openProjects.length})</span>
          </h3>
          <Link href="/projects" className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">See all →</Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse bg-white border border-slate-200" />)}
          </div>
        ) : openProjects.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-400">No open projects right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {openProjects.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-100 hover:border-indigo-200 transition-all"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{p.title}</h4>
                  <span className="text-base font-black text-indigo-600 shrink-0">${p.total_budget.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{p.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    By <span className="font-semibold">{p.employer?.full_name ?? "Employer"}</span>
                  </p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => applyToProject(p.id)}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-black text-white hover:bg-indigo-700 transition-colors">
                    Accept project
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">
              {profile.role === "employer" ? "Project Management" : "My Applications"}
            </p>
            <h1 className="text-2xl font-black text-slate-900">
              {profile.role === "employer" ? "Hired Freelancers & Projects" : "Applications & Open Work"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {profile.role === "employer"
                ? "See who's working on your projects. Remove and re-open if needed."
                : "Track every project you've applied to and browse new opportunities."}
            </p>
          </div>
          <ThemeToggle />
        </motion.div>

        {profile.role === "employer"
          ? <EmployerApplications userId={user.id} />
          : <FreelancerApplications userId={user.id} />
        }
      </div>
    </div>
  );
}