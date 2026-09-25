"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Check, SlidersHorizontal } from "lucide-react";
import { PHOTO_FILTERS, type PhotoFilterId } from "@/lib/photoFilters";

interface FilterPickerProps {
  value: PhotoFilterId;
  onChange: (value: PhotoFilterId) => void;
  disabled?: boolean;
}

/**
 * Minimum pointer movement before a mouse interaction
 * is considered a drag instead of a click.
 */
const DRAG_THRESHOLD = 6;

export function FilterPicker({
  value,
  onChange,
  disabled = false,
}: FilterPickerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const dragState = useRef({
    active: false,
    dragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse" || disabled) return;

      const el = scrollRef.current;
      if (!el) return;

      dragState.current = {
        active: true,
        dragging: false,
        startX: e.clientX,
        startScrollLeft: el.scrollLeft,
      };

      el.setPointerCapture(e.pointerId);
    },
    [disabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      const el = scrollRef.current;

      if (!state.active || !el) return;

      const delta = e.clientX - state.startX;

      if (!state.dragging) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;

        state.dragging = true;
        el.classList.add("cursor-grabbing");
      }

      e.preventDefault();

      el.scrollLeft = state.startScrollLeft - delta;
    },
    []
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      const el = scrollRef.current;

      if (el) {
        el.classList.remove("cursor-grabbing");

        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      }

      state.active = false;
    },
    []
  );

  const handleFilterClick = useCallback(
    (id: PhotoFilterId) => {
      if (disabled) return;

      if (dragState.current.dragging) {
        dragState.current.dragging = false;
        return;
      }

      /*
       * This is the important part:
       *
       * Selecting an effect immediately updates the parent state.
       * The parent passes the new filter to WebcamView,
       * so the live camera changes immediately.
       */
      onChange(id);
    },
    [disabled, onChange]
  );

  return (
    <div
      className="filter-toolbar pointer-events-auto min-w-0 flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-black/28 px-2 py-2 shadow-xl backdrop-blur-xl sm:rounded-[22px] sm:px-2.5"
      aria-label="Pilih efek foto"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 sm:h-9 sm:w-9">
          <SlidersHorizontal
            size={14}
            strokeWidth={2.3}
          />
        </span>

        <div
          ref={scrollRef}
          className="filter-toolbar-scroll no-scrollbar flex min-w-0 flex-1 cursor-grab gap-1.5 overflow-x-auto overscroll-contain scroll-smooth pb-0.5 select-none sm:gap-2"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {PHOTO_FILTERS.map((filter) => {
            const active = value === filter.id;

            return (
              <motion.button
                key={filter.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  handleFilterClick(filter.id)
                }
                whileTap={
                  !disabled
                    ? { scale: 0.92 }
                    : undefined
                }
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
                      className="absolute right-0.5 top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#4A1A1A] shadow-lg"
                    >
                      <Check
                        size={9}
                        strokeWidth={3.2}
                      />
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
