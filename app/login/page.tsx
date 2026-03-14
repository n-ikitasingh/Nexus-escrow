"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Card }   from "@/components/ui/Card";
import { Alert }  from "@/components/ui/Alert";
import Input      from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const fieldVariants: Variants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.35, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Field-level validation errors
  const [emailErr,    setEmailErr]    = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    let ok = true;
    setEmailErr("");
    setPasswordErr("");

    if (!email.trim()) {
      setEmailErr("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Enter a valid email address.");
      ok = false;
    }

    if (!password) {
      setPasswordErr("Password is required.");
      ok = false;
    } else if (password.length < 6) {
      setPasswordErr("Password must be at least 6 characters.");
      ok = false;
    }

    return ok;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Make the error human-readable
        const msg = authError.message.toLowerCase().includes("invalid")
          ? "Incorrect email or password."
          : authError.message;
        setError(msg);
        return;
      }

      // Fetch the profile to get the user's role, then redirect to the
      // correct dashboard. Fallback to employer if profile fetch fails.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      const destination = profile?.role === "freelancer"
        ? "/dashboard/freelancer"
        : "/dashboard/employer";

      toast.success("Welcome back!");
      router.push(destination);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    // Guests go to the interactive demo, not the real dashboard
    router.push("/demo");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">

      {/*
        The mesh-bg, orb-1, orb-2, orb-3 are rendered in app/layout.tsx
        and sit at z-0. This div just ensures our content is above them.
      */}
      <div className="relative z-10 w-full max-w-md">

        {/* ── Brand mark above card ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center mb-8"
        >
          {/* Logo */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4 glow-accent"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-6 w-6">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.45"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Sign in to your Nexus account
          </p>
        </motion.div>

        {/* ── Card ── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <form onSubmit={handleSignIn} noValidate className="space-y-5">

              {/* Error alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1,  y: 0  }}
                  transition={{ duration: 0.25 }}
                >
                  <Alert
                    type="error"
                    message={error}
                    dismissible
                    onClose={() => setError(null)}
                  />
                </motion.div>
              )}

              {/* Email */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                  error={emailErr}
                  required
                  autoComplete="email"
                />
              </motion.div>

              {/* Password */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                    Password <span className="text-rose-500" aria-hidden="true">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  label=""
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordErr(""); }}
                  error={passwordErr}
                  required
                  autoComplete="current-password"
                />
              </motion.div>

              {/* Sign in button */}
              <motion.div
                custom={2}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="pt-1"
              >
                <div style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", borderRadius: "0.75rem" }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full !bg-transparent hover:!bg-transparent"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div
                custom={3}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3"
              >
                <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
              </motion.div>

              {/* Guest button */}
              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="w-full border"
                  onClick={handleGuest}
                  leftIcon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" clipRule="evenodd"
                        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" />
                    </svg>
                  }
                >
                  Continue as Guest
                </Button>
              </motion.div>

            </form>
          </Card>
        </motion.div>

        {/* ── Sign-up link ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-2)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold transition-opacity hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            Sign up
          </Link>
        </motion.p>

        {/* ── Footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.3 }}
          className="mt-4 text-center text-[11px]"
          style={{ color: "var(--text-3)" }}
        >
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:opacity-70" style={{ color: "var(--text-3)" }}>
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:opacity-70" style={{ color: "var(--text-3)" }}>
            Privacy Policy
          </Link>
        </motion.p>

      </div>
    </div>
  );
}