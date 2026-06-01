/**
 * Lightweight section-level header used above tables, lists and forms.
 *   title    → text-sm font-bold
 *   subtitle → text-xs text-muted
 *   right    → optional slot (buttons, "view all" links, filters)
 *
 * Keeps every page's section headings at the same scale instead of one
 * page using h2 text-3xl and another using h3 text-base.
 */

import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  right,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 " + (className ?? "")
      }
    >
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
