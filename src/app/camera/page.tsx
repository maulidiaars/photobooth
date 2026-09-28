"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
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
  const router =
    useRouter();

  const [
    retakeCandidate,
    setRetakeCandidate,
  ] =
    useState<number | null>(
      null
    );

  const [
    photoFilter,
    setPhotoFilter,
  ] =
    useState<PhotoFilterId>(
      "original"
    );

  const {
    webcamRef,
    videoConstraints,
    count,
    isRunning,
    isPausing,
    mode,
    showFlash,
    takeAllShots,
    confirmRetake,
    activeIndex,
    goToResult,
    capturedPhotos,
    totalSlots,
    isComplete,
    selectedFrame,
    slotLayout,
    slotsReady,
    captureAspectRatio,
  } =
    usePhotoSession(
      photoFilter
    );

  const previewAreaRef =
    useRef<HTMLDivElement>(
      null
    );

  const contentBox =
    useFrameContentBox(
      selectedFrame?.frame_png ??
        null
    );

  const previewLayout =
    useFramePreviewLayout(
      previewAreaRef,
      contentBox
    );

  useEffect(() => {
    if (!selectedFrame) {
      router.replace(
        ROUTES.frame
      );
    }
  }, [
    selectedFrame,
    router,
  ]);

  if (!selectedFrame) {
    return null;
  }

  const busy =
    isRunning ||
    isPausing;

  /*
   * Tombol shutter hilang (smooth) begitu sesi jepret berjalan
   * (countdown 3-2-1 sampai semua foto selesai) dan tetap hilang
   * setelah semua slot terisi.
   */
  const hideShutter =
    busy ||
    mode !== "idle" ||
    isComplete;

  /*
   * Setelah semua foto selesai: kamera diburamkan + "kabut hitam",
   * dan modal kecil "Simpan & Lanjut" muncul di tengah. Begitu
   * pengguna memilih ambil ulang satu foto (mode retake / countdown
   * jalan), layar kembali normal.
   */
  const showCompleteOverlay =
    isComplete &&
    mode === "idle" &&
    !busy;

  /*
   * ============================================================
   * RASIO GUIDE KAMERA
   * ============================================================
   *
   * `captureAspectRatio` datang dari usePhotoSession dan merupakan
   * rasio PIKSEL asli lubang foto (slot) frame yang dipilih:
   *
   *   (slot.w * lebarPNG) / (slot.h * tinggiPNG)
   *
   * Nilai yang SAMA dipakai untuk:
   *
   *   guide kamera  →  crop capture  →  lubang di frame
   *
   * null = frame masih dianalisis (guide belum ditampilkan).
   */

  const handleSlotClick =
    (index: number) => {
      if (
        busy ||
        !slotsReady
      ) {
        return;
      }

      setRetakeCandidate(
        index
      );
    };

  const handleConfirmRetake =
    () => {
      if (
        retakeCandidate !== null
      ) {
        confirmRetake(
          retakeCandidate
        );
      }

      setRetakeCandidate(
        null
      );
    };

  const handleTimerExpire =
    () => {
      router.push(
        ROUTES.result
      );
    };

  const handleMainCameraButton =
    () => {
      if (
        busy ||
        !slotsReady
      ) {
        return;
      }

      if (isComplete) {
        goToResult();
        return;
      }

      takeAllShots();
    };

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-8 lg:pb-6 lg:pt-5">
        <div className="landing-maroon-bg" />

        <FloatingBackground />

        <div className="relative z-20 mb-3 flex w-full min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
          <div className="shrink-0">
            <SessionTimer
              variant="inline"
              onExpire={
                handleTimerExpire
              }
            />
          </div>

          <FilterPicker
            value={photoFilter}
            onChange={
              setPhotoFilter
            }
            disabled={busy}
          />
        </div>

        <section className="relative z-10 min-h-0 flex-1 overflow-hidden rounded-clay-lg bg-black sm:rounded-[28px]">
          <WebcamView
            webcamRef={
              webcamRef
            }
            videoConstraints={
              videoConstraints
            }
            filter={
              photoFilter
            }
            captureAspectRatio={
              captureAspectRatio
            }
            zoomDisabled={
              busy ||
              isComplete
            }
          />

          <CountdownOverlay
            count={count}
          />

          <ShutterFlash
            show={showFlash}
          />

          <div className="pointer-events-none absolute inset-3 sm:inset-5">
            {(
              [
                "top-0 left-0 border-l-2 border-t-2",
                "top-0 right-0 border-r-2 border-t-2",
                "bottom-0 left-0 border-l-2 border-b-2",
                "bottom-0 right-0 border-r-2 border-b-2",
              ] as const
            ).map(
              (
                pos,
                i
              ) => (
                <span
                  key={i}
                  className={`absolute h-6 w-6 rounded-[3px] border-white/40 sm:h-7 sm:w-7 ${pos}`}
                />
              )
            )}
          </div>

          <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 sm:bottom-7">
            <AnimatePresence>
              {!hideShutter && (
                <motion.button
                  key="shutter"
                  type="button"
                  onClick={
                    handleMainCameraButton
                  }
                  disabled={
                    !slotsReady
                  }
                  aria-label="Mulai ambil foto"
                  initial={{
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.6,
                    transition: {
                      duration: 0.4,
                      ease: "easeInOut",
                    },
                  }}
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 22,
                  }}
                  className="group flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/10 backdrop-blur-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
                >
                  <motion.span
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(194,71,89,.55)",
                        "0 0 0 12px rgba(194,71,89,0)",
                      ],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat:
                        Infinity,
                      ease: "easeOut",
                    }}
                    className="bg-garnet-gradient h-[86%] w-[86%] rounded-full transition-transform group-active:scale-90"
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Kabut hitam + blur + modal kecil setelah semua foto jadi */}
          <AnimatePresence>
            {showCompleteOverlay && (
              <motion.div
                key="complete-overlay"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                  transition: {
                    duration: 0.7,
                    delay: 0.3,
                    ease: "easeOut",
                  },
                }}
                exit={{
                  opacity: 0,
                  transition: {
                    duration: 0.4,
                    ease: "easeIn",
                  },
                }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-5 backdrop-blur-xl"
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 18,
                    scale: 0.94,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.96,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 26,
                    delay: 0.45,
                  }}
                  className="flex w-full max-w-[19rem] flex-col items-center gap-4 rounded-[26px] border border-white/15 bg-black/35 px-6 py-6 text-center shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-md"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="font-display text-xl font-bold text-paper-light">
                      Foto sudah lengkap!
                    </span>

                    <span className="font-body text-xs leading-relaxed text-white/70">
                      Mau ganti? Klik salah
                      satu foto di frame
                      untuk ambil ulang.
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    onClick={
                      goToResult
                    }
                    disabled={
                      !slotsReady
                    }
                    whileHover={{
                      y: -2,
                      scale: 1.03,
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
                    className="bg-garnet-gradient flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full py-2.5 pl-3 pr-5 text-paper-light shadow-[0_12px_35px_rgba(0,0,0,.28)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <CheckCircle2
                        size={18}
                        strokeWidth={2.6}
                      />
                    </span>

                    <span className="font-display text-sm font-bold tracking-wide sm:text-base">
                      Simpan &amp; Lanjut
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <div
        className="frame-col-dynamic-width relative flex min-h-[54vh] w-full shrink-0 flex-col overflow-hidden bg-white lg:h-full lg:min-h-0 lg:flex-shrink-0"
        style={
          previewLayout
            ? ({
                "--preview-w":
                  `${previewLayout.width}px`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          ref={
            previewAreaRef
          }
          className="relative min-h-0 flex-1"
        >
          {slotLayout.length >
          0 ? (
            <FramePreviewLive
              frame={
                selectedFrame
              }
              photos={
                capturedPhotos
              }
              totalSlots={
                totalSlots
              }
              activeIndex={
                activeIndex
              }
              locked={busy}
              onSlotClick={
                handleSlotClick
              }
              contentBox={
                contentBox
              }
              previewLayout={
                previewLayout
              }
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
        open={
          retakeCandidate !==
          null
        }
        title="Ambil ulang foto ini?"
        description={
          retakeCandidate !==
          null
            ? `Slot ${
                retakeCandidate +
                1
              } akan difoto ulang — slot lain nggak berubah.`
            : undefined
        }
        confirmLabel="Ya, ambil ulang"
        cancelLabel="Batal"
        onConfirm={
          handleConfirmRetake
        }
        onCancel={() =>
          setRetakeCandidate(
            null
          )
        }
      />
    </main>
  );
}
