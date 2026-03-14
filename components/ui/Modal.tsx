"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Prevent closing on backdrop click / Escape. @default false */
  persistent?: boolean;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, transition: { duration: 0.2,  ease: "easeIn"  } },
};

const panelVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28, mass: 0.8 },
  },
  exit: {
    opacity: 0, scale: 0.96, y: 12,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
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
 * Modal — animated with Framer Motion.
 *
 * Animations:
 * - Backdrop → smooth fade in/out
 * - Panel    → spring-based scale + slide-up on enter, quick fade-scale on exit
 *
 * @example
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  persistent = false,
}: ModalProps) {
  // Guard against SSR — createPortal needs document to exist.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => panelRef.current?.focus());
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !persistent) { e.stopPropagation(); onClose(); return; }
    if (e.key === "Tab" && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus(); } }
    }
  }, [onClose, persistent]);

  const titleId = title ? "modal-title" : undefined;

  // Don't render portal during SSR
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            aria-hidden="true"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => !persistent && onClose()}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Centering wrapper */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => !persistent && onClose()}
          >
            {/* Panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative flex flex-col w-full max-w-lg max-h-[90vh]",
                "bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 outline-none",
                className
              )}
            >
              {/* Header */}
              {title !== undefined && (
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                  <h2 id={titleId} className="text-base font-semibold text-gray-900 leading-snug pr-4">
                    {title}
                  </h2>
                  <motion.button
                    type="button"
                    aria-label="Close modal"
                    whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onClose}
                    className={cn(
                      "ml-auto -mr-1 flex items-center justify-center h-8 w-8 rounded-lg",
                      "text-gray-400 hover:text-gray-600 transition-colors duration-150",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    )}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                      strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
                      <path d="M3 3l10 10M13 3L3 13" />
                    </svg>
                  </motion.button>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

              {/* Footer */}
              {footer !== undefined && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;