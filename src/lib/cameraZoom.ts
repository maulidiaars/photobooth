/**
 * Status zoom kamera yang dipakai bersama oleh WebcamView (preview +
 * tombol zoom) dan useCamera (capture), supaya "yang terlihat" ==
 * "yang difoto".
 *
 *  - 1x   : tampilan normal.
 *  - 0.5x : kalau kamera mendukung zoom hardware di bawah 1x
 *           (mis. kamera ultra-wide di sebagian HP Android), dipakai
 *           zoom hardware. Kalau tidak ada, dipakai pelebaran digital
 *           semaksimal mungkin (lihat computeDigitalZoomFactor).
 */
export type ZoomLevel = 0.5 | 1;

export const ZOOM_LEVELS: ZoomLevel[] = [0.5, 1];

interface ZoomState {
  level: ZoomLevel;
  /** true kalau zoom-out saat ini dikerjakan oleh hardware kamera. */
  hardware: boolean;
}

const state: ZoomState = {
  level: 1,
  hardware: false,
};

export function getZoomState(): ZoomState {
  return state;
}

export function resetZoomState() {
  state.level = 1;
  state.hardware = false;
}

interface ZoomCapability {
  min?: number;
  max?: number;
}

/**
 * Terapkan level zoom ke track kamera (kalau didukung).
 * Return true kalau zoom-out dikerjakan hardware.
 */
export async function applyCameraZoom(
  stream: MediaStream | null | undefined,
  level: ZoomLevel
): Promise<boolean> {
  state.level = level;
  state.hardware = false;

  const track = stream?.getVideoTracks?.()[0];

  if (!track || typeof track.getCapabilities !== "function") {
    return false;
  }

  try {
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: ZoomCapability;
    };

    const zoom = caps.zoom;

    if (!zoom || typeof zoom.min !== "number") {
      return false;
    }

    if (level < 1 && zoom.min < 1) {
      const target = Math.max(level, zoom.min);

      await track.applyConstraints({
        advanced: [{ zoom: target } as MediaTrackConstraintSet],
      });

      state.hardware = true;

      return true;
    }

    // Balik ke 1x (atau zoom terendah yang tersedia).
    await track.applyConstraints({
      advanced: [
        { zoom: Math.max(1, zoom.min) } as MediaTrackConstraintSet,
      ],
    });
  } catch {
    // Zoom tidak bisa diterapkan -> jatuh ke pelebaran digital.
  }

  return false;
}
