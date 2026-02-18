# VirtualWindow - Missing Features & Implementation Plans

## Executive Summary

While VirtualWindow provides a solid foundation for page builders, several critical features are missing for a production-ready visual editor. This document outlines 10 essential features with detailed implementation plans, performance considerations, and integration strategies.

**Priority Classification:**

- 🔴 **Critical** - Essential for basic page builder functionality
- 🟡 **Important** - Significantly improves UX
- 🟢 **Nice-to-have** - Polish and advanced features

---

## 1. Selection System 🔴 CRITICAL

### Current State

- Individual items can be clicked
- No visual selection indicator
- No multi-select capability
- No keyboard navigation between items

### Requirements

- Single-click select
- Multi-select (Cmd/Ctrl + click)
- Marquee selection (drag box)
- Keyboard navigation (Tab, arrows)
- Visual selection indicators
- Selection context menu
- Clear selection on canvas click

### Implementation Plan

#### A. Data Structure

```typescript
interface SelectionState {
  selectedIds: Set<string>;
  primaryId: string | null; // Last selected (for keyboard actions)
  isMarqueeActive: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
}
```

#### B. Selection Manager Hook

```typescript
function useSelection() {
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    primaryId: null,
    isMarqueeActive: false,
    marqueeStart: null,
    marqueeEnd: null,
  });

  const selectSingle = (id: string, clearPrevious = true) => {
    setSelection((prev) => ({
      ...prev,
      selectedIds: clearPrevious
        ? new Set([id])
        : new Set([...prev.selectedIds, id]),
      primaryId: id,
    }));
  };

  const selectMultiple = (ids: string[]) => {
    setSelection((prev) => ({
      ...prev,
      selectedIds: new Set([...prev.selectedIds, ...ids]),
      primaryId: ids[ids.length - 1] || prev.primaryId,
    }));
  };

  const deselectMultiple = (ids: string[]) => {
    setSelection((prev) => {
      const newSet = new Set(prev.selectedIds);
      ids.forEach((id) => newSet.delete(id));
      return {
        ...prev,
        selectedIds: newSet,
        primaryId: newSet.has(prev.primaryId) ? prev.primaryId : null,
      };
    });
  };

  const clearSelection = () => {
    setSelection({
      selectedIds: new Set(),
      primaryId: null,
      isMarqueeActive: false,
      marqueeStart: null,
      marqueeEnd: null,
    });
  };

  const startMarquee = (x: number, y: number) => {
    setSelection((prev) => ({
      ...prev,
      isMarqueeActive: true,
      marqueeStart: { x, y },
      marqueeEnd: { x, y },
    }));
  };

  const updateMarquee = (x: number, y: number) => {
    setSelection((prev) => ({
      ...prev,
      marqueeEnd: { x, y },
    }));
  };

  const endMarquee = (items: CanvasItem[]) => {
    if (!selection.marqueeStart || !selection.marqueeEnd) {
      setSelection((prev) => ({ ...prev, isMarqueeActive: false }));
      return;
    }

    // Calculate marquee bounds
    const bounds = {
      left: Math.min(selection.marqueeStart.x, selection.marqueeEnd.x),
      right: Math.max(selection.marqueeStart.x, selection.marqueeEnd.x),
      top: Math.min(selection.marqueeStart.y, selection.marqueeEnd.y),
      bottom: Math.max(selection.marqueeStart.y, selection.marqueeEnd.y),
    };

    // Find intersecting items
    const intersecting = items.filter((item) => {
      return (
        item.x >= bounds.left &&
        item.x <= bounds.right &&
        item.y >= bounds.top &&
        item.y <= bounds.bottom
      );
    });

    selectMultiple(intersecting.map((i) => i.id));

    setSelection((prev) => ({
      ...prev,
      isMarqueeActive: false,
      marqueeStart: null,
      marqueeEnd: null,
    }));
  };

  return {
    selection,
    selectSingle,
    selectMultiple,
    deselectMultiple,
    clearSelection,
    startMarquee,
    updateMarquee,
    endMarquee,
    isSelected: (id: string) => selection.selectedIds.has(id),
    getSelectedCount: () => selection.selectedIds.size,
  };
}
```

#### C. Visual Indicators Component

