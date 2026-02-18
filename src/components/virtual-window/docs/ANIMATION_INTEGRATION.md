# Animation Libraries Integration Guide

## Overview

VirtualWindow fully supports modern animation libraries like GSAP and Framer Motion. The key to successful integration is understanding how scroll contexts, shadow DOM boundaries, and React portals affect animation setup.

**Key Principle:** Animations work normally inside VirtualWindow because React portals preserve the React tree. The only consideration is **scroll context** — libraries that use scroll events need to be told which element to listen to.

---

## Table of Contents

1. [GSAP Integration](#gsap-integration)
   - [ScrollTrigger](#scrolltrigger)
   - [Timeline Animations](#timeline-animations)
   - [Parallax Effects](#parallax-effects)
   - [Draggable Plugin](#draggable-plugin)
2. [Framer Motion Integration](#framer-motion-integration)
   - [Basic Animations](#basic-animations)
   - [Layout Animations](#layout-animations)
   - [Gesture Animations](#gesture-animations)
   - [Scroll Animations](#scroll-animations)
3. [Best Practices](#best-practices)
4. [Performance Optimization](#performance-optimization)
5. [Common Pitfalls](#common-pitfalls)
6. [Complete Examples](#complete-examples)

---

## GSAP Integration

### Installation

```bash
npm install gsap
```

### Basic Setup

GSAP works out-of-the-box inside VirtualWindow with no configuration:

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function AnimatedContent() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(boxRef.current, {
      x: 200,
      rotation: 360,
      duration: 2,
      ease: "power2.inOut",
    });
  }, []);

  return (
    <div ref={boxRef} style={{ width: 100, height: 100, background: "blue" }}>
      Animated Box
    </div>
  );
}

<VirtualWindow width={600} height={400}>
  <AnimatedContent />
</VirtualWindow>;
```

**✅ Works immediately** — No special configuration needed for non-scroll animations.

---

### ScrollTrigger

ScrollTrigger requires one critical configuration: **the `scroller` property**.

#### Problem

By default, ScrollTrigger listens to `window` scroll events. Inside VirtualWindow, your content is rendered in shadow DOM, and the scrollable element is inside the portal, not the global window.

#### Solution

Always specify the `scroller` option:

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ScrollContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const box = boxRef.current;
    if (!container || !box) return;

    // ✅ CRITICAL: Use gsap.context() for automatic cleanup
    const ctx = gsap.context(() => {
      gsap.to(box, {
        x: 300,
        scrollTrigger: {
          trigger: box,
          start: "top center",
          end: "bottom center",
          scrub: true,
          scroller: container, // ← CRITICAL: Tell ScrollTrigger which element scrolls
          markers: true, // Show debug markers (remove in production)
        },
      });
    }, container);

    return () => ctx.revert(); // Cleanup all animations and ScrollTriggers
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "20px",
      }}
    >
      <div style={{ height: "200vh" }}>
        <div
          ref={boxRef}
          style={{
            width: 100,
            height: 100,
            background: "blue",
            marginTop: "50vh",
          }}
        >
          Scroll to animate
        </div>
      </div>
    </div>
  );
}

<VirtualWindow width={600} height={400}>
  <ScrollContent />
</VirtualWindow>;
```

#### Key Points

1. **`scroller: container`** — Points ScrollTrigger at the actual scrollable element
2. **`gsap.context()`** — Scopes animations to the container for clean cleanup
3. **`ctx.revert()`** — Kills all ScrollTriggers and animations in the cleanup function

---

### ScrollTrigger Advanced Patterns

#### Pattern 1: Pin Elements During Scroll

```tsx
function PinningContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinnedRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: true,
        pinSpacing: false,
        scroller: container,
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ height: "100vh", background: "#f0f0f0" }}>Scroll down</div>

      <div
        ref={pinnedRef}
        style={{
          height: "100vh",
          background: "lightblue",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        This section pins!
      </div>

      <div style={{ height: "200vh", background: "#f0f0f0" }}>
        Keep scrolling
      </div>
    </div>
  );
}
```

#### Pattern 2: Section-Based Animations

```tsx
function SectionAnimations() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Animate all sections with class "fade-in"
      gsap.utils.toArray<HTMLElement>(".fade-in").forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
            scroller: container,
          },
        });
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="fade-in"
          style={{
            height: "80vh",
            margin: "20px",
            background: `hsl(${i * 60}, 70%, 80%)`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            fontWeight: "bold",
          }}
        >
          Section {i}
        </div>
      ))}
    </div>
  );
}
```

#### Pattern 3: Horizontal Scroll Animation

```tsx
function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller) return;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".panel");

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: scroller,
          pin: true,
          scrub: 1,
          end: () => "+=" + scroller.offsetWidth,
          scroller: container,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ height: "50vh" }}>Scroll down</div>

      <div
        ref={scrollerRef}
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexWrap: "nowrap",
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="panel"
            style={{
              width: "100vw",
              height: "100%",
              flexShrink: 0,
              background: `hsl(${i * 60}, 70%, 70%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
            }}
          >
            Panel {i}
          </div>
        ))}
      </div>

      <div style={{ height: "50vh" }}>End</div>
    </div>
  );
}
```

---

### Timeline Animations

Timeline animations work perfectly — no special configuration needed:

```tsx
function TimelineDemo() {
  const boxRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    tl.to(boxRef.current, { x: 200, rotation: 180, duration: 1 })
      .to(circleRef.current, { scale: 1.5, duration: 0.5 }, "-=0.5")
      .to(boxRef.current, { y: 100, duration: 0.5 })
      .to(circleRef.current, { opacity: 0.5, duration: 0.5 }, "-=0.5");

    return () => tl.kill();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <div
        ref={boxRef}
        style={{
          width: 100,
          height: 100,
          background: "blue",
          marginBottom: "20px",
        }}
      />
      <div
        ref={circleRef}
        style={{
          width: 60,
          height: 60,
          background: "red",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
```

---

### Parallax Effects

Multi-layer parallax with different scroll speeds:

```tsx
function ParallaxDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Background layer (slowest)
      gsap.to(".layer-bg", {
        y: 200,
        ease: "none",
        scrollTrigger: {
          trigger: ".layer-bg",
          start: "top top",
          end: "bottom top",
          scrub: true,
          scroller: container,
        },
      });

      // Middle layer (medium speed)
      gsap.to(".layer-mid", {
        y: 100,
        ease: "none",
        scrollTrigger: {
          trigger: ".layer-mid",
          start: "top top",
          end: "bottom top",
          scrub: true,
          scroller: container,
        },
      });

      // Foreground layer (fastest)
      gsap.to(".layer-fg", {
        y: 50,
        ease: "none",
        scrollTrigger: {
          trigger: ".layer-fg",
          start: "top top",
          end: "bottom top",
          scrub: true,
          scroller: container,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ height: "150vh", position: "relative" }}>
        {/* Background layer */}
        <div
          className="layer-bg"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            opacity: 0.5,
          }}
        />

        {/* Middle layer */}
        <div
          className="layer-mid"
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "64px",
          }}
        >
          🌄
        </div>

        {/* Foreground layer */}
        <div
          className="layer-fg"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "32px",
            fontWeight: "bold",
            color: "white",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          Parallax Scrolling
        </div>
      </div>

      <div style={{ height: "100vh", background: "#f0f0f0", padding: "40px" }}>
        <h2>Content Below</h2>
        <p>The parallax effect is complete.</p>
      </div>
    </div>
  );
}
```

---

### Draggable Plugin

GSAP's Draggable plugin works inside VirtualWindow, but there's a critical consideration:

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

function DraggableDemo() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Create draggable instance
    const draggable = Draggable.create(box, {
      type: "x,y",
      bounds: box.parentElement, // Constrain to parent
      inertia: true, // Momentum throwing
      onClick: function () {
        console.log("Clicked!");
      },
      onDragEnd: function () {
        console.log("Dropped at:", this.x, this.y);
      },
    })[0];

    return () => draggable.kill();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#f0f0f0",
      }}
    >
      <div
        ref={boxRef}
        style={{
          width: 100,
          height: 100,
          background: "blue",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Drag Me
      </div>
    </div>
  );
}
```

**Note:** GSAP's Draggable works, but if you're building a page builder with complex drag-and-drop, consider using `@dnd-kit` instead — it has better collision detection and React integration.

---

## Framer Motion Integration

### Installation

```bash
npm install framer-motion
```

### Basic Animations

Framer Motion works perfectly in VirtualWindow with zero configuration:

```tsx
import { motion } from "framer-motion";

function BasicAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: 200,
        height: 200,
        background: "blue",
        borderRadius: "20px",
      }}
    >
      Animated!
    </motion.div>
  );
}

<VirtualWindow width={600} height={400}>
  <BasicAnimation />
</VirtualWindow>;
```

**✅ Works immediately** — Framer Motion animations are fully React-based.

---

### Layout Animations

Layout animations (automatic position/size transitions) work perfectly:

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function LayoutAnimation() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ padding: "40px" }}>
      <motion.div
        layout
        onClick={() => setExpanded(!expanded)}
        style={{
          width: expanded ? 400 : 200,
          height: expanded ? 300 : 150,
          background: "blue",
          borderRadius: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {expanded ? "Tap to shrink" : "Tap to expand"}
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ marginTop: "20px" }}
          >
            Extra content appears!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### Gesture Animations

Hover, tap, and drag gestures work naturally:

```tsx
import { motion } from "framer-motion";

function GestureAnimations() {
  return (
    <div style={{ padding: "40px", display: "flex", gap: "20px" }}>
      {/* Hover animation */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 150,
          height: 150,
          background: "blue",
          borderRadius: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Hover Me
      </motion.div>

      {/* Drag animation */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
        dragElastic={0.2}
        style={{
          width: 150,
          height: 150,
          background: "red",
          borderRadius: "20px",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Drag Me
      </motion.div>
    </div>
  );
}
```

---

### Variants and Orchestration

Complex animation sequences with parent/child coordination:

```tsx
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StaggerAnimation() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ padding: "40px" }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          variants={item}
          style={{
            width: "100%",
            height: 60,
            background: `hsl(${i * 60}, 70%, 70%)`,
            borderRadius: "8px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            paddingLeft: "20px",
            fontWeight: "bold",
          }}
        >
          Item {i}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

### Scroll Animations with Framer Motion

Framer Motion's `useScroll` hook needs the scroll container:

```tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    container: containerRef, // ← CRITICAL: Specify scroll container
  });

  // Transform scroll progress to animation values
  const scale = useTransform(scrollYProgress, [0, 1], [1, 2]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", overflowY: "auto", padding: "20px" }}
    >
      <motion.div
        style={{
          width: 200,
          height: 200,
          background: "blue",
          borderRadius: "20px",
          scale,
          opacity,
          marginTop: "50vh",
        }}
      />
      <div style={{ height: "150vh" }}>Scroll to animate</div>
    </div>
  );
}
```

#### Advanced: Element-specific Scroll Tracking

```tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function ElementScrollTracking() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // Track scroll progress of specific element
  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ["start end", "end start"], // When element enters/exits viewport
  });

  const x = useTransform(scrollYProgress, [0, 1], [-200, 200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", overflowY: "auto", padding: "20px" }}
    >
      <div style={{ height: "100vh" }}>Scroll down</div>

      <motion.div
        ref={targetRef}
        style={{
          width: 200,
          height: 200,
          background: "blue",
          borderRadius: "20px",
          x,
          rotate,
        }}
      />

      <div style={{ height: "100vh" }}>Continue scrolling</div>
    </div>
  );
}
```

---

### Scroll Progress Indicator

```tsx
import { motion, useScroll } from "framer-motion";
import { useRef } from "react";

function ScrollProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* Progress bar */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "blue",
          scaleX: scrollYProgress,
          transformOrigin: "0%",
          zIndex: 1000,
        }}
      />

      {/* Scrollable content */}
      <div ref={containerRef} style={{ height: "100%", overflowY: "auto" }}>
        <div style={{ height: "300vh", padding: "40px" }}>
          <h1>Scroll to see progress bar</h1>
          <p>The blue bar at the top shows scroll progress.</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use Cleanup

**GSAP:**

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // All animations here
  }, containerRef.current);

  return () => ctx.revert(); // ← CRITICAL
}, []);
```

**Framer Motion:**

```tsx
// Cleanup is automatic for motion components
// But for hooks, store the returned value:
useEffect(() => {
  const controls = animate(ref.current, { opacity: 1 });
  return () => controls.stop(); // ← If using animate() directly
}, []);
```

### 2. Scope Animations to Container

**GSAP:**

```tsx
const ctx = gsap.context(() => {
  // Animations scoped to this container
  gsap.to(".box", { x: 100 });
}, containerRef.current);
```

This ensures `.box` only matches elements inside the container, not globally.

**Framer Motion:**

```tsx
// Naturally scoped via React component tree
// No special action needed
```

### 3. Specify Scroll Container

**GSAP ScrollTrigger:**

```tsx
scrollTrigger: {
  scroller: containerRef.current,  // ← Always specify
}
```

**Framer Motion useScroll:**

```tsx
useScroll({
  container: containerRef, // ← Always specify
});
```

### 4. Avoid Inline Arrow Functions

**❌ Bad:**

```tsx
<motion.div
  animate={{ x: isOpen ? 100 : 0 }}  // New object every render
