"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Turns a horizontally-scrollable container into a "grab and drag"
 * slider for mouse/pen users, on top of the native touch swipe
 * touchscreens already get for free (left alone here so it stays
 * buttery-smooth with momentum). Pair the target element with the
 * `.no-scrollbar` class so nothing but the drag itself hints that
 * it's scrollable — no visible track/thumb.
 *
 * Also swallows the click that would otherwise fire right after a
 * real drag, so dragging across a card doesn't accidentally select
 * it (only a "clean" tap/click does).
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  const state = useRef({ isDown: false, dragged: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!state.current.isDown) return;
      const delta = e.clientX - state.current.startX;
      if (Math.abs(delta) > 4) state.current.dragged = true;
      el.scrollLeft = state.current.startScroll - delta;
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

      state.current.isDown = true;
      state.current.dragged = false;
      state.current.startX = e.clientX;
      state.current.startScroll = el.scrollLeft;

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
  }, [ref]);
}