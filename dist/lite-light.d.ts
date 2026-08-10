export interface LiteLightOptions {
  /**
   * CSS selector for gallery triggers. Default: `'img[data-lightbox]'`.
   * Use `'a[data-lightbox]'` for text links, or
   * `'img[data-lightbox], a[data-lightbox]'` to mix images and links.
   */
  imageSelector?: string;
  /** Attribute on each trigger that holds the full-size image URL. Default: `'data-lightbox'`. */
  imageUrlAttribute?: string;
  lightboxClass?: string;
  swipeThreshold?: number;
  fadeAnimationDuration?: number;
}

export function init(options?: LiteLightOptions): void;
export function initLiteLight(options?: LiteLightOptions): void;
