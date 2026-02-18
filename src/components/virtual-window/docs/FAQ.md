# Frequently Asked Questions

## General Questions

### What is VirtualWindow?

VirtualWindow is a React component that creates isolated preview environments using Shadow DOM for style encapsulation and React Portals for context preservation. It's designed for page builders, design tools, and any application requiring sandboxed component previews.

### Why VirtualWindow instead of an iframe?

**Pros of VirtualWindow:**

- ✅ Preserves React context (hooks, providers)
- ✅ No cross-origin communication needed
- ✅ Faster (no page load overhead)
- ✅ Simpler coordinate system
- ✅ Better DevTools debugging

**Cons of VirtualWindow:**

- ❌ JavaScript not isolated (but usually not needed)
- ❌ Requires Shadow DOM v1 (modern browsers only)

**When to use iframe:**

- Need JavaScript isolation (sandboxing untrusted code)
- Need to load external URLs

**When to use VirtualWindow:**

- React-based content
- Need React context preservation
- Performance is critical
- No need for JavaScript sandboxing

---

## Technical Questions

### Does VirtualWindow work with Next.js?

Yes, but with considerations:

**Client-side only:**

```tsx
"use client"; // Mark as client component

import dynamic from "next/dynamic";

const VirtualWindow = dynamic(() => import("./VirtualWindow"), {
  ssr: false, // Disable SSR
});

export default function Page() {
  return (
    <VirtualWindow>
      <MyApp />
    </VirtualWindow>
  );
}
```

VirtualWindow requires browser APIs (Shadow DOM, `getBoundingClientRect`, etc.) so it cannot be server-side rendered.

### Does it work with React 17?

VirtualWindow is designed for React 18+. React 17 may work but is not officially supported. Key React 18 features used:

- Automatic batching
- Concurrent rendering (optional)
- Updated TypeScript types

### Can I use localStorage inside VirtualWindow?

**In normal applications:** Yes, `localStorage` works normally inside VirtualWindow.

**In Claude.ai artifacts:** No, browser storage APIs are blocked for security. Use in-memory state instead:

```tsx
// ❌ Doesn't work in Claude artifacts
localStorage.setItem("data", JSON.stringify(data));

// ✅ Works everywhere
const [data, setData] = useState({});
```

### Can I nest VirtualWindow components?

No. Shadow roots cannot contain other shadow roots. You'll get an error if you try:

```tsx
// ❌ Error: Shadow root cannot contain shadow root
<VirtualWindow>
  <VirtualWindow>
    {" "}
    {/* Won't work */}
    <Content />
  </VirtualWindow>
</VirtualWindow>
```

**Workaround:** Use regular containers inside VirtualWindow:

```tsx
<VirtualWindow>
  <Container>
    <Container>
      {" "}
      {/* Regular div, not VirtualWindow */}
      <Content />
    </Container>
  </Container>
</VirtualWindow>
```

### How do I access the shadow DOM in DevTools?

**Chrome:**

1. Open DevTools
2. Click the three dots (⋮) in Elements tab
3. Settings → Enable "Show user agent shadow DOM"
4. Expand `#shadow-root` in Elements tree

**Firefox:**
Shadow DOM visible by default in Inspector.

**Safari:**
Shadow DOM visible by default in Web Inspector.

---

## Usage Questions

### Why don't my styles apply to the preview?

Shadow DOM provides complete style isolation. Styles from outside don't leak in.

**Solutions:**

**1. Inject styles explicitly:**

```tsx
windowRef.current?.addGlobalStyle(`
  body { font-family: "Inter", sans-serif; }
`);
```

**2. Import stylesheets:**

```tsx
<VirtualWindow>
  <div>
    <link rel="stylesheet" href="/path/to/styles.css" />
    <Content />
  </div>
</VirtualWindow>
```

**3. Use CSS-in-JS:**

```tsx
<VirtualWindow>
  <div style={{ fontFamily: "Inter" }}>Content</div>
</VirtualWindow>
```

### Why isn't GSAP ScrollTrigger working?

You forgot to specify the `scroller` option. ScrollTrigger defaults to listening to `window`, but inside VirtualWindow, you need to specify the container:

```tsx
// ❌ Doesn't work
gsap.to(element, {
  scrollTrigger: { trigger: element },
});

// ✅ Works
const containerRef = useRef(null);

gsap.to(element, {
  scrollTrigger: {
    trigger: element,
    scroller: containerRef.current, // ← Add this
  },
});
```

