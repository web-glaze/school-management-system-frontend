/**
 * Shared gradient hero used at the top of every section page.
 * Forces one consistent text scale across the app:
 *   eyebrow   → text-[11px] uppercase tracking-[0.25em]
 *   title     → text-2xl font-bold
 *   subtitle  → text-sm
 *
 * Don't redefine these sizes per page — they're set here so the dashboard,
 * /maintenance, /maintenance/tickets, /my-complaints, etc. all look like
 * the same product. Add a slot via `right={...}` for buttons / badges.
 */

import { ReactNode } from "react";

interface PageHeroProps {
  /** Tiny ALLCAPS label above the title — e.g. "ECOLE ERP". */
  eyebrow?: string;
  /** Main heading shown in the hero. */
  title: string;
  /** Optional one-line description below the title. */
  subtitle?: ReactNode;
  /** Optional right-aligned slot (e.g. status pill, primary action). */
  right?: ReactNode;
  /** Extra footer slot (status chips, role badges). */
  footer?: ReactNode;
}

export function PageHero({
  eyebrow = "ECOLE ERP",
  title,
  subtitle,
  right,
  footer,
}: PageHeroProps) {
  return (
    <div className="bg-[#00AEF2] bg-gradient-to-r from-[#0096D6] via-[#00AEF2] to-[#3CC8FA] rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="uppercase tracking-[0.25em] text-[11px] text-white/80">
              {eyebrow}
            </p>
          )}

          <h1 className="text-2xl font-bold mt-2">{title}</h1>

          {subtitle && (
            <p className="text-sm text-white/90 mt-1.5 max-w-2xl">
              {subtitle}
            </p>
          )}

          {footer && <div className="mt-3">{footer}</div>}
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}
