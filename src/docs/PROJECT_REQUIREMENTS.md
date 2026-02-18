# Page Builder - Locked Requirements & Decisions

## 📋 Project Specifications (Finalized)

### Technology Stack ✅

**Frontend:**

- React 19+ (TypeScript strict mode)
- Vite (build tool)
- VirtualWindow (custom component - provided)
- dnd-kit (drag-and-drop)
- GSAP + ScrollTrigger (animations)
- Framer Motion (animations)
- lightningcss (CSS processing)
- Zustand + immer + undo + persist (state management)
- @tanstack/react-query (async state, debouncing, throttling)
- uuid (v7 for unique IDs)
- shadcn/ui (all components - already integrated)
- Lucide React (icons)

**Backend (Phase 13+):**

- Hono (server framework)
- Bun (runtime)
- PostgreSQL (database)
- Drizzle ORM

**Deployment:**

- Web-based application only
- No Electron, no mobile apps initially

### Architecture Decisions ✅

#### 1. Authentication

**Status:** POST-MVP (Phase 13+)

- Focus on core functionality first
- Add auth only after all features complete and polished
- No user/tenant/org concepts in MVP

#### 2. Component Library

**Pre-built components:**

- ✅ Primitives: Box, Text, Image, Button, Input, Textarea, Link, Icon
- ✅ Layout: Container, Stack, Grid, Flex
- ✅ Advanced: Hero, Navbar, Footer, Card, ParallaxContainer (multi-layer GSAP), Form
- ✅ shadcn/ui: All components wrapped as ComponentInstances

#### 3. Asset Management

**Status:** POST-MVP

- Separate media management app exists
- Integration when ready (documentation to be provided)
- For MVP: Basic URL/upload support only

#### 4. Export & Publishing

**Status:** POST-MVP (Phase 13+)

- MVP: Preview/builder ONLY
- Export to HTML/CSS/JS: Later
- React component export: Later
- Deploy integrations: Later

#### 5. Responsive Design Strategy

**Approach:** Single design with responsive rules

