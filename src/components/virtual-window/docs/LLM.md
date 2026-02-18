# VirtualWindow - LLM Context Documentation

## Purpose

This document provides comprehensive technical context for Large Language Models (LLMs) to understand, modify, extend, and debug the VirtualWindow React component. VirtualWindow is a production-ready component for creating isolated preview environments with Shadow DOM encapsulation and React Portal integration, designed for page builders, design tools, and sandboxed component previews.

## Core Concept

VirtualWindow solves a fundamental problem: **How do you preview a React component in complete isolation (no style leakage) while preserving all React functionality (context, hooks, events)?**

**Solution:** Shadow DOM + React Portals

- **Shadow DOM** provides style encapsulation (CSS can't leak in or out)
- **React Portals** render children inside the shadow root while maintaining React context

**Result:** Children render in an isolated environment but behave as if they're in the normal React tree.

---

## File Structure

```text
vitual-window-react/
├── __tests__/
│   ├── virtual-window/
│   │   ├── createPreviewMatchMedia.test.ts         # Test file for the createPreviewMatchMedia functions
│   │   ├── devicePresets.test.ts                   # Test file for the device presets
│   │   ├── VirtualWindow.drag.test.tsx             # Test Main component — Testing drag
│   │   ├── VirtualWindow.export.test.tsx           # Test Main component — Testing screenshot and export
│   │   ├── VirtualWindow.scale.presets.test.tsx    # Test Main component — Testing size, scale, and preset preview
│   │   └── VirtualWindow.test.tsx                  # Test Main component — Testing main component and features
│   │
│   └── setup.ts
│
└── src/
    └── features/
        └── virtual-window/
            ├── VirtualWindow.tsx                   # Main component — the only file consumers import directly
            ├── demos/
            │   ├── AdvancedDemo.tsx                # Advanced demo
            │   ├── AdvancedFeaturesDemo.tsx        # Advanced demo with advanced features
            │   ├── Demo.tsx                        # Basic demo
            │   ├── DragIntoWindowDemo.tsx          # Drag components into window demo
            │   ├── DragWithSortableDemo.tsx        # Drag into window containing sortable list
            │   ├── GSAPParallaxDemo.tsx            # GSAP Parallax integration demo
            │   ├── NestedContainerDemo.tsx         # Nested container blocks demo
            │   ├── ScaleAndPresetsDemo.tsx         # Window scale with presets demo
            │   └── ScreenshotExportDemo.tsx        # Screenshot export demo
            │
            ├── docs/
            │   ├── ANIMATION_INTEGRATION.md        # Animation library integration documentation
            │   ├── API_REFERENCE.md                # API references documentation
            │   ├── ARCHITECTURE.md                 # Architecture of project documentation
            │   ├── CHANGELOG.md                    # Changes to the project
            │   ├── CONTRIBUTING.md                 # Contribution instructions documentation
            │   ├── EXAMPLES.md                     # Examples documentation
            │   ├── FAQ.md                          # Frequent questions documentation
            │   ├── LLM.md                          # Context and instructions for LLM documentation
            │   ├── MISSING_FEATURES.md             # Missing features documentation
            │   ├── PROJECT_SUMMARY.md              # Project summary documentation
            │   ├── README.md                       # Project descriptor documentation
            │   ├── TEST_DOCUMENTATION.md           # Testing documentation
            │   └── TROUBLESHOOTING.md              # Troubleshooting documentation
            │
            ├── hooks/
            │   └── usePreviewMatchMedia.ts         # React hook wrapping the above
            │
            └── lib/
                ├── createPreviewMatchMedia.ts      # matchMedia emulation engine (no React dependency)
                └── devicePresets.ts                # Static device dimension data
```

---

## TypeScript Interfaces

### Core Types

```typescript
interface VirtualWindowSize {
  width: number; // Logical pixels
  height: number; // Logical pixels
}

interface VirtualWindowPosition {
  x: number; // CSS pixels from parent's top-left
  y: number;
}

interface ExternalDropEvent {
  x: number; // Preview-local X (scale-compensated)
  y: number; // Preview-local Y (scale-compensated)
  nativeEvent: PointerEvent;
}

interface DevicePreset {
  width: number;
  height: number;
  pixelRatio: number;
  displayName: string;
  category: "mobile" | "tablet" | "desktop";
  userAgent?: string;
  chrome?: {
    // Device chrome (status bar, home indicator)
    top?: number;
    bottom?: number;
  };
  hasNotch?: boolean;
}

interface MediaFeatureOverrides {
  "prefers-color-scheme"?: "light" | "dark";
  "prefers-reduced-motion"?: "no-preference" | "reduce";
  "prefers-contrast"?: "no-preference" | "more" | "less";
  hover?: "none" | "hover";
  pointer?: "none" | "coarse" | "fine";
}

interface ExportImageOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number; // 0-1 for JPEG/WebP
  backgroundColor?: string; // CSS color
  scale?: number; // Resolution multiplier
  includeHandles?: boolean; // Include resize handles in export
}
```

### Complete Props Interface

```typescript
interface VirtualWindowProps {
  // === Dimensions ===
  width?: number; // Default: 375
  height?: number; // Default: 667
  minWidth?: number; // Default: 200
  minHeight?: number; // Default: 200
  maxWidth?: number; // Default: 2000
  maxHeight?: number; // Default: 2000

  // === Device Preset ===
  preset?: string | DevicePreset; // Preset name or custom config
  showDeviceFrame?: boolean; // Show status bar/home indicator

  // === Visual Scale ===
  scale?: number; // Transform scale (default: 1)
  onScaleChange?: (scale: number) => void;

  // === Interaction ===
  draggable?: boolean; // Enable window dragging
  dragHandle?: "window" | "header"; // What can be dragged
  position?: VirtualWindowPosition;
  onPositionChange?: (position: VirtualWindowPosition) => void;

  // === Callbacks ===
  onResize?: (size: VirtualWindowSize) => void;

  // === Media Query Simulation ===
  mediaFeatureOverrides?: MediaFeatureOverrides;

  // === External Drag-and-Drop ===
  onExternalDrop?: (event: ExternalDropEvent) => void;
  onExternalDragOver?: (event: ExternalDropEvent) => void;
  onExternalDragLeave?: () => void;

  // === Standard ===
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

### Complete Ref Interface

```typescript
interface VirtualWindowRef {
  // === Core DOM Access ===
  hostElement: HTMLDivElement | null;
  shadowRoot: ShadowRoot | null;

  // === Size Management ===
  getSize: () => VirtualWindowSize;
  resize: (width: number, height: number, skipCallback?: boolean) => void;

  // === Scale/Zoom ===
  getScale: () => number;
  setScale: (scale: number, skipCallback?: boolean) => void;
  zoomIn: () => void; // Increment by 0.1
  zoomOut: () => void; // Decrement by 0.1
  resetZoom: () => void; // Set to 1.0

  // === Position ===
  getPosition: () => VirtualWindowPosition;
  setPosition: (
    position: VirtualWindowPosition,
    skipCallback?: boolean,
  ) => void;
  centerInParent: () => void;

  // === Styling ===
  addGlobalStyle: (css: string) => void; // Inject CSS into shadow root

  // === Coordinate Transformation ===
  toLocalPoint: (
    event: PointerEvent | MouseEvent | React.PointerEvent,
  ) => { x: number; y: number } | null;
  isPointInside: (clientX: number, clientY: number) => boolean;

  // === Media Queries ===
  matchMedia: (query: string) => PreviewMediaQueryList;
  setOverrides: (overrides: MediaFeatureOverrides) => void;

  // === Export ===
  exportAsImage: (options?: ExportImageOptions) => Promise<string>; // Returns data URL
  downloadImage: (
    filename?: string,
    options?: ExportImageOptions,
  ) => Promise<void>;

  // === External Drag-and-Drop ===
  registerExternalDrag: (pointerId: number) => void;
  unregisterExternalDrag: (pointerId: number) => void;
}
```

---

## Device Presets

All 15 presets with exact dimensions:

```typescript
const DEVICE_PRESETS = {
  // === Mobile ===
  "iphone-15-pro": {
    width: 393,
    height: 852,
    pixelRatio: 3,
    category: "mobile",
    hasNotch: true,
  },
  "iphone-15-pro-max": {
    width: 430,
    height: 932,
    pixelRatio: 3,
    category: "mobile",
    hasNotch: true,
  },
  "iphone-se": { width: 375, height: 667, pixelRatio: 2, category: "mobile" },
  "pixel-7": { width: 412, height: 915, pixelRatio: 2.625, category: "mobile" },
  "pixel-7-pro": {
    width: 412,
    height: 892,
    pixelRatio: 3.5,
    category: "mobile",
  },
  "galaxy-s23": { width: 360, height: 780, pixelRatio: 3, category: "mobile" },
  "galaxy-s23-ultra": {
    width: 384,
    height: 854,
    pixelRatio: 3.5,
    category: "mobile",
  },

  // === Tablet ===
  "ipad-pro-11": {
    width: 834,
    height: 1194,
    pixelRatio: 2,
    category: "tablet",
  },
  "ipad-pro-13": {
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    category: "tablet",
  },
  "ipad-air": { width: 820, height: 1180, pixelRatio: 2, category: "tablet" },
  "ipad-mini": { width: 744, height: 1133, pixelRatio: 2, category: "tablet" },
  "galaxy-tab-s9": {
    width: 800,
    height: 1280,
    pixelRatio: 2,
    category: "tablet",
  },

  // === Desktop ===
  "macbook-air": {
    width: 1280,
    height: 832,
    pixelRatio: 2,
    category: "desktop",
  },
  "macbook-pro-14": {
    width: 1512,
    height: 982,
    pixelRatio: 2,
    category: "desktop",
  },
  "macbook-pro-16": {
    width: 1728,
    height: 1117,
    pixelRatio: 2,
    category: "desktop",
  },
};
```

**Important:** Preset names are exact strings. Do NOT invent names like `"iphone-14-pro"` or `"iphone-15"`. Use only the 15 presets listed above.

---

## matchMedia Syntax Reference

The `matchMedia()` method and `usePreviewMatchMedia()` hook support standard CSS media queries:

### Supported Media Features

```typescript
// Width/Height
"(width: 375px)";
"(min-width: 768px)";
"(max-width: 1024px)";
"(height: 667px)";
"(min-height: 500px)";
"(max-height: 900px)";

// Aspect Ratio
"(aspect-ratio: 16/9)";
"(min-aspect-ratio: 1/1)";
"(max-aspect-ratio: 21/9)";

// Orientation
"(orientation: portrait)";
"(orientation: landscape)";

// Resolution
"(resolution: 2dppx)";
"(min-resolution: 1.5dppx)";
"(max-resolution: 3dppx)";

// Hover / Pointer (requires mediaFeatureOverrides)
"(hover: hover)";
"(hover: none)";
"(pointer: fine)";
"(pointer: coarse)";

// User Preferences (requires mediaFeatureOverrides)
"(prefers-color-scheme: dark)";
"(prefers-color-scheme: light)";
"(prefers-reduced-motion: reduce)";
"(prefers-contrast: more)";

// Logical Operators
"(min-width: 768px) and (max-width: 1024px)";
"(orientation: portrait) and (max-width: 500px)";
"not (orientation: landscape)";
"(min-width: 768px), (orientation: landscape)"; // OR
```

### Query Parsing Rules

- **Whitespace:** Flexible (e.g., `(min-width:768px)` works)
- **Units:** `px` required for width/height (e.g., `(width: 375px)`)
- **Ratios:** Use `/` separator (e.g., `(aspect-ratio: 16/9)`)
- **Boolean features:** Use presence check (e.g., `(hover)` checks if hover is supported)
- **Operators:**
  - `and` - both conditions must match
  - `not` - negates the entire query
  - `,` - OR operator (matches if any condition is true)

### Common Patterns

```typescript
// Mobile-first breakpoints
const isMobile = usePreviewMatchMedia(ref, "(max-width: 767px)");
const isTablet = usePreviewMatchMedia(ref, "(min-width: 768px) and (max-width: 1023px)");
const isDesktop = usePreviewMatchMedia(ref, "(min-width: 1024px)");

// Portrait vs landscape
const isPortrait = usePreviewMatchMedia(ref, "(orientation: portrait)");

// High-DPI displays
const isRetina = usePreviewMatchMedia(ref, "(min-resolution: 2dppx)");

// Dark mode (requires override)
<VirtualWindow mediaFeatureOverrides={{ "prefers-color-scheme": "dark" }}>
  {/* ... */}
</VirtualWindow>
const isDark = usePreviewMatchMedia(ref, "(prefers-color-scheme: dark)");

// Touch vs mouse (requires override)
<VirtualWindow mediaFeatureOverrides={{ hover: "none", pointer: "coarse" }}>
  {/* ... */}
</VirtualWindow>
const isTouch = usePreviewMatchMedia(ref, "(hover: none) and (pointer: coarse)");
```

---

## Critical Implementation Constraints

### 1. Async Shadow Root Initialization

**Problem:** Shadow root is created in a `useEffect`, so it's not available on first render.

**Solution:** Use `shadowReady` state to gate portal rendering:

```typescript
const [shadowReady, setShadowReady] = useState(false);

useEffect(() => {
  const shadow = hostRef.current.attachShadow({ mode: "open" });
  shadowRootRef.current = shadow;
  // ... inject styles, create mount node ...
  setShadowReady(true);
}, []);

return (
  <>
    <div ref={hostRef} />
    {shadowReady && shadowRootRef.current && (
      createPortal(children, mountNodeRef.current)
    )}
  </>
);
```

**Implication:** Ref methods that depend on shadow root (e.g., `addGlobalStyle`, `matchMedia`) should check for initialization:

```typescript
addGlobalStyle: (css: string) => {
  const shadow = shadowRootRef.current;
  if (!shadow) {
    console.warn("VirtualWindow: Shadow root not initialized");
    return;
  }
  // ... inject style ...
};
```

### 2. Preset Sync Pattern

**Problem:** When `preset` prop changes, need to update `size` state.

**Solution:** Use `useEffect` with preset as dependency:

```typescript
useEffect(() => {
  if (!preset) return;
  const resolved = getDevicePreset(preset);
  if (resolved) {
    setSize({ width: resolved.width, height: resolved.height });
  }
}, [preset]);
```

**Anti-pattern:** Do NOT use `queueMicrotask` to defer state updates. Use proper `useEffect` dependency arrays.

### 3. Scale vs Logical Dimensions

**Key concept:** `scale` is purely visual (CSS `transform: scale()`). Logical dimensions (`width`, `height`) remain unchanged.

**Implications:**

- `matchMedia` queries use logical dimensions (not scaled)
- `toLocalPoint()` divides by scale to compensate
- `getBoundingClientRect()` returns scaled dimensions (multiply by scale to get logical)

**Example:**

```typescript
// Window is 400px logical, scale 0.5
const size = ref.current.getSize(); // { width: 400, height: 600 }
const scale = ref.current.getScale(); // 0.5
const rect = ref.current.hostElement.getBoundingClientRect();
// rect.width = 200 (visual), rect.height = 300 (visual)

// Media query uses logical dimensions
ref.current.matchMedia("(width: 400px)").matches; // true
ref.current.matchMedia("(width: 200px)").matches; // false
```

### 4. Document-Level Pointer Listeners

**Why:** Resize and drag both use `document.addEventListener("pointermove")` instead of React synthetic events.

**Reason:** Pointer capture can be released when events cross shadow DOM boundaries. Document-level listeners ensure we receive all `pointermove` and `pointerup` events regardless of where the pointer is.

**Pattern:**

```typescript
useEffect(
  () => {
    const onMove = (e: PointerEvent) => {
      /* ... */
    };
    const onUp = (e: PointerEvent) => {
      /* ... */
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  },
  [
    /* dependencies */
  ],
);
```

### 5. Drag/Resize Conflict Resolution

**Problem:** Drag handles and window dragging can conflict.

**Solution:** Use `composedPath()` to inspect the true event target across shadow boundaries:

```typescript
const handleDragStart = (e: React.PointerEvent) => {
  const composed = e.nativeEvent.composedPath?.() ?? [];
  const target = (composed.length > 0 ? composed[0] : e.target) as HTMLElement;

  // Check if clicked a resize handle
  const hitResizeHandle = composed.some((el) =>
    (el as HTMLElement).classList?.contains?.("resize-handle"),
  );

  if (hitResizeHandle) return; // Let resize handle it

  // Otherwise, start drag
  dragStateRef.current = { isDragging: true /* ... */ };
};
```

### 6. Export Strategy

**Working approach:** Run `html2canvas` on the live content element (first child of mount node).

**Why this works:**

- html2canvas receives a direct reference to the element
- The element is painted and on-screen (inside shadow root)
- Shadow DOM boundary doesn't block html2canvas from accessing the element's subtree

**Code:**

```typescript
const exportAsImageImpl = async (
  options: ExportImageOptions = {},
): Promise<string> => {
  const mountNode = mountNodeRef.current;
  if (!mountNode?.firstElementChild) return "";

  const contentElement = mountNode.firstElementChild as HTMLElement;

  // Temporarily set overflow visible to exclude scrollbars
  const originalOverflow = contentElement.style.overflow;
  contentElement.style.overflow = "visible";

  // Temporarily hide resize handles if requested
  if (!options.includeHandles) {
    // ... hide logic ...
  }

  try {
    const canvas = await html2canvas(contentElement, {
      backgroundColor: options.backgroundColor,
      scale: options.scale,
      allowTaint: true, // Required for external resources
    });

    return canvas.toDataURL(`image/${options.format}`, options.quality);
  } finally {
    // Restore state in all code paths
    contentElement.style.overflow = originalOverflow;
    // ... restore handles ...
  }
};
```

**Anti-pattern:** Do NOT use `cloneNode()` and render off-screen. This causes html2canvas to capture a blank canvas because `getBoundingClientRect()` returns coordinates outside the viewport.

### 7. Stable Callback Refs

**Problem:** If `onResize` is an inline arrow function, it creates a new reference every render. If `onResize` is in a `useEffect` dependency array, the effect re-runs on every parent render.

**Solution:** Use a ref to track the latest callback:

```typescript
const onResizeRef = useRef(onResize);
useEffect(() => {
  onResizeRef.current = onResize;
}, [onResize]);

useEffect(() => {
  const onMove = (e: PointerEvent) => {
    // Use ref instead of direct prop
    onResizeRef.current?.(newSize);
  };

  // onResize NOT in deps — effect stable for lifetime of constraints
  document.addEventListener("pointermove", onMove);
  return () => document.removeEventListener("pointermove", onMove);
}, [minWidth, maxWidth, minHeight, maxHeight]);
```

---

## Common Patterns and Recipes

### Pattern 1: Responsive Layout with matchMedia

```typescript
function ResponsiveApp() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const isMobile = usePreviewMatchMedia(windowRef, "(max-width: 767px)");
  const isTablet = usePreviewMatchMedia(
    windowRef,
    "(min-width: 768px) and (max-width: 1023px)"
  );
  const isDesktop = usePreviewMatchMedia(windowRef, "(min-width: 1024px)");

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}

<VirtualWindow ref={windowRef} width={375} height={667}>
  <ResponsiveApp />
</VirtualWindow>
```

### Pattern 2: GSAP Scroll Animations

```typescript
function ScrollContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.to(".element", {
        y: 100,
        scrollTrigger: {
          trigger: ".element",
          start: "top top",
          end: "bottom top",
          scrub: 1,
          scroller: container,  // KEY: Use container, not window
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div className="element">Scrollable content</div>
    </div>
  );
}
```

### Pattern 3: External Drag-and-Drop with dnd-kit

**Scenario:** Drag items from a source panel into the VirtualWindow.

**Key steps:**

1. Use `registerExternalDrag(pointerId)` in `onDragStart`
2. Use `isPointInside()` and `toLocalPoint()` in `onDragMove` or `onDragEnd`
3. Use `unregisterExternalDrag(pointerId)` on drag end/cancel

**Full example:**

```typescript
function App() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [items, setItems] = useState<Array<{ x: number; y: number }>>([]);

  // Cache rect/scale at drag start for performance
  const cachedDataRef = useRef<{ rect: DOMRect | null; scale: number }>({
    rect: null,
    scale: 1,
  });

  const handleDragStart = (event: DragStartEvent) => {
    // Cache geometry once
    if (windowRef.current?.hostElement) {
      cachedDataRef.current.rect = windowRef.current.hostElement.getBoundingClientRect();
      cachedDataRef.current.scale = windowRef.current.getScale();
    }

    // Register pointer
    const pointerEvent = event.activatorEvent as PointerEvent;
    windowRef.current?.registerExternalDrag(pointerEvent.pointerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + (event.delta?.x || 0);
    const finalY = pointerEvent.clientY + (event.delta?.y || 0);

    // Check if dropped inside
    const isInside = windowRef.current?.isPointInside(finalX, finalY);

    if (isInside) {
      // Convert to preview-local coordinates
      const localPoint = windowRef.current.toLocalPoint({
        clientX: finalX,
        clientY: finalY,
      } as PointerEvent);

      if (localPoint) {
        setItems((prev) => [...prev, { x: localPoint.x, y: localPoint.y }]);
      }
    }

    // Always unregister
    windowRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SourcePanel />
      <VirtualWindow ref={windowRef} width={600} height={400}>
        <Canvas items={items} />
      </VirtualWindow>
    </DndContext>
  );
}
```

### Pattern 4: Performance-Optimized Drag Tracking

**Problem:** `onDragMove` fires 60-120 times/second. Calling `isPointInside()` → `getBoundingClientRect()` every frame causes layout thrashing.

**Solution:** Cache geometry at drag start, use RAF batching:

```typescript
const handleDragMove = useCallback((event: DragMoveEvent) => {
  if (!event.activatorEvent) return;

  // Cancel pending frame
  if (cachedDataRef.current.frameId !== null) {
    cancelAnimationFrame(cachedDataRef.current.frameId);
  }

  // Schedule update for next frame
  cachedDataRef.current.frameId = requestAnimationFrame(() => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + (event.delta?.x || 0);
    const finalY = pointerEvent.clientY + (event.delta?.y || 0);

    const rect = cachedDataRef.current.rect;
    const scale = cachedDataRef.current.scale;

    if (!rect) return;

    // Manual hit-test using cached rect
    const isInside =
      finalX >= rect.left &&
      finalX <= rect.right &&
      finalY >= rect.top &&
      finalY <= rect.bottom;

    if (isInside) {
      const localX = (finalX - rect.left) / scale;
      const localY = (finalY - rect.top) / scale;

      // Update React state max once per frame
      setDragOverPos({ x: localX, y: localY });
    }

    cachedDataRef.current.frameId = null;
  });
}, []);
```

**Result:** Zero `getBoundingClientRect()` calls during drag, max 60 React renders/sec regardless of pointer frequency.

---

## Testing Considerations

### Required Mocks

When testing components using VirtualWindow, mock these APIs:

**1. Shadow DOM Async Creation**

```typescript
beforeEach(() => {
  HTMLElement.prototype.attachShadow = jest.fn(() => ({
    appendChild: jest.fn(),
    querySelector: jest.fn(),
  }));
});
```

**2. getBoundingClientRect**

```typescript
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  left: 0,
  top: 0,
  right: 400,
  bottom: 600,
  width: 400,
  height: 600,
  x: 0,
  y: 0,
  toJSON: () => {},
}));
```

**3. html2canvas (if testing export)**

```typescript
jest.mock("html2canvas", () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      toDataURL: () => "data:image/png;base64,mock",
    }),
  ),
}));
```

### Common Test Scenarios

```typescript
describe("VirtualWindow", () => {
  test("initializes with provided dimensions", () => {
    const { container } = render(
      <VirtualWindow width={500} height={700}>
        <div>Content</div>
      </VirtualWindow>
    );
    // Assert dimensions
  });

  test("applies device preset", () => {
    const ref = createRef<VirtualWindowRef>();
    render(<VirtualWindow ref={ref} preset="iphone-15-pro" />);
    const size = ref.current?.getSize();
    expect(size).toEqual({ width: 393, height: 852 });
  });

  test("converts global to local coordinates", () => {
    const ref = createRef<VirtualWindowRef>();
    render(<VirtualWindow ref={ref} width={400} height={600} scale={0.5} />);

    const localPoint = ref.current?.toLocalPoint({
      clientX: 100,
      clientY: 150,
    } as PointerEvent);

    // Compensates for scale: (100 - 0) / 0.5 = 200
    expect(localPoint).toEqual({ x: 200, y: 300 });
  });
});
```

---

## What is NOT Implemented

To prevent hallucinated features, here's what VirtualWindow explicitly does NOT support:

### Not Supported

- ❌ Browser storage APIs (`localStorage`, `sessionStorage`) in artifacts
- ❌ Nesting VirtualWindow components (shadow roots can't contain shadow roots)
- ❌ Server-side rendering (requires browser APIs)
- ❌ `useDroppable` zones inside shadow DOM (use manual hit-testing instead)
- ❌ CSS `@import` statements (inject styles with `addGlobalStyle` instead)
- ❌ Automatic responsive breakpoint switching (use `matchMedia` manually)
- ❌ Built-in undo/redo (implement at application level)
- ❌ Multi-select or selection system (implement at application level)
- ❌ Grid/snap systems (implement at application level)
- ❌ Collision detection between items (implement at application level)

### Workarounds

**localStorage alternative:**

```typescript
// Use in-memory state or backend persistence
const [data, setData] = useState({});
```

**Nesting alternative:**

```typescript
// Use a single VirtualWindow with nested containers inside
<VirtualWindow>
  <Container>
    <Container>  {/* This is fine */}
    </Container>
  </Container>
