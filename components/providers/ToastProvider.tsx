"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, 0 = persistent
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" />
    </svg>
  ),
};

const STYLES: Record<ToastType, { wrap: string; icon: string }> = {
  success: { wrap: "border-emerald-200 dark:border-emerald-800",  icon: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950" },
  error:   { wrap: "border-red-200 dark:border-red-800",          icon: "text-red-500 bg-red-50 dark:bg-red-950" },
  warning: { wrap: "border-amber-200 dark:border-amber-800",      icon: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  info:    { wrap: "border-blue-200 dark:border-blue-800",        icon: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
};

// ---------------------------------------------------------------------------
// Single Toast item
// ---------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const s = STYLES[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss
  const duration = toast.duration ?? 4500;
  if (duration > 0 && timerRef.current === null) {
    timerRef.current = setTimeout(onDismiss, duration);
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1,    transition: { type: "spring", stiffness: 400, damping: 30 } }}
      exit={{    opacity: 0, x: 60, scale: 0.95,  transition: { duration: 0.18, ease: "easeIn" } }}
      role="alert"
      aria-live="polite"
      className={[
        "pointer-events-auto flex items-start gap-3 w-80 max-w-full",
        "rounded-xl border px-4 py-3 shadow-lg shadow-black/5",
        "bg-surface",
        s.wrap,
      ].join(" ")}
    >
      {/* Icon */}
      <span className={["mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", s.icon].join(" ")}>
        {ICONS[toast.type]}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium text-primary leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-secondary leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* Dismiss */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted hover:text-secondary transition-colors"
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="h-3 w-3">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </motion.button>
    </motion.li>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}

      {/* Portal-like fixed container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