- Editable breakpoints (add/remove/configure)
- Desktop-first OR mobile-first (user's choice based on their device)
- **CRITICAL REQUIREMENT:** Application must be fully functional on ANY device
- Mobile UI: Collapsible panels, swipe gestures, bottom toolbars
- Tablet UI: Hybrid layout with some panels persistent
- Desktop UI: Full panel layout

#### 6. Styling Architecture

**Primary:** Global styles + Page styles (CSS)

```text
Global Styles → Page Styles → Component Styles → All injected as <style> tags
```

**CSS-in-JS:** Optional for specific components

- Components have `useCssInJs` flag
- If false (default): Compile to CSS and inject
- If true: Use CSS-in-JS library

**CSS Variables:** Full support

```css
:root {
  --primary: #3b82f6;
  --spacing-md: 16px;
}
```

**Pseudo-selectors:** Full support

```typescript
styles: {
  base: { color: 'blue' },
  hover: { color: 'red' },
  active: { color: 'green' },
  focus: { outline: '2px solid blue' },
  before: { content: '""', display: 'block' },
  after: { content: '""', display: 'block' },
}
```

**Technology:** Vanilla CSS with lightningcss (no SASS/Less/preprocessors)

#### 7. Interactive Behaviors

**Phase approach:**

- MVP: Visual design + animations (GSAP, Framer)
- Phase 8+: Form handling, click handlers, navigation
- Phase 13+: API integration, data fetching

#### 8. Advanced Features - MVP Status

**INCLUDED IN MVP:**

- ✅ Version history & rollback
- ✅ A/B testing setup
- ✅ SEO metadata management
- ✅ Custom code injection (HTML/CSS/JS)
- ✅ Theme system (global colors/typography)
- ✅ Component variants (primary/secondary/outline)
- ✅ Accessibility tools (ARIA, contrast checker)
- ✅ Template marketplace (save/load templates)

**POST-MVP:**

- ❌ Real-time collaboration (Phase 16)
- ❌ Analytics integration (Phase 17)

#### 9. Performance Targets

**Priority:** Best performance possible

- Target: 60fps for all interactions
- Bundle size: Not a concern for MVP
- Optimization: Responsible resource usage
- Lazy loading: Only where it makes sense
- Code splitting: Minimal, focus on functionality first

#### 10. Third-Party Packages

**Policy:** Build from scratch, minimal dependencies

- MUST get approval before adding ANY package not in tech stack
- Justify: Why can't we build it ourselves?
- Alternatives: What other options exist?
- Bundle impact: How much does it add?

**Pre-approved packages:**

- All packages in tech stack above
- React utilities (clsx, classnames if needed)
- Date/time libraries IF needed (date-fns, dayjs)
- Color manipulation IF needed for contrast checker

**NOT allowed without approval:**

- lodash / ramda / underscore
- moment.js (too heavy)
- axios (use fetch)
- CSS-in-JS libraries by default
- Additional UI frameworks

---

## 🎯 MVP Scope (Phases 1-12)

### What's IN MVP ✅

**Core Builder:**

- Complete component palette with drag-to-add
- Selection system (click, multi-select, marquee, keyboard)
- Drag-to-reposition components
- Resize handles (8-way)
- Properties panel (styles, properties, animations)
- Layers panel (hierarchy tree)
- Grid & snap system
- Smart alignment guides

**Styling:**

- Visual style editor (colors, typography, spacing, borders, shadows)
- Pseudo-selector support (:hover, :active, :focus, ::before, ::after)
- Global page styles editor
- CSS variables/custom properties
- Style compilation and injection into VirtualWindow

**Responsive:**

- Breakpoint management (add/edit/delete)
- Breakpoint-specific styles
- Breakpoint switcher
- Responsive preview
- Media query compilation

**Advanced:**

- Undo/redo (50 states)
- Copy/paste/duplicate
- Keyboard shortcuts (20+ shortcuts)
- Component templates (save/load)
- Theme system (colors, typography, spacing)
- Component variants
- Animations editor (GSAP + Framer Motion)

**Quality:**

- SEO metadata editor
- Custom code injection
- ARIA attributes editor
- Contrast checker
- Version history
- A/B testing setup

**Data:**

- Zustand store with immer + undo + persist
- localStorage persistence
- Project management (create/load/save)
- Auto-save (every 5 minutes)

### What's OUT of MVP ❌

**Backend:**

- API integration
- Database persistence
- User authentication
- Multi-user/teams

**Export:**

- HTML/CSS/JS export
- React component export
- Next.js page export
- Deploy to Vercel/Netlify

**Assets:**

- Media management integration
- Image upload
- Asset library

**Collaboration:**

- Real-time editing
- Presence indicators
- Comments/reviews

**Analytics:**

- Page analytics
- A/B test results
- Performance monitoring

---

## 📐 Style System Architecture

### Style Flow

```text
1. User edits styles in Properties Panel
   ↓
2. Updates ComponentInstance.styles
   ↓
3. Style Compiler generates CSS string
   ↓
4. CSS injected into VirtualWindow via addGlobalStyle()
   ↓
5. Component renders with className
```

### Style Structure

```typescript
interface ComponentStyles {
  // Base styles (always present)
  base: CSSProperties;

  // Pseudo-selectors (optional)
  hover?: CSSProperties;
  active?: CSSProperties;
  focus?: CSSProperties;

  // Pseudo-elements (optional)
  before?: CSSProperties;
  after?: CSSProperties;

  // CSS-in-JS flag (optional)
  useCssInJs?: boolean;
}

interface ComponentInstance {
  id: string;
  type: string;
  className: string; // e.g., "comp-abc123"

  // Hierarchy
  parentId: string | null;
  children: string[];

  // Position/Size
  x: number;
  y: number;
  width: number;
  height: number;

  // Styling
  styles: ComponentStyles;
  breakpointStyles: Record<string, ComponentStyles>;

  // Props
  props: Record<string, any>;
  content?: string;

  // Metadata
  label: string;
  locked: boolean;
  visible: boolean;
}
```

### Compiled CSS Output

```css
/* Global page styles */
:root {
  --primary: #3b82f6;
}

body {
  font-family: "Inter", sans-serif;
}

/* Component styles */
.comp-abc123 {
  background-color: var(--primary);
  padding: 12px 24px;
  border-radius: 8px;
}

.comp-abc123:hover {
  background-color: #2563eb;
}

.comp-abc123::before {
  content: "";
  display: block;
}

/* Breakpoint styles */
@media (min-width: 768px) {
  .comp-abc123 {
    padding: 16px 32px;
  }
}
```

---

## 🏗️ State Management Architecture

### Zustand Store Slices

```typescript
interface PageBuilderState {
  // Project
  currentProject: Project | null;
  projects: Project[];

  // Components
  components: ComponentInstance[];

  // Selection
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Canvas
  zoom: number;
  gridEnabled: boolean;
  gridSize: number;
  snapEnabled: boolean;
  canvasSize: { width: number; height: number };

  // Styles
  pageStyles: string;
  theme: Theme;

  // Breakpoints
  breakpoints: Breakpoint[];
  activeBreakpoint: string;

  // Templates
  templates: ComponentTemplate[];

  // Metadata
  metadata: PageMetadata;
  headCode: string;
  bodyStartCode: string;
  bodyEndCode: string;

  // Versions
  versions: ProjectVersion[];

  // AB Tests
  abTests: ABTest[];

  // UI State
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;

  // Actions (100+ actions)
  // ... see full prompt
}
```

### Middleware Stack

```typescript
const usePageBuilder = create<PageBuilderState>()(
  temporal(
    // Undo/redo (zundo)
    persist(
      // localStorage persistence
      immer(
        // Immutable updates
        (set, get) => ({
          // State and actions
        }),
      ),
      { name: "page-builder-storage" },
    ),
    {
      limit: 50, // Max undo states
      handleSet: (handleSet) => throttle(handleSet, 100), // Throttle undo snapshots
    },
  ),
);
```

---

## 🎨 Component System

### Component Registry

```typescript
const componentRegistry: Record<string, ComponentDefinition> = {
  box: {
    /* ... */
  },
  text: {
    /* ... */
  },
  button: {
    /* ... */
  },
  hero: {
    /* ... */
  },
  "parallax-container": {
    /* ... */
  },
  // ... all components
};
```

### Component Categories

1. **Primitives** (8 components)
   - Box, Text, Image, Button, Input, Textarea, Link, Icon

2. **Layout** (4 components)
   - Container, Stack, Grid, Flex

3. **Advanced** (6 components)
   - Hero, Navbar, Footer, Card, ParallaxContainer, Form

4. **shadcn/ui** (~40 components)
   - All shadcn components wrapped

### ParallaxContainer Implementation

**CRITICAL:** Uses GSAP ScrollTrigger with `scroller` option

```typescript
function ParallaxComponent({ instance, layers, children }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = usePageBuilder(state => state.canvasRef);

  useEffect(() => {
    // Get scrollable container from VirtualWindow
    const scrollContainer = canvasRef.current?.shadowRoot
      ?.querySelector('.mount-node');

    if (!scrollContainer || !containerRef.current) return;

    const ctx = gsap.context(() => {
      layers.forEach((layer) => {
        const layerEl = containerRef.current?.querySelector(
          `[data-layer="${layer.id}"]`
        );

        if (layerEl) {
          gsap.to(layerEl, {
            y: () => (layer.speed - 1) * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              scroller: scrollContainer,  // ← MUST SPECIFY
            },
          });
        }
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, [layers, canvasRef]);

  return (
    <div ref={containerRef} className={instance.className}>
      {/* Layers */}
    </div>
  );
}
```

---

## 📱 Responsive UI Strategy

### Layout Breakpoints

**Desktop (≥1024px):**

```text
┌─────────┬──────────────────────┬──────────┐
│ Comp.   │                      │ Props    │
│ Panel   │    Canvas            │ Panel    │
│ 280px   │    (flexible)        │ 320px    │
│         │                      │          │
├─────────┴──────────────────────┴──────────┤
│          Layers Panel (200px)             │
└───────────────────────────────────────────┘
```

**Tablet (768px - 1023px):**

```text
┌───────────────────────────────────────────┐
│  Top Toolbar (tabs: Comp | Canvas | Props)│
├───────────────────────────────────────────┤
│                                           │
│  Active Panel (full width)                │
│  - Components Panel, OR                   │
│  - Canvas, OR                             │
│  - Properties Panel                       │
│                                           │
├───────────────────────────────────────────┤
│  Layers Panel (collapsible)               │
└───────────────────────────────────────────┘
```

**Mobile (<768px):**

```text
┌──────────────────────────┐
│  Canvas (primary view)   │
│                          │
│  Swipe left → Props      │
│  Swipe right → Comp.     │
│                          │
├──────────────────────────┤
│ Bottom Toolbar           │
│ [+] [✎] [⚙] [☰]        │
└──────────────────────────┘

Tap ☰ → Layers drawer from bottom
Tap ⚙ → Settings drawer
Tap ✎ → Properties drawer
Tap [+] → Components drawer
```

### Mobile-Specific UX

**Gestures:**

- Swipe left/right: Switch between panels
- Pinch: Zoom canvas
- Long-press: Context menu
- Two-finger tap: Undo
- Three-finger tap: Redo

**Toolbars:**

- Bottom toolbar: Primary actions
- Floating action button: Quick add component
- Context menu: Component-specific actions

**Panels:**

- Full-screen overlays
- Slide from edges
- Dismissible with swipe or tap outside
- Persistent state (remember which panel was open)

---

## 🔑 Critical VirtualWindow Integration

### External Drag-and-Drop Pattern

```typescript
// ALWAYS follow this pattern for palette → canvas drag

const canvasRef = useRef<VirtualWindowRef>(null);

// 1. Register drag on start
const handleDragStart = (event: DragStartEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  canvasRef.current?.registerExternalDrag(pointerEvent.pointerId);
};

// 2. Convert coordinates on end
const handleDragEnd = (event: DragEndEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  const finalX = pointerEvent.clientX + (event.delta?.x || 0);
  const finalY = pointerEvent.clientY + (event.delta?.y || 0);

  // 3. Check if inside canvas
  if (canvasRef.current?.isPointInside(finalX, finalY)) {
    // 4. Convert to local coordinates
    const local = canvasRef.current.toLocalPoint({
      clientX: finalX,
      clientY: finalY,
    } as PointerEvent);

    if (local) {
      // 5. Create component at local.x, local.y
      const newComponent = createComponent(local.x, local.y);
      addComponent(newComponent);
    }
  }

  // 6. Always unregister
  canvasRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
};
```

### Style Injection Pattern

```typescript
// ALWAYS inject styles this way

function useStyleInjection() {
  const canvasRef = usePageBuilder((state) => state.canvasRef);
  const components = usePageBuilder((state) => state.components);
  const pageStyles = usePageBuilder((state) => state.pageStyles);
  const theme = usePageBuilder((state) => state.theme);
  const breakpoints = usePageBuilder((state) => state.breakpoints);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Compile all styles
    const themeCss = generateThemeCss(theme);
    const componentCss = components
      .map((c) => compileComponentStyles(c, breakpoints))
      .join("\n");

    const fullStyles = `
      /* Theme */
      ${themeCss}
      
      /* Global page styles */
      ${pageStyles}
      
      /* Component styles */
      ${componentCss}
    `;

    // 2. Inject into VirtualWindow
    canvasRef.current.addGlobalStyle(fullStyles);
  }, [canvasRef, components, pageStyles, theme, breakpoints]);
}
```

### Animation Pattern (GSAP)

```typescript
// ALWAYS specify scroller for ScrollTrigger

function AnimatedComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = usePageBuilder(state => state.canvasRef);

  useEffect(() => {
    // 1. Get scroll container from VirtualWindow
    const scrollContainer = canvasRef.current?.shadowRoot
      ?.querySelector('.mount-node');

    if (!scrollContainer || !containerRef.current) return;

    // 2. Use gsap.context for automatic cleanup
    const ctx = gsap.context(() => {
      gsap.to('.element', {
        x: 100,
        scrollTrigger: {
          trigger: '.element',
          start: 'top center',
          scroller: scrollContainer,  // ← CRITICAL
        },
      });
    }, containerRef.current);

    // 3. Cleanup
    return () => ctx.revert();
  }, [canvasRef]);

  return <div ref={containerRef}>...</div>;
}
```

---

## ⚡ Performance Requirements

### Target Metrics

- **Canvas interaction**: 60fps (16ms per frame)
- **Selection**: <5ms
- **Drag movement**: <10ms per update
- **Style update**: <50ms (compile + inject)
- **Undo/redo**: <20ms
- **Component add**: <30ms

### Optimization Strategies

**RAF Batching:**

```typescript
let rafId: number | null = null;

function scheduleUpdate(callback: () => void) {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });
}
```

**Cached Geometry:**

```typescript
// Cache during drag start
const cachedRect = useRef<DOMRect | null>(null);

function handleDragStart() {
  cachedRect.current =
    canvasRef.current?.hostElement.getBoundingClientRect() || null;
}

// Use cached rect during drag (no getBoundingClientRect calls)
function handleDragMove(e: PointerEvent) {
  const rect = cachedRect.current;
  // ... use rect
}
```

**Memoization:**

```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(Component);

// Memoize selectors
const selectedComponents = usePageBuilder(
  useCallback(
    (state) => state.components.filter((c) => state.selectedIds.has(c.id)),
    [],
  ),
);

// Memoize computations
const compiledStyles = useMemo(
  () => compileAllStyles(components, breakpoints),
  [components, breakpoints],
);
```

---

## 🚨 Common Pitfalls to Avoid

### 1. VirtualWindow Coordinates

```typescript
// ❌ WRONG - Using global coordinates
const x = event.clientX;
const y = event.clientY;

// ✅ CORRECT - Converting to local
const local = canvasRef.current?.toLocalPoint(event);
const x = local?.x;
const y = local?.y;
```

### 2. Style Injection

```typescript
// ❌ WRONG - Inline styles
<div style={{ backgroundColor: component.styles.base.backgroundColor }}>

// ✅ CORRECT - Class name + injected CSS
<div className={component.className}>
```

### 3. GSAP ScrollTrigger

```typescript
// ❌ WRONG - No scroller specified
scrollTrigger: {
  trigger: element,
}

// ✅ CORRECT - Scroller specified
scrollTrigger: {
  trigger: element,
  scroller: scrollContainer,
}
```

### 4. Component IDs

```typescript
// ❌ WRONG - Random string
id: Math.random().toString();

// ✅ CORRECT - UUID v7
import { v7 as uuidv7 } from "uuid";
id: uuidv7();
```

### 5. State Updates

```typescript
// ❌ WRONG - Direct mutation
components.push(newComponent);

// ✅ CORRECT - Immutable update via action
addComponent(newComponent);
```

---

## 📚 Required Reading

Before starting, READ these VirtualWindow docs:

1. **README.md** - Overview and quick start
2. **ARCHITECTURE.md** - Deep technical dive
3. **LLM.md** - Complete context (18k lines!)
4. **API_REFERENCE.md** - All methods and props
5. **ANIMATION_INTEGRATION.md** - GSAP + Framer patterns
6. **MISSING_FEATURES.md** - Implementation plans for complex features

---

## ✅ Phase Completion Checklist

After each phase, verify:

- [ ] All features from phase deliverables implemented
- [ ] Validation checklist passes
- [ ] No console errors
- [ ] Performance targets met
- [ ] Undo/redo works
- [ ] State persists
- [ ] Works on mobile, tablet, desktop
- [ ] Code documented
- [ ] README updated

---

## 🎯 Final Success Criteria

Project is MVP-complete when:

1. ✅ Can build a complete landing page using ONLY the UI
2. ✅ All components draggable from palette
3. ✅ All styles editable visually
4. ✅ Responsive design with breakpoints works
5. ✅ Undo/redo works for all operations
6. ✅ Animations (GSAP + Framer) functional
7. ✅ Theme system applies globally
8. ✅ Templates save and load
9. ✅ Accessibility tools functional
10. ✅ Works flawlessly on mobile, tablet, desktop
11. ✅ Performance targets met (60fps)
12. ✅ No data loss (localStorage persistence)
13. ✅ All Phase 1-12 features complete

---

**This document is the source of truth for all project decisions.** 🎯

**Next step:** Read COMPREHENSIVE_BUILDER_PROMPT.md for complete implementation guide.
