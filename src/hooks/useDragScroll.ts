"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Turns a scrollable container into a "grab and drag" slider for
 * mouse/pen users, on top of the native touch swipe touchscreens
 * already get for free (left alone here so it stays buttery-smooth
 * with momentum). Pair the target element with the `.no-scrollbar`
 * class so nothing but the drag itself hints that it's scrollable —
 * no visible track/thumb.
 *
 * `axis` picks which direction gets dragged: "x" (default) reads/
 * writes `scrollLeft` off horizontal pointer movement — the original
 * behaviour every existing call site still gets unchanged. "y" reads/
 * writes `scrollTop` off vertical pointer movement instead, for
 * vertical lists like the frame picker grid.
 *
 * Also swallows the click that would otherwise fire right after a
 * real drag, so dragging across a card doesn't accidentally select
 * it (only a "clean" tap/click does).
 */
export function useDragScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  axis: "x" | "y" = "x"
) {
  const state = useRef({ isDown: false, dragged: false, startPos: 0, startScroll: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!state.current.isDown) return;
      const pos = axis === "x" ? e.clientX : e.clientY;
      const delta = pos - state.current.startPos;
      if (Math.abs(delta) > 4) state.current.dragged = true;
      if (axis === "x") {
        el.scrollLeft = state.current.startScroll - delta;
      } else {
        el.scrollTop = state.current.startScroll - delta;
      }
    };

    const onPointerUp = () => {
      state.current.isDown = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    const onPointerDown = (e: PointerEvent) => {
      // Native touch scrolling already works great — only hijack
      // mouse/pen so we don't fight the browser's own touch physics.
      if (e.pointerType === "touch") return;
      if (e.button !== 0) return;

      // Without this, mousedown+move over any text/image inside the
      // slider starts the browser's own text-selection (or, for an
      // <img>, a native "ghost drag") instead of our drag — that
      // fight is what made dragging with the mouse feel completely
      // dead. Blocking the default here is what makes onPointerMove
      // below actually the one thing driving the scroll.
      e.preventDefault();

      state.current.isDown = true;
      state.current.dragged = false;
      state.current.startPos = axis === "x" ? e.clientX : e.clientY;
      state.current.startScroll = axis === "x" ? el.scrollLeft : el.scrollTop;

      // Deliberately NOT using el.setPointerCapture here — that
      // would retarget the eventual "click" event to this container
      // instead of whatever card is actually under the pointer,
      // which silently breaks selecting a frame on a plain click.
      // Tracking move/up on window instead keeps click hit-testing
      // completely untouched.
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (state.current.dragged) {
        e.stopPropagation();
        e.preventDefault();
        state.current.dragged = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, axis]);
}
