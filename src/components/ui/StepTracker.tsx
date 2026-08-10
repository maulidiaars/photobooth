"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

const STEPS = ["Pilih Frame", "Sesi Foto", "Hasil"];

interface StepTrackerProps {
  current: 1 | 2 | 3;
}

/**
 * A three-step tracker styled like a strip of film: sprocket-hole dots
 * connected by a perforation line, with the active frame highlighted in
 * garnet. Numbering is meaningful here — this really is a fixed,
 * linear 3-step process — so it earns the "01 / 02 / 03" treatment.
 */
export function StepTracker({ current }: StepTrackerProps) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-semibold transition-colors",
                  active && "bg-garnet-gradient text-paper-light shadow-clay-sm",
                  done && "bg-garnet/15 text-garnet",
                  !active && !done && "bg-ink/5 text-muted"
                )}
              >
                {done ? <Check size={16} strokeWidth={3} /> : step}
              </div>
              <span
                className={clsx(
                  "font-hand text-lg leading-none",
                  active ? "text-garnet" : "text-muted"
                )}
              >
                {label}
              </span>
            </div>
            {step !== 3 && (
              <div
                className={clsx(
                  "mx-2 mt-[-20px] h-px flex-1 border-t-2 border-dotted transition-colors",
                  done ? "border-garnet/50" : "border-ink/15"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
