"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import clsx from "clsx";
import type { Frame } from "@/types/frame";
import { useFrameContentBox } from "@/hooks/useFrameContentBox";

interface FrameCardProps {
  frame: Frame;
  selected: boolean;
  onSelect: (frame: Frame) => void;
}

export function FrameCard({ frame, selected, onSelect }: FrameCardProps) {
  // Frame PNG-nya punya margin transparan lebar di sekeliling artwork
  // aslinya (baca catatan di useFrameContentBox). Kalau kartu ini cuma
  // dipaksa aspect-ratio 9/16 tetap + object-contain, badge centang
  // yang ditaruh di pojok KOTAK jadi nongkrong di area transparan itu
  // — kebaca "ngambang" jauh dari frame-nya, bukan di ujung frame.
  //
  // Fix-nya: bentuk kotak kartu ini disesuaikan mengikuti bounding box
  // artwork ASLI (bukan kanvas mentahnya) via useFrameContentBox, sama
  // seperti trik yang sudah dipakai di panel preview halaman
  // frame/kamera. Begitu kotaknya pas membungkus artwork, pojok kotak
  // = ujung frame yang sebenarnya, jadi badge yang nempel di pojok
  // kartu otomatis jatuh tepat di ujung frame.
  const contentBox = useFrameContentBox(frame.thumbnail);
  const box = contentBox?.box;
  const naturalWidth = contentBox?.naturalWidth;
  const naturalHeight = contentBox?.naturalHeight;

  const trimmedStyle =
    box && naturalWidth && naturalHeight
      ? {
          aspectRatio: `${box.w} / ${box.h}`,
          backgroundImage: `url(${frame.thumbnail})`,
          backgroundRepeat: "no-repeat",
          // Persentase, bukan px — jadi tidak perlu ResizeObserver:
          // besarnya background otomatis konsisten pada ukuran kartu
          // berapa pun, karena container-nya sendiri sudah dipaksa
          // rasio box.w/box.h lewat aspectRatio di atas.
          backgroundSize: `${(naturalWidth / box.w) * 100}% ${(naturalHeight / box.h) * 100}%`,
          backgroundPosition: `${
            naturalWidth === box.w ? 0 : (box.x / (naturalWidth - box.w)) * 100
          }% ${naturalHeight === box.h ? 0 : (box.y / (naturalHeight - box.h)) * 100}%`,
        }
      : null;

  return (
    <motion.button
      onClick={() => onSelect(frame)}
      aria-label={frame.nama}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      aria-pressed={selected}
      className="group relative flex w-full max-w-[13rem] flex-col items-center text-center"
    >
      <div
        className={clsx(
          "relative w-full transition-[filter]",
          // Lebar mengikuti lebar kolom grid; kalau trimmedStyle belum
          // siap (frame baru, belum sempat di-scan), sementara pakai
          // rasio 9/16 + object-contain biasa supaya tetap ada yang
          // tampil — begitu hasil scan datang, langsung dipas-kan.
          !trimmedStyle && "aspect-[9/16]",
          selected
            ? "drop-shadow-[0_18px_34px_rgba(156,43,60,0.45)]"
            : "drop-shadow-[0_10px_20px_rgba(58,40,31,0.22)]"
        )}
        style={trimmedStyle ?? undefined}
      >
        {!trimmedStyle && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.thumbnail}
            alt={frame.nama}
            draggable={false}
            className="h-full w-full object-contain"
          />
        )}

        {selected && (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: -8 }}
            // Spring "keras" (stiffness tinggi, damping rendah) supaya
            // badge-nya kerasa "nempel" langsung — nge-pop tegas, bukan
            // fade/scale halus.
            transition={{ type: "spring", stiffness: 700, damping: 16, mass: 0.6 }}
            // Sekarang bener-bener ditaruh di ujung/pojok ARTWORK
            // (nongol keluar dikit lewat offset negatif) + ring putih
            // biar kelihatan jelas nempel di ujung kertas foto.
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] border-paper-light bg-garnet-gradient text-paper-light shadow-clay-sm sm:-right-2.5 sm:-top-2.5 sm:h-9 sm:w-9"
          >
            <Check size={16} strokeWidth={3.4} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
