// PATH: components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/hooks/useUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { Menu, X, LogOut, Zap, ArrowRight } from "lucide-react";

type NavLink = { label: string; href: string };

function getLinks(role: string | undefined, isGuest: boolean, loggedIn: boolean): NavLink[] {
  if (loggedIn && role === "employer") {
    return [
      { label: "Dashboard",      href: "/dashboard/employer" },
      { label: "My Projects",    href: "/projects"           },
      { label: "Create Project", href: "/projects/new"       },
      { label: "Profile",        href: "/profile"            },
    ];
  }
  if (loggedIn && role === "freelancer") {
    return [
      { label: "Dashboard",   href: "/dashboard/freelancer"  },
      { label: "Find Work",   href: "/projects"              },
      { label: "My Projects", href: "/projects?filter=mine"  },
      { label: "Profile",     href: "/profile"               },
    ];
  }
  if (isGuest) {
    return [
      { label: "Home",  href: "/"     },
      { label: "Demo",  href: "/demo" },
    ];
  }
  return [
    { label: "Home",  href: "/"      },
    { label: "Login", href: "/login" },
  ];
}

export default function Navbar() {
  const { user, profile, loading } = useUser();
  const pathname  = usePathname();
  const router    = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isGuest,    setIsGuest]    = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    setIsGuest(localStorage.getItem("guest_mode") === "true");
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const loggedIn = !!user;
  const links    = getLinks(profile?.role, isGuest, loggedIn);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("guest_mode");
    router.push("/");
  };

  const showSignup = !loggedIn;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "var(--surface-solid)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))" }}
            >
              <Zap size={13} color="#fff" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
              Nexus<span style={{ color: "var(--accent)" }}>Work</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                  style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: "var(--glow)" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {showSignup && (
              <Link href="/signup">
                <button
                  className="glow-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all hover:scale-[1.04]"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                    color: "#fff",
                  }}
                >
                  Sign Up <ArrowRight size={11} />
                </button>
              </Link>
            )}

            {loggedIn && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ color: "var(--text-3)" }}
              >
                <LogOut size={13} />
                Logout
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 px-6 py-5 flex flex-col gap-1 md:hidden"
            style={{
              background: "var(--surface-solid)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    color: active ? "var(--accent)" : "var(--text-2)",
                    background: active ? "var(--glow)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
            {showSignup && (
              <Link href="/signup">
                <button
                  className="mt-2 w-full py-3 rounded-xl font-semibold text-sm"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                    color: "#fff",
                  }}
                >
                  Sign Up Free
                </button>
              </Link>
            )}
            {loggedIn && (
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "var(--text-3)" }}
              >
                <LogOut size={14} /> Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar height spacer */}
      <div className="h-16" />
    </>
  );
}