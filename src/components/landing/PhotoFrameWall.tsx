"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles } from "lucide-react";

// Four sets of real portrait photos — one per big frame — so each
// strip reads as an actual sample of what the booth prints, not a
// repeated placeholder.
const FRAME_SETS: { photos: string[]; tag: string }[] = [
  {
    tag: "strip 01",
    photos: [
      "https://randomuser.me/api/portraits/women/65.jpg",
      "https://randomuser.me/api/portraits/men/32.jpg",
      "https://randomuser.me/api/portraits/women/44.jpg",
    ],
  },
  {
    tag: "strip 02",
    photos: [
      "https://randomuser.me/api/portraits/men/75.jpg",
      "https://randomuser.me/api/portraits/women/68.jpg",
      "https://randomuser.me/api/portraits/men/21.jpg",
    ],
  },
  {
    tag: "strip 03",
    photos: [
      "https://randomuser.me/api/portraits/women/12.jpg",
      "https://randomuser.me/api/portraits/men/54.jpg",
      "https://randomuser.me/api/portraits/women/29.jpg",
    ],
  },
  {
    tag: "strip 04",
    photos: [
      "https://randomuser.me/api/portraits/men/8.jpg",
      "https://randomuser.me/api/portraits/women/50.jpg",
      "https://randomuser.me/api/portraits/men/61.jpg",
    ],
  },
];

/** A simple decorative barcode made of variable-width bars — no image
 *  asset needed, echoes the ticket-stub reference art. Bars use small
 *  fixed pixel widths so the whole strip stays compact and never
 *  overflows even the smallest mobile frame. */
function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2];
  return (
    <div className="flex h-4 items-stretch gap-[1px] sm:h-5 md:h-6 lg:h-7 xl:h-8">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink/80" style={{ width: `${w}px` }} />
      ))}
    </div>
  );
}

function TicketFrame({
  photos,
  tag,
  className,
  rotate,
}: {
  photos: string[];
  tag: string;
  className: string;
  rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotate * 0.4 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 90, damping: 16 }}
      className={className}
      style={{ transformOrigin: "center" }}
    >
      <div className="frame-notch bg-clay-gradient shadow-clay-lg rounded-[14px] p-1.5 pb-2 sm:rounded-[18px] sm:p-2 sm:pb-2.5 md:rounded-[22px] md:p-2.5 md:pb-3 lg:rounded-[30px] lg:p-3.5 lg:pb-4 xl:p-4 xl:pb-5">
        <span className="frame-notch-bl" />
        <span className="frame-notch-br" />

        {/* label */}
        <div className="mb-1 flex items-center justify-center gap-1 sm:mb-1.5 sm:gap-1.5 md:mb-2 lg:mb-3 lg:gap-2 xl:mb-4">
          <Camera
            strokeWidth={2}
            className="text-garnet h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-[18px] lg:w-[18px] xl:h-5 xl:w-5"
          />
          <p className="font-display text-ink text-[10px] font-semibold italic leading-none sm:text-xs md:text-sm lg:text-lg xl:text-xl">
            momen
          </p>
        </div>

        {/* photo slots */}
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-2.5 xl:space-y-3">
          {photos.map((src, i) => (
            <div
              key={i}
              className="shadow-clay-inset relative aspect-[4/3] overflow-hidden rounded-[6px] bg-white sm:rounded-[9px] md:rounded-[11px] lg:rounded-[14px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === photos.length - 1 && (
                <Sparkles
                  strokeWidth={2.4}
                  className="absolute bottom-0.5 right-1 h-2 w-2 text-white drop-shadow sm:h-2.5 sm:w-2.5 lg:bottom-1.5 lg:right-2 lg:h-3.5 lg:w-3.5"
                />
              )}
            </div>
          ))}
        </div>

        {/* footer: barcode + tag, echoing the ticket-stub reference */}
        <div className="mt-1 flex flex-col items-center gap-0.5 sm:mt-1.5 md:mt-2 lg:mt-3 lg:gap-1 xl:mt-4">
          <Barcode />
          <p className="text-muted font-body text-[6px] tracking-widest sm:text-[7px] md:text-[8px] lg:text-[10px] xl:text-xs">
            {tag}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Laptop-only backdrop: four ticket-strip frames anchored to the edges
 * of the screen — two on the left, two on the right — each pair
 * leaning opposite ways so they cross slightly near the middle,
 * absolutely positioned behind the centered text. This is the
 * composition that was already right — untouched, just now scoped to
 * `lg+` only since phones/tablets get their own layout below.
 */
export function PhotoFrameWallDesktop() {
  const [left, leftFront, rightFront, right] = FRAME_SETS;
  if (!left || !leftFront || !rightFront || !right) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {/* left, back — bleeds off the left edge */}
      <TicketFrame
        photos={left.photos}
        tag={left.tag}
        rotate={-11}
        className="absolute -left-14 top-[6%] w-52 xl:-left-10 xl:w-60"
      />
      {/* left, front — overlaps the back frame, opposite lean = crossing */}
      <TicketFrame
        photos={leftFront.photos}
        tag={leftFront.tag}
        rotate={8}
        className="absolute left-[9%] top-[16%] z-10 w-48 xl:left-[11%] xl:w-56"
      />

      {/* right, front — mirrors the left front frame */}
      <TicketFrame
        photos={rightFront.photos}
        tag={rightFront.tag}
        rotate={-8}
        className="absolute right-[9%] top-[16%] z-10 w-48 xl:right-[11%] xl:w-56"
      />
      {/* right, back — bleeds off the right edge */}
      <TicketFrame
        photos={right.photos}
        tag={right.tag}
        rotate={11}
        className="absolute -right-14 top-[6%] w-52 xl:-right-10 xl:w-60"
      />
    </div>
  );
}

/**
 * Phone/tablet layout: instead of overlaying the text (which read as
 * cluttered on small screens), the same four frames sit in normal
 * document flow *below* the title/CTA/steps, as two leaning pairs with
 * a gap between them — a left "V" and a right "V" that both open
 * upward, mirroring the hand-drawn layout sketch. Not absolutely
 * positioned, so it's free to make the page taller than the viewport;
 * `.landing-shell` lets that scroll on these breakpoints. Hidden at
 * `lg` where PhotoFrameWallDesktop takes over instead.
 */
export function PhotoFrameRow() {
  const [left, leftFront, rightFront, right] = FRAME_SETS;
  if (!left || !leftFront || !rightFront || !right) return null;

  return (
    <div className="relative z-10 mt-8 flex items-end justify-center lg:hidden">
      <TicketFrame
        photos={left.photos}
        tag={left.tag}
        rotate={-11}
        className="w-16 sm:w-24 md:w-28"
      />
      <TicketFrame
        photos={leftFront.photos}
        tag={leftFront.tag}
        rotate={8}
        className="-ml-3 mb-2 w-16 sm:-ml-4 sm:mb-3 sm:w-24 md:w-28"
      />
      <div className="w-4 shrink-0 sm:w-6 md:w-8" />
      <TicketFrame
        photos={rightFront.photos}
        tag={rightFront.tag}
        rotate={-8}
        className="mb-2 w-16 sm:mb-3 sm:w-24 md:w-28"
      />
      <TicketFrame
        photos={right.photos}
        tag={right.tag}
        rotate={11}
        className="-ml-3 w-16 sm:-ml-4 sm:w-24 md:w-28"
      />
    </div>
  );
}
