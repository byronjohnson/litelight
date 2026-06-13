// LiteLight - A lightweight, elegant lightbox utility
// Author: Byron Johnson
// License: MIT

// Initialization guard to prevent duplicate listeners
let initialized = false;

// Preloaded images cache (capped LRU)
const PRELOAD_CACHE_MAX = 20;
const preloadedImages = new Map();

// Touch and zoom state variables
let touchState = {
  startX: 0,
  startY: 0,
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

// rAF batching flag for zoom transforms
let rafPending = false;

const mobileMediaQuery = typeof window !== 'undefined'
  ? window.matchMedia('(max-width: 768px)')
  : { matches: false };

// Utility functions
function preloadImage(url) {
  if (preloadedImages.has(url)) {
    const img = preloadedImages.get(url);
    preloadedImages.delete(url);
    preloadedImages.set(url, img);
    return img;
  }

  if (preloadedImages.size >= PRELOAD_CACHE_MAX) {
    const oldestKey = preloadedImages.keys().next().value;
    preloadedImages.delete(oldestKey);
  }

  const img = new Image();
  img.src = url;
  preloadedImages.set(url, img);
  return img;
}

function scheduleIdlePreload(fn) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
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
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflowY = '';

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
}

function scheduleZoomUpdate(imageElement) {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      applyZoomTransform(imageElement);
      rafPending = false;
    });
  }
}

function resetZoom(imageElement, smooth = false) {
  const wasZoomed = !isApproximatelyOne(zoomState.scale) || zoomState.x !== 0 || zoomState.y !== 0;
  zoomState.scale = 1;
  zoomState.x = 0;
  zoomState.y = 0;

  if (smooth && wasZoomed) {
    imageElement.style.transition = 'transform 0.2s ease';
    applyZoomTransform(imageElement);
    imageElement.addEventListener('transitionend', () => {
      imageElement.style.transition = '';
    }, { once: true });
  } else {
    imageElement.style.transition = '';
    applyZoomTransform(imageElement);
  }
}

function isApproximatelyOne(value) {
  return Math.abs(value - 1) < ZOOM_TOLERANCE;
}