</VirtualWindow>
```

**Droppable zones alternative:**

```typescript
// Don't use useDroppable inside shadow DOM
// Instead, check collision in onDragEnd
const isOverContainer = (dragX, dragY, container) => {
  return (
    dragX >= container.x &&
    dragX <= container.x + container.width &&
    dragY >= container.y &&
    dragY <= container.y + container.height
  );
};
```

---

## Performance Optimization Strategies

### 1. Memoize Heavy Children

```typescript
const ExpensiveChild = React.memo(({ data }) => {
  // Heavy rendering logic
  return <div>...</div>;
});

<VirtualWindow>
  <ExpensiveChild data={data} />
</VirtualWindow>
```

### 2. Virtualize Long Lists

```typescript
import { FixedSizeList } from "react-window";

<VirtualWindow width={600} height={800}>
  <FixedSizeList
    height={800}
    width={600}
    itemCount={1000}
    itemSize={50}
  >
    {({ index, style }) => <Item index={index} style={style} />}
  </FixedSizeList>
</VirtualWindow>
```

### 3. Debounce Resize Callbacks

```typescript
const [size, setSize] = useState({ width: 375, height: 667 });

const debouncedResize = useMemo(
  () => debounce((newSize) => setSize(newSize), 100),
  []
);

<VirtualWindow onResize={debouncedResize} />
```

### 4. Use CSS Transforms for Positioning

```typescript
// Inside shadow DOM, use transforms for GPU acceleration
<div style={{ transform: `translate(${x}px, ${y}px)` }}>
  Item
