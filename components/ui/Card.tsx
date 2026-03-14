"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

export interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  className?: string;
  entrance?: "fade" | "slide-up" | "scale";
}

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

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ children, title, footer, className, entrance = "slide-up" }: CardProps) {
  return (
    <motion.div
      variants={ENTRANCE[entrance]}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.13)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "flex flex-col bg-white dark:bg-gray-900",
        "rounded-2xl shadow-sm",
        "ring-1 ring-black/5 dark:ring-white/10",
        "will-change-transform",
        className
      )}
    >
      {title !== undefined && (
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          {typeof title === "string"
            ? <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">{title}</h2>
            : title}
        </div>
      )}
      <div className="flex-1 px-6 py-5">{children}</div>
      {footer !== undefined && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 rounded-b-2xl">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

export default Card;