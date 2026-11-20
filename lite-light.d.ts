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
  /**
   * Attribute that names an independent gallery. Default: `'data-lightbox-group'`.
   * Triggers with the same value (on the trigger or an ancestor) navigate only
   * among themselves. Triggers without the attribute stay in one shared gallery.
   * A group of one image hides prev/next.
   */
  groupAttribute?: string;
}

export function init(options?: LiteLightOptions): void;
export function initLiteLight(options?: LiteLightOptions): void;
