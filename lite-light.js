// Lite Light - A lightweight, elegant lightbox utility
// Preloaded images cache
const preloadedImages = {};

// Mobile swipe detection variables
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let initialTouchDistance = 0;
let isZooming = false;

// Function to preload an image
function preloadImage(url) {
  if (!preloadedImages[url]) {
    preloadedImages[url] = new Image();
    preloadedImages[url].src = url;
  }
  return preloadedImages[url];
}

// Helper functions to control background scrolling
function disableBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflowY = 'scroll';
}

function enableBodyScroll() {
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflowY = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
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

  document.addEventListener('click', (e) => {
    // Only proceed if an image with the specified attribute was clicked
    if (e.target.tagName !== 'IMG' || !e.target.hasAttribute(config.imageUrlAttribute)) return;

    const images = Array.from(document.querySelectorAll(config.imageSelector));
    let currentIndex = images.findIndex(img => img === e.target);
    const lightbox = document.querySelector(`.${config.lightboxClass}`);
    const lightboxImage = lightbox.querySelector('img');
    
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
    
    // Touch event handlers
    function getTouchDistance(touches) {
      if (touches.length < 2) return 0;
      
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      return Math.sqrt(
        Math.pow(touch2.screenX - touch1.screenX, 2) + 
        Math.pow(touch2.screenY - touch1.screenY, 2)
      );
    }
    
    function handleTouchStart(e) {
      if (e.touches.length === 1) {
        // Single touch - potential swipe
        touchStartX = e.touches[0].screenX;
        touchStartY = e.touches[0].screenY;
        isZooming = false;
      } else if (e.touches.length === 2) {
        // Multi-touch - pinch gesture
        initialTouchDistance = getTouchDistance(e.touches);
        isZooming = true;
      }
    }
    
    function handleTouchMove(e) {
      if (e.touches.length === 2) {
        // Continue tracking pinch gesture
        isZooming = true;
        const currentDistance = getTouchDistance(e.touches);
        
        // If there's significant distance change, it's definitely a zoom
        if (Math.abs(currentDistance - initialTouchDistance) > 50) {
          isZooming = true;
        }
      }
    }
    
    function handleTouchEnd(e) {
      // Only process swipe if it was a single touch and not a zoom gesture
      if (e.changedTouches.length === 1 && !isZooming && e.touches.length === 0) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = touchEndY - touchStartY;
        
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
        isZooming = false;
        initialTouchDistance = 0;
      }
    }
    
    // Keyboard event handler for arrow keys
    function handleKeyboardNav(e) {
      if (e.key === 'ArrowLeft') {
        // Left arrow - previous image
        navigateToImage(currentIndex - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        // Right arrow - next image
        navigateToImage(currentIndex + 1);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        // ESC key - close lightbox
        closeLightbox();
        e.preventDefault();
      }
    }
    
    // Show lightbox and set initial image
    lightbox.style.display = 'flex';
    
    // Preload the initial image and its adjacent images
    preloadImage(images[currentIndex].getAttribute(config.imageUrlAttribute));
    preloadAdjacentImages(currentIndex);
    
    lightboxImage.src = images[currentIndex].getAttribute(config.imageUrlAttribute);
    lightboxImage.classList.add('lite-light-fade-in');
    
    // Disable scrolling on background
    disableBodyScroll();
    
    // Remove fade-in class after animation completes
    lightboxImage.addEventListener('animationend', () => {
      lightboxImage.classList.remove('lite-light-fade-in');
    }, { once: true });
    
    // Set up touch events for mobile
    lightbox.removeEventListener('touchstart', handleTouchStart);
    lightbox.removeEventListener('touchmove', handleTouchMove);
    lightbox.removeEventListener('touchend', handleTouchEnd);
    lightbox.addEventListener('touchstart', handleTouchStart);
    lightbox.addEventListener('touchmove', handleTouchMove);
    lightbox.addEventListener('touchend', handleTouchEnd);
    
    // Set up keyboard navigation
    document.removeEventListener('keydown', handleKeyboardNav);
    document.addEventListener('keydown', handleKeyboardNav);
    
    // Set up navigation controls
    lightbox.querySelector('.lite-light-prev').onclick = (e) => {
      e.stopPropagation();
      navigateToImage(currentIndex - 1);
    };
    
    lightbox.querySelector('.lite-light-next').onclick = (e) => {
      e.stopPropagation();
      navigateToImage(currentIndex + 1);
    };
    
    // Close lightbox and remove keyboard event listener
    function closeLightbox() {
      lightbox.style.display = 'none';
      enableBodyScroll(); // Re-enable scrolling
      document.removeEventListener('keydown', handleKeyboardNav);
    }
    
    lightbox.querySelector('.lite-light-close').onclick = (e) => {
      e.stopPropagation();
      closeLightbox();
    };
    
    lightbox.onclick = () => {
      closeLightbox();
    };
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