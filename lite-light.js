// LiteLight - A lightweight, elegant lightbox utility
// Version: 1.0.4
// Author: Byron Johnson
// License: MIT

// Version constant for programmatic access
const VERSION = '1.0.4';

// Preloaded images cache
const preloadedImages = {};

// Touch and zoom state variables
let touchState = {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  initialDistance: 0,
  isZooming: false,
  lastCenterX: 0,
  lastCenterY: 0
};

let zoomState = {
  scale: 1,
  x: 0,
  y: 0,
  initialScale: 1,
  initialX: 0,
  initialY: 0
};

// Constants for performance
const ZOOM_TOLERANCE = 0.01;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

// Utility functions
function preloadImage(url) {
  if (!preloadedImages[url]) {
    preloadedImages[url] = new Image();
    preloadedImages[url].src = url;
  }
  return preloadedImages[url];
}

// Store scroll position globally
let storedScrollPosition = 0;

function disableBodyScroll() {
  storedScrollPosition = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${storedScrollPosition}px`;
  document.body.style.width = '100%';
  document.body.style.overflowY = 'scroll';
}

function enableBodyScroll() {
  // Remove the fixed positioning styles first
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflowY = '';
  
  // Restore the scroll position instantly without animation
  window.scrollTo({
    top: storedScrollPosition,
    left: 0,
    behavior: 'instant'
  });
}

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;

  const touch1 = touches[0];
  const touch2 = touches[1];

  return Math.sqrt(
    Math.pow(touch2.screenX - touch1.screenX, 2) +
    Math.pow(touch2.screenY - touch1.screenY, 2)
  );
}

function getTouchCenter(touches) {
  if (touches.length < 2) return { x: touches[0].screenX, y: touches[0].screenY };

  const touch1 = touches[0];
  const touch2 = touches[1];

  return {
    x: (touch1.screenX + touch2.screenX) / 2,
    y: (touch1.screenY + touch2.screenY) / 2
  };
}

function applyZoomTransform(imageElement) {
  imageElement.style.transform = `scale(${zoomState.scale}) translate(${zoomState.x}px, ${zoomState.y}px)`;
  imageElement.style.transformOrigin = 'center center';
}

function resetZoom(imageElement) {
  zoomState.scale = 1;
  zoomState.x = 0;
  zoomState.y = 0;
  applyZoomTransform(imageElement);
}

function isApproximatelyOne(value) {
  return Math.abs(value - 1) < ZOOM_TOLERANCE;
}

// Initialize lightbox functionality
export function initLiteLight(options = {}) {
  const config = {
    imageSelector: options.imageSelector || 'img[data-lightbox]',
    imageUrlAttribute: options.imageUrlAttribute || 'data-lightbox',
    lightboxClass: options.lightboxClass || 'lite-light',
    swipeThreshold: options.swipeThreshold || 50,
    fadeAnimationDuration: options.fadeAnimationDuration || 150,
    ...options
  };

  // Create lightbox HTML if it doesn't exist
  if (!document.querySelector(`.${config.lightboxClass}`)) {
    createLightboxHTML(config.lightboxClass);
  }

  // Cache DOM elements
  const lightbox = document.querySelector(`.${config.lightboxClass}`);
  const lightboxImage = lightbox.querySelector('img');
  const prevButton = lightbox.querySelector('.lite-light-prev');
  const nextButton = lightbox.querySelector('.lite-light-next');
  const closeButton = lightbox.querySelector('.lite-light-close');

  document.addEventListener('click', (e) => {
    // Only proceed if an image with the specified attribute was clicked
    if (e.target.tagName !== 'IMG' || !e.target.hasAttribute(config.imageUrlAttribute)) return;

    const images = Array.from(document.querySelectorAll(config.imageSelector));
    let currentIndex = images.findIndex(img => img === e.target);

    // Function to preload adjacent images
    function preloadAdjacentImages(currentIdx) {
      const prevIdx = (currentIdx - 1 + images.length) % images.length;
      const nextIdx = (currentIdx + 1) % images.length;

      // Preload previous and next images
      preloadImage(images[prevIdx].getAttribute(config.imageUrlAttribute));
      preloadImage(images[nextIdx].getAttribute(config.imageUrlAttribute));
    }

    // Function to navigate to a specific image with fade animation
    function navigateToImage(index) {
      // Ensure index is within bounds
      currentIndex = (index + images.length) % images.length;

      // Get the next image URL
      const nextImageUrl = images[currentIndex].getAttribute(config.imageUrlAttribute);

      // Ensure the image is preloaded
      preloadImage(nextImageUrl);

      // Apply fade-out, then change source, then fade-in
      lightboxImage.classList.add('lite-light-fade-out');

      // Single animation listener that removes itself
      lightboxImage.addEventListener('animationend', function handleFade() {
        // The image should already be preloaded, so this should be instant
        lightboxImage.src = nextImageUrl;
        resetZoom(lightboxImage); // Reset zoom when changing images
        lightboxImage.classList.remove('lite-light-fade-out');
        lightboxImage.classList.add('lite-light-fade-in');

        // Preload the next set of images in the background
        preloadAdjacentImages(currentIndex);

        // Clean up after fade-in completes
        lightboxImage.addEventListener('animationend', function() {
          lightboxImage.classList.remove('lite-light-fade-in');
        }, { once: true });

        lightboxImage.removeEventListener('animationend', handleFade);
      }, { once: true });
    }
    
    // Optimized touch event handlers
    function handleTouchStart(e) {
      const touches = e.touches;

      if (touches.length === 1) {
        // Single touch - potential swipe or pan
        const touch = touches[0];
        touchState.startX = touch.screenX;
        touchState.startY = touch.screenY;
        touchState.lastCenterX = touch.screenX;
        touchState.lastCenterY = touch.screenY;
        touchState.isZooming = false;

        // Store initial zoom state
        zoomState.initialScale = zoomState.scale;
        zoomState.initialX = zoomState.x;
        zoomState.initialY = zoomState.y;
      } else if (touches.length === 2) {
        // Multi-touch - pinch gesture
        touchState.initialDistance = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        touchState.lastCenterX = center.x;
        touchState.lastCenterY = center.y;

        // Store initial zoom state
        zoomState.initialScale = zoomState.scale;
        zoomState.initialX = zoomState.x;
        zoomState.initialY = zoomState.y;
        touchState.isZooming = true;
      }
    }

    function handleTouchMove(e) {
      const touches = e.touches;

      if (touches.length === 2) {
        // Pinch-to-zoom
        const currentDistance = getTouchDistance(touches);
        const center = getTouchCenter(touches);

        if (touchState.initialDistance > 0) {
          const scaleChange = currentDistance / touchState.initialDistance;
          zoomState.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomState.initialScale * scaleChange));

          // Reset position when zoomed out to approximately 1x scale
          if (isApproximatelyOne(zoomState.scale)) {
            zoomState.x = 0;
            zoomState.y = 0;
          } else {
            // Pan based on center movement
            const deltaX = center.x - touchState.lastCenterX;
            const deltaY = center.y - touchState.lastCenterY;

            if (zoomState.scale > MIN_ZOOM) {
              zoomState.x = zoomState.initialX + deltaX / zoomState.scale;
              zoomState.y = zoomState.initialY + deltaY / zoomState.scale;
            }
          }

          applyZoomTransform(lightboxImage);
        }

        touchState.lastCenterX = center.x;
        touchState.lastCenterY = center.y;
        touchState.isZooming = true;
      } else if (touches.length === 1 && zoomState.scale > MIN_ZOOM) {
        // Single touch pan when zoomed
        const touch = touches[0];
        const deltaX = touch.screenX - touchState.lastCenterX;
        const deltaY = touch.screenY - touchState.lastCenterY;

        zoomState.x += deltaX / zoomState.scale;
        zoomState.y += deltaY / zoomState.scale;

        applyZoomTransform(lightboxImage);

        touchState.lastCenterX = touch.screenX;
        touchState.lastCenterY = touch.screenY;
        touchState.isZooming = true; // Prevent navigation during pan
      }
    }

    function handleTouchEnd(e) {
      // Only process swipe if it was a single touch and not a zoom gesture
      if (e.changedTouches.length === 1 && !touchState.isZooming && e.touches.length === 0 && isApproximatelyOne(zoomState.scale)) {
        const touch = e.changedTouches[0];
        touchState.endX = touch.screenX;
        touchState.endY = touch.screenY;

        const swipeDistanceX = touchState.endX - touchState.startX;
        const swipeDistanceY = touchState.endY - touchState.startY;

        // Check if horizontal swipe is more significant than vertical
        if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) &&
            Math.abs(swipeDistanceX) > config.swipeThreshold) {
          // Navigate based on swipe direction
          navigateToImage(swipeDistanceX > 0 ? currentIndex - 1 : currentIndex + 1);
          e.stopPropagation(); // Prevent lightbox from closing
        }
      }

      // Reset zoom state when all touches are lifted
      if (e.touches.length === 0) {
        touchState.isZooming = false;
        touchState.initialDistance = 0;
      }
    }
    
    // Optimized keyboard event handler
    function handleKeyboardNav(e) {
      switch (e.key) {
        case 'ArrowLeft':
          navigateToImage(currentIndex - 1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          navigateToImage(currentIndex + 1);
          e.preventDefault();
          break;
        case 'Escape':
          closeLightbox();
          e.preventDefault();
          break;
      }
    }

    // Optimized close lightbox function
    function closeLightbox() {
      lightbox.style.display = 'none';
      enableBodyScroll();
      document.removeEventListener('keydown', handleKeyboardNav);
    }

    // Optimized navigation handlers
    function createNavigationHandler(direction) {
      return (e) => {
        e.stopPropagation();
        navigateToImage(currentIndex + direction);
      };
    }

    // Show lightbox and set initial image
    lightbox.style.display = 'flex';

    // Preload the initial image and its adjacent images
    preloadImage(images[currentIndex].getAttribute(config.imageUrlAttribute));
    preloadAdjacentImages(currentIndex);

    lightboxImage.src = images[currentIndex].getAttribute(config.imageUrlAttribute);
    resetZoom(lightboxImage); // Reset zoom for initial image
    lightboxImage.classList.add('lite-light-fade-in');

    // Disable scrolling on background
    disableBodyScroll();

    // Remove fade-in class after animation completes
    lightboxImage.addEventListener('animationend', () => {
      lightboxImage.classList.remove('lite-light-fade-in');
    }, { once: true });

    // Set up event listeners efficiently
    lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    lightbox.addEventListener('touchmove', handleTouchMove, { passive: true });
    lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });

    document.addEventListener('keydown', handleKeyboardNav);

    // Set up navigation controls with optimized handlers
    prevButton.addEventListener('click', createNavigationHandler(-1));
    nextButton.addEventListener('click', createNavigationHandler(1));
    closeButton.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      closeLightbox();
    });

    // Close lightbox when clicking on background
    lightbox.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      closeLightbox();
    });
  });
}

// Function to create lightbox HTML
function createLightboxHTML(lightboxClass) {
  const lightboxHTML = `
    <div class="${lightboxClass}">
      <div class="lite-light-prev lite-light-button">
        <span class="lite-light-arrow lite-light-left"></span>
      </div>
      <img style="max-width: 90%; max-height: 90%;" />
      <div class="lite-light-next lite-light-button">
        <span class="lite-light-arrow lite-light-right"></span>
      </div>
      <div class="lite-light-close lite-light-button">
        <span class="lite-light-bar"></span>
        <span class="lite-light-bar"></span>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
}

// Default initialization function
export function init(options) {
  initLiteLight(options);
}
