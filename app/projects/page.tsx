"use client";
// PATH: app/projects/page.tsx
// PAGE: /projects — employers see their projects, freelancers see open + assigned projects

import {
  useEffect, useState, useCallback, useMemo, useRef,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase }  from "@/lib/supabase";
import { useUser }   from "@/components/hooks/useUser";
import { Card }      from "@/components/ui/Card";
import { Button }    from "@/components/ui/Button";
import { Alert }     from "@/components/ui/Alert";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9; // cards per page

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Project {
  id:            string;
  title:         string;
  description:   string;
  total_budget:  number;
  status:        string;
  employer_id:   string;
  freelancer_id: string | null;
  created_at:    string;
}

type FilterStatus = "all" | "draft" | "open" | "in_progress" | "completed" | "cancelled";
type SortKey      = "created_at" | "total_budget" | "title";

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  draft:       { bg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",             dot: "bg-gray-400",    label: "Draft"       },
  open:        { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",           dot: "bg-blue-500",    label: "Open"        },
  in_progress: { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",       dot: "bg-amber-500",   label: "In Progress" },
  completed:   { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500", label: "Completed"  },
  cancelled:   { bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",               dot: "bg-red-500",     label: "Cancelled"   },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card — shown while loading
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3 animate-pulse"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Title + badge row */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 rounded-md flex-1" style={{ background: "var(--surface-hover)" }} />
        <div className="h-5 w-16 rounded-full shrink-0" style={{ background: "var(--surface-hover)" }} />
      </div>
      {/* Description lines */}
      <div className="space-y-2">
        <div className="h-3 rounded-md w-full"  style={{ background: "var(--surface-hover)" }} />
        <div className="h-3 rounded-md w-4/5"   style={{ background: "var(--surface-hover)" }} />
        <div className="h-3 rounded-md w-2/3"   style={{ background: "var(--surface-hover)" }} />
      </div>
      {/* Footer row */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-20 rounded-md"    style={{ background: "var(--surface-hover)" }} />
        <div className="h-7 w-24 rounded-lg"    style={{ background: "var(--surface-hover)" }} />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project card
// ─────────────────────────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const date = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="h-full flex flex-col">
        <div className="flex flex-col flex-1 gap-3">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold line-clamp-2 leading-snug flex-1"
              style={{ color: "var(--text-1)" }}>
              {project.title}
            </h3>
            <StatusBadge status={project.status} />
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed line-clamp-3 flex-1"
            style={{ color: "var(--text-2)" }}>
            {project.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t"
            style={{ borderColor: "var(--border)" }}>
            <div>
              <span className="text-base font-bold" style={{ color: "var(--accent)" }}>
                ${project.total_budget.toLocaleString()}
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{date}</p>
            </div>
            <Link href={`/projects/${project.id}`}>
              <Button variant="secondary" size="sm">View →</Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination controls
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({
  page, total, pageSize, onChange,
}: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="ghost" size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >← Prev</Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors"
              style={{
                background: isActive ? "var(--accent)" : "transparent",
                color:      isActive ? "#fff" : "var(--text-2)",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost" size="sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >Next →</Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section with filter + sort controls
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title, projects, emptyMsg, loading, sectionIndex = 0,
}: {
  title: string;
  projects: Project[];
  emptyMsg: string;
  loading: boolean;
  sectionIndex?: number;
}) {
  const [filter,   setFilter]   = useState<FilterStatus>("all");
  const [sort,     setSort]     = useState<SortKey>("created_at");
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");

  // Reset page when filter/sort/search changes
  useEffect(() => { setPage(1); }, [filter, sort, search]);

  // Filter + sort + search — memoized so it only recalculates when inputs change
  const processed = useMemo(() => {
    let list = [...projects];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filter !== "all") {
      list = list.filter(p => p.status === filter);
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "total_budget") return b.total_budget - a.total_budget;
      if (sort === "title")        return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [projects, filter, sort, search]);

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processed.slice(start, start + PAGE_SIZE);
  }, [processed, page]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: sectionIndex * 0.1 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
          {title}
          {!loading && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-3)" }}>
              ({processed.length})
            </span>
          )}
        </h2>

        {/* Controls — only show when we have data */}
        {!loading && projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-7 rounded-lg px-3 text-xs outline-none"
              style={{
                background: "var(--surface-hover)",
                border:     "1px solid var(--border-strong)",
                color:      "var(--text-1)",
                width:      "140px",
              }}
            />

            {/* Status filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as FilterStatus)}
              className="h-7 rounded-lg px-2 text-xs outline-none cursor-pointer"
              style={{
                background: "var(--surface-hover)",
                border:     "1px solid var(--border-strong)",
                color:      "var(--text-1)",
              }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="h-7 rounded-lg px-2 text-xs outline-none cursor-pointer"
              style={{
                background: "var(--surface-hover)",
                border:     "1px solid var(--border-strong)",
                color:      "var(--text-1)",
              }}
            >
              <option value="created_at">Newest first</option>
              <option value="total_budget">Highest budget</option>
              <option value="title">A → Z</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : processed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl py-12 text-center"
          style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {search || filter !== "all" ? "No projects match your filters." : emptyMsg}
          </p>
          {(search || filter !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilter("all"); }}
              className="mt-2 text-xs underline"
              style={{ color: "var(--accent)" }}
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${sort}-${page}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {paginated.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          <Pagination
            page={page}
            total={processed.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { user, profile, loading: userLoading } = useUser();

  const [myProjects,      setMyProjects]      = useState<Project[]>([]);
  const [openProjects,    setOpenProjects]    = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Ref prevents double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // ── Fetch — wrapped in useCallback so it can be called on retry too ────────

  const loadProjects = useCallback(async () => {
    if (!user || !profile) return;
    setLoadingProjects(true);
    setError(null);

    try {
      if (profile.role === "employer") {
        // Single query — only their own projects
        // Hits idx_projects_employer_created index
        const { data, error: err } = await supabase
          .from("projects")
          .select("id, title, description, total_budget, status, employer_id, freelancer_id, created_at")
          .eq("employer_id", user.id)
          .order("created_at", { ascending: false });

        if (err) throw err;
        setMyProjects(data ?? []);

      } else if (profile.role === "freelancer") {
        // Two queries run in PARALLEL — not sequential
        // Promise.all fires both at the same time, total time = max(q1, q2) not q1+q2
        const [openRes, myRes] = await Promise.all([
          // Hits idx_projects_status_freelancer partial index
          supabase
            .from("projects")
            .select("id, title, description, total_budget, status, employer_id, freelancer_id, created_at")
            .eq("status", "open")
            .is("freelancer_id", null)
            .order("created_at", { ascending: false }),

          // Hits idx_projects_freelancer_created index
          supabase
            .from("projects")
            .select("id, title, description, total_budget, status, employer_id, freelancer_id, created_at")
            .eq("freelancer_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        // Check both errors before setting state
        if (openRes.error) throw openRes.error;
        if (myRes.error)   throw myRes.error;

        // Both setState calls happen synchronously — React batches them
        setOpenProjects(openRes.data ?? []);
        setMyProjects(myRes.data   ?? []);
      }
    } catch (err: unknown) {
      console.error("loadProjects error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load projects. Please try again."
      );
    } finally {
      // Always clears loading — even if both queries errored
      setLoadingProjects(false);
    }
  }, [user, profile]);

  // ── Trigger fetch once user+profile are ready ──────────────────────────────

  useEffect(() => {
    // Wait for useUser to finish resolving
    if (userLoading) return;
    // Nothing to fetch if not logged in
    if (!user || !profile) return;
    // Prevent double-fetch in React Strict Mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    loadProjects();
  }, [userLoading, user, profile, loadProjects]);

  // ── Derived loading state ──────────────────────────────────────────────────
  // Show skeletons only during the projects fetch, NOT during user loading.
  // This way the page header renders immediately while data loads behind it.
  const showSkeletons = loadingProjects;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="relative z-10 mx-auto max-w-5xl space-y-8">

        {/* ── Page header — renders IMMEDIATELY, no spinner blocking it ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
              {userLoading
                ? <span className="inline-block h-7 w-32 rounded-lg animate-pulse" style={{ background: "var(--surface-hover)" }} />
                : profile?.role === "employer" ? "My Projects" : "Projects"
              }
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              {userLoading ? "" : profile?.role === "employer"
                ? "Manage the projects you've created."
                : "Browse open projects or manage your active work."
              }
            </p>
          </div>

          {/* Create button — only for employers */}
          {!userLoading && profile?.role === "employer" && (
            <Link href="/projects/new">
              <div style={{
                background:   "linear-gradient(135deg, var(--accent), var(--accent-2))",
                borderRadius: "0.75rem",
              }}>
                <Button variant="primary" size="md" className="!bg-transparent hover:!bg-transparent">
                  + Create New Project
                </Button>
              </div>
            </Link>
          )}
        </motion.div>

        {/* ── Error with retry button ── */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              type="error"
              message={error}
              description="Check your connection or try again."
              dismissible
              onClose={() => setError(null)}
            />
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { fetchedRef.current = false; loadProjects(); }}
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Employer view ── */}
        {(userLoading || profile?.role === "employer") && !error && (
          <Section
            title="Your Projects"
            projects={myProjects}
            emptyMsg="You haven't created any projects yet. Click 'Create New Project' to get started."
            loading={showSkeletons || userLoading}
            sectionIndex={0}
          />
        )}

        {/* ── Freelancer view ── */}
        {(userLoading || profile?.role === "freelancer") && !error && (
          <>
            <Section
              title="Open Projects"
              projects={openProjects}
              emptyMsg="No open projects available right now. Check back soon!"
              loading={showSkeletons || userLoading}
              sectionIndex={0}
            />
            <Section
              title="My Projects"
              projects={myProjects}
              emptyMsg="You haven't accepted any projects yet."
              loading={showSkeletons || userLoading}
              sectionIndex={1}
            />
          </>
        )}

      </div>
    </div>
  );
}