# Phase 1 — Foundation & Core Systems (Plan)

## Objectives

- Solid Bun + TypeScript (strict) foundation respecting existing project setup.
- Lightningcss wired in `bunfig.toml` if required by the Bun build pipeline.
- Zustand store with immer + persist + zundo (undo/redo, localStorage).
- VirtualWindow integration with compiled style injection (no inline style leakage beyond positional/layout essentials).
- Component system foundation: ComponentInstance model, registry with real primitives, recursive renderer.
- Path alias preserved: `@/*` → `./src/*`.

## File/Folder Naming (hyphen-case)

- Store root: `src/stores/page-builder/page-builder.store.ts`
- Slices:
  - `src/stores/page-builder/project.slice.ts`
  - `src/stores/page-builder/component.slice.ts`
  - `src/stores/page-builder/selection.slice.ts`
  - `src/stores/page-builder/canvas.slice.ts`
  - `src/stores/page-builder/style.slice.ts`
  - `src/stores/page-builder/breakpoint.slice.ts`
- Types: `src/types/index.ts` (kept)
- Lib:
  - `src/lib/style-compiler.ts`
  - `src/lib/use-style-injection.ts`
  - `src/lib/component-registry.ts`
- Canvas components:
  - `src/components/canvas/component-renderer.tsx`
  - `src/components/canvas/design-canvas.tsx`
- App entry: `src/App.tsx` (kept)
- Config: `bunfig.toml` (update only if lightningcss wiring is needed)

## Work Breakdown

1. Tooling & Config
   - Verify Bun dev/build scripts run.
   - Confirm tsconfig strict + path alias.
   - Wire lightningcss in `bunfig.toml` if required (minify/autoprefix).

2. Types
   - `src/types/index.ts`: ComponentInstance, ComponentStyles, AnimationConfig (typed), Breakpoint, Project, PageBuilderState slices; Size/Position helpers.

3. Zustand Store
   - `page-builder.store.ts` composes slices + immer + persist + zundo (undo limit 50).
   - Slices implement: add/update/delete components; selection; zoom; canvas size; pageStyles; breakpoints; basic project management.

4. Style Compilation & Injection
   - `style-compiler.ts`: `objectToCss`, `compileComponentStyles` (base + pseudo + breakpoints), `compileAllStyles`.
   - `use-style-injection.ts`: hook to inject compiled CSS + pageStyles into VirtualWindow via `addGlobalStyle`.

5. Component Registry & Renderer
   - `component-registry.ts`: real primitives (box, text, button, link, image, input, textarea, icon) with default props/styles and render fns using className + positional layout.
   - `component-renderer.tsx`: recursive render tree; applies `data-component-id`; absolute positioning from instance.

6. VirtualWindow Integration
   - `design-canvas.tsx`: VirtualWindow ref; pulls components/zoom/pageStyles/breakpoints/canvasSize from store; uses use-style-injection; renders ComponentRenderer with size + scale.

7. App Shell
   - `App.tsx`: seeds a small real component tree to prove wiring; simple zoom control; renders DesignCanvas.

8. Validation
   - Bun dev/build succeeds.
   - Components render in VirtualWindow with injected CSS.
   - Zoom scaling works.
   - Undo/redo works for add/update/delete.
   - State persists (localStorage).

## Risks & Mitigations

- Style leakage: compile/inject all styles via `addGlobalStyle`; restrict inline to position/size where necessary.
- Scale correctness: always divide by scale in coordinate transforms; ensure VirtualWindow scale from store.
- Undo/redo correctness: all mutations go through store actions wrapped by zundo.
- Performance: use selectors to avoid re-render storms; memoize registry lookups.

## Next Step

Please approve this plan. Once approved, I will implement these files with full, production-ready code (no placeholders) following the naming conventions above and validate each step.
