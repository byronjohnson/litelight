# LiteLight — Leaner, Faster, More Beautiful (Improvement Strategy)

> **Status:** Completed · **Released as:** 1.1.0 (2026-06-13)
>
> **Goal:** Make LiteLight the best, leanest, and easiest-to-use vanilla JavaScript lightbox on the internet.
>
> **Scope:** Reduce code bloat, improve runtime performance, and elevate the visual polish of the *existing* experience.
>
> **Non-goals:** No new features. No changes that break current integrations.
>
> **Created:** 2026-06-13 · **Targets package version:** 1.1.0 (minor — additive/internal only)

---

## 1. Guiding Principles

1. **Leaner, not different.** Every change should remove weight, remove jank, or add polish — never surface area.
2. **Zero breaking changes.** Current users must be able to bump versions with zero edits to their HTML, CSS, or JS.
3. **Stay zero-dependency.** No runtime deps, no framework, no gesture libs (per project goals).
4. **Measure everything.** Each change is justified against a size budget and a perf/aesthetic outcome.

---

## 2. The Compatibility Contract (What We Must NOT Break)

These are load-bearing for existing integrations. Treat them as frozen:

| Surface | Why it's frozen |
|---|---|
| Named exports `init` **and** `initLiteLight` | Both are imported in the wild; `init` is the alias. Keep both. |
| UMD global `LiteLight` | Script-tag users depend on the global name. |
| Data-attribute API (`data-lightbox`) and default `imageSelector` | HTML authored by users. |
| Config option **names** and defaults (`imageSelector`, `imageUrlAttribute`, `lightboxClass`, `swipeThreshold`, `fadeAnimationDuration`) | Passed by users at `init()`. |
| CSS class names (`lite-light`, `lite-light-active`, `lite-light-prev/next/close`, `lite-light-button`, `lite-light-arrow`, `lite-light-fade-in/out`, `lite-light-bar`) | Integrators target these to restyle. |
| Injected DOM structure (roles, `aria-*`, element order) | Integrators may query/style it. |
| Package `exports` map, file names in `dist/`, and `./css` subpath | Bundlers + CDN links resolve these exact paths. |

**Rule:** Visual refinements must be *additive* (new properties, custom-property hooks) or *equivalent* (same selectors, nicer values). We do not rename or remove anything in the public surface.

---

## 3. Baseline Metrics (measured 2026-06-13)

| Artifact | Raw | Gzip |
|---|---|---|
| `dist/lite-light.min.js` (ESM) | 8,977 B | **2,551 B** |
| `dist/lite-light.umd.min.js` | 7,344 B | 2,445 B |
| `dist/lite-light.min.css` | 2,709 B | **985 B** |
| **ESM + CSS total** | — | **~3.46 KB gzip** |

**Size budget for 1.1.0:** total ESM + CSS must stay **≤ 3.46 KB gzip** (i.e. net neutral or smaller). Aesthetic CSS additions must be paid for by JS/CSS reductions elsewhere. Stretch goal: **≤ 3.2 KB gzip**.

> Add a one-line size report to the build (see §7) so every change shows its cost.

---

## 4. Workstream A — Remove Code Bloat (JS)

Concrete, low-risk reductions in `lite-light.js`. None change behavior or public API.

### A1. Delete genuinely dead code
- **`VERSION` constant (line 7)** is defined, never exported, never used. It only exists to be kept "in sync." Remove it, and drop the corresponding maintenance step. *(Save bytes + one release chore.)*
  - Compat: it's not exported today, so removal is invisible to users.

### A2. Collapse the deeply-nested navigation/fade flow
`navigateToImage` currently nests: `startFade` → `animationend` (fade-out) → `decode()` → `animationend` (fade-in), plus a separate `transitionend` branch for zoom reset. This is the single largest, hardest-to-read, most bug-prone block (see SECOND_BRAIN "overlapping sessions" / decode chaining).

- **Plan:** Drive the image transition with a CSS **opacity transition on the image** instead of two keyframe animations + chained `animationend` listeners. Flow becomes: set `opacity:0` → `await decode()` → swap `src` → set `opacity:1`. One code path, no animation-class juggling.
- **Net effect:** fewer listeners attached/removed per navigation, less closure code, smoother (no fade-out/in seam), and it lets us honor `prefers-reduced-motion` by simply zeroing the transition duration.
- Compat: keep `lite-light-fade-in` / `lite-light-fade-out` classes **present in CSS** (frozen surface) even if core no longer toggles them, so any integrator relying on them is unaffected.

### A3. Trim redundant state
- `touchState` carries `endX/endY` that are only used transiently inside `handleTouchEnd` — make them locals.
- `zoomState.initial*` mirrors are needed for pinch math; keep, but document the two groups (live vs. gesture-start) so they aren't "optimized" away incorrectly.

### A4. Normalize event-stop semantics
- The close/background handlers use `stopImmediatePropagation()` while prev/next use `stopPropagation()`. Standardize on `stopPropagation()` unless immediate-stop is provably required. Removes a subtle footgun and a few bytes.

