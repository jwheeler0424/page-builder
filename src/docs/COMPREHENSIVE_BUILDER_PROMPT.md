# Enterprise Page Builder Application - Comprehensive Development Prompt

## 🎯 Project Overview

You are tasked with building a **full-featured, enterprise-grade web application** that serves as a unified design and builder tool for:

- Web applications
- Websites
- Individual web pages
- Reusable components

This is a **complex, multi-phase project** that requires careful planning, systematic implementation, and continuous validation.

---

## 📚 Required Context Documents

**CRITICAL:** Before beginning, you MUST read and understand these documentation files:

### VirtualWindow Documentation (Core Foundation)

1. **README.md** - Core component overview and quick start
2. **ARCHITECTURE.md** - Technical implementation details
3. **LLM.md** - Complete technical context and patterns
4. **API_REFERENCE.md** - All props, methods, and types
5. **ANIMATION_INTEGRATION.md** - GSAP and Framer Motion patterns
6. **MISSING_FEATURES.md** - Planned features and implementation plans

### Reference Documentation

1. **EXAMPLES.md** - Common usage patterns
2. **TROUBLESHOOTING.md** - Known issues and solutions
3. **FAQ.md** - Frequently asked questions

**You must internalize:**

- VirtualWindow's Shadow DOM + React Portal architecture
- Coordinate transformation system (global → local)
- External drag-and-drop patterns
- Style injection mechanisms
- Performance optimization strategies

---

## 🛠️ Technology Stack

### Core Framework

```json
{
  "framework": "React 19+",
  "language": "TypeScript (strict mode)",
  "buildTool": "Vite",
  "runtime": "Browser only (web application)"
}
```

### Required Dependencies

```json
{
  "ui": {
    "virtualwindow": "Custom component (provided)",
    "shadcn-ui": "Pre-integrated (all components)",
    "lucide-react": "Icons"
  },
  "dragDrop": "dnd-kit (core + sortable + utilities)",
  "animations": {
    "gsap": "Latest with ScrollTrigger plugin",
    "framer-motion": "Latest"
  },
  "styling": "lightningcss (CSS processing)",
  "state": {
    "zustand": "With immer middleware",
    "zustand-middleware": "persist (localStorage) + undo middleware"
  },
  "utilities": {
    "@tanstack/react-query": "For async state & debouncing",
    "uuid": "v7 function for unique IDs"
  }
}
```

### Backend (Phase 2+)

```json
{
  "server": "Hono with Bun runtime",
  "database": "PostgreSQL",
  "orm": "Drizzle ORM"
}
```

### Forbidden Dependencies

- **NO** additional UI libraries without approval
- **NO** state management libraries besides Zustand
- **NO** CSS preprocessors (SASS, Less, Stylus)
- **NO** heavy utility libraries (lodash, ramda) - use native JS
- **NO** CSS-in-JS libraries as defaults (styled-components, emotion)

---

## 🏗️ Core Architecture Requirements

### 1. Canvas System (VirtualWindow Integration)

**Primary Canvas Wrapper:**

```typescript
// The VirtualWindow component is the CORE of the page builder
// All designed content renders inside VirtualWindow's isolated environment

<VirtualWindow
  ref={canvasRef}
  width={designWidth}
  height={designHeight}
  scale={zoom}
  resizable={false}  // User designs content, not window
  draggable={false}
  onResize={handleCanvasResize}
>
  <DesignCanvas
    components={components}
    selectedIds={selectedIds}
    onSelect={handleSelect}
  />
</VirtualWindow>
```

**Critical Integration Points:**

1. Use `toLocalPoint()` for all drag-drop coordinate conversions
2. Use `addGlobalStyle()` for injecting page styles into preview
3. Use `matchMedia()` for responsive breakpoint testing
4. Use `exportAsImage()` for thumbnail generation

### 2. State Management Architecture

**Zustand Store Structure:**

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";

interface PageBuilderState {
  // Project Management
  currentProject: Project | null;
  projects: Project[];

  // Canvas State
  components: ComponentInstance[];
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Design State
  breakpoints: Breakpoint[];
  activeBreakpoint: string;
  pageStyles: string; // Global CSS for this page

  // UI State
  zoom: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  showRulers: boolean;

  // History (handled by zundo)
  // undo, redo, clear, etc.

  // Actions
  addComponent: (component: ComponentInstance) => void;
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  deleteComponents: (ids: string[]) => void;
  selectComponents: (ids: string[], additive?: boolean) => void;
  // ... more actions
}

const usePageBuilder = create<PageBuilderState>()(
  temporal(
    // Undo/redo middleware
    persist(
      // LocalStorage persistence
      immer((set, get) => ({
        // Immer for immutable updates
        // Initial state and actions
      })),
      { name: "page-builder-storage" },
    ),
    { limit: 50 }, // 50 undo states
  ),
);
```

### 3. Style Injection Strategy

**CRITICAL REQUIREMENT:** Styles MUST NOT be inline on components. All styles are injected into `<style>` tags.

**Style Generation System:**

```typescript
// Each component instance has:
interface ComponentInstance {
  id: string;
  type: string;
  styles: {
    base: CSSProperties; // Base styles
    hover?: CSSProperties; // :hover pseudo-selector
    active?: CSSProperties; // :active pseudo-selector
    focus?: CSSProperties; // :focus pseudo-selector
    before?: CSSProperties; // ::before pseudo-element
    after?: CSSProperties; // ::after pseudo-element
  };
  breakpointStyles: {
    [breakpointId: string]: {
      base: CSSProperties;
      hover?: CSSProperties;
      // ... etc
    };
  };
  className: string; // Generated unique class name
}

// Style compiler
function compileComponentStyles(component: ComponentInstance): string {
  const className = component.className;

  let css = `
    .${className} {
      ${objectToCss(component.styles.base)}
    }
  `;

  if (component.styles.hover) {
    css += `
      .${className}:hover {
        ${objectToCss(component.styles.hover)}
      }
    `;
  }

  // Compile breakpoint styles
  Object.entries(component.breakpointStyles).forEach(([bpId, styles]) => {
    const breakpoint = getBreakpoint(bpId);
    css += `
      @media (min-width: ${breakpoint.minWidth}px) {
        .${className} {
          ${objectToCss(styles.base)}
        }
      }
    `;
  });

  return css;
}

// Inject all styles into VirtualWindow
function injectPageStyles() {
  const allStyles = components.map(compileComponentStyles).join("\n");
  const globalStyles = pageStyles; // User-defined global styles

  canvasRef.current?.addGlobalStyle(`
    ${globalStyles}
    ${allStyles}
  `);
}
```

### 4. Component Instance System

**Every element on the canvas is a ComponentInstance:**

```typescript
interface ComponentInstance {
  // Identity
  id: string; // uuid v7
  type: string; // "button", "hero", "parallax-container", etc.
  className: string; // Generated: "comp-abc123"

  // Hierarchy
  parentId: string | null;
  children: string[]; // Child component IDs

  // Position & Size (relative to parent or canvas)
  x: number;
  y: number;
  width: number;
  height: number;

  // Styling
  styles: ComponentStyles;
  breakpointStyles: Record<string, ComponentStyles>;

  // Content
  props: Record<string, any>; // Component-specific props
  content?: string; // Text content for text elements

  // Metadata
  label: string; // Display name in hierarchy
  locked: boolean;
  visible: boolean;

  // Animation
  animations?: AnimationConfig[];
}

interface ComponentStyles {
  base: CSSProperties;
  hover?: CSSProperties;
  active?: CSSProperties;
  focus?: CSSProperties;
  before?: CSSProperties;
  after?: CSSProperties;

  // Allow CSS-in-JS for special cases
  useCssInJs?: boolean;
}
```

### 5. Component Library Structure

**Pre-built Components Required:**

**Primitives:**

- Box (div with styling)
- Text (p, h1-h6, span)
- Image
- Button
- Input (text, email, password, etc.)
- Textarea
- Link
- Icon (lucide-react wrapper)

**Layout:**

- Container (max-width wrapper)
- Stack (vertical/horizontal)
- Grid
- Flex

**Advanced:**

- Hero (full-width header with background)
- Navbar
- Footer
- Card
- ParallaxContainer (multi-layer parallax with GSAP)
- Form (wrapper with submission handling)

**shadcn/ui Integration:**

- All shadcn components should be "wrapped" as ComponentInstances
- User can drag shadcn components into canvas
- Maintain shadcn styling but allow overrides

**Component Registry:**

```typescript
interface ComponentDefinition {
  type: string;
  label: string;
  icon: LucideIcon;
  category: "primitive" | "layout" | "advanced" | "shadcn";
  defaultProps: Record<string, any>;
  defaultStyles: ComponentStyles;

  // Render function
  render: (
    instance: ComponentInstance,
    children?: React.ReactNode,
  ) => JSX.Element;

  // Property schema for the properties panel
  schema: PropertySchema[];
}

const componentRegistry: Record<string, ComponentDefinition> = {
  button: {
    /* ... */
  },
  hero: {
    /* ... */
  },
  "parallax-container": {
    /* ... */
  },
  // ... etc
};
```

---

## 🎨 UI/UX Requirements

### Layout Structure

```text
┌─────────────────────────────────────────────────────────────┐
│  Top Toolbar                                                │
│  [File] [Edit] [View] [Insert] ... [Zoom: 100%] [Device]    │
├──────┬────────────────────────────────────────────┬─────────┤
│      │                                            │         │
│ Com- │                                            │ Props   │
│ po-  │          VirtualWindow Canvas              │ Panel   │
│ nents│                                            │         │
│ Panel│                                            │         │
│      │                                            │         │
├──────┴────────────────────────────────────────────┴─────────┤
│  Layers/Hierarchy Panel                                     │
│  [Expand All] [Collapse All]                                │
│  └─ Page                                                    │
│     ├─ Header                                               │
│     │  └─ Logo                                              │
│     └─ Hero                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Responsive Considerations:**

- On mobile/tablet: Use collapsible panels with tabs
- Swipe gestures to switch between Components/Canvas/Properties
- Bottom toolbar for quick actions
- Context menus (long-press on mobile, right-click on desktop)

### Panels

1. **Components Panel (Left)**
   - Searchable component list
   - Categorized (Primitives, Layout, Advanced, shadcn, Custom)
   - Drag to canvas to add
   - Preview thumbnails
2. **Canvas (Center)**
   - VirtualWindow wrapper
   - Zoom controls (+/-, fit to width, 100%)
   - Device/breakpoint switcher
   - Rulers (optional)
   - Grid overlay (optional)
   - Snap indicators
3. **Properties Panel (Right)**
   - Tabs: [Styles] [Properties] [Animations]
   - Context-sensitive (shows props for selected component)
   - Style editor with visual controls:
     - Color pickers
     - Numeric inputs with units (px, %, em, rem)
     - Spacing editor (margin/padding visual box model)
     - Typography controls
     - Border/shadow editors
     - Pseudo-selector tabs (:hover, :active, etc.)
4. **Layers Panel (Bottom)**
   - Tree view of component hierarchy
   - Drag to reorder/reparent
   - Click to select
   - Eye icon to show/hide
   - Lock icon to prevent editing
   - Context menu (duplicate, delete, etc.)

---

## 📋 Implementation Phases

## PHASE 0: Planning & Architecture (Week 1)

### Deliverables

1. **System Architecture Document**
   - State management flow diagrams
   - Component hierarchy design
   - Data model schemas
   - API surface planning (for future backend)

2. **Technical Specifications**
   - File structure
   - Naming conventions
   - Code organization patterns
   - Type definitions

