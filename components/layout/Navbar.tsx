// PATH: components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useUser }    from "@/components/hooks/useUser";
import { supabase }   from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─────────────────────────────────────────────────────────────────────────────
// Nav link component
// ─────────────────────────────────────────────────────────────────────────────

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <span
        className="relative text-sm font-medium transition-colors duration-200 hover:opacity-80"
        style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
      >
        {label}
        {active && (
          <motion.span
            layoutId="nav-underline"
            className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        )}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname               = usePathname();
  const router                 = useRouter();
  const { user, profile, loading } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
    router.push("/");
  }

  // ── Build nav links based on auth state ───────────────────────────────────

  const isEmployer   = profile?.role === "employer";
  const isFreelancer = profile?.role === "freelancer";

  const navLinks: { href: string; label: string }[] = (() => {
    if (!user) {
      // Not logged in
      return [
        { href: "/",      label: "Home"   },
        { href: "/demo",  label: "Demo"   },
      ];
    }
    if (isEmployer) {
      return [
        { href: "/dashboard/employer", label: "Dashboard"      },
        { href: "/projects",           label: "My Projects"    },
        { href: "/projects/new",       label: "New Project"    },
      ];
    }
    if (isFreelancer) {
      return [
        { href: "/dashboard/freelancer", label: "Dashboard"  },
        { href: "/projects",             label: "Find Work"  },
      ];
    }
    return [];
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background:   scrolled ? "var(--surface)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))" }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.45"/>
            </svg>
          </div>
          <span className="font-black text-base tracking-tight" style={{ color: "var(--text-1)" }}>
            Nexus
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 ml-4">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} active={pathname === href} />
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />

          {/* Auth buttons — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              // Skeleton pill while loading
              <div className="h-7 w-20 rounded-lg animate-pulse" style={{ background: "var(--surface-hover)" }} />
            ) : user ? (
              <>
                {/* Avatar + name */}
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                  style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-black"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-1)" }}>
                    {profile?.full_name?.split(" ")[0] ?? "Account"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors hover:opacity-80"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-2)", background: "transparent" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-2)" }}>
                    Sign in
                  </button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="rounded-lg px-4 py-1.5 text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--surface-hover)" }}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "var(--text-1)" }}>
              {mobileOpen
                ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"/>
                : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z"/>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", overflow: "hidden" }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}>
                  <div
                    className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: pathname === href ? "var(--surface-hover)" : "transparent",
                      color:      pathname === href ? "var(--accent)" : "var(--text-2)",
                    }}
                  >
                    {label}
                  </div>
                </Link>
              ))}

              <div className="border-t pt-3 mt-3 space-y-2" style={{ borderColor: "var(--border)" }}>
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-black"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                        {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                          {profile?.full_name}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          {profile?.role}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-left"
                      style={{ color: "#ef4444", background: "#ef444412" }}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <div className="rounded-xl px-4 py-2.5 text-sm font-medium"
                        style={{ color: "var(--text-2)" }}>Sign in</div>
                    </Link>
                    <Link href="/signup">
                      <div className="rounded-xl px-4 py-2.5 text-sm font-bold text-white text-center"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                        Get Started
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;