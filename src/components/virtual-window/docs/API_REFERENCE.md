# VirtualWindow API Reference

Complete API documentation for VirtualWindow component.

## Table of Contents

1. [Component Props](#component-props)
2. [Ref Methods](#ref-methods)
3. [Type Definitions](#type-definitions)
4. [Device Presets](#device-presets)
5. [Hooks](#hooks)
6. [Utilities](#utilities)
7. [Events](#events)

---

## Component Props

### Basic Props

#### `width`

```typescript
width?: number
```

- **Default**: `375`
- **Description**: Initial width in logical pixels
- **Example**: `<VirtualWindow width={600} />`

#### `height`

```typescript
height?: number
```

- **Default**: `667`
- **Description**: Initial height in logical pixels
- **Example**: `<VirtualWindow height={800} />`

#### `children`

```typescript
children?: React.ReactNode
```

- **Description**: Content to render inside the preview
- **Example**:

```tsx
<VirtualWindow>
  <MyApp />
</VirtualWindow>
```

---

### Size Constraints

#### `minWidth`

```typescript
minWidth?: number
```

- **Default**: `200`
- **Description**: Minimum width constraint for resizing
- **Example**: `<VirtualWindow minWidth={320} />`

#### `maxWidth`

```typescript
maxWidth?: number
```

- **Default**: `2000`
- **Description**: Maximum width constraint for resizing
- **Example**: `<VirtualWindow maxWidth={1920} />`

#### `minHeight`

```typescript
minHeight?: number
```

- **Default**: `200`
- **Description**: Minimum height constraint for resizing
- **Example**: `<VirtualWindow minHeight={480} />`

#### `maxHeight`

```typescript
maxHeight?: number
```

- **Default**: `2000`
- **Description**: Maximum height constraint for resizing
- **Example**: `<VirtualWindow maxHeight={1080} />`

---

### Device Presets

#### `preset`

```typescript
preset?: string | DevicePreset
```

- **Description**: Device preset name or custom preset object
- **Valid preset names**:
  - Mobile: `"iphone-15-pro"`, `"iphone-15-pro-max"`, `"iphone-se"`, `"pixel-7"`, `"pixel-7-pro"`, `"galaxy-s23"`, `"galaxy-s23-ultra"`
  - Tablet: `"ipad-pro-11"`, `"ipad-pro-13"`, `"ipad-air"`, `"ipad-mini"`, `"galaxy-tab-s9"`
  - Desktop: `"macbook-air"`, `"macbook-pro-14"`, `"macbook-pro-16"`
- **Examples**:

```tsx
// Preset name
<VirtualWindow preset="iphone-15-pro" />

// Custom preset
<VirtualWindow
  preset={{
    width: 390,
    height: 844,
    pixelRatio: 3,
    displayName: "Custom Device",
    category: "mobile",
  }}
/>
```

#### `showDeviceFrame`

```typescript
showDeviceFrame?: boolean
```

- **Default**: `false`
- **Description**: Show device chrome (status bar, home indicator)
- **Example**: `<VirtualWindow preset="iphone-15-pro" showDeviceFrame />`

---

### Scale/Zoom

#### `scale`

```typescript
scale?: number
```

- **Default**: `1`
- **Description**: Visual scale factor (transform-based)
- **Range**: `0.1` to `5`
- **Note**: Does not affect logical dimensions or media queries
- **Example**: `<VirtualWindow scale={0.8} />`

#### `onScaleChange`

```typescript
onScaleChange?: (scale: number) => void
```

- **Description**: Called when scale changes
- **Example**:

```tsx
<VirtualWindow scale={scale} onScaleChange={(newScale) => setScale(newScale)} />
```

---

### Interaction

#### `resizable`

```typescript
resizable?: boolean
```

- **Default**: `true`
- **Description**: Enable/disable resize handles
- **Example**: `<VirtualWindow resizable={false} />`

#### `draggable`

```typescript
draggable?: boolean
```

- **Default**: `false`
- **Description**: Enable/disable window dragging
- **Example**: `<VirtualWindow draggable />`

#### `dragHandle`

```typescript
dragHandle?: "window" | "header"
```

- **Default**: `"window"`
- **Description**: Which element can be dragged
- **Options**:
  - `"window"`: Entire window is draggable
  - `"header"`: Only header bar is draggable
- **Example**: `<VirtualWindow draggable dragHandle="header" />`

---

### Position

#### `position`

```typescript
position?: VirtualWindowPosition
```

- **Description**: Window position in parent
- **Type**: `{ x: number; y: number }`
- **Example**:

```tsx
<VirtualWindow position={{ x: 100, y: 50 }} />
```

#### `onPositionChange`

```typescript
onPositionChange?: (position: VirtualWindowPosition) => void
```

- **Description**: Called when position changes via drag
- **Example**:

```tsx
<VirtualWindow
  position={position}
  onPositionChange={(newPos) => setPosition(newPos)}
/>
```

---

### Callbacks

#### `onResize`

```typescript
onResize?: (size: VirtualWindowSize) => void
```

- **Description**: Called when size changes via resize handles or ref methods
- **Type**: `{ width: number; height: number }`
- **Example**:

```tsx
<VirtualWindow
  onResize={(size) => {
    console.log("New size:", size);
  }}
/>
```

---

### Media Query Simulation

#### `mediaFeatureOverrides`

```typescript
mediaFeatureOverrides?: MediaFeatureOverrides
```

- **Description**: Override media features for testing
- **Type**:

```typescript
interface MediaFeatureOverrides {
  "prefers-color-scheme"?: "light" | "dark";
  "prefers-reduced-motion"?: "no-preference" | "reduce";
  "prefers-contrast"?: "no-preference" | "more" | "less";
  hover?: "none" | "hover";
  pointer?: "none" | "coarse" | "fine";
}
```

- **Example**:

```tsx
<VirtualWindow
  mediaFeatureOverrides={{
    "prefers-color-scheme": "dark",
    "prefers-reduced-motion": "reduce",
    hover: "none",
    pointer: "coarse",
  }}
/>
```

---

### External Drag-and-Drop

#### `onExternalDrop`

```typescript
onExternalDrop?: (event: ExternalDropEvent) => void
```

- **Description**: Called when external drag is dropped inside window
- **Type**:

```typescript
interface ExternalDropEvent {
  x: number; // Preview-local X
  y: number; // Preview-local Y
  nativeEvent: PointerEvent;
}
```

- **Example**:

```tsx
<VirtualWindow
  onExternalDrop={(event) => {
    console.log("Dropped at:", event.x, event.y);
  }}
/>
```

#### `onExternalDragOver`

```typescript
onExternalDragOver?: (event: ExternalDropEvent) => void
```

- **Description**: Called continuously while external drag is over window
- **Example**:

```tsx
<VirtualWindow
  onExternalDragOver={(event) => {
    setHoverPos({ x: event.x, y: event.y });
  }}
/>
```

#### `onExternalDragLeave`

```typescript
onExternalDragLeave?: () => void
```

- **Description**: Called when external drag leaves window
- **Example**:

```tsx
<VirtualWindow
  onExternalDragLeave={() => {
    setHoverPos(null);
  }}
/>
```

---

### Standard Props

#### `className`

```typescript
className?: string
```

- **Description**: CSS class for host element
- **Example**: `<VirtualWindow className="my-preview" />`

#### `style`

```typescript
style?: React.CSSProperties
```

- **Description**: Inline styles for host element
- **Example**:

```tsx
<VirtualWindow
  style={{
    border: "2px solid blue",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  }}
/>
```

---

## Ref Methods

Access imperative methods via ref:

```tsx
const windowRef = useRef<VirtualWindowRef>(null);

<VirtualWindow ref={windowRef} />;
```

### Core Access

#### `hostElement`

```typescript
hostElement: HTMLDivElement | null;
```

- **Description**: Host element (light DOM)
- **Example**:

```tsx
const rect = windowRef.current?.hostElement.getBoundingClientRect();
```

#### `shadowRoot`

```typescript
shadowRoot: ShadowRoot | null;
```

- **Description**: Shadow root
- **Example**:

```tsx
const shadow = windowRef.current?.shadowRoot;
```

---

### Size Management

#### `getSize()`

```typescript
getSize(): VirtualWindowSize
```

- **Returns**: `{ width: number; height: number }`
- **Description**: Get current logical dimensions
- **Example**:

```tsx
const { width, height } = windowRef.current.getSize();
console.log(`Size: ${width}x${height}`);
```

#### `resize()`

```typescript
resize(width: number, height: number, skipCallback?: boolean): void
```

- **Parameters**:
  - `width`: New width in pixels
  - `height`: New height in pixels
  - `skipCallback`: If true, doesn't trigger `onResize` callback
- **Description**: Programmatically resize window
- **Example**:

```tsx
// Resize to 800x600
windowRef.current.resize(800, 600);

// Resize without triggering callback
windowRef.current.resize(800, 600, true);
```

---

### Scale/Zoom

#### `getScale()`

```typescript
getScale(): number
```

- **Returns**: Current scale factor
- **Example**:

```tsx
const scale = windowRef.current.getScale();
console.log(`Current scale: ${scale * 100}%`);
```

#### `setScale()`

```typescript
setScale(scale: number, skipCallback?: boolean): void
```

- **Parameters**:
  - `scale`: New scale factor (0.1 to 5)
  - `skipCallback`: If true, doesn't trigger `onScaleChange` callback
- **Example**:

```tsx
// Set to 80%
windowRef.current.setScale(0.8);

// Set without triggering callback
windowRef.current.setScale(0.8, true);
```

#### `zoomIn()`

```typescript
zoomIn(): void
```

- **Description**: Increase scale by 0.1
- **Example**:

```tsx
<button onClick={() => windowRef.current.zoomIn()}>Zoom In</button>
```

#### `zoomOut()`

```typescript
zoomOut(): void
```

- **Description**: Decrease scale by 0.1
- **Example**:

```tsx
<button onClick={() => windowRef.current.zoomOut()}>Zoom Out</button>
```

#### `resetZoom()`

```typescript
resetZoom(): void
```

- **Description**: Reset scale to 1.0
- **Example**:

```tsx
<button onClick={() => windowRef.current.resetZoom()}>Reset Zoom</button>
```

---

### Position

#### `getPosition()`

```typescript
getPosition(): VirtualWindowPosition
```

- **Returns**: `{ x: number; y: number }`
- **Description**: Get current position in parent
- **Example**:

```tsx
const { x, y } = windowRef.current.getPosition();
```

#### `setPosition()`

```typescript
setPosition(position: VirtualWindowPosition, skipCallback?: boolean): void
```

- **Parameters**:
  - `position`: `{ x: number; y: number }`
  - `skipCallback`: If true, doesn't trigger `onPositionChange`
- **Example**:

```tsx
windowRef.current.setPosition({ x: 100, y: 50 });
```

#### `centerInParent()`

```typescript
centerInParent(): void
```

- **Description**: Center window in parent element
- **Example**:

```tsx
<button onClick={() => windowRef.current.centerInParent()}>Center</button>
```

---

### Styling

#### `addGlobalStyle()`

```typescript
addGlobalStyle(css: string): void
```

- **Description**: Inject CSS into shadow root
- **Example**:

```tsx
windowRef.current.addGlobalStyle(`
  body {
    font-family: "Inter", sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .button {
    padding: 12px 24px;
    border-radius: 8px;
  }
`);
```

---

### Coordinate Transformation

#### `toLocalPoint()`

```typescript
toLocalPoint(
  event: PointerEvent | MouseEvent | React.PointerEvent
): { x: number; y: number } | null
```

- **Parameters**: Pointer or mouse event with `clientX`, `clientY`
- **Returns**: Preview-local coordinates (scale-compensated) or null
- **Description**: Convert global viewport coordinates to preview-local
- **Example**:

```tsx
const handleClick = (e: React.MouseEvent) => {
  const local = windowRef.current.toLocalPoint(e.nativeEvent);
  if (local) {
    console.log(`Clicked at: ${local.x}, ${local.y}`);
  }
};
```

#### `isPointInside()`

```typescript
isPointInside(clientX: number, clientY: number): boolean
```

- **Parameters**: Global viewport coordinates
- **Returns**: True if point is inside window bounds
- **Description**: Hit-test for global coordinates
- **Example**:

```tsx
const isInside = windowRef.current.isPointInside(event.clientX, event.clientY);

if (isInside) {
  console.log("Pointer is inside window");
}
```

---

### Media Queries

#### `matchMedia()`

```typescript
matchMedia(query: string): PreviewMediaQueryList
```

- **Parameters**: Media query string
- **Returns**: `PreviewMediaQueryList` (similar to `MediaQueryList`)
- **Description**: Create media query list scoped to preview
- **Example**:

```tsx
const mql = windowRef.current.matchMedia("(min-width: 768px)");

console.log("Matches:", mql.matches);

mql.addEventListener("change", (e) => {
  console.log("Query changed:", e.matches);
});
```

#### `setOverrides()`

```typescript
setOverrides(overrides: MediaFeatureOverrides): void
```

- **Description**: Update media feature overrides
- **Example**:

```tsx
windowRef.current.setOverrides({
  "prefers-color-scheme": "dark",
});
```

---

### Export

#### `exportAsImage()`

```typescript
exportAsImage(options?: ExportImageOptions): Promise<string>
```

- **Parameters**: Export options (optional)
- **Returns**: Promise resolving to data URL
- **Options**:

```typescript
interface ExportImageOptions {
  format?: "png" | "jpeg" | "webp"; // Default: "png"
  quality?: number; // 0-1, Default: 0.95
  backgroundColor?: string; // CSS color, Default: "#ffffff"
  scale?: number; // Resolution multiplier, Default: 2
  includeHandles?: boolean; // Include resize handles, Default: false
}
```

- **Example**:

```tsx
// Export as PNG with default settings
const dataUrl = await windowRef.current.exportAsImage();

// Export as JPEG with custom quality
const jpegUrl = await windowRef.current.exportAsImage({
  format: "jpeg",
  quality: 0.9,
  backgroundColor: "#000000",
  scale: 3,
});

// Use the data URL
const img = new Image();
img.src = dataUrl;
document.body.appendChild(img);
```

#### `downloadImage()`

```typescript
downloadImage(filename?: string, options?: ExportImageOptions): Promise<void>
```

- **Parameters**:
  - `filename`: Download filename (default: "preview.png")
  - `options`: Export options (same as `exportAsImage`)
- **Description**: Export and trigger download
- **Example**:

```tsx
// Download with default filename
await windowRef.current.downloadImage();

// Download with custom filename and options
await windowRef.current.downloadImage("my-preview.jpg", {
  format: "jpeg",
  quality: 1,
});
```

---

### External Drag-and-Drop

#### `registerExternalDrag()`

```typescript
registerExternalDrag(pointerId: number): void
```

- **Description**: Register pointer as external drag
- **Example**:

```tsx
const handleDragStart = (event: DragStartEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  windowRef.current.registerExternalDrag(pointerEvent.pointerId);
};
```

#### `unregisterExternalDrag()`

```typescript
unregisterExternalDrag(pointerId: number): void
```

- **Description**: Unregister pointer
- **Example**:

```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  windowRef.current.unregisterExternalDrag(pointerEvent.pointerId);
};
```

---

## Type Definitions

### Core Types

#### `VirtualWindowSize`

```typescript
interface VirtualWindowSize {
  width: number; // Logical width in pixels
  height: number; // Logical height in pixels
}
```

#### `VirtualWindowPosition`

```typescript
interface VirtualWindowPosition {
  x: number; // CSS pixels from parent's top-left
  y: number;
}
```

#### `DevicePreset`

```typescript
interface DevicePreset {
  width: number;
  height: number;
  pixelRatio: number;
  displayName: string;
  category: "mobile" | "tablet" | "desktop";
  userAgent?: string;
  chrome?: {
    top?: number;
    bottom?: number;
  };
  hasNotch?: boolean;
}
```

#### `MediaFeatureOverrides`

```typescript
interface MediaFeatureOverrides {
  "prefers-color-scheme"?: "light" | "dark";
  "prefers-reduced-motion"?: "no-preference" | "reduce";
  "prefers-contrast"?: "no-preference" | "more" | "less";
  hover?: "none" | "hover";
  pointer?: "none" | "coarse" | "fine";
}
```

#### `ExportImageOptions`

```typescript
interface ExportImageOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number; // 0-1 for JPEG/WebP
  backgroundColor?: string; // CSS color
  scale?: number; // Resolution multiplier
  includeHandles?: boolean; // Include resize handles
}
```

#### `ExternalDropEvent`

```typescript
interface ExternalDropEvent {
  x: number; // Preview-local X (scale-compensated)
  y: number; // Preview-local Y (scale-compensated)
  nativeEvent: PointerEvent;
}
```

---

## Device Presets

### Mobile Devices

```typescript
const mobilePresets = {
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
  "iphone-se": {
    width: 375,
    height: 667,
    pixelRatio: 2,
    category: "mobile",
  },
  "pixel-7": {
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    category: "mobile",
  },
  "pixel-7-pro": {
    width: 412,
    height: 892,
    pixelRatio: 3.5,
    category: "mobile",
  },
  "galaxy-s23": {
    width: 360,
    height: 780,
    pixelRatio: 3,
    category: "mobile",
  },
  "galaxy-s23-ultra": {
    width: 384,
    height: 854,
    pixelRatio: 3.5,
    category: "mobile",
  },
};
```

### Tablet Devices

```typescript
const tabletPresets = {
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
  "ipad-air": {
    width: 820,
    height: 1180,
    pixelRatio: 2,
    category: "tablet",
  },
  "ipad-mini": {
    width: 744,
    height: 1133,
    pixelRatio: 2,
    category: "tablet",
  },
  "galaxy-tab-s9": {
    width: 800,
    height: 1280,
    pixelRatio: 2,
    category: "tablet",
  },
};
```

### Desktop Devices

```typescript
const desktopPresets = {
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

---

## Hooks

### `usePreviewMatchMedia`

```typescript
function usePreviewMatchMedia(
  windowRef: React.RefObject<VirtualWindowRef>,
  query: string,
): boolean;
```

- **Description**: React hook for responsive design
- **Parameters**:
  - `windowRef`: Ref to VirtualWindow instance
  - `query`: Media query string
- **Returns**: Boolean indicating if query matches
- **Example**:

```tsx
function ResponsiveComponent() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const isMobile = usePreviewMatchMedia(windowRef, "(max-width: 767px)");

  const isTablet = usePreviewMatchMedia(
    windowRef,
    "(min-width: 768px) and (max-width: 1023px)",
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

<VirtualWindow ref={windowRef}>
  <ResponsiveComponent />
</VirtualWindow>;
```

---

## Utilities

### `getDevicePreset()`

```typescript
function getDevicePreset(preset: string | DevicePreset): DevicePreset | null;
```

- **Description**: Get preset by name or return custom preset
- **Parameters**: Preset name or custom preset object
- **Returns**: Preset object or null if not found
- **Example**:

```typescript
import { getDevicePreset } from "./lib/devicePresets";

const preset = getDevicePreset("iphone-15-pro");
console.log(preset.width, preset.height); // 393 852
```

---

## Events

### Media Query Change Event

```typescript
interface MediaQueryListEvent {
  matches: boolean; // Current match state
  media: string; // Query string
}
```

**Usage:**

```tsx
const mql = windowRef.current.matchMedia("(min-width: 768px)");

mql.addEventListener("change", (event) => {
  console.log("Query:", event.media);
  console.log("Matches:", event.matches);
});
```

---

## Complete Usage Example

```tsx
import React, { useRef, useState, useEffect } from "react";
import VirtualWindow, { type VirtualWindowRef } from "./VirtualWindow";
import { usePreviewMatchMedia } from "./hooks/usePreviewMatchMedia";

function App() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState({ width: 375, height: 667 });

  // Responsive hook
  const isMobile = usePreviewMatchMedia(windowRef, "(max-width: 767px)");

  // Setup on mount
  useEffect(() => {
    if (!windowRef.current) return;

    // Add custom styles
    windowRef.current.addGlobalStyle(`
      body {
        font-family: "Inter", sans-serif;
        padding: 20px;
      }
    `);

    // Listen to media query
    const mql = windowRef.current.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent) => {
      console.log("Landscape:", e.matches);
    };
    mql.addEventListener("change", handler);

    return () => mql.removeEventListener("change", handler);
  }, []);

  // Export handler
  const handleExport = async () => {
    const dataUrl = await windowRef.current?.exportAsImage({
      format: "png",
      quality: 1,
      scale: 2,
    });

    if (dataUrl) {
      // Download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "preview.png";
      link.click();
    }
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => windowRef.current?.zoomIn()}>Zoom In</button>
        <button onClick={() => windowRef.current?.zoomOut()}>Zoom Out</button>
        <button onClick={() => windowRef.current?.resetZoom()}>Reset</button>
        <button onClick={handleExport}>Export</button>
        <span>Scale: {(scale * 100).toFixed(0)}%</span>
      </div>

      {/* Preview */}
      <VirtualWindow
        ref={windowRef}
        width={size.width}
        height={size.height}
        scale={scale}
        resizable
        draggable
        preset="iphone-15-pro"
        mediaFeatureOverrides={{
          "prefers-color-scheme": "dark",
        }}
        onResize={(newSize) => setSize(newSize)}
        onScaleChange={(newScale) => setScale(newScale)}
      >
        <YourApp isMobile={isMobile} />
      </VirtualWindow>
    </div>
  );
}
```

---

## TypeScript Support

All exports are fully typed:

```tsx
import VirtualWindow, {
  // Component types
  type VirtualWindowProps,
  type VirtualWindowRef,

  // Data types
  type VirtualWindowSize,
  type VirtualWindowPosition,
  type DevicePreset,
  type MediaFeatureOverrides,
  type ExportImageOptions,
  type ExternalDropEvent,

  // Utility types
  type PreviewMediaQueryList,
} from "./VirtualWindow";
```

---

## Notes

- All dimensions are in **logical pixels** (not physical pixels)
- Scale is **visual only** (doesn't affect media queries)
- Coordinates from `toLocalPoint()` are **scale-compensated**
- Export quality best at `scale: 2` for retina displays
- Media queries require explicit `container` or `scroller` for scroll-based animations