```typescript
interface SelectionIndicatorProps {
  item: CanvasItem;
  isSelected: boolean;
  isPrimary: boolean;
}

const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  item,
  isSelected,
  isPrimary,
}) => {
  if (!isSelected) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x - 4,
    top: item.y - 4,
    width: item.type === "container" ? item.width + 8 : "auto",
    height: item.type === "container" ? item.height + 8 : "auto",
    border: `2px solid ${isPrimary ? "#3b82f6" : "#60a5fa"}`,
    borderRadius: "8px",
    pointerEvents: "none",
    zIndex: 10000,
    animation: isPrimary ? "pulse 2s ease-in-out infinite" : "none",
  };

  return (
    <>
      <div style={style} />
      {/* Resize handles for primary selection */}
      {isPrimary && item.type === "container" && (
        <>
          {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(pos => (
            <div
              key={pos}
              className={`selection-handle selection-handle-${pos}`}
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                backgroundColor: "#3b82f6",
                border: "2px solid #fff",
                borderRadius: "50%",
                cursor: `${pos}-resize`,
                ...getHandlePosition(pos, item),
              }}
            />
          ))}
        </>
      )}
    </>
  );
};
```

#### D. Marquee Selection Component

```typescript
const MarqueeSelection: React.FC<{
  start: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
  isActive: boolean;
}> = ({ start, end, isActive }) => {
  if (!isActive || !start || !end) return null;

  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        border: "2px dashed #3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        pointerEvents: "none",
        zIndex: 10001,
      }}
    />
  );
};
```

#### E. Integration with Canvas

```typescript
const Canvas: React.FC = () => {
  const selection = useSelection();
  const [items, setItems] = useState<CanvasItem[]>([]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Check if clicking empty canvas
    const target = e.target as HTMLElement;
    if (target.classList.contains("canvas-root")) {
      const localPoint = windowRef.current?.toLocalPoint(e.nativeEvent);
      if (localPoint) {
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          // Additive selection - do nothing (will add via marquee)
        } else {
          selection.clearSelection();
        }
        selection.startMarquee(localPoint.x, localPoint.y);
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (selection.selection.isMarqueeActive) {
      const localPoint = windowRef.current?.toLocalPoint(e.nativeEvent);
      if (localPoint) {
        selection.updateMarquee(localPoint.x, localPoint.y);
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (selection.selection.isMarqueeActive) {
      selection.endMarquee(items);
    }
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Toggle selection
      if (selection.isSelected(itemId)) {
        selection.deselectMultiple([itemId]);
      } else {
        selection.selectSingle(itemId, false);
      }
    } else {
      // Single select
      selection.selectSingle(itemId, true);
    }
  };

  return (
    <div
      className="canvas-root"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
    >
      {items.map(item => (
        <React.Fragment key={item.id}>
          <ItemComponent
            item={item}
            onClick={(e) => handleItemClick(e, item.id)}
          />
          <SelectionIndicator
            item={item}
            isSelected={selection.isSelected(item.id)}
            isPrimary={selection.selection.primaryId === item.id}
          />
        </React.Fragment>
      ))}

      <MarqueeSelection
        start={selection.selection.marqueeStart}
        end={selection.selection.marqueeEnd}
        isActive={selection.selection.isMarqueeActive}
      />
    </div>
  );
};
```

#### F. Keyboard Navigation

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selection.selection.primaryId) return;

    switch (e.key) {
      case "Tab":
        e.preventDefault();
        selectNextItem(e.shiftKey ? -1 : 1);
        break;
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        e.preventDefault();
        nudgeSelectedItems(e.key);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        deleteSelectedItems();
        break;
      case "Escape":
        selection.clearSelection();
        break;
      case "a":
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          selection.selectMultiple(items.map((i) => i.id));
        }
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [selection, items]);
```

### Performance Considerations

- Use `Set<string>` for O(1) lookup
- Memoize selection indicators with `React.memo`
- RAF-batch marquee updates
- Virtualize selection indicators for >1000 items

### Testing Strategy

- Unit tests for selection logic
- Integration tests for keyboard navigation
- E2E tests for marquee selection
- Performance tests with 10,000 items

---

## 2. Grid & Snap System 🔴 CRITICAL

### Current State

- Free-form positioning
- No alignment assistance
- No visual guides

### Requirements

- Snap to grid (configurable spacing)
- Smart guides (align with nearby items)
- Distributed spacing detection
- Visual feedback during drag
- Toggle on/off

### Implementation Plan

#### A. Data Structure

```typescript
interface GridConfig {
  enabled: boolean;
  size: number; // Grid spacing in pixels
  snapThreshold: number; // Snap distance tolerance
  showGrid: boolean; // Visual grid overlay
  smartGuidesEnabled: boolean;
}

interface SmartGuide {
  type: "vertical" | "horizontal";
  position: number;
  items: string[]; // IDs of items that created this guide
}
```

#### B. Grid Snapping Logic

```typescript
function snapToGrid(
  value: number,
  gridSize: number,
  threshold: number,
): number {
  const remainder = value % gridSize;

  if (remainder < threshold) {
    return value - remainder;
  } else if (remainder > gridSize - threshold) {
    return value + (gridSize - remainder);
  }

  return value;
}

