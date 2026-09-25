"use client";

import { motion } from "framer-motion";
import { Check, SlidersHorizontal } from "lucide-react";
import { PHOTO_FILTERS, type PhotoFilterId } from "@/lib/photoFilters";

interface FilterPickerProps {
  value: PhotoFilterId;
  onChange: (value: PhotoFilterId) => void;
  disabled?: boolean;
}

export function FilterPicker({ value, onChange, disabled = false }: FilterPickerProps) {
  return (
    <div className="pointer-events-auto w-[min(92vw,620px)] rounded-[24px] border border-white/20 bg-black/55 p-2.5 shadow-2xl backdrop-blur-xl sm:p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80">
          <SlidersHorizontal size={13} strokeWidth={2.3} />
        </span>
        <span className="font-body text-[11px] font-semibold tracking-[0.08em] text-white/70 uppercase sm:text-xs">
          Efek foto
        </span>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
        {PHOTO_FILTERS.map((filter) => {
          const active = value === filter.id;

          return (
            <motion.button
              key={filter.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(filter.id)}
              whileTap={!disabled ? { scale: 0.94 } : undefined}
              className={`group flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-[16px] p-1.5 transition-all sm:w-[74px] ${
                active
                  ? "bg-white/16 ring-1 ring-white/70"
                  : "bg-white/[0.04] hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={`Pilih efek ${filter.label}`}
              aria-pressed={active}
            >
              <span
                className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[13px] border sm:h-12 sm:w-12 ${
                  active ? "border-white" : "border-white/20"
                }`}
                style={{ background: filter.swatch }}
              >
                <span
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,.55) .7px, transparent .7px)",
                    backgroundSize: "4px 4px",
                  }}
                />

                {active && (
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#4A1A1A] shadow-lg">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </span>

              <span className="max-w-full truncate px-0.5 font-body text-[10px] font-medium text-white/85 sm:text-[11px]">
                {filter.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
