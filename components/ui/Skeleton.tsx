"use client";

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Base shimmer pulse
// ---------------------------------------------------------------------------

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-[rgb(var(--surface-2))]",
        className,
      ].join(" ")}
    />
  );
}

// ---------------------------------------------------------------------------
// Avatar skeleton
// ---------------------------------------------------------------------------

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  return <Shimmer className={`${s} !rounded-full shrink-0`} />;
}

// ---------------------------------------------------------------------------
// Text skeleton (FIXED: removed style prop, using plain div)
// ---------------------------------------------------------------------------

export function SkeletonText({
  lines = 1,
  lastLineWidth = "75%",
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded-md bg-[rgb(var(--surface-2))]"
          style={{ width: i === lines - 1 && lines > 1 ? lastLineWidth : "100%" }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card skeleton
// ---------------------------------------------------------------------------

export function SkeletonCard({ hasHeader = true }: { hasHeader?: boolean }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[rgb(var(--border))] bg-surface p-5 gap-4">
      {hasHeader && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="flex-1">
            <SkeletonText lines={2} lastLineWidth="60%" />
          </div>
        </div>
      )}
      <SkeletonText lines={3} lastLineWidth="50%" />
      <Shimmer className="h-24 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card skeleton
// ---------------------------------------------------------------------------

export function SkeletonStatCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-[rgb(var(--border))] bg-surface p-5 gap-3">
      <Shimmer className="h-3.5 w-24" />
      <Shimmer className="h-8 w-32" />
      <Shimmer className="h-3 w-20" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table row skeleton
// ---------------------------------------------------------------------------

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border))]">
      <SkeletonAvatar size="sm" />
      <Shimmer className="h-3.5 flex-1" />
      <Shimmer className="h-3.5 w-24" />
      <Shimmer className="h-3.5 w-16" />
      <Shimmer className="h-6 w-16 rounded-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// List of skeletons
// ---------------------------------------------------------------------------

export function SkeletonList({
  count = 4,
  variant = "card",
}: {
  count?: number;
  variant?: "card" | "stat" | "row";
}) {
  const Component =
    variant === "stat" ? SkeletonStatCard
    : variant === "row" ? SkeletonTableRow
    : SkeletonCard;

  return (
    <div className={variant === "row" ? "flex flex-col" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}