/**
 * Status zoom kamera yang dipakai bersama oleh WebcamView (preview +
 * tombol zoom) dan useCamera (capture), supaya "yang terlihat" ==
 * "yang difoto".
 *
 *  - 1x   : tampilan normal.
 *  - 0.5x : efek "Ultra Wide" ala iPhone — jangkauan kamera yang
 *           melebar (lebih banyak area/orang masuk frame), BUKAN
 *           layar yang mengecil. Urutan usahanya (dikerjakan
 *           WebcamView):
 *             1. zoom hardware di bawah 1x pada kamera yang sedang
 *                dipakai (Android / webcam yang mendukung),
 *             2. pindah ke kamera fisik "Ultra Wide" DEPAN kalau
 *                perangkat punya (mis. iPad Pro),
 *             3. MODE VIRTUAL (semua kamera lain: laptop, webcam USB,
 *                iPhone/Android depan biasa): 0.5x = seluruh frame
 *                kamera terlihat, sedangkan 1x = crop tengah frame
 *                (VIRTUAL_ZOOM_1X). Jadi 0.5x selalu terlihat lebih
 *                lebar dari 1x di kamera apa pun. Tidak ada
 *                `scale(<1)` (preview tidak pernah mengecil).
 */
export type ZoomLevel = 0.5 | 1;

export const ZOOM_LEVELS: ZoomLevel[] = [
  0.5,
  1,
];

/**
 * Besar zoom-in digital untuk 1x di MODE VIRTUAL (kamera tanpa lensa
 * lebar asli, mis. laptop). 0.5x = 1 (frame penuh), 1x = angka ini.
 * Makin besar -> beda 0.5x vs 1x makin terasa, tapi 1x makin
 * "ke-crop". Aman di kisaran 1.3 - 2.
 */
export const VIRTUAL_ZOOM_1X = 1.5;

interface ZoomState {
  level: ZoomLevel;
  /** true kalau zoom-out saat ini dikerjakan oleh hardware kamera. */
  hardware: boolean;
  /**
   * Pembesaran digital yang sedang dipakai preview (>= 1), relatif
   * terhadap tampilan "cover" biasa. Dipakai useCamera saat capture
   * supaya foto == preview.
   */
  digital: number;
}

const state: ZoomState = {
  level: 1,
  hardware: false,
  digital: 1,
};

export function getZoomState(): ZoomState {
  return state;
}

export function resetZoomState() {
  state.level = 1;
  state.hardware = false;
  state.digital = 1;
}

/** Simpan pembesaran digital yang sedang tampil di preview. */
export function setDigitalZoom(
  value: number
) {
  state.digital =
    Number.isFinite(value) &&
    value > 0
      ? value
      : 1;
}

/** Tandai bahwa pelebaran sudah dikerjakan oleh kamera itu sendiri
 *  (zoom hardware / kamera Ultra Wide), jadi tidak perlu pelebaran
 *  digital tambahan saat preview maupun capture. */
export function markHardwareWide(
  value: boolean
) {
  state.hardware =
    value;
}

const BACK_CAMERA_LABEL =
  /back|rear|environment|belakang/i;

/**
 * Cari kamera fisik "Ultra Wide" DEPAN. Photobooth ini memakai kamera
 * selfie, jadi kamera Ultra Wide BELAKANG (mis. "Back Ultra Wide
 * Camera" di iPhone) sengaja diabaikan. Label kamera baru terbaca
 * setelah izin kamera diberikan, jadi panggil ini SETELAH stream jalan.
 */
export async function findUltraWideDeviceId(): Promise<string | null> {
  try {
    if (
      !navigator.mediaDevices
        ?.enumerateDevices
    ) {
      return null;
    }

    const devices =
      await navigator.mediaDevices.enumerateDevices();

    const wide =
      devices.find(
        (d) =>
          d.kind ===
            "videoinput" &&
          !!d.deviceId &&
          /ultra[\s-]?wide|\b0[.,]5\s?x?\b/i.test(
            d.label
          ) &&
          !BACK_CAMERA_LABEL.test(
            d.label
          )
      );

    return (
      wide?.deviceId ??
      null
    );
  } catch {
    return null;
  }
}

/**
 * Apakah kamera ini punya cara "asli" untuk melebar (zoom hardware
 * < 1x atau kamera Ultra Wide depan)? Kalau tidak -> MODE VIRTUAL.
 * Panggil SETELAH stream jalan (label kamera baru terbaca saat itu).
 */
export async function hasRealWideCamera(
  stream:
    | MediaStream
    | null
    | undefined
): Promise<boolean> {
  try {
    const track =
      stream?.getVideoTracks?.()[0];

    if (
      track &&
      typeof track.getCapabilities ===
        "function"
    ) {
      const caps =
        track.getCapabilities() as MediaTrackCapabilities & {
          zoom?: ZoomCapability;
        };

      if (
        typeof caps.zoom?.min ===
          "number" &&
        caps.zoom.min < 1
      ) {
        return true;
      }
    }
  } catch {
    // lanjut cek kamera Ultra Wide
  }

  return (
    (await findUltraWideDeviceId()) !==
    null
  );
}

/** ID kamera yang sedang dipakai stream (untuk cek sudah di Ultra Wide atau belum). */
export function getStreamDeviceId(
  stream:
    | MediaStream
    | null
    | undefined
): string | null {
  return (
    stream
      ?.getVideoTracks?.()[0]
      ?.getSettings?.()
      .deviceId ??
    null
  );
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
  stream:
    | MediaStream
    | null
    | undefined,
  level: ZoomLevel
): Promise<boolean> {
  state.level =
    level;

  state.hardware =
    false;

  const track =
    stream?.getVideoTracks?.()[0];

  if (
    !track ||
    typeof track.getCapabilities !==
      "function"
  ) {
    return false;
  }

  try {
    const caps =
      track.getCapabilities() as MediaTrackCapabilities & {
        zoom?: ZoomCapability;
      };

    const zoom =
      caps.zoom;

    if (
      !zoom ||
      typeof zoom.min !==
        "number"
    ) {
      return false;
    }

    if (
      level < 1 &&
      zoom.min < 1
    ) {
      const target =
        Math.max(
          level,
          zoom.min
        );

      await track.applyConstraints({
        zoom: target,
      } as MediaTrackConstraints);

      state.hardware =
        true;

      return true;
    }

    // Balik ke 1x (atau zoom terendah yang tersedia).
    await track.applyConstraints({
      zoom: Math.max(
        1,
        zoom.min
      ),
    } as MediaTrackConstraints);
  } catch {
    // Zoom tidak bisa diterapkan -> lanjut ke kamera Ultra Wide
    // atau fallback sensor 4:3 di WebcamView.
  }

  return false;
}
