"use client";

/**
 * A hand-drawn-style SVG "sample selfie" — pure vector, no external
 * photo asset — used to fill frame/slot previews (landing hero, frame
 * picker) so they read as "a photo goes here" instead of empty space.
 * `variant` swaps the pose/colourway a little so repeated slots don't
 * look identical.
 */
interface PlaceholderSelfieProps {
  variant?: 0 | 1 | 2;
  className?: string;
}

const PALETTES = [
  { bg: ["#F0C7C9", "#D98A90"], skin: "#E8B594", hair: "#4A342A" },
  { bg: ["#EFCE8C", "#DDA84C"], skin: "#C98354", hair: "#241B15" },
  { bg: ["#C9DEC7", "#8FB88C"], skin: "#F3C9A0", hair: "#7A4B2B" },
];

export function PlaceholderSelfie({ variant = 0, className }: PlaceholderSelfieProps) {
  const p = PALETTES[variant % PALETTES.length] ?? PALETTES[0]!;
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Contoh hasil foto"
    >
      <defs>
        <linearGradient id={`sbg-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.bg[0]} />
          <stop offset="100%" stopColor={p.bg[1]} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#sbg-${variant})`} />
      {/* soft vignette so the figure reads as a photo, not a sticker */}
      <ellipse cx="100" cy="210" rx="140" ry="60" fill="rgba(0,0,0,0.08)" />
      {/* shoulders */}
      <path d="M40 200 Q100 140 160 200 Z" fill="rgba(0,0,0,0.14)" />
      <path d="M46 200 Q100 148 154 200 Z" fill="#FFFBF2" opacity="0.9" />
      {/* neck */}
      <rect x="88" y="118" width="24" height="26" rx="8" fill={p.skin} />
      {/* head */}
      <ellipse cx="100" cy="98" rx="38" ry="42" fill={p.skin} />
      {/* hair */}
      <path
        d="M62 92c-2-30 18-50 38-50s40 20 38 50c0-6-6-10-10-8-4-14-16-22-28-22s-24 8-28 22c-4-2-10 2-10 8Z"
        fill={p.hair}
      />
      {/* cheeks (the "smiling for the photo" touch) */}
      <circle cx="76" cy="104" r="7" fill="rgba(220,120,110,0.35)" />
      <circle cx="124" cy="104" r="7" fill="rgba(220,120,110,0.35)" />
      {/* eyes (closed happy arcs) */}
      <path d="M74 92q6-6 12 0" stroke="#2A1D15" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M114 92q6-6 12 0" stroke="#2A1D15" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* smile */}
      <path d="M84 112q16 14 32 0" stroke="#2A1D15" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* peace-sign hand, held up like taking a selfie */}
      <g transform="translate(148 150) rotate(-18)">
        <rect x="-9" y="0" width="18" height="34" rx="9" fill={p.skin} />
        <rect x="-9" y="-22" width="8" height="26" rx="4" fill={p.skin} />
        <rect x="1" y="-24" width="8" height="28" rx="4" fill={p.skin} />
      </g>
    </svg>
  );
}
