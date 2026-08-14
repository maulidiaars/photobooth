"use client";

import type { SlotRect } from "@/lib/frameSlotDetector";

interface DetectedSlotsPreviewProps {
  imageUrl: string;
  slots: SlotRect[];
}

export function DetectedSlotsPreview({ imageUrl, slots }: DetectedSlotsPreviewProps) {
  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-[repeating-conic-gradient(#2A1510_0%_25%,#1A0A08_0%_50%)] bg-[length:20px_20px]">
      <img 
        src={imageUrl} 
        alt="Preview frame" 
        className="block w-full h-full object-contain" 
      />
      {slots.map((s, i) => (
        <div
          key={i}
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: `${s.w * 100}%`,
            height: `${s.h * 100}%`,
          }}
          className="absolute flex items-center justify-center border-2 border-[#C9A87C] bg-[#C9A87C]/10 backdrop-blur-[1px]"
        >
          <span className="rounded-full bg-[#C9A87C] px-3 py-0.5 font-serif text-sm font-bold text-[#1A0A08] shadow-lg">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}