# VirtualWindow

A production-ready React component for creating isolated preview environments with full Shadow DOM encapsulation and React Portal integration. Perfect for page builders, design tools, and any application requiring sandboxed component previews.

## Overview

VirtualWindow provides a fully isolated preview context that:

- **Encapsulates styles** via Shadow DOM (no CSS leakage)
- **Preserves React context** via portals (hooks, context providers work normally)
- **Supports animations** (GSAP, CSS transitions, any animation library)
- **Handles complex interactions** (drag-and-drop, nested containers, scroll contexts)
- **Scales and positions** content with transform-based zoom
- **Exports screenshots** via html2canvas

## Key Features

### Core Functionality

- ✅ **Shadow DOM Isolation** - Complete style encapsulation
- ✅ **React Portal Integration** - Children render inside shadow root with full React context
- ✅ **Device Presets** - 15 pre-configured device dimensions (iPhone, iPad, Pixel, Galaxy, etc.)
- ✅ **Resizable** - 8-way resize handles (corners + edges)
- ✅ **Draggable** - Reposition preview window with pointer capture
- ✅ **Scale/Zoom** - Visual zoom with `transform: scale()` while preserving logical dimensions
- ✅ **Screenshot Export** - Export preview as PNG/JPEG/WebP with html2canvas

### Advanced Features

- ✅ **matchMedia Emulation** - Preview-scoped media query testing
- ✅ **Media Feature Overrides** - Simulate dark mode, reduced motion, touch input, etc.
- ✅ **Coordinate Transformation** - `toLocalPoint()` converts global to preview-local coordinates
- ✅ **External Drag-and-Drop** - Drag items from outside into shadow DOM content
- ✅ **Nested Containers** - Unlimited depth container nesting with visual drop previews
- ✅ **Scroll Context Integration** - GSAP ScrollTrigger, Locomotive Scroll, etc. work perfectly
- ✅ **Keyboard Accessible** - Resize handles respond to arrow keys

## Installation

```bash
npm install react react-dom html2canvas @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Quick Start

```tsx
import React, { useRef } from "react";
import VirtualWindow, { type VirtualWindowRef } from "./VirtualWindow";

function App() {
  const windowRef = useRef<VirtualWindowRef>(null);

  return (
    <VirtualWindow
      ref={windowRef}
      width={375}
      height={667}
      preset="iphone-15-pro"
      scale={0.8}
      resizable
      draggable
    >
      <YourApp />
    </VirtualWindow>
  );
}
```

## API Reference

### Props

```typescript
interface VirtualWindowProps {
  // Dimensions
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Device presets
  preset?: string | DevicePreset;

  // Visual scale
  scale?: number;
  onScaleChange?: (scale: number) => void;

  // Interaction
  resizable?: boolean;
  draggable?: boolean;
  dragHandle?: "window" | "header";

  // Position
  position?: VirtualWindowPosition;
  onPositionChange?: (position: VirtualWindowPosition) => void;

  // Callbacks
  onResize?: (size: VirtualWindowSize) => void;

  // Media query simulation
  mediaFeatureOverrides?: MediaFeatureOverrides;

  // External drag-and-drop
  onExternalDrop?: (event: ExternalDropEvent) => void;
  onExternalDragOver?: (event: ExternalDropEvent) => void;
  onExternalDragLeave?: () => void;

