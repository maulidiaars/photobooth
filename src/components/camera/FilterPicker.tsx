"use client";

import { motion } from "framer-motion";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  PHOTO_FILTERS,
  type PhotoFilterId,
} from "@/lib/photoFilters";

interface FilterPickerProps {
  value: PhotoFilterId;
  onChange: (value: PhotoFilterId) => void;
  disabled?: boolean;
}

/**
 * Vertical filter rail for the camera page.
 *
 * It intentionally lives on the RIGHT side of the camera preview,
 * so it never competes with the shutter button at the bottom.
 *
 * The list scrolls vertically with smooth native touch/mouse scrolling.
 */
export function FilterPicker({
  value,
  onChange,
  disabled = false,
}: FilterPickerProps) {
  return (
    <aside
      id="photo-filter-picker"
      aria-label="Pilih efek foto"
      className="pointer-events-auto flex h-[min(76%,430px)] w-[76px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/15 bg-black/48 p-2 shadow-2xl backdrop-blur-xl sm:h-[min(78%,500px)] sm:w-[86px] sm:p-2.5 lg:w-[92px]"
    >
      <div className="mb-1.5 flex shrink-0 items-center justify-center text-white/65 sm:mb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <SlidersHorizontal
            size={13}
            strokeWidth={2.2}
          />
        </span>
      </div>

      <div
        className="filter-rail-scroll no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overscroll-contain scroll-smooth py-0.5 sm:gap-2.5"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {PHOTO_FILTERS.map((filter) => {
          const active = value === filter.id;

          return (
            <motion.button
              key={filter.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(filter.id)}
              whileTap={!disabled ? { scale: 0.92 } : undefined}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 24,
              }}
              className={`group flex w-full shrink-0 flex-col items-center gap-1 rounded-[16px] px-1 py-1.5 transition-all ${
                active
                  ? "bg-white/[0.14]"
                  : "hover:bg-white/[0.07]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={`Pilih efek ${filter.label}`}
              aria-pressed={active}
            >
              <span
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border shadow-lg transition-all sm:h-12 sm:w-12 ${
                  active
                    ? "scale-[1.04] border-white shadow-[0_0_0_2px_rgba(255,255,255,0.16),0_8px_20px_rgba(0,0,0,0.28)]"
                    : "border-white/15"
                }`}
                style={{
                  background: filter.swatch,
                }}
              >
                <span
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,.55) .7px, transparent .7px)",
                    backgroundSize: "4px 4px",
                  }}
                />

                {active && (
                  <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#4A1A1A] shadow-lg"
                  >
                    <Check
                      size={12}
                      strokeWidth={3}
                    />
                  </motion.span>
                )}
              </span>

              <span className="max-w-full truncate px-0.5 font-body text-[9px] font-semibold text-white/80 sm:text-[10px]">
                {filter.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
}
