"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * Same "photo wall" composition as the landing page's `PhotoFrameWall`
 * — a huge back strip bleeding off the edge, with a huge front strip
 * overlapping tight on top of it. This is the user's *actual*
 * finished strip repeated four times instead of stock photos. Pushed
 * down from the top (positive `top-*`, not negative) so the strips
 * hang lower into the column instead of bleeding off the top edge,
 * and sized big enough that it's fine (expected) for them to run past
 * the bottom of the screen.
 */
function TiltedStrip({
  imageUrl,
  rotate,
  className,
  style,
}: {
  imageUrl: string;
  rotate: number;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotate * 0.4 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ type: "spring", stiffness: 90, damping: 16 }}
      className={className}
      style={{ transformOrigin: "center", ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="w-full h-auto rounded-[16px] drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)] sm:rounded-[20px]"
      />
    </motion.div>
  );
}

// clamp(min, preferred-vw, max) gantiin breakpoint w-96/w-[34rem]/w-[38rem]
// yang lompat-lompat itu. Ini bikin lebar strip ngikutin lebar layar
// secara HALUS di segala ukuran — laptop 13", laptop 15", monitor
// lebar — bukan cuma di 3 titik breakpoint doang. Itu yang bikin
// kelihatan "proporsional di satu layar, kegedean di layar lain":
// di lebar 1024-1279px, w-96 (384px) itu udah hampir 35% dari layar;
// di 1920px+, 384px cuma ~20% — padahal kelas Tailwind-nya sama persis.
const BACK_WIDTH = "clamp(14rem, 26vw, 38rem)";
const FRONT_WIDTH = "clamp(11rem, 20vw, 30rem)";
const BACK_OFFSET = "clamp(-11rem, -8vw, -6rem)";
const FRONT_OFFSET = "clamp(1rem, 3.5vw, 3rem)";

/** Laptop+ only: absolute overlay. Back strip bleeds off the side
 *  edge, front strip sits huge and close on top of it, both pushed
 *  down from the top instead of hugging/overshooting it. */
export function ResultFrameWallDesktop({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block overflow-hidden">
      {/* left, back */}
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={-11}
        className="absolute top-10"
        style={{ width: BACK_WIDTH, left: BACK_OFFSET }}
      />
      {/* left, front — overlaps the back strip tightly */}
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={8}
        className="absolute top-24 z-10"
        style={{ width: FRONT_WIDTH, left: FRONT_OFFSET }}
      />
      {/* right, front — mirrors the left front strip */}
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={-8}
        className="absolute top-24 z-10"
        style={{ width: FRONT_WIDTH, right: FRONT_OFFSET }}
      />
      {/* right, back */}
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={11}
        className="absolute top-10"
        style={{ width: BACK_WIDTH, right: BACK_OFFSET }}
      />
    </div>
  );
}

/** Phones/tablets: same two leaning pairs, sitting in normal document
 *  flow below the content, same sizing as the landing page's own
 *  phone/tablet row so both screens match exactly. */
export function ResultFrameRow({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative z-10 mt-8 flex items-end justify-center lg:hidden">
      <TiltedStrip imageUrl={imageUrl} rotate={-11} className="w-16 sm:w-24 md:w-28" />
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={8}
        className="-ml-3 mb-2 w-16 sm:-ml-4 sm:mb-3 sm:w-24 md:w-28"
      />
      <div className="w-4 shrink-0 sm:w-6 md:w-8" />
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={-8}
        className="mb-2 w-16 sm:mb-3 sm:w-24 md:w-28"
      />
      <TiltedStrip
        imageUrl={imageUrl}
        rotate={11}
        className="-ml-3 w-16 sm:-ml-4 sm:w-24 md:w-28"
      />
    </div>
  );
}