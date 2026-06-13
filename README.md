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

    <script type="module">
        import { init } from 'litelight-js';
        init();
    </script>
</body>
</html>
```

## Configuration

```javascript
init({
    imageSelector: 'img[data-gallery]',     // CSS selector for gallery images
    imageUrlAttribute: 'data-gallery',      // Attribute holding full-size URL
    lightboxClass: 'lite-light',              // Root overlay class name
    swipeThreshold: 75,                       // Horizontal swipe distance (px)
    fadeAnimationDuration: 200                // Image fade duration (ms)
});
```

| Option | Default | Description |
|---|---|---|
| `imageSelector` | `'img[data-lightbox]'` | CSS selector defining the gallery set |
| `imageUrlAttribute` | `'data-lightbox'` | Attribute on clicked `<img>` with full-size URL |
| `lightboxClass` | `'lite-light'` | Root overlay class; used to detect existing DOM |
| `swipeThreshold` | `50` | Swipe distance (px) to trigger prev/next on mobile |
| `fadeAnimationDuration` | `150` | Image fade duration in milliseconds |

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
**Mobile:** Swipe left/right, pinch-to-zoom, tap outside to close

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
