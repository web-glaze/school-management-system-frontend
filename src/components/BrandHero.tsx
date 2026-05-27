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
   * logo color so each page has its own identity.
   */
  accent?:
    | "default"
    | "action"
    | "green"
    | "gold"
    | "rose"
    | "cyan";
}

/**
 * BrandHero — unified RESPONSIVE hero banner across all pages.
 *
 * Mobile-first design:
 * - sm  : 640px (small tablets)
 * - md  : 768px
 * - lg  : 1024px (desktop)
 *
 * Text + padding scale up with screen size for optimal readability.
 */
export default function BrandHero({
  kicker,
  title,
  subtitle,
  action,
  accent = "default",
}: BrandHeroProps) {
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
      className={`
        relative overflow-hidden rounded-2xl
        ${heroClass}
        p-4 sm:p-5 lg:p-6
        text-white shadow-lg
      `}
    >
      {/* Decorative blobs — smaller on mobile */}
      <div
        className={`
          absolute -top-20 sm:-top-32 -right-20 sm:-right-32
          w-56 sm:w-80 lg:w-96 h-56 sm:h-80 lg:h-96
          ${blob.primary} rounded-full blur-3xl pointer-events-none
        `}
      />
      <div
        className={`
          absolute -bottom-20 sm:-bottom-32 -left-20 sm:-left-32
          w-56 sm:w-80 lg:w-96 h-56 sm:h-80 lg:h-96
          ${blob.secondary} rounded-full blur-3xl pointer-events-none
        `}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-6">
        <div className="min-w-0">
          {kicker && (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/25 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 dot-glow text-emerald-300" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {kicker}
              </span>
            </span>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight mt-2 text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 sm:mt-1.5 text-xs text-white/80 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex gap-2 sm:gap-3 flex-wrap">{action}</div>
        )}
      </div>
    </section>
  );
}
