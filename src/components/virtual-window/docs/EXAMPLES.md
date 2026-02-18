# VirtualWindow Examples

Quick reference examples for common use cases.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Responsive Design](#responsive-design)
3. [Device Simulation](#device-simulation)
4. [Zoom Controls](#zoom-controls)
5. [Screenshot Export](#screenshot-export)
6. [Custom Styling](#custom-styling)
7. [Drag and Drop](#drag-and-drop)
8. [Animations](#animations)
9. [Advanced Patterns](#advanced-patterns)

---

## Basic Usage

### Minimal Example

```tsx
import VirtualWindow from "./VirtualWindow";

function App() {
  return (
    <VirtualWindow width={375} height={667}>
      <div style={{ padding: "20px" }}>
        <h1>Hello World</h1>
        <p>This is rendered in an isolated preview.</p>
      </div>
    </VirtualWindow>
  );
}
```

### With Ref

```tsx
import { useRef } from "react";
import VirtualWindow, { type VirtualWindowRef } from "./VirtualWindow";

function App() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const logSize = () => {
    const size = windowRef.current?.getSize();
    console.log(size);
  };

  return (
    <>
      <button onClick={logSize}>Log Size</button>
      <VirtualWindow ref={windowRef} width={600} height={400}>
        <MyApp />
      </VirtualWindow>
    </>
  );
}
```

---

## Responsive Design

### Media Query Hook

```tsx
import { useRef } from "react";
import VirtualWindow, { type VirtualWindowRef } from "./VirtualWindow";
import { usePreviewMatchMedia } from "./hooks/usePreviewMatchMedia";

function ResponsiveApp() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const isMobile = usePreviewMatchMedia(windowRef, "(max-width: 767px)");
  const isTablet = usePreviewMatchMedia(
    windowRef,
    "(min-width: 768px) and (max-width: 1023px)",
  );
  const isDesktop = usePreviewMatchMedia(windowRef, "(min-width: 1024px)");

  return (
    <>
      <div>
        Current: {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}
      </div>
      <VirtualWindow ref={windowRef} width={375} height={667}>
        <div>
          {isMobile && <MobileNav />}
          {isTablet && <TabletNav />}
          {isDesktop && <DesktopNav />}
          <Content />
        </div>
      </VirtualWindow>
    </>
  );
}
```

### Breakpoint Testing

```tsx
import { useState } from "react";

function BreakpointTester() {
  const [width, setWidth] = useState(375);

  return (
    <div>
      <input
        type="range"
        min="320"
        max="1920"
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
      />
      <span>{width}px</span>

      <VirtualWindow width={width} height={667}>
        <ResponsiveContent />
      </VirtualWindow>
    </div>
  );
}
```

---

## Device Simulation

### Device Switcher

```tsx
import { useState } from "react";

const devices = [
  { name: "iPhone 15 Pro", preset: "iphone-15-pro" },
  { name: "iPad Air", preset: "ipad-air" },
  { name: "MacBook Air", preset: "macbook-air" },
];

function DeviceSwitcher() {
  const [preset, setPreset] = useState("iphone-15-pro");

  return (
    <div>
      <select value={preset} onChange={(e) => setPreset(e.target.value)}>
        {devices.map((device) => (
          <option key={device.preset} value={device.preset}>
            {device.name}
          </option>
        ))}
      </select>

      <VirtualWindow preset={preset}>
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

### Dark Mode Testing

```tsx
import { useState } from "react";

function DarkModeTester() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  return (
    <div>
      <button
        onClick={() =>
          setColorScheme(colorScheme === "light" ? "dark" : "light")
        }
      >
        Toggle Dark Mode
      </button>

      <VirtualWindow
        width={375}
        height={667}
        mediaFeatureOverrides={{
          "prefers-color-scheme": colorScheme,
        }}
      >
        <ThemeAwareApp />
      </VirtualWindow>
    </div>
  );
}

function ThemeAwareApp() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const isDark = usePreviewMatchMedia(
    windowRef,
    "(prefers-color-scheme: dark)",
  );

  return (
    <div style={{ background: isDark ? "#1a1a1a" : "#ffffff" }}>
      <h1>Current theme: {isDark ? "Dark" : "Light"}</h1>
    </div>
  );
}
```

---

## Zoom Controls

### Basic Zoom

```tsx
import { useRef, useState } from "react";

function ZoomControls() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [scale, setScale] = useState(1);

  return (
    <div>
      <button onClick={() => windowRef.current?.zoomIn()}>+</button>
      <button onClick={() => windowRef.current?.zoomOut()}>-</button>
      <button onClick={() => windowRef.current?.resetZoom()}>Reset</button>
      <span>{(scale * 100).toFixed(0)}%</span>

      <VirtualWindow ref={windowRef} scale={scale} onScaleChange={setScale}>
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

### Zoom Slider

```tsx
function ZoomSlider() {
  const [scale, setScale] = useState(1);

  return (
    <div>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        value={scale}
        onChange={(e) => setScale(Number(e.target.value))}
      />
      <span>{(scale * 100).toFixed(0)}%</span>

      <VirtualWindow scale={scale}>
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

### Fit to Width

```tsx
function FitToWidth() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fitToWidth = () => {
    const container = containerRef.current;
    const window = windowRef.current;

    if (container && window) {
      const containerWidth = container.offsetWidth;
      const windowSize = window.getSize();
      const scale = containerWidth / windowSize.width;
      window.setScale(scale);
    }
  };

  return (
    <div>
      <button onClick={fitToWidth}>Fit to Width</button>
      <div ref={containerRef} style={{ width: "100%", overflow: "auto" }}>
        <VirtualWindow ref={windowRef} width={1200} height={800}>
          <WideContent />
        </VirtualWindow>
      </div>
    </div>
  );
}
```

---

## Screenshot Export

### Basic Export

```tsx
function ExportButton() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const handleExport = async () => {
    const dataUrl = await windowRef.current?.exportAsImage();

    if (dataUrl) {
      // Open in new tab
      const win = window.open();
      win.document.write(`<img src="${dataUrl}" />`);
    }
  };

  return (
    <>
      <button onClick={handleExport}>Export</button>
      <VirtualWindow ref={windowRef}>
        <MyApp />
      </VirtualWindow>
    </>
  );
}
```

### Export with Options

```tsx
function ExportWithOptions() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.95);

  const handleExport = async () => {
    await windowRef.current?.downloadImage(`preview.${format}`, {
      format,
      quality,
      backgroundColor: format === "jpeg" ? "#ffffff" : undefined,
      scale: 2,
    });
  };

  return (
    <div>
      <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
        <option value="png">PNG</option>
        <option value="jpeg">JPEG</option>
        <option value="webp">WebP</option>
      </select>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={quality}
        onChange={(e) => setQuality(Number(e.target.value))}
      />

      <button onClick={handleExport}>Download</button>

      <VirtualWindow ref={windowRef}>
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

### Copy to Clipboard

```tsx
function CopyToClipboard() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const handleCopy = async () => {
    const dataUrl = await windowRef.current?.exportAsImage();

    if (dataUrl) {
      // Convert data URL to blob
      const blob = await fetch(dataUrl).then((r) => r.blob());

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      alert("Copied to clipboard!");
    }
  };

  return (
    <>
      <button onClick={handleCopy}>Copy Image</button>
      <VirtualWindow ref={windowRef}>
        <MyApp />
      </VirtualWindow>
    </>
  );
}
```

---

## Custom Styling

### Inject Global Styles

```tsx
import { useEffect, useRef } from "react";

function StyledPreview() {
  const windowRef = useRef<VirtualWindowRef>(null);

  useEffect(() => {
    windowRef.current?.addGlobalStyle(`
      * {
        font-family: "Inter", sans-serif;
      }
      
      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px;
      }
      
      h1 {
        font-size: 48px;
        margin-bottom: 20px;
      }
      
      .button {
        padding: 12px 24px;
        background: white;
        color: #667eea;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
    `);
  }, []);

  return (
    <VirtualWindow ref={windowRef}>
      <div>
        <h1>Styled Preview</h1>
        <button className="button">Click Me</button>
      </div>
    </VirtualWindow>
  );
}
```

### Theme Switcher

```tsx
function ThemeSwitcher() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const styles =
      theme === "light"
        ? `
      body {
        background: #ffffff;
        color: #1a1a1a;
      }
    `
        : `
      body {
        background: #1a1a1a;
        color: #ffffff;
      }
    `;

    windowRef.current?.addGlobalStyle(styles);
  }, [theme]);

  return (
    <div>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
      <VirtualWindow ref={windowRef}>
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

---

## Drag and Drop

### Drag Items Into Preview

```tsx
import { DndContext, useDraggable } from "@dnd-kit/core";

function DragDropExample() {
  const windowRef = useRef<VirtualWindowRef>(null);
  const [items, setItems] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);

  const handleDragStart = (event) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    windowRef.current?.registerExternalDrag(pointerEvent.pointerId);
  };

  const handleDragEnd = (event) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + (event.delta?.x || 0);
    const finalY = pointerEvent.clientY + (event.delta?.y || 0);

    if (windowRef.current?.isPointInside(finalX, finalY)) {
      const local = windowRef.current.toLocalPoint({
        clientX: finalX,
        clientY: finalY,
      } as PointerEvent);

      if (local) {
        setItems((prev) => [
          ...prev,
          { id: `item-${Date.now()}`, x: local.x, y: local.y },
        ]);
      }
    }

    windowRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DraggableItem />

      <VirtualWindow ref={windowRef}>
        <Canvas items={items} />
      </VirtualWindow>
    </DndContext>
  );
}

function DraggableItem() {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: "item" });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      Drag me into preview
    </div>
  );
}
```

---

## Animations

### GSAP ScrollTrigger

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.to(".box", {
        x: 200,
        scrollTrigger: {
          trigger: ".box",
          start: "top center",
          end: "bottom center",
          scrub: true,
          scroller: container, // ← CRITICAL
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <VirtualWindow>
      <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
        <div style={{ height: "200vh" }}>
          <div className="box" style={{ marginTop: "50vh" }}>
            Scroll to animate
          </div>
        </div>
      </div>
    </VirtualWindow>
  );
}
```

