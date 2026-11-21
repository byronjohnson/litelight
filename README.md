# LiteLight Lightbox

> **AI agents:** See [AGENTS.md](./AGENTS.md) for integration instructions, or [llms-full.txt](./llms-full.txt) for complete self-contained docs. npm package: **`litelight-js`**.

A lightweight, elegant JavaScript lightbox for modern web applications. Zero dependencies, mobile-first design with touch/swipe support and keyboard navigation.

## Features

- **Lightweight** — ~4 KB gzipped (JS + CSS combined), no dependencies
- **Mobile-first** — Touch/swipe navigation, pinch-to-zoom
- **Keyboard navigation** — Arrow keys and ESC support
- **Smooth animations** — Opacity fades, scale-in entrance, backdrop blur
- **Themeable** — CSS custom properties for colors, radius, and timing
- **TypeScript** — Ship-ready type definitions included
- **Modern ES modules** — Works with bundlers, CDN, or a plain `<script>` tag
- **Flexible triggers** — Open from thumbnail images or text links via `imageSelector`
- **Separate galleries** — Opt in with `data-lightbox-group` so one image, or one set, does not cycle with the rest of the page
- **Single thumbnail** — Opt in with `data-lightbox-cover` so a gallery shows one image on the page and the rest only inside the lightbox

## Demo

