# VirtualWindow Troubleshooting Guide

This guide covers common issues, their causes, and solutions when working with VirtualWindow.

## Table of Contents

1. [Rendering Issues](#rendering-issues)
2. [Style Issues](#style-issues)
3. [Animation Issues](#animation-issues)
4. [Drag-and-Drop Issues](#drag-and-drop-issues)
5. [Export Issues](#export-issues)
6. [Performance Issues](#performance-issues)
7. [TypeScript Issues](#typescript-issues)
8. [Browser-Specific Issues](#browser-specific-issues)

---

## Rendering Issues

### Issue: Children don't render

**Symptoms:**

- VirtualWindow appears but children are invisible
- React DevTools shows children in tree but nothing displays

**Causes:**

1. Shadow root not initialized yet
2. Portal target doesn't exist
3. Children have `display: none` from inherited styles

**Solutions:**

**Check shadow root initialization:**

```tsx
// ✅ Good: Check if ref is ready
useEffect(() => {
  if (!windowRef.current) {
    console.log("VirtualWindow not ready");
    return;
  }

  console.log("Shadow root:", windowRef.current.shadowRoot);
}, []);
```

**Ensure children render conditionally:**

```tsx
// If dynamically showing VirtualWindow
const [show, setShow] = useState(false);

// ❌ Bad: Children may render before shadow ready
{
  show && (
    <VirtualWindow>
      <MyComponent /> // May not appear
    </VirtualWindow>
  );
}

// ✅ Good: Give shadow root time to initialize
{
  show && (
    <VirtualWindow>
      <Suspense fallback={<div>Loading...</div>}>
        <MyComponent />
      </Suspense>
    </VirtualWindow>
  );
}
```

**Check for style resets:**

```tsx
// Add explicit styles to children
<VirtualWindow>
  <div style={{ display: "block", width: "100%", height: "100%" }}>
    <MyComponent />
  </div>
</VirtualWindow>
```

---

### Issue: Content overflows or clips

**Symptoms:**

- Content cut off at edges
- Scrollbars appear unexpectedly
- Content extends beyond preview bounds

**Causes:**

1. Mount node has `overflow: hidden`
2. Children have absolute positioning without container
3. Scale affects visual bounds

**Solutions:**

**Set explicit overflow behavior:**

```tsx
<VirtualWindow>
  <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
    <LargeContent />
  </div>
</VirtualWindow>
```

**Account for scale in sizing:**

```tsx
const windowRef = useRef<VirtualWindowRef>(null);
const scale = windowRef.current?.getScale() ?? 1;

// Adjust content size based on scale
<div style={{ width: `${400 / scale}px` }}>Content</div>;
```

---

### Issue: Blank screen on first render

**Symptoms:**

- VirtualWindow shows nothing initially
- Content appears after state update or interaction

**Cause:** React Suspense boundary or async data loading before shadow ready

**Solution:**

```tsx
function App() {
  const [shadowReady, setShadowReady] = useState(false);

  return (
    <VirtualWindow>
      <ShadowReadyDetector onReady={() => setShadowReady(true)} />
      {shadowReady && <ActualContent />}
    </VirtualWindow>
  );
}

function ShadowReadyDetector({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}
```

---

## Style Issues

### Issue: Styles from host application leak into preview

**Symptoms:**

- Preview content has unexpected styles
- Reset styles don't work
- Theme from outside affects preview

**Cause:** Using `:root` or `html`/`body` selectors that pierce shadow DOM

**Solution:**

Shadow DOM isolation is complete. If styles are leaking:

1. **Check for `!important` rules** - These don't leak, but inherited properties do
2. **Check inherited properties** - `font-family`, `color`, etc. are inherited

```tsx
// Reset inherited properties explicitly
windowRef.current?.addGlobalStyle(`
  * {
    font-family: system-ui, sans-serif;
    color: initial;
    line-height: initial;
  }
`);
```

---

### Issue: External stylesheets don't load

**Symptoms:**

- Linked CSS files don't apply
- `<link>` tags have no effect

**Cause:** Shadow DOM doesn't load external stylesheets automatically

**Solution:**

**Load stylesheets explicitly:**

```tsx
useEffect(() => {
  windowRef.current?.addGlobalStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Roboto');
  `);

  // Or fetch and inject
  fetch("/path/to/styles.css")
    .then((res) => res.text())
    .then((css) => windowRef.current?.addGlobalStyle(css));
}, []);
```

---

### Issue: CSS custom properties don't work

**Symptoms:**

- `var(--my-color)` shows fallback value
- Custom properties defined outside preview don't work

**Cause:** CSS custom properties don't inherit into shadow DOM

**Solution:**

**Define custom properties inside shadow root:**

```tsx
windowRef.current?.addGlobalStyle(`
  :host {
    --primary-color: #3b82f6;
    --spacing: 16px;
  }
  
  .button {
    background: var(--primary-color);
    padding: var(--spacing);
  }
`);
```

---

## Animation Issues

### Issue: GSAP ScrollTrigger doesn't fire

**Symptoms:**

- Scroll animations don't trigger
- `markers: true` shows no markers
- Animations work outside VirtualWindow but not inside

**Cause:** ScrollTrigger listening to `window` instead of preview container

**Solution:**

```tsx
// ❌ Bad: Uses window
gsap.to(element, {
  x: 100,
  scrollTrigger: {
    trigger: element,
    start: "top center",
    // Missing scroller!
  },
});

// ✅ Good: Uses preview container
const containerRef = useRef<HTMLDivElement>(null);

gsap.to(element, {
  x: 100,
  scrollTrigger: {
    trigger: element,
    start: "top center",
    scroller: containerRef.current, // ← CRITICAL
  },
});
```

**Complete pattern:**

```tsx
function ScrollContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.to(".box", {
        x: 100,
        scrollTrigger: {
          trigger: ".box",
          scroller: container, // ← Always specify
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div className="box">Scroll me</div>
    </div>
  );
}
```

---

### Issue: Framer Motion `useScroll` doesn't work

**Symptoms:**

- `scrollYProgress` always 0
- Scroll animations don't trigger
- Works outside VirtualWindow

**Cause:** `useScroll` listening to `window` instead of preview container

**Solution:**

```tsx
// ❌ Bad: Uses window
const { scrollYProgress } = useScroll();

// ✅ Good: Uses preview container
const containerRef = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  container: containerRef, // ← CRITICAL
});

return (
  <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
    <motion.div style={{ opacity: scrollYProgress }}>Content</motion.div>
  </div>
);
```

---

### Issue: Animations jank or stutter

**Symptoms:**

- Animations not smooth
- Visible frame drops
- Better performance outside VirtualWindow

**Causes:**

1. Animating layout properties (`width`, `height`, `top`, `left`)
2. Not using `will-change`
3. Expensive re-renders

**Solutions:**

**Use transform and opacity:**

```tsx
// ❌ Bad: Triggers layout
gsap.to(element, { width: 500, height: 300 });

// ✅ Good: GPU-accelerated
gsap.to(element, { scaleX: 2, scaleY: 1.5 });
```

**Add `will-change`:**

```tsx
<motion.div
  style={{ willChange: "transform, opacity" }}
  animate={{ x: 100, opacity: 0.5 }}
/>
```

**Memoize expensive components:**

```tsx
const ExpensiveChild = React.memo(({ data }) => {
  return <ComplexRender data={data} />;
});
```

---

## Drag-and-Drop Issues

### Issue: External drag doesn't detect drop

**Symptoms:**

- Dragging from outside into VirtualWindow doesn't trigger drop
- `onExternalDrop` never fires
- Items can't be added to preview

**Causes:**

1. Forgot to call `registerExternalDrag()`
2. Forgot to call `unregisterExternalDrag()`
3. Not checking `isPointInside()` before drop

**Solution:**

**Complete flow:**

```tsx
const windowRef = useRef<VirtualWindowRef>(null);

const handleDragStart = (event: DragStartEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  windowRef.current?.registerExternalDrag(pointerEvent.pointerId);
};

const handleDragEnd = (event: DragEndEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  const finalX = pointerEvent.clientX + (event.delta?.x || 0);
  const finalY = pointerEvent.clientY + (event.delta?.y || 0);

  // ← CRITICAL: Check if inside
  if (windowRef.current?.isPointInside(finalX, finalY)) {
    const localPoint = windowRef.current.toLocalPoint({
      clientX: finalX,
      clientY: finalY,
    } as PointerEvent);

    if (localPoint) {
      // Add item at localPoint.x, localPoint.y
    }
  }

  // ← CRITICAL: Always unregister
  windowRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
};
```

---

### Issue: Drag coordinates are wrong

**Symptoms:**

- Items drop at wrong position
- Offset from cursor
- Position changes with scale

**Cause:** Not using `toLocalPoint()` or not accounting for scale

**Solution:**

```tsx
// ❌ Bad: Uses global coordinates
const x = event.clientX;
const y = event.clientY;

// ✅ Good: Converts to preview-local coordinates
const localPoint = windowRef.current?.toLocalPoint(event);
if (localPoint) {
  const { x, y } = localPoint; // These are scale-compensated
  // Use x, y
}
```

---

### Issue: `useDroppable` doesn't work inside preview

**Symptoms:**

- dnd-kit's `useDroppable` zones don't detect drops
- `isOver` always false
- Works outside VirtualWindow

**Cause:** dnd-kit's collision detection can't traverse shadow DOM

**Solution:**

**Don't use `useDroppable` inside shadow DOM. Use manual hit-testing:**

```tsx
// ❌ Bad: Won't work in shadow DOM
const { setNodeRef, isOver } = useDroppable({ id: "dropzone" });

// ✅ Good: Manual collision detection
const handleDragEnd = (event: DragEndEvent) => {
  const dropzone = { x: 100, y: 100, width: 200, height: 200 };

  if (windowRef.current?.isPointInside(finalX, finalY)) {
    const local = windowRef.current.toLocalPoint({
      clientX: finalX,
      clientY: finalY,
    });

    const isOverDropzone =
      local.x >= dropzone.x &&
      local.x <= dropzone.x + dropzone.width &&
      local.y >= dropzone.y &&
      local.y <= dropzone.y + dropzone.height;

    if (isOverDropzone) {
      // Drop into dropzone
    }
  }
};
```

---

## Export Issues

### Issue: Export produces blank image

**Symptoms:**

- `exportAsImage()` returns data URL
- Image is all white/transparent
- No errors

**Causes:**

1. Content element not found
2. Content has `display: none`
3. Content hasn't finished rendering

**Solutions:**

**Wait for content to render:**

```tsx
const handleExport = async () => {
  // Wait a frame for any pending renders
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const dataUrl = await windowRef.current?.exportAsImage();
  // Use dataUrl
};
```

**Check content element:**

```tsx
// Debug export
console.log(
  "Mount node:",
  windowRef.current?.shadowRoot?.querySelector(".mount-node"),
);
console.log(
  "First child:",
  windowRef.current?.shadowRoot?.querySelector(".mount-node")
    ?.firstElementChild,
);
```

---

### Issue: Cross-origin images not captured

**Symptoms:**

- Images from CDN don't appear in export
- Image shows as blank in exported PNG
- Console shows CORS error

**Cause:** html2canvas can't capture cross-origin images without CORS headers

**Solutions:**

#### ption 1: Serve images from same origin

```tsx
// ❌ Bad: Cross-origin
<img src="https://cdn.example.com/image.jpg" />

// ✅ Good: Same origin
<img src="/api/proxy-image?url=https://cdn.example.com/image.jpg" />
```

#### Option 2: Add CORS headers on CDN

```text
Access-Control-Allow-Origin: *
```

**Option 3: Use `crossOrigin` attribute**

```tsx
<img src="https://cdn.example.com/image.jpg" crossOrigin="anonymous" />
```

---

### Issue: Export is slow (>5 seconds)

**Symptoms:**

- `exportAsImage()` takes a long time
- Browser freezes during export
- Large previews especially slow

**Causes:**

1. Large DOM (>10,000 elements)
2. High scale setting
3. Complex CSS (shadows, filters, gradients)

**Solutions:**

**Reduce scale:**

```tsx
// ❌ Slow: 4x resolution
await windowRef.current?.exportAsImage({ scale: 4 });

// ✅ Faster: 2x resolution
await windowRef.current?.exportAsImage({ scale: 2 });
```

**Show loading indicator:**

```tsx
const handleExport = async () => {
  setIsExporting(true);
  try {
    const dataUrl = await windowRef.current?.exportAsImage();
    // Use dataUrl
  } finally {
    setIsExporting(false);
  }
};
```

**Simplify content before export:**

```tsx
// Temporarily disable expensive effects
const handleExport = async () => {
  setSimplifiedMode(true);
  await new Promise((r) => requestAnimationFrame(r));

  const dataUrl = await windowRef.current?.exportAsImage();

  setSimplifiedMode(false);
  return dataUrl;
};
```

---

## Performance Issues

### Issue: Resize is laggy

**Symptoms:**

- Resize handles stutter
- Frame rate drops during resize
- Preview updates slowly

**Causes:**

1. Not using RAF batching
2. Expensive re-renders on size change
3. Many document listeners

**Solutions:**

**Batch state updates:**

```tsx
// Use React 18 automatic batching or manual batching
ReactDOM.unstable_batchedUpdates(() => {
  setSize(newSize);
  setItems(newItems);
});
```

**Debounce callbacks:**

```tsx
const debouncedResize = useMemo(
  () =>
    debounce((size) => {
      // Expensive operation
    }, 100),
  [],
);

<VirtualWindow onResize={debouncedResize} />;
```

**Memoize children:**

```tsx
const MemoizedContent = React.memo(Content);

<VirtualWindow>
  <MemoizedContent />
</VirtualWindow>;
```

---

### Issue: Nested containers extremely slow

**Symptoms:**

- Dragging items in nested containers stutters
- > 5 levels of nesting unusable
- Performance degrades with depth

**Cause:** Current implementation uses O(n × depth) path traversal

**Solution:**

See MISSING_FEATURES.md section on "Performance Optimization for Nested Containers" for complete normalized state solution.

**Quick mitigation:**

- Limit nesting to <3 levels
- Use React.memo on container components
- Avoid deep nesting when possible

---

### Issue: Memory leak / performance degrades over time

**Symptoms:**

- App gets slower after 10+ minutes
- Memory usage constantly increases
- DevTools shows detached DOM nodes

**Causes:**

1. Event listeners not cleaned up
2. GSAP animations not killed
3. RAF not cancelled

**Solutions:**

**Check cleanup in effects:**

```tsx
useEffect(() => {
  const listener = () => {};
  document.addEventListener("event", listener);

  // ✅ CRITICAL: Always cleanup
  return () => {
    document.removeEventListener("event", listener);
  };
}, []);
```

**Kill GSAP animations:**

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(element, { x: 100 });
  }, container);

  // ✅ CRITICAL: Revert context
  return () => ctx.revert();
}, []);
```

**Cancel RAF:**

```tsx
useEffect(() => {
  let rafId: number | null = null;

  const animate = () => {
    // Animation logic
    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);

  // ✅ CRITICAL: Cancel RAF
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}, []);
```

---

## TypeScript Issues

### Issue: Ref type errors

**Symptoms:**

```error
Property 'resize' does not exist on type 'never'
```

**Cause:** Ref not typed correctly

**Solution:**

```tsx
import { type VirtualWindowRef } from "./VirtualWindow";

// ✅ Correct typing
const windowRef = useRef<VirtualWindowRef>(null);

// Access methods
windowRef.current?.resize(400, 600);
windowRef.current?.exportAsImage();
```

---

### Issue: Props type errors with device presets

**Symptoms:**

```error
Type '"iphone-14"' is not assignable to type 'string | DevicePreset'
```

**Cause:** Using invalid preset name

**Solution:**

Valid preset names are:

- `iphone-15-pro`, `iphone-15-pro-max`, `iphone-se`
- `pixel-7`, `pixel-7-pro`
- `galaxy-s23`, `galaxy-s23-ultra`
- `ipad-pro-11`, `ipad-pro-13`, `ipad-air`, `ipad-mini`
- `galaxy-tab-s9`
- `macbook-air`, `macbook-pro-14`, `macbook-pro-16`

```tsx
// ❌ Bad: Invalid preset
<VirtualWindow preset="iphone-14" />

// ✅ Good: Valid preset
<VirtualWindow preset="iphone-15-pro" />
```

---

## Browser-Specific Issues

### Issue: Safari - pointer events not working

**Symptoms:**

- Drag/resize doesn't work in Safari
- Events fire inconsistently
- Works in Chrome/Firefox

**Cause:** Safari's pointer event implementation differences

**Solution:**

**Use `composedPath()` for event targets:**

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
  const path = e.nativeEvent.composedPath?.() ?? [];
  const target = path[0] as HTMLElement;

  // Use target instead of e.target
};
```

---

### Issue: Firefox - transform rendering artifacts

**Symptoms:**

- Blurry text with scale
- Rendering glitches during resize
- Pixelation

**Cause:** Firefox's rendering pipeline differences

**Solution:**

**Disable `will-change` in Firefox:**

```tsx
const isFirefox = /firefox/i.test(navigator.userAgent);

<div style={{
  transform: `scale(${scale})`,
  willChange: isFirefox ? undefined : "transform",
}}>
```

---

### Issue: Chrome - console warnings about passive listeners

**Symptoms:**

```error
[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event
```

**Cause:** Default event listeners are not passive

**Solution:**

These warnings are informational and don't affect functionality. VirtualWindow uses pointer events (not wheel) which don't trigger these warnings.

If you add custom scroll listeners:

```tsx
element.addEventListener("wheel", handler, { passive: true });
```

---

## Getting Help

If your issue isn't covered here:

1. **Check browser console** for errors
2. **Check React DevTools** to verify component tree
3. **Use Chrome DevTools** to inspect shadow DOM
4. **Enable GSAP markers** if using ScrollTrigger: `markers: true`
5. **Create a minimal reproduction** to isolate the issue
6. **Check GitHub issues** for similar problems
7. **Ask in discussions** with your reproduction

When reporting issues, include:

- Browser and version
- React version
- VirtualWindow version
- Minimal code reproduction
- Console errors (if any)
- Expected vs actual behavior
