import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  bg?: "cream" | "maroon" | "gold" | "creamDark";
}

const bgMap = {
  cream: "bg-[#FBF7F2] border-[#E8DDD0]",
  maroon: "bg-[#6B2D2C] border-[#8B3D3C] text-[#F5EBE0]",
  gold: "bg-[#C9A87C] border-[#B8956A] text-[#4A1A1A]",
  creamDark: "bg-[#F0E6D8] border-[#E0D3C2]",
};

export function StatsCard({ label, value, icon: Icon, bg = "cream" }: StatsCardProps) {
  const isMaroon = bg === "maroon";
  const isGold = bg === "gold";
  const textColor = isMaroon || isGold ? "text-[#F5EBE0]" : "text-[#4A1A1A]";
  const labelColor = isMaroon || isGold ? "text-[#F5EBE0]/70" : "text-[#4A1A1A]/60";

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-2xl border p-5 shadow-md transition-shadow hover:shadow-lg ${bgMap[bg]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-serif tracking-wider ${labelColor}`}>{label}</p>
          <p className={`mt-1 font-serif text-2xl font-bold ${textColor}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-full p-3 ${isMaroon ? "bg-[#F5EBE0]/10" : "bg-[#6B2D2C]/10"}`}>
          <Icon size={20} className={textColor} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}