See [ANIMATION_INTEGRATION.md](./ANIMATION_INTEGRATION.md) for complete guide.

### How do I make children scrollable?

The mount node has `overflow: auto` by default. For custom scroll:

```tsx
<VirtualWindow>
  <div style={{ width: "100%", height: "100%", overflowY: "auto" }}>
    <LongContent />
  </div>
</VirtualWindow>
```

### Can I use Tailwind CSS?

Yes, but you need to inject Tailwind's styles into the shadow root:

#### Option 1: CDN (quick but not optimal)

```tsx
windowRef.current?.addGlobalStyle(`
  @import url('https://cdn.jsdelivr.net/npm/tailwindcss@3/base.min.css');
`);
```

#### Option 2: Build output

```tsx
import tailwindStyles from "./output.css?raw"; // Vite

useEffect(() => {
  windowRef.current?.addGlobalStyle(tailwindStyles);
}, []);
```

#### Option 3: Component-level

Use `@apply` in component styles, or use inline Tailwind classes with a custom build.

---

## Feature Questions

### Can I have multiple VirtualWindows on the same page?

Yes! Each VirtualWindow is independent:

```tsx
function MultiPreview() {
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <VirtualWindow preset="iphone-15-pro">
        <MobileApp />
      </VirtualWindow>

      <VirtualWindow preset="ipad-air">
        <TabletApp />
      </VirtualWindow>
    </div>
  );
}
```

### How do I make the preview draggable?

Set the `draggable` prop:

```tsx
<VirtualWindow draggable>
  <MyApp />
</VirtualWindow>
```

To constrain dragging to a header only:

```tsx
<VirtualWindow draggable dragHandle="header">
  <MyApp />
</VirtualWindow>
```

### Can I export transparent PNGs?

Yes, set `backgroundColor` to `"transparent"`:

```tsx
await windowRef.current?.exportAsImage({
  format: "png",
  backgroundColor: "transparent",
});
```

Note: JPEG doesn't support transparency, use PNG or WebP.

### How do I change device orientation?

Swap width and height:

```tsx
const [width, setWidth] = useState(393);
const [height, setHeight] = useState(852);

const rotate = () => {
  setWidth(height);
  setHeight(width);
};

<button onClick={rotate}>Rotate</button>
<VirtualWindow width={width} height={height}>
  <MyApp />
</VirtualWindow>
```

Or use orientation-aware presets and media queries:

```tsx
const isLandscape = usePreviewMatchMedia(windowRef, "(orientation: landscape)");
```

---

## Integration Questions

### How do I integrate with dnd-kit?

