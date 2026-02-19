# Phase 0: Planning & Architecture

## 1) System Architecture

### Domains & Boundaries

- **Canvas Layer**
  - VirtualWindow (shadow DOM + portal) as the rendering surface.
  - DesignCanvas renderer for ComponentInstances with className-based styling.
  - Style injection pipeline → compile CSS → addGlobalStyle.
  - Coordinate utilities: toLocalPoint / isPointInside; register/unregister external drag.
- **State Layer (Zustand + immer + persist + temporal)**
  - Slices: project, components, selection, canvas, styles, breakpoints, templates, metadata, versions/AB tests, UI, clipboard, history.
  - Middleware: persist (localStorage), temporal (undo/redo, limit 50), immer.
- **Interaction Layer**
  - dnd-kit for external drag-to-add and internal drag/resize/reorder.
  - Selection (single/multi/marquee), keyboard shortcuts, snap/grid/smart guides.
  - Clipboard (copy/paste/duplicate), undo/redo (command pattern).
- **Styling Layer**
  - Style compiler → CSS string (base + pseudos + pseudo-elements + media queries).
  - Theme → CSS variables; page styles; component styles; optional useCssInJs flag per component.
- **Animation Layer**
  - GSAP + ScrollTrigger (always set scroller to VirtualWindow scroll container).
  - Framer Motion variants; gsap.context for cleanup.
- **Responsive Layer**
  - Breakpoints model; canvas resize per active breakpoint; breakpoint-specific styles; matchMedia tests via VirtualWindow.

### Data Models (key interfaces)

- `ComponentInstance`: id (uuid v7), type, className, parentId, children, x/y/width/height, styles, breakpointStyles, props, content, label, locked, visible, animations?
- `ComponentStyles`: base + hover/active/focus + before/after + useCssInJs?
- `Breakpoint`: id, name, minWidth, maxWidth?, width, height, icon.
- `GridConfig`: enabled, size, snapThreshold, showGrid, smartGuidesEnabled.
- `SelectionState`: selectedIds Set, primaryId, marqueeStart/End, isMarqueeActive.
- `History/Command`: command pattern for undo/redo with merge.
- `Theme`: colors/typography/spacing/radius/shadows → CSS vars.

### Event Flows

- Palette drag → registerExternalDrag(pointerId) → drop hit-test isPointInside → toLocalPoint → create instance → unregister.
- Style edit → compileComponentStyles + theme + pageStyles → addGlobalStyle.
- Selection click/marquee/keyboard → update selection slice → indicators/handles render.
- Drag/resize → toLocalPoint; snap(grid/guides); update store; history command.
- Breakpoint switch → set activeBreakpoint → resize canvas → recompile media queries.
- Animation preview → scroller from VirtualWindow (mount node) → gsap.context cleanup.

## 2) Technical Specifications

### File/Folder Structure (initial)

- `src/components/canvas/` – VirtualWindow wrapper, DesignCanvas, overlays (selection, grid, guides).
- `src/components/panels/` – ComponentsPalette, PropertiesPanel (styles/props/animations), LayersPanel, Toolbar, BreakpointSwitcher, Settings.
- `src/components/ui/` – shared UI (using shadcn/ui), icons (lucide).
- `src/components/primitives/` – base rendered components if needed.
- `src/lib/` – componentRegistry, styleCompiler, drag-utils, selection-utils, grid-guides, breakpoint-utils, animations-utils.
- `src/stores/pageBuilder.ts` – Zustand store with slices & middleware setup.
- `src/types/` – core TS interfaces (ComponentInstance, Styles, Breakpoint, Theme, Command, etc.).
- `src/hooks/` – useSelection, useClipboard, useHistory, useShortcuts, useStyleInjection, useBreakpointCanvasSync.
- `src/docs/` – architecture/wireframes outputs (this doc).

### Naming & Conventions

- IDs: uuid v7.
- Classnames: `comp-${shortId}` per instance.
- Pseudos: hover/active/focus; pseudo-elements: before/after; no inline styles for authored content (only positioning wrappers may use inline for x/y/w/h).
- CSS compilation: camelCase → kebab-case; media queries per breakpoint (min-width, optional max-width).
- Animations: GSAP ScrollTrigger must set scroller to VirtualWindow scroll container; use gsap.context.

