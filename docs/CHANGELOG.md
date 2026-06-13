# Changelog

All notable changes to LiteLight are documented in this file.

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