3. **UI/UX Wireframes**
   - Main application layout
   - Panel designs
   - Mobile responsive layouts
   - Interaction flows

### Validation Checklist

- [ ] All stakeholders reviewed architecture
- [ ] VirtualWindow integration strategy defined
- [ ] State management patterns documented
- [ ] Component library scope finalized
- [ ] Responsive UI approach validated

### Output Summary

Present a comprehensive document covering:

- Project structure
- Key abstractions and interfaces
- Risk assessment
- Timeline estimation per phase

---

## PHASE 1: Foundation & Core Systems (Weeks 2-3)

### 1.1 Project Setup

**Tasks:**

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure TypeScript (strict mode)
- [ ] Setup lightningcss integration
- [ ] Install and configure dependencies
- [ ] Create base folder structure:

  ```text
  src/
  ├── components/
  │   ├── canvas/
  │   ├── panels/
  │   ├── ui/
  │   └── primitives/
  ├── stores/
  │   └── pageBuilder.ts
  ├── types/
  │   └── index.ts
  ├── lib/
  │   ├── componentRegistry.ts
  │   ├── styleCompiler.ts
  │   └── utils.ts
  └── App.tsx
  ```

- [ ] Setup path aliases (@/, @components/, @lib/, etc.)

**Validation:**

- [ ] Project builds without errors
- [ ] Hot reload works
- [ ] TypeScript strict mode passes
- [ ] All dependencies installed correctly

### 1.2 Zustand Store Implementation

**Tasks:**

- [ ] Define complete TypeScript interfaces for state
- [ ] Implement base store with immer middleware
- [ ] Add persist middleware for localStorage
- [ ] Integrate zundo for undo/redo
- [ ] Create store hooks and selectors
- [ ] Write unit tests for store actions

**Key State Slices:**

```typescript
// Project slice
projectSlice: {
  currentProject,
  projects,
  createProject,
  loadProject,
  saveProject,
}

// Component slice
componentSlice: {
  components,
  addComponent,
  updateComponent,
  deleteComponents,
  reparentComponent,
}

// Selection slice
selectionSlice: {
  selectedIds,
  hoveredId,
  selectComponents,
  clearSelection,
}

// Canvas slice
canvasSlice: {
  zoom,
  gridEnabled,
  snapEnabled,
  canvasSize,
}

// Style slice
styleSlice: {
  pageStyles,
  updatePageStyles,
  compileStyles,
}

// Breakpoint slice
breakpointSlice: {
  breakpoints,
  activeBreakpoint,
  addBreakpoint,
  updateBreakpoint,
  deleteBreakpoint,
}
```

**Validation:**

- [ ] All actions update state correctly
- [ ] Undo/redo works for all mutations
- [ ] State persists to localStorage
- [ ] No memory leaks
- [ ] Store hooks don't cause unnecessary re-renders

### 1.3 VirtualWindow Canvas Integration

**Tasks:**

- [ ] Import VirtualWindow component
- [ ] Create Canvas wrapper component
- [ ] Implement coordinate transformation utilities
- [ ] Setup style injection system
- [ ] Connect canvas to Zustand state
- [ ] Implement zoom controls

**Canvas Component Structure:**

```typescript
function DesignCanvas() {
  const canvasRef = useRef<VirtualWindowRef>(null);
  const components = usePageBuilder(state => state.components);
  const zoom = usePageBuilder(state => state.zoom);

  // Inject all styles into VirtualWindow
  useEffect(() => {
    const styleString = compileAllStyles(components);
    canvasRef.current?.addGlobalStyle(styleString);
  }, [components]);

  return (
    <VirtualWindow
      ref={canvasRef}
      width={1200}
      height={800}
      scale={zoom}
    >
      <ComponentRenderer components={components} />
    </VirtualWindow>
  );
}
```

**Validation:**

- [ ] VirtualWindow renders correctly
- [ ] Styles inject properly
- [ ] Zoom controls work
- [ ] No style leakage
- [ ] Canvas responds to state changes

### 1.4 Component Instance System

**Tasks:**

- [ ] Define ComponentInstance interface
- [ ] Implement component registry
- [ ] Create factory functions for component creation
- [ ] Build component renderer system
- [ ] Implement recursive rendering for nested components

**Component Renderer:**

```typescript
function ComponentRenderer({
  components
}: {
  components: ComponentInstance[]
}) {
  const rootComponents = components.filter(c => !c.parentId);

  return (
    <>
      {rootComponents.map(component => (
        <RenderedComponent
          key={component.id}
          component={component}
          allComponents={components}
        />
      ))}
    </>
  );
}

function RenderedComponent({
  component,
  allComponents
}: {
  component: ComponentInstance;
  allComponents: ComponentInstance[];
}) {
  const definition = componentRegistry[component.type];
  const children = allComponents.filter(c => c.parentId === component.id);

  const childElements = children.map(child => (
    <RenderedComponent
      key={child.id}
      component={child}
      allComponents={allComponents}
    />
  ));

  // Render with generated className
  return definition.render(component, childElements);
}
```

**Validation:**

- [ ] Components render with correct markup
- [ ] Classes are applied correctly
- [ ] Nested components render recursively
- [ ] No infinite render loops
- [ ] Performance acceptable (<16ms per render)

### Phase 1 Summary & Sign-off

**Deliverables:**

1. Working project with all dependencies
2. Complete Zustand store with undo/redo
3. VirtualWindow canvas rendering components
4. Component instance and registry systems
5. Basic component rendering

**Validation:**

- [ ] Can create component instances programmatically
- [ ] Components render in VirtualWindow
- [ ] Styles inject correctly
- [ ] State persists across page refresh
- [ ] Undo/redo works for basic operations

---

## PHASE 2: Selection & Interaction (Weeks 4-5)

### 2.1 Selection System

**Reference:** See MISSING_FEATURES.md → Section 1: Selection System

**Tasks:**

- [ ] Implement click-to-select
- [ ] Multi-select (Cmd/Ctrl + click)
- [ ] Marquee selection (drag box)
- [ ] Selection indicators (blue outline)
- [ ] Keyboard navigation (Tab, arrows)
- [ ] Selection context menu

**Key Implementation:**

```typescript
// Selection hook
function useSelection() {
  const selectedIds = usePageBuilder(state => state.selectedIds);
  const selectComponents = usePageBuilder(state => state.selectComponents);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const componentId = target.dataset.componentId;

    if (!componentId) {
      selectComponents([], false);  // Clear selection
      return;
    }

    const additive = e.metaKey || e.ctrlKey;
    selectComponents([componentId], additive);
  };

  return { selectedIds, handleCanvasClick };
}

// Selection indicator
function SelectionIndicator({ componentId }: { componentId: string }) {
  const component = usePageBuilder(state =>
    state.components.find(c => c.id === componentId)
  );

  if (!component) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: component.x - 2,
        top: component.y - 2,
        width: component.width + 4,
        height: component.height + 4,
        border: '2px solid #3b82f6',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    />
  );
}
```

**Validation:**

- [ ] Single click selects component
- [ ] Cmd/Ctrl + click adds to selection
- [ ] Shift + click range selects
- [ ] Marquee drag selects multiple
- [ ] Tab navigates between components
- [ ] Selected components have visual indicator
- [ ] Escape clears selection

### 2.2 Drag-to-Position System

**Tasks:**

- [ ] Integrate dnd-kit with VirtualWindow
- [ ] Implement drag handles on selected components
- [ ] Use `toLocalPoint()` for coordinate conversion
- [ ] Update component position in store
- [ ] Show ghost/preview during drag
- [ ] Snap to grid (if enabled)

**Critical Pattern (from VirtualWindow docs):**

```typescript
function useDraggableComponent(componentId: string) {
  const canvasRef = usePageBuilder((state) => state.canvasRef);
  const updateComponent = usePageBuilder((state) => state.updateComponent);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: componentId,
    data: { type: "component", componentId },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.active.id !== componentId) return;

    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + (event.delta?.x || 0);
    const finalY = pointerEvent.clientY + (event.delta?.y || 0);

    const local = canvasRef.current?.toLocalPoint({
      clientX: finalX,
      clientY: finalY,
    } as PointerEvent);

    if (local) {
      updateComponent(componentId, {
        x: local.x,
        y: local.y,
      });
    }
  };

  return { attributes, listeners, setNodeRef };
}
```

**Validation:**

- [ ] Can drag selected components
- [ ] Position updates in real-time
- [ ] Coordinates are accurate at all zoom levels
- [ ] Multi-selection drag moves all selected
- [ ] Undo/redo works with drag

### 2.3 Resize Handles

**Tasks:**

- [ ] Add 8 resize handles to selected components
- [ ] Implement corner resize (diagonal)
- [ ] Implement edge resize (horizontal/vertical)
- [ ] Maintain aspect ratio (Shift key)
- [ ] Update component dimensions in store
- [ ] Respect min/max constraints

**Validation:**

- [ ] All 8 handles resize correctly
- [ ] Shift maintains aspect ratio
- [ ] Alt resizes from center
- [ ] Constraints respected
- [ ] Undo/redo works

### Phase 2 Summary & Sign-off

**Deliverables:**

1. Full selection system (click, multi, marquee, keyboard)
2. Drag-to-position components
3. Resize handles with constraints
4. Selection indicators
5. Context menus

**Validation:**

- [ ] Can select any component
- [ ] Can move components around canvas
- [ ] Can resize components
- [ ] Keyboard shortcuts work
- [ ] Undo/redo works for all operations

---

## PHASE 3: Component Library & Drag-to-Add (Week 6)

### 3.1 Component Palette Panel

**Tasks:**

- [ ] Build left panel UI
- [ ] Categorize components
- [ ] Implement search/filter
- [ ] Create component thumbnails
- [ ] Make components draggable from palette

**Panel Structure:**

```typescript
function ComponentsPalette() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const components = useMemo(() => {
    return Object.values(componentRegistry)
      .filter(comp => {
        if (category !== 'all' && comp.category !== category) return false;
        if (search && !comp.label.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
  }, [search, category]);

  return (
    <div className="components-palette">
      <input
        type="search"
        placeholder="Search components..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="categories">
        <button onClick={() => setCategory('all')}>All</button>
        <button onClick={() => setCategory('primitive')}>Primitives</button>
        <button onClick={() => setCategory('layout')}>Layout</button>
        <button onClick={() => setCategory('advanced')}>Advanced</button>
        <button onClick={() => setCategory('shadcn')}>shadcn/ui</button>
      </div>

      <div className="component-grid">
        {components.map(comp => (
          <DraggableComponentCard key={comp.type} definition={comp} />
        ))}
      </div>
    </div>
  );
}
```

**Validation:**

- [ ] All components visible
- [ ] Search works
- [ ] Categories filter correctly
- [ ] Thumbnails display
- [ ] Responsive on mobile

### 3.2 External Drag-to-Add

**Reference:** VirtualWindow ARCHITECTURE.md → External Drag-and-Drop section

**Tasks:**

- [ ] Implement palette component dragging
- [ ] Register drags with VirtualWindow
- [ ] Show drop preview in canvas
- [ ] Calculate drop position
- [ ] Create component instance on drop
- [ ] Unregister drag on end

**Critical Pattern:**