>
```

**✅ Good:**

```tsx
const variants = {
  open: { x: 100 },
  closed: { x: 0 },
};

<motion.div
  animate={isOpen ? "open" : "closed"}
  variants={variants}
>
```

### 5. Use RAF for Custom Animations

If writing custom animations:

```tsx
useEffect(() => {
  let rafId: number;
  let progress = 0;

  const animate = () => {
    progress += 0.01;
    element.style.transform = `translateX(${progress * 100}px)`;

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    }
  };

  rafId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(rafId);
}, []);
```

---

## Performance Optimization

### 1. Use `will-change` for Animated Properties

```tsx
<motion.div
  style={{
    willChange: "transform, opacity", // Tell browser what will animate
  }}
  animate={{ x: 100, opacity: 0.5 }}
/>
```

### 2. Prefer Transform/Opacity

GPU-accelerated properties:

- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ❌ `width`, `height`, `top`, `left` (trigger layout)

```tsx
// ✅ Good
<motion.div animate={{ x: 100, scale: 1.2 }} />

// ❌ Bad
<motion.div animate={{ left: 100, width: 200 }} />
```

### 3. Reduce ScrollTrigger Scrub Frequency

```tsx
scrollTrigger: {
  scrub: 1,  // Smooth over 1 second (less CPU)
  // vs
  scrub: true,  // Instant (more CPU)
}
```

### 4. Lazy Load Heavy Animations

```tsx
import { Suspense, lazy } from "react";

