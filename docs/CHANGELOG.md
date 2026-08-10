# Changelog

All notable changes to LiteLight are documented in this file.

## [1.2.0] - 2026-08-10

### Release notes

- Include text-link triggers via `imageSelector`
- Resolve mobile pinch/pan issues that caused the underlying page's zoom state
- Add smoother iOS Safari pinch-zoom

### Added

- **Text-link triggers:** open the lightbox from `<a data-lightbox="…">` (or any non-`<img>` element) by setting `imageSelector` — e.g. `init({ imageSelector: 'a[data-lightbox]' })` or mix with images via `'img[data-lightbox], a[data-lightbox]'`. Click handling uses `closest(imageSelector)` instead of a hardcoded `IMG` tag check ([#7](https://github.com/byronjohnson/litelight/pull/7) by [@jbender0](https://github.com/jbender0))
- Docs for text-link usage in `README.md`, `AGENTS.md`, `llms.txt`, and `llms-full.txt`

### Fixed

- Plain clicks on `<a>` triggers call `preventDefault()` so navigation does not race the lightbox; modifier clicks (Cmd/Ctrl/Shift/Alt) still open the lightbox and keep native link behavior (e.g. new tab)
- **Mobile pinch/pan:** the page behind the lightbox no longer zooms or pans with the gesture (`touch-action: none` on the active overlay, non-passive `touchmove` `preventDefault` during pinch/pan, Safari `gesturestart`/`gesturechange` blocked)
- **iOS Safari pinch smoothness:** disable transform transitions and backdrop-filter during the gesture; remove a conflicting Safari `transform` override; use `translate3d` for the live zoom transform

## [1.1.0] - 2026-06-13

### Changed

- Image navigation uses opacity transitions instead of chained keyframe animations (smoother, fewer listeners per navigation)
- `will-change: transform` is applied only during active pinch/pan gestures instead of permanently on the image
- `fadeAnimationDuration` config option now controls image fade timing via `--ll-duration`
- Refreshed default appearance: backdrop blur, rounded image frame with soft shadow, scale-in entrance, safe-area-aware close button
- Loading spinner appears only during actual image decode/load (`lite-light-loading`)
- CSS custom properties for theming: `--ll-overlay`, `--ll-duration`, `--ll-radius`, `--ll-image-bg`, `--ll-control`
- Internal performance improvements: adjacent image preloading deferred to idle time so the opened image paints sooner
- Focus trap uses viewport breakpoint matching instead of per-keystroke style reads
- Consolidated navigation/close handlers to reduce duplicated session logic
- Removed unused internal `VERSION` constant

### Added

- AI agent discovery files: `AGENTS.md`, `llms.txt`, `llms-full.txt`, `ai.txt` (included in npm package)
- Expanded npm keywords and description for lightbox search discoverability

### Fixed

- Added TypeScript definitions (`lite-light.d.ts`)
- Build now reports raw and gzip sizes for all distribution artifacts

## [1.0.5] - Previous release

See [GitHub releases](https://github.com/byronjohnson/litelight/releases) for earlier history.
