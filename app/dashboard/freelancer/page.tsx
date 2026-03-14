// PATH: app/dashboard/freelancer/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useUser }  from "@/components/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { Card }     from "@/components/ui/Card";
import { Button }   from "@/components/ui/Button";

interface Project {
  id:           number;
  title:        string;
  description:  string;
  status:       string;
  total_budget: number;
  employer_id:  string;
  freelancer_id: string | null;
  created_at:   string;
}

function PFIRing({ score }: { score: number }) {
  const displayPct    = Math.min(score, 100);
  const radius        = 52;
  const circumference = 2 * Math.PI * radius;
  const dash          = (displayPct / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : score >= 20 ? "#3b82f6" : "#9ca3af";
  const label = score >= 80 ? "Excellent" : score >= 50 ? "Good" : score >= 20 ? "Building" : "New";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={radius}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            transform="rotate(-90 64 64)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black" style={{ color }}>
            {score.toFixed(1)}
          </motion.span>
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-slate-400">PFI</span>
        </div>
      </div>
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: `${color}20`, color }}>
        {label}
      </span>
    </div>
  );
}

function OpenProjectCard({
  project, onAccept, accepting,
}: {
  project:   Project;
  onAccept:  (id: number) => void;
  accepting: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md hover:shadow-slate-100 transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/projects/${project.id}`}>
          <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
            {project.title}
          </h3>
        </Link>
        <span className="shrink-0 text-sm font-black text-indigo-600">
          ${project.total_budget.toLocaleString()}
        </span>
      </div>
      <p className="text-xs leading-relaxed line-clamp-2 text-slate-500">
        {project.description}
      </p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-medium text-slate-400">
          {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          disabled={accepting}
          onClick={() => onAccept(project.id)}
          className="rounded-lg px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          {accepting ? "Accepting…" : "Accept Project"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function FreelancerDashboard() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();

  const [openProjects, setOpenProjects] = useState<Project[]>([]);
  const [myProjects,   setMyProjects]   = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [acceptingId,  setAcceptingId]  = useState<number | null>(null);
  const [tab,          setTab]          = useState<"open" | "mine">("open");

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (profile?.role !== "freelancer") { router.replace("/dashboard/employer"); }
  }, [user, profile, userLoading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [openRes, myRes] = await Promise.all([
      supabase.from("projects").select("*")
        .eq("status", "open").is("freelancer_id", null)
        .order("created_at", { ascending: false }),
      supabase.from("projects").select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (!openRes.error) setOpenProjects(openRes.data ?? []);
    if (!myRes.error)   setMyProjects(myRes.data   ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  // ── FIXED: direct Supabase call — no API route, no token needed ────────────
  async function handleAccept(projectId: number) {
    setAcceptingId(projectId);
    try {
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from("projects")
        .update({ freelancer_id: user.id, status: "in_progress" })
        .eq("id", projectId)
        .is("freelancer_id", null)
        .eq("status", "open");

      if (error) throw new Error(error.message);

      toast.success("Project accepted! Let's get to work.");
      const accepted = openProjects.find(p => p.id === projectId);
      if (accepted) {
        setOpenProjects(prev => prev.filter(p => p.id !== projectId));
        setMyProjects(prev => [{ ...accepted, status: "in_progress", freelancer_id: user.id }, ...prev]);
      }
      setTab("mine");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not accept project");
    } finally {
      setAcceptingId(null);
    }
  }

  const pfi = profile?.pfi ?? 0;

  if (userLoading || (!user && !userLoading)) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">
              Freelancer Dashboard
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="text-sm mt-1 mb-4 text-slate-500">
              Find work, submit milestones, and grow your PFI reputation score.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Active jobs",   value: myProjects.filter(p => p.status === "in_progress").length },
                { label: "Completed",     value: myProjects.filter(p => p.status === "completed").length   },
                { label: "Open to apply", value: openProjects.length                                        },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-center">
                  <p className="text-xl font-black text-slate-900">{value}</p>
                  <p className="text-[10px] font-medium text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col items-center gap-3">
            <PFIRing score={pfi} />
            <p className="text-xs text-center text-slate-400">Professional Fidelity Index</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="flex gap-1 rounded-xl bg-white border border-slate-200 p-1 mb-6 w-fit">
            {(["open","mine"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? "#4f46e5" : "transparent",
                  color:      tab === t ? "#fff"    : "#64748b",
                }}>
                {t === "open" ? `Open Projects (${openProjects.length})` : `My Projects (${myProjects.length})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "open" ? (
              <motion.div key="open"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl h-40 animate-pulse bg-white border border-slate-200" />
                    ))}
                  </div>
                ) : openProjects.length === 0 ? (
                  <div className="rounded-2xl py-16 text-center bg-white border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">No open projects right now. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {openProjects.map(p => (
                      <OpenProjectCard key={p.id} project={p}
                        onAccept={handleAccept} accepting={acceptingId === p.id} />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="mine"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-2xl h-16 animate-pulse bg-white border border-slate-200" />
                    ))}
                  </div>
                ) : myProjects.length === 0 ? (
                  <div className="rounded-2xl py-16 text-center bg-white border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 mb-4">You haven't accepted any projects yet.</p>
                    <button onClick={() => setTab("open")}
                      className="text-sm font-semibold text-indigo-600 underline">
                      Browse open projects →
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                    {myProjects.map((p, i) => (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex flex-wrap items-center gap-4 px-5 py-4"
                        style={{ borderBottom: i < myProjects.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${p.id}`}>
                            <p className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate transition-colors">
                              {p.title}
                            </p>
                          </Link>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.status === "completed"   ? "bg-emerald-50 text-emerald-700" :
                          p.status === "in_progress" ? "bg-amber-50 text-amber-700"    : "bg-slate-100 text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            p.status === "completed"   ? "bg-emerald-500" :
                            p.status === "in_progress" ? "bg-amber-500"   : "bg-slate-400"
                          }`} />
                          {p.status.replace("_"," ")}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          ${p.total_budget.toLocaleString()}
                        </span>
                        <Link href={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm">View →</Button>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* PFI explanation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-2">How your PFI is calculated</h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Your Professional Fidelity Index rises with every approved milestone and falls with rejections.
            It's built on milestone accuracy, submission quality scored by AI, and deadline adherence.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: "Milestone approved",  delta: "+5 PFI", color: "#10b981" },
              { label: "Partial completion",  delta: "+2 PFI", color: "#f59e0b" },
              { label: "Milestone rejected",  delta: "-3 PFI", color: "#ef4444" },
            ].map(({ label, delta, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                style={{ background: `${color}12`, color }}>
                <span className="font-bold">{delta}</span>
                <span className="text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}