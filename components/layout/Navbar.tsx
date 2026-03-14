// PATH: components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useUser }    from "@/components/hooks/useUser";
import { supabase }   from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
interface NavbarProps {
  onMenuClick: () => void;   // opens the mobile sidebar
  title: string;             // current page title (displayed on desktop)
}

// -----------------------------------------------------------------------------
// Nav link component
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Navbar
// -----------------------------------------------------------------------------
export function Navbar({ onMenuClick, title }: NavbarProps) {
  const pathname               = usePathname();
  const router                 = useRouter();
  const { user, profile, loading } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
    router.push("/");
  }

  // Build nav links based on auth state
  const isEmployer   = profile?.role === "employer";
  const isFreelancer = profile?.role === "freelancer";

  const navLinks: { href: string; label: string }[] = (() => {
    if (!user) {
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

        {/* Hamburger menu button – only visible on mobile, opens the sidebar */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--surface-hover)" }}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "var(--text-1)" }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z"/>
          </svg>
        </button>

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

        {/* Page title – visible on desktop */}
        <h1 className="hidden sm:block text-sm font-medium truncate max-w-xs" style={{ color: "var(--text-2)" }}>
          {title}
        </h1>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} active={pathname === href} />
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <ThemeToggle />

          {/* Auth buttons – desktop */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="h-7 w-20 rounded-lg animate-pulse" style={{ background: "var(--surface-hover)" }} />
            ) : user ? (
              <>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                  style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
                >
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
                  <button
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-2)" }}
                  >
                    Sign in
                  </button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-lg px-4 py-1.5 text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;