See LiteLight in action: [https://litelightbox.com/](https://litelightbox.com/)

## Quick Start

1. **Include the files:**

```html
<link rel="stylesheet" href="lite-light.css">
<script type="module" src="lite-light.js"></script>
```

2. **Add data attributes to images:**

```html
<img src="thumbnail.jpg" data-lightbox="full-size.jpg" alt="Beautiful landscape">
```

3. **Initialize:**

```javascript
import { init } from './lite-light.js';
init();
```

## Text link triggers

By default LiteLight only listens for `img[data-lightbox]`. To open from a text hyperlink, put `data-lightbox` on the `<a>` (full-size image URL) and pass a matching `imageSelector`:

```html
<a href="full-size.jpg" data-lightbox="full-size.jpg">View full image</a>
```

```javascript
init({ imageSelector: 'a[data-lightbox]' });
```

Mix thumbnails and text links in one gallery:

```javascript
init({ imageSelector: 'img[data-lightbox], a[data-lightbox]' });
```

Keep a real `href` (usually the same URL as `data-lightbox`) for progressive enhancement. Plain clicks open the lightbox only; Cmd/Ctrl-click (and other modified clicks) still open the lightbox and leave native browser link behavior (e.g. open in a new tab).

## Separate galleries

Triggers with no group attribute still share one gallery. That existing markup does not need to change.

To keep a single image, or a second set of images, from cycling with the others, set `data-lightbox-group` on the trigger or on a parent. Matching values form one gallery. A group of one image opens alone (no previous/next controls, no swipe or arrow-key cycling).

```html
<!-- Stays in the default gallery with every other ungrouped trigger -->
<img src="thumb.jpg" data-lightbox="full.jpg" alt="In the main gallery">

<!-- One image, isolated -->
<img src="hero-thumb.jpg" data-lightbox="hero.jpg" data-lightbox-group="hero" alt="Hero">

<!-- A second gallery. The attribute can live on a wrapper. -->
<div data-lightbox-group="trip">
  <img src="a-thumb.jpg" data-lightbox="a.jpg" alt="Stop one">
  <img src="b-thumb.jpg" data-lightbox="b.jpg" alt="Stop two">
</div>
```

`init()` is still called once. Rename the attribute with `groupAttribute` if `data-lightbox-group` is already taken:

```javascript
init({ groupAttribute: 'data-gallery' });
```

## Single thumbnail

Optional. Add `data-lightbox-cover` to a gallery wrapper, or to every trigger in that set, to leave one image on the page. The other triggers are hidden. They stay in the DOM, so clicking the thumbnail still opens them in the lightbox and previous/next, swipe, and arrow keys still reach them.

Mark the visible image with `data-lightbox-thumb`. Without that attribute, the first trigger in the set stays visible. Give the set its own `data-lightbox-group` when the page has other images, so this gallery does not cycle with them.

A parent that contains only the hidden trigger, such as a `figure`, `li`, or card, is hidden with that trigger.

```html
<div data-lightbox-group="cabin" data-lightbox-cover>
  <img src="porch.jpg" data-lightbox="porch.jpg" alt="Porch" data-lightbox-thumb>
  <img src="kitchen.jpg" data-lightbox="kitchen.jpg" alt="Kitchen">
  <img src="loft.jpg" data-lightbox="loft.jpg" alt="Loft">
</div>
```

Call `init()` after these triggers are in the DOM. The hide pass runs once and does not watch for triggers added later. Pages with no `data-lightbox-cover` skip that pass. Rename either attribute if the default name is already taken:

```javascript
init({
  coverAttribute: 'data-gallery-cover',
  thumbAttribute: 'data-gallery-thumb'
});
```

## Installation

### NPM

```bash
npm install litelight-js
```

```javascript
import { init } from 'litelight-js';
import 'litelight-js/css';

init();
```

### GitHub Packages

```bash
npm install @byronjohnson/litelight-js
```

```javascript
import { init } from '@byronjohnson/litelight-js';
import '@byronjohnson/litelight-js/css';

init();
```

### CDN

```html
<link rel="stylesheet" href="https://unpkg.com/litelight-js@latest/dist/lite-light.min.css">
<script type="module">
  import { init } from 'https://unpkg.com/litelight-js@latest/dist/lite-light.min.js';
  init();
</script>
```

When using NPM, prefer the `./css` export (`import 'litelight-js/css'`) over deep `dist/` paths.

### Manual Download

Download `lite-light.js` and `lite-light.css` from the [releases page](https://github.com/byronjohnson/litelight/releases).

## Example

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="lite-light.css">
</head>
<body>
    <img src="thumb1.jpg" data-lightbox="large1.jpg" alt="Image 1">
    <img src="thumb2.jpg" data-lightbox="large2.jpg" alt="Image 2">
    <img src="thumb3.jpg" data-lightbox="large3.jpg" alt="Image 3">
    <p><a href="large1.jpg" data-lightbox="large1.jpg">Open via text link</a></p>

    <script type="module">
        import { init } from 'litelight-js';
        init({ imageSelector: 'img[data-lightbox], a[data-lightbox]' });
    </script>
</body>
</html>
```

## Configuration

```javascript
init({
    imageSelector: 'img[data-gallery]',     // CSS selector for triggers (img, a, or both)
    imageUrlAttribute: 'data-gallery',      // Attribute holding full-size URL
    lightboxClass: 'lite-light',              // Root overlay class name
    swipeThreshold: 75,                       // Horizontal swipe distance (px)
    fadeAnimationDuration: 200,               // Image fade duration (ms)
    groupAttribute: 'data-lightbox-group',    // Attribute that names an independent gallery
    coverAttribute: 'data-lightbox-cover',    // Collapse a gallery to one visible trigger
    thumbAttribute: 'data-lightbox-thumb'     // Which trigger stays visible in a cover gallery
});
```

| Option | Default | Description |
|---|---|---|
| `imageSelector` | `'img[data-lightbox]'` | CSS selector for gallery triggers (`<img>`, `<a>`, or both) |
| `imageUrlAttribute` | `'data-lightbox'` | Attribute on the trigger with the full-size image URL |
| `lightboxClass` | `'lite-light'` | Root overlay class; used to detect existing DOM |
| `swipeThreshold` | `50` | Swipe distance (px) to trigger prev/next on mobile |
| `fadeAnimationDuration` | `150` | Image fade duration in milliseconds |
| `groupAttribute` | `'data-lightbox-group'` | Attribute (on the trigger or an ancestor) that isolates a gallery. Omit it to keep the shared gallery |
| `coverAttribute` | `'data-lightbox-cover'` | Attribute (on a wrapper or each trigger) that shows one thumbnail and keeps the other triggers for the lightbox only |
| `thumbAttribute` | `'data-lightbox-thumb'` | Attribute on the trigger that stays visible. The first trigger is used when none is marked |

## Theming

Override defaults with CSS custom properties on `.lite-light`. No JavaScript changes required.

```css
.lite-light {
  --ll-overlay: rgba(0, 0, 0, 0.85);
  --ll-duration: 0.2s;
  --ll-radius: 8px;
  --ll-image-bg: #fff;
  --ll-control: #fff;
}
```

| Variable | Default | Purpose |
|---|---|---|
| `--ll-overlay` | `rgba(0, 0, 0, 0.75)` | Scrim background color |
| `--ll-duration` | `0.15s` | Image fade timing (also set from `fadeAnimationDuration` on open) |
| `--ll-radius` | `6px` | Image corner radius |
| `--ll-image-bg` | `#fff` | Matte behind the photo |
| `--ll-control` | `#fff` | Arrow and close icon color |

Backdrop blur is applied progressively where supported (`backdrop-filter`).

## TypeScript

Types ship with the package:

```typescript
import { init, type LiteLightOptions } from 'litelight-js';
import 'litelight-js/css';

init({ fadeAnimationDuration: 200 });
```

## Navigation

**Desktop:** Arrow keys, ESC to close, click outside to close  
**Mobile:** Swipe left/right, pinch-to-zoom (image only — the page behind stays put), tap outside to close

## Changelog

See [docs/CHANGELOG.md](./docs/CHANGELOG.md) for the full history.

### 1.4.0

- Add `data-lightbox-cover` so a gallery can show one thumbnail on the page
- Add `data-lightbox-thumb` to choose that thumbnail; otherwise the first trigger stays visible
- Hidden triggers still cycle inside the lightbox. A parent that only wraps a hidden trigger is hidden with it
- Pages that do not use `data-lightbox-cover` skip the hide pass

### 1.3.0

- Add `data-lightbox-group` for multiple independent galleries on one page
- A group of one image opens alone
- Pages that only use `data-lightbox` keep the shared gallery

### 1.2.0

- Include text-link triggers via `imageSelector`
- Resolve mobile pinch/pan issues that caused the underlying page's zoom state
- Add smoother iOS Safari pinch-zoom

## Browser Support

Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+

Backdrop blur and `scrollTo({ behavior: 'instant' })` degrade gracefully on older browsers.

## License

MIT License — free for personal and commercial use.

## Contributing

Issues and pull requests welcome at [GitHub](https://github.com/byronjohnson/litelight).

## For AI assistants & LLM discovery

| Resource | Description |
|---|---|
| [AGENTS.md](./AGENTS.md) | Quick integration guide for coding agents |
| [llms.txt](./llms.txt) | Concise project summary ([llms.txt spec](https://llmstxt.org/)) |
| [llms-full.txt](./llms-full.txt) | Complete API, FAQ, and examples in one file |
| [ai.txt](./ai.txt) | AI crawler permissions |

After install, these files are available at `node_modules/litelight-js/` and via unpkg (e.g. `https://unpkg.com/litelight-js/llms-full.txt`).
