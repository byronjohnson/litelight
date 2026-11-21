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
  /**
   * Attribute that collapses a gallery to one visible trigger. Default: `'data-lightbox-cover'`.
   * Put it on a wrapper or on each trigger in the set. The other triggers stay in the
   * DOM and open inside the lightbox. A parent that contains only a hidden trigger is hidden
   * with it. The hide pass runs once, when `init()` is called. Omit it and every trigger stays visible.
   */
  coverAttribute?: string;
  /**
   * Attribute that marks the visible trigger in a cover gallery. Default: `'data-lightbox-thumb'`.
   * Put it on one trigger. When no trigger has it, the first trigger in the set stays visible.
   */
  thumbAttribute?: string;
}

export function init(options?: LiteLightOptions): void;
export function initLiteLight(options?: LiteLightOptions): void;
