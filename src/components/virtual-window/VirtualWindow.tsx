import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import {
  createPreviewMatchMedia,
  type PreviewMediaQueryList,
  type MediaFeatureOverrides,
} from "./lib/createPreviewMatchMedia";
import { type DevicePreset, getDevicePreset } from "./lib/devicePresets";

export interface VirtualWindowSize {
  width: number;
  height: number;
}

export interface VirtualWindowPosition {
  x: number;
  y: number;
}

/**
 * Payload delivered to onExternalDrop / onExternalDragOver when a pointer
 * drag originating outside the VirtualWindow interacts with it.
 * x and y are preview-local coordinates (scale-compensated, origin = top-left
 * of the preview content area).
 */
export interface ExternalDropEvent {
  /** Preview-local X coordinate. */
  x: number;
  /** Preview-local Y coordinate. */
  y: number;
  /** The native PointerEvent that triggered the drop or drag-over. */
  nativeEvent: PointerEvent;
}

export interface VirtualWindowProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onResize?: (size: VirtualWindowSize) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  preset?: string | DevicePreset;
  showDeviceFrame?: boolean;
  draggable?: boolean;
  position?: VirtualWindowPosition;
  onPositionChange?: (position: VirtualWindowPosition) => void;
  dragHandle?: "window" | "header";
  /**
   * Static media feature overrides injected into the preview's matchMedia.
   * Use this to simulate dark mode, reduced motion, touch-only input, etc.
   *
   * @example
   * mediaFeatureOverrides={{ 'prefers-color-scheme': 'dark', hover: 'none', pointer: 'coarse' }}
   */
  mediaFeatureOverrides?: MediaFeatureOverrides;
  /**
   * Called when a registered external drag is released inside the window.
   * x/y are preview-local (scale-compensated) coordinates.
   * You must first call windowRef.current.registerExternalDrag(pointerId)
   * when your drag starts so VirtualWindow knows to watch for the drop.
   */
  onExternalDrop?: (event: ExternalDropEvent) => void;
  /**
   * Called on every pointermove while a registered external drag is over
   * the VirtualWindow. x/y are preview-local coordinates.
   */
  onExternalDragOver?: (event: ExternalDropEvent) => void;
  /**
   * Called when a registered external drag pointer leaves the window bounds.
   */
  onExternalDragLeave?: () => void;
}

export interface VirtualWindowRef {
  hostElement: HTMLDivElement | null;
  shadowRoot: ShadowRoot | null;
  getSize: () => VirtualWindowSize;
  resize: (width: number, height: number, skipCallback?: boolean) => void;
  addGlobalStyle: (css: string) => void;
  toLocalPoint: (
    event: PointerEvent | MouseEvent | React.PointerEvent | React.MouseEvent,
  ) => { x: number; y: number } | null;
  matchMedia: (query: string) => PreviewMediaQueryList;
  setScale: (scale: number, skipCallback?: boolean) => void;
  getScale: () => number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  exportAsImage: (options?: ExportImageOptions) => Promise<string>;
  downloadImage: (
    filename?: string,
    options?: ExportImageOptions,
  ) => Promise<void>;
  getPosition: () => VirtualWindowPosition;
  setPosition: (
    position: VirtualWindowPosition,
    skipCallback?: boolean,
  ) => void;
  centerInParent: () => void;
  /**
   * Returns true if the given client coordinates (e.g. from a PointerEvent)
   * fall within the visible bounds of the VirtualWindow host element.
   * Useful for implementing external drag-and-drop into the preview.
   */
  isPointInside: (clientX: number, clientY: number) => boolean;
  /**
   * Register an active external drag by its pointerId. Once registered,
   * VirtualWindow will fire onExternalDragOver and onExternalDrop callbacks
   * for this pointer until it is released or unregistered.
   */
  registerExternalDrag: (pointerId: number) => void;
  /**
   * Unregister an external drag without a drop (e.g. drag cancelled).
   */
  unregisterExternalDrag: (pointerId: number) => void;
}

