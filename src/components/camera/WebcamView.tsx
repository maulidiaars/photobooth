"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";
import {
  CAMERA_PREVIEW_MIRRORED,
  computeGuideRect,
} from "@/lib/canvas";
import {
  VIRTUAL_ZOOM_OUT,
  ZOOM_LEVELS,
  applyCameraZoom,
  findUltraWideDeviceId,
  getStreamDeviceId,
  getZoomState,
  hasRealWideCamera,
  markHardwareWide,
  resetZoomState,
  setDigitalZoom,
  type ZoomLevel,
} from "@/lib/cameraZoom";

/*
 * Cara kamera menghasilkan tampilan 0.5x:
 *  - "default" : kamera biasa (1x).
 *  - "device"  : pindah ke kamera fisik Ultra Wide DEPAN.
 *
 * Kalau kamera tidak punya keduanya (laptop, webcam USB, kamera
 * depan HP biasa) dipakai MODE VIRTUAL (state `virtualWide` di
 * bawah): 1x tetap normal, 0.5x menjauhkan gambar.
 */
type WideMode = "default" | "device";

interface WebcamViewProps {
  webcamRef: RefObject<Webcam | null>;

  videoConstraints:
    MediaTrackConstraints;

  filter?: PhotoFilterId;

  /**
   * Rasio PIKSEL (lebar / tinggi) dari lubang foto frame yang
   * sedang dipilih. Guide dan hasil capture memakai rasio ini.
   * null = belum diketahui (frame masih dianalisis).
   */
  captureAspectRatio?: number | null;

