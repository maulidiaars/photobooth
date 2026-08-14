"use client";

import { motion } from "framer-motion";

const glows = [
  { className: "bg-garnet/10 w-72 h-72 -top-10 -left-16", anim: "animate-floaty-slow" },
  { className: "bg-clay-yellowDark/15 w-56 h-56 top-[10%] -right-10", anim: "animate-floaty-delay" },
  { className: "bg-clay-mintDark/15 w-64 h-64 -bottom-16 left-[8%]", anim: "animate-floaty-slow" },
];

const motes = [
  { top: "18%", left: "22%", size: 6, delay: 0 },
  { top: "62%", left: "12%", size: 4, delay: 1.2 },
  { top: "28%", left: "78%", size: 5, delay: 0.6 },
  { top: "74%", left: "82%", size: 4, delay: 1.8 },
  { top: "48%", left: "50%", size: 3, delay: 0.9 },
];

export function FloatingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {/* soft out-of-focus light leaks, not candy blobs */}
      {glows.map((g, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.15, duration: 1 }}
          className={`absolute rounded-full blur-3xl ${g.className} ${g.anim}`}
        />
      ))}

      {/* drifting dust / grain motes for a little atmosphere */}
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-ink/10 animate-drift"
          style={{
            top: m.top,
            left: m.left,
            width: m.size,
            height: m.size,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}

      {/* faint sprocket-hole strips along the very top & bottom edge —
          the film-strip signature, kept quiet enough not to compete */}
      <div className="sprockets absolute top-3 left-0 right-0 h-1.5 opacity-[0.14]" />
      <div className="sprockets absolute bottom-3 left-0 right-0 h-1.5 opacity-[0.14]" />
    </div>
  );
}
