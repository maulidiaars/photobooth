export interface SlotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Groups detected rects into visual rows (by vertical center overlap) and
 * sorts each row left-to-right, so the resulting slot order matches how a
 * person would naturally read the frame (top-to-bottom, left-to-right).
 */
function sortInReadingOrder(rects: SlotRect[]): SlotRect[] {
  const byY = [...rects].sort((a, b) => a.y - b.y);
  const rows: SlotRect[][] = [];

  for (const rect of byY) {
    const centerY = rect.y + rect.h / 2;
    const row = rows.find((r) => {
      const ref = r[0];
      if (!ref) return false;
      const refCenterY = ref.y + ref.h / 2;
      const tolerance = Math.max(rect.h, ref.h) * 0.6;
      return Math.abs(centerY - refCenterY) < tolerance;
    });
    if (row) row.push(rect);
    else rows.push([rect]);
  }

  rows.forEach((row) => row.sort((a, b) => a.x - b.x));
  return rows.flat();
}

/**
 * Analyzes a transparent frame PNG and finds every distinct "hole"
 * (fully/mostly transparent region) using flood-fill connected-component
 * labeling on the alpha channel. Each hole becomes one photo slot, with
 * its exact position & size (as 0-1 fractions of the image) so a captured
 * photo can later be placed to fill that hole perfectly without spilling
 * outside it.
 *
 * The image is downsampled before analysis purely for performance — the
 * resulting rects are fractions (0-1), so precision is unaffected.
 */
export async function detectFrameSlots(file: File): Promise<SlotRect[]> {
  const img = await loadImageFromFile(file);

  const MAX_DIM = 700;
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context tidak didukung browser ini");
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const ALPHA_THRESHOLD = 25; // pixels with alpha below this count as "hole"
  const total = w * h;
  const visited = new Uint8Array(total);
  const isHole = (idx: number) => (data[idx * 4 + 3] ?? 0) < ALPHA_THRESHOLD;

  type RawRect = SlotRect & { touchesBorder: boolean };
  const rawRects: RawRect[] = [];

  for (let start = 0; start < total; start++) {
    if (visited[start] || !isHole(start)) continue;

    let minX = start % w;
    let maxX = minX;
    let minY = Math.floor(start / w);
    let maxY = minY;
    let touchesBorder = false;

    const stack: number[] = [start];
    visited[start] = 1;

    while (stack.length) {
      const idx = stack.pop() as number;
      const cx = idx % w;
      const cy = (idx - cx) / w;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      // A region that reaches the outer edge of the canvas is the
      // frame's *background* (or artwork like the bear/star/pin that
      // hangs outside the frame's own border), never a real photo
      // slot — a photo window is always fully enclosed by frame
      // artwork on every side.
      if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) {
        touchesBorder = true;
      }

      // 4-connected neighbors, careful not to wrap across row edges
      if (cx > 0) {
        const n = idx - 1;
        if (!visited[n] && isHole(n)) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (cx < w - 1) {
        const n = idx + 1;
        if (!visited[n] && isHole(n)) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (cy > 0) {
        const n = idx - w;
        if (!visited[n] && isHole(n)) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (cy < h - 1) {
        const n = idx + w;
        if (!visited[n] && isHole(n)) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    rawRects.push({
      x: minX / w,
      y: minY / h,
      w: (maxX - minX + 1) / w,
      h: (maxY - minY + 1) / h,
      touchesBorder,
    });
  }

  // Drop the outer background/decoration region(s) — anything connected
  // to the canvas edge — and ignore tiny transparent specks
  // (anti-aliasing noise, rounded artwork corners). A real photo slot is
  // fully enclosed AND a meaningful fraction of the whole frame.
  const MIN_AREA_FRACTION = 0.012;
  const meaningful = rawRects.filter(
    (r) => !r.touchesBorder && r.w * r.h >= MIN_AREA_FRACTION
  );

  if (meaningful.length === 0) {
    throw new Error(
      "Tidak ada area transparan yang terdeteksi. Pastikan file PNG memiliki lubang transparan untuk foto."
    );
  }

  // Shrink each rect very slightly so the composited photo sits just
  // inside the hole instead of bleeding onto the frame artwork edges.
  const INSET = 0.004;
  const inset = meaningful.map((r) => ({
    x: r.x + INSET,
    y: r.y + INSET,
    w: Math.max(0.01, r.w - INSET * 2),
    h: Math.max(0.01, r.h - INSET * 2),
  }));

  return sortInReadingOrder(inset);
}
