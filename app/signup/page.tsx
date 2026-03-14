"use client";
// PATH: app/signup/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card }   from "@/components/ui/Card";
import { Alert }  from "@/components/ui/Alert";
import Input      from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = "freelancer" | "employer";

interface FormData {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
  role:            Role;
}

interface FieldErrors {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error message normalizer
// Converts raw Supabase error strings into clear, user-friendly messages.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeAuthError(message: string): { text: string; type: "error" | "warning" | "info" } {
  const m = message.toLowerCase();

  // Rate limit — tell the user to wait, not to retry immediately
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("email rate limit")) {
    return {
      text: "Too many signup attempts. Please wait a few minutes before trying again.",
      type: "warning",
    };
  }

  // Duplicate email — guide them to login instead
  if (
    m.includes("user already registered") ||
    m.includes("already been registered") ||
    m.includes("email already") ||
    m.includes("already exists")
  ) {
    return {
      text: "An account with this email already exists. Please sign in instead.",
      type: "info",
    };
  }

  // Weak password policy from Supabase
  if (m.includes("password") && (m.includes("weak") || m.includes("strength"))) {
    return {
      text: "Your password is too weak. Use a mix of uppercase, numbers, and symbols.",
      type: "error",
    };
  }

  // Invalid email format (server-side catch)
  if (m.includes("invalid email") || m.includes("valid email")) {
    return {
      text: "Please enter a valid email address.",
      type: "error",
    };
  }

  // Network / server unreachable
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch")) {
    return {
      text: "Network error — check your connection and try again.",
      type: "error",
    };
  }

  // Fallback: show the raw message but cleaned up
  return { text: message, type: "error" };
}

