"use client";

import { motion } from "framer-motion";
import { Check, SlidersHorizontal } from "lucide-react";
import { PHOTO_FILTERS, type PhotoFilterId } from "@/lib/photoFilters";

interface FilterPickerProps {
  value: PhotoFilterId;
  onChange: (value: PhotoFilterId) => void;
  disabled?: boolean;
}

export function FilterPicker({
  value,
  onChange,
  disabled = false,
}: FilterPickerProps) {
  return (
    <div
      className="filter-toolbar pointer-events-auto min-w-0 flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-black/28 px-2 py-2 shadow-xl backdrop-blur-xl sm:rounded-[22px] sm:px-2.5"
      aria-label="Pilih efek foto"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 sm:h-9 sm:w-9">
          <SlidersHorizontal size={14} strokeWidth={2.3} />
        </span>

        <div
          className="filter-toolbar-scroll no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-contain scroll-smooth pb-0.5 sm:gap-2"
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
                className={`group flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-[13px] px-0.5 py-1 transition-all sm:w-[58px] ${
                  active
                    ? "bg-white/[0.14]"
                    : "hover:bg-white/[0.07]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label={`Pilih efek ${filter.label}`}
                aria-pressed={active}
              >
                <span
                  className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[11px] border shadow-md transition-all sm:h-10 sm:w-10 ${
                    active
                      ? "scale-[1.06] border-white shadow-[0_0_0_2px_rgba(255,255,255,.13),0_7px_18px_rgba(0,0,0,.25)]"
                      : "border-white/15"
                  }`}
                  style={{ background: filter.swatch }}
                >
                  <span
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(255,255,255,.55) .7px, transparent .7px)",
                      backgroundSize: "4px 4px",
                    }}
                  />

                  {filter.icon && (
                    <span className="relative z-10 text-[16px] drop-shadow-md">
                      {filter.icon}
                    </span>
                  )}

                  {active && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0.5 top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#4A1A1A] shadow-lg"
                    >
                      <Check size={9} strokeWidth={3.2} />
                    </motion.span>
                  )}
                </span>

                <span className="max-w-full truncate font-body text-[8px] font-semibold text-white/80 sm:text-[9px]">
                  {filter.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
