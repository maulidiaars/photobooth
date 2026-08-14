import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  bg?: "cream" | "pink" | "purple" | "mint" | "yellow" | "garnet" | "forest";
  inset?: boolean;
  /** Layers the same fine paper-grain used on the landing/login pages
   *  on top of the card so admin surfaces read as printed paper too,
   *  not a flat colour fill. Uses `.bg-texture` (see globals.css),
   *  which needs its own stacking context — content is bumped to
   *  `relative z-10` so it still sits above the grain layer. */
  texture?: boolean;
}

const bgClasses: Record<NonNullable<ClayCardProps["bg"]>, string> = {
  cream: "bg-clay-gradient",
  pink: "bg-pink-gradient",
  purple: "bg-purple-gradient",
  mint: "bg-mint-gradient",
  yellow: "bg-yellow-gradient",
  garnet: "bg-garnet-gradient text-paper-light",
  forest: "bg-forest-gradient text-paper-light",
};

export function ClayCard({
  children,
  className,
  bg = "cream",
  inset = false,
  texture = false,
  ...props
}: ClayCardProps) {
  return (
    <div
      className={clsx(
        "rounded-clay-lg p-6",
        inset ? "shadow-clay-inset" : "shadow-clay",
        bgClasses[bg],
        texture && "bg-texture",
        className
      )}
      {...props}
    >
      {texture ? <div className="relative z-10">{children}</div> : children}
    </div>
  );
}