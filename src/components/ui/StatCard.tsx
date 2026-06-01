/**
 * Standardised stat tile used in every "summary" row across the app.
 * One font scale, one card layout — pages stop reinventing this and
 * the dashboard / tickets list / maintenance overview all look identical.
 *
 *   label  → text-xs uppercase tracking-wider (muted)
 *   value  → text-2xl font-bold
 *   icon   → optional, slotted top-right in a tinted square
 */

import { Loader2, LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  /** Tailwind classes for the icon background + text colour. */
  tone?: string;
  /** Show a spinner instead of the value while the data is loading. */
  loading?: boolean;
  /** Optional click handler — turns the card into a button. */
  onClick?: () => void;
  /** Marks the card as visually "active" (clicked / selected). */
  active?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "text-blue-600 bg-blue-50",
  loading,
  onClick,
  active,
}: StatCardProps) {
  const interactive = typeof onClick === "function";

  const cls = [
    "bg-white rounded-2xl p-5 border shadow-sm transition-all",
    interactive
      ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      : "",
    active ? "border-primary/30 ring-1 ring-primary/15" : "border-gray-100",
  ].join(" ");

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <span
            className={`size-8 rounded-lg flex items-center justify-center ${tone}`}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-3">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-gray-400" />
        ) : (
          value
        )}
      </p>
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={cls + " text-left w-full"}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
