import { useState } from "react";

/**
 * PillList
 * Renders a list of names (e.g. sections, subjects) as compact badges.
 * Shows up to `max` pills inline; the rest collapse into a tappable
 * "+N more" pill that expands in place (works on mobile too, unlike a
 * hover-only tooltip) and can be collapsed again with "Show less".
 *
 * Props:
 * - items: string[]      list of names to display
 * - max: number           how many pills to show before collapsing (default 3)
 * - variant: "light" | "primary"   color style of the pills (default "light")
 */
export default function PillList({ items, max = 3, variant = "light" }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const variantClass =
    variant === "primary"
      ? "bg-primary-subtle text-primary-emphasis border-primary-subtle"
      : "bg-light text-dark border-secondary-subtle";

  const visible = expanded ? items : items.slice(0, max);
  const hiddenCount = items.length - visible.length;

  return (
    <div className="d-flex flex-wrap align-items-center gap-1">
      {visible.map((name, idx) => (
        <span
          key={idx}
          className={`badge rounded-1 border fw-normal ${variantClass}`}
          style={{ fontSize: "0.75rem" }}
        >
          {name}
        </span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="badge rounded-1 border bg-white text-primary fw-normal"
          style={{ fontSize: "0.75rem", cursor: "pointer" }}
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && items.length > max && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="badge rounded-1 border bg-white text-muted fw-normal"
          style={{ fontSize: "0.75rem", cursor: "pointer" }}
        >
          Show less
        </button>
      )}
    </div>
  );
}