See [EXAMPLES.md](./EXAMPLES.md#drag-and-drop) for complete examples.

**Key pattern:**

1. Call `registerExternalDrag()` in `onDragStart`
2. Use `isPointInside()` and `toLocalPoint()` in `onDragEnd`
3. Call `unregisterExternalDrag()` to cleanup

**Important:** Don't use `useDroppable` inside shadow DOM. Use manual collision detection instead.

### How do I integrate with Framer Motion?

Framer Motion works out-of-the-box for most features. For scroll animations, specify the container:

```tsx
const containerRef = useRef(null);

const { scrollYProgress } = useScroll({
  container: containerRef, // ← Add this
});
```

See [ANIMATION_INTEGRATION.md](./ANIMATION_INTEGRATION.md) for complete guide.

### Can I use React Router inside VirtualWindow?

Yes, React Router works normally:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

<VirtualWindow>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </BrowserRouter>
</VirtualWindow>;
```

### Can I use Redux/Zustand/other state management?

Yes, all React context-based state management works normally because React Portals preserve the React tree:

```tsx
<Provider store={store}>
  <VirtualWindow>
    <ComponentThatUsesStore /> {/* ✅ Has access to store */}
  </VirtualWindow>
</Provider>
```

---

## Performance Questions

### Why is resizing laggy?

Possible causes:

1. **Expensive re-renders:** Memoize children

```tsx
const MemoizedContent = React.memo(Content);

<VirtualWindow>
  <MemoizedContent />
</VirtualWindow>;
```

1. **Heavy DOM:** Virtualize long lists with react-window or react-virtual

2. **Unoptimized callbacks:** Debounce the `onResize` callback

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

### Why is export slow?

html2canvas needs to traverse and render the entire DOM tree. For large previews:

1. **Reduce scale:** Use `scale: 1` or `scale: 2` instead of higher values
2. **Simplify content:** Temporarily disable expensive effects
3. **Show loading indicator:** Export is async, show progress

```tsx
const [isExporting, setIsExporting] = useState(false);

const handleExport = async () => {
  setIsExporting(true);
  try {
    await windowRef.current?.exportAsImage({ scale: 1 });
  } finally {
    setIsExporting(false);
  }
};
```

### How many VirtualWindows can I have?

Memory per instance is ~2MB. You can easily have 10+ instances. For 100+, consider:

- Lazy loading/unmounting when not visible
- Virtualizing the window list
- Using a single window with content switching

---

## Troubleshooting

### Children render but are invisible

**Check:**

1. Do children have explicit dimensions?
2. Are inherited styles hiding content?
3. Is content positioned off-screen?

**Solution:**

```tsx
<VirtualWindow>
  <div style={{ width: "100%", height: "100%", display: "block" }}>
    <Content />
  </div>
</VirtualWindow>
```

### Export produces blank image

**Check:**

1. Is content fully rendered?
2. Are there cross-origin images without CORS?
3. Is content `display: none`?

**Solution:**

```tsx
// Wait for content to render
await new Promise((resolve) => requestAnimationFrame(resolve));
const dataUrl = await windowRef.current?.exportAsImage();
```

### Drag coordinates are wrong

You're probably not using `toLocalPoint()` or not accounting for scale:

```tsx
// ❌ Wrong
const x = event.clientX;

// ✅ Correct
const local = windowRef.current?.toLocalPoint(event);
const x = local?.x;
```

### Memory leak / app slows down

**Check:**

1. Are event listeners being cleaned up?
2. Are GSAP animations being killed?
3. Are RAF calls being cancelled?

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#memory-leak--performance-degrades-over-time) for solutions.

---

## Feature Requests

### Will you add [feature]?

Check [MISSING_FEATURES.md](./MISSING_FEATURES.md) for planned features. For new requests:

1. Search existing GitHub issues
2. Open a discussion to propose the feature
3. Explain the use case and why it's needed

### Can I contribute?

Yes! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Getting Help

### Where can I ask questions?

1. **Check documentation** first (README, TROUBLESHOOTING, FAQ)
2. **Search issues** on GitHub
3. **Open a discussion** for questions
4. **Open an issue** for bugs (with reproduction)

### How do I report a bug?

See [CONTRIBUTING.md](./CONTRIBUTING.md#issue-guidelines) for bug report template. Include:

- Browser and version
- React version
- VirtualWindow version
- Minimal reproduction (CodeSandbox or code snippet)
- Expected vs actual behavior

### Where can I see more examples?

Check the `demos/` folder in the repository for:

- Basic usage
- Responsive design
- Device simulation
- Zoom controls
- Screenshot export
- Custom styling
- Drag and drop
- GSAP animations
- Framer Motion
- Nested containers

---

## Common Mistakes

### Forgetting to specify scroller

```tsx
// ❌ Doesn't work
gsap.to(element, {
  scrollTrigger: { trigger: element },
});

// ✅ Works
gsap.to(element, {
  scrollTrigger: {
    trigger: element,
    scroller: containerRef.current,
  },
});
```

### Not cleaning up effects

```tsx
// ❌ Memory leak
useEffect(() => {
  document.addEventListener("pointermove", handler);
}, []);

// ✅ Cleaned up
useEffect(() => {
  document.addEventListener("pointermove", handler);
  return () => document.removeEventListener("pointermove", handler);
}, []);
```

### Using wrong coordinates

```tsx
// ❌ Global coordinates
<Item x={event.clientX} y={event.clientY} />;

// ✅ Preview-local coordinates
const local = windowRef.current?.toLocalPoint(event);
<Item x={local.x} y={local.y} />;
```

### Trying to use useDroppable inside shadow

```tsx
// ❌ Doesn't work
<VirtualWindow>
  <DroppableZone /> {/* useDroppable won't work */}
</VirtualWindow>;

// ✅ Use manual collision detection
const isOverZone =
  local.x >= zone.x &&
  local.x <= zone.x + zone.width &&
  local.y >= zone.y &&
  local.y <= zone.y + zone.height;
```

---

## Still Have Questions?

If your question isn't answered here:

1. Read the full documentation (README, ARCHITECTURE, API_REFERENCE)
2. Check TROUBLESHOOTING.md
3. Search GitHub issues
4. Open a discussion

We're here to help! 🙂