  // Standard props
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

### Ref Methods

```typescript
interface VirtualWindowRef {
  // Core
  hostElement: HTMLDivElement | null;
  shadowRoot: ShadowRoot | null;

  // Dimensions
  getSize: () => VirtualWindowSize;
  resize: (width: number, height: number, skipCallback?: boolean) => void;

  // Scale
  getScale: () => number;
  setScale: (scale: number, skipCallback?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Position
  getPosition: () => VirtualWindowPosition;
  setPosition: (
    position: VirtualWindowPosition,
    skipCallback?: boolean,
  ) => void;
  centerInParent: () => void;

  // Styling
  addGlobalStyle: (css: string) => void;

  // Coordinates
  toLocalPoint: (
    event: PointerEvent | MouseEvent | React.PointerEvent,
  ) => { x: number; y: number } | null;
  isPointInside: (clientX: number, clientY: number) => boolean;

  // Media queries
  matchMedia: (query: string) => PreviewMediaQueryList;
  setOverrides: (overrides: MediaFeatureOverrides) => void;

  // Export
  exportAsImage: (options?: ExportImageOptions) => Promise<string>;
  downloadImage: (
    filename?: string,
    options?: ExportImageOptions,
  ) => Promise<void>;

  // External drag-and-drop
  registerExternalDrag: (pointerId: number) => void;
  unregisterExternalDrag: (pointerId: number) => void;
}
```

### Device Presets

Available presets (use as `preset="preset-name"`):

**Mobile:**

- `iphone-15-pro`, `iphone-15-pro-max`, `iphone-se`
- `pixel-7`, `pixel-7-pro`
- `galaxy-s23`, `galaxy-s23-ultra`

**Tablet:**

- `ipad-pro-11`, `ipad-pro-13`, `ipad-air`, `ipad-mini`
- `galaxy-tab-s9`

**Desktop:**

- `macbook-air`, `macbook-pro-14`, `macbook-pro-16`

**Custom preset:**

```typescript
<VirtualWindow
  preset={{
    width: 390,
    height: 844,
    pixelRatio: 3,
    displayName: "Custom Device"
  }}
/>
```

## Usage Examples

### Basic Responsive Preview

```tsx
import { usePreviewMatchMedia } from "./hooks/usePreviewMatchMedia";

function ResponsiveContent({ windowRef }) {
  const isMobile = usePreviewMatchMedia(windowRef, "(max-width: 768px)");

  return <div>{isMobile ? <MobileNav /> : <DesktopNav />}</div>;
}

function App() {
  const windowRef = useRef<VirtualWindowRef>(null);

  return (
    <VirtualWindow ref={windowRef} width={375} height={667}>
      <ResponsiveContent windowRef={windowRef} />
    </VirtualWindow>
  );
}
```

### Drag-and-Drop Into Preview

```tsx
import { DndContext, useDraggable } from "@dnd-kit/core";

function App() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const handleDragStart = (event) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    windowRef.current?.registerExternalDrag(pointerEvent.pointerId);
  };

  const handleDragEnd = (event) => {
    const finalX = event.activatorEvent.clientX + event.delta.x;
    const finalY = event.activatorEvent.clientY + event.delta.y;

    if (windowRef.current?.isPointInside(finalX, finalY)) {
      const localPoint = windowRef.current.toLocalPoint({
        clientX: finalX,
        clientY: finalY,
      });

      // Add item at localPoint.x, localPoint.y
    }

    windowRef.current?.unregisterExternalDrag(event.activatorEvent.pointerId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SourcePanel />
      <VirtualWindow ref={windowRef} width={600} height={400}>
        <Canvas />
      </VirtualWindow>
    </DndContext>
  );
}
```

### GSAP ScrollTrigger Integration

```tsx
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function ParallaxContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.to(".parallax-layer", {
        y: 100,
        scrollTrigger: {
          trigger: ".parallax-layer",
          start: "top top",
          end: "bottom top",
          scrub: 1,
          scroller: container, // ← Key: use container, not window
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div className="parallax-layer">Content</div>
    </div>
  );
}

<VirtualWindow width={600} height={800}>
  <ParallaxContent />
</VirtualWindow>;
```

### Screenshot Export

```tsx
const windowRef = useRef<VirtualWindowRef>(null);

const handleExport = async () => {
  if (!windowRef.current) return;

  // Export as data URL
  const dataUrl = await windowRef.current.exportAsImage({
    format: "png",
    quality: 0.95,
    backgroundColor: "#ffffff",
    scale: 2, // 2x resolution for retina displays
    includeHandles: false,
  });

  // Or download directly
  await windowRef.current.downloadImage("preview.png", {
    format: "png",
    quality: 1,
  });
};
```

### Media Feature Overrides

```tsx
<VirtualWindow
  width={375}
  height={667}
  mediaFeatureOverrides={{
    "prefers-color-scheme": "dark",
    "prefers-reduced-motion": "reduce",
    hover: "none",
    pointer: "coarse",
  }}
>
  <App />
</VirtualWindow>
```

## Performance Considerations

### Optimization Tips

1. **Avoid inline styles in loops** - VirtualWindow re-renders trigger portal updates
2. **Memoize heavy children** - Use `React.memo()` for canvas content
3. **Debounce resize/scale callbacks** - RAF-batch updates if you're computing layouts
4. **Use CSS transforms** - GPU-accelerated positioning is fast inside shadow DOM
5. **Lazy load content** - Use React.Suspense for heavy previews

### Known Limitations

- **No `localStorage`/`sessionStorage`** - Browser storage APIs don't work in artifacts (use in-memory state or backend persistence)
- **External resources** - Images/fonts from different origins need CORS headers for export
- **Heavy DOM** - Very large DOMs (10,000+ elements) may impact resize performance
- **Nested shadows** - Cannot nest VirtualWindow components (shadow roots can't contain shadow roots)

## Browser Support

- **Chrome/Edge:** ✅ Full support
- **Firefox:** ✅ Full support
- **Safari:** ✅ Full support (iOS 13+, macOS 10.15+)

Requires:

- Shadow DOM v1
- Pointer Events
- CSS `transform: scale()`
- HTML5 Canvas (for export)

## Architecture

### Component Structure

```text
VirtualWindow (host element)
└── Shadow Root
    ├── <style> (injected CSS)
    ├── <div.mount-node> (portal target)
    │   └── {children} (rendered via React.createPortal)
    └── Resize handles (8 directional)
```

### Key Design Decisions

1. **Shadow DOM for style isolation** - Prevents CSS leakage in/out
2. **React Portals for context** - Children maintain access to React context
3. **Document-level pointer events** - Resize/drag work across shadow boundaries
4. **Transform-based scaling** - GPU-accelerated zoom without layout thrashing
5. **Cached geometry for drags** - RAF batching + cached rects = 60fps performance

## Testing

VirtualWindow includes a comprehensive test suite covering:

- Resize handle interactions (16 tests)
- Scale/preset synchronization (17 tests)
- Screenshot export (13 tests)
- Edge cases and error handling

Run tests:

```bash
npm test
```

## Contributing

Contributions welcome! Please:

1. Add tests for new features
2. Update TypeScript types
3. Document breaking changes
4. Follow existing code style

## License

MIT

## Credits

Built with:

- [React](https://react.dev) - UI framework
- [html2canvas](https://html2canvas.hertzen.com/) - Screenshot export
- [@dnd-kit](https://dndkit.com/) - Drag-and-drop (demos only)
- [GSAP](https://greensock.com/gsap/) - Animation library (demos only)

## Related Projects

- **react-frame-component** - iframe-based isolation (VirtualWindow uses shadow DOM instead)
- **react-shadow** - Shadow DOM wrapper (VirtualWindow adds resize, scale, export, and more)
- **storybook** - Component development environment (VirtualWindow focuses on preview/builder UIs)
