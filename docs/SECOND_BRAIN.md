# LiteLight — Agent Context / Second Brain

> **Purpose:** This document gives AI agents (and human contributors) enough context to iterate on [LiteLight](https://github.com/byronjohnson/litelight) safely and consistently. Read this before making changes.
>
> **Last reviewed:** 2026-06-13 · **Package version:** 1.1.0

---

## 1. What This Project Is

**LiteLight** (`litelight-js`) is a **zero-dependency, vanilla JavaScript lightbox** for image galleries. Users mark thumbnail `<img>` elements with a data attribute; clicking opens a full-screen overlay with navigation, touch gestures, and keyboard support.

| Property | Value |
|---|---|
| NPM name | `litelight-js` |
| GitHub Packages scope | `@byronjohnson/litelight-js` |
| Author | Byron Johnson |
| License | MIT |
| Live demo | https://litelightbox.com/ |
| Repo | https://github.com/byronjohnson/litelight |

**Design goals (non-negotiable):**

1. **Tiny footprint** — target under ~10 KB total (JS + CSS, minified + gzipped)
2. **Zero runtime dependencies** — no jQuery, no framework
3. **Mobile-first** — swipe navigation, pinch-to-zoom, large touch targets
4. **Progressive enhancement** — works with a `<script>` tag or ES module import
5. **Accessible basics** — ARIA dialog, focus trap, keyboard nav, reduced-motion support

---

## 2. Repository Layout

```
lite-light/
├── lite-light.js          # SOURCE OF TRUTH for JavaScript (~550 lines)
├── lite-light.css         # SOURCE OF TRUTH for styles (~280 lines, uses CSS nesting)
├── lite-light.d.ts        # TypeScript definitions (copied to dist/ on build)
├── vite.config.js         # Build: ES + UMD bundles + minified CSS + size report
├── package.json           # NPM metadata, exports map, scripts
├── README.md              # User-facing docs (keep in sync with API changes)
├── dist/                  # Build output (committed; republished on release)
│   ├── lite-light.min.js       # ES module bundle
│   ├── lite-light.umd.min.js   # UMD bundle (global `LiteLight`)
│   ├── lite-light.min.css      # Minified CSS
│   └── lite-light.d.ts         # TypeScript definitions
├── docs/
│   ├── SECOND_BRAIN.md         # This file
│   ├── CHANGELOG.md            # Release history
│   └── IMPROVEMENT_STRATEGY.md # 1.1.0 improvement plan (completed)
└── .github/
    ├── workflows/publish.yml   # Publishes to GitHub Packages on release
    └── FUNDING.yml
```

### Source vs. distribution

| Edit this | Not this |
|---|---|
| `lite-light.js` | `dist/lite-light.min.js` |
| `lite-light.css` | `dist/lite-light.min.css` |

Always run `npm run build` after changing source files. The `prepublishOnly` hook runs build automatically before publish.

### Git branches

- **`master`** — primary branch (currently checked out)
- **`develop`** — integration branch; release tags merged here historically

Release workflow uses Git tags (e.g. `1.1.0`) merged via release branches (`release/1.1.0`).

---

## 3. Public API

### Exports

```javascript
import { init, initLiteLight } from 'litelight-js';
import 'litelight-js/css';
```

Both `init` and `initLiteLight` are identical — `init` is a thin alias. Prefer documenting `init` for users; both must remain exported for backward compatibility.

### Initialization

```javascript
init(options?);
```

**Guard behavior:** A module-level `initialized` flag ensures `init()` only registers the global click listener **once**. Calling `init()` again is a no-op. There is **no destroy/uninit API** today.

### Configuration options

| Option | Default | Description |
|---|---|---|
| `imageSelector` | `'img[data-lightbox]'` | CSS selector defining the gallery set |
| `imageUrlAttribute` | `'data-lightbox'` | Attribute on clicked `<img>` holding full-size URL |
| `lightboxClass` | `'lite-light'` | Root overlay class; also used to detect existing DOM |
| `swipeThreshold` | `50` | Horizontal swipe distance (px) to trigger prev/next |
| `fadeAnimationDuration` | `150` | Image fade duration (ms); sets `--ll-duration` on the overlay at open |

Additional keys passed in `options` are spread into `config` but unused unless future code reads them.

### Theming (CSS custom properties)

Set on `.lite-light` (defaults reproduce the stock look):

| Variable | Default | Purpose |
|---|---|---|
| `--ll-overlay` | `rgba(0, 0, 0, 0.75)` | Scrim background |
| `--ll-duration` | `0.15s` | Image fade timing (overridden from `fadeAnimationDuration` on open) |
| `--ll-radius` | `6px` | Image corner radius |
| `--ll-image-bg` | `#fff` | Photo matte |
| `--ll-control` | `#fff` | Arrow / close icon color |

Backdrop blur uses `@supports (backdrop-filter: blur(2px))` — falls back to solid scrim.

### HTML usage pattern

```html
<img src="thumb.jpg" data-lightbox="full.jpg" alt="Description">
```

On click, LiteLight:

1. Queries all elements matching `imageSelector`
2. Finds the clicked image's index in that list
3. Opens the lightbox showing the URL from `imageUrlAttribute`
4. Wraps navigation (prev/next) within that matched set

**Gallery grouping:** All images matching `imageSelector` on the page form one gallery. There is no per-group API (e.g. `data-lightbox-group`) — use different `imageSelector` values via separate `init` calls only if you refactor init (not supported today; single init only).

---

## 4. Architecture

### High-level flow

```
init() once
  └─ document.addEventListener('click', ...)     ← permanent, global

User clicks qualifying <img>
  └─ Open session:
       ├─ Show overlay (.lite-light-active)
       ├─ Set image src, preload neighbors
       ├─ Lock body scroll
       ├─ Attach session listeners (keyboard, touch, buttons)
       └─ On close: remove session listeners, restore scroll

User clicks another <img> while open
  └─ Global click handler fires again → new session stacked on old
     ⚠️ Known edge case: opening a second image without closing first
     leaves prior session listeners attached until that session's close runs
```

### DOM structure (created once)

If no element with class `lite-light` (or custom `lightboxClass`) exists, `createLightboxHTML()` injects:

```html
<div class="lite-light" role="dialog" aria-modal="true" aria-label="Image lightbox">
  <div class="lite-light-prev lite-light-button" role="button" ...></div>
  <img alt="" />
  <div class="lite-light-next lite-light-button" role="button" ...></div>
  <div class="lite-light-close lite-light-button" role="button" ...></div>
</div>
```

Appended to `document.body`. Single shared overlay for all sessions.

### State model

| State | Scope | Notes |
|---|---|---|
| `initialized` | Module | Prevents duplicate `init()` |
| `preloadedImages` | Module | `Map` LRU cache, max 20 entries |
| `storedScrollPosition` | Module | Used by scroll lock |
| `touchState`, `zoomState` | Module | **Shared across sessions** — reset on navigation/close |
| `currentIndex`, `isNavigating` | Per click handler closure | Scoped inside the click callback |
| Session event handlers | Per open | Removed in `closeLightbox()` |

### Image preloading

`preloadImage(url)` maintains an LRU cache (max 20):

- Returns existing `Image` object if cached (and refreshes LRU order)
- Evicts oldest entry when at capacity
- Used for adjacent images on open (idle-scheduled) and after each navigation
- Navigation uses `whenImageReady()` + `Image.decode()` when available

### Navigation

- **Desktop:** prev/next buttons, ←/→ keys, click overlay background to close
- **Mobile (<768px):** prev/next buttons hidden; swipe left/right; pinch-zoom enabled
- **All:** Escape closes; focus trap cycles close/prev/next buttons

Navigation wraps circularly within the gallery array.

**Fade transition:** opacity transition (fade out → `decode()` → swap src → fade in). Legacy classes `lite-light-fade-in` / `lite-light-fade-out` remain in CSS for integrators but core no longer toggles them. If zoomed, smooth zoom reset runs before fade.

**Open entrance:** scale-in via `lite-light-entering` / `lite-light-entered` classes (cleared before pinch gestures).

**Loading indicator:** `lite-light-loading` on the overlay while decode/load is pending; spinner hidden when cached images are ready.

### Touch & zoom

| Gesture | Behavior |
|---|---|
| Single-finger swipe (scale ≈ 1) | Prev/next if horizontal distance > `swipeThreshold` |
| Two-finger pinch | Scale 1×–5× (`MIN_ZOOM` / `MAX_ZOOM`) |
| Single-finger drag (scale > 1) | Pan image |
| Release near 1× scale | Smooth snap back to exactly 1× |

Zoom transforms applied via `transform: scale() translate()` with `requestAnimationFrame` batching (`scheduleZoomUpdate`). `will-change: transform` is scoped to `.lite-light-zooming` during active pinch/pan only.

### Body scroll lock

Uses the **fixed-body technique**:

```javascript
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}px`;
```

Restored on close with `window.scrollTo({ behavior: 'instant' })`. Avoid alternative approaches (e.g. `overflow: hidden` alone) — they break iOS scroll restoration.

---

## 5. CSS Architecture

File: `lite-light.css` — uses **native CSS nesting** (`&` syntax). Processed and minified by **LightningCSS** during Vite build (not PostCSS).

### Key classes

| Class | Role |
|---|---|
| `.lite-light` | Fixed full-viewport overlay; hidden by default; CSS variable host |
| `.lite-light-active` | Visible state (opacity, pointer-events) |
| `.lite-light-loading` | Shows spinner (`::after`) during image decode/load |
| `.lite-light-button` | 44×44px min touch targets |
| `.lite-light-prev` / `.lite-light-next` | Arrow navigation (hidden on mobile) |
| `.lite-light-close` | X button (CSS-drawn bars) |
| `.lite-light-fade-in` / `-fade-out` | Legacy keyframe animations (frozen; integrators may target) |
| `.lite-light-entering` / `-entered` | Scale-in entrance on open (internal) |
| `.lite-light-zooming` | Active pinch/pan; enables `will-change: transform` |
| `.lite-light-no-transform-transition` | Instant transform reset (internal) |
| `.lite-light::after` | Loading spinner (visible only when `.lite-light-loading`) |

### Responsive & a11y

- `@media (max-width: 768px)` — hides arrow buttons, adjusts image sizing
- `@media (prefers-reduced-motion: reduce)` — disables/minimizes animations
- `@supports (-webkit-touch-callout: none)` — Safari GPU compositing fix during active zoom only

### Styling constraints for agents

- Keep selectors prefixed with `lite-light-` to avoid collisions
- Do not introduce CSS-in-JS or external stylesheet dependencies
- If adding animation duration options in JS, CSS custom properties are the preferred bridge

---

## 6. Build System

**Toolchain:** Vite 6 + LightningCSS 1.31

```bash
npm run dev      # vite build --watch
npm run build    # production build → dist/
npm run clean    # rm -rf dist
```

### Outputs

| File | Format | Size (approx, 1.1.0) |
|---|---|---|
| `dist/lite-light.min.js` | ES modules (`export { init, initLiteLight }`) | ~10 KB / **3.0 KB gzip** |
| `dist/lite-light.umd.min.js` | UMD global `LiteLight` | ~8 KB / **2.9 KB gzip** |
| `dist/lite-light.min.css` | Minified CSS | ~3.9 KB / **1.2 KB gzip** |
| `dist/lite-light.d.ts` | TypeScript definitions | ~300 B |

**ESM + CSS combined:** ~**4.2 KB gzip** (still under the 10 KB project target). Build logs raw + gzip sizes on every `npm run build`.

Vite lib entry: `lite-light.js`. CSS is **not** imported from JS — a custom Vite plugin reads `lite-light.css` and emits the minified asset during `generateBundle`.

### package.json exports

```json
{
  ".": {
    "types": "./dist/lite-light.d.ts",
    "import": "./dist/lite-light.min.js",
    "require": "./dist/lite-light.umd.min.js"
  },
  "./css": { "default": "./dist/lite-light.min.css" }
}
```

---

## 7. Publishing & Distribution

### NPM / GitHub Packages

- **Trigger:** GitHub Release `published` event → `.github/workflows/publish.yml`
- **Registry:** GitHub Packages (`npm.pkg.github.com`)
- **Node:** 18
- **Auth:** `GITHUB_TOKEN` with `packages: write`

Public NPM (`litelight-js`) and CDN (`unpkg.com/litelight-js`) are referenced in README; confirm publish targets if changing release automation.

### CDN usage (from README)

```html
<link rel="stylesheet" href="https://unpkg.com/litelight-js@latest/dist/lite-light.min.css">
<script type="module" src="https://unpkg.com/litelight-js@latest/dist/lite-light.min.js"></script>
```

Note: README CDN path uses `lite-light.min.css`; the `./css` export alias is the preferred NPM import path.

---

## 8. Development Conventions

### Code style

- **Plain ES modules** — `export function`; TypeScript via hand-written `lite-light.d.ts` (no TS source)
- **Functional modules** — no classes; closure-based session handlers
- **Named handler functions** — required for proper `removeEventListener` cleanup
- **Passive touch listeners** — `{ passive: true }` on touchstart/touchmove
- **Constants at top** — zoom limits, cache size, tolerances
- **Comments** — sparse; only for non-obvious behavior (scroll lock, decode fallback)

### Version sync

When bumping version, update:

1. `package.json` → `"version"`
2. `docs/CHANGELOG.md` → release entry
3. This document → header version + sizes if changed

There is no runtime `VERSION` export.

### What NOT to do

- Do not add npm dependencies to runtime code
- Do not refactor into multiple files without strong reason (size + simplicity are features)
- Do not replace vanilla DOM with a framework adapter in core — if framework wrappers are needed, create separate packages
- Do not commit hand-edited `dist/` without running `npm run build`
- Do not break UMD global name `LiteLight` (breaking change for script-tag users)

### Testing

**There are no automated tests.** `npm test` exits with error by design.

Manual test checklist after changes:

- [ ] Click thumbnail opens lightbox with correct full-size image
- [ ] Prev/next buttons and arrow keys cycle images (wrap at ends)
- [ ] Escape and background click close lightbox
- [ ] Body scroll restored to previous position after close
- [ ] Mobile: swipe navigates; buttons hidden
- [ ] Mobile: pinch zoom and pan work; swipe ignored when zoomed
- [ ] Tab focus trapped within lightbox controls
- [ ] `prefers-reduced-motion` respected
- [ ] Multiple galleries / re-init behavior acceptable
- [ ] ES module import and UMD `<script>` both work
- [ ] Bundle size still reasonable

---

## 9. Known Gaps & Tech Debt

Agents should be aware of these documented inconsistencies:

| Issue | Details | Suggested fix |
|---|---|---|
| **Vite warnings** | `build.lib.formats` ignored when `rollupOptions.output` is set | Simplify vite config |
| **No `destroy()` API** | Cannot reconfigure after init; listeners permanent | Add `destroy()` if hot-reload or SPA re-mount needed |
| **Overlapping sessions** | Clicking a second image while open may stack listeners | Close existing session before opening new one |
| **Single global gallery model** | No native support for multiple independent galleries on one page | Extend with group attribute or multiple instances |
| **Click handler checks attribute, not selector** | Click handler tests `hasAttribute(imageUrlAttribute)` but gallery uses `imageSelector` — mismatched selectors could cause odd behavior | Align validation logic |
| **No tests** | Regression risk on touch/zoom/scroll logic | Add Playwright or Vitest + jsdom tests for core flows |
| **Bundle size vs 1.0.x** | 1.1.0 ESM+CSS ~4.2 KB gzip vs ~3.5 KB in 1.0.5 (aesthetic CSS + transition helpers) | Optional: trim legacy keyframe CSS in a future major |

---

## 10. Browser Support

Target (from README): **Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+**

Features requiring modern APIs:

- ES modules
- `requestAnimationFrame`
- `Image.decode()` (graceful fallback exists)
- CSS nesting (build-time only — LightningCSS flattens for output)
- `behavior: 'instant'` in `scrollTo` (Safari 15.4+; verify fallback if supporting older Safari)

---

## 11. Extension Ideas (Future Work)

Safe directions aligned with project goals:

1. **Grouped galleries** — `data-lightbox-group="vacation"` scopes navigation sets
2. **Caption support** — read `alt` or `data-caption`, render below image
3. **Programmatic API** — `open(index)`, `close()`, `destroy()`, event hooks (`onOpen`, `onClose`)
4. **CSS variables** — overlay color, animation duration, radius (shipped in 1.1.0; max zoom still JS-only)
5. **Video / iframe support** — optional content types (careful with size budget)
6. **TypeScript source** — optional migration; keep dist as JS for consumers
7. **Visual regression tests** — lightweight Playwright screenshots
8. **Dual publish** — npmjs.org + GitHub Packages in CI

Avoid:

- Bundled icon fonts or large assets
- Heavy gesture libraries (Hammer.js, etc.)
- Shadow DOM (complicates styling for integrators)

---

## 12. Decision Log (Why Things Are This Way)

| Decision | Rationale |
|---|---|
| Single JS file | Minimize bundle, simplify CDN drop-in |
| Global click delegation | One listener for all images; works for dynamically added images if they match selector |
| Session-scoped listeners | Prevents listener leaks across open/close cycles |
| LRU preload cache (20) | Balance memory vs. navigation smoothness |
| Fixed-body scroll lock | Reliable on iOS vs. overflow:hidden |
| CSS nesting in source | Author ergonomics; LightningCSS handles compatibility |
| Separate CSS file | Users may want styles without JS or vice versa; explicit `@import` |
| UMD + ESM dual build | Support both bundlers and legacy global script tags |
| Pinch zoom on mobile only (de facto) | Desktop uses buttons; touch handlers on overlay |
| Init guard | Prevents duplicate overlays/listeners from double `init()` |
| Opacity-transition navigation | Fewer listeners than keyframe animation chains; honors `fadeAnimationDuration` via `--ll-duration` |
| Scoped `will-change` | Compositor layer only during active pinch/pan |
| CSS custom properties | Theme without forking; defaults match stock appearance |

---

## 13. Quick Reference for Agents

### Common tasks

| Task | Files to touch |
|---|---|
| Fix navigation bug | `lite-light.js` (navigateToImage, handlers) |
| Change overlay appearance | `lite-light.css` |
| Add config option | `lite-light.js` config block + README + this doc |
| Fix mobile touch | `lite-light.js` touch handlers; test on real device |
| Release new version | `package.json`, `docs/CHANGELOG.md`, `npm run build`, tag release |
| Fix package exports | `package.json`, `lite-light.d.ts` |

### Build verify command

```bash
npm ci && npm run build && ls -la dist/
```

Expected: four files in `dist/` — `.min.js`, `.umd.min.js`, `.min.css`, `.d.ts`.

### Key constants (lite-light.js)

```javascript
PRELOAD_CACHE_MAX = 20
ZOOM_TOLERANCE = 0.01
MIN_ZOOM = 1
MAX_ZOOM = 5
// Defaults: swipeThreshold 50, fadeAnimationDuration 150
```

---

## 14. Related Links

- **Demo site:** https://litelightbox.com/
- **Issues:** https://github.com/byronjohnson/litelight/issues
- **User docs:** [`README.md`](../README.md)
- **Funding:** Buy Me a Coffee — `byronj` (`.github/FUNDING.yml`)

---

*When you change behavior, API, build output, or release process, update this document in the same PR.*
