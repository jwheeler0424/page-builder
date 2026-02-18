# VirtualWindow Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architectural Principles](#architectural-principles)
3. [Component Structure](#component-structure)
4. [Data Flow](#data-flow)
5. [Shadow DOM Implementation](#shadow-dom-implementation)
6. [React Portal Integration](#react-portal-integration)
7. [Coordinate System](#coordinate-system)
8. [Resize System](#resize-system)
9. [Drag System](#drag-system)
10. [Scale System](#scale-system)
11. [Media Query Simulation](#media-query-simulation)
12. [Export System](#export-system)
13. [External Drag-and-Drop](#external-drag-and-drop)
14. [Performance Considerations](#performance-considerations)
15. [Memory Management](#memory-management)
16. [Browser Compatibility](#browser-compatibility)

---

## Overview

VirtualWindow is a React component that creates isolated preview environments using Shadow DOM for style encapsulation and React Portals for context preservation. This architecture document explains the technical decisions, implementation details, and design patterns used throughout the component.

### Core Problem

Modern web applications need to preview user-generated content without:

- CSS conflicts between preview and host application
- Breaking React context (hooks, providers, state)
- Requiring iframe overhead (postMessage, separate origin)
- Losing ability to measure/manipulate preview content

### Core Solution

#### Shadow DOM + React Portals

- Shadow DOM provides complete CSS isolation
- React Portals preserve React context across the boundary
- Document-level event listeners handle interactions across shadow boundaries
- Transform-based scaling provides visual zoom without layout changes

---

## Architectural Principles

### 1. Separation of Concerns

#### Host Element (Light DOM)

- Positioning and sizing
- Resize handles
- Visual chrome (border, device frame)
- Drag handles

#### Shadow Root (Isolated)

- Preview content styles
- User content rendering
- Injected global styles

#### React Portal

- Children component tree
- React context preservation
- Event propagation

### 2. Unidirectional Data Flow

```text
Props → State → Refs → DOM → User Interaction → Callbacks → Props
```

- Props drive initial state
- State updates trigger DOM changes
- Refs provide imperative API
- Callbacks notify parent of changes
- Parent can update props to control component

### 3. Stable API Surface

**Props are declarative:**

```tsx
<VirtualWindow
  width={375}
  height={667}
  scale={0.8}
  onResize={(size) => console.log(size)}
/>
```

**Refs provide imperative methods:**

```tsx
windowRef.current.resize(400, 600);
windowRef.current.setScale(1.0);
windowRef.current.exportAsImage();
```

This dual API allows both controlled and uncontrolled usage.

### 4. Performance First

- RAF batching for pointer events
- CSS transforms for GPU acceleration
- Memoized event handlers with stable refs
- Minimal re-renders (children only update when content changes)
- Lazy initialization (shadow root created once)

---

## Component Structure

### File Organization

```text
VirtualWindow.tsx (990 lines)
├── Type Definitions (lines 1-150)
│   ├── Props interface
│   ├── Ref interface
│   ├── Size/Position types
│   └── Export options
├── Internal State (lines 151-200)
│   ├── size, scale, position
│   ├── isDragging, isResizing
│   └── shadowReady
├── Refs (lines 201-250)
│   ├── hostRef (host element)
│   ├── shadowRootRef (shadow root)
│   ├── mountNodeRef (portal target)
│   └── Callback refs (stable handlers)
├── Shadow DOM Setup (lines 251-350)
│   ├── attachShadow
│   ├── Style injection
│   └── Mount node creation
├── Resize System (lines 351-550)
│   ├── Handle click detection
│   ├── Document pointer listeners
│   └── Bounds enforcement
├── Drag System (lines 551-650)
│   ├── Drag start detection
│   ├── Position updates
│   └── Parent bounds checking
├── Scale System (lines 651-750)
│   └── Transform application
├── Imperative API (lines 751-900)
│   ├── Size methods
│   ├── Scale methods
│   ├── Position methods
│   ├── Coordinate transformation
│   ├── Export methods
│   └── External drag methods
└── Render (lines 901-990)
    ├── Host element
    ├── Resize handles (8x)
    └── Portal (conditional on shadowReady)
```

### State Management

```typescript
// Size state
const [size, setSize] = useState<VirtualWindowSize>({
  width: props.width ?? 375,
  height: props.height ?? 667,
});

// Scale state
const [scale, setScale] = useState<number>(props.scale ?? 1);

// Position state
const [position, setPosition] = useState<VirtualWindowPosition>(
  props.position ?? { x: 0, y: 0 },
);

// Interaction states
const [isDragging, setIsDragging] = useState(false);
const [shadowReady, setShadowReady] = useState(false);
```

**Why separate states?**

- Each can be controlled independently via props
- Each can update without affecting others
- Parent can control all or none (flexible API)

### Ref Management

```typescript
// DOM refs
const hostRef = useRef<HTMLDivElement>(null);
const shadowRootRef = useRef<ShadowRoot | null>(null);
const mountNodeRef = useRef<HTMLDivElement | null>(null);

// Callback refs (stable across renders)
const onResizeRef = useRef(onResize);
const onScaleChangeRef = useRef(onScaleChange);
const onPositionChangeRef = useRef(onPositionChange);

// Interaction state refs (avoid stale closures)
const dragStateRef = useRef<DragState>({
  isDragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0,
});
```

**Why callback refs?**

- Avoid re-attaching document listeners when callbacks change
- Stable effect dependencies
- Always access latest callback without causing re-renders

---

## Data Flow

### Initialization Flow

```text
1. Component mounts
   ↓
2. hostRef.current set
   ↓
3. useEffect runs (shadow DOM setup)
   ├── attachShadow({ mode: "open" })
   ├── Create <style> element
   ├── Inject base styles
   ├── Create mount node <div>
   └── setShadowReady(true)
   ↓
4. Component re-renders (shadowReady = true)
   ↓
5. createPortal(children, mountNode)
   ↓
6. Children render inside shadow root
```

### Resize Flow

```text
1. User clicks resize handle
   ↓
2. handleResizeStart
   ├── Detect which handle (8 directions)
   ├── Store initial size/cursor position
   ├── Add document listeners
   └── Set isResizing = true
   ↓
3. User moves pointer
   ↓
4. handleResizeMove (document listener)
   ├── Calculate delta from initial position
   ├── Apply delta based on handle direction
   ├── Enforce min/max constraints
   ├── Update size state
   └── Call onResizeRef.current(newSize)
   ↓
5. User releases pointer
   ↓
6. handleResizeEnd
   ├── Remove document listeners
   └── Set isResizing = false
```

### Scale Flow

```text
1. Parent calls ref.setScale(0.8) or changes scale prop
   ↓
2. setScale state update
   ↓
3. useEffect detects scale change
   ↓
4. Apply transform to host element
   hostElement.style.transform = `scale(${scale})`
   ↓
5. Call onScaleChangeRef.current(scale)
```

**Note:** Logical dimensions (size state) remain unchanged. Only visual scale changes.

### Export Flow

```text
1. User calls ref.exportAsImage()
   ↓
2. exportAsImageImpl
   ├── Get mount node's first child (content element)
   ├── Store original styles (overflow, handle visibility)
   ├── Temporarily hide handles
   ├── Set overflow: visible
   ↓
3. Call html2canvas(contentElement, options)
   ├── html2canvas traverses DOM tree
   ├── Captures rendered pixels to canvas
   └── Returns canvas element
   ↓
4. Convert canvas to data URL
   canvas.toDataURL(format, quality)
   ↓
5. Restore original styles
   ↓
6. Return data URL
```

---

## Shadow DOM Implementation

### Why Shadow DOM?

**Requirements:**

- Complete style isolation (no CSS leakage in either direction)
- Ability to inject custom styles for preview
- Preserve React functionality (context, hooks, events)

**Alternatives considered:**

- **iframe**: ❌ Breaks React context, requires postMessage, heavy overhead
- **CSS Modules**: ❌ Not complete isolation, conflicts still possible
- **CSS-in-JS**: ❌ Requires transformation, still has specificity issues

**Shadow DOM benefits:**

- ✅ Native browser API (no polyfills needed)
- ✅ Complete style encapsulation
- ✅ Fast (no transformation overhead)
- ✅ Works with React Portals

### Shadow DOM Creation

```typescript
useEffect(() => {
  const host = hostRef.current;
  if (!host) return;

  // Create shadow root
  const shadow = host.attachShadow({ mode: "open" });
  shadowRootRef.current = shadow;

  // Inject base styles
  const styleEl = document.createElement("style");
  styleEl.textContent = BASE_STYLES;
  shadow.appendChild(styleEl);

  // Create mount node for portal
  const mountNode = document.createElement("div");
  mountNode.className = "mount-node";
  shadow.appendChild(mountNode);
  mountNodeRef.current = mountNode;

  // Signal ready for portal
  setShadowReady(true);
}, []);
```

### Base Styles

```css
/* Injected into every shadow root */
:host {
  display: block;
  box-sizing: border-box;
}

.mount-node {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  box-sizing: border-box;
}

/* Reset inherited styles */
* {
  box-sizing: border-box;
}
```

**Why these styles?**

- `:host` styles the shadow host from inside
- `.mount-node` provides scrollable container
- `box-sizing` reset prevents layout bugs

### Style Isolation Verification

```typescript
// Test in DevTools console:

// ❌ This won't affect shadow content
document.head.appendChild(document.createElement("style")).textContent = `
  .box { color: red; }
`;

// ✅ This only affects shadow content
windowRef.current.addGlobalStyle(`
  .box { color: blue; }
`);
```

### Shadow DOM Event Handling

Events **do** cross shadow boundaries, but with retargeting:

```typescript
// Click inside shadow DOM
<div onClick={(e) => {
  console.log(e.target);        // Shadow DOM element
  console.log(e.currentTarget); // Shadow DOM element
  console.log(e.composedPath()[0]); // Original element (before retargeting)
}}>
```

**Key points:**

- `e.target` is retargeted to shadow host for events that cross boundary
- `e.composedPath()` provides original event path
- This is why resize/drag use `composedPath()` for handle detection

---

## React Portal Integration

### Why Portals?

**Problem:** Children need to render inside shadow DOM (for style isolation) but must preserve React context.

**Solution:** `ReactDOM.createPortal(children, shadowDOMNode)`

**How it works:**

```text
React Tree (Light DOM)          Physical DOM
├── App                         <div id="root">
├── VirtualWindow                 <div class="virtual-window">   ← Host
│   └── Portal ─────────────────────► #shadow-root              ← Shadow boundary
│       └── Children                      <div class="mount-node">
│           └── <YourApp />                 <YourApp />        ← Renders here
```

React tree remains intact (context preserved), but DOM rendering happens inside shadow root.

### Portal Creation

```typescript
return (
  <>
    {/* Host element (light DOM) */}
    <div ref={hostRef} className="virtual-window" style={hostStyle}>
      {/* Resize handles */}
    </div>

    {/* Portal (shadow DOM) */}
    {shadowReady && shadowRootRef.current && mountNodeRef.current && (
      createPortal(
        children,
        mountNodeRef.current
      )
    )}
  </>
);
```

**Conditional rendering:**

- `shadowReady`: Shadow root initialization complete
- `shadowRootRef.current`: Shadow root exists
- `mountNodeRef.current`: Mount node exists

All three guards prevent portal rendering before target is ready.

### Context Preservation

```tsx
// Parent component
<ThemeProvider theme={darkTheme}>
  <UserContext.Provider value={user}>
    <VirtualWindow>
      <App /> {/* ✅ Has access to ThemeProvider and UserContext */}
    </VirtualWindow>
  </UserContext.Provider>
</ThemeProvider>
```

**Why this works:**

- Portal is part of React tree (even though DOM is elsewhere)
- React context follows React tree, not DOM tree
- Children can `useContext()` normally

### Event Bubbling

```tsx
<div onClick={() => console.log("Parent")}>
  <VirtualWindow>
    <button onClick={() => console.log("Child")}>Click</button>
  </VirtualWindow>
</div>

// Click button:
// Output: "Child", "Parent"
// ✅ Events bubble through React tree, not DOM tree
```

---

## Coordinate System

### Three Coordinate Spaces

1. **Global (Viewport)** - `clientX`, `clientY` from pointer events
2. **Host-relative** - Relative to host element's top-left
3. **Preview-local** - Relative to content inside shadow root, compensated for scale

### Transformations

#### Global → Host-relative

```typescript
const rect = hostElement.getBoundingClientRect();
const hostX = globalX - rect.left;
const hostY = globalY - rect.top;
```

#### Host-relative → Preview-local

```typescript
const localX = hostX / scale;
const localY = hostY / scale;
```

**Why divide by scale?**

- Host element has `transform: scale(${scale})`
- Visual dimensions = logical dimensions × scale
- To get logical position, divide by scale

#### Complete Transformation (Global → Preview-local)

```typescript
function toLocalPoint(event: PointerEvent): { x: number; y: number } | null {
  const host = hostRef.current;
  if (!host) return null;

  const rect = host.getBoundingClientRect();
  const currentScale = scale;

  return {
    x: (event.clientX - rect.left) / currentScale,
    y: (event.clientY - rect.top) / currentScale,
  };
}
```

### Hit Testing

```typescript
function isPointInside(clientX: number, clientY: number): boolean {
  const host = hostRef.current;
  if (!host) return false;

  const rect = host.getBoundingClientRect();

  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}
```

**Why this works:**

- `getBoundingClientRect()` returns visual bounds (already scaled)
- `clientX/Y` is in global viewport coordinates
- Simple AABB (axis-aligned bounding box) test

---

## Resize System

### Handle Positions

8 handles, positioned at:

- **Corners**: nw, ne, sw, se
- **Edges**: n, e, s, w

### Handle Rendering

```tsx
{
  RESIZE_HANDLES.map((handle) => (
    <div
      key={handle}
      className={`resize-handle resize-handle-${handle}`}
      data-handle={handle}
      style={getHandleStyle(handle)}
      onPointerDown={(e) => handleResizeStart(e, handle)}
    />
  ));
}
```

**Handle styling:**

```css
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border: 2px solid white;
  cursor: ${handle}-resize;
}

/* Positioning */
.resize-handle-nw { top: -4px; left: -4px; }
.resize-handle-n  { top: -4px; left: 50%; transform: translateX(-50%); }
.resize-handle-ne { top: -4px; right: -4px; }
/* ... etc */
```

### Resize Algorithm

```typescript
function handleResizeMove(e: PointerEvent) {
  const deltaX = e.clientX - dragState.startX;
  const deltaY = e.clientY - dragState.startY;

  let newWidth = dragState.initialWidth;
  let newHeight = dragState.initialHeight;
  let newX = dragState.initialX;
  let newY = dragState.initialY;

  // Apply delta based on handle direction
  switch (dragState.handle) {
    case "e":
      newWidth += deltaX;
      break;
    case "w":
      newWidth -= deltaX;
      newX += deltaX;
      break;
    case "se":
      newWidth += deltaX;
      newHeight += deltaY;
      break;
    // ... other cases
  }

  // Enforce constraints
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

  // Update state
  setSize({ width: newWidth, height: newHeight });
  if (newX !== position.x || newY !== position.y) {
    setPosition({ x: newX, y: newY });
  }
}
```

**Key insight:** West/north handles change position as well as size.

### Keyboard Resize

```typescript
function handleKeyDown(e: KeyboardEvent) {
  if (!isFocused) return;

  const step = e.shiftKey ? 10 : 1;

  switch (e.key) {
    case "ArrowRight":
      setSize((s) => ({ ...s, width: s.width + step }));
      break;
    case "ArrowLeft":
      setSize((s) => ({ ...s, width: Math.max(minWidth, s.width - step) }));
      break;
    // ... other directions
  }
}
```

### Document Listeners

**Why document-level?**

```typescript
// ❌ Bad: Events can be lost
<div onPointerMove={handleMove} onPointerUp={handleEnd}>

// ✅ Good: Always receive events
useEffect(() => {
  document.addEventListener("pointermove", handleMove);
  document.addEventListener("pointerup", handleEnd);

  return () => {
    document.removeEventListener("pointermove", handleMove);
    document.removeEventListener("pointerup", handleEnd);
  };
}, [constraints]);
```

**Reasons:**

- Pointer can move outside host element
- Events crossing shadow boundary can lose capture
- Document always receives events

---

## Drag System

### Drag Detection

```typescript
function handleDragStart(e: React.PointerEvent) {
  // Check if clicked a resize handle
  const composed = e.nativeEvent.composedPath?.() ?? [];
  const hitResizeHandle = composed.some((el) =>
    (el as HTMLElement).classList?.contains?.("resize-handle"),
  );

  if (hitResizeHandle) return; // Let resize handle it

  // Check if drag is allowed on this element
  const target = (composed[0] ?? e.target) as HTMLElement;
  const isHeaderDrag =
    dragHandle === "header" && target.classList.contains("header");
  const isWindowDrag = dragHandle === "window";

  if (!(isHeaderDrag || isWindowDrag)) return;

  // Start drag
  dragStateRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    initialX: position.x,
    initialY: position.y,
  };

  document.addEventListener("pointermove", handleDragMove);
  document.addEventListener("pointerup", handleDragEnd);
}
```

### Drag Movement

```typescript
function handleDragMove(e: PointerEvent) {
  if (!dragStateRef.current.isDragging) return;

  const deltaX = e.clientX - dragStateRef.current.startX;
  const deltaY = e.clientY - dragStateRef.current.startY;

  const newX = dragStateRef.current.initialX + deltaX;
  const newY = dragStateRef.current.initialY + deltaY;

  // Optional: constrain to parent
  const parent = hostRef.current?.parentElement;
  if (parent) {
    const parentRect = parent.getBoundingClientRect();
    const hostRect = hostRef.current.getBoundingClientRect();

    newX = Math.max(0, Math.min(newX, parentRect.width - hostRect.width));
    newY = Math.max(0, Math.min(newY, parentRect.height - hostRect.height));
  }

  setPosition({ x: newX, y: newY });
}
```

### Conflict Resolution: Drag vs Resize

**Problem:** Both systems listen to pointer events. How to prevent conflicts?

**Solution:** Priority order

1. Check for resize handle click
2. If resize handle → start resize, ignore drag
3. If not resize handle → check drag conditions
4. If drag allowed → start drag

```typescript
// In handlePointerDown:
const hitResizeHandle = composedPath.some(/* check for handle */);

if (hitResizeHandle) {
  startResize(); // Takes priority
  return;
}

if (dragAllowed) {
  startDrag();
}
```

---

## Scale System

### Transform-based Scaling

**Why transform instead of actual resize?**

1. **Performance**: GPU-accelerated, no layout recalculation
2. **Consistency**: Logical dimensions stay stable (media queries consistent)
3. **Simplicity**: Single CSS property change

### Implementation

```typescript
useEffect(() => {
  const host = hostRef.current;
  if (!host) return;

  host.style.transform = `scale(${scale})`;
  host.style.transformOrigin = "top left"; // Scale from top-left corner
}, [scale]);
```

### Implications

**Logical vs Visual dimensions:**

```typescript
// Window is 400×600 logical, scale 0.5
const size = ref.getSize(); // { width: 400, height: 600 }
const scale = ref.getScale(); // 0.5

const rect = host.getBoundingClientRect();
// rect.width = 200 (visual)
// rect.height = 300 (visual)

// Media query uses logical dimensions
matchMedia("(width: 400px)").matches; // true
matchMedia("(width: 200px)").matches; // false
```

**Coordinate compensation:**

```typescript
// Click at global (150, 200)
// Host is at (100, 100) with scale 0.5

const hostRelative = ((150 - 100, 200 - 100) = (50, 100));
const local = ((50 / 0.5, 100 / 0.5) = (100, 200));

// Item at local (100, 200) will be visually at global (150, 200) ✅
```

---

## Media Query Simulation

### Architecture

```text
createPreviewMatchMedia.ts (514 lines)
├── MediaQueryParser (lines 1-200)
│   ├── Tokenizer
│   ├── Parser (recursive descent)
│   └── AST builder
├── MediaQueryEvaluator (lines 201-350)
│   ├── Feature extractors
│   ├── Comparison logic
│   └── Boolean operators
└── PreviewMediaQueryList (lines 351-514)
    ├── EventTarget implementation
    ├── Listener management
    └── Change detection
```

### Query Parsing

**Supported syntax:**

```text
(width: 375px)
(min-width: 768px)
(max-width: 1024px)
(orientation: landscape)
(aspect-ratio: 16/9)
(prefers-color-scheme: dark)
(width: 400px) and (height: 600px)
not (orientation: landscape)
(min-width: 768px), (orientation: landscape)  // OR operator
```

**Parser output (AST):**

```typescript
interface MediaQuery {
  type: "media-query";
  negated: boolean;
  features: MediaFeature[];
  operator: "and" | "or";
}

interface MediaFeature {
  type: "feature";
  name: string; // e.g., "width"
  operator?: string; // e.g., "min-", "max-"
  value?: string | number;
}
```

### Evaluation Engine

```typescript
function evaluateQuery(query: MediaQuery, context: MediaContext): boolean {
  let result = true;

  for (const feature of query.features) {
    const featureResult = evaluateFeature(feature, context);

    if (query.operator === "and") {
      result = result && featureResult;
      if (!result) break; // Short-circuit
    } else {
      result = result || featureResult;
      if (result) break; // Short-circuit
    }
  }

  return query.negated ? !result : result;
}

function evaluateFeature(
  feature: MediaFeature,
  context: MediaContext,
): boolean {
  switch (feature.name) {
    case "width":
      return feature.operator === "min-"
        ? context.width >= feature.value
        : feature.operator === "max-"
          ? context.width <= feature.value
          : context.width === feature.value;

    case "orientation":
      return (
        context.width >= context.height === (feature.value === "landscape")
      );

    case "prefers-color-scheme":
      return context.overrides?.["prefers-color-scheme"] === feature.value;

    // ... other features
  }
}
```

### Change Detection

```typescript
class PreviewMediaQueryList implements MediaQueryList {
  private listeners: Set<(event: MediaQueryListEvent) => void>;
  private previousMatches: boolean;

  updateContext(newContext: MediaContext) {
    const oldMatches = this.matches;
    this.matches = evaluateQuery(this.query, newContext);

    if (oldMatches !== this.matches) {
      this.dispatchEvent(
        new MediaQueryListEvent("change", {
          matches: this.matches,
          media: this.media,
        }),
      );
    }
  }
}
```

### React Hook Integration

```typescript
function usePreviewMatchMedia(
  windowRef: React.RefObject<VirtualWindowRef>,
  query: string,
): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const win = windowRef.current;
    if (!win) return;

    const mql = win.matchMedia(query);
    setMatches(mql.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [windowRef, query]);

  return matches;
}
```

---

## Export System

### html2canvas Integration

**Why html2canvas?**

- Works with DOM elements (including shadow DOM)
- Handles complex CSS (transforms, filters, etc.)
- Cross-browser compatible
- Actively maintained

**Limitations:**

- Cannot capture cross-origin images without CORS
- Limited support for advanced CSS (clip-path, backdrop-filter)
- Slow for very large DOMs (>10,000 elements)

### Export Implementation

```typescript
async function exportAsImageImpl(
  options: ExportImageOptions = {},
): Promise<string> {
  const mountNode = mountNodeRef.current;
  if (!mountNode?.firstElementChild) {
    throw new Error("No content to export");
  }

  const contentElement = mountNode.firstElementChild as HTMLElement;

  // Store original state
  const originalOverflow = contentElement.style.overflow;
  const handleElements = hostRef.current?.querySelectorAll(".resize-handle");
  const handleStates = Array.from(handleElements || []).map(
    (el) => (el as HTMLElement).style.display,
  );

  try {
    // Prepare for capture
    contentElement.style.overflow = "visible";

    if (!options.includeHandles) {
      handleElements?.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    }

    // Capture
    const canvas = await html2canvas(contentElement, {
      backgroundColor: options.backgroundColor ?? "#ffffff",
      scale: options.scale ?? 2,
      logging: false,
      allowTaint: true,
      useCORS: true,
    });

    // Convert to data URL
    const format = options.format ?? "png";
    const quality = options.quality ?? 0.95;

    return canvas.toDataURL(`image/${format}`, quality);
  } finally {
    // Restore state in all code paths
    contentElement.style.overflow = originalOverflow;

    handleElements?.forEach((el, i) => {
      (el as HTMLElement).style.display = handleStates[i];
    });
  }
}
```

### Download Helper

```typescript
async function downloadImage(
  filename: string = "preview.png",
  options?: ExportImageOptions,
): Promise<void> {
  const dataUrl = await exportAsImageImpl(options);

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
```

---

## External Drag-and-Drop

### Problem Statement

**Challenge:** Drag items from outside VirtualWindow into shadow DOM content.

**Why it's hard:**

1. Shadow DOM retargets events to host element
2. Cannot use native HTML5 drag-and-drop (events retarget)
3. Cannot use dnd-kit's `useDroppable` inside shadow (collision detection can't see shadow content)

### Solution Architecture

**Manual hit-testing + Registration pattern:**

1. Parent tracks which pointers are "external drags"
2. VirtualWindow tracks registered pointers via document listeners
3. Drop detection uses geometry (bounding rect), not DOM traversal
4. Coordinates converted to preview-local space

### Implementation

#### Step 1: Registration

```typescript
// Store active drag pointers
const activeDragsRef = useRef<Set<number>>(new Set());
const lastInsideRef = useRef<Map<number, boolean>>(new Map());

function registerExternalDrag(pointerId: number) {
  activeDragsRef.current.add(pointerId);
  lastInsideRef.current.set(pointerId, false);
}

function unregisterExternalDrag(pointerId: number) {
  activeDragsRef.current.delete(pointerId);
  lastInsideRef.current.delete(pointerId);
}
```

#### Step 2: Document Listener

```typescript
useEffect(() => {
  const handlePointerMove = (e: PointerEvent) => {
    if (!activeDragsRef.current.has(e.pointerId)) return;

    const host = hostRef.current;
    if (!host) return;

    // Hit test
    const rect = host.getBoundingClientRect();
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    const wasInside = lastInsideRef.current.get(e.pointerId);

    if (isInside && !wasInside) {
      // Entered
      const localPoint = toLocalPoint(e);
      onExternalDragOverRef.current?.({ ...localPoint, nativeEvent: e });
    } else if (!isInside && wasInside) {
      // Left
      onExternalDragLeaveRef.current?.();
    } else if (isInside) {
      // Moving inside
      const localPoint = toLocalPoint(e);
      onExternalDragOverRef.current?.({ ...localPoint, nativeEvent: e });
    }

    lastInsideRef.current.set(e.pointerId, isInside);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!activeDragsRef.current.has(e.pointerId)) return;

    const isInside = isPointInside(e.clientX, e.clientY);
    if (isInside) {
      const localPoint = toLocalPoint(e);
      onExternalDropRef.current?.({ ...localPoint, nativeEvent: e });
    }

    unregisterExternalDrag(e.pointerId);
  };

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);

  return () => {
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };
}, [scale]); // Re-attach if scale changes (affects coordinate math)
```

#### Step 3: Parent Integration

```tsx
function Parent() {
  const windowRef = useRef<VirtualWindowRef>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    windowRef.current?.registerExternalDrag(pointerEvent.pointerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + event.delta.x;
    const finalY = pointerEvent.clientY + event.delta.y;

    if (windowRef.current?.isPointInside(finalX, finalY)) {
      const localPoint = windowRef.current.toLocalPoint({
        clientX: finalX,
        clientY: finalY,
      } as PointerEvent);

      // Add item at localPoint
    }

    windowRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SourcePanel />
      <VirtualWindow ref={windowRef}>
        <Canvas />
      </VirtualWindow>
    </DndContext>
  );
}
```

---

## Performance Considerations

### Critical Optimizations

1. **RAF Batching**

```typescript
let rafId: number | null = null;

function scheduleUpdate(callback: () => void) {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });
}
```

1. **Cached Geometry**

```typescript
// Cache rect during drag start
const cachedRect = useRef<DOMRect | null>(null);

function handleDragStart() {
  cachedRect.current = hostRef.current.getBoundingClientRect();
}

function handleDragMove(e: PointerEvent) {
  const rect = cachedRect.current; // Use cached, don't call getBoundingClientRect()
  // ... use rect
}
```

1. **Stable Callback Refs**

```typescript
const callbackRef = useRef(callback);

useEffect(() => {
  callbackRef.current = callback;
}, [callback]);

useEffect(() => {
  function handler() {
    callbackRef.current?.(); // Always latest, but effect is stable
  }

  document.addEventListener("event", handler);
  return () => document.removeEventListener("event", handler);
}, []); // No callback in deps
```

1. **Transform over Layout**

```typescript
// ✅ GPU-accelerated
element.style.transform = `translateX(${x}px)`;

// ❌ Triggers layout
element.style.left = `${x}px`;
```

1. **Memoized Event Handlers**

```typescript
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

return <div onClick={handleClick} />;
```

### Performance Metrics

**Target metrics:**

- Resize operation: 16ms (60fps)
- Scale change: <1ms
- Export (1080p): <500ms
- Memory per instance: <2MB

---

## Memory Management

### Cleanup Checklist

```typescript
useEffect(() => {
  // Setup
  const element = create();
  const listener = () => {};
  document.addEventListener("event", listener);

  return () => {
    // Cleanup
    destroy(element);
    document.removeEventListener("event", listener);
  };
}, [dependencies]);
```

### Common Memory Leaks

1. **Forgotten event listeners**

```typescript
// ❌ Leak
useEffect(() => {
  document.addEventListener("pointermove", handler);
  // No cleanup
}, []);

// ✅ Fixed
useEffect(() => {
  document.addEventListener("pointermove", handler);
  return () => document.removeEventListener("pointermove", handler);
}, []);
```

1. **GSAP animations**

```typescript
// ❌ Leak
useEffect(() => {
  gsap.to(element, { x: 100 });
  // No cleanup
}, []);

// ✅ Fixed
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(element, { x: 100 });
  }, container);
  return () => ctx.revert();
}, []);
```

1. **Resize observers**

```typescript
// ❌ Leak
useEffect(() => {
  const observer = new ResizeObserver(handler);
  observer.observe(element);
  // No cleanup
}, []);

// ✅ Fixed
useEffect(() => {
  const observer = new ResizeObserver(handler);
  observer.observe(element);
  return () => observer.disconnect();
}, []);
```

---

## Browser Compatibility

### Required APIs

- **Shadow DOM v1**: Chrome 53+, Firefox 63+, Safari 10+
- **Pointer Events**: Chrome 55+, Firefox 59+, Safari 13+
- **CSS Transforms**: Universal
- **HTML5 Canvas**: Universal

### Polyfills Not Needed

All required APIs are natively supported in target browsers. No polyfills required for:

- Shadow DOM
- Pointer Events
- ResizeObserver
- IntersectionObserver

### Known Issues

**Safari:**

- Shadow DOM events may behave differently (use `composedPath()`)
- Pointer capture can be flaky (use document listeners)

**Firefox:**

- `will-change` can cause rendering artifacts (use sparingly)

**All browsers:**

- `getBoundingClientRect()` forces layout (cache results)
- Canvas export quality varies (test across browsers)

---

## Conclusion

VirtualWindow's architecture prioritizes:

1. **Isolation** (Shadow DOM + Portals)
2. **Performance** (RAF batching, transforms, caching)
3. **Reliability** (Document listeners, stable refs, proper cleanup)
4. **Flexibility** (Controlled/uncontrolled, imperative/declarative)

The combination of Shadow DOM for style isolation and React Portals for context preservation creates a unique architecture that solves the preview isolation problem without the overhead of iframes or the brittleness of CSS-only solutions.
