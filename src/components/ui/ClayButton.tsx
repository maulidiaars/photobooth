"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

type Variant = "pink" | "purple" | "mint" | "yellow" | "garnet" | "forest" | "ghost";
type Size = "sm" | "md" | "lg";

interface ClayButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  pink: "bg-pink-gradient text-ink",
  purple: "bg-purple-gradient text-ink",
  mint: "bg-mint-gradient text-ink",
  yellow: "bg-yellow-gradient text-ink",
  garnet: "bg-garnet-gradient text-paper-light",
  forest: "bg-forest-gradient text-paper-light",
  ghost: "bg-cream-light text-ink",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-6 py-3 text-sm rounded-clay-sm",
  md: "px-8 py-3.5 text-base rounded-clay",
  lg: "px-11 py-5 text-lg rounded-clay-lg",
};

export function ClayButton({
  variant = "pink",
  size = "md",
  children,
  className,
  fullWidth,
  ...props
}: ClayButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.012 }}
      whileTap={{ y: 1, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={clsx(
        "relative font-display font-semibold tracking-tight select-none transition-shadow",
        "shadow-clay hover:shadow-clay-lg active:shadow-clay-pressed",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
