/**
 * Preview-scoped matchMedia emulation
 *
 * Provides a MediaQueryList-like API that evaluates media queries against
 * the preview container size instead of the global window.
 *
 * Supported features:
 *   ✅ (min-width / max-width / width)
 *   ✅ (min-height / max-height / height)
 *   ✅ (orientation: portrait | landscape)
 *   ✅ (aspect-ratio) with min/max
 *   ✅ (not ...) operator
 *   ✅ (... and ...) compound queries
 *   ✅ comma-separated OR queries
 *   ✅ prefers-color-scheme: light | dark  (via mediaFeatureOverrides)
 *   ✅ prefers-reduced-motion: reduce | no-preference (via mediaFeatureOverrides)
 *   ✅ hover: none | hover  (derived from device category or override)
 *   ✅ pointer: none | coarse | fine (derived from device category or override)
 */

export interface PreviewMediaQueryList {
  media: string;
  matches: boolean;
  /** @internal */
  _update?: (width: number, height: number) => void;
  onchange: ((event: MediaQueryListEvent) => void) | null;
  addEventListener(
    type: "change",
    listener: (event: MediaQueryListEvent) => void,
  ): void;
  removeEventListener(
    type: "change",
    listener: (event: MediaQueryListEvent) => void,
  ): void;
  /** @deprecated Use addEventListener instead */
  addListener(listener: (event: MediaQueryListEvent) => void): void;
  /** @deprecated Use removeEventListener instead */
  removeListener(listener: (event: MediaQueryListEvent) => void): void;
}

interface MediaQueryListEvent {
  matches: boolean;
  media: string;
}

export interface MediaFeatureOverrides {
  "prefers-color-scheme"?: "light" | "dark";
  "prefers-reduced-motion"?: "reduce" | "no-preference";
  "prefers-contrast"?: "more" | "less" | "no-preference";
  hover?: "none" | "hover";
  pointer?: "none" | "coarse" | "fine";
  [key: string]: string | undefined;
}

interface ParsedQuery {
  type: "feature" | "and" | "or" | "not";
  feature?: string;
  operator?: string;
  value?: number | string;
  left?: ParsedQuery;
  right?: ParsedQuery;
  operand?: ParsedQuery;
}

// ---------------------------------------------------------------------------
// Query Parser
// ---------------------------------------------------------------------------

/**
 * Parse a media query string into an AST-like structure.
 * Supports: width, height, orientation, aspect-ratio, hover, pointer,
 * prefers-color-scheme, prefers-reduced-motion, prefers-contrast,
 * plus `and`, `not`, and comma (OR) combinators.
 */
