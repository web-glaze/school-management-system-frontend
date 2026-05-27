"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  /** Small kicker label above the title */
  kicker?: string;
  /** Main heading */
  title: string;
  /** Description text below title */
  subtitle?: string;
  /** Optional right-side actions */
  action?: ReactNode;
  /**
   * Small accent dot color (just a hint of brand identity).
   * Default: indigo. Pick from logo palette.
   */
  accent?: "indigo" | "orange" | "green" | "gold" | "rose" | "cyan";
}

/**
 * PageHeader — compact, clean section header for sub-pages.
 *
 * Minimal text-only header with small accent dot for brand identity.
 * Smaller text sizes so it doesn't dominate the page.
 */
export default function PageHeader({
  kicker,
  title,
  subtitle,
  action,
  accent = "indigo",
}: PageHeaderProps) {
  const dotColor: Record<string, string> = {
    indigo: "bg-indigo-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    gold: "bg-amber-500",
    rose: "bg-rose-500",
    cyan: "bg-cyan-500",
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100">
      <div className="min-w-0">
        {kicker && (
          <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dotColor[accent] ?? dotColor.indigo}`}
            />
            {kicker}
          </span>
        )}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900 mt-1 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex gap-2 flex-wrap flex-shrink-0">{action}</div>
      )}
    </header>
  );
}
