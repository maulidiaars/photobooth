/**
 * Real AR face-tracking effects (Snapchat/Instagram style).
 *
 * A face landmark detector (see src/lib/faceLandmarker.ts) hands us ~468
 * normalized (0..1) points per video frame. This module turns those points
 * into head geometry (position, size, tilt) and draws each sticker effect
 * on a canvas so it actually follows the head: moves when the head moves,
 * rotates when the head tilts, and scales when the head gets closer/farther.
 */

export type FaceEffectId =
  | "love-hearts"
  | "ghost-love"
  | "cool-glasses"
  | "bunny"
  | "cat"
  | "princess"
  | "kiss"
  | "sparkle"
  | "devil"
  | "flowers";

/** Raw point straight from the face landmark model: normalized 0..1. */
export interface NormalizedPoint {
  x: number;
  y: number;
  z?: number;
}

/** A point already converted to on-canvas pixel space. */
export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * The face landmark model always runs on the raw, un-mirrored camera
 * frame. Both our live preview and the final captured photo are mirrored
 * (selfie view), so every point needs its x flipped before we use it —
 * this is the ONLY place mirroring happens, so live preview and the
 * baked-in photo always match pixel-for-pixel.
 */
export function toMirroredPixelPoints(
  landmarks: NormalizedPoint[],
  width: number,
  height: number
): PixelPoint[] {
  const pts: PixelPoint[] = new Array(landmarks.length);
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    if (!p) continue;
    pts[i] = { x: width - p.x * width, y: p.y * height };
  }
  return pts;
}

// Canonical MediaPipe Face Mesh landmark indices we rely on.
const IDX = {
  foreheadTop: 10,
  chin: 152,
  edgeA: 234,
  edgeB: 454,
  eyeA: 33,
  eyeB: 263,
  nose: 1,
  mouthTop: 13,
  mouthBottom: 14,
  cheekA: 205,
  cheekB: 425,
} as const;

export interface FaceGeometry {
  /** head roll angle in radians, from the eye line */
  angle: number;
  faceWidth: number;
  faceHeight: number;
  centerX: number;
  centerY: number;
  /** unit vector pointing from chin toward the top of the head */
  upX: number;
  upY: number;
  /** unit vector perpendicular to "up" (head's left/right axis) */
  sideX: number;
  sideY: number;
  eyeMidX: number;
  eyeMidY: number;
  eyeDist: number;
  noseX: number;
  noseY: number;
  cheekAX: number;
  cheekAY: number;
  cheekBX: number;
  cheekBY: number;
}

export function computeFaceGeometry(pts: PixelPoint[]): FaceGeometry | null {
  const top = pts[IDX.foreheadTop];
  const chin = pts[IDX.chin];
  const edgeA = pts[IDX.edgeA];
  const edgeB = pts[IDX.edgeB];
  const eyeA = pts[IDX.eyeA];
  const eyeB = pts[IDX.eyeB];
  const nose = pts[IDX.nose];
  const cheekA = pts[IDX.cheekA];
  const cheekB = pts[IDX.cheekB];

  if (!top || !chin || !edgeA || !edgeB || !eyeA || !eyeB || !nose) {
    return null;
  }

  const faceWidth = Math.hypot(edgeB.x - edgeA.x, edgeB.y - edgeA.y);
  const faceHeightRaw =
    Math.hypot(chin.x - top.x, chin.y - top.y) || faceWidth || 1;

  const upX = (top.x - chin.x) / faceHeightRaw;
  const upY = (top.y - chin.y) / faceHeightRaw;
  const sideX = -upY;
  const sideY = upX;

  const angle = Math.atan2(eyeB.y - eyeA.y, eyeB.x - eyeA.x);
  const eyeDist = Math.hypot(eyeB.x - eyeA.x, eyeB.y - eyeA.y);

  return {
    angle,
    faceWidth,
    faceHeight: faceHeightRaw,
    centerX: (edgeA.x + edgeB.x) / 2,
    centerY: (edgeA.y + edgeB.y) / 2,
    upX,
    upY,
    sideX,
    sideY,
    eyeMidX: (eyeA.x + eyeB.x) / 2,
    eyeMidY: (eyeA.y + eyeB.y) / 2,
    eyeDist,
    noseX: nose.x,
    noseY: nose.y,
    cheekAX: cheekA?.x ?? nose.x - faceWidth * 0.22,
    cheekAY: cheekA?.y ?? nose.y + faceWidth * 0.06,
    cheekBX: cheekB?.x ?? nose.x + faceWidth * 0.22,
    cheekBY: cheekB?.y ?? nose.y + faceWidth * 0.06,
  };
}

