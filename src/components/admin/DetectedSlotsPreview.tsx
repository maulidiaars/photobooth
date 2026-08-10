"use client";

import type { SlotRect } from "@/lib/frameSlotDetector";

interface DetectedSlotsPreviewProps {
  imageUrl: string;
  slots: SlotRect[];
}

export function DetectedSlotsPreview({ imageUrl, slots }: DetectedSlotsPreviewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-clay bg-[repeating-conic-gradient(#eee_0%_25%,#fff_0%_50%)] bg-[length:20px_20px] shadow-clay-inset">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Preview frame" className="block w-full h-auto" />
      {slots.map((s, i) => (
        <div
          key={i}
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: `${s.w * 100}%`,
            height: `${s.h * 100}%`,
          }}
          className="absolute flex items-center justify-center border-2 border-clay-pinkDark bg-clay-pink/30"
        >
          <span className="rounded-full bg-clay-pinkDark px-2 py-0.5 text-xs font-heading text-white shadow-clay-sm">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