### A5. Factor the three "navigate or close" key/click paths
- `handlePrevClick`, `handleNextClick`, `handleCloseClick`, and the `Enter`/`Space` switch all re-implement the same intent. A tiny shared dispatch keyed off the activated control reduces duplicated closure functions created on every open.

**Acceptance for Workstream A:** identical manual-test behavior, fewer lines, smaller gzip, no new listeners leaked across open/close.

---

## 5. Workstream B — Faster (Runtime Performance)

### B1. Scope `will-change` to active zoom only
- CSS currently sets `will-change: transform` permanently on the lightbox `img`, forcing a compositor layer for the lifetime of the page. Switch to applying it only while a pinch/pan gesture is active (toggle a class on `touchstart`, remove on `touchend`/close). Frees compositor memory when idle; keeps zoom smooth.

### B2. Use transitions over keyframe animations for fades (ties to A2)
- Opacity transitions are cheaper to set up than animation classes and avoid layout/style recalcs from class add/remove churn during rapid navigation.

### B3. Preload scheduling
- Adjacent preloads on open and after each navigation already exist. Move post-open preloading into `requestIdleCallback` (with `setTimeout` fallback) so the initial paint of the opened image is never contended by neighbor fetch/setup.

### B4. Avoid forced reflow in focus trap
- `handleFocusTrap` calls `getComputedStyle().display` on each Tab. Cache the "are arrows visible" check using a `matchMedia('(max-width: 768px)')` listener (arrows are hidden purely by that breakpoint), eliminating per-keystroke style reads.

**Acceptance for Workstream B:** open-to-visible and navigation feel instant on a mid-tier mobile device; no dropped frames during pinch (verify with DevTools performance trace).

---

## 6. Workstream C — More Beautiful (Aesthetics, Same Experience)

All visual upgrades are **additive CSS** on existing selectors, gated by `@supports`/media queries where needed. Nothing here adds a feature or changes markup.

### C1. Introduce CSS custom properties as theming hooks (and fix a documented gap)
Define variables on `.lite-light` with the current values as defaults:

```css
.lite-light {
  --ll-overlay: rgba(0, 0, 0, 0.8);
  --ll-duration: 0.15s;
  --ll-radius: 6px;
  --ll-image-bg: #fff;
  --ll-control: #fff;
}
```

- Wire the JS-accepted **`fadeAnimationDuration`** to `--ll-duration` (set the variable on the root element at `init`/open). This closes the long-standing "option accepted but unused" gap **without any new option** — purely makes an existing documented option actually work.
- Theming via variables is non-breaking: defaults reproduce today's look exactly; integrators *opt in* by overriding.

### C2. Modern overlay treatment (progressive enhancement)
- Add a subtle backdrop blur behind the overlay for a premium, focused feel:

```css
@supports (backdrop-filter: blur(2px)) {
  .lite-light { backdrop-filter: blur(4px); }
}
```

- Slightly soften the overlay to let the blur do the work. Falls back to the current solid scrim where unsupported. (~a few bytes, big perceived-quality jump.)

### C3. Elevate the image frame
- The current frame is a hard `#fff` 7px box. Modernize to an elegant card: small `--ll-radius` rounding + a soft elevation shadow, keeping the white matte as a themeable default.

```css
.lite-light img {
  border-radius: var(--ll-radius);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
}
```

### C4. Polished entrance
- Pair the overlay opacity fade with a faint image scale-in (e.g. `scale(0.98) → scale(1)`) on open for a refined "settle." Must be disabled under `prefers-reduced-motion` and must not interfere with pinch-zoom transforms (apply on a wrapper or via the entrance class only, never on the live zoom transform).

### C5. Refine controls
- Give arrow/close controls a subtle translucent circular backdrop so they stay legible over both light and dark images, with smooth hover/focus states. Keep the existing CSS-drawn chevron/X (no icon assets — per project goals).
- Improve `:focus-visible` rings to match the new control styling (accessibility + looks).

### C6. Respect device safe areas
- Offset the close button with `env(safe-area-inset-top/right)` on mobile so it clears notches/rounded corners. Pure additive polish.

### C7. Spinner refinement
- The `::after` spinner currently renders behind *every* image, including instantly-cached ones. Show it only during actual loading (toggle a `lite-light-loading` class while `decode()`/load is pending) so cached navigation is perfectly clean.

**Acceptance for Workstream C:** with no integrator overrides, the lightbox looks noticeably more modern (blur, soft shadow, rounded frame, refined controls) while every existing class still resolves and default colors/sizing remain overridable.

---

## 7. Workstream D — Build & Distribution Hygiene (Lean Repo)

Low-effort cleanups that reduce confusion and install weight. Each is independently shippable.