function snapPoint(
  point: { x: number; y: number },
  config: GridConfig,
): { x: number; y: number } {
  if (!config.enabled) return point;

  return {
    x: snapToGrid(point.x, config.size, config.snapThreshold),
    y: snapToGrid(point.y, config.size, config.snapThreshold),
  };
}
```

#### C. Smart Guides Detection

```typescript
function detectSmartGuides(
  draggedItem: CanvasItem,
  allItems: CanvasItem[],
  threshold: number = 5,
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const otherItems = allItems.filter((i) => i.id !== draggedItem.id);

  // Detect vertical alignment
  otherItems.forEach((item) => {
    // Left edge alignment
    if (Math.abs(draggedItem.x - item.x) < threshold) {
      guides.push({
        type: "vertical",
        position: item.x,
        items: [item.id],
      });
    }

    // Center alignment
    const draggedCenter = draggedItem.x + (draggedItem.width || 0) / 2;
    const itemCenter = item.x + (item.width || 0) / 2;
    if (Math.abs(draggedCenter - itemCenter) < threshold) {
      guides.push({
        type: "vertical",
        position: itemCenter,
        items: [item.id],
      });
    }

    // Right edge alignment
    const draggedRight = draggedItem.x + (draggedItem.width || 0);
    const itemRight = item.x + (item.width || 0);
    if (Math.abs(draggedRight - itemRight) < threshold) {
      guides.push({
        type: "vertical",
        position: itemRight,
        items: [item.id],
      });
    }
  });

  // Detect horizontal alignment (same logic for y-axis)
  otherItems.forEach((item) => {
    if (Math.abs(draggedItem.y - item.y) < threshold) {
      guides.push({
        type: "horizontal",
        position: item.y,
        items: [item.id],
      });
    }

    const draggedMiddle = draggedItem.y + (draggedItem.height || 0) / 2;
    const itemMiddle = item.y + (item.height || 0) / 2;
    if (Math.abs(draggedMiddle - itemMiddle) < threshold) {
      guides.push({
        type: "horizontal",
        position: itemMiddle,
        items: [item.id],
      });
    }

    const draggedBottom = draggedItem.y + (draggedItem.height || 0);
    const itemBottom = item.y + (item.height || 0);
    if (Math.abs(draggedBottom - itemBottom) < threshold) {
      guides.push({
        type: "horizontal",
        position: itemBottom,
        items: [item.id],
      });
    }
  });

  // Deduplicate guides at same position
  const deduped = guides.reduce((acc, guide) => {
    const existing = acc.find(
      (g) => g.type === guide.type && Math.abs(g.position - guide.position) < 1,
    );

    if (existing) {
      existing.items.push(...guide.items);
    } else {
      acc.push(guide);
    }

    return acc;
  }, [] as SmartGuide[]);

  return deduped;
}
```

#### D. Smart Snapping Integration

```typescript
function snapToSmartGuides(
  item: CanvasItem,
  guides: SmartGuide[],
  threshold: number = 5,
): { x: number; y: number } {
  let x = item.x;
  let y = item.y;

  // Find closest vertical guide
  const verticalGuides = guides.filter((g) => g.type === "vertical");
  const closestV = verticalGuides
    .map((g) => ({ guide: g, distance: Math.abs(item.x - g.position) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (closestV && closestV.distance < threshold) {
    x = closestV.guide.position;
  }

  // Find closest horizontal guide
  const horizontalGuides = guides.filter((g) => g.type === "horizontal");
  const closestH = horizontalGuides
    .map((g) => ({ guide: g, distance: Math.abs(item.y - g.position) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (closestH && closestH.distance < threshold) {
    y = closestH.guide.position;
  }

  return { x, y };
}
```

#### E. Visual Grid Overlay

```typescript
const GridOverlay: React.FC<{
  width: number;
  height: number;
  gridSize: number;
  show: boolean;
}> = ({ width, height, gridSize, show }) => {
  if (!show) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
        zIndex: 0,
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
      <rect width={width} height={height} fill="url(#grid)" />
    </svg>
  );
};
```

#### F. Smart Guide Visualization

```typescript
const SmartGuides: React.FC<{
  guides: SmartGuide[];
  canvasWidth: number;
  canvasHeight: number;
}> = ({ guides, canvasWidth, canvasHeight }) => {
  return (
    <>
      {guides.map((guide, idx) => (
        <div
          key={`${guide.type}-${guide.position}-${idx}`}
          style={{
            position: "absolute",
            ...(guide.type === "vertical"
              ? {
                  left: guide.position,
                  top: 0,
                  width: "1px",
                  height: canvasHeight,
                }
              : {
                  left: 0,
                  top: guide.position,
                  width: canvasWidth,
                  height: "1px",
                }),
            backgroundColor: "#f59e0b",
            pointerEvents: "none",
            zIndex: 10000,
            boxShadow: "0 0 4px rgba(245, 158, 11, 0.5)",
          }}
        />
      ))}
    </>
  );
};
```

#### G. Integration with Drag System

```typescript
const handleDragMove = (event: DragMoveEvent) => {
  const pointerEvent = event.activatorEvent as PointerEvent;
  const finalX = pointerEvent.clientX + (event.delta?.x || 0);
  const finalY = pointerEvent.clientY + (event.delta?.y || 0);

  const localPoint = windowRef.current?.toLocalPoint({
    clientX: finalX,
    clientY: finalY,
  } as PointerEvent);

  if (!localPoint) return;

  let snappedPoint = localPoint;

  // Apply grid snapping
  if (gridConfig.enabled) {
    snappedPoint = snapPoint(snappedPoint, gridConfig);
  }

  // Apply smart guides snapping
  if (gridConfig.smartGuidesEnabled && draggedItem) {
    const tempItem = { ...draggedItem, x: snappedPoint.x, y: snappedPoint.y };
    const guides = detectSmartGuides(tempItem, items, 5);
    setActiveGuides(guides);

    const smartSnapped = snapToSmartGuides(tempItem, guides, 5);
    snappedPoint = smartSnapped;
  }

  // Update item position
  setItems((prev) =>
    prev.map((item) =>
      item.id === draggedItem.id
        ? { ...item, x: snappedPoint.x, y: snappedPoint.y }
        : item,
    ),
  );
};
```

### Performance Considerations

- Cache grid pattern SVG
- Use CSS transforms for guides (GPU acceleration)
- RAF-batch guide detection
- Limit smart guide calculation to 50 nearest items

### Testing Strategy

- Unit tests for snap calculations
- Visual regression tests for grid overlay
- Integration tests for smart guides
- Performance tests with 1000 items

---

## 3. Undo/Redo System 🔴 CRITICAL

### Current State

- No history tracking
- No undo/redo capability
- Destructive operations permanent

### Requirements

- Undo/redo with Cmd/Ctrl+Z/Shift+Z
- History stack (max 50 operations)
- Operation grouping (multi-item moves)
- History panel (optional)
- Clear history on major changes

### Implementation Plan

#### A. Command Pattern

```typescript
interface Command {
  id: string;
  type: string;
  timestamp: number;

  execute(): void;
  undo(): void;
  redo(): void;

  // Optional: merge consecutive similar commands
  canMerge?(other: Command): boolean;
  merge?(other: Command): Command;
}

// Example: Move Command
class MoveCommand implements Command {
  id = `move-${Date.now()}`;
  type = "move";
  timestamp = Date.now();

  constructor(
    private itemId: string,
    private oldPos: { x: number; y: number },
    private newPos: { x: number; y: number },
    private setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  ) {}

  execute() {
    this.setItems((prev) =>
      prev.map((item) =>
        item.id === this.itemId
          ? { ...item, x: this.newPos.x, y: this.newPos.y }
          : item,
      ),
    );
  }

  undo() {
    this.setItems((prev) =>
      prev.map((item) =>
        item.id === this.itemId
          ? { ...item, x: this.oldPos.x, y: this.oldPos.y }
          : item,
      ),
    );
  }

  redo() {
    this.execute();
  }

  canMerge(other: Command): boolean {
    return (
      other.type === "move" &&
      (other as MoveCommand).itemId === this.itemId &&
      other.timestamp - this.timestamp < 500 // Merge within 500ms
    );
  }

  merge(other: Command): Command {
    const otherMove = other as MoveCommand;
    return new MoveCommand(
      this.itemId,
      this.oldPos,
      otherMove.newPos,
      this.setItems,
    );
  }
}

// Example: Create Command
class CreateCommand implements Command {
  id = `create-${Date.now()}`;
  type = "create";
  timestamp = Date.now();

  constructor(
    private item: CanvasItem,
    private setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  ) {}

  execute() {
    this.setItems((prev) => [...prev, this.item]);
  }

  undo() {
    this.setItems((prev) => prev.filter((i) => i.id !== this.item.id));
  }

  redo() {
    this.execute();
  }
}

// Example: Delete Command
class DeleteCommand implements Command {
  id = `delete-${Date.now()}`;
  type = "delete";
  timestamp = Date.now();

  constructor(
    private items: CanvasItem[],
    private setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  ) {}

  execute() {
    const idsToDelete = new Set(this.items.map((i) => i.id));
    this.setItems((prev) => prev.filter((i) => !idsToDelete.has(i.id)));
  }

  undo() {
    this.setItems((prev) => [...prev, ...this.items]);
  }

  redo() {
    this.execute();
  }
}

// Example: Batch Command (group multiple commands)
class BatchCommand implements Command {
  id = `batch-${Date.now()}`;
  type = "batch";
  timestamp = Date.now();

  constructor(
    private commands: Command[],
    public label: string = "Batch Operation",
  ) {}

  execute() {
    this.commands.forEach((cmd) => cmd.execute());
  }

  undo() {
    // Undo in reverse order
    [...this.commands].reverse().forEach((cmd) => cmd.undo());
  }

  redo() {
    this.execute();
  }
}
```

#### B. History Manager Hook

```typescript
interface HistoryState {
  past: Command[];
  future: Command[];
  maxSize: number;
}

function useHistory(maxSize: number = 50) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
    maxSize,
  });

  const execute = useCallback((command: Command) => {
    command.execute();

    setHistory((prev) => {
      let newPast = [...prev.past];

      // Try to merge with last command
      if (newPast.length > 0) {
        const last = newPast[newPast.length - 1];
        if (last.canMerge && last.canMerge(command) && last.merge) {
          newPast[newPast.length - 1] = last.merge(command);
          return { ...prev, past: newPast, future: [] };
        }
      }

      // Add new command
      newPast.push(command);

      // Enforce max size
      if (newPast.length > prev.maxSize) {
        newPast = newPast.slice(-prev.maxSize);
      }

      return { ...prev, past: newPast, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const command = newPast.pop()!;

      command.undo();

      return {
        ...prev,
        past: newPast,
        future: [command, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const command = newFuture.shift()!;

      command.redo();

      return {
        ...prev,
        past: [...prev.past, command],
        future: newFuture,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory((prev) => ({ ...prev, past: [], future: [] }));
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    execute,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    history: history.past,
  };
}
```

#### C. Keyboard Shortcuts Integration

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        history.redo();
      } else {
        history.undo();
      }
    }

    if (isMod && e.key === "y") {
      e.preventDefault();
      history.redo();
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [history]);
```

#### D. Usage Example

```typescript
// When creating an item
const handleCreate = (item: CanvasItem) => {
  const command = new CreateCommand(item, setItems);
  history.execute(command);
};

// When moving items
const handleDragEnd = (itemId: string, oldPos: Point, newPos: Point) => {
  const command = new MoveCommand(itemId, oldPos, newPos, setItems);
  history.execute(command);
};

// When moving multiple items (batch)
const handleMoveMultiple = (
  moves: Array<{ id: string; oldPos: Point; newPos: Point }>,
) => {
  const commands = moves.map(
    (m) => new MoveCommand(m.id, m.oldPos, m.newPos, setItems),
  );
  const batch = new BatchCommand(commands, "Move Multiple Items");
  history.execute(batch);
};

// When deleting
const handleDelete = (items: CanvasItem[]) => {
  const command = new DeleteCommand(items, setItems);
  history.execute(command);
};
```

#### E. History Panel Component (Optional)

```typescript
const HistoryPanel: React.FC<{
  history: Command[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}> = ({ history, currentIndex, onJumpTo }) => {
  return (
    <div style={{ padding: "16px", backgroundColor: "#f9fafb" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        History
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {history.map((command, index) => (
          <div
            key={command.id}
            onClick={() => onJumpTo(index)}
            style={{
              padding: "8px 12px",
              backgroundColor: index === currentIndex ? "#dbeafe" : "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: index > currentIndex ? "#9ca3af" : "#111827",
            }}
          >
            {formatCommandLabel(command)}
          </div>
        ))}
      </div>
    </div>
  );
};

function formatCommandLabel(command: Command): string {
  switch (command.type) {
    case "create":
      return "Created item";
    case "delete":
      return "Deleted items";
    case "move":
      return "Moved item";
    case "batch":
      return (command as BatchCommand).label;
    default:
      return command.type;
  }
}
```

### Performance Considerations

- Limit history size (default 50)
- Use structural sharing for state updates
- Debounce rapid commands (merge within 500ms)
- Lazy serialize for persistence

### Testing Strategy

- Unit tests for each command type
- Integration tests for undo/redo flow
- Test command merging logic
- Test batch operations

---

## 4. Performance Optimization for Nested Containers 🟡 IMPORTANT

### Current Issues

- **O(n × depth)** path traversal for each update
- React re-renders entire tree on any change
- Heavy DOM tree with deep nesting
- Drag performance degrades at 5+ levels

### Solution: Flat Data Structure + Normalization

#### A. Normalized Data Structure

```typescript
// Instead of nested tree:
interface Container {
  id: string;
  items: CanvasItem[]; // ❌ Nested
}

// Use flat structure with parent references:
interface NormalizedItem {
  id: string;
  type: "component" | "container";
  parentId: string | null; // null = root
  x: number;
  y: number;
  // ... other props
}

interface NormalizedState {
  items: Record<string, NormalizedItem>;
  rootIds: string[]; // Top-level items
  childrenMap: Record<string, string[]>; // parentId -> childIds
}
```

#### B. Normalization Utilities

```typescript
function normalizeItems(items: CanvasItem[]): NormalizedState {
  const normalized: NormalizedState = {
    items: {},
    rootIds: [],
    childrenMap: {},
  };

  function traverse(items: CanvasItem[], parentId: string | null) {
    items.forEach((item) => {
      const normalizedItem: NormalizedItem = {
        ...item,
        parentId,
        items: undefined, // Remove nested items
      };

      normalized.items[item.id] = normalizedItem;

      if (parentId === null) {
        normalized.rootIds.push(item.id);
      } else {
        if (!normalized.childrenMap[parentId]) {
          normalized.childrenMap[parentId] = [];
        }
        normalized.childrenMap[parentId].push(item.id);
      }

      if (item.type === "container" && item.items) {
        traverse(item.items, item.id);
      }
    });
  }

  traverse(items, null);
  return normalized;
}

function denormalizeItems(state: NormalizedState): CanvasItem[] {
  function buildItem(id: string): CanvasItem {
    const item = state.items[id];
    const childIds = state.childrenMap[id] || [];

    if (item.type === "container") {
      return {
        ...item,
        items: childIds.map(buildItem),
      };
    }

    return item;
  }

  return state.rootIds.map(buildItem);
}
```

#### C. Optimized Operations

```typescript
// O(1) instead of O(depth)
function moveItem(
  state: NormalizedState,
  itemId: string,
  newPos: { x: number; y: number },
): NormalizedState {
  return {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        ...state.items[itemId],
        x: newPos.x,
        y: newPos.y,
      },
    },
  };
}

// O(1) reparenting
function reparentItem(
  state: NormalizedState,
  itemId: string,
  newParentId: string | null,
): NormalizedState {
  const item = state.items[itemId];
  const oldParentId = item.parentId;

  // Update item's parent
  const newItems = {
    ...state.items,
    [itemId]: { ...item, parentId: newParentId },
  };

  // Update old parent's children
  const newChildrenMap = { ...state.childrenMap };
  if (oldParentId !== null) {
    newChildrenMap[oldParentId] = newChildrenMap[oldParentId].filter(
      (id) => id !== itemId,
    );
  } else {
    // Remove from root
    state.rootIds = state.rootIds.filter((id) => id !== itemId);
  }

  // Update new parent's children
  if (newParentId !== null) {
    newChildrenMap[newParentId] = [
      ...(newChildrenMap[newParentId] || []),
      itemId,
    ];
  } else {
    // Add to root
    state.rootIds = [...state.rootIds, itemId];
  }

  return {
    items: newItems,
    rootIds: state.rootIds,
    childrenMap: newChildrenMap,
  };
}

// O(1) deletion
function deleteItem(state: NormalizedState, itemId: string): NormalizedState {
  const item = state.items[itemId];
  const childIds = state.childrenMap[itemId] || [];

  // Recursively delete children
  let newState = state;
  childIds.forEach((childId) => {
    newState = deleteItem(newState, childId);
  });

  // Remove from parent's children
  if (item.parentId !== null) {
    newState.childrenMap[item.parentId] = newState.childrenMap[
      item.parentId
    ].filter((id) => id !== itemId);
  } else {
    newState.rootIds = newState.rootIds.filter((id) => id !== itemId);
  }

  // Remove from items and childrenMap
  const { [itemId]: removed, ...remainingItems } = newState.items;
  const { [itemId]: removedChildren, ...remainingChildren } =
    newState.childrenMap;

  return {
    items: remainingItems,
    rootIds: newState.rootIds,
    childrenMap: remainingChildren,
  };
}
```

#### D. React Integration with Memoization

```typescript
const ContainerView = React.memo<ContainerViewProps>(
  ({ containerId, state }) => {
    const container = state.items[containerId];
    const childIds = state.childrenMap[containerId] || [];

    return (
      <div className="container">
        {childIds.map(childId => {
          const child = state.items[childId];
          if (child.type === "component") {
            return <ComponentView key={childId} itemId={childId} state={state} />;
          } else {
            return <ContainerView key={childId} containerId={childId} state={state} />;
          }
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if this container or its direct children changed
    const prevContainer = prevProps.state.items[prevProps.containerId];
    const nextContainer = nextProps.state.items[nextProps.containerId];

    if (prevContainer !== nextContainer) return false;

    const prevChildIds = prevProps.state.childrenMap[prevProps.containerId] || [];
    const nextChildIds = nextProps.state.childrenMap[nextProps.containerId] || [];

    return (
      prevChildIds.length === nextChildIds.length &&
      prevChildIds.every((id, i) => id === nextChildIds[i])
    );
  }
);
```

### Expected Performance Improvements

- **Move operation**: O(n×depth) → O(1)
- **Delete operation**: O(n×depth) → O(children)
- **Re-render scope**: Entire tree → Affected branch only
- **Memory**: Linear growth instead of exponential

---

## 5. Copy/Paste System 🟡 IMPORTANT

### Current State

- No clipboard support
- No duplication capability

### Requirements

- Copy selected items (Cmd/Ctrl+C)
- Paste at cursor or offset (Cmd/Ctrl+V)
- Duplicate in place (Cmd/Ctrl+D)
- Cross-window paste (future)

### Implementation Plan

```typescript
interface ClipboardState {
  items: CanvasItem[];
  timestamp: number;
  source: "internal" | "external";
}

function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

  const copy = useCallback((items: CanvasItem[]) => {
    // Deep clone to prevent mutations
    const cloned = JSON.parse(JSON.stringify(items));

    setClipboard({
      items: cloned,
      timestamp: Date.now(),
      source: "internal",
    });

    // Also copy to system clipboard as JSON (for cross-window paste)
    try {
      navigator.clipboard.writeText(JSON.stringify(cloned));
    } catch (e) {
      console.warn("Failed to write to system clipboard", e);
    }
  }, []);

  const paste = useCallback(
    (offsetX: number = 20, offsetY: number = 20) => {
      if (!clipboard) return [];

      // Generate new IDs and apply offset
      const newItems = clipboard.items.map((item) => ({
        ...item,
        id: `${item.type}-${Date.now()}-${Math.random()}`,
        x: item.x + offsetX,
        y: item.y + offsetY,
      }));

      return newItems;
    },
    [clipboard],
  );

  const duplicate = useCallback(
    (items: CanvasItem[]) => {
      copy(items);
      return paste();
    },
    [copy, paste],
  );

  return { copy, paste, duplicate, hasClipboard: clipboard !== null };
}

// Keyboard integration
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === "c") {
      e.preventDefault();
      const selectedItems = items.filter((i) => selection.isSelected(i.id));
      clipboard.copy(selectedItems);
    }

    if (isMod && e.key === "v") {
      e.preventDefault();
      const newItems = clipboard.paste();
      setItems((prev) => [...prev, ...newItems]);

      // Auto-select pasted items
      selection.clearSelection();
      selection.selectMultiple(newItems.map((i) => i.id));
    }

    if (isMod && e.key === "d") {
      e.preventDefault();
      const selectedItems = items.filter((i) => selection.isSelected(i.id));
      const duplicated = clipboard.duplicate(selectedItems);
      setItems((prev) => [...prev, ...duplicated]);

      // Auto-select duplicated items
      selection.clearSelection();
      selection.selectMultiple(duplicated.map((i) => i.id));
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [selection, items, clipboard]);
```

---

## 6. Layer/Z-Index Management 🟢 NICE-TO-HAVE

### Requirements

- Visual layer panel
- Reorder layers (bring to front, send to back)
- Lock/hide layers
- Group layers

### Implementation Sketch

```typescript
interface LayerState {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

// Operations
function bringToFront(itemId: string, layers: LayerState[]): LayerState[] {
  const maxZ = Math.max(...layers.map((l) => l.zIndex));
  return layers.map((l) => (l.id === itemId ? { ...l, zIndex: maxZ + 1 } : l));
}

function sendToBack(itemId: string, layers: LayerState[]): LayerState[] {
  const minZ = Math.min(...layers.map((l) => l.zIndex));
  return layers.map((l) => (l.id === itemId ? { ...l, zIndex: minZ - 1 } : l));
}
```

---

## 7. Component Tree/Hierarchy Panel 🟢 NICE-TO-HAVE

### Requirements

- Visual tree representation
- Drag to reorder/reparent
- Click to select
- Expand/collapse containers

### Implementation Sketch

```typescript
const TreeNode: React.FC<{
  item: CanvasItem;
  depth: number;
  onSelect: (id: string) => void;
  onReparent: (itemId: string, newParentId: string | null) => void;
}> = ({ item, depth, onSelect, onReparent }) => {
  const [expanded, setExpanded] = useState(true);
  const isContainer = item.type === "container";
  const hasChildren = isContainer && item.items.length > 0;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        onClick={() => onSelect(item.id)}
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {hasChildren && (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? "▼" : "▶"}
          </button>
        )}
        <span>{item.emoji}</span>
        <span>{item.label}</span>
      </div>

      {expanded && isContainer && (
        <div>
          {item.items.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              onReparent={onReparent}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 8. Collision Detection 🟢 NICE-TO-HAVE

### Requirements

- Prevent overlapping items (optional mode)
- Push items when placing new ones
- Highlight conflicts

### Implementation Sketch

```typescript
function detectCollision(
  item: CanvasItem,
  otherItems: CanvasItem[],
): CanvasItem[] {
  return otherItems.filter((other) => {
    const overlapX =
      item.x < other.x + other.width && item.x + item.width > other.x;

    const overlapY =
      item.y < other.y + other.height && item.y + item.height > other.y;

    return overlapX && overlapY;
  });
}

function resolveCollisions(
  item: CanvasItem,
  collisions: CanvasItem[],
): CanvasItem[] {
  // Push colliding items away
  return collisions.map((collision) => ({
    ...collision,
    x: collision.x + (item.width + 10),
  }));
}
```

---

## 9. Keyboard Shortcuts System 🟡 IMPORTANT

### Requirements

- Centralized shortcut registry
- Visual shortcut cheatsheet
- Customizable bindings
- Conflict detection

### Implementation Plan

```typescript
interface Shortcut {
  key: string;
  modifiers: ("ctrl" | "shift" | "alt" | "meta")[];
  description: string;
  handler: () => void;
  category: string;
}

function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const modifiersMatch =
          (!shortcut.modifiers.includes("ctrl") || e.ctrlKey) &&
          (!shortcut.modifiers.includes("shift") || e.shiftKey) &&
          (!shortcut.modifiers.includes("alt") || e.altKey) &&
          (!shortcut.modifiers.includes("meta") || e.metaKey);

        if (
          modifiersMatch &&
          e.key.toLowerCase() === shortcut.key.toLowerCase()
        ) {
          e.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Usage
const shortcuts: Shortcut[] = [
  {
    key: "z",
    modifiers: ["meta"],
    description: "Undo",
    handler: () => history.undo(),
    category: "Edit",
  },
  {
    key: "z",
    modifiers: ["meta", "shift"],
    description: "Redo",
    handler: () => history.redo(),
    category: "Edit",
  },
  {
    key: "c",
    modifiers: ["meta"],
    description: "Copy",
    handler: () => handleCopy(),
    category: "Edit",
  },
  // ... more shortcuts
];

useShortcuts(shortcuts);
```

---

## 10. Auto-Save & Persistence 🟡 IMPORTANT

### Requirements

- Auto-save to localStorage/backend
- Debounced saves
- Version history
- Restore on load

### Implementation Plan

```typescript
function useAutoSave(items: CanvasItem[], interval: number = 5000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);

      try {
        await saveToBackend({
          items,
          timestamp: new Date().toISOString(),
        });

        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, interval);

    return () => clearTimeout(timer);
  }, [items, interval]);

  return { lastSaved, isSaving };
}

async function saveToBackend(data: any) {
  // Backend integration
  await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function loadFromBackend(): Promise<CanvasItem[]> {
  const response = await fetch("/api/load");
  const data = await response.json();
  return data.items;
}
```

---

## Summary & Priorities

### Critical (Implement First)

1. **Selection System** - Essential for any manipulation
2. **Grid & Snap** - Professional-grade alignment
3. **Undo/Redo** - Users expect this everywhere
4. **Performance Optimization** - Fix nested container issues

### Important (Implement Second)

5. **Copy/Paste** - Standard editing operation
6. **Keyboard Shortcuts** - Power user efficiency
7. **Auto-Save** - Data safety

### Nice-to-Have (Implement Last)

8. **Layer Management** - Polish feature
9. **Component Tree** - Alternative view
10. **Collision Detection** - Optional constraint

### Estimated Implementation Time

- **Critical features**: 2-3 weeks
- **Important features**: 1-2 weeks
- **Nice-to-have features**: 1 week
- **Total**: 4-6 weeks for complete implementation

### Testing Requirements

- Unit tests for all business logic
- Integration tests for user flows
- Performance tests for 1000+ items
- Visual regression tests for UI
- E2E tests for critical paths

---

## Conclusion

These 10 features transform VirtualWindow from a preview component into a complete page builder foundation. The implementation plans are production-ready, with performance considerations, testing strategies, and clear integration points.

The key architectural decision is **normalized state** (#4) - this should be implemented first as it affects all other features. Once the data layer is solid, the UI features can be added incrementally.
