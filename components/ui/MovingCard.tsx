"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /**
   * Enables a subtle 3-D tilt on mouse move.
   * @default true
   */
  tilt?: boolean;
  /**
   * Entrance animation variant.
   * - "fade"     — simple opacity fade-in
   * - "slide-up" — fade + translate from below  (default)
   * - "scale"    — fade + scale from 95%
   */
  entrance?: "fade" | "slide-up" | "scale";
}

// ---------------------------------------------------------------------------
// Entrance variants
// ---------------------------------------------------------------------------

const ENTRANCE: Record<"fade" | "slide-up" | "scale", Variants> = {
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  },
  "slide-up": {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  },
  scale: {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
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
 * Card — animated with Framer Motion.
 *
 * Animations:
 * - Mount  → configurable entrance (fade / slide-up / scale)
 * - Hover  → lifts 4 px + deeper shadow
 * - Mouse  → optional 3-D tilt following cursor
 *
 * @example
 * <Card title="Revenue" entrance="scale" tilt>
 *   <RevenueChart />
 * </Card>
 */
export function Card({
  children,
  title,
  footer,
  className,
  tilt = true,
  entrance = "slide-up",
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 150, damping: 22, mass: 0.6 };
  // Positive mouseX → tilt right (rotateY positive), positive mouseY → tilt down (rotateX negative)
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), spring);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), spring);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onMouseLeave = () => { rawX.set(0); rawY.set(0); };

  return (
    <motion.div
      ref={ref}
      variants={ENTRANCE[entrance]}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.13)" }}
      style={tilt ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-black/5 will-change-transform",
        className
      )}
    >
      {title !== undefined && (
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          {typeof title === "string"
            ? <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>
            : title}
        </div>
      )}

      <div className="flex-1 px-6 py-5">{children}</div>

      {footer !== undefined && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

export default Card;