</div>

// Avoid:
<div style={{ left: x, top: y, position: "absolute" }}>
  Item
</div>
```

### 5. Batch State Updates

```typescript
// Batch multiple updates
ReactDOM.unstable_batchedUpdates(() => {
  setItems(newItems);
  setSelection(newSelection);
  setUndoStack(newStack);
});

// Or use React 18 automatic batching
// (all state updates in same event handler batch automatically)
```

---

## Architecture Decision Records

### ADR 1: Shadow DOM vs iframe

**Decision:** Use Shadow DOM instead of iframe.

**Reasoning:**

- **Style isolation:** Both provide it
- **React context:** Shadow DOM preserves it (via portals), iframes break it
- **Performance:** Shadow DOM has no page load overhead
- **Coordinate system:** Shadow DOM uses same origin, iframes need `postMessage`
- **Debugging:** Shadow DOM visible in DevTools, iframes require switching contexts

**Trade-off:** Shadow DOM doesn't isolate JavaScript execution (but we don't need that).

### ADR 2: Transform-based scaling vs actual resizing

**Decision:** Use `transform: scale()` for zoom, not actual dimension changes.

**Reasoning:**

- **Performance:** Transform is GPU-accelerated, layout changes are not
- **Logical consistency:** Media queries should reflect actual device, not zoom level
- **Simplicity:** No need to recalculate internal layouts on zoom

**Implementation:** `toLocalPoint()` compensates by dividing by scale.

### ADR 3: Document-level pointer listeners

**Decision:** Use `document.addEventListener` instead of React synthetic events for drag/resize.

**Reasoning:**

- **Pointer capture:** Can be released when crossing shadow boundaries
- **Reliability:** Document-level ensures we receive all move/up events
- **Shadow DOM:** Events composed across boundary need native listeners

**Trade-off:** Requires manual cleanup in `useEffect` return.

### ADR 4: html2canvas on live element

**Decision:** Run html2canvas directly on mounted element, not a clone.

**Reasoning:**

- **Geometry:** Clone placed off-screen has invalid `getBoundingClientRect()`
- **Painting:** Live element already rendered and painted
- **Shadow DOM:** html2canvas can access element subtree via direct reference

**Trade-off:** Need to temporarily hide resize handles during capture.

### ADR 5: Path-based container navigation

**Decision:** Use string paths (e.g., `"c1.c2.c3"`) for nested container navigation.

**Reasoning:**

- **Simplicity:** Easy to serialize, debug, and compare
- **Immutability:** Can reconstruct tree with path-based updates
- **Performance:** O(depth) traversal acceptable for typical nesting levels

**Alternative considered:** Direct object references (but breaks immutability, hard to serialize).

---

## Known Issues and Limitations

### Issue 1: Performance with Deep Nesting

**Problem:** Nested container demo with >5 levels of nesting can have poor drag performance.

**Cause:** Path traversal is O(n\*depth) for each update.

**Mitigation:**

- Use shallow nesting (<3 levels) when possible
- Implement path caching for frequently accessed containers
- Consider flat structure with parent-child relationships instead of actual nesting

### Issue 2: CORS for External Resources

**Problem:** `exportAsImage()` fails for images/fonts from different origins without CORS headers.

**Cause:** html2canvas taints canvas when loading cross-origin resources.

**Mitigation:**

- Serve assets from same origin
- Configure CORS headers on CDN
- Use `crossOrigin="anonymous"` on images
- Or accept tainted canvas (can't export)

### Issue 3: Large DOM Export Performance

**Problem:** Exporting previews with >10,000 DOM elements is slow.

**Cause:** html2canvas must traverse and render entire DOM tree.

**Mitigation:**

- Virtualize long lists before export
- Export only visible viewport (not entire scrollable area)
- Use lower `scale` option for faster export
- Show loading indicator during export

### Issue 4: No Multi-Touch Support

**Problem:** VirtualWindow doesn't handle pinch-to-zoom or multi-touch gestures.

**Cause:** Resize/drag logic assumes single pointer.

**Mitigation:**

- Implement pinch zoom at application level
- Or use browser's native pinch zoom (but affects entire page)

---

## Extension Points

VirtualWindow is designed to be extended. Here are the intended extension points:

### 1. Custom Device Presets

```typescript
const customPreset: DevicePreset = {
  width: 390,
  height: 844,
  pixelRatio: 3,
  displayName: "Custom Phone",
  category: "mobile",
  userAgent: "...",
  chrome: { top: 44, bottom: 34 },
  hasNotch: true,
};