// Initialize lightbox functionality
export function initLiteLight(options = {}) {
  if (initialized) return;
  initialized = true;

  const config = {
    imageSelector: options.imageSelector || 'img[data-lightbox]',
    imageUrlAttribute: options.imageUrlAttribute || 'data-lightbox',
    lightboxClass: options.lightboxClass || 'lite-light',
    swipeThreshold: options.swipeThreshold || 50,
    fadeAnimationDuration: options.fadeAnimationDuration || 150,
    ...options
  };

  if (!document.querySelector(`.${config.lightboxClass}`)) {
    createLightboxHTML(config.lightboxClass);
  }

  const lightbox = document.querySelector(`.${config.lightboxClass}`);
  const lightboxImage = lightbox.querySelector('img');
  const prevButton = lightbox.querySelector('.lite-light-prev');
  const nextButton = lightbox.querySelector('.lite-light-next');
  const closeButton = lightbox.querySelector('.lite-light-close');

  document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'IMG' || !e.target.hasAttribute(config.imageUrlAttribute)) return;

    const images = Array.from(document.querySelectorAll(config.imageSelector));
    let currentIndex = images.findIndex(img => img === e.target);
    let isNavigating = false;

    function preloadAdjacentImages(currentIdx) {
      const prevIdx = (currentIdx - 1 + images.length) % images.length;
      const nextIdx = (currentIdx + 1) % images.length;

      preloadImage(images[prevIdx].getAttribute(config.imageUrlAttribute));
      preloadImage(images[nextIdx].getAttribute(config.imageUrlAttribute));
    }

    function navigateToImage(index) {
      if (isNavigating) return;
      isNavigating = true;

      currentIndex = (index + images.length) % images.length;

      const nextImageUrl = images[currentIndex].getAttribute(config.imageUrlAttribute);
      const preloaded = preloadImage(nextImageUrl);

      const startFade = () => {
        lightboxImage.classList.add('lite-light-fade-out');

        lightboxImage.addEventListener('animationend', function handleFade() {
          const applyImage = () => {
            lightboxImage.src = nextImageUrl;
            lightboxImage.alt = images[currentIndex].alt || '';
            resetZoom(lightboxImage);
            lightboxImage.classList.remove('lite-light-fade-out');
            lightboxImage.classList.add('lite-light-fade-in');

            scheduleIdlePreload(() => preloadAdjacentImages(currentIndex));

            lightboxImage.addEventListener('animationend', function() {
              lightboxImage.classList.remove('lite-light-fade-in');
              isNavigating = false;
            }, { once: true });
          };

          if (preloaded.decode) {
            preloaded.decode().then(applyImage).catch(applyImage);
          } else {
            applyImage();
          }

          lightboxImage.removeEventListener('animationend', handleFade);
        }, { once: true });
      };

      if (!isApproximatelyOne(zoomState.scale)) {
        resetZoom(lightboxImage, true);
        lightboxImage.addEventListener('transitionend', startFade, { once: true });
      } else {
        startFade();
      }
    }

    function performAction(action) {
      switch (action) {
        case 'close':
          closeLightbox();
          break;
        case 'prev':
          navigateToImage(currentIndex - 1);
          break;
        case 'next':
          navigateToImage(currentIndex + 1);
          break;
      }
    }

    function handleTouchStart(e) {
      const touches = e.touches;

      if (touches.length === 1) {
        const touch = touches[0];
        touchState.startX = touch.screenX;
        touchState.startY = touch.screenY;
        touchState.lastCenterX = touch.screenX;
        touchState.lastCenterY = touch.screenY;
        touchState.isZooming = false;

        zoomState.initialScale = zoomState.scale;
        zoomState.initialX = zoomState.x;
        zoomState.initialY = zoomState.y;
      } else if (touches.length === 2) {
        touchState.initialDistance = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        touchState.lastCenterX = center.x;
        touchState.lastCenterY = center.y;

        zoomState.initialScale = zoomState.scale;
        zoomState.initialX = zoomState.x;
        zoomState.initialY = zoomState.y;
        touchState.isZooming = true;
      }
    }

    function handleTouchMove(e) {
      const touches = e.touches;

      if (touches.length === 2) {
        const currentDistance = getTouchDistance(touches);
        const center = getTouchCenter(touches);

        if (touchState.initialDistance > 0) {
          const scaleChange = currentDistance / touchState.initialDistance;
          zoomState.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomState.initialScale * scaleChange));

          if (isApproximatelyOne(zoomState.scale)) {
            zoomState.x = 0;
            zoomState.y = 0;
          } else {
            const deltaX = center.x - touchState.lastCenterX;
            const deltaY = center.y - touchState.lastCenterY;

            if (zoomState.scale > MIN_ZOOM) {
              zoomState.x = zoomState.initialX + deltaX / zoomState.scale;
              zoomState.y = zoomState.initialY + deltaY / zoomState.scale;
            }
          }

          scheduleZoomUpdate(lightboxImage);
        }

        touchState.lastCenterX = center.x;
        touchState.lastCenterY = center.y;
        touchState.isZooming = true;
      } else if (touches.length === 1 && zoomState.scale > MIN_ZOOM) {
        const touch = touches[0];
        const deltaX = touch.screenX - touchState.lastCenterX;
        const deltaY = touch.screenY - touchState.lastCenterY;

        zoomState.x += deltaX / zoomState.scale;
        zoomState.y += deltaY / zoomState.scale;

        scheduleZoomUpdate(lightboxImage);

        touchState.lastCenterX = touch.screenX;
        touchState.lastCenterY = touch.screenY;
        touchState.isZooming = true;
      }
    }

    function handleTouchEnd(e) {
      if (e.changedTouches.length === 1 && !touchState.isZooming && e.touches.length === 0 && isApproximatelyOne(zoomState.scale)) {
        const touch = e.changedTouches[0];
        const swipeDistanceX = touch.screenX - touchState.startX;
        const swipeDistanceY = touch.screenY - touchState.startY;

        if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) &&
            Math.abs(swipeDistanceX) > config.swipeThreshold) {
          navigateToImage(swipeDistanceX > 0 ? currentIndex - 1 : currentIndex + 1);
          e.stopPropagation();
        }
      }

      if (e.touches.length === 0) {
        if (isApproximatelyOne(zoomState.scale) && zoomState.scale !== 1) {
          resetZoom(lightboxImage, true);
        }
        touchState.isZooming = false;
        touchState.initialDistance = 0;
      }
    }

    function handleKeyboardNav(e) {
      switch (e.key) {
        case 'ArrowLeft':
          performAction('prev');
          e.preventDefault();
          break;
        case 'ArrowRight':
          performAction('next');
          e.preventDefault();
          break;
        case 'Escape':
          performAction('close');
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          if (document.activeElement === closeButton) {
            performAction('close');
            e.preventDefault();
          } else if (document.activeElement === prevButton && !mobileMediaQuery.matches) {
            performAction('prev');
            e.preventDefault();
          } else if (document.activeElement === nextButton && !mobileMediaQuery.matches) {
            performAction('next');
            e.preventDefault();
          }
          break;
      }
    }

    function handleFocusTrap(e) {
      if (e.key !== 'Tab') return;

      const focusableElements = mobileMediaQuery.matches
        ? [closeButton]
        : [closeButton, prevButton, nextButton];

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || !lightbox.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement || !lightbox.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    function handleControlClick(e) {
      e.stopPropagation();
      const target = e.currentTarget;
      if (target === closeButton) performAction('close');
      else if (target === prevButton) performAction('prev');
      else if (target === nextButton) performAction('next');
    }

    function handleBackgroundClick(e) {
      e.stopPropagation();
      performAction('close');
    }

    function closeLightbox() {
      lightbox.classList.remove('lite-light-active');
      resetZoom(lightboxImage, true);
      enableBodyScroll();

      document.removeEventListener('keydown', handleKeyboardNav);
      document.removeEventListener('keydown', handleFocusTrap);
      lightbox.removeEventListener('touchstart', handleTouchStart);
      lightbox.removeEventListener('touchmove', handleTouchMove);
      lightbox.removeEventListener('touchend', handleTouchEnd);
      prevButton.removeEventListener('click', handleControlClick);
      nextButton.removeEventListener('click', handleControlClick);
      closeButton.removeEventListener('click', handleControlClick);
      lightbox.removeEventListener('click', handleBackgroundClick);
    }

    lightbox.classList.add('lite-light-active');

    preloadImage(images[currentIndex].getAttribute(config.imageUrlAttribute));
    scheduleIdlePreload(() => preloadAdjacentImages(currentIndex));

    lightboxImage.src = images[currentIndex].getAttribute(config.imageUrlAttribute);
    lightboxImage.alt = images[currentIndex].alt || '';
    resetZoom(lightboxImage);
    lightboxImage.classList.add('lite-light-fade-in');

    disableBodyScroll();
    closeButton.focus();

    lightboxImage.addEventListener('animationend', () => {
      lightboxImage.classList.remove('lite-light-fade-in');
    }, { once: true });

    lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    lightbox.addEventListener('touchmove', handleTouchMove, { passive: true });
    lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });

    document.addEventListener('keydown', handleKeyboardNav);
    document.addEventListener('keydown', handleFocusTrap);

    prevButton.addEventListener('click', handleControlClick);
    nextButton.addEventListener('click', handleControlClick);
    closeButton.addEventListener('click', handleControlClick);
    lightbox.addEventListener('click', handleBackgroundClick);
  });
}

function createLightboxHTML(lightboxClass) {
  const lightboxHTML = `
    <div class="${lightboxClass}" role="dialog" aria-modal="true" aria-label="Image lightbox">
      <div class="lite-light-prev lite-light-button" role="button" aria-label="Previous image" tabindex="0">
        <span class="lite-light-arrow lite-light-left"></span>
      </div>
      <img alt="" />
      <div class="lite-light-next lite-light-button" role="button" aria-label="Next image" tabindex="0">
        <span class="lite-light-arrow lite-light-right"></span>
      </div>
      <div class="lite-light-close lite-light-button" role="button" aria-label="Close lightbox" tabindex="0">
        <span class="lite-light-bar"></span>
        <span class="lite-light-bar"></span>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
}

export function init(options) {
  initLiteLight(options);
}