function parseMediaQuery(query: string): ParsedQuery | null {
  const trimmed = query.trim();

  // Strip wrapping "screen and" / "all and" / "screen" type prefix if present
  const stripped = trimmed
    .replace(/^(screen|all|print)\s+and\s+/i, "")
    .replace(/^(screen|all|print)$/i, "");
  const working = stripped || trimmed;

  // Handle comma-separated queries (OR semantics)
  if (working.includes(",")) {
    const parts = splitTopLevel(working, ",").map((q) =>
      parseMediaQuery(q.trim()),
    );
    if (parts.some((p) => p === null)) return null;

    return parts.reduce(
      (acc, part) =>
        ({
          type: "or",
          left: acc,
          right: part,
        }) as ParsedQuery,
    );
  }

  // Handle 'and' operator (must check before individual feature parsing)
  if (/ and /i.test(working)) {
    const parts = splitTopLevel(working, " and ").map((q) =>
      parseMediaQuery(q.trim()),
    );
    if (parts.some((p) => p === null)) return null;

    return parts.reduce(
      (acc, part) =>
        ({
          type: "and",
          left: acc,
          right: part,
        }) as ParsedQuery,
    );
  }

  // Handle 'not' operator
  if (/^not\s+/i.test(working)) {
    const operand = parseMediaQuery(working.slice(4).trim());
    if (!operand) return null;
    return { type: "not", operand };
  }

  // Parse individual feature — must be wrapped in parens: (feature: value)
  const featureMatch = working.match(/^\(([^)]+)\)$/);
  if (!featureMatch) return null;

  const featureContent = featureMatch[1].trim();

  // width / height: (min-width: 600px), (max-height: 900px), (width: 375px)
  const dimensionMatch = featureContent.match(
    /^(min-|max-)?(width|height)\s*:\s*([+-]?\d*\.?\d+)(px|em|rem)?$/i,
  );
  if (dimensionMatch) {
    const [, prefix, dimension, valueStr] = dimensionMatch;
    const operator = prefix
      ? prefix.toLowerCase() === "min-"
        ? "min"
        : "max"
      : "exact";
    const value = parseFloat(valueStr);
    if (isNaN(value)) return null;
    return {
      type: "feature",
      feature: dimension.toLowerCase(),
      operator,
      value,
    };
  }

  // orientation: portrait | landscape
  const orientationMatch = featureContent.match(
    /^orientation\s*:\s*(portrait|landscape)$/i,
  );
  if (orientationMatch) {
    return {
      type: "feature",
      feature: "orientation",
      operator: "exact",
      value: orientationMatch[1].toLowerCase(),
    };
  }

  // aspect-ratio: (min-aspect-ratio: 16/9)
  const aspectMatch = featureContent.match(
    /^(min-|max-)?aspect-ratio\s*:\s*(\d+)\s*\/\s*(\d+)$/i,
  );
  if (aspectMatch) {
    const [, prefix, num, den] = aspectMatch;
    const operator = prefix
      ? prefix.toLowerCase() === "min-"
        ? "min"
        : "max"
      : "exact";
    const value = parseFloat(num) / parseFloat(den);
    return { type: "feature", feature: "aspect-ratio", operator, value };
  }

  // hover: none | hover
  const hoverMatch = featureContent.match(/^hover\s*:\s*(none|hover)$/i);
  if (hoverMatch) {
    return {
      type: "feature",
      feature: "hover",
      operator: "exact",
      value: hoverMatch[1].toLowerCase(),
    };
  }

  // pointer: none | coarse | fine
  const pointerMatch = featureContent.match(
    /^pointer\s*:\s*(none|coarse|fine)$/i,
  );
  if (pointerMatch) {
    return {
      type: "feature",
      feature: "pointer",
      operator: "exact",
      value: pointerMatch[1].toLowerCase(),
    };
  }

  // prefers-color-scheme: light | dark
  const colorSchemeMatch = featureContent.match(
    /^prefers-color-scheme\s*:\s*(light|dark)$/i,
  );
  if (colorSchemeMatch) {
    return {
      type: "feature",
      feature: "prefers-color-scheme",
      operator: "exact",
      value: colorSchemeMatch[1].toLowerCase(),
    };
  }

  // prefers-reduced-motion: reduce | no-preference
  const motionMatch = featureContent.match(
    /^prefers-reduced-motion\s*:\s*(reduce|no-preference)$/i,
  );
  if (motionMatch) {
    return {
      type: "feature",
      feature: "prefers-reduced-motion",
      operator: "exact",
      value: motionMatch[1].toLowerCase(),
    };
  }

  // prefers-contrast: more | less | no-preference
  const contrastMatch = featureContent.match(
    /^prefers-contrast\s*:\s*(more|less|no-preference)$/i,
  );
  if (contrastMatch) {
    return {
      type: "feature",
      feature: "prefers-contrast",
      operator: "exact",
      value: contrastMatch[1].toLowerCase(),
    };
  }

  console.warn(
    `VirtualWindow: Unsupported media query feature: "${featureContent}"`,
  );
  return null;
}

/**
 * Split a string by a delimiter but only at the top level (ignoring content
 * inside parentheses). Handles nested parens correctly.
 */
function splitTopLevel(str: string, delimiter: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;

  while (i < str.length) {
    if (str[i] === "(") {
      depth++;
      current += str[i];
      i++;
    } else if (str[i] === ")") {
      depth--;
      current += str[i];
      i++;
    } else if (depth === 0 && str.startsWith(delimiter, i)) {
      results.push(current);
      current = "";
      i += delimiter.length;
    } else {
      current += str[i];
      i++;
    }
  }

  if (current) results.push(current);
  return results;
}

// ---------------------------------------------------------------------------
// Query Evaluator
// ---------------------------------------------------------------------------

