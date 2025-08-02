# LiteLight Lightbox

A lightweight, elegant JavaScript lightbox for modern web applications. Zero dependencies, mobile-first design with touch/swipe support and keyboard navigation.

## Features

- **Lightweight** - Under 10KB total with no dependencies
- **Mobile-first** - Touch/swipe navigation 
- **Keyboard navigation** - Arrow keys and ESC support
- **Smooth animations** - Elegant fade transitions
- **Modern ES6** - Uses modern JavaScript features

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
        import { init } from './lite-light.js';
        init();
    </script>
</body>
</html>
```

## Configuration

```javascript
init({
    imageSelector: 'img[data-gallery]',     // CSS selector for images
    imageUrlAttribute: 'data-gallery',      // Attribute with full-size URL
    swipeThreshold: 75,                     // Swipe distance to navigate
    fadeAnimationDuration: 200              // Animation duration (ms)
});
```

## Navigation

**Desktop:** Arrow keys, ESC to close, click outside to close  
**Mobile:** Swipe left/right, tap outside to close

## Browser Support

Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+

## License

MIT License - free for personal and commercial use.

## Contributing

Issues and pull requests welcome at [GitHub](https://github.com/byronj/lite-light).