### Framer Motion

```tsx
import { motion, useScroll } from "framer-motion";
import { useRef } from "react";

function MotionAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  return (
    <VirtualWindow>
      <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
        <motion.div
          style={{
            scaleX: scrollYProgress,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "blue",
            transformOrigin: "0%",
          }}
        />
        <div style={{ height: "300vh", padding: "40px" }}>
          <h1>Scroll Progress</h1>
        </div>
      </div>
    </VirtualWindow>
  );
}
```

---

## Advanced Patterns

### Multi-Window Manager

```tsx
function MultiWindowManager() {
  const [windows, setWindows] = useState([
    { id: 1, preset: "iphone-15-pro", x: 0, y: 0 },
    { id: 2, preset: "ipad-air", x: 400, y: 0 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {windows.map((win) => (
        <div
          key={win.id}
          style={{
            position: "absolute",
            left: win.x,
            top: win.y,
          }}
        >
          <VirtualWindow preset={win.preset} draggable>
            <MyApp />
          </VirtualWindow>
        </div>
      ))}
    </div>
  );
}
```

### Controlled Size and Scale

```tsx
function ControlledPreview() {
  const [size, setSize] = useState({ width: 375, height: 667 });
  const [scale, setScale] = useState(1);

  return (
    <div>
      <div>
        Width:{" "}
        <input
          type="number"
          value={size.width}
          onChange={(e) => setSize({ ...size, width: Number(e.target.value) })}
        />
        Height:{" "}
        <input
          type="number"
          value={size.height}
          onChange={(e) => setSize({ ...size, height: Number(e.target.value) })}
        />
      </div>

      <VirtualWindow
        width={size.width}
        height={size.height}
        scale={scale}
        onResize={setSize}
        onScaleChange={setScale}
      >
        <MyApp />
      </VirtualWindow>
    </div>
  );
}
```