### State Patterns

- Zustand create() with temporal(persist(immer())).
- Undo/redo cap 50; merge frequent move commands (≤500ms window).
- Selectors to avoid extra renders; memoization for expensive selectors.
- Persist key: `page-builder-storage`.

### Drag/Selection/Snap

- External drag pattern per PROJECT_REQUIREMENTS: registerExternalDrag, toLocalPoint, isPointInside, unregister.
- Snap: grid size + threshold; smart guides detection (vertical/horizontal edges/centers); visualize guides.
- Marquee selection with local coords; primaryId for keyboard nav.

### Styling & Theme

- Style compiler outputs:
  - Base
  - Pseudos (:hover/:active/:focus)
  - Pseudo-elements (::before/::after with content: "")
  - Breakpoint media queries
- Theme → CSS vars; page styles concatenated; injected via addGlobalStyle.
- Optional useCssInJs only when needed (flagged per component).

### Performance

- Targets: 60fps interactions; selection <5ms; drag update <10ms; style update <50ms; undo/redo <20ms.
- Strategies: RAF batching for drag/marquee; cached rect on drag start; memoized overlays; limit smart-guide calculations to nearby items; virtualize selection indicators if large.

### Testing Plan (Phase 0 scope)

- Define unit targets: selection logic, snap math, style compiler, breakpoint compiler, command/undo.
- Integration targets: drag-to-add flow, style injection correctness, breakpoint switch resizing.

## 3) UI/UX Wireframes (described)

- **Desktop (≥1024px)**: Left Components panel (~280px); Center Canvas (VirtualWindow) with overlays; Right Properties panel (~320px) tabs [Styles | Properties | Animations]; Bottom Layers panel (~200px). Top toolbar: File/Edit/View/Insert, Zoom controls, Device/Breakpoint switcher, Grid toggle.
- **Tablet (768–1023px)**: Top tabbed toolbar (Components | Canvas | Props); active panel full-width; collapsible Layers below; canvas in a tab.
- **Mobile (<768px)**: Canvas primary; swipe left/right to switch Props/Components; bottom toolbar with {+}{✎}{⚙}{☰}; drawers for Layers/Settings/Props; pinch-to-zoom; long-press context; two-finger tap undo / three-finger tap redo.

### Interaction Flows

- Palette drag-to-add → drop creates ComponentInstance at local coords.
- Select: click, cmd/ctrl click for multi, marquee drag, Tab/Shift+Tab cycle, Escape clears.
- Move/Resize: handles on primary selection; Shift keeps aspect; Alt resize from center; snap/grid/guides active.
- Style edit: immediate CSS compile + inject; breakpoint tabs for responsive overrides.
- Shortcuts: cmd/ctrl+Z/Y, cmd/ctrl+C/V/D, cmd/ctrl+A, Delete/Backspace, arrows for nudge, cmd/ctrl + +/-/0 zoom, cmd/ctrl+G toggle grid.

## 4) Risks & Mitigations

- Shadow DOM readiness: gate addGlobalStyle/matchMedia/export calls until ref ready.
- Scroll contexts: always set scroller for ScrollTrigger/useScroll; fetch mount-node from VirtualWindow.
- Performance with deep nesting: normalized data (parentId/children map), memoized selectors; consider virtualization for overlays.
- Undo/redo correctness: command pattern with merge; cap size; throttle history snapshots.
- Style correctness: no inline styles for authored UI; rely on className + injected CSS; validate CSS output.

## 5) Validation Checklist (Phase 0)

- [ ] Architecture doc covers state flow, data schemas, canvas integration, interaction flows.
- [ ] Tech specs: file structure, naming, typing, performance guidelines documented.
- [ ] Wireframes (desktop/tablet/mobile) documented with interaction flows.
- [ ] VirtualWindow integration points defined (drag, style injection, matchMedia, scroller for animations).
- [ ] Component library scope aligned with PROJECT_REQUIREMENTS (primitives/layout/advanced/shadcn).
- [ ] Undo/redo, selection, grid/snap, responsive, and animation patterns referenced from docs.
