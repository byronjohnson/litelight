// Lite Light - A lightweight, elegant lightbox utility
// Preloaded images cache
const preloadedImages = {};

// Mobile swipe detection variables
let touchStartX = 0;
let touchEndX = 0;

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
    function handleTouchStart(e) {
      touchStartX = e.changedTouches[0].screenX;
    }
    
    function handleTouchEnd(e) {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchEndX - touchStartX;
      
      // If the swipe distance is significant enough
      if (Math.abs(swipeDistance) > config.swipeThreshold) {
        // Navigate based on swipe direction
        navigateToImage(swipeDistance > 0 ? currentIndex - 1 : currentIndex + 1);
        e.stopPropagation(); // Prevent lightbox from closing
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
    lightbox.removeEventListener('touchend', handleTouchEnd);
    lightbox.addEventListener('touchstart', handleTouchStart);
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