  /** Kunci tombol zoom (mis. saat countdown / sedang memotret). */
  zoomDisabled?: boolean;
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
  captureAspectRatio = null,
  zoomDisabled = false,
}: WebcamViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    containerSize,
    setContainerSize,
  ] = useState<{ w: number; h: number } | null>(null);

  const [
    videoSize,
    setVideoSize,
  ] = useState<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] =
    useState<ZoomLevel>(1);

  const zoomRef =
    useRef<ZoomLevel>(1);

  const [
    hardwareWide,
    setHardwareWide,
  ] = useState(false);

  /*
   * MODE VIRTUAL: kamera tidak punya zoom hardware < 1x maupun
   * kamera Ultra Wide depan. 1x tetap normal; 0.5x menjauhkan
   * gambar (VIRTUAL_ZOOM_OUT) dan area di luar sensor diisi
   * background blur.
   */
  const [
    virtualWide,
    setVirtualWide,
  ] = useState(false);

  /* Video kedua (blur) untuk mengisi tepi saat 0.5x mode virtual. */
  const bgVideoRef =
    useRef<HTMLVideoElement>(null);

  const [wideMode, setWideMode] =
    useState<WideMode>("default");

  const wideModeRef =
    useRef<WideMode>("default");

  const [
    wideDeviceId,
    setWideDeviceId,
  ] = useState<string | null>(null);

  const streamConstraints =
    useMemo<MediaTrackConstraints>(() => {
      if (
        wideMode === "device" &&
        wideDeviceId
      ) {
        const {
          facingMode: _facing,
          ...rest
        } = videoConstraints;

        void _facing;

        return {
          ...rest,
          deviceId: {
            exact: wideDeviceId,
          },
        };
      }

      return videoConstraints;
    }, [
      videoConstraints,
      wideMode,
      wideDeviceId,
    ]);

  const changeWideMode = (
    mode: WideMode
  ) => {
    wideModeRef.current = mode;

    setWideMode(mode);
  };

  /*
   * Skala digital yang sedang tampil. Hanya aktif di MODE VIRTUAL
   * saat 0.5x (< 1 = menjauh). 1x selalu 1 (normal).
   * Nilai yang sama dipakai useCamera saat capture.
   */
  const digitalScale =
    virtualWide && zoom < 1
      ? VIRTUAL_ZOOM_OUT
      : 1;

  useEffect(() => {
    setDigitalZoom(digitalScale);
  }, [digitalScale]);

  /*
   * Reset status zoom setiap halaman kamera dibuka, supaya tidak
   * "nyangkut" di 0.5x dari sesi sebelumnya.
   */
  useEffect(() => {
    resetZoomState();
  }, []);

  /*
   * Ukur container kamera (responsive). Guide dihitung dalam
   * PIKSEL dari ukuran ini — persis sama dengan yang dipakai
   * saat capture (video.clientWidth / clientHeight).
   */
  useEffect(() => {
    const el =
      containerRef.current;

    if (!el) {
      return;
    }

    const update = () => {
      const w =
        el.clientWidth;

      const h =
        el.clientHeight;

      setContainerSize(
        (prev) =>
          prev &&
          prev.w === w &&
          prev.h === h
            ? prev
            : { w, h }
      );
    };

    update();

    const observer =
      new ResizeObserver(
        update
      );

    observer.observe(el);

    return () =>
      observer.disconnect();
  }, []);

  const syncVideoSize =
    useCallback(() => {
      const v =
        webcamRef.current
          ?.video;

      if (
        v &&
        v.videoWidth > 0 &&
        v.videoHeight > 0
      ) {
        setVideoSize(
          (prev) =>
            prev &&
            prev.w ===
              v.videoWidth &&
            prev.h ===
              v.videoHeight
              ? prev
              : {
                  w: v.videoWidth,
                  h: v.videoHeight,
                }
        );
      }
    }, [webcamRef]);

  const handleUserMedia =
    useCallback(
      (stream: MediaStream) => {
        syncVideoSize();

        if (bgVideoRef.current) {
          bgVideoRef.current.srcObject =
            stream;

          bgVideoRef.current
            .play()
            .catch(() => {});
        }

        /*
         * Cek apakah kamera ini punya cara "asli" untuk melebar.
         * Kalau tidak, aktifkan MODE VIRTUAL sejak awal supaya 0.5x
         * nanti benar-benar terlihat lebih lebar dari 1x.
         */
        hasRealWideCamera(stream).then(
          (real) => {
            setVirtualWide(
              !real &&
                wideModeRef.current !==
                  "device"
            );
          }
        );

        applyCameraZoom(
          stream,
          zoomRef.current
        ).then((hw) => {
          /*
           * Kalau stream ini sudah kamera Ultra Wide, pelebaran
           * dikerjakan kameranya sendiri -> tidak perlu CSS scale.
           */
          const wide =
            hw ||
            (wideModeRef.current ===
              "device" &&
              zoomRef.current < 1);

          markHardwareWide(wide);

          setHardwareWide(wide);
        });
      },
      [syncVideoSize]
    );

  const handleZoomChange =
    async (level: ZoomLevel) => {
      if (
        zoomDisabled ||
        level === zoom
      ) {
        return;
      }

      zoomRef.current = level;

      setZoom(level);

      const stream =
        webcamRef.current?.stream;

      /*
       * Balik ke 1x: kembali ke kamera & stream normal. Kalau mode
       * sebelumnya bukan "default", stream diminta ulang dan
       * handleUserMedia yang menyelesaikan sisanya.
       */
      if (level >= 1) {
        const needsRestart =
          wideModeRef.current !==
          "default";

        if (needsRestart) {
          changeWideMode("default");

          markHardwareWide(false);

          setHardwareWide(false);

          getZoomState().level =
            level;

          return;
        }

        const hw =
          await applyCameraZoom(
            stream,
            level
          );

        setHardwareWide(hw);

        return;
      }

      /*
       * 0.5x, langkah 1: zoom hardware di kamera yang sedang
       * dipakai (kalau didukung).
       */
      const hw =
        await applyCameraZoom(
          stream,
          level
        );

      if (hw) {
        setHardwareWide(true);

        return;
      }

      /*
       * Langkah 2: kamera fisik Ultra Wide (kalau perangkat punya).
       */
      const deviceId =
        await findUltraWideDeviceId();

      if (
        deviceId &&
        deviceId !==
          getStreamDeviceId(stream)
      ) {
        setWideDeviceId(deviceId);

        changeWideMode("device");

        return;
      }

      /*
       * Langkah 3: MODE VIRTUAL (laptop, webcam, kamera depan biasa).
       *
       * Tidak perlu restart stream: 1x normal, 0.5x menjauh
       * (lihat digitalScale) dengan background blur di tepinya.
       */
      setHardwareWide(false);

      markHardwareWide(false);

      setVirtualWide(true);
    };

  const selectedFilter =
    getPhotoFilter(
      filter
    );

  const filterStyle =
    selectedFilter.filter ===
    "none"
      ? "none"
      : selectedFilter.filter;

  const hasValidRatio =
    typeof captureAspectRatio ===
      "number" &&
    Number.isFinite(
      captureAspectRatio
    ) &&
    captureAspectRatio > 0;

  const guide =
    containerSize &&
    containerSize.w > 0 &&
    containerSize.h > 0 &&
    hasValidRatio
      ? computeGuideRect(
          containerSize.w,
          containerSize.h,
          captureAspectRatio as number
        )
      : null;

  /*
   * 0.5x:
   *  - Kamera dengan zoom hardware / Ultra Wide depan: pelebaran
   *    dikerjakan kameranya (tanpa scale digital).
   *  - Kamera lain (MODE VIRTUAL): gambar dikecilkan dari tengah
   *    (digitalScale) dan tepinya diisi background blur, BUKAN
   *    bar hitam. 1x tidak pernah diubah.
   */

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          filter:
            filterStyle,
          WebkitFilter:
            filterStyle,
          transition:
            "filter 180ms ease, -webkit-filter 180ms ease",
        }}
      >
        {/*
         * Background blur (mirror stream yang sama) — hanya terlihat
         * saat 0.5x mode virtual, mengisi area di luar sensor kamera.
         */}
        <video
          ref={bgVideoRef}
          muted
          playsInline
          autoPlay
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{
            transform: `${
              CAMERA_PREVIEW_MIRRORED
                ? "scaleX(-1) "
                : ""
            }scale(1.2)`,
            filter:
              "blur(28px)",
            WebkitFilter:
              "blur(28px)",
            opacity:
              digitalScale < 1
                ? 1
                : 0,
            transition:
              "opacity 250ms ease",
          }}
        />

        <div
          className="absolute inset-0 h-full w-full"
          style={{
            /*
             * Skala digital (< 1 hanya di 0.5x mode virtual),
             * dari tengah — sama persis dengan hitungan capture.
             */
            transform: `scale(${digitalScale})`,
            transformOrigin:
              "center center",
            transition:
              "transform 250ms ease",
          }}
        >
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={
            CAMERA_PREVIEW_MIRRORED
          }
          screenshotFormat="image/jpeg"
          screenshotQuality={0.95}
          videoConstraints={
            streamConstraints
          }
          onUserMedia={
            handleUserMedia
          }
          onLoadedMetadata={
            syncVideoSize
          }
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {guide && (
          <div
            className="absolute"
            style={{
              left: `${guide.x}px`,
              top: `${guide.y}px`,
              width: `${guide.w}px`,
              height: `${guide.h}px`,
              /*
               * Area di LUAR guide digelapkan. Hanya area terang
               * di dalam guide yang akan masuk ke frame.
               */
              boxShadow:
                "0 0 0 9999px rgba(0,0,0,0.5)",
            }}
          >
            <div className="absolute inset-0 rounded-[4px] border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,.12)]" />

            <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-[4px] border-l-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-[4px] border-r-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-[4px] border-b-[3px] border-l-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-[4px] border-b-[3px] border-r-[3px] border-white sm:h-10 sm:w-10" />
          </div>
        )}
      </div>

      {/* Tombol zoom 0.5x / 1x */}
      <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur-md sm:top-4">
        {ZOOM_LEVELS.map(
          (level) => {
            const active =
              zoom === level;

            return (
              <button
                key={level}
                type="button"
                disabled={
                  zoomDisabled
                }
                onClick={() =>
                  handleZoomChange(
                    level
                  )
                }
                aria-label={`Zoom ${level}x`}
                aria-pressed={
                  active
                }
                className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-[11px] font-bold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-9 sm:text-xs ${
                  active
                    ? "bg-white text-[#4A1A1A] shadow-md"
                    : "text-white/85 hover:bg-white/15"
                }`}
              >
                {level}x
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