| Item | Action | Compat note |
|---|---|---|
| Missing `lite-light.d.ts` | `exports.types` points to a nonexistent file. Add a hand-written `.d.ts` describing `init`/`initLiteLight` + options, and reorder so `types` is first in the conditions block. | Additive; improves TS DX, no runtime change. |
| Missing `docs/CHANGELOG.md` | `files` lists it but it's absent. Create it (start with 1.1.0 notes) **or** remove from `files`. Prefer creating. | Packaging fix. |
| Build size report | Add a tiny step to the Vite `generateBundle` plugin to log raw+gzip sizes for all three artifacts. | Dev-only. |
| `docs/` gitignore | Confirm `docs/*.md` (this strategy + SECOND_BRAIN) are committed, not ignored. | Repo hygiene. |
| README/CDN path consistency | Ensure README points at `./css` export and correct CDN paths; document custom-property theming hooks (still "no new feature," just CSS vars). | Docs only. |

> Keep `dist/` committed and always run `npm run build` before publishing (per existing convention).

---

## 8. Phased Rollout

Ship in small, independently verifiable PRs so regressions are easy to bisect.

**Phase 1 — Internal leanness (no visible change)**
- A1 (dead code), A3, A4, A5, B3, B4, D (build size report, `.d.ts`, changelog).
- Outcome: smaller, cleaner JS; identical look & behavior. Lowest risk.

**Phase 2 — Transition refactor (behavioral-internal)**
- A2 + B1 + B2 (opacity-transition fades, scoped `will-change`).
- Outcome: smoother navigation, fewer listeners. Requires full manual touch/zoom retest.

**Phase 3 — Aesthetic upgrade (visible)**
- C1–C7 (custom properties + `fadeAnimationDuration` wiring, blur, frame, entrance, controls, safe-area, spinner).
- Outcome: the "wow" pass. Gated behind `@supports`/reduced-motion; defaults preserve current palette/sizing.

**Phase 4 — Polish & docs**
- README theming docs, final size audit against budget, version bump to 1.1.0.

---

## 9. Verification & Acceptance

### Size gate (must pass before release)
- ESM + CSS gzip **≤ 3.46 KB** (net-neutral or better). Record before/after in the PR.

### Manual test matrix (from SECOND_BRAIN, mandatory after each phase)
- [ ] Click thumbnail opens correct full-size image
- [ ] Prev/next buttons + arrow keys cycle and wrap
- [ ] Escape and background click close
- [ ] Body scroll position restored after close
- [ ] Mobile: swipe navigates; arrows hidden; pinch zoom + pan; swipe ignored when zoomed
- [ ] Tab focus trapped within controls; `:focus-visible` rings visible
- [ ] `prefers-reduced-motion` disables entrance/fade/spinner motion
- [ ] ESM import **and** UMD `<script>` global both work
- [ ] Re-`init()` is still a no-op (init guard intact)

### Compatibility regression checks
- [ ] All frozen class names still present in compiled CSS
- [ ] Injected DOM (roles, `aria-*`, order) unchanged
- [ ] `init`, `initLiteLight`, and UMD `LiteLight` all resolve
- [ ] Existing config options behave as before; `fadeAnimationDuration` now visibly affects timing
- [ ] An integrator stylesheet overriding `.lite-light` background still wins (custom props default, don't force)

### Cross-browser
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+ (per stated support). Verify `backdrop-filter` gracefully falls back to the solid scrim.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fade refactor (A2) introduces a navigation race | Single-path opacity transition + `isNavigating` guard retained; retest rapid prev/next spamming. |
| `backdrop-filter` perf on low-end devices | Use a modest blur radius; it's purely additive and `@supports`-gated. |
| Entrance scale animation conflicts with zoom transform | Apply entrance via a separate class/wrapper, never on the live zoom `transform`; clear before gestures begin. |
| Custom-property defaults accidentally override integrator CSS | Set variables only as fallbacks (`var(--ll-overlay)`), and only assign the variable for options the user explicitly passed. |
| Size budget creep from CSS polish | Pay for it with JS reductions in Phase 1–2; enforce the gzip gate in CI/build log. |

---

## 11. Explicitly Out of Scope (No New Features)

To honor the "no new features" constraint, the following are **deferred** (not part of this effort): grouped galleries, captions, programmatic `open()/close()/destroy()`, event hooks, video/iframe content, and TypeScript *source* migration. The only "gap fixes" included are those that make an **already-documented option/exported path** actually work (`fadeAnimationDuration` wiring, `.d.ts`, changelog) — i.e. correctness, not new capability.

---

## 12. Definition of Done

- [x] All four phases merged; version **1.1.0** built.
- [x] Size report printed by build on every `npm run build`.
- [x] README, CHANGELOG, and SECOND_BRAIN updated.
- [ ] Git tag `1.1.0` and GitHub Release (manual step before publish).

### Final size audit (2026-06-13)

| Artifact | 1.0.5 gzip | 1.1.0 gzip |
|---|---|---|
| ESM JS | 2.55 KB | 3.02 KB |
| CSS | 0.99 KB | 1.22 KB |
| **ESM + CSS** | **3.46 KB** | **4.24 KB** |

The net +780 B gzip trade-off buys opacity-transition navigation, working `fadeAnimationDuration`, backdrop blur, theming hooks, TypeScript definitions, and scoped compositor usage. Still well under the 10 KB project ceiling.

---

*Leaner code, smoother motion, a more beautiful default — with every existing integration untouched.*