<VirtualWindow preset={customPreset} />
```

### 2. Custom Media Feature Overrides

```typescript
const overrides: MediaFeatureOverrides = {
  "prefers-color-scheme": "dark",
  "prefers-reduced-motion": "reduce",
  "hover": "none",
  "pointer": "coarse",
  "prefers-contrast": "more",
};

<VirtualWindow mediaFeatureOverrides={overrides} />
```

### 3. Custom Style Injection

```typescript
useEffect(() => {
  const ref = windowRef.current;
  if (!ref) return;

  ref.addGlobalStyle(`
    * {
      font-family: "Custom Font", sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `);
}, []);
```

### 4. Custom Export Pipeline

```typescript
const exportWithWatermark = async () => {
  const dataUrl = await windowRef.current?.exportAsImage({
    format: "png",
    scale: 2,
  });

  // Load into canvas
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original
  ctx.drawImage(img, 0, 0);

  // Add watermark
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("© 2024 MyCompany", 20, canvas.height - 20);

  return canvas.toDataURL("image/png");
};
```

---

## Conclusion

VirtualWindow is a mature, production-ready component with comprehensive features for building page builders, design tools, and preview environments. The key architectural decisions (Shadow DOM + React Portals, transform-based scaling, document-level pointer events) make it reliable and performant.

When extending or debugging VirtualWindow, remember:

1. Shadow root is async — always check `shadowReady`
2. Scale is visual only — media queries use logical dimensions
3. Use document-level listeners for drag/resize
4. Cache geometry for performance during drags
5. Follow the existing patterns (stable refs, RAF batching, path-based navigation)

For LLM code generation:

- Never invent device preset names — use only the 15 listed presets
- Always compensate for scale in coordinate transformations
- Use `composedPath()` for shadow-aware event handling
- Follow the established patterns in the demos
- Don't hallucinate features (check "What is NOT Implemented" section)
