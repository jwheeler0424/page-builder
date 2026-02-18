import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { type VirtualWindowRef } from "../VirtualWindow";

// Use useLayoutEffect on the client to get the initial value synchronously
// before paint, falling back to useEffect for SSR environments.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * React hook for using preview-scoped media queries.
 *
 * Evaluates the query against the VirtualWindow's dimensions rather than
 * the browser viewport — enabling accurate responsive-design previewing.
 *
 * The initial `matches` value is resolved synchronously (via useLayoutEffect)
 * to avoid a flash of the wrong layout on first render.
 *
 * @param windowRef - Ref to a mounted VirtualWindow component
 * @param query     - Media query string, e.g. "(min-width: 600px)"
 * @returns         - Boolean indicating whether the query currently matches
 *
 * @example
 * ```tsx
 * const windowRef = useRef<VirtualWindowRef>(null);
 * const isMobile = usePreviewMatchMedia(windowRef, '(max-width: 768px)');
 * const isDark   = usePreviewMatchMedia(windowRef, '(prefers-color-scheme: dark)');
 *
 * return (
 *   <VirtualWindow ref={windowRef} mediaFeatureOverrides={{ 'prefers-color-scheme': 'dark' }}>
 *     {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *   </VirtualWindow>
 * );
 * ```
 */
export function usePreviewMatchMedia(
  windowRef: RefObject<VirtualWindowRef | null>,
  query: string,
): boolean {
  // Initialise from the ref synchronously if it's already available.
  // This avoids a flash where `matches` is `false` even though the preview
  // is wide enough to satisfy the query.
  const getInitialValue = (): boolean => {
    if (!windowRef.current) return false;
    try {
      return windowRef.current.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  const [matches, setMatches] = useState<boolean>(getInitialValue);

  useIsomorphicLayoutEffect(() => {
    const vw = windowRef.current;
    if (!vw) return;

    let mql: ReturnType<VirtualWindowRef["matchMedia"]>;
    try {
      mql = vw.matchMedia(query);
    } catch {
      return;
    }

    // Sync state with the latest value in case the ref became available
    // between the initial render and this effect.
    setMatches(mql.matches);

    const handleChange = (e: { matches: boolean }) => {
      setMatches(e.matches);
    };

    mql.addEventListener("change", handleChange);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, [windowRef, query]);

  return matches;
}
