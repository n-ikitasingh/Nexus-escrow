"use client";

import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertProps {
  type: AlertType;
  message: string;
  description?: string;
  dismissible?: boolean;
  onClose?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Theme map
// ---------------------------------------------------------------------------

interface AlertTheme {
  root: string;
  icon: string;
  title: string;
  description: string;
  dismiss: string;
  label: string;
  svg: ReactNode;
}

const THEMES: Record<AlertType, AlertTheme> = {
  success: {
    root:        "bg-emerald-50 border border-emerald-200",
    icon:        "text-emerald-500 bg-emerald-100",
    title:       "text-emerald-900",
    description: "text-emerald-700",
    dismiss:     "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 focus-visible:ring-emerald-500",
    label:       "Success",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path fillRule="evenodd" clipRule="evenodd"
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
      </svg>
    ),
  },
  error: {
    root:        "bg-red-50 border border-red-200",
    icon:        "text-red-500 bg-red-100",
    title:       "text-red-900",
    description: "text-red-700",
    dismiss:     "text-red-400 hover:text-red-600 hover:bg-red-100 focus-visible:ring-red-500",
    label:       "Error",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path fillRule="evenodd" clipRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" />
      </svg>
    ),
  },
  warning: {
    root:        "bg-amber-50 border border-amber-200",
    icon:        "text-amber-500 bg-amber-100",
    title:       "text-amber-900",
    description: "text-amber-700",
    dismiss:     "text-amber-400 hover:text-amber-600 hover:bg-amber-100 focus-visible:ring-amber-500",
    label:       "Warning",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path fillRule="evenodd" clipRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    ),
  },
  info: {
    root:        "bg-blue-50 border border-blue-200",
    icon:        "text-blue-500 bg-blue-100",
    title:       "text-blue-900",
    description: "text-blue-700",
    dismiss:     "text-blue-400 hover:text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-500",
    label:       "Info",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path fillRule="evenodd" clipRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" />
      </svg>
    ),
  },
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const alertVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
  exit: {
    opacity: 0, scale: 0.97, y: -6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// Error gets an extra horizontal shake on mount
const shakeVariants: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: {
    opacity: 1, x: 0,
    transition: {
      x: { type: "spring", stiffness: 600, damping: 10, velocity: 20 },
      opacity: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0, x: 8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Alert — animated with Framer Motion.
 *
 * Animations:
 * - Mount   → spring slide-down + fade (error gets a horizontal shake)
 * - Dismiss → fade + scale-up out via AnimatePresence
 * - Icon    → subtle scale bounce on mount
 * - Dismiss button → scale on hover/tap
 *
 * @example
 * <Alert type="success" message="Saved!" dismissible onClose={clear} />
 * <Alert type="error" message="Auth failed." description="Please try again." dismissible />
 */
export function Alert({
  type,
  message,
  description,
  dismissible = false,
  onClose,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const theme    = THEMES[type];
  const variants = type === "error" ? shakeVariants : alertVariants;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          aria-live={type === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          className={cn(
            "relative flex items-start gap-3 rounded-xl px-4 py-3.5",
            theme.root,
            className
          )}
        >
          {/* Icon badge — bounces in */}
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.08 }}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              theme.icon
            )}
          >
            {theme.svg}
          </motion.span>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn("text-sm font-medium leading-snug", theme.title)}>
              {message}
            </p>
            {description && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25, delay: 0.12 }}
                className={cn("mt-1 text-sm leading-relaxed overflow-hidden", theme.description)}
              >
                {description}
              </motion.p>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <motion.button
              type="button"
              aria-label={`Dismiss ${theme.label.toLowerCase()} alert`}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={handleDismiss}
              className={cn(
                "ml-auto -mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                "transition-colors duration-150",
                theme.dismiss
              )}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Alert;