export interface ExportImageOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  includeHandles?: boolean;
}

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const BASE_SHADOW_STYLES = `
  :host {
    display: block;
    position: relative;
  }

  .virtual-window-mount {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
  }

  .resize-handle {
    position: absolute;
    z-index: 10;
    touch-action: none;
  }

  .resize-handle.n,
  .resize-handle.s {
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
  }

  .resize-handle.n { top: -4px; }
  .resize-handle.s { bottom: -4px; }

  .resize-handle.e,
  .resize-handle.w {
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
  }

  .resize-handle.e { right: -4px; }
  .resize-handle.w { left: -4px; }

  .resize-handle.ne,
  .resize-handle.nw,
  .resize-handle.se,
  .resize-handle.sw {
    width: 12px;
    height: 12px;
  }

  .resize-handle.ne { top: -6px;    right: -6px;  cursor: nesw-resize; }
  .resize-handle.nw { top: -6px;    left: -6px;   cursor: nwse-resize; }
  .resize-handle.se { bottom: -6px; right: -6px;  cursor: nwse-resize; }
  .resize-handle.sw { bottom: -6px; left: -6px;   cursor: nesw-resize; }

  .resize-handle:hover  { background: rgba(59, 130, 246, 0.3); }
  .resize-handle:active { background: rgba(59, 130, 246, 0.5); }

  .resize-handle:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.8);
    outline-offset: 2px;
  }
`;

const RESIZE_HANDLES: ResizeHandle[] = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
];

