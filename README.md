# Lite Light

A lightweight, elegant javascript lightbox utility for modern web applications. Features smooth animations, mobile swipe support, keyboard navigation, and zero dependencies.

## Features

- **Lightweight** - Minimal footprint with no dependencies
- **Mobile-first** - Touch/swipe navigation for mobile devices
- **Keyboard navigation** - Arrow keys and ESC support
- **Smooth animations** - Elegant fade transitions between images
- **Customizable** - Easy to configure and style
- **Modern ES6** - Uses modern JavaScript features
- **Accessible** - Proper focus management and keyboard support

## Quick Start

1. **Include the CSS and JS files:**

```html
<link rel="stylesheet" href="lite-light.css">
<script type="module" src="lite-light.js"></script>
```

2. **Add the data attribute to your images:**

```html
<img src="thumbnail.jpg" 
     data-lightbox="full-size.jpg" 
     alt="Beautiful landscape">
```

3. **Initialize Lite Light:**

```javascript
import { init } from './lite-light.js';

// Simple initialization
init();
```

## Usage Examples

### Basic Implementation

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

### Custom Configuration

```javascript
import { init } from './lite-light.js';

init({
    imageSelector: 'img[data-gallery]',
    imageUrlAttribute: 'data-gallery',
    lightboxClass: 'my-lightbox',
    swipeThreshold: 75,
    fadeAnimationDuration: 200
});
```

### Integration with Modern Frameworks

#### React Example

```jsx
import { useEffect } from 'react';
import { init } from './lite-light.js';
import './lite-light.css';

function Gallery({ images }) {
    useEffect(() => {
        init();
    }, []);

    return (
        <div className="gallery">
            {images.map((image, index) => (
                <img
                    key={index}
                    src={image.thumbnail}
                    data-lightbox={image.fullSize}
                    alt={image.alt}
                />
            ))}
        </div>
    );
}
```

#### Vue Example

```vue
<template>
    <div class="gallery">
        <img
            v-for="(image, index) in images"
            :key="index"
            :src="image.thumbnail"
            :data-lightbox="image.fullSize"
            :alt="image.alt"
        />
    </div>
</template>

<script>
import { init } from './lite-light.js';
import './lite-light.css';

export default {
    mounted() {
        init();
    }
}
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imageSelector` | string | `'img[data-lightbox]'` | CSS selector for lightbox images |
| `imageUrlAttribute` | string | `'data-lightbox'` | Attribute containing full-size image URL |
| `lightboxClass` | string | `'lite-light'` | CSS class for the lightbox container |
| `swipeThreshold` | number | `50` | Minimum swipe distance (px) to trigger navigation |
| `fadeAnimationDuration` | number | `150` | Animation duration in milliseconds |

## Navigation Controls

### Desktop
- **Left/Right Arrow Keys**: Navigate between images
- **ESC Key**: Close lightbox
- **Click outside image**: Close lightbox
- **Click navigation arrows**: Previous/next image

### Mobile
- **Swipe left/right**: Navigate between images
- **Tap outside image**: Close lightbox
- **Tap X button**: Close lightbox

## Browser Support

- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 79+

## Styling Customization

Override CSS variables or classes to customize the appearance:

```css
.lite-light {
    --background-color: rgba(0, 0, 0, 0.9);
    --animation-duration: 0.2s;
}

.lite-light img {
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

## File Structure

```
lite-light/
├── lite-light.js          # Main JavaScript module
├── lite-light.css         # Styles and animations
├── example.html           # Working example
└── README.md             # Documentation
```

## License

MIT License - feel free to use in personal and commercial projects.

## Contributing

Contributions welcome! Please feel free to submit issues and enhancement requests.