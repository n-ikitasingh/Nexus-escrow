"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const variants = {
  hidden:  { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: "easeIn" } },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