const ARIA_LABELS: Record<ResizeHandle, string> = {
  n: "Resize from top",
  s: "Resize from bottom",
  e: "Resize from right",
  w: "Resize from left",
  ne: "Resize from top-right corner",
  nw: "Resize from top-left corner",
  se: "Resize from bottom-right corner",
  sw: "Resize from bottom-left corner",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VirtualWindow = forwardRef<VirtualWindowRef, VirtualWindowProps>(
  (
    {
      children,
      width: initialWidth = 375,
      height: initialHeight = 667,
      minWidth = 200,
      minHeight = 200,
      maxWidth = 2000,
      maxHeight = 2000,
      className,
      style,
      onResize,
      scale: controlledScale,
      onScaleChange,
      preset,
      showDeviceFrame = false,
      draggable = false,
      position: controlledPosition,
      onPositionChange,
      dragHandle = "window",
      mediaFeatureOverrides,
      onExternalDrop,
      onExternalDragOver,
      onExternalDragLeave,
    },
    ref,
  ) => {
    // ------------------------------------------------------------------
    // Resolve preset
    // ------------------------------------------------------------------
    const devicePreset =
      typeof preset === "string" ? getDevicePreset(preset) : preset;
    const presetWidth = devicePreset?.width ?? initialWidth;
    const presetHeight = devicePreset?.height ?? initialHeight;

    // ------------------------------------------------------------------
    // Refs
    // ------------------------------------------------------------------
    const hostRef = useRef<HTMLDivElement>(null);
    const shadowRootRef = useRef<ShadowRoot | null>(null);
    const mountNodeRef = useRef<HTMLDivElement | null>(null);
    const matchMediaRef = useRef<ReturnType<
      typeof createPreviewMatchMedia
    > | null>(null);

    // Tracks whether a resize initiated by a handle is in progress so we can
    // suppress the redundant ResizeObserver → onResize double-fire.
    const isHandleResizingRef = useRef(false);

    // Stable ref to onResize so the document-level resize effect never needs
    // to re-attach listeners just because the callback identity changed.
    const onResizeRef = useRef(onResize);
    useEffect(() => {
      onResizeRef.current = onResize;
    }, [onResize]);

    // Stable refs for external drag callbacks — avoids re-attaching the
    // document-level pointermove/pointerup listeners on every render.
    const onExternalDropRef = useRef(onExternalDrop);
    const onExternalDragOverRef = useRef(onExternalDragOver);
    const onExternalDragLeaveRef = useRef(onExternalDragLeave);
    useEffect(() => {
      onExternalDropRef.current = onExternalDrop;
    }, [onExternalDrop]);
    useEffect(() => {
      onExternalDragOverRef.current = onExternalDragOver;
    }, [onExternalDragOver]);
    useEffect(() => {
      onExternalDragLeaveRef.current = onExternalDragLeave;
    }, [onExternalDragLeave]);

    // Set of pointerIds currently registered as active external drags.
    const externalDragPointersRef = useRef<Set<number>>(new Set());
    // Tracks whether each active external drag pointer was last seen inside.
    const externalDragInsideRef = useRef<Map<number, boolean>>(new Map());

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    const [internalSize, setInternalSize] = useState({
      width: presetWidth,
      height: presetHeight,
    });
    const [internalScale, setInternalScale] = useState(controlledScale ?? 1);
    const [internalPosition, setInternalPosition] =
      useState<VirtualWindowPosition>(controlledPosition ?? { x: 0, y: 0 });

    // Drives the initial portal render after Shadow DOM is ready.
    const [shadowReady, setShadowReady] = useState(false);

    // ------------------------------------------------------------------
    // Derived values (controlled props take priority)
    // ------------------------------------------------------------------
    const size = devicePreset
      ? { width: devicePreset.width, height: devicePreset.height }
      : internalSize;
    const scale = controlledScale ?? internalScale;
    const position = controlledPosition ?? internalPosition;

    // ------------------------------------------------------------------
    // Sync internal size when preset changes
    // ------------------------------------------------------------------
    const prevPresetRef = useRef(devicePreset);
    useEffect(() => {
      if (devicePreset && devicePreset !== prevPresetRef.current) {
        prevPresetRef.current = devicePreset;
        setInternalSize({
          width: devicePreset.width,
          height: devicePreset.height,
        });
      }
    }, [devicePreset]);

    // ------------------------------------------------------------------
    // Resize handle state (stored in ref to avoid render thrashing)
    // ------------------------------------------------------------------
    const resizeStateRef = useRef<{
      isResizing: boolean;
      handle: ResizeHandle | null;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      capturedElement: HTMLElement | null;
    }>({
      isResizing: false,
      handle: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      capturedElement: null,
    });

    // ------------------------------------------------------------------
    // Drag (window-move) state
    // ------------------------------------------------------------------
    const dragStateRef = useRef<{
      isDragging: boolean;
      startX: number;
      startY: number;
      startPosX: number;
      startPosY: number;
    }>({
      isDragging: false,
      startX: 0,
      startY: 0,
      startPosX: 0,
      startPosY: 0,
    });

    // ------------------------------------------------------------------
    // Shadow DOM initialisation — runs once on mount
    // ------------------------------------------------------------------
    useEffect(() => {
      const host = hostRef.current;
      // Guard: host missing or shadow already attached (React Strict Mode double-invoke)
      if (!host || shadowRootRef.current) return;

      const shadow = host.attachShadow({ mode: "open" });

      const styleEl = document.createElement("style");
      styleEl.textContent = BASE_SHADOW_STYLES;
      shadow.appendChild(styleEl);

      const mount = document.createElement("div");
      mount.className = "virtual-window-mount";
      shadow.appendChild(mount);

      shadowRootRef.current = shadow;
      mountNodeRef.current = mount;

      // Trigger re-render so portals can be mounted.
      setShadowReady(true);
    }, []);

    // ------------------------------------------------------------------
    // ResizeObserver — detect externally-driven size changes
    // Note: we suppress the callback when the resize is handle-initiated
    // to prevent the onResize callback from firing twice.
    // ------------------------------------------------------------------
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;

          setInternalSize((prev) => {
            if (prev.width === width && prev.height === height) return prev;
            const newSize = { width, height };
            // Only fire the callback for externally-driven changes
            if (!isHandleResizingRef.current) {
              onResize?.(newSize);
            }
            return newSize;
          });
        }
      });

      ro.observe(host);
      return () => ro.disconnect();
    }, [onResize]);

    // ------------------------------------------------------------------
    // matchMedia initialisation
    // ------------------------------------------------------------------
    useEffect(() => {
      const host = hostRef.current;
      if (!host || matchMediaRef.current) return;

      matchMediaRef.current = createPreviewMatchMedia(
        host,
        mediaFeatureOverrides ?? {},
      );

      return () => {
        matchMediaRef.current?.destroy();
        matchMediaRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync mediaFeatureOverrides changes to the running instance
    useEffect(() => {
      if (matchMediaRef.current && mediaFeatureOverrides) {
        matchMediaRef.current.setOverrides(mediaFeatureOverrides);
      }
    }, [mediaFeatureOverrides]);

    // ------------------------------------------------------------------
    // Status bar clock (updates every minute when device frame is shown)
    // ------------------------------------------------------------------
    const [clockTime, setClockTime] = useState(() =>
      new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    );

    useEffect(() => {
      if (!showDeviceFrame) return;

      const tick = () => {
        setClockTime(
          new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        );
      };

      // Align to the next minute boundary for accuracy
      const now = new Date();
      const msUntilNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      let intervalId: ReturnType<typeof setInterval>;
      const timeoutId = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, 60_000);
      }, msUntilNextMinute);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }, [showDeviceFrame]);

    // ------------------------------------------------------------------
    // Resize handle event handlers
    // Uses document-level listeners (same pattern as drag) to avoid the
    // pointer-capture release bug when events cross shadow DOM boundaries.
    // ------------------------------------------------------------------
    const handleResizePointerDown =
      (handle: ResizeHandle) => (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        isHandleResizingRef.current = true;

        resizeStateRef.current = {
          isResizing: true,
          handle,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: size.width,
          startHeight: size.height,
          capturedElement: target,
        };
      };

    // Keyboard resize support for accessibility
    const handleResizeKeyDown =
      (handle: ResizeHandle) => (e: React.KeyboardEvent) => {
        const STEP = e.shiftKey ? 10 : 1;
        let dw = 0;
        let dh = 0;

        if (e.key === "ArrowRight") {
          dw = handle.includes("e") ? STEP : handle.includes("w") ? -STEP : 0;
        }
        if (e.key === "ArrowLeft") {
          dw = handle.includes("e") ? -STEP : handle.includes("w") ? STEP : 0;
        }
        if (e.key === "ArrowDown") {
          dh = handle.includes("s") ? STEP : handle.includes("n") ? -STEP : 0;
        }
        if (e.key === "ArrowUp") {
          dh = handle.includes("s") ? -STEP : handle.includes("n") ? STEP : 0;
        }

        if (dw === 0 && dh === 0) return;
        e.preventDefault();

        setInternalSize((prev) => ({
          width: Math.max(minWidth, Math.min(maxWidth, prev.width + dw)),
          height: Math.max(minHeight, Math.min(maxHeight, prev.height + dh)),
        }));
      };

    // ------------------------------------------------------------------
    // Document-level pointer events for resize
    // ------------------------------------------------------------------
    useEffect(() => {
      const onMove = (e: PointerEvent) => {
        const state = resizeStateRef.current;
        if (!state.isResizing || !state.handle) return;

        const deltaX = e.clientX - state.startX;
        const deltaY = e.clientY - state.startY;

        let newWidth = state.startWidth;
        let newHeight = state.startHeight;

        if (state.handle.includes("e")) newWidth = state.startWidth + deltaX;
        if (state.handle.includes("w")) newWidth = state.startWidth - deltaX;
        if (state.handle.includes("s")) newHeight = state.startHeight + deltaY;
        if (state.handle.includes("n")) newHeight = state.startHeight - deltaY;

        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        const newSize = { width: newWidth, height: newHeight };
        setInternalSize(newSize);
        onResizeRef.current?.(newSize);
      };

      const onUp = (e: PointerEvent) => {
        const state = resizeStateRef.current;
        if (!state.isResizing) return;

        state.capturedElement?.releasePointerCapture(e.pointerId);

        resizeStateRef.current = {
          isResizing: false,
          handle: null,
          startX: 0,
          startY: 0,
          startWidth: 0,
          startHeight: 0,
          capturedElement: null,
        };

        isHandleResizingRef.current = false;
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
    }, [minWidth, maxWidth, minHeight, maxHeight]);

    // ------------------------------------------------------------------
    // External drag-and-drop tracking
    // Listens for document-level pointermove/pointerup for any pointer that
    // has been registered via registerExternalDrag(). On move it fires
    // onExternalDragOver (when inside) or onExternalDragLeave (on exit).
    // On pointerup inside, it fires onExternalDrop.
    // ------------------------------------------------------------------
    useEffect(() => {
      const onMove = (e: PointerEvent) => {
        if (!externalDragPointersRef.current.has(e.pointerId)) return;

        const host = hostRef.current;
        if (!host) return;

        const rect = host.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        const wasInside =
          externalDragInsideRef.current.get(e.pointerId) ?? false;

        if (inside) {
          const localX = (e.clientX - rect.left) / scale;
          const localY = (e.clientY - rect.top) / scale;
          onExternalDragOverRef.current?.({
            x: localX,
            y: localY,
            nativeEvent: e,
          });
        } else if (wasInside) {
          onExternalDragLeaveRef.current?.();
        }

        externalDragInsideRef.current.set(e.pointerId, inside);
      };

      const onUp = (e: PointerEvent) => {
        if (!externalDragPointersRef.current.has(e.pointerId)) return;

        const host = hostRef.current;
        if (host) {
          const rect = host.getBoundingClientRect();
          const inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;

          if (inside) {
            const localX = (e.clientX - rect.left) / scale;
            const localY = (e.clientY - rect.top) / scale;
            onExternalDropRef.current?.({
              x: localX,
              y: localY,
              nativeEvent: e,
            });
          }
        }

        externalDragPointersRef.current.delete(e.pointerId);
        externalDragInsideRef.current.delete(e.pointerId);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
    }, [scale]);

    // ------------------------------------------------------------------
    // Drag (window-move) handlers
    // ------------------------------------------------------------------
    const handleDragStart = (e: React.PointerEvent) => {
      if (!draggable) return;

      // Determine true event target across Shadow DOM boundary
      const composed = e.nativeEvent.composedPath?.() ?? [];
      const target = (
        composed.length > 0 ? composed[0] : e.target
      ) as HTMLElement;

      // Don't drag if the composed path contains a resize handle
      const hitResizeHandle = composed.some((el) =>
        (el as HTMLElement).classList?.contains?.("resize-handle"),
      );
      if (hitResizeHandle) return;

      // Don't drag interactive children
      const tag = target.tagName?.toLowerCase();
      if (["button", "input", "select", "textarea", "a"].includes(tag)) return;

      const role = target.getAttribute?.("role");
      if (role === "button" || role === "link") return;

      // Don't drag pointer-cursor elements (unless it's the host itself)
      if (
        target !== e.currentTarget &&
        (target.style.cursor === "pointer" ||
          window.getComputedStyle(target).cursor === "pointer")
      ) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    };

    // ------------------------------------------------------------------
    // Document-level pointer events for drag
    // ------------------------------------------------------------------
    useEffect(() => {
      if (!draggable) return;

      const onMove = (e: PointerEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging) return;

        const newPosition = {
          x: state.startPosX + (e.clientX - state.startX),
          y: state.startPosY + (e.clientY - state.startY),
        };

        setInternalPosition(newPosition);
        onPositionChange?.(newPosition);
      };

      const onUp = (e: PointerEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging) return;

        hostRef.current?.releasePointerCapture(e.pointerId);

        dragStateRef.current = {
          isDragging: false,
          startX: 0,
          startY: 0,
          startPosX: 0,
          startPosY: 0,
        };
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
    }, [draggable, onPositionChange]);

    // ------------------------------------------------------------------
    // exportAsImage
    //
    // Runs html2canvas directly on the live content element inside the
    // shadow mount node — the same element that is already positioned and
    // painted on screen. This is the only approach that reliably produces
    // a non-blank capture, because html2canvas uses getBoundingClientRect
    // to locate what to rasterise; elements that are off-screen or inside
    // a cloned detached subtree produce blank output.
    //
    // The shadow DOM boundary is not a problem here: html2canvas receives
    // the actual rendered child element (not the shadow host), so it sees
    // real layout geometry and rendered pixels.
    // ------------------------------------------------------------------
    const exportAsImageImpl = async (
      options: ExportImageOptions = {},
    ): Promise<string> => {
      const {
        format = "png",
        quality = 0.92,
        backgroundColor = "#ffffff",
        scale: exportScale = 1,
        includeHandles = false,
      } = options;

      const host = hostRef.current;
      if (!host) {
        throw new Error("VirtualWindow: Host element not available for export");
      }

      const mountNode = mountNodeRef.current;
      if (!mountNode) {
        throw new Error("VirtualWindow: Mount node not available for export");
      }

      try {
        // Temporarily hide resize handles if not included in the export
        let savedHandleDisplay: string[] = [];
        if (!includeHandles && shadowRootRef.current) {
          const handleEls =
            shadowRootRef.current.querySelectorAll(".resize-handle");
          savedHandleDisplay = Array.from(handleEls).map((el) => {
            const h = el as HTMLElement;
            const prev = h.style.display;
            h.style.display = "none";
            return prev;
          });
        }

        // Target the first rendered child of the mount node.
        // Using the child (rather than mountNode itself) excludes the
        // mount node's own scrollbar from the captured area.
        const contentEl =
          (mountNode.firstElementChild as HTMLElement) || mountNode;

        // Temporarily remove overflow so no scrollbar appears in the capture
        const prevOverflow = mountNode.style.overflow;
        mountNode.style.overflow = "visible";

        const canvas = await html2canvas(contentEl, {
          backgroundColor,
          scale: exportScale,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: size.width,
          height: size.height,
          windowWidth: size.width,
          windowHeight: size.height,
          x: 0,
          y: 0,
        });

        // Restore
        mountNode.style.overflow = prevOverflow;

        if (!includeHandles && shadowRootRef.current) {
          const handleEls =
            shadowRootRef.current.querySelectorAll(".resize-handle");
          Array.from(handleEls).forEach((el, i) => {
            (el as HTMLElement).style.display = savedHandleDisplay[i] ?? "";
          });
        }

        const mimeType =
          format === "png"
            ? "image/png"
            : format === "jpeg"
              ? "image/jpeg"
              : "image/webp";

        return canvas.toDataURL(mimeType, quality);
      } catch (error) {
        console.error("VirtualWindow: Export failed", error);
        throw new Error(
          `Failed to export image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    };

    // ------------------------------------------------------------------
    // Imperative ref API
    // ------------------------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        hostElement: hostRef.current,
        shadowRoot: shadowRootRef.current,

        getSize: () => size,

        resize: (width: number, height: number, skipCallback = false) => {
          if (!devicePreset) {
            const newSize = { width, height };
            setInternalSize(newSize);
            if (!skipCallback) onResize?.(newSize);
          }
        },

        addGlobalStyle: (css: string) => {
          const shadow = shadowRootRef.current;
          if (!shadow) {
            console.warn(
              "VirtualWindow: Cannot add styles before shadow root is initialised",
            );
            return;
          }
          const styleEl = document.createElement("style");
          styleEl.textContent = css;
          shadow.appendChild(styleEl);
        },

        toLocalPoint: (event) => {
          const host = hostRef.current;
          if (!host) return null;

          const rect = host.getBoundingClientRect();
          const clientX =
            "clientX" in event ? (event as PointerEvent).clientX : 0;
          const clientY =
            "clientY" in event ? (event as PointerEvent).clientY : 0;

          return {
            x: (clientX - rect.left) / scale,
            y: (clientY - rect.top) / scale,
          };
        },

        matchMedia: (query: string) => {
          if (!matchMediaRef.current) {
            console.warn("VirtualWindow: matchMedia not yet initialised");
            return {
              media: query,
              matches: false,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              addListener: () => {},
              removeListener: () => {},
            } as PreviewMediaQueryList;
          }
          return matchMediaRef.current.matchMedia(query);
        },

        setScale: (newScale: number, skipCallback = false) => {
          const clamped = Math.max(0.1, Math.min(5, newScale));
          setInternalScale(clamped);
          if (!skipCallback) onScaleChange?.(clamped);
        },

        getScale: () => scale,

        zoomIn: () => {
          const next = Math.min(5, Math.round((scale + 0.1) * 10) / 10);
          setInternalScale(next);
          onScaleChange?.(next);
        },

        zoomOut: () => {
          const next = Math.max(0.1, Math.round((scale - 0.1) * 10) / 10);
          setInternalScale(next);
          onScaleChange?.(next);
        },

        resetZoom: () => {
          setInternalScale(1);
          onScaleChange?.(1);
        },

        // Fixed: calls the local implementation directly (no circular ref issue)
        exportAsImage: exportAsImageImpl,

        // Fixed: calls local impl instead of `(ref as any).current?.exportAsImage`
        downloadImage: async (
          filename?: string,
          options: ExportImageOptions = {},
        ) => {
          const dataUrl = await exportAsImageImpl(options);
          const ext = options.format ?? "png";
          const name = filename ?? `virtual-window-${Date.now()}.${ext}`;
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },

        getPosition: () => position,

        setPosition: (
          newPosition: VirtualWindowPosition,
          skipCallback = false,
        ) => {
          setInternalPosition(newPosition);
          if (!skipCallback) onPositionChange?.(newPosition);
        },

        centerInParent: () => {
          const host = hostRef.current;
          if (!host?.parentElement) return;

          const parentRect = host.parentElement.getBoundingClientRect();
          const centeredPosition = {
            x: (parentRect.width - size.width * scale) / 2,
            y: (parentRect.height - size.height * scale) / 2,
          };

          setInternalPosition(centeredPosition);
          onPositionChange?.(centeredPosition);
        },

        isPointInside: (clientX: number, clientY: number): boolean => {
          const host = hostRef.current;
          if (!host) return false;
          const rect = host.getBoundingClientRect();
          return (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          );
        },

        registerExternalDrag: (pointerId: number) => {
          externalDragPointersRef.current.add(pointerId);
          externalDragInsideRef.current.set(pointerId, false);
        },

        unregisterExternalDrag: (pointerId: number) => {
          externalDragPointersRef.current.delete(pointerId);
          externalDragInsideRef.current.delete(pointerId);
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        shadowReady,
        size,
        scale,
        position,
        onScaleChange,
        onResize,
        onPositionChange,
        devicePreset,
      ],
    );

    // ------------------------------------------------------------------
    // Render helpers
    // ------------------------------------------------------------------
    const renderDeviceFrame = () => {
      if (!showDeviceFrame || !devicePreset || !shadowRootRef.current)
        return null;
      const chrome = devicePreset.chrome;
      if (!chrome) return null;

      const { hasNotch } = devicePreset;
      const topH = chrome.top ?? 0;
      const botH = chrome.bottom ?? 0;

      return createPortal(
        <>
          {topH > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: `${topH}px`,
                background: hasNotch
                  ? "linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)"
                  : "#000",
                color: "#fff",
                fontSize: "12px",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui',
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                paddingTop: hasNotch ? "8px" : "4px",
                boxSizing: "border-box",
                zIndex: 10000,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <span style={{ opacity: 0.9 }}>{clockTime}</span>

              {hasNotch && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "160px",
                    height: "30px",
                    background: "#000",
                    borderRadius: "0 0 18px 18px",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  opacity: 0.9,
                }}
              >
                {/* Signal bars */}
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                  <rect
                    x="1"
                    y="2"
                    width="4"
                    height="8"
                    rx="1"
                    fill="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="7"
                    y="1"
                    width="4"
                    height="10"
                    rx="1"
                    fill="currentColor"
                    opacity="0.7"
                  />
                  <rect
                    x="13"
                    y="0"
                    width="4"
                    height="12"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
                {/* Battery */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <rect
                    x="1"
                    y="1"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <rect x="15" y="4" width="1" height="4" fill="currentColor" />
                  <rect
                    x="2.5"
                    y="2.5"
                    width="9"
                    height="7"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          )}

          {botH > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: `${botH}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(0deg, #000 0%, transparent 100%)",
                zIndex: 10000,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "5px",
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: "3px",
                  marginBottom: "8px",
                }}
              />
            </div>
          )}
        </>,
        shadowRootRef.current,
      );
    };

    const renderHandles = () => {
      if (!shadowReady || !shadowRootRef.current) return null;

      return createPortal(
        <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle}
              className={`resize-handle ${handle}`}
              tabIndex={0}
              role="separator"
              aria-label={ARIA_LABELS[handle]}
              onPointerDown={handleResizePointerDown(handle)}
              onKeyDown={handleResizeKeyDown(handle)}
            />
          ))}
        </>,
        shadowRootRef.current,
      );
    };

    const renderContent = () => {
      if (!shadowReady || !mountNodeRef.current) return null;
      return createPortal(children, mountNodeRef.current);
    };

    // ------------------------------------------------------------------
    // Host element styles
    // ------------------------------------------------------------------
    const isDeviceStyled = showDeviceFrame && !!devicePreset;
    const hostStyle: React.CSSProperties = {
      width: size.width,
      height: size.height,
      border: isDeviceStyled ? "8px solid #1a1a1a" : "1px solid #e5e7eb",
      borderRadius: isDeviceStyled ? "32px" : "8px",
      boxShadow: isDeviceStyled
        ? "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset"
        : "0 4px 6px -1px rgba(0,0,0,0.1)",
      backgroundColor: "white",
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      position: draggable || controlledPosition ? "absolute" : "relative",
      left: draggable || controlledPosition ? position.x : undefined,
      top: draggable || controlledPosition ? position.y : undefined,
      cursor: draggable && dragHandle === "window" ? "move" : undefined,
      overflow: isDeviceStyled ? "hidden" : undefined,
      ...style,
    };

    return (
      <div
        ref={hostRef}
        className={className}
        style={hostStyle}
        onPointerDown={
          draggable && dragHandle === "window" ? handleDragStart : undefined
        }
      >
        {renderDeviceFrame()}
        {renderHandles()}
        {renderContent()}
      </div>
    );
  },
);

VirtualWindow.displayName = "VirtualWindow";

export default VirtualWindow;
