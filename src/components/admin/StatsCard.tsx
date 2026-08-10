import type { LucideIcon } from "lucide-react";
import { ClayCard } from "@/components/ui/ClayCard";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  bg?: "cream" | "pink" | "purple" | "mint" | "yellow" | "forest";
  hint?: string;
}

export function StatsCard({ label, value, icon: Icon, bg = "cream", hint }: StatsCardProps) {
  const light = bg === "forest";
  return (
    <ClayCard bg={bg} className="flex items-center gap-4 !p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-clay-sm shadow-clay-inset ${
          light ? "bg-white/15" : "bg-white/60"
        }`}
      >
        <Icon size={22} className={light ? "text-paper-light" : "text-ink"} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className={`font-body text-xs ${light ? "text-paper-light/75" : "text-ink/70"}`}>{label}</p>
        <p className={`font-heading text-2xl font-semibold leading-tight ${light ? "text-paper-light" : "text-ink"}`}>
          {value}
        </p>
        {hint && (
          <p className={`font-body text-[11px] ${light ? "text-paper-light/60" : "text-ink/50"}`}>{hint}</p>
        )}
      </div>
    </ClayCard>
  );
}