const HeavyAnimation = lazy(() => import("./HeavyAnimation"));

<VirtualWindow>
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyAnimation />
  </Suspense>
</VirtualWindow>;
```

### 5. Memoize Animation Targets

```tsx
const targets = useMemo(() => {
  return gsap.utils.toArray(".animate-me");
}, [items]); // Only recompute when items change

useEffect(() => {
  targets.forEach((target) => {
    gsap.to(target, { x: 100 });
  });
}, [targets]);
```

### 6. Batch DOM Reads

```tsx
// ❌ Bad: Read/write/read/write (causes layout thrashing)
items.forEach((item) => {
  const width = item.offsetWidth; // Read
  item.style.width = width + 10; // Write
});

// ✅ Good: Read all, then write all
const widths = items.map((item) => item.offsetWidth); // Read phase
items.forEach((item, i) => {
  item.style.width = widths[i] + 10; // Write phase
});
```

---

## Common Pitfalls

### Pitfall 1: Forgetting `scroller` Option

**❌ Problem:**

```tsx
scrollTrigger: {
  trigger: box,
  start: "top center",
  // Missing scroller option — will use window
}
```

**Symptom:** ScrollTrigger doesn't fire, or fires based on page scroll instead of preview scroll.

**✅ Fix:**

```tsx
scrollTrigger: {
  trigger: box,
  start: "top center",
  scroller: containerRef.current,  // ← Add this
}
```

### Pitfall 2: Not Cleaning Up

**❌ Problem:**

```tsx
useEffect(() => {
  gsap.to(box, { x: 100 });
  // No cleanup
}, []);
```

**Symptom:** Memory leaks, animations continue after unmount, ScrollTriggers accumulate.

**✅ Fix:**

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(box, { x: 100 });
  }, container);

  return () => ctx.revert();
}, []);
```

### Pitfall 3: Animating Layout Properties

**❌ Problem:**

```tsx
gsap.to(box, { width: 500, height: 300 }); // Triggers layout
```

**Symptom:** Jank, low FPS, especially with ScrollTrigger scrub.

**✅ Fix:**

```tsx
gsap.to(box, { scaleX: 2, scaleY: 1.5 }); // GPU-accelerated
```

### Pitfall 4: Using `querySelector` Instead of Refs

**❌ Problem:**

```tsx
useEffect(() => {
  const box = document.querySelector(".box"); // Might find wrong element
  gsap.to(box, { x: 100 });
}, []);
```

