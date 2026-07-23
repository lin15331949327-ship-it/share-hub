"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseDraggableOptions {
  /** localStorage key for position persistence */
  storageKey: string;
  /** Width of the element (for boundary clamping). Default: element's offsetWidth */
  elementWidth?: number;
  /** Height of the element (for boundary clamping). Default: element's offsetHeight */
  elementHeight?: number;
  /** Minimum pixels moved before a drag is considered intentional. Default: 3 */
  moveThreshold?: number;
}

interface Position {
  left: number;
  top: number;
}

/**
 * Core drag-physics hook — shared by Navbar (snap + collapse) and DraggableToggle.
 *
 * Handles: pointer capture, offset calculation, boundary clamping, moved detection,
 * and localStorage persistence. Each consumer layers snap / collapse behavior on top
 * by composing `finishDrag` + `persist` in their own `onPointerUp`.
 */
export function useDraggablePosition<T extends HTMLElement = HTMLDivElement>(options: UseDraggableOptions) {
  const { storageKey, elementWidth, elementHeight, moveThreshold = 3 } = options;

  const elementRef = useRef<T>(null);
  const [pos, setPosState] = useState<Position | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Restore saved position on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.left !== undefined && data.top !== undefined) {
        setPosState({ left: data.left, top: data.top });
      }
    } catch {
      /* ignore corrupt data */
    }
  }, [storageKey]);

  /** Persist position (and any extra fields) to localStorage */
  const persist = useCallback(
    (p: Position, extra?: Record<string, unknown>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...p, ...extra }));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  /** Programmatic position set (triggers persist) */
  const setPos = useCallback(
    (p: Position | null) => {
      setPosState(p);
      if (p) persist(p);
    },
    [persist]
  );

  /** Get effective element dimensions */
  function effectiveSize(el: HTMLElement) {
    return {
      w: elementWidth ?? el.offsetWidth,
      h: elementHeight ?? el.offsetHeight,
    };
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = elementRef.current;
    if (!el) return;
    dragging.current = true;
    moved.current = false;
    const rect = el.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.style.cursor = "grabbing";
    el.style.transition = "none";
    // Switch from centered if needed (transform-based positioning)
    if (el.style.transform) {
      el.style.transform = "none";
      el.style.left = rect.left + "px";
      el.style.top = rect.top + "px";
    }
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const el = elementRef.current;
      if (!el) return;

      const x = e.clientX - offset.current.x;
      const y = e.clientY - offset.current.y;

      // Detect intentional drag
      if (
        Math.abs(x - parseInt(el.style.left || "0")) > moveThreshold ||
        Math.abs(y - parseInt(el.style.top || "0")) > moveThreshold
      ) {
        moved.current = true;
      }

      const { w, h } = effectiveSize(el);
      el.style.left = Math.max(0, Math.min(x, window.innerWidth - w)) + "px";
      el.style.top = Math.max(0, Math.min(y, window.innerHeight - h)) + "px";
    },
    [moveThreshold, elementWidth, elementHeight]
  );

  /**
   * Call at the start of the consumer's `onPointerUp`.
   * Resets drag state, restores cursor/transition, and returns the final position
   * if the user actually dragged. Returns null if it was just a click.
   */
  const finishDrag = useCallback((): Position | null => {
    const el = elementRef.current;
    if (!el) return null;
    dragging.current = false;
    el.style.cursor = "grab";
    el.style.transition = "all 400ms var(--ease-spring)";

    if (!moved.current) return null;

    const left = parseInt(el.style.left || "0");
    const top = parseInt(el.style.top || "0");
    setPosState({ left, top });
    return { left, top };
  }, []);

  return {
    elementRef,
    pos,
    setPos,
    moved,
    persist,
    onPointerDown,
    onPointerMove,
    finishDrag,
    effectiveSize,
  } as const;
}