```typescript
function DraggableComponentCard({ definition }: { definition: ComponentDefinition }) {
  const canvasRef = usePageBuilder(state => state.canvasRef);
  const addComponent = usePageBuilder(state => state.addComponent);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${definition.type}`,
    data: { type: 'palette-item', componentType: definition.type },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    canvasRef.current?.registerExternalDrag(pointerEvent.pointerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const pointerEvent = event.activatorEvent as PointerEvent;
    const finalX = pointerEvent.clientX + (event.delta?.x || 0);
    const finalY = pointerEvent.clientY + (event.delta?.y || 0);

    if (canvasRef.current?.isPointInside(finalX, finalY)) {
      const local = canvasRef.current.toLocalPoint({
        clientX: finalX,
        clientY: finalY
      } as PointerEvent);

      if (local) {
        const newComponent: ComponentInstance = {
          id: uuidv7(),
          type: definition.type,
          className: `comp-${uuidv7().slice(0, 8)}`,
          parentId: null,
          children: [],
          x: local.x,
          y: local.y,
          width: definition.defaultProps.width || 200,
          height: definition.defaultProps.height || 100,
          styles: definition.defaultStyles,
          breakpointStyles: {},
          props: definition.defaultProps,
          label: definition.label,
          locked: false,
          visible: true,
        };

        addComponent(newComponent);
      }
    }

    canvasRef.current?.unregisterExternalDrag(pointerEvent.pointerId);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div ref={setNodeRef} {...listeners} {...attributes}>
        <Icon icon={definition.icon} />
        <span>{definition.label}</span>
      </div>
    </DndContext>
  );
}
```

**Validation:**

- [ ] Can drag any component from palette
- [ ] Drop preview shows in canvas
- [ ] Component creates at correct position
- [ ] Works at all zoom levels
- [ ] Undo creates new component

### 3.3 Primitive Components

**Tasks:**
Implement these primitive components in componentRegistry:

**Box:**

```typescript
{
  type: 'box',
  label: 'Box',
  category: 'primitive',
  defaultProps: { width: 200, height: 200 },
  defaultStyles: {
    base: {
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    }
  },
  render: (instance) => (
    <div
      className={instance.className}
      data-component-id={instance.id}
      style={{
        position: 'absolute',
        left: instance.x,
        top: instance.y,
        width: instance.width,
        height: instance.height,
      }}
    />
  ),
}
```

Complete all primitives:

- [ ] Box
- [ ] Text (p, h1-h6, span variants)
- [ ] Image
- [ ] Button
- [ ] Input
- [ ] Textarea
- [ ] Link
- [ ] Icon

**Validation for each:**

- [ ] Renders correctly
- [ ] Draggable from palette
- [ ] Selectable in canvas
- [ ] Styles apply
- [ ] Editable via properties panel (next phase)

### 3.4 Layout Components

Implement layout components:

- [ ] Container (max-width wrapper)
- [ ] Stack (vertical/horizontal flex)
- [ ] Grid (CSS grid)
- [ ] Flex (flexbox container)

**Special consideration:** These are parent components that can contain children.

**Validation:**

- [ ] Can drop components into layout containers
- [ ] Children maintain relative positioning
- [ ] Layout props work (gap, justify, align)

### 3.5 Advanced Components

**Hero Component:**

```typescript
{
  type: 'hero',
  label: 'Hero',
  category: 'advanced',
  defaultProps: {
    width: 1200,
    height: 600,
    backgroundType: 'gradient',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  defaultStyles: {
    base: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
    }
  },
  render: (instance, children) => (
    <section
      className={instance.className}
      style={{
        position: 'absolute',
        left: instance.x,
        top: instance.y,
        width: instance.width,
        height: instance.height,
        background: instance.props.backgroundType === 'gradient'
          ? instance.props.gradient
          : `url(${instance.props.backgroundImage})`,
        backgroundSize: 'cover',
      }}
    >
      {children}
    </section>
  ),
}
```

**ParallaxContainer Component:**

```typescript
{
  type: 'parallax-container',
  label: 'Parallax Container',
  category: 'advanced',
  defaultProps: {
    layers: [
      { id: '1', speed: 0.5, zIndex: 1 },
      { id: '2', speed: 1, zIndex: 2 },
      { id: '3', speed: 1.5, zIndex: 3 },
    ],
  },
  render: (instance, children) => {
    return (
      <ParallaxComponent
        instance={instance}
        layers={instance.props.layers}
      >
        {children}
      </ParallaxComponent>
    );
  },
}