### Sync Multiple Previews

```tsx
function SyncedPreviews() {
  const [sharedState, setSharedState] = useState({ theme: "light" });

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <VirtualWindow preset="iphone-15-pro">
        <SharedApp state={sharedState} setState={setSharedState} />
      </VirtualWindow>

      <VirtualWindow preset="ipad-air">
        <SharedApp state={sharedState} setState={setSharedState} />
      </VirtualWindow>
    </div>
  );
}

function SharedApp({ state, setState }) {
  return (
    <div>
      <button
        onClick={() =>
          setState({ theme: state.theme === "light" ? "dark" : "light" })
        }
      >
        Toggle Theme
      </button>
      <p>Current theme: {state.theme}</p>
    </div>
  );
}
```

### Lazy Loaded Preview

```tsx
import { Suspense, lazy } from "react";

const HeavyApp = lazy(() => import("./HeavyApp"));

function LazyPreview() {
  return (
    <VirtualWindow>
      <Suspense fallback={<div>Loading preview...</div>}>
        <HeavyApp />
      </Suspense>
    </VirtualWindow>
  );
}
```

---

## Tips

### Performance

```tsx
// ✅ Memoize expensive children
const MemoizedContent = React.memo(Content);

<VirtualWindow>
  <MemoizedContent />
</VirtualWindow>;
```

### Error Boundaries

```tsx
import { ErrorBoundary } from "react-error-boundary";

function SafePreview() {
  return (
    <VirtualWindow>
      <ErrorBoundary fallback={<div>Preview error</div>}>
        <UnsafeContent />
      </ErrorBoundary>
    </VirtualWindow>
  );
}
```

### Context Preservation

```tsx
// React context works normally across portal
<ThemeProvider theme={theme}>
  <VirtualWindow>
    <ComponentThatUsesTheme /> {/* ✅ Has access to theme */}
  </VirtualWindow>
</ThemeProvider>
```

---

For more examples, see the `demos/` folder in the repository.
