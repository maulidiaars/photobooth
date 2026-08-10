import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  bg?: "cream" | "pink" | "purple" | "mint" | "yellow" | "garnet" | "forest";
  inset?: boolean;
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
  ...props
}: ClayCardProps) {
  return (
    <div
      className={clsx(
        "rounded-clay-lg p-6",
        inset ? "shadow-clay-inset" : "shadow-clay",
        bgClasses[bg],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