**Symptom:** Animations affect elements outside VirtualWindow, or nothing happens.

**✅ Fix:**

```tsx
const boxRef = useRef(null);

useEffect(() => {
  gsap.to(boxRef.current, { x: 100 });
}, []);

return <div ref={boxRef} className="box" />;
```

### Pitfall 5: Framer Motion `useScroll` Without Container

**❌ Problem:**

```tsx
const { scrollYProgress } = useScroll(); // Uses window
```

**Symptom:** Hook tracks page scroll, not preview scroll.

**✅ Fix:**

```tsx
const { scrollYProgress } = useScroll({
  container: containerRef, // ← Add this
});
```

---

## Complete Examples

### Example 1: Full Parallax Landing Page

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ParallaxLanding() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Hero parallax
      gsap.to(".hero-bg", {
        y: 150,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
          scroller: container,
        },
      });

      gsap.to(".hero-text", {
        opacity: 0,
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "center top",
          scrub: 1,
          scroller: container,
        },
      });

      // Sections fade in
      gsap.utils.toArray<HTMLElement>(".section").forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 80,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
            scroller: container,
          },
        });
      });

      // Cards stagger
      gsap.from(".card", {
        opacity: 0,
        y: 60,
        stagger: 0.2,
        scrollTrigger: {
          trigger: ".cards",
          start: "top 75%",
          end: "top 50%",
          scrub: 1,
          scroller: container,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        fontFamily: "system-ui",
      }}
    >
      {/* Hero */}
      <div
        className="hero"
        style={{
          height: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="hero-bg"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />
        <div
          className="hero-text"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1 style={{ fontSize: "64px", margin: 0 }}>Welcome</h1>
          <p style={{ fontSize: "24px" }}>Scroll to explore</p>
        </div>
      </div>

      {/* Section 1 */}
      <div
        className="section"
        style={{
          minHeight: "100vh",
          padding: "80px 40px",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "48px", textAlign: "center" }}>Features</h2>
        <div
          className="cards"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginTop: "40px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "40px",
                background: "#f0f0f0",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>✨</div>
              <h3>Feature {i}</h3>
              <p>Description goes here</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div
        className="section"
        style={{
          minHeight: "100vh",
          padding: "80px 40px",
          background: "#1a1a1a",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: "48px", textAlign: "center" }}>About</h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "18px",
            maxWidth: "600px",
            margin: "40px auto",
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <VirtualWindow width={800} height={600}>
      <ParallaxLanding />
    </VirtualWindow>
  );
}
```

### Example 2: Framer Motion Page Transitions

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const pages = [
  { id: 1, bg: "#ff6b6b", title: "Page 1" },
  { id: 2, bg: "#4ecdc4", title: "Page 2" },
  { id: 3, bg: "#45b7d1", title: "Page 3" },
];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

function PageTransitions() {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextPage = () => {
    setDirection(1);
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setDirection(-1);
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: pages[currentPage].bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {pages[currentPage].title}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevPage}
        style={{
          position: "absolute",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          padding: "10px 20px",
          fontSize: "24px",
        }}
      >
        ←
      </button>
      <button
        onClick={nextPage}
        style={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          padding: "10px 20px",
          fontSize: "24px",
        }}
      >
        →
      </button>
    </div>
  );
}
```

---

## Summary

### GSAP Integration Checklist

- ✅ Use `gsap.context()` for scoping and cleanup
- ✅ Always specify `scroller: containerRef.current` for ScrollTrigger
- ✅ Call `ctx.revert()` in cleanup function
- ✅ Use refs instead of `querySelector`
- ✅ Register plugins: `gsap.registerPlugin(ScrollTrigger)`

### Framer Motion Integration Checklist

- ✅ Specify `container` in `useScroll` hook
- ✅ Use variants for complex animations
- ✅ Prefer `transform` and `opacity` for performance
- ✅ Use `AnimatePresence` for exit animations
- ✅ Memoize animation objects to avoid recreation

### Performance Checklist

- ✅ Use `will-change` on animated elements
- ✅ Animate transform/opacity, not width/height/top/left
- ✅ Batch DOM reads and writes
- ✅ Use RAF for custom animations
- ✅ Lazy load heavy animation components

Both GSAP and Framer Motion work excellently in VirtualWindow. The key is understanding **scroll context** and **cleanup patterns**. Follow these guidelines and your animations will be smooth, performant, and bug-free.