function normalizeProfileError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("duplicate") || m.includes("unique") || m.includes("already exists")) {
    return "A profile for this account already exists. Please sign in.";
  }
  if (m.includes("rls") || m.includes("policy") || m.includes("permission") || m.includes("denied")) {
    return "Profile creation was blocked by a permissions policy. Please contact support.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Network error while saving your profile. Your account was created — try signing in.";
  }

  return `Profile setup failed: ${message}. Your account exists — try signing in or contact support.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────

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
    transition: { duration: 0.35, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Password strength meter
// ─────────────────────────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { score: 1, label: "Weak",   color: "#ef4444" },
    { score: 2, label: "Fair",   color: "#f59e0b" },
    { score: 3, label: "Good",   color: "#3b82f6" },
    { score: 4, label: "Strong", color: "#10b981" },
  ];
  return map[score - 1] ?? { score: 0, label: "", color: "transparent" };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            animate={{ backgroundColor: i <= score ? color : "var(--border-strong)" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role radio card
// ─────────────────────────────────────────────────────────────────────────────

function RoleCard({
  value, selected, onSelect, icon, title, subtitle,
}: {
  value:    Role;
  selected: boolean;
  onSelect: (v: Role) => void;
  icon:     React.ReactNode;
  title:    string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="flex-1 rounded-xl p-4 text-left transition-all duration-200"
      style={{
        background: selected ? "var(--surface-hover)" : "transparent",
        border:     `2px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
        outline:    "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          style={{ borderColor: selected ? "var(--accent)" : "var(--border-strong)" }}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{title}</span>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-2)" }}>{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "", confirmPassword: "", role: "freelancer",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    name: "", email: "", password: "", confirmPassword: "",
  });

  const [loading,  setLoading]  = useState(false);

  // apiError carries both the message and the visual type (error/warning/info)
  const [apiError, setApiError] = useState<{
    text: string;
    type: "error" | "warning" | "info";
  } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key in fieldErrors) setFieldErrors(prev => ({ ...prev, [key]: "" }));
    setApiError(null); // dismiss banner when user starts editing
  }

  // ── Client-side validation ────────────────────────────────────────────────

  function validate(): boolean {
    const next: FieldErrors = { name: "", email: "", password: "", confirmPassword: "" };
    let ok = true;

    if (!form.name.trim()) {
      next.name = "Full name is required."; ok = false;
    }
    if (!form.email.trim()) {
      next.email = "Email is required."; ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address."; ok = false;
    }
    if (!form.password) {
      next.password = "Password is required."; ok = false;
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters."; ok = false;
    }
    if (!form.confirmPassword) {
      next.confirmPassword = "Please confirm your password."; ok = false;
    } else if (form.password !== form.confirmPassword) {
      // Client-side mismatch check — never reaches Supabase if passwords differ
      next.confirmPassword = "Passwords do not match."; ok = false;
    }

    setFieldErrors(next);
    return ok;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {

      // ── Step 1: Create auth user ──────────────────────────────────────────
      // IMPORTANT: pass full_name AND role inside options.data.
      // These land in auth.users.raw_user_meta_data and are read by the
      // database trigger (handle_new_user) that auto-creates the profile row.
      // This means profile creation succeeds even when email confirmation is ON
      // and there is no active session yet.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            role:      form.role,       // trigger reads this → profiles.role
          },
        },
      });

      if (authError) {
        setApiError(normalizeAuthError(authError.message));
        return;
      }

      // Supabase quirk: when email confirmation is ON and the email already
      // exists, signUp returns NO error but the user has an empty identities
      // array. Detect and handle this as "already registered".
      const identities = authData.user?.identities ?? [];
      if (authData.user && identities.length === 0) {
        setApiError({
          text: "An account with this email already exists. Please sign in instead.",
          type: "info",
        });
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setApiError({
          text: "Signup succeeded but no user ID was returned. Please try again.",
          type: "error",
        });
        return;
      }

      // ── Step 2: Profile row ───────────────────────────────────────────────
      // PRIMARY PATH: the database trigger handle_new_user() already inserted
      // the profile row the moment auth.users was written — no session needed.
      //
      // FALLBACK PATH: if the trigger isn't installed yet (or email confirm is
      // OFF so a session exists immediately), we try a direct insert here.
      // It uses "on conflict do nothing" so it's safe to run even if the
      // trigger already created the row.
      // ── Step 2: Profile insert (fallback — trigger may already have done this) ──
      // Email confirmation is disabled, so authData.session is always live here.
      // We attempt a direct insert; duplicate key errors are silently ignored
      // because the DB trigger (handle_new_user) may have already created the row.
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id:        userId,
          full_name: form.name.trim(),
          role:      form.role,
          pfi:       0,
        });

      if (profileError && !profileError.message.toLowerCase().includes("duplicate")) {
        setApiError({
          text: normalizeProfileError(profileError.message),
          type: "error",
        });
        return;
      }

      // ── Step 3: Success → toast + role-based redirect ───────────────────
      // Toast fires first; redirect happens after a short delay so the toast
      // is visible before the page unmounts.
      const dashboardUrl = form.role === "employer"
        ? "/dashboard/employer"
        : "/dashboard/freelancer";

      toast.success("Account created! Welcome to Nexus. 🎉", {
        duration: 4000,
        position: "top-center",
        style: { fontWeight: "600" },
      });

      // Small delay so toast appears before navigation
      setTimeout(() => router.push(dashboardUrl), 400);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setApiError(normalizeAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-3))" }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-6 w-6">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.45"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            Create your account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Join Nexus and get started for free
          </p>
        </motion.div>

        {/* Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <form onSubmit={handleSignUp} noValidate className="space-y-4">

              {/* API error banner — type drives the color (error=red, warning=amber, info=blue) */}
              {apiError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}>
                  <Alert
                    type={apiError.type}
                    message={apiError.text}
                    dismissible
                    onClose={() => setApiError(null)}
                    // If it's a "already exists" info message, add a direct login link
                    description={
                      apiError.type === "info"
                        ? undefined  // handled inline below via description slot
                        : undefined
                    }
                  />
                  {/* Extra CTA for duplicate-email case */}
                  {apiError.type === "info" && (
                    <p className="mt-2 text-center text-xs" style={{ color: "var(--text-2)" }}>
                      <Link href="/login" className="font-semibold underline underline-offset-2"
                        style={{ color: "var(--accent)" }}>
                        Go to sign in →
                      </Link>
                    </p>
                  )}
                  {/* Retry hint for rate limit */}
                  {apiError.type === "warning" && (
                    <p className="mt-2 text-xs text-center" style={{ color: "var(--text-3)" }}>
                      Rate limits reset after a few minutes.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Full name */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                <Input
                  label="Full name"
                  name="name"
                  type="text"
                  placeholder="Alex Morgan"
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                  error={fieldErrors.name}
                  required
                  autoComplete="name"
                />
              </motion.div>

              {/* Email */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setField("email", e.target.value)}
                  error={fieldErrors.email}
                  required
                  autoComplete="email"
                />
              </motion.div>

              {/* Password */}
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setField("password", e.target.value)}
                  error={fieldErrors.password}
                  required
                  autoComplete="new-password"
                />
                <PasswordStrength password={form.password} />
              </motion.div>

              {/* Confirm password */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={e => setField("confirmPassword", e.target.value)}
                  error={fieldErrors.confirmPassword}
                  required
                  autoComplete="new-password"
                />
              </motion.div>

              {/* Role selection */}
              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-1)" }}>
                  I want to…
                </p>
                <div className="flex gap-3">
                  <RoleCard
                    value="freelancer"
                    selected={form.role === "freelancer"}
                    onSelect={v => setField("role", v)}
                    title="Find work"
                    subtitle="Freelancer"
                    icon={
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0"
                        style={{ color: "var(--accent)" }}>
                        <path d="M8 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    }
                  />
                  <RoleCard
                    value="employer"
                    selected={form.role === "employer"}
                    onSelect={v => setField("role", v)}
                    title="Hire talent"
                    subtitle="Employer"
                    icon={
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0"
                        style={{ color: "var(--accent)" }}>
                        <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    }
                  />
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="pt-1">
                <div style={{
                  background:   "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  borderRadius: "0.75rem",
                }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full !bg-transparent hover:!bg-transparent"
                  >
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </div>
              </motion.div>

              {/* Terms */}
              <motion.p
                custom={6} variants={fieldVariants} initial="hidden" animate="visible"
                className="text-center text-xs leading-relaxed"
                style={{ color: "var(--text-3)" }}
              >
                By creating an account you agree to our{" "}
                <Link href="#" className="underline underline-offset-2 hover:opacity-70"
                  style={{ color: "var(--text-2)" }}>Terms</Link>{" "}
                &amp;{" "}
                <Link href="#" className="underline underline-offset-2 hover:opacity-70"
                  style={{ color: "var(--text-2)" }}>Privacy Policy</Link>
              </motion.p>

            </form>
          </Card>
        </motion.div>

        {/* Sign-in link */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-2)" }}
        >
          Already have an account?{" "}
          <Link href="/login" className="font-semibold transition-opacity hover:opacity-75"
            style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </motion.p>

      </div>
    </div>
  );
}