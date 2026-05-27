"use client";

import { ReactNode } from "react";

interface BrandHeroProps {
  /** Small uppercase label above the title */
  kicker?: string;
  /** Main heading */
  title: string;
  /** Description text */
  subtitle?: string;
  /** Optional right-side action (button group, etc.) */
  action?: ReactNode;
  /**
   * Accent variant — picks which logo color blends into the dark indigo base.
   * Each variant is DARK (high contrast white text) but ends with a different
   * logo color so each page has its own identity while staying brand-consistent.
   */
  accent?:
    | "default" // indigo → violet (primary)
    | "action" // indigo → orange (action / urgency)
    | "green" // indigo → emerald (growth / technicians)
    | "gold" // indigo → amber (locations / waiting)
    | "rose" // indigo → rose (users / people)
    | "cyan"; // indigo → cyan (departments / orgs)
}

/**
 * BrandHero — unified hero banner across all pages.
 *
 * Dark navy/indigo base with per-page accent color blended in.
 * White text on dark background = guaranteed high contrast.
 */
export default function BrandHero({
  kicker,
  title,
  subtitle,
  action,
  accent = "default",
}: BrandHeroProps) {
  // Each accent: DARK gradient ending in a logo color. White text stays readable.
  const gradients: Record<string, string> = {
    default:
      "bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700",
    action:
      "bg-gradient-to-br from-indigo-950 via-violet-800 to-orange-700",
    green:
      "bg-gradient-to-br from-indigo-950 via-emerald-800 to-emerald-600",
    gold:
      "bg-gradient-to-br from-indigo-950 via-violet-800 to-amber-700",
    rose:
      "bg-gradient-to-br from-indigo-950 via-violet-800 to-rose-700",
    cyan:
      "bg-gradient-to-br from-indigo-950 via-violet-800 to-cyan-700",
  };

  // Decorative blob colors per accent — 2 logo colors blend in subtly
  const blobs: Record<string, { primary: string; secondary: string }> = {
    default: { primary: "bg-orange-400/25", secondary: "bg-emerald-400/20" },
    action: { primary: "bg-orange-400/35", secondary: "bg-amber-400/25" },
    green: { primary: "bg-emerald-400/35", secondary: "bg-cyan-400/20" },
    gold: { primary: "bg-amber-400/35", secondary: "bg-orange-400/25" },
    rose: { primary: "bg-rose-400/30", secondary: "bg-orange-400/20" },
    cyan: { primary: "bg-cyan-400/30", secondary: "bg-indigo-400/25" },
  };

  const heroClass = gradients[accent] ?? gradients.default;
  const blob = blobs[accent] ?? blobs.default;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl ${heroClass} p-10 text-white shadow-2xl`}
    >
      {/* Decorative blobs in logo accent colors */}
      <div
        className={`absolute -top-32 -right-32 w-96 h-96 ${blob.primary} rounded-full blur-3xl`}
      />
      <div
        className={`absolute -bottom-32 -left-32 w-96 h-96 ${blob.secondary} rounded-full blur-3xl`}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          {kicker && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-semibold uppercase tracking-wider text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 dot-glow text-emerald-300" />
              {kicker}
            </span>
          )}
          <h1 className="text-5xl font-extrabold tracking-tight mt-4 text-white drop-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-lg text-white/85 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex gap-3 flex-wrap">{action}</div>}
      </div>
    </section>
  );
}
