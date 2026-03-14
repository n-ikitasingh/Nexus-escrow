// PATH: components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import toast from "react-hot-toast";

import { useUser }  from "@/components/hooks/useUser";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href:  string;
  icon:  ReactNode;
  badge?: string | number;
}

interface NavSection {
  title?: string;
  items:  NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

const Icons = {
  home: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd"
        d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7.414A1 1 0 0 0 17.707 7l-3.707-3.707A1 1 0 0 0 13.293 3H3ZM13 5.414 15.586 8H13V5.414Z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  apps: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Build nav items based on role — called inside the component
// ─────────────────────────────────────────────────────────────────────────────

function buildNav(role: "employer" | "freelancer" | undefined): NavSection[] {
  if (role === "employer") {
    return [
      {
        items: [
          { label: "Dashboard",      href: "/dashboard/employer", icon: Icons.home   },
          { label: "My Projects",    href: "/projects",           icon: Icons.folder },
          { label: "Applications",   href: "/applications",       icon: Icons.apps   },
          { label: "New Project",    href: "/projects/new",       icon: Icons.plus   },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Profile",        href: "/profile",            icon: Icons.user   },
        ],
      },
    ];
  }

  if (role === "freelancer") {
    return [
      {
        items: [
          { label: "Dashboard",      href: "/dashboard/freelancer", icon: Icons.home   },
          { label: "Find Work",      href: "/projects",             icon: Icons.search },
          { label: "My Applications",href: "/applications",         icon: Icons.apps   },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Profile & PFI",  href: "/profile",              icon: Icons.chart  },
        ],
      },
    ];
  }

  // Guest / loading
  return [
    {
      items: [
        { label: "Home",  href: "/",      icon: Icons.home   },
        { label: "Demo",  href: "/demo",  icon: Icons.chart  },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Single nav link
// ─────────────────────────────────────────────────────────────────────────────

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={[
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        isActive
          ? "font-semibold"
          : "hover:opacity-80",
      ].join(" ")}
      style={{ color: isActive ? "var(--text-1)" : "var(--text-2)" }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg"
          style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <span
        className="relative z-10 shrink-0"
        style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }}
      >
        {item.icon}
      </span>
      <span className="relative z-10 flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner sidebar content — shared by desktop + mobile
// ─────────────────────────────────────────────────────────────────────────────

function SidebarInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const nav = buildNav(profile?.role);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    router.push("/");
  }

  // First letter of name for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const displayName  = profile?.full_name  ?? user?.email ?? "Guest";
  const displayEmail = user?.email ?? "";

  return (
    <>
      {/* Logo row */}
      <div
        className="flex h-14 items-center justify-between px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.45"/>
            </svg>
          </div>
          <span className="font-black text-sm tracking-tight" style={{ color: "var(--text-1)" }}>
            Nexus
          </span>
        </Link>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--text-3)" }}
          aria-label="Close sidebar"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75}
            strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M2 2l12 12M14 2L2 14" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {loading ? (
          // Skeleton nav while user loads
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg animate-pulse"
                style={{ background: "var(--surface-hover)" }} />
            ))}
          </div>
        ) : (
          nav.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-3)" }}>
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item.href + item.label}>
                    <NavLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="shrink-0 px-3 py-3 space-y-1"
        style={{ borderTop: "1px solid var(--border)" }}>

        {user ? (
          <>
            {/* User info */}
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-black"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight"
                  style={{ color: "var(--text-1)" }}>
                  {displayName}
                </p>
                <p className="truncate text-xs capitalize"
                  style={{ color: "var(--text-3)" }}>
                  {profile?.role ?? "loading…"}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: "#ef4444" }}
            >
              <span style={{ color: "#ef4444" }}>{Icons.logout}</span>
              Sign out
            </button>
          </>
        ) : (
          <div className="space-y-1">
            <Link href="/login">
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                style={{ color: "var(--text-2)" }}>
                Sign in
              </div>
            </Link>
            <Link href="/signup">
              <div className="flex items-center justify-center rounded-lg py-2 text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                Get Started
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported Sidebar component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop — always visible, no animation (prevents layout shift) */}
      <aside
        className="hidden lg:flex lg:flex-col w-[240px] shrink-0 h-screen sticky top-0"
        style={{
          borderRight:  "1px solid var(--border)",
          background:   "var(--surface)",
        }}
      >
        <SidebarInner onClose={onClose} />
      </aside>

      {/* Mobile — slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="fixed top-0 left-0 z-40 h-full flex flex-col w-[240px] lg:hidden"
              style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <SidebarInner onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;