function evaluateQuery(
  query: ParsedQuery,
  width: number,
  height: number,
  overrides: MediaFeatureOverrides,
): boolean {
  switch (query.type) {
    case "and":
      return (
        evaluateQuery(query.left!, width, height, overrides) &&
        evaluateQuery(query.right!, width, height, overrides)
      );

    case "or":
      return (
        evaluateQuery(query.left!, width, height, overrides) ||
        evaluateQuery(query.right!, width, height, overrides)
      );

    case "not":
      return !evaluateQuery(query.operand!, width, height, overrides);

    case "feature": {
      const { feature, operator, value } = query;

      if (feature === "width") {
        if (operator === "min") return width >= (value as number);
        if (operator === "max") return width <= (value as number);
        if (operator === "exact") return width === (value as number);
      }

      if (feature === "height") {
        if (operator === "min") return height >= (value as number);
        if (operator === "max") return height <= (value as number);
        if (operator === "exact") return height === (value as number);
      }

      if (feature === "orientation") {
        const isPortrait = height >= width;
        return value === "portrait" ? isPortrait : !isPortrait;
      }

      if (feature === "aspect-ratio") {
        const currentRatio = width / height;
        if (operator === "min") return currentRatio >= (value as number);
        if (operator === "max") return currentRatio <= (value as number);
        if (operator === "exact")
          return Math.abs(currentRatio - (value as number)) < 0.01;
      }

      // Static / override-driven features
      const staticFeatures = [
        "prefers-color-scheme",
        "prefers-reduced-motion",
        "prefers-contrast",
        "hover",
        "pointer",
      ];

      if (staticFeatures.includes(feature!)) {
        const overrideValue = overrides[feature!];
        if (overrideValue !== undefined) {
          return overrideValue === value;
        }
        // Fall back to the host window's actual preference where meaningful
        if (feature === "prefers-color-scheme") {
          const hostDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          return value === "dark" ? hostDark : !hostDark;
        }
        if (feature === "prefers-reduced-motion") {
          const hostReduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          return value === "reduce" ? hostReduce : !hostReduce;
        }
        if (feature === "prefers-contrast") {
          const hostMore = window.matchMedia(
            "(prefers-contrast: more)",
          ).matches;
          if (value === "more") return hostMore;
          if (value === "no-preference") return !hostMore;
          return false;
        }
        // hover / pointer without override — default to "fine pointer, hover capable" (desktop)
        if (feature === "hover") return value === "hover";
        if (feature === "pointer") return value === "fine";
      }

      return false;
    }

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// MediaQueryList factory
// ---------------------------------------------------------------------------

function createMediaQueryList(
  query: string,
  parsedQuery: ParsedQuery | null,
  getCurrentSize: () => { width: number; height: number },
  overrides: MediaFeatureOverrides,
): PreviewMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let currentMatches = false;

  if (parsedQuery) {
    const size = getCurrentSize();
    currentMatches = evaluateQuery(
      parsedQuery,
      size.width,
      size.height,
      overrides,
    );
  }

  const mql: PreviewMediaQueryList = {
    media: query,
    matches: currentMatches,
    onchange: null,

    addEventListener(
      type: "change",
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (type === "change") listeners.add(listener);
    },

    removeEventListener(
      type: "change",
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (type === "change") listeners.delete(listener);
    },

    addListener(listener: (event: MediaQueryListEvent) => void) {
      this.addEventListener("change", listener);
    },

    removeListener(listener: (event: MediaQueryListEvent) => void) {
      this.removeEventListener("change", listener);
    },
  };

  mql._update = (width: number, height: number) => {
    if (!parsedQuery) return;

    const newMatches = evaluateQuery(parsedQuery, width, height, overrides);

    if (newMatches !== currentMatches) {
      currentMatches = newMatches;
      mql.matches = newMatches;

      const event: MediaQueryListEvent = { matches: newMatches, media: query };

      if (mql.onchange) {
        try {
          mql.onchange(event);
        } catch (err) {
          console.error("Error in media query onchange:", err);
        }
      }

      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error("Error in media query listener:", err);
        }
      });
    }
  };

  return mql;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PreviewMatchMediaInstance {
  matchMedia: (query: string) => PreviewMediaQueryList;
  setOverrides: (overrides: MediaFeatureOverrides) => void;
  destroy: () => void;
}

/**
 * Create a preview-scoped matchMedia implementation.
 *
 * @param hostElement - The element whose dimensions serve as the "viewport"
 * @param initialOverrides - Static feature overrides (prefers-color-scheme etc.)
 */
export function createPreviewMatchMedia(
  hostElement: HTMLElement,
  initialOverrides: MediaFeatureOverrides = {},
): PreviewMatchMediaInstance {
  const queryLists = new Map<string, PreviewMediaQueryList>();
  const parsedQueries = new Map<string, ParsedQuery | null>();
  let overrides: MediaFeatureOverrides = { ...initialOverrides };
  let rafId: number | null = null;

  const getCurrentSize = () => {
    const rect = hostElement.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const updateAllQueries = () => {
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      const { width, height } = getCurrentSize();
      queryLists.forEach((mql) => mql._update?.(width, height));
    });
  };

  const resizeObserver = new ResizeObserver(updateAllQueries);
  resizeObserver.observe(hostElement);

  return {
    matchMedia: (query: string): PreviewMediaQueryList => {
      if (queryLists.has(query)) return queryLists.get(query)!;

      let parsedQuery = parsedQueries.get(query);
      if (parsedQuery === undefined) {
        parsedQuery = parseMediaQuery(query);
        parsedQueries.set(query, parsedQuery ?? null);
      }

      const mql = createMediaQueryList(
        query,
        parsedQuery ?? null,
        getCurrentSize,
        overrides,
      );
      queryLists.set(query, mql);
      return mql;
    },

    /**
     * Update static feature overrides and re-evaluate all registered queries.
     * Use this to simulate dark mode, reduced motion, touch device capabilities, etc.
     */
    setOverrides: (newOverrides: MediaFeatureOverrides) => {
      overrides = { ...newOverrides };
      // Re-evaluate all existing queries with new overrides
      const { width, height } = getCurrentSize();
      queryLists.forEach((mql) => mql._update?.(width, height));
    },

    destroy: () => {
      resizeObserver.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      queryLists.clear();
      parsedQueries.clear();
    },
  };
}
