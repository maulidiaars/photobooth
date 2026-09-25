"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { WebcamView } from "@/components/camera/WebcamView";
import { CountdownOverlay } from "@/components/camera/CountdownOverlay";
import { ShutterFlash } from "@/components/camera/ShutterFlash";
import { FramePreviewLive } from "@/components/camera/FramePreviewLive";
import { FilterPicker } from "@/components/camera/FilterPicker";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { ConfirmModal } from "@/components/ui/Modal";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { usePhotoSession } from "@/hooks/usePhotoSession";
import { useFrameContentBox } from "@/hooks/useFrameContentBox";
import { useFramePreviewLayout } from "@/hooks/useFramePreviewLayout";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { ROUTES } from "@/lib/constants";

export default function CameraPage() {
  const router = useRouter();

  const [retakeCandidate, setRetakeCandidate] =
    useState<number | null>(null);

  const [photoFilter, setPhotoFilter] =
    useState<PhotoFilterId>("original");

  const {
    webcamRef,
    videoConstraints,
    count,
    isRunning,
    isPausing,
    showFlash,
    takeAllShots,
    confirmRetake,
    retakeAll,
    activeIndex,
    goToResult,
    capturedPhotos,
    totalSlots,
    isComplete,
    selectedFrame,
  } = usePhotoSession(photoFilter);

  /*
    The frame preview keeps its existing database-driven sizing.
    Nothing about the frame/result logic is changed here.
  */
  const previewAreaRef =
    useRef<HTMLDivElement>(null);

  const contentBox = useFrameContentBox(
    selectedFrame?.frame_png ?? null
  );

  const previewLayout =
    useFramePreviewLayout(
      previewAreaRef,
      contentBox
    );

  useEffect(() => {
    if (!selectedFrame) {
      router.replace(ROUTES.frame);
    }
  }, [selectedFrame, router]);

  if (!selectedFrame) return null;

  const busy = isRunning || isPausing;

  const handleSlotClick = (index: number) => {
    if (busy) return;
    setRetakeCandidate(index);
  };

  const handleConfirmRetake = () => {
    if (retakeCandidate !== null) {
      confirmRetake(retakeCandidate);
    }

    setRetakeCandidate(null);
  };

  /*
    Session timer still expires exactly as before.
  */
  const handleTimerExpire = () => {
    router.push(ROUTES.result);
  };

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      {/* =========================================================
          LEFT — CAMERA AREA
          ========================================================= */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4 lg:px-8 lg:pb-6 lg:pt-5">
        <div className="landing-maroon-bg" />
        <FloatingBackground />

        {/*
          TIMER
          ---------------------------------------------------------
          Previously this was fixed over the camera.

          Now it is an inline element ABOVE the camera, so:
          - it never overlaps the camera image
          - it never covers someone's face
          - the camera naturally starts a little lower
          - on every breakpoint it stays visually attached to
            the camera section without covering it
        */}
        <div className="relative z-20 mb-3 flex shrink-0 justify-start sm:mb-4">
          <SessionTimer
            variant="inline"
            onExpire={handleTimerExpire}
          />
        </div>

        <section className="relative z-10 min-h-0 flex-1 overflow-hidden rounded-clay-lg bg-black sm:rounded-[28px]">
          <WebcamView
            webcamRef={webcamRef}
            videoConstraints={videoConstraints}
            filter={photoFilter}
          />

          <CountdownOverlay count={count} />

          <ShutterFlash show={showFlash} />

          {/* Camera corner guides */}
          <div className="pointer-events-none absolute inset-3 sm:inset-5">
            {(
              [
                "top-0 left-0 border-l-2 border-t-2",
                "top-0 right-0 border-r-2 border-t-2",
                "bottom-0 left-0 border-l-2 border-b-2",
                "bottom-0 right-0 border-r-2 border-b-2",
              ] as const
            ).map((pos, i) => (
              <span
                key={i}
                className={`absolute h-6 w-6 rounded-[3px] border-white/40 sm:h-7 sm:w-7 ${pos}`}
              />
            ))}
          </div>

          {!isComplete && (
            <>
              {/*
                ====================================================
                FILTER RAIL
                ====================================================

                Always visible on the right side.

                No "Efek" button.
                No popup.
                No giant horizontal panel.

                User simply scrolls UP/DOWN through the filters.
                The rail itself has a soft glass appearance and
                remains inside the camera boundary.
              */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: 18,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                }}
                className="absolute right-2 top-1/2 z-30 -translate-y-1/2 sm:right-3 lg:right-4"
              >
                <FilterPicker
                  value={photoFilter}
                  onChange={setPhotoFilter}
                  disabled={busy}
                />
              </motion.div>

              {/*
                SHUTTER
                ----------------------------------------------------
                Remains at the bottom center exactly as requested.
              */}
              <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 sm:bottom-7">
                <motion.button
                  onClick={takeAllShots}
                  disabled={busy}
                  aria-label="Mulai ambil foto"
                  whileHover={
                    !busy
                      ? { scale: 1.05 }
                      : undefined
                  }
                  whileTap={
                    !busy
                      ? { scale: 0.9 }
                      : undefined
                  }
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 22,
                  }}
                  className="group flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/10 backdrop-blur-sm transition-opacity disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
                >
                  <motion.span
                    animate={
                      !busy
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(194,71,89,0.55)",
                              "0 0 0 12px rgba(194,71,89,0)",
                            ],
                          }
                        : undefined
                    }
                    transition={
                      !busy
                        ? {
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeOut",
                          }
                        : undefined
                    }
                    className="bg-garnet-gradient h-[86%] w-[86%] rounded-full transition-transform group-active:scale-90"
                  />
                </motion.button>
              </div>
            </>
          )}
        </section>

        {/*
          IMPORTANT:
          The old "ketuk shutter buat mulai jepret" text is removed.
          There is intentionally no helper text under the camera.
        */}
        <div className="relative z-10 mt-3 flex shrink-0 flex-col items-center gap-2 sm:mt-4">
          {isComplete ? (
            <motion.div
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 22,
              }}
              className="flex flex-col items-center gap-2"
            >
              <motion.button
                onClick={goToResult}
                whileHover={{
                  y: -2,
                  scale: 1.02,
                }}
                whileTap={{
                  y: 1,
                  scale: 0.97,
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                }}
                className="bg-garnet-gradient flex items-center gap-3 rounded-full py-2.5 pl-3 pr-6 text-paper-light sm:py-3 sm:pl-3.5 sm:pr-8"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-9 sm:w-9">
                  <CheckCircle2
                    size={18}
                    strokeWidth={2.6}
                  />
                </span>

                <span className="font-display text-sm font-bold tracking-wide sm:text-base">
                  Simpan &amp; Lanjut
                </span>
              </motion.button>

              <button
                onClick={retakeAll}
                className="font-body flex items-center gap-1.5 text-xs font-medium text-paper-light/55 transition-colors hover:text-paper-light sm:text-sm"
              >
                <RotateCcw
                  size={13}
                  strokeWidth={2.4}
                />
                ambil ulang semua
              </button>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* =========================================================
          RIGHT — FRAME PREVIEW
          ========================================================= */}
      <div
        className="frame-col-dynamic-width relative flex min-h-[54vh] w-full shrink-0 flex-col overflow-hidden bg-white lg:h-full lg:min-h-0 lg:flex-shrink-0"
        style={
          previewLayout
            ? ({
                "--preview-w":
                  `${previewLayout.width}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div
          ref={previewAreaRef}
          className="relative min-h-0 flex-1"
        >
          {selectedFrame.slot_layout.length > 0 ? (
            <FramePreviewLive
              frame={selectedFrame}
              photos={capturedPhotos}
              totalSlots={totalSlots}
              activeIndex={activeIndex}
              locked={busy}
              onSlotClick={handleSlotClick}
              contentBox={contentBox}
              previewLayout={previewLayout}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white text-center">
              <Sparkles
                size={22}
                strokeWidth={2}
                className="text-ink/25"
              />

              <p className="text-muted font-hand text-2xl">
                frame ini belum punya slot
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={retakeCandidate !== null}
        title="Ambil ulang foto ini?"
        description={
          retakeCandidate !== null
            ? `Slot ${
                retakeCandidate + 1
              } akan difoto ulang — slot lain nggak berubah.`
            : undefined
        }
        confirmLabel="Ya, ambil ulang"
        cancelLabel="Batal"
        onConfirm={handleConfirmRetake}
        onCancel={() =>
          setRetakeCandidate(null)
        }
      />
    </main>
  );
}
