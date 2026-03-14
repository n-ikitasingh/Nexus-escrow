"use client";

import { type ReactNode, type ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { Spinner } from "./Spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
  type?: ComponentPropsWithoutRef<"button">["type"];
  "aria-label"?: string;
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500 disabled:bg-blue-300",
  secondary:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-400 disabled:text-gray-400",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400 disabled:text-gray-400",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8  px-3  text-xs  gap-1.5 rounded-lg",
  md: "h-10 px-4  text-sm  gap-2   rounded-xl",
  lg: "h-12 px-5  text-base gap-2.5 rounded-xl",
};

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary:   "#ffffff",
  secondary: "#6b7280",
  ghost:     "#6b7280",
  danger:    "#ffffff",
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
 * Button — animated with Framer Motion.
 *
 * Animations:
 * - Hover   → lifts 1 px + subtle brightness boost
 * - Tap     → presses down (scale 0.96, y +1) for a tactile click feel
 * - Loading → spinner fades in over the label; label fades to 0 opacity
 *             (width is held so the button doesn't jump)
 * - Icons   → slide-in from the side on mount
 *
 * @example
 * <Button variant="primary">Save changes</Button>
 * <Button variant="danger" loading={isDeleting}>Delete</Button>
 * <Button variant="secondary" leftIcon={<PlusIcon />}>Add item</Button>
 */
export function Button({
  children,
  variant  = "primary",
  size     = "md",
  loading  = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      layout
      type={type}
      aria-label={ariaLabel}
      whileHover={isDisabled ? {} : { y: -1, filter: "brightness(1.06)" }}
      whileTap={isDisabled   ? {} : { scale: 0.96, y: 1, filter: "brightness(0.97)" }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      disabled={isDisabled}
      onClick={onClick}
      style={style}
      className={cn(
        "relative inline-flex items-center justify-center font-medium select-none outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        "transition-colors duration-150",
        "disabled:cursor-not-allowed",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
    >
      {/* Spinner overlay */}
      {loading && (
        <motion.span
          key="spinner"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Spinner size={size === "lg" ? "md" : "sm"} color={SPINNER_COLOR[variant]} />
        </motion.span>
      )}

      {/* Label row — hidden while loading but keeps the button width */}
      <motion.span
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center justify-center"
        style={{ gap: "inherit" }}
      >
        {leftIcon && (
          <motion.span
            aria-hidden="true"
            initial={{ x: -3, opacity: 0 }}
            animate={{ x: 0,  opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.span>
        )}

        {children}

        {rightIcon && (
          <motion.span
            aria-hidden="true"
            initial={{ x: 3,  opacity: 0 }}
            animate={{ x: 0,  opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </motion.span>
    </motion.button>
  );
}

export default Button;