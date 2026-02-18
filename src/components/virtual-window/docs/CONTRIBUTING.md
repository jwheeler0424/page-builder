# Contributing to VirtualWindow

Thank you for considering contributing to VirtualWindow! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Documentation](#documentation)
9. [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Trolling, insulting comments, or political attacks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Ways to Contribute

- **Bug Reports**: Found a bug? Open an issue
- **Feature Requests**: Have an idea? Propose it in discussions
- **Documentation**: Improve docs, add examples, fix typos
- **Code**: Fix bugs, add features, improve performance
- **Testing**: Add test cases, improve test coverage
- **Design**: Improve UI/UX of demos

### Before You Start

1. **Search existing issues** to avoid duplicates
2. **Read the documentation** (README, ARCHITECTURE, LLM.md)
3. **Check the roadmap** (MISSING_FEATURES.md)
4. **Open a discussion** for major changes before coding

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Code editor (VS Code recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/virtualwindow.git
cd virtualwindow

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck
```

### Project Structure

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

---

## Development Workflow

### Branch Strategy

- `main` - Stable, production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation changes
- `perf/*` - Performance improvements

### Creating a Branch

```bash
# Feature
git checkout -b feature/nested-container-performance

# Bug fix
git checkout -b fix/resize-handle-safari

# Documentation
git checkout -b docs/add-gsap-examples
```

### Making Changes

1. **Create a branch** from `develop`
2. **Make your changes** with clear commits
3. **Add tests** for new features
4. **Update documentation** if needed
5. **Run tests** to ensure nothing breaks
6. **Push and create PR** when ready

### Commit Messages

Follow conventional commits:

```text
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**

```bash
feat(export): add WebP format support

- Add WebP option to ExportImageOptions
- Update html2canvas integration
- Add tests for WebP export

Closes #123
```

```bash
fix(resize): prevent negative dimensions in Safari

- Add Math.max checks in resize handler
- Update bounds enforcement logic
- Add Safari-specific test case

Fixes #456
```

---

## Coding Standards

### TypeScript

- **Use strict mode**: All code must pass strict TypeScript checks
- **Explicit types**: Prefer explicit return types over inference
- **Avoid `any`**: Use `unknown` if type is truly unknown
- **Use interfaces**: For object types and props

**Good:**

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps): JSX.Element {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

**Bad:**

```typescript
function Button(props: any) {  // ❌ any
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### React

- **Functional components**: Use hooks, not class components
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Ref patterns**: Use `useRef` for DOM refs and mutable values
- **Effect cleanup**: Always return cleanup function from `useEffect`

**Good:**

```typescript
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => processData(data), [data]);

  useEffect(() => {
    const listener = () => {};
    document.addEventListener("event", listener);

    return () => document.removeEventListener("event", listener);
  }, []);

  return <div>{processedData}</div>;
});
```

### Code Style

- **Formatting**: Use Prettier (config in `.prettierrc`)
- **Linting**: Use ESLint (config in `.eslintrc`)
- **Line length**: Max 100 characters
- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes for JSX, single for TypeScript

**Format code before committing:**

```bash
npm run format
npm run lint
```

### Naming Conventions

**Variables and functions:**

```typescript
const userName = "John"; // camelCase
const MAX_RETRIES = 3; // UPPER_SNAKE_CASE for constants
```

**Types and interfaces:**

```typescript
interface UserProfile {} // PascalCase
type WindowSize = { width: number; height: number };
```

**Components:**

```typescript
function UserCard() {} // PascalCase
const MemoizedUserCard = React.memo(UserCard);
```

**Files:**

```text
VirtualWindow.tsx                     // PascalCase for components
usePreviewMatchMedia.ts               // camelCase for hooks
devicePresets.ts                      // camelCase for utilities
```

### Comments

- **Document public APIs**: Use JSDoc for exported functions
- **Explain why, not what**: Code should be self-documenting
- **Mark TODOs**: Use `// TODO:` with description
- **Mark breaking changes**: Use `// BREAKING:` in comments

**Good:**

```typescript
/**
 * Converts global viewport coordinates to preview-local coordinates,
 * compensating for scale transformation.
 *
 * @param event - Pointer event with clientX/clientY
 * @returns Preview-local coordinates or null if conversion fails
 */
function toLocalPoint(event: PointerEvent): Point | null {
  // Cache rect to avoid layout thrashing in hot paths
  const rect = this.hostElement.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) / this.scale,
    y: (event.clientY - rect.top) / this.scale,
  };
}
```

**Bad:**

```typescript
// Convert coordinates
function toLocalPoint(event) {
  // ❌ No JSDoc, no types
  // Get the rect
  const rect = this.hostElement.getBoundingClientRect();

  // Calculate x and y
  return {
    x: (event.clientX - rect.left) / this.scale,
    y: (event.clientY - rect.top) / this.scale,
  };
}
```

---

## Testing Guidelines

### Test Structure

- **Unit tests**: Test individual functions and utilities
- **Integration tests**: Test component interactions
- **E2E tests**: Test user workflows (future)

### Writing Tests

```typescript
describe("VirtualWindow", () => {
  describe("resize", () => {
    it("should update size when resize method is called", () => {
      // Arrange
      const ref = createRef<VirtualWindowRef>();
      render(<VirtualWindow ref={ref} width={400} height={600} />);

      // Act
      ref.current?.resize(500, 700);

      // Assert
      expect(ref.current?.getSize()).toEqual({ width: 500, height: 700 });
    });

    it("should enforce min constraints", () => {
      const ref = createRef<VirtualWindowRef>();
      render(
        <VirtualWindow ref={ref} minWidth={200} minHeight={300} />
      );

      // Should clamp to min values
      ref.current?.resize(100, 100);

      const size = ref.current?.getSize();
      expect(size.width).toBeGreaterThanOrEqual(200);
      expect(size.height).toBeGreaterThanOrEqual(300);
    });
  });

  describe("export", () => {
    it("should export as PNG by default", async () => {
      const ref = createRef<VirtualWindowRef>();
      render(<VirtualWindow ref={ref}><div>Test</div></VirtualWindow>);

      const dataUrl = await ref.current?.exportAsImage();

      expect(dataUrl).toMatch(/^data:image\/png/);
    });
  });
});
```

### Test Coverage Goals

- **Core functionality**: 100% coverage
- **Utilities**: 100% coverage
- **Component**: 85%+ coverage
- **Demos**: Not required (examples only)

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Single file
npm test VirtualWindow.test.tsx
```

---

## Pull Request Process

### Before Submitting

1. ✅ Tests pass: `npm test`
2. ✅ Type check passes: `npm run typecheck`
3. ✅ Linting passes: `npm run lint`
4. ✅ Code formatted: `npm run format`
5. ✅ Documentation updated (if needed)
6. ✅ CHANGELOG.md updated (for features/fixes)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How to test these changes

## Checklist

- [ ] Tests pass
- [ ] Types check
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainer
3. **Changes requested** → address feedback
4. **Approved** → merged to `develop`

### After Merge

- PR is merged to `develop`
- Periodically, `develop` → `main` (releases)
- Your contribution is in the next release! 🎉

---

## Documentation

### When to Update Docs

Update documentation when:

- Adding new feature
- Changing API
- Fixing significant bug
- Improving performance

### Documentation Files

- **README.md**: User-facing guide
- **ARCHITECTURE.md**: Technical deep-dive
- **LLM.md**: AI model context
- **TROUBLESHOOTING.md**: Common issues
- **MISSING_FEATURES.md**: Roadmap
- **ANIMATION_INTEGRATION.md**: Animation libraries
- **EXAMPLES.md**: Quick reference examples

### Documentation Standards

- Clear, concise writing
- Code examples for new features
- TypeScript types in examples
- Link to related docs
- Update table of contents

---

## Issue Guidelines

### Before Opening an Issue

1. Search existing issues
2. Check troubleshooting guide
3. Verify it's a bug (not usage error)
4. Create minimal reproduction

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:

1. ...
2. ...

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Minimal reproduction**
Link to CodeSandbox or code snippet

**Environment**

- Browser: [e.g., Chrome 120]
- React: [e.g., 18.2.0]
- VirtualWindow: [e.g., 1.0.0]

**Additional context**
Screenshots, console errors, etc.
```

### Feature Request Template

```markdown
**Feature description**
What feature do you want?

**Use case**
Why is this feature needed?

**Proposed solution**
How would this work?

**Alternatives considered**
Other ways to solve this

**Additional context**
Examples, mockups, etc.
```

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Steps

1. Update CHANGELOG.md
2. Update version in package.json
3. Create release branch: `release/v1.2.0`
4. Test thoroughly
5. Merge to `main`
6. Tag release: `git tag v1.2.0`
7. Push tag: `git push --tags`
8. Publish to npm (maintainers only)

---

## Getting Help

### Resources

- **Documentation**: Read docs/ folder
- **Discussions**: Ask questions
- **Issues**: Report bugs
- **Discord/Slack**: (if available)

### Contact Maintainers

For sensitive issues (security, etc.):

- Email: <maintainers@example.com>

---

## Recognition

Contributors are recognized in:

- CHANGELOG.md (release notes)
- README.md (contributors section)
- GitHub contributors page

Thank you for contributing to VirtualWindow! 🙏
