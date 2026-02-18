# File structure

```text
vitual-window-react/
├── __tests__/
│   ├── virtual-window/
│   │   ├── createPreviewMatchMedia.test.ts         # Test file for the createPreviewMatchMedia functions
│   │   ├── devicePresets.test.ts                   # Test file for the device presets
│   │   ├── VirtualWindow.drag.test.tsx             # Test Main component — Testing drag
│   │   ├── VirtualWindow.export.test.tsx           # Test Main component — Testing screenshot and export
│   │   ├── VirtualWindow.scale.presets.test.tsx    # Test Main component — Testing size, scale, and preset preview
│   │   └── VirtualWindow.test.tsx                  # Test Main component — Testing main component and features
│   │
│   └── setup.ts
│
└── src/
    └── features/
        └── virtual-window/
            ├── VirtualWindow.tsx                   # Main component — the only file consumers import directly
            ├── demos/
            │   ├── AdvancedDemo.tsx                # Advanced demo
            │   ├── AdvancedFeaturesDemo.tsx        # Advanced demo with advanced features
            │   ├── Demo.tsx                        # Basic demo
            │   ├── DragIntoWindowDemo.tsx          # Drag components into window demo
            │   ├── DragWithSortableDemo.tsx        # Drag into window containing sortable list
            │   ├── GSAPParallaxDemo.tsx            # GSAP Parallax integration demo
            │   ├── NestedContainerDemo.tsx         # Nested container blocks demo
            │   ├── ScaleAndPresetsDemo.tsx         # Window scale with presets demo
            │   └── ScreenshotExportDemo.tsx        # Screenshot export demo
            │
            ├── docs/
            │   ├── ANIMATION_INTEGRATION.md        # Animation library integration documentation
            │   ├── API_REFERENCE.md                # API references documentation
            │   ├── ARCHITECTURE.md                 # Architecture of project documentation
            │   ├── CHANGELOG.md                    # Changes to the project
            │   ├── CONTRIBUTING.md                 # Contribution instructions documentation
            │   ├── EXAMPLES.md                     # Examples documentation
            │   ├── FAQ.md                          # Frequent questions documentation
            │   ├── LLM.md                          # Context and instructions for LLM documentation
            │   ├── MISSING_FEATURES.md             # Missing features documentation
            │   ├── PROJECT_SUMMARY.md              # Project summary documentation
            │   ├── README.md                       # Project descriptor documentation
            │   ├── TEST_DOCUMENTATION.md           # Testing documentation
            │   └── TROUBLESHOOTING.md              # Troubleshooting documentation
            │
            ├── hooks/
            │   └── usePreviewMatchMedia.ts         # React hook wrapping the above
            │
            └── lib/
                ├── createPreviewMatchMedia.ts      # matchMedia emulation engine (no React dependency)
                └── devicePresets.ts                # Static device dimension data
```

All public types are exported from `VirtualWindow.tsx`. Consumers should not import directly from the `lib/` files except for `usePreviewMatchMedia` and, optionally, `devicePresets`.