/** A point offset from the face center along the head's own axes, so it
 *  moves, rotates and scales together with the head. */
function alongHead(g: FaceGeometry, sideAmt: number, upAmt: number): PixelPoint {
  return {
    x: g.centerX + g.sideX * sideAmt + g.upX * upAmt,
    y: g.centerY + g.sideY * sideAmt + g.upY * upAmt,
  };
}

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  size: number,
  rotation = 0
) {
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  ctx.font = `${Math.max(10, size)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, 0, 0);
  ctx.restore();
}

/** A headband-style arc of glyphs across the top of the head — used for
 *  hearts, ghost+hearts, and the flower crown. */
function drawArcGlyphs(
  ctx: CanvasRenderingContext2D,
  g: FaceGeometry,
  t: number,
  glyphs: string[],
  sizeFactor: number,
  bigGlyph?: string,
  spanFactor = 0.7
) {
  const n = glyphs.length;
  for (let i = 0; i < n; i++) {
    const glyph = glyphs[i];
    if (!glyph) continue;
    const f = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
    const bob = Math.sin(t / 450 + i * 0.7) * g.faceHeight * 0.015;
    const up = g.faceHeight * (0.55 + (1 - Math.abs(f)) * 0.14) + bob;
    const side = f * g.faceWidth * spanFactor;
    const p = alongHead(g, side, up);
    const isBig = bigGlyph && glyph === bigGlyph;
    drawEmoji(
      ctx,
      glyph,
      p.x,
      p.y,
      g.faceWidth * (isBig ? sizeFactor * 1.2 : sizeFactor),
      g.angle
    );
  }
}

/** Glyphs orbiting all the way around the head (sparkle halo). */
function drawOrbitGlyphs(
  ctx: CanvasRenderingContext2D,
  g: FaceGeometry,
  t: number,
  glyphs: string[]
) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t / 2000;
    const rx = g.faceWidth * 0.95;
    const ry = g.faceHeight * 1.05;
    const side = Math.cos(a) * rx;
    const up = Math.sin(a) * ry * 0.5 + g.faceHeight * 0.25;
    const p = alongHead(g, side, up);
    const glyph = glyphs[i % glyphs.length];
    if (!glyph) continue;
    const twinkle = 0.85 + 0.25 * Math.sin(t / 300 + i * 2);
    drawEmoji(ctx, glyph, p.x, p.y, g.faceWidth * 0.11 * twinkle, 0);
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const halfEye = g.eyeDist * 0.42;
  const lensR = g.eyeDist * 0.3;

  ctx.save();
  ctx.translate(g.eyeMidX, g.eyeMidY);
  ctx.rotate(g.angle);

  ctx.fillStyle = "rgba(10,10,14,0.92)";
  ctx.strokeStyle = "rgba(20,20,20,0.9)";
  ctx.lineWidth = Math.max(2, lensR * 0.12);

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * halfEye, 0, lensR, lensR * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.moveTo(-halfEye + lensR * 0.8, 0);
  ctx.lineTo(halfEye - lensR * 0.8, 0);
  ctx.lineWidth = Math.max(2, lensR * 0.16);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(
      side * halfEye - lensR * 0.25,
      -lensR * 0.3,
      lensR * 0.28,
      lensR * 0.14,
      -0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  ctx.restore();
}

function drawBunnyEars(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const earLen = g.faceHeight * 0.55;
  const earW = g.faceWidth * 0.16;
  const spread = g.faceWidth * 0.32;

  [-1, 1].forEach((side) => {
    const base = alongHead(g, side * spread * 0.5, g.faceHeight * 0.55);
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.rotate(g.angle + side * 0.18);

    ctx.beginPath();
    ctx.moveTo(-earW / 2, 0);
    ctx.quadraticCurveTo(-earW * 0.65, -earLen * 0.6, 0, -earLen);
    ctx.quadraticCurveTo(earW * 0.65, -earLen * 0.6, earW / 2, 0);
    ctx.closePath();
    ctx.fillStyle = "#ffe4ec";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-earW * 0.22, -earLen * 0.15);
    ctx.quadraticCurveTo(-earW * 0.32, -earLen * 0.6, 0, -earLen * 0.85);
    ctx.quadraticCurveTo(earW * 0.32, -earLen * 0.6, earW * 0.22, -earLen * 0.15);
    ctx.closePath();
    ctx.fillStyle = "#ff9fb8";
    ctx.fill();

    ctx.restore();
  });
}

function drawCatEars(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const earH = g.faceHeight * 0.32;
  const earW = g.faceWidth * 0.24;
  const spread = g.faceWidth * 0.34;

  [-1, 1].forEach((side) => {
    const base = alongHead(g, side * spread * 0.5, g.faceHeight * 0.55);
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.rotate(g.angle + side * 0.12);

    ctx.beginPath();
    ctx.moveTo(-earW / 2, 0);
    ctx.lineTo(earW / 2, 0);
    ctx.lineTo(0, -earH);
    ctx.closePath();
    ctx.fillStyle = "#3a2a26";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-earW * 0.22, -earH * 0.08);
    ctx.lineTo(earW * 0.22, -earH * 0.08);
    ctx.lineTo(0, -earH * 0.72);
    ctx.closePath();
    ctx.fillStyle = "#e8a3ab";
    ctx.fill();

    ctx.restore();
  });

  // nose + whiskers
  ctx.save();
  ctx.translate(g.noseX, g.noseY);
  ctx.rotate(g.angle);

  ctx.fillStyle = "#3a2a26";
  ctx.beginPath();
  ctx.moveTo(-g.faceWidth * 0.03, 0);
  ctx.lineTo(g.faceWidth * 0.03, 0);
  ctx.lineTo(0, g.faceWidth * 0.035);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(30,20,18,0.75)";
  ctx.lineWidth = Math.max(1.4, g.faceWidth * 0.006);
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const yOff = (i - 1) * g.faceWidth * 0.028;
      ctx.beginPath();
      ctx.moveTo(side * g.faceWidth * 0.04, yOff);
      ctx.lineTo(side * g.faceWidth * 0.24, yOff * 1.3);
      ctx.stroke();
    }
  });

  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const w = g.faceWidth * 0.62;
  const h = g.faceHeight * 0.3;
  const base = alongHead(g, 0, g.faceHeight * 0.62);

  ctx.save();
  ctx.translate(base.x, base.y);
  ctx.rotate(g.angle);

  ctx.beginPath();
  ctx.moveTo(-w / 2, h * 0.35);
  ctx.lineTo(-w / 2, -h * 0.05);
  ctx.lineTo(-w * 0.25, -h * 0.55);
  ctx.lineTo(0, -h * 0.05);
  ctx.lineTo(w * 0.25, -h * 0.55);
  ctx.lineTo(w / 2, -h * 0.05);
  ctx.lineTo(w / 2, h * 0.35);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -h * 0.55, 0, h * 0.35);
  grad.addColorStop(0, "#fff3c4");
  grad.addColorStop(1, "#e8b84b");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#a97c1f";
  ctx.lineWidth = Math.max(1.5, w * 0.015);
  ctx.stroke();

  const jewelColors = ["#e0507a", "#5aa7e0", "#e0507a"];
  [-0.25, 0, 0.25].forEach((f, i) => {
    ctx.beginPath();
    ctx.arc(w * f, h * 0.05, w * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = jewelColors[i] ?? "#e0507a";
    ctx.fill();
  });

  ctx.restore();
}

function drawPrincess(ctx: CanvasRenderingContext2D, g: FaceGeometry, t: number) {
  drawCrown(ctx, g);
  const sparkles = [
    { f: -1.1, r: 1.55 },
    { f: 1.15, r: 1.45 },
    { f: -0.6, r: 0.85 },
    { f: 0.7, r: 0.95 },
  ];
  sparkles.forEach((s, i) => {
    const bob = Math.sin(t / 400 + i) * g.faceHeight * 0.02;
    const p = alongHead(
      g,
      s.f * g.faceWidth * 0.5,
      g.faceHeight * 0.1 * s.r + bob
    );
    drawEmoji(ctx, "✨", p.x, p.y, g.faceWidth * 0.12, g.angle);
  });
}

function drawKiss(ctx: CanvasRenderingContext2D, g: FaceGeometry, t: number) {
  const bob = Math.sin(t / 500) * g.faceHeight * 0.015;
  drawEmoji(ctx, "💋", g.cheekAX, g.cheekAY + bob, g.faceWidth * 0.16, g.angle);
  drawEmoji(ctx, "💋", g.cheekBX, g.cheekBY - bob, g.faceWidth * 0.16, g.angle);
}

function drawDevilHorns(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const spread = g.faceWidth * 0.34;
  const hh = g.faceHeight * 0.28;

  [-1, 1].forEach((side) => {
    const base = alongHead(g, side * spread * 0.5, g.faceHeight * 0.58);
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.rotate(g.angle + side * 0.35);

    ctx.beginPath();
    ctx.moveTo(-g.faceWidth * 0.05, 0);
    ctx.quadraticCurveTo(-g.faceWidth * 0.02, -hh * 0.6, g.faceWidth * 0.02, -hh);
    ctx.quadraticCurveTo(g.faceWidth * 0.06, -hh * 0.6, g.faceWidth * 0.05, 0);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -hh, 0, 0);
    grad.addColorStop(0, "#7a1414");
    grad.addColorStop(1, "#c93b3b");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  });
}

export function drawFaceEffect(
  ctx: CanvasRenderingContext2D,
  effectId: FaceEffectId,
  g: FaceGeometry,
  t: number
) {
  switch (effectId) {
    case "love-hearts":
      drawArcGlyphs(ctx, g, t, ["❤️", "💕", "❤️", "💕", "❤️"], 0.17, undefined, 0.72);
      return;
    case "ghost-love":
      drawArcGlyphs(
        ctx,
        g,
        t,
        ["🖤", "🤍", "👻", "🤍", "🖤", "👻", "🤍", "🖤"],
        0.12,
        "👻",
        0.88
      );
      return;
    case "cool-glasses":
      drawGlasses(ctx, g);
      return;
    case "bunny":
      drawBunnyEars(ctx, g);
      return;
    case "cat":
      drawCatEars(ctx, g);
      return;
    case "princess":
      drawPrincess(ctx, g, t);
      return;
    case "kiss":
      drawKiss(ctx, g, t);
      return;
    case "sparkle":
      drawOrbitGlyphs(ctx, g, t, ["✨", "⭐"]);
      return;
    case "devil":
      drawDevilHorns(ctx, g);
      return;
    case "flowers":
      drawArcGlyphs(ctx, g, t, ["🌸", "🌼", "🌸", "🌿", "🌼", "🌸"], 0.15, undefined, 0.78);
      return;
  }
}