// Separate component with GSAP integration
function ParallaxComponent({ instance, layers, children }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = usePageBuilder(state => state.canvasRef);

  useEffect(() => {
    // Get the actual scrollable container from VirtualWindow
    const scrollContainer = canvasRef.current?.shadowRoot
      ?.querySelector('.mount-node');

    if (!scrollContainer || !containerRef.current) return;

    const ctx = gsap.context(() => {
      layers.forEach((layer, index) => {
        const layerEl = containerRef.current?.querySelector(`[data-layer="${layer.id}"]`);

        if (layerEl) {
          gsap.to(layerEl, {
            y: () => (layer.speed - 1) * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              scroller: scrollContainer,  // ← CRITICAL
            },
          });
        }
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, [layers]);

  return (
    <div
      ref={containerRef}
      className={instance.className}
      style={{
        position: 'absolute',
        left: instance.x,
        top: instance.y,
        width: instance.width,
        height: instance.height,
        overflow: 'hidden',
      }}
    >
      {React.Children.map(children, (child, index) => {
        const layer = layers[index];
        return layer ? (
          <div
            data-layer={layer.id}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: layer.zIndex,
            }}
          >
            {child}
          </div>
        ) : child;
      })}
    </div>
  );
}
```

Implement:

- [ ] Hero
- [ ] Navbar
- [ ] Footer
- [ ] Card
- [ ] ParallaxContainer
- [ ] Form

**Validation:**

- [ ] All advanced components render
- [ ] ParallaxContainer works with GSAP
- [ ] Hero accepts background images
- [ ] Form wraps inputs correctly

### Phase 3 Summary & Sign-off

**Deliverables:**

1. Complete component palette panel
2. Drag-to-add from palette to canvas
3. All primitive components
4. All layout components
5. All advanced components
6. shadcn/ui component wrappers

**Validation:**

- [ ] Can add any component to canvas
- [ ] All components render correctly
- [ ] Drag-drop works from palette
- [ ] Components are selectable and movable
- [ ] ParallaxContainer uses GSAP correctly

---

## PHASE 4: Properties Panel & Styling (Weeks 7-8)

### 4.1 Properties Panel UI

**Tasks:**

- [ ] Build right panel UI
- [ ] Create tabbed interface (Styles, Properties, Animations)
- [ ] Make panel collapsible on mobile
- [ ] Connect to selected component

**Panel Structure:**

```typescript
function PropertiesPanel() {
  const selectedIds = usePageBuilder(state => state.selectedIds);
  const components = usePageBuilder(state => state.components);

  // Get primary selected component
  const selectedComponent = components.find(c =>
    selectedIds.has(c.id)
  );

  if (!selectedComponent) {
    return (
      <div className="properties-panel">
        <p>No component selected</p>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <Tabs defaultValue="styles">
        <TabsList>
          <TabsTrigger value="styles">Styles</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
        </TabsList>

        <TabsContent value="styles">
          <StyleEditor component={selectedComponent} />
        </TabsContent>

        <TabsContent value="properties">
          <PropertyEditor component={selectedComponent} />
        </TabsContent>

        <TabsContent value="animations">
          <AnimationEditor component={selectedComponent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Validation:**

- [ ] Panel shows selected component info
- [ ] Tabs switch correctly
- [ ] Collapses on mobile
- [ ] Updates when selection changes

### 4.2 Style Editor

**Tasks:**

- [ ] Build visual style controls
- [ ] Implement pseudo-selector tabs
- [ ] Create spacing editor (box model)
- [ ] Add color pickers
- [ ] Build typography controls
- [ ] Create border/shadow editors
- [ ] Add background editor

**Style Editor Components:**

**Box Model Editor:**

```typescript
function SpacingEditor({ component }: { component: ComponentInstance }) {
  const updateComponent = usePageBuilder(state => state.updateComponent);

  const updateSpacing = (property: string, value: string) => {
    updateComponent(component.id, {
      styles: {
        ...component.styles,
        base: {
          ...component.styles.base,
          [property]: value,
        },
      },
    });
  };

  return (
    <div className="spacing-editor">
      <h4>Spacing</h4>

      <div className="box-model">
        {/* Visual box model with margin/padding inputs */}
        <div className="margin-layer">
          <label>Margin</label>
          <input
            type="text"
            value={component.styles.base.margin || '0'}
            onChange={(e) => updateSpacing('margin', e.target.value)}
          />
        </div>

        <div className="padding-layer">
          <label>Padding</label>
          <input
            type="text"
            value={component.styles.base.padding || '0'}
            onChange={(e) => updateSpacing('padding', e.target.value)}
          />
        </div>
      </div>

      {/* Individual controls for each side */}
      <div className="spacing-controls">
        <div>
          <label>Margin Top</label>
          <input
            type="number"
            value={parseFloat(component.styles.base.marginTop || '0')}
            onChange={(e) => updateSpacing('marginTop', `${e.target.value}px`)}
          />
        </div>
        {/* ... repeat for all sides */}
      </div>
    </div>
  );
}
```

**Color Picker Integration:**

```typescript
import { HexColorPicker } from 'react-colorful';  // Or use shadcn color picker

function ColorEditor({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="color-editor">
      <label>{label}</label>
      <div className="color-input-wrapper">
        <div
          className="color-preview"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {showPicker && (
        <div className="color-picker-popover">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
```

**Typography Editor:**

```typescript
function TypographyEditor({ component }: { component: ComponentInstance }) {
  const updateStyle = (property: string, value: string) => {
    // Update component.styles.base[property]
  };

  return (
    <div className="typography-editor">
      <h4>Typography</h4>

      <div className="font-family">
        <label>Font Family</label>
        <select
          value={component.styles.base.fontFamily || 'inherit'}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
        >
          <option value="inherit">Inherit</option>
          <option value="system-ui">System UI</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Roboto', sans-serif">Roboto</option>
          {/* Add more fonts */}
        </select>
      </div>

      <div className="font-size">
        <label>Font Size</label>
        <input
          type="number"
          value={parseFloat(component.styles.base.fontSize || '16')}
          onChange={(e) => updateStyle('fontSize', `${e.target.value}px`)}
        />
        <select
          value={getFontUnit(component.styles.base.fontSize)}
          onChange={(e) => {
            const value = parseFloat(component.styles.base.fontSize || '16');
            updateStyle('fontSize', `${value}${e.target.value}`);
          }}
        >
          <option value="px">px</option>
          <option value="em">em</option>
          <option value="rem">rem</option>
        </select>
      </div>

      <div className="font-weight">
        <label>Font Weight</label>
        <select
          value={component.styles.base.fontWeight || '400'}
          onChange={(e) => updateStyle('fontWeight', e.target.value)}
        >
          <option value="300">Light (300)</option>
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">Semibold (600)</option>
          <option value="700">Bold (700)</option>
        </select>
      </div>

      {/* Line height, letter spacing, text align, etc. */}
    </div>
  );
}
```

**Pseudo-Selector Tabs:**

```typescript
function PseudoSelectorEditor({ component }: { component: ComponentInstance }) {
  const [activeSelector, setActiveSelector] = useState<'base' | 'hover' | 'active' | 'focus'>('base');

  const currentStyles = activeSelector === 'base'
    ? component.styles.base
    : component.styles[activeSelector] || {};

  const updateStyles = (updates: CSSProperties) => {
    // Update the appropriate style object
  };

  return (
    <div className="pseudo-selector-editor">
      <div className="selector-tabs">
        <button
          className={activeSelector === 'base' ? 'active' : ''}
          onClick={() => setActiveSelector('base')}
        >
          Base
        </button>
        <button
          className={activeSelector === 'hover' ? 'active' : ''}
          onClick={() => setActiveSelector('hover')}
        >
          :hover
        </button>
        <button
          className={activeSelector === 'active' ? 'active' : ''}
          onClick={() => setActiveSelector('active')}
        >
          :active
        </button>
        <button
          className={activeSelector === 'focus' ? 'active' : ''}
          onClick={() => setActiveSelector('focus')}
        >
          :focus
        </button>
      </div>

      <div className="style-controls">
        {/* All style editors work on currentStyles */}
        <ColorEditor
          label="Background Color"
          value={currentStyles.backgroundColor || 'transparent'}
          onChange={(color) => updateStyles({ backgroundColor: color })}
        />
        {/* ... more controls */}
      </div>
    </div>
  );
}
```

**Validation:**

- [ ] All style controls update component
- [ ] Changes reflect immediately in canvas
- [ ] Undo/redo works
- [ ] Pseudo-selectors work
- [ ] Color picker works
- [ ] Typography controls work
- [ ] Spacing editor works

### 4.3 Style Compilation & Injection

**Tasks:**

- [ ] Build CSS string generator from styles object
- [ ] Handle pseudo-selectors
- [ ] Handle pseudo-elements (::before, ::after)
- [ ] Compile breakpoint-specific styles
- [ ] Inject compiled CSS into VirtualWindow
- [ ] Optimize re-injection (only changed components)

**Style Compiler Implementation:**

```typescript
function objectToCss(obj: CSSProperties): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join("\n  ");
}

function compileComponentStyles(component: ComponentInstance): string {
  const className = component.className;
  let css = "";

  // Base styles
  css += `.${className} {\n  ${objectToCss(component.styles.base)}\n}\n\n`;

  // Pseudo-selectors
  if (component.styles.hover) {
    css += `.${className}:hover {\n  ${objectToCss(component.styles.hover)}\n}\n\n`;
  }

  if (component.styles.active) {
    css += `.${className}:active {\n  ${objectToCss(component.styles.active)}\n}\n\n`;
  }

  if (component.styles.focus) {
    css += `.${className}:focus {\n  ${objectToCss(component.styles.focus)}\n}\n\n`;
  }

  // Pseudo-elements
  if (component.styles.before) {
    css += `.${className}::before {\n  content: "";\n  ${objectToCss(component.styles.before)}\n}\n\n`;
  }

  if (component.styles.after) {
    css += `.${className}::after {\n  content: "";\n  ${objectToCss(component.styles.after)}\n}\n\n`;
  }

  return css;
}

function compileAllStyles(components: ComponentInstance[]): string {
  return components.map(compileComponentStyles).join("\n");
}

// Hook to inject styles
function useStyleInjection() {
  const canvasRef = usePageBuilder((state) => state.canvasRef);
  const components = usePageBuilder((state) => state.components);
  const pageStyles = usePageBuilder((state) => state.pageStyles);

  useEffect(() => {
    if (!canvasRef.current) return;

    const componentStyles = compileAllStyles(components);
    const fullStyles = `
      /* Global page styles */
      ${pageStyles}
      
      /* Component styles */
      ${componentStyles}
    `;

    canvasRef.current.addGlobalStyle(fullStyles);
  }, [canvasRef, components, pageStyles]);
}
```

**Validation:**

- [ ] Styles compile to valid CSS
- [ ] Pseudo-selectors work in preview
- [ ] Pseudo-elements render
- [ ] Style updates are immediate
- [ ] No CSS syntax errors

### 4.4 Property Editor (Component-specific props)

**Tasks:**

- [ ] Build property schema system
- [ ] Create dynamic form based on schema
- [ ] Implement property controls (text, number, select, etc.)
- [ ] Handle nested props
- [ ] Validate prop values

**Property Schema:**

```typescript
interface PropertySchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'color' | 'image';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  validation?: (value: any) => boolean;
}

// Example for Button component
const buttonPropertySchema: PropertySchema[] = [
  {
    key: 'content',
    label: 'Button Text',
    type: 'text',
    defaultValue: 'Click Me',
  },
  {
    key: 'variant',
    label: 'Variant',
    type: 'select',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
    ],
    defaultValue: 'primary',
  },
  {
    key: 'disabled',
    label: 'Disabled',
    type: 'checkbox',
    defaultValue: false,
  },
];

// Property editor component
function PropertyEditor({ component }: { component: ComponentInstance }) {
  const definition = componentRegistry[component.type];
  const updateComponent = usePageBuilder(state => state.updateComponent);

  if (!definition.schema) {
    return <p>No editable properties</p>;
  }

  const handlePropChange = (key: string, value: any) => {
    updateComponent(component.id, {
      props: {
        ...component.props,
        [key]: value,
      },
    });
  };

  return (
    <div className="property-editor">
      {definition.schema.map(prop => (
        <PropertyControl
          key={prop.key}
          schema={prop}
          value={component.props[prop.key] ?? prop.defaultValue}
          onChange={(value) => handlePropChange(prop.key, value)}
        />
      ))}
    </div>
  );
}

function PropertyControl({ schema, value, onChange }: {
  schema: PropertySchema;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (schema.type) {
    case 'text':
      return (
        <div className="property-control">
          <label>{schema.label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case 'number':
      return (
        <div className="property-control">
          <label>{schema.label}</label>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );

    case 'select':
      return (
        <div className="property-control">
          <label>{schema.label}</label>
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {schema.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'checkbox':
      return (
        <div className="property-control">
          <label>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
            />
            {schema.label}
          </label>
        </div>
      );

    case 'color':
      return (
        <ColorEditor
          label={schema.label}
          value={value}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}
```

**Validation:**

- [ ] Properties update component
- [ ] All control types work
- [ ] Validation works
- [ ] Changes immediate
- [ ] Undo/redo works

### Phase 4 Summary & Sign-off

**Deliverables:**

1. Complete properties panel UI
2. Full style editor with visual controls
3. Pseudo-selector support
4. Style compilation and injection
5. Property editor with schema system
6. All components have editable properties

**Validation:**

- [ ] Can edit styles visually
- [ ] Pseudo-selectors work
- [ ] Component properties editable
- [ ] Styles inject correctly into canvas
- [ ] Changes are immediate
- [ ] Undo/redo works for all edits

---

## PHASE 5: Grid, Snap & Alignment (Week 9)

### 5.1 Grid System

**Reference:** MISSING_FEATURES.md → Section 2: Grid & Snap System

**Tasks:**

- [ ] Implement visual grid overlay
- [ ] Make grid spacing configurable
- [ ] Add snap-to-grid during drag
- [ ] Toggle grid on/off
- [ ] Persist grid settings

**Grid Overlay:**

```typescript
function GridOverlay() {
  const gridEnabled = usePageBuilder(state => state.gridEnabled);
  const gridSize = usePageBuilder(state => state.gridSize);
  const canvasSize = usePageBuilder(state => state.canvasSize);

  if (!gridEnabled) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <pattern
          id="grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0" cy="0" r="1" fill="#d1d5db" opacity="0.5" />
        </pattern>
      </defs>
      <rect
        width={canvasSize.width}
        height={canvasSize.height}
        fill="url(#grid)"
      />
    </svg>
  );
}

// Snap to grid function
function snapToGrid(value: number, gridSize: number, threshold: number = 5): number {
  const remainder = value % gridSize;

  if (remainder < threshold) {
    return value - remainder;
  } else if (remainder > gridSize - threshold) {
    return value + (gridSize - remainder);
  }

  return value;
}

// Integrate with drag system
function useDraggableWithSnap(componentId: string) {
  const snapEnabled = usePageBuilder(state => state.snapEnabled);
  const gridSize = usePageBuilder(state => state.gridSize);

  const handleDragEnd = (event: DragEndEvent) => {
    let { x, y } = calculateLocalPoint(event);

    if (snapEnabled) {
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }

    updateComponent(componentId, { x, y });
  };

  // ...
}
```

**Validation:**

- [ ] Grid overlay displays
- [ ] Grid spacing adjustable
- [ ] Snap to grid works during drag
- [ ] Toggle on/off works
- [ ] Settings persist

### 5.2 Smart Guides (Alignment Helpers)

**Tasks:**

- [ ] Detect alignment with nearby components
- [ ] Show vertical alignment guides
- [ ] Show horizontal alignment guides
- [ ] Show distributed spacing guides
- [ ] Snap to guides during drag

**Smart Guide Detection:**

```typescript
function detectSmartGuides(
  draggedComponent: ComponentInstance,
  allComponents: ComponentInstance[],
  threshold: number = 5
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const others = allComponents.filter(c => c.id !== draggedComponent.id);

  others.forEach(comp => {
    // Left edge alignment
    if (Math.abs(draggedComponent.x - comp.x) < threshold) {
      guides.push({
        type: 'vertical',
        position: comp.x,
        alignmentType: 'left',
        componentIds: [comp.id],
      });
    }

    // Center alignment
    const draggedCenter = draggedComponent.x + draggedComponent.width / 2;
    const compCenter = comp.x + comp.width / 2;
    if (Math.abs(draggedCenter - compCenter) < threshold) {
      guides.push({
        type: 'vertical',
        position: compCenter,
        alignmentType: 'center',
        componentIds: [comp.id],
      });
    }

    // Right edge alignment
    const draggedRight = draggedComponent.x + draggedComponent.width;
    const compRight = comp.x + comp.width;
    if (Math.abs(draggedRight - compRight) < threshold) {
      guides.push({
        type: 'vertical',
        position: compRight,
        alignmentType: 'right',
        componentIds: [comp.id],
      });
    }

    // Repeat for horizontal (top, middle, bottom)
  });

  return guides;
}

// Smart guides visualization
function SmartGuides({ guides }: { guides: SmartGuide[] }) {
  return (
    <>
      {guides.map((guide, idx) => (
        <div
          key={`guide-${idx}`}
          style={{
            position: 'absolute',
            ...(guide.type === 'vertical'
              ? {
                  left: guide.position,
                  top: 0,
                  width: '1px',
                  height: '100%',
                }
              : {
                  left: 0,
                  top: guide.position,
                  width: '100%',
                  height: '1px',
                }),
            backgroundColor: '#f59e0b',
            pointerEvents: 'none',
            zIndex: 10000,
            boxShadow: '0 0 4px rgba(245, 158, 11, 0.5)',
          }}
        />
      ))}
    </>
  );
}
```

**Validation:**

- [ ] Guides appear during drag
- [ ] Align detection accurate
- [ ] Snap to guides works
- [ ] Visual guides clear
- [ ] Performance acceptable

### Phase 5 Summary & Sign-off

**Deliverables:**

1. Grid overlay system
2. Snap-to-grid during drag
3. Smart alignment guides
4. Snap-to-guides during drag
5. Grid configuration UI

**Validation:**

- [ ] Grid displays and toggles
- [ ] Snap to grid works
- [ ] Smart guides detect alignment
- [ ] Snap to guides works
- [ ] Improves design precision

---

## PHASE 6: Layers Panel & Hierarchy (Week 10)

### 6.1 Layers Panel UI

**Tasks:**

- [ ] Build layers panel (bottom or side)
- [ ] Implement tree view
- [ ] Show component hierarchy
- [ ] Expand/collapse nodes
- [ ] Visual indicators (visible, locked)

**Layers Tree Component:**

```typescript
function LayersPanel() {
  const components = usePageBuilder(state => state.components);
  const selectedIds = usePageBuilder(state => state.selectedIds);
  const selectComponents = usePageBuilder(state => state.selectComponents);

  const rootComponents = components.filter(c => !c.parentId);

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h3>Layers</h3>
        <button onClick={() => expandAll()}>Expand All</button>
        <button onClick={() => collapseAll()}>Collapse All</button>
      </div>

      <div className="layers-tree">
        {rootComponents.map(component => (
          <LayerNode
            key={component.id}
            component={component}
            allComponents={components}
            selectedIds={selectedIds}
            onSelect={selectComponents}
          />
        ))}
      </div>
    </div>
  );
}

function LayerNode({ component, allComponents, selectedIds, onSelect }: {
  component: ComponentInstance;
  allComponents: ComponentInstance[];
  selectedIds: Set<string>;
  onSelect: (ids: string[], additive: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = allComponents.filter(c => c.parentId === component.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedIds.has(component.id);

  const handleClick = (e: React.MouseEvent) => {
    const additive = e.metaKey || e.ctrlKey;
    onSelect([component.id], additive);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div className="layer-node">
      <div
        className={`layer-row ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
      >
        {hasChildren && (
          <button onClick={toggleExpand} className="expand-button">
            {expanded ? '▼' : '▶'}
          </button>
        )}

        <span className="layer-icon">{getComponentIcon(component.type)}</span>
        <span className="layer-label">{component.label}</span>

        <div className="layer-actions">
          <button onClick={() => toggleVisibility(component.id)}>
            {component.visible ? '👁️' : '🚫'}
          </button>
          <button onClick={() => toggleLock(component.id)}>
            {component.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="layer-children" style={{ marginLeft: '20px' }}>
          {children.map(child => (
            <LayerNode
              key={child.id}
              component={child}
              allComponents={allComponents}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Validation:**

- [ ] Tree displays all components
- [ ] Hierarchy reflects parent/child
- [ ] Click selects component
- [ ] Expand/collapse works
- [ ] Visible/lock toggles work

### 6.2 Drag-to-Reorder in Layers

**Tasks:**

- [ ] Make layers draggable
- [ ] Show drop preview
- [ ] Update component order/parent
- [ ] Sync with canvas

**Validation:**

- [ ] Can reorder siblings
- [ ] Can reparent components
- [ ] Canvas updates
- [ ] Undo/redo works

### Phase 6 Summary & Sign-off

**Deliverables:**

1. Layers panel with tree view
2. Expand/collapse functionality
3. Visibility and lock controls
4. Drag-to-reorder components
5. Drag-to-reparent components

**Validation:**

- [ ] Layers panel displays hierarchy
- [ ] Can reorder and reparent
- [ ] Visual indicators work
- [ ] Syncs with canvas
- [ ] Undo/redo works

---

## PHASE 7: Responsive Design System (Weeks 11-12)

### 7.1 Breakpoint Management

**Tasks:**

- [ ] Define default breakpoints
- [ ] Build breakpoint editor UI
- [ ] Allow adding custom breakpoints
- [ ] Store breakpoint-specific styles
- [ ] Switch between breakpoints in canvas

**Breakpoint System:**

```typescript
interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  maxWidth?: number;
  width: number;  // Canvas preview width
  height: number; // Canvas preview height
  icon: string;
}

const defaultBreakpoints: Breakpoint[] = [
  {
    id: 'mobile',
    name: 'Mobile',
    minWidth: 0,
    maxWidth: 767,
    width: 375,
    height: 667,
    icon: '📱',
  },
  {
    id: 'tablet',
    name: 'Tablet',
    minWidth: 768,
    maxWidth: 1023,
    width: 768,
    height: 1024,
    icon: '📱',
  },
  {
    id: 'desktop',
    name: 'Desktop',
    minWidth: 1024,
    width: 1200,
    height: 800,
    icon: '🖥️',
  },
];

// Breakpoint switcher in toolbar
function BreakpointSwitcher() {
  const breakpoints = usePageBuilder(state => state.breakpoints);
  const activeBreakpoint = usePageBuilder(state => state.activeBreakpoint);
  const setActiveBreakpoint = usePageBuilder(state => state.setActiveBreakpoint);

  const activeBp = breakpoints.find(bp => bp.id === activeBreakpoint);

  return (
    <div className="breakpoint-switcher">
      {breakpoints.map(bp => (
        <button
          key={bp.id}
          className={bp.id === activeBreakpoint ? 'active' : ''}
          onClick={() => setActiveBreakpoint(bp.id)}
          title={bp.name}
        >
          {bp.icon} {bp.name}
        </button>
      ))}
      <button onClick={() => openBreakpointEditor()}>
        ⚙️ Edit
      </button>
    </div>
  );
}

// Update canvas size when breakpoint changes
function useBreakpointCanvasSync() {
  const activeBreakpoint = usePageBuilder(state => state.activeBreakpoint);
  const breakpoints = usePageBuilder(state => state.breakpoints);
  const setCanvasSize = usePageBuilder(state => state.setCanvasSize);

  useEffect(() => {
    const bp = breakpoints.find(b => b.id === activeBreakpoint);
    if (bp) {
      setCanvasSize({ width: bp.width, height: bp.height });
    }
  }, [activeBreakpoint, breakpoints]);
}
```

**Validation:**

- [ ] Default breakpoints exist
- [ ] Can switch breakpoints
- [ ] Canvas resizes correctly
- [ ] Can add custom breakpoints
- [ ] Can edit/delete breakpoints

### 7.2 Breakpoint-Specific Styles

**Tasks:**

- [ ] Add breakpoint tabs to style editor
- [ ] Store styles per breakpoint
- [ ] Compile breakpoint media queries
- [ ] Show breakpoint indicator in layers
- [ ] Allow copying styles between breakpoints

**Breakpoint Style Editor:**

```typescript
function StyleEditorWithBreakpoints({ component }: { component: ComponentInstance }) {
  const breakpoints = usePageBuilder(state => state.breakpoints);
  const activeBreakpoint = usePageBuilder(state => state.activeBreakpoint);
  const updateComponent = usePageBuilder(state => state.updateComponent);

  const [selectedBp, setSelectedBp] = useState(activeBreakpoint);

  const currentStyles = selectedBp === 'base'
    ? component.styles
    : component.breakpointStyles[selectedBp] || component.styles;

  const handleStyleUpdate = (updates: Partial<ComponentStyles>) => {
    if (selectedBp === 'base') {
      updateComponent(component.id, {
        styles: { ...component.styles, ...updates },
      });
    } else {
      updateComponent(component.id, {
        breakpointStyles: {
          ...component.breakpointStyles,
          [selectedBp]: {
            ...currentStyles,
            ...updates,
          },
        },
      });
    }
  };

  return (
    <div className="style-editor-with-breakpoints">
      <div className="breakpoint-tabs">
        <button
          className={selectedBp === 'base' ? 'active' : ''}
          onClick={() => setSelectedBp('base')}
        >
          Base
        </button>
        {breakpoints.map(bp => (
          <button
            key={bp.id}
            className={selectedBp === bp.id ? 'active' : ''}
            onClick={() => setSelectedBp(bp.id)}
          >
            {bp.icon} {bp.name}
          </button>
        ))}
      </div>

      <div className="style-controls">
        {/* All style editors work on currentStyles */}
        <StyleEditor styles={currentStyles} onUpdate={handleStyleUpdate} />
      </div>

      <div className="breakpoint-actions">
        <button onClick={() => copyFromBase()}>
          Copy from Base
        </button>
        <button onClick={() => resetBreakpointStyles()}>
          Reset to Base
        </button>
      </div>
    </div>
  );
}

// Updated style compiler with breakpoints
function compileComponentStyles(
  component: ComponentInstance,
  breakpoints: Breakpoint[]
): string {
  let css = '';

  // Base styles (no media query)
  css += `.${component.className} {\n  ${objectToCss(component.styles.base)}\n}\n\n`;

  // Pseudo-selectors for base
  // ...

  // Breakpoint styles
  Object.entries(component.breakpointStyles).forEach(([bpId, styles]) => {
    const bp = breakpoints.find(b => b.id === bpId);
    if (!bp) return;

    const mediaQuery = bp.maxWidth
      ? `@media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px)`
      : `@media (min-width: ${bp.minWidth}px)`;

    css += `${mediaQuery} {\n`;
    css += `  .${component.className} {\n    ${objectToCss(styles.base)}\n  }\n`;

    // Pseudo-selectors for this breakpoint
    if (styles.hover) {
      css += `  .${component.className}:hover {\n    ${objectToCss(styles.hover)}\n  }\n`;
    }
    // ... other pseudo-selectors

    css += `}\n\n`;
  });

  return css;
}
```

**Validation:**

- [ ] Can edit styles per breakpoint
- [ ] Media queries compile correctly
- [ ] Styles apply at correct breakpoints
- [ ] Can copy between breakpoints
- [ ] Breakpoint indicator shows in layers

### 7.3 Responsive Preview Testing

**Tasks:**

- [ ] Implement live preview resize
- [ ] Show current breakpoint in canvas
- [ ] Test media queries in preview
- [ ] Allow manual canvas resize for testing

**Validation:**

- [ ] Can test all breakpoints
- [ ] Media queries work correctly
- [ ] Can resize canvas manually
- [ ] Breakpoint indicator accurate

### Phase 7 Summary & Sign-off

**Deliverables:**

1. Breakpoint management system
2. Default and custom breakpoints
3. Breakpoint switcher UI
4. Breakpoint-specific style editing
5. Media query compilation
6. Responsive preview testing

**Validation:**

- [ ] Can define breakpoints
- [ ] Can edit styles per breakpoint
- [ ] Media queries work in preview
- [ ] Can switch between breakpoints
- [ ] Can test responsive behavior

---

## PHASE 8: Advanced Features & Polish (Weeks 13-14)

### 8.1 Keyboard Shortcuts System

**Reference:** MISSING_FEATURES.md → Section 9: Keyboard Shortcuts

**Tasks:**

- [ ] Define shortcut registry
- [ ] Implement shortcut listener
- [ ] Build shortcut cheatsheet UI
- [ ] Allow customization (future)

**Shortcuts to Implement:**

```typescript
const shortcuts: Shortcut[] = [
  // Selection
  { keys: ["cmd+a", "ctrl+a"], action: "selectAll", description: "Select All" },
  {
    keys: ["escape"],
    action: "clearSelection",
    description: "Clear Selection",
  },
  { keys: ["tab"], action: "selectNext", description: "Select Next" },
  {
    keys: ["shift+tab"],
    action: "selectPrevious",
    description: "Select Previous",
  },

  // Editing
  { keys: ["cmd+c", "ctrl+c"], action: "copy", description: "Copy" },
  { keys: ["cmd+v", "ctrl+v"], action: "paste", description: "Paste" },
  { keys: ["cmd+d", "ctrl+d"], action: "duplicate", description: "Duplicate" },
  { keys: ["delete", "backspace"], action: "delete", description: "Delete" },

  // Undo/Redo
  { keys: ["cmd+z", "ctrl+z"], action: "undo", description: "Undo" },
  {
    keys: ["cmd+shift+z", "ctrl+shift+z"],
    action: "redo",
    description: "Redo",
  },

  // View
  { keys: ["cmd++", "ctrl++"], action: "zoomIn", description: "Zoom In" },
  { keys: ["cmd+-", "ctrl+-"], action: "zoomOut", description: "Zoom Out" },
  { keys: ["cmd+0", "ctrl+0"], action: "resetZoom", description: "Reset Zoom" },
  {
    keys: ["cmd+g", "ctrl+g"],
    action: "toggleGrid",
    description: "Toggle Grid",
  },

  // Navigation
  { keys: ["arrowup"], action: "nudgeUp", description: "Nudge Up" },
  { keys: ["arrowdown"], action: "nudgeDown", description: "Nudge Down" },
  { keys: ["arrowleft"], action: "nudgeLeft", description: "Nudge Left" },
  { keys: ["arrowright"], action: "nudgeRight", description: "Nudge Right" },

  // Layers
  {
    keys: ["cmd+]", "ctrl+]"],
    action: "bringForward",
    description: "Bring Forward",
  },
  {
    keys: ["cmd+[", "ctrl+["],
    action: "sendBackward",
    description: "Send Backward",
  },
  {
    keys: ["cmd+shift+]", "ctrl+shift+]"],
    action: "bringToFront",
    description: "Bring to Front",
  },
  {
    keys: ["cmd+shift+[", "ctrl+shift+["],
    action: "sendToBack",
    description: "Send to Back",
  },
];

function useKeyboardShortcuts() {
  const pageBuilder = usePageBuilder();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault();
          executeAction(shortcut.action, pageBuilder);
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pageBuilder]);
}

function matchesShortcut(e: KeyboardEvent, keys: string[]): boolean {
  return keys.some((keyCombo) => {
    const parts = keyCombo.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const mods = parts.slice(0, -1);

    if (e.key.toLowerCase() !== key) return false;

    const cmdPressed = e.metaKey || e.ctrlKey;
    const shiftPressed = e.shiftKey;
    const altPressed = e.altKey;

    const needsCmd = mods.includes("cmd") || mods.includes("ctrl");
    const needsShift = mods.includes("shift");
    const needsAlt = mods.includes("alt");

    return (
      needsCmd === cmdPressed &&
      needsShift === shiftPressed &&
      needsAlt === altPressed
    );
  });
}

function executeAction(action: string, store: any) {
  switch (action) {
    case "selectAll":
      store.selectAll();
      break;
    case "clearSelection":
      store.clearSelection();
      break;
    case "copy":
      store.copy();
      break;
    case "paste":
      store.paste();
      break;
    case "duplicate":
      store.duplicate();
      break;
    case "delete":
      store.deleteSelected();
      break;
    case "undo":
      store.undo();
      break;
    case "redo":
      store.redo();
      break;
    case "zoomIn":
      store.zoomIn();
      break;
    case "zoomOut":
      store.zoomOut();
      break;
    case "toggleGrid":
      store.toggleGrid();
      break;
    case "nudgeUp":
      store.nudgeSelected(0, -1);
      break;
    // ... etc
  }
}
```

**Validation:**

- [ ] All shortcuts work
- [ ] Shortcuts documented
- [ ] Cheatsheet accessible
- [ ] No conflicts with browser shortcuts

### 8.2 Copy/Paste System

**Reference:** MISSING_FEATURES.md → Section 5: Copy/Paste

**Tasks:**

- [ ] Implement copy to internal clipboard
- [ ] Generate new IDs on paste
- [ ] Offset pasted components
- [ ] Support copying to system clipboard (JSON)
- [ ] Implement duplicate (copy + paste in place)

**Validation:**

- [ ] Copy selected components
- [ ] Paste creates duplicates
- [ ] IDs are unique
- [ ] Paste offsets position
- [ ] Duplicate works

### 8.3 Global Page Styles Editor

**Tasks:**

- [ ] Build global CSS editor
- [ ] Support CSS variables
- [ ] Import fonts (Google Fonts, etc.)
- [ ] Reset/baseline styles
- [ ] Preview global styles in canvas

**Global Styles Editor:**

```typescript
function GlobalStylesEditor() {
  const pageStyles = usePageBuilder(state => state.pageStyles);
  const updatePageStyles = usePageBuilder(state => state.updatePageStyles);

  return (
    <div className="global-styles-editor">
      <h3>Global Page Styles</h3>

      <div className="css-editor">
        <label>CSS</label>
        <textarea
          value={pageStyles}
          onChange={(e) => updatePageStyles(e.target.value)}
          rows={20}
          placeholder={`/* Global styles for this page */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --spacing: 16px;
}

body {
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
}

* {
  box-sizing: border-box;
}
`}
        />
      </div>

      <div className="font-importer">
        <h4>Import Fonts</h4>
        <input
          type="text"
          placeholder="Google Fonts URL"
          onBlur={(e) => importFont(e.target.value)}
        />
      </div>
    </div>
  );
}
```

**Validation:**

- [ ] Can write global CSS
- [ ] Variables work
- [ ] Fonts import correctly
- [ ] Styles apply to canvas
- [ ] Persists in project

### 8.4 Component Templates System

**Tasks:**

- [ ] Allow saving components as templates
- [ ] Build template library
- [ ] Drag templates to canvas
- [ ] Include styles in template
- [ ] Export/import templates

**Template System:**

```typescript
interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  component: ComponentInstance; // Full component tree
  styles: string; // Compiled CSS
}

function saveAsTemplate(component: ComponentInstance) {
  const template: ComponentTemplate = {
    id: uuidv7(),
    name: component.label,
    description: "",
    component: deepClone(component),
    styles: compileComponentStyles(component),
  };

  const templates = usePageBuilder.getState().templates;
  usePageBuilder.setState({ templates: [...templates, template] });
}

function useTemplate(template: ComponentTemplate) {
  const addComponent = usePageBuilder((state) => state.addComponent);

  return () => {
    // Deep clone and regenerate IDs
    const newComponent = regenerateIds(deepClone(template.component));
    addComponent(newComponent);
  };
}
```

**Validation:**

- [ ] Can save components as templates
- [ ] Templates appear in library
- [ ] Can use templates
- [ ] Styles included
- [ ] Can export/import

### 8.5 Animations Editor

**Tasks:**

- [ ] Build animation configuration UI
- [ ] Support GSAP timeline animations
- [ ] Support Framer Motion variants
- [ ] Support scroll-triggered animations
- [ ] Preview animations in canvas

**Animation Config:**

```typescript
interface AnimationConfig {
  id: string;
  type: 'gsap' | 'framer-motion';
  trigger: 'onLoad' | 'onClick' | 'onHover' | 'onScroll';

  // GSAP config
  gsapTimeline?: {
    animations: Array<{
      target: string;  // CSS selector relative to component
      props: any;      // GSAP animation props
      duration: number;
      delay?: number;
      ease?: string;
    }>;
  };

  // Framer Motion config
  framerVariants?: {
    initial: any;
    animate: any;
    exit?: any;
    transition?: any;
  };

  // Scroll trigger config
  scrollTrigger?: {
    start: string;
    end: string;
    scrub?: boolean | number;
  };
}

// Animation editor component
function AnimationEditor({ component }: { component: ComponentInstance }) {
  const [animations, setAnimations] = useState<AnimationConfig[]>(
    component.animations || []
  );

  const addAnimation = () => {
    const newAnim: AnimationConfig = {
      id: uuidv7(),
      type: 'gsap',
      trigger: 'onLoad',
      gsapTimeline: {
        animations: [],
      },
    };
    setAnimations([...animations, newAnim]);
  };

  return (
    <div className="animation-editor">
      <h3>Animations</h3>

      <button onClick={addAnimation}>Add Animation</button>

      {animations.map(anim => (
        <AnimationConfigEditor
          key={anim.id}
          animation={anim}
          onChange={(updated) => {
            setAnimations(animations.map(a =>
              a.id === anim.id ? updated : a
            ));
          }}
        />
      ))}
    </div>
  );
}
```

**Validation:**

- [ ] Can add animations
- [ ] GSAP animations work
- [ ] Framer animations work
- [ ] Scroll triggers work
- [ ] Animations preview in canvas

### Phase 8 Summary & Sign-off

**Deliverables:**

1. Keyboard shortcuts system
2. Copy/paste functionality
3. Global page styles editor
4. Component templates system
5. Animations editor

**Validation:**

- [ ] Shortcuts work and documented
- [ ] Copy/paste operational
- [ ] Global styles editable
- [ ] Templates save and use
- [ ] Animations configurable

---

## PHASE 9: SEO, Metadata & Code Injection (Week 15)

### 9.1 Page Settings Panel

**Tasks:**

- [ ] Build page settings UI
- [ ] Title and description fields
- [ ] Open Graph meta tags
- [ ] Twitter Card meta tags
- [ ] Favicon upload
- [ ] Language settings

**Page Settings Store:**

```typescript
interface PageMetadata {
  // Basic
  title: string;
  description: string;
  keywords: string[];
  author: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;

  // Twitter Card
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Technical
  lang: string;
  charset: string;
  viewport: string;
  favicon?: string;
}

// Add to page builder store
interface PageBuilderState {
  // ... existing state
  metadata: PageMetadata;
  updateMetadata: (updates: Partial<PageMetadata>) => void;
}
```

**Validation:**

- [ ] Can edit all metadata
- [ ] Meta tags display in preview
- [ ] Favicon displays
- [ ] Metadata persists

### 9.2 Custom Code Injection

**Tasks:**

- [ ] Head injection (custom meta, scripts)
- [ ] Body start injection (analytics)
- [ ] Body end injection (scripts)
- [ ] Raw HTML injection
- [ ] Script/style validation

**Code Injection UI:**

```typescript
function CodeInjectionEditor() {
  const headCode = usePageBuilder(state => state.headCode);
  const bodyStartCode = usePageBuilder(state => state.bodyStartCode);
  const bodyEndCode = usePageBuilder(state => state.bodyEndCode);
  const updateCodeInjection = usePageBuilder(state => state.updateCodeInjection);

  return (
    <div className="code-injection-editor">
      <h3>Custom Code</h3>

      <div className="code-section">
        <label>
          <div>Head Code</div>
          <small>Injected in &lt;head&gt; - for meta tags, fonts, etc.</small>
        </label>
        <textarea
          value={headCode}
          onChange={(e) => updateCodeInjection('headCode', e.target.value)}
          rows={8}
          placeholder="<meta name='...'/>"
        />
      </div>

      <div className="code-section">
        <label>
          <div>Body Start Code</div>
          <small>Injected at start of &lt;body&gt; - for analytics, etc.</small>
        </label>
        <textarea
          value={bodyStartCode}
          onChange={(e) => updateCodeInjection('bodyStartCode', e.target.value)}
          rows={8}
          placeholder="<script>...</script>"
        />
      </div>

      <div className="code-section">
        <label>
          <div>Body End Code</div>
          <small>Injected before &lt;/body&gt; - for scripts</small>
        </label>
        <textarea
          value={bodyEndCode}
          onChange={(e) => updateCodeInjection('bodyEndCode', e.target.value)}
          rows={8}
          placeholder="<script src='...'></script>"
        />
      </div>
    </div>
  );
}

// Inject code into VirtualWindow
function useCodeInjection() {
  const canvasRef = usePageBuilder(state => state.canvasRef);
  const headCode = usePageBuilder(state => state.headCode);
  const bodyStartCode = usePageBuilder(state => state.bodyStartCode);
  const bodyEndCode = usePageBuilder(state => state.bodyEndCode);

  useEffect(() => {
    if (!canvasRef.current?.shadowRoot) return;

    const shadow = canvasRef.current.shadowRoot;

    // Inject head code
    if (headCode) {
      const headContainer = shadow.querySelector('.head-injection-container');
      if (headContainer) {
        headContainer.innerHTML = headCode;
      }
    }

    // Inject body start/end code
    const mountNode = shadow.querySelector('.mount-node');
    if (mountNode) {
      // Body start
      let bodyStartContainer = mountNode.querySelector('.body-start-injection');
      if (!bodyStartContainer && bodyStartCode) {
        bodyStartContainer = document.createElement('div');
        bodyStartContainer.className = 'body-start-injection';
        mountNode.insertBefore(bodyStartContainer, mountNode.firstChild);
      }
      if (bodyStartContainer) {
        bodyStartContainer.innerHTML = bodyStartCode;
      }

      // Body end
      let bodyEndContainer = mountNode.querySelector('.body-end-injection');
      if (!bodyEndContainer && bodyEndCode) {
        bodyEndContainer = document.createElement('div');
        bodyEndContainer.className = 'body-end-injection';
        mountNode.appendChild(bodyEndContainer);
      }
      if (bodyEndContainer) {
        bodyEndContainer.innerHTML = bodyEndCode;
      }
    }
  }, [canvasRef, headCode, bodyStartCode, bodyEndCode]);
}
```

**Validation:**

- [ ] Can inject custom code
- [ ] Scripts execute in preview
- [ ] Styles apply
- [ ] Meta tags render
- [ ] Dangerous code prevented (XSS)

### Phase 9 Summary & Sign-off

**Deliverables:**

1. Page settings panel
2. Complete metadata editor
3. Custom code injection system
4. SEO preview

**Validation:**

- [ ] Metadata editable
- [ ] Custom code works
- [ ] SEO tags complete
- [ ] Code injection safe

---

## PHASE 10: Theme System & Variants (Week 16)

### 10.1 Theme Management

**Tasks:**

- [ ] Define theme structure
- [ ] Create theme editor
- [ ] Apply theme globally
- [ ] Support multiple themes
- [ ] Theme switching

**Theme Structure:**

```typescript
interface Theme {
  id: string;
  name: string;

  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };

  // Typography
  typography: {
    fontFamily: {
      sans: string;
      serif: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };

  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };

  // Borders
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };

  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Generate CSS variables from theme
function generateThemeCss(theme: Theme): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-surface: ${theme.colors.surface};
      --color-text: ${theme.colors.text};
      --color-text-muted: ${theme.colors.textMuted};
      --color-border: ${theme.colors.border};
      
      /* Typography */
      --font-sans: ${theme.typography.fontFamily.sans};
      --font-serif: ${theme.typography.fontFamily.serif};
      --font-mono: ${theme.typography.fontFamily.mono};
      
      --font-size-xs: ${theme.typography.fontSize.xs};
      --font-size-sm: ${theme.typography.fontSize.sm};
      --font-size-base: ${theme.typography.fontSize.base};
      --font-size-lg: ${theme.typography.fontSize.lg};
      --font-size-xl: ${theme.typography.fontSize.xl};
      
      /* Spacing */
      --spacing-xs: ${theme.spacing.xs};
      --spacing-sm: ${theme.spacing.sm};
      --spacing-md: ${theme.spacing.md};
      --spacing-lg: ${theme.spacing.lg};
      --spacing-xl: ${theme.spacing.xl};
      
      /* Border Radius */
      --radius-sm: ${theme.borderRadius.sm};
      --radius-md: ${theme.borderRadius.md};
      --radius-lg: ${theme.borderRadius.lg};
      --radius-full: ${theme.borderRadius.full};
      
      /* Shadows */
      --shadow-sm: ${theme.shadows.sm};
      --shadow-md: ${theme.shadows.md};
      --shadow-lg: ${theme.shadows.lg};
    }
  `;
}

// Inject theme into canvas
function useThemeInjection() {
  const theme = usePageBuilder((state) => state.theme);
  const canvasRef = usePageBuilder((state) => state.canvasRef);

  useEffect(() => {
    if (!theme || !canvasRef.current) return;

    const themeCss = generateThemeCss(theme);
    canvasRef.current.addGlobalStyle(themeCss);
  }, [theme, canvasRef]);
}
```

**Validation:**

- [ ] Theme defines all tokens
- [ ] CSS variables generated
- [ ] Theme applies globally
- [ ] Can switch themes
- [ ] Components use theme variables

### 10.2 Component Variants

**Tasks:**

- [ ] Add variant support to components
- [ ] Create variant switcher in properties
- [ ] Pre-define common variants
- [ ] Allow custom variants

**Component Variants:**

```typescript
interface ComponentVariant {
  id: string;
  name: string;
  styles: ComponentStyles;
  props?: Record<string, any>;
}

// Example: Button component with variants
const buttonVariants: ComponentVariant[] = [
  {
    id: 'primary',
    name: 'Primary',
    styles: {
      base: {
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
      },
      hover: {
        backgroundColor: 'var(--color-primary-dark)',
      },
    },
  },
  {
    id: 'secondary',
    name: 'Secondary',
    styles: {
      base: {
        backgroundColor: 'var(--color-secondary)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
      },
      hover: {
        backgroundColor: 'var(--color-secondary-dark)',
      },
    },
  },
  {
    id: 'outline',
    name: 'Outline',
    styles: {
      base: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        padding: '12px 24px',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
      },
      hover: {
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
      },
    },
  },
];

// Variant selector in properties panel
function VariantSelector({ component }: { component: ComponentInstance }) {
  const definition = componentRegistry[component.type];
  const updateComponent = usePageBuilder(state => state.updateComponent);

  if (!definition.variants) return null;

  const currentVariant = component.props.variant || 'primary';

  const applyVariant = (variantId: string) => {
    const variant = definition.variants?.find(v => v.id === variantId);
    if (!variant) return;

    updateComponent(component.id, {
      props: {
        ...component.props,
        variant: variantId,
        ...(variant.props || {}),
      },
      styles: variant.styles,
    });
  };

  return (
    <div className="variant-selector">
      <label>Variant</label>
      <div className="variant-options">
        {definition.variants.map(variant => (
          <button
            key={variant.id}
            className={currentVariant === variant.id ? 'active' : ''}
            onClick={() => applyVariant(variant.id)}
          >
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Validation:**

- [ ] Variants defined for key components
- [ ] Can switch variants
- [ ] Variants use theme tokens
- [ ] Can create custom variants
- [ ] Variants persist

### Phase 10 Summary & Sign-off

**Deliverables:**

1. Theme system with CSS variables
2. Theme editor
3. Component variants system
4. Pre-defined variants for common components

**Validation:**

- [ ] Themes work globally
- [ ] CSS variables accessible
- [ ] Variants switchable
- [ ] Theme affects all components
- [ ] Multiple themes supported

---

## PHASE 11: Accessibility Tools (Week 17)

### 11.1 ARIA Attributes Editor

**Tasks:**

- [ ] Add ARIA fields to properties panel
- [ ] Support common ARIA attributes
- [ ] Validate ARIA usage
- [ ] Show ARIA warnings

**ARIA Editor:**

```typescript
function AriaEditor({ component }: { component: ComponentInstance }) {
  const updateComponent = usePageBuilder(state => state.updateComponent);

  const ariaProps = component.props.aria || {};

  const updateAria = (key: string, value: string) => {
    updateComponent(component.id, {
      props: {
        ...component.props,
        aria: {
          ...ariaProps,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="aria-editor">
      <h4>Accessibility (ARIA)</h4>

      <div className="aria-field">
        <label>aria-label</label>
        <input
          type="text"
          value={ariaProps.label || ''}
          onChange={(e) => updateAria('label', e.target.value)}
          placeholder="Descriptive label"
        />
      </div>

      <div className="aria-field">
        <label>aria-describedby</label>
        <input
          type="text"
          value={ariaProps.describedby || ''}
          onChange={(e) => updateAria('describedby', e.target.value)}
          placeholder="ID of description element"
        />
      </div>

      <div className="aria-field">
        <label>role</label>
        <select
          value={ariaProps.role || ''}
          onChange={(e) => updateAria('role', e.target.value)}
        >
          <option value="">None</option>
          <option value="button">Button</option>
          <option value="navigation">Navigation</option>
          <option value="main">Main</option>
          <option value="complementary">Complementary</option>
          <option value="contentinfo">Content Info</option>
          {/* More roles */}
        </select>
      </div>

      <div className="aria-field">
        <label>aria-hidden</label>
        <input
          type="checkbox"
          checked={ariaProps.hidden || false}
          onChange={(e) => updateAria('hidden', e.target.checked ? 'true' : '')}
        />
      </div>
    </div>
  );
}

// Render ARIA attributes
function renderWithAria(component: ComponentInstance) {
  const aria = component.props.aria || {};

  const ariaAttrs: Record<string, string> = {};
  Object.entries(aria).forEach(([key, value]) => {
    if (value) {
      ariaAttrs[`aria-${key}`] = String(value);
    }
  });

  return ariaAttrs;
}
```

**Validation:**

- [ ] ARIA attributes editable
- [ ] Attributes render correctly
- [ ] Validation works
- [ ] Warnings display

### 11.2 Contrast Checker

**Tasks:**

- [ ] Implement WCAG contrast calculation
- [ ] Check text on background
- [ ] Show pass/fail indicators
- [ ] Suggest fixes

**Contrast Checker:**

```typescript
function ContrastChecker({ component }: { component: ComponentInstance }) {
  const textColor = component.styles.base.color || '#000000';
  const bgColor = component.styles.base.backgroundColor || '#ffffff';

  const contrastRatio = calculateContrast(textColor, bgColor);
  const passesAA = contrastRatio >= 4.5;
  const passesAAA = contrastRatio >= 7;

  return (
    <div className="contrast-checker">
      <h4>Color Contrast</h4>

      <div className="contrast-preview">
        <div
          style={{
            backgroundColor: bgColor,
            color: textColor,
            padding: '16px',
          }}
        >
          Sample Text
        </div>
      </div>

      <div className="contrast-result">
        <p>Contrast Ratio: {contrastRatio.toFixed(2)}:1</p>
        <div className={passesAA ? 'pass' : 'fail'}>
          WCAG AA: {passesAA ? '✓ Pass' : '✗ Fail'}
        </div>
        <div className={passesAAA ? 'pass' : 'fail'}>
          WCAG AAA: {passesAAA ? '✓ Pass' : '✗ Fail'}
        </div>
      </div>

      {!passesAA && (
        <div className="contrast-suggestions">
          <p>Suggestions:</p>
          <button onClick={() => suggestTextColor()}>
            Adjust Text Color
          </button>
          <button onClick={() => suggestBgColor()}>
            Adjust Background Color
          </button>
        </div>
      )}
    </div>
  );
}

function calculateContrast(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
```

**Validation:**

- [ ] Contrast calculation accurate
- [ ] WCAG levels correct
- [ ] Suggestions helpful
- [ ] Works for all components

### Phase 11 Summary & Sign-off

**Deliverables:**

1. ARIA attributes editor
2. Contrast checker
3. Accessibility warnings
4. Accessibility validation

**Validation:**

- [ ] ARIA editable and renders
- [ ] Contrast checker works
- [ ] Warnings show issues
- [ ] Helps create accessible sites

---

## PHASE 12: Version History & A/B Testing (Week 18)

### 12.1 Version History

**Tasks:**

- [ ] Auto-save versions periodically
- [ ] Manual save points
- [ ] Version list UI
- [ ] Restore previous version
- [ ] Compare versions (diff)

**Version System:**

```typescript
interface ProjectVersion {
  id: string;
  timestamp: Date;
  label?: string;  // User-provided label for manual saves
  type: 'auto' | 'manual';
  snapshot: {
    components: ComponentInstance[];
    pageStyles: string;
    metadata: PageMetadata;
    breakpoints: Breakpoint[];
    theme: Theme;
  };
}

// Add to store
interface PageBuilderState {
  // ... existing
  versions: ProjectVersion[];
  saveVersion: (label?: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
}

// Auto-save implementation
function useAutoSave() {
  const saveVersion = usePageBuilder(state => state.saveVersion);
  const components = usePageBuilder(state => state.components);
  const pageStyles = usePageBuilder(state => state.pageStyles);

  useEffect(() => {
    const interval = setInterval(() => {
      saveVersion();  // Auto-save without label
    }, 5 * 60 * 1000);  // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Also save on significant changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveVersion();
    }, 30000);  // 30 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [components, pageStyles]);
}

// Version history UI
function VersionHistory() {
  const versions = usePageBuilder(state => state.versions);
  const restoreVersion = usePageBuilder(state => state.restoreVersion);
  const deleteVersion = usePageBuilder(state => state.deleteVersion);

  return (
    <div className="version-history">
      <h3>Version History</h3>

      <div className="version-list">
        {versions.map(version => (
          <div key={version.id} className="version-item">
            <div className="version-info">
              <span className="version-label">
                {version.label || 'Auto-save'}
              </span>
              <span className="version-time">
                {formatDistanceToNow(version.timestamp)} ago
              </span>
            </div>

            <div className="version-actions">
              <button onClick={() => restoreVersion(version.id)}>
                Restore
              </button>
              {version.type === 'manual' && (
                <button onClick={() => deleteVersion(version.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Validation:**

- [ ] Auto-save works
- [ ] Manual save works
- [ ] Can restore versions
- [ ] Can delete versions
- [ ] Version limit enforced (e.g., max 50)

### 12.2 A/B Testing Setup

**Tasks:**

- [ ] Create variant pages
- [ ] Configure test parameters
- [ ] Split traffic allocation
- [ ] Track conversions (future with backend)

**A/B Testing Structure:**

```typescript
interface ABTest {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'completed';

  variants: Array<{
    id: string;
    name: string;
    trafficAllocation: number;  // Percentage (0-100)
    pageSnapshot: ProjectVersion['snapshot'];
  }>;

  goalMetric: 'clicks' | 'conversions' | 'time-on-page';
  goalTarget?: string;  // Element ID or URL for tracking
}

// A/B test creator
function ABTestCreator() {
  const [test, setTest] = useState<Partial<ABTest>>({
    name: '',
    variants: [
      {
        id: 'control',
        name: 'Control (Original)',
        trafficAllocation: 50,
        pageSnapshot: getCurrentSnapshot(),
      },
    ],
  });

  const addVariant = () => {
    const newVariant = {
      id: uuidv7(),
      name: `Variant ${test.variants.length}`,
      trafficAllocation: 0,
      pageSnapshot: getCurrentSnapshot(),
    };

    setTest({
      ...test,
      variants: [...test.variants, newVariant],
    });
  };

  return (
    <div className="ab-test-creator">
      <h3>Create A/B Test</h3>

      <div className="test-name">
        <label>Test Name</label>
        <input
          type="text"
          value={test.name}
          onChange={(e) => setTest({ ...test, name: e.target.value })}
          placeholder="e.g., Hero CTA Test"
        />
      </div>

      <div className="variants">
        <h4>Variants</h4>
        {test.variants.map((variant, index) => (
          <div key={variant.id} className="variant-config">
            <input
              type="text"
              value={variant.name}
              onChange={(e) => updateVariant(index, 'name', e.target.value)}
            />
            <input
              type="number"
              value={variant.trafficAllocation}
              onChange={(e) => updateVariant(index, 'trafficAllocation', Number(e.target.value))}
              min="0"
              max="100"
            />
            <span>%</span>
            {index > 0 && (
              <button onClick={() => editVariant(index)}>
                Edit Design
              </button>
            )}
          </div>
        ))}

        <button onClick={addVariant}>Add Variant</button>
      </div>

      <div className="goal-config">
        <h4>Conversion Goal</h4>
        <select
          value={test.goalMetric}
          onChange={(e) => setTest({ ...test, goalMetric: e.target.value as any })}
        >
          <option value="clicks">Clicks on Element</option>
          <option value="conversions">Form Conversions</option>
          <option value="time-on-page">Time on Page</option>
        </select>

        {test.goalMetric === 'clicks' && (
          <input
            type="text"
            placeholder="Element ID or selector"
            value={test.goalTarget}
            onChange={(e) => setTest({ ...test, goalTarget: e.target.value })}
          />
        )}
      </div>

      <button onClick={() => saveABTest(test)}>
        Create Test
      </button>
    </div>
  );
}
```

**Validation:**

- [ ] Can create A/B tests
- [ ] Multiple variants supported
- [ ] Traffic allocation works
- [ ] Can edit variant designs
- [ ] Tests save correctly

### Phase 12 Summary & Sign-off

**Deliverables:**

1. Auto-save system
2. Manual version saves
3. Version history UI
4. Version restore
5. A/B test creation
6. Variant management

**Validation:**

- [ ] Versions auto-save
- [ ] Can restore versions
- [ ] A/B tests creatable
- [ ] Variants manageable
- [ ] Ready for backend tracking integration

---

## 🎯 Final Validation Checklist

Before considering the project complete, verify all these work end-to-end:

### Core Functionality

- [ ] Can add components from palette
- [ ] Can select and move components
- [ ] Can resize components
- [ ] Can edit styles visually
- [ ] Can edit component properties
- [ ] Undo/redo works for all operations
- [ ] State persists to localStorage

### Canvas & Preview

- [ ] VirtualWindow renders correctly
- [ ] Zoom controls work
- [ ] Grid and snap work
- [ ] Smart guides appear
- [ ] Styles inject correctly
- [ ] Pseudo-selectors work

### Responsive Design

- [ ] Can define breakpoints
- [ ] Can edit per-breakpoint styles
- [ ] Can switch breakpoints in preview
- [ ] Media queries compile correctly

### Advanced Features

- [ ] Animations work (GSAP + Framer)
- [ ] Parallax container works
- [ ] Theme system applies globally
- [ ] Component variants work
- [ ] Templates save and load

### UI/UX

- [ ] All panels accessible on mobile
- [ ] Keyboard shortcuts work
- [ ] Layers panel shows hierarchy
- [ ] Properties panel updates live
- [ ] No significant lag or jank

### Data & Persistence

- [ ] Projects save to localStorage
- [ ] Can create multiple projects
- [ ] Versions auto-save
- [ ] Can restore versions
- [ ] No data loss on refresh

---

## 📈 Success Metrics

The project is successful when:

1. **Performance**: Canvas interactions at 60fps
2. **Reliability**: No crashes or data loss
3. **Usability**: Non-technical users can build pages
4. **Completeness**: All MVP features implemented
5. **Quality**: Code is maintainable and documented

---

## 🚀 Post-MVP Roadmap

### Phase 13: Backend Integration

- Hono + Bun API setup
- PostgreSQL + Drizzle ORM
- User authentication
- Project API (CRUD)
- Asset upload API

### Phase 14: Export System

- Export to static HTML/CSS/JS
- React component export
- Next.js page export
- Deploy to Vercel/Netlify

### Phase 15: Media Management

- Integrate media management app
- Asset library UI
- Image optimization
- CDN integration

### Phase 16: Collaboration

- Real-time collaboration (WebSockets)
- Presence indicators
- Conflict resolution
- Comments and reviews

### Phase 17: Analytics & Optimization

- Page analytics dashboard
- Performance monitoring
- A/B test results
- SEO scoring

---

## 📝 Documentation Requirements

Throughout development, maintain:

1. **Code Comments**: JSDoc for all public functions
2. **README**: Setup, features, architecture
3. **CHANGELOG**: Version history
4. **API Docs**: If building backend
5. **User Guide**: How to use the builder

---

## 🛡️ Testing Requirements

### Unit Tests

- [ ] Store actions (Zustand)
- [ ] Style compiler
- [ ] Coordinate transformations
- [ ] Utility functions

### Integration Tests

- [ ] Component rendering
- [ ] Drag-and-drop flows
- [ ] Style injection
- [ ] Undo/redo

### E2E Tests (Future)

- [ ] Complete workflows
- [ ] Multi-browser testing
- [ ] Mobile testing

---

## 💡 Development Best Practices

### Code Organization

- One component per file
- Group related files in folders
- Use barrel exports (index.ts)
- Keep files under 500 lines

### Performance

- Memoize expensive computations
- Use React.memo for pure components
- RAF-batch updates during drag
- Virtualize long lists

### TypeScript

- Strict mode enabled
- No `any` types
- Explicit return types
- Interface over type

### State Management

- Single source of truth (Zustand)
- Immer for immutable updates
- Selectors for derived state
- Actions grouped by domain

---

## ⚠️ Critical Reminders

1. **VirtualWindow coordinate transformation**: Always use `toLocalPoint()` for drag-drop
2. **Style injection**: Styles must be compiled and injected, never inline
3. **Performance**: Cache geometry during drag, use RAF batching
4. **Undo/redo**: All mutations must go through Zustand actions
5. **Responsive**: Test on mobile at every phase
6. **Pseudo-selectors**: Use tabs, compile to separate CSS rules
7. **GSAP ScrollTrigger**: Always specify `scroller: container`
8. **Component IDs**: Use uuid v7 for all component instances
9. **Breakpoints**: Store per-breakpoint styles separately
10. **Theme**: Use CSS variables for all theme-able properties

---

## 🎓 Learning Resources

If stuck on any technology:

- **VirtualWindow**: See provided documentation (ARCHITECTURE.md, LLM.md)
- **Zustand**: <https://zustand-demo.pmnd.rs/>
- **dnd-kit**: <https://docs.dndkit.com/>
- **GSAP**: <https://greensock.com/docs/>
- **Framer Motion**: <https://www.framer.com/motion/>
- **lightningcss**: <https://lightningcss.dev/>
- **Drizzle**: <https://orm.drizzle.team/>

---

## ✅ Completion Criteria

This project is complete when:

1. All Phase 1-12 deliverables are implemented and validated
2. Final validation checklist passes
3. Performance metrics met
4. Documentation complete
5. Code is production-ready (no TODOs, no console.logs, no commented code)
6. Works on Chrome, Firefox, Safari
7. Works on desktop, tablet, mobile
8. Can build a complete landing page from scratch using only the UI

---

## 🤝 Development Approach

### Phase Execution Pattern

For each phase:

1. **Plan** (10% of time)
   - Review requirements
   - Design data structures
   - Sketch UI if needed
   - Identify risks

2. **Implement** (70% of time)
   - Build features incrementally
   - Test as you go
   - Commit frequently
   - Document inline

3. **Validate** (15% of time)
   - Run through validation checklist
   - Test edge cases
   - Performance check
   - Fix critical bugs

4. **Document** (5% of time)
   - Update README
   - Write comments
   - Document decisions
   - Update roadmap

### When Stuck

1. Review VirtualWindow documentation
2. Check TROUBLESHOOTING.md
3. Review MISSING_FEATURES.md implementation plans
4. Search official docs for libraries
5. Create minimal reproduction
6. Ask for help with specific, detailed questions

### Version Control

- Commit after each feature
- Use conventional commit messages
- Tag each phase completion
- Keep main branch stable

---

## 📊 Progress Tracking

Create a checklist or project board with:

- [ ] Phase 0 (Planning)
- [ ] Phase 1 (Foundation)
- [ ] Phase 2 (Selection & Interaction)
- [ ] Phase 3 (Component Library)
- [ ] Phase 4 (Properties & Styling)
- [ ] Phase 5 (Grid & Snap)
- [ ] Phase 6 (Layers)
- [ ] Phase 7 (Responsive)
- [ ] Phase 8 (Advanced Features)
- [ ] Phase 9 (SEO & Code Injection)
- [ ] Phase 10 (Theme & Variants)
- [ ] Phase 11 (Accessibility)
- [ ] Phase 12 (Version History & A/B)

---

**This is an ambitious, enterprise-grade project. Take it one phase at a time. Validate thoroughly at each stage. You've got this!** 🚀
