export interface LiteLightOptions {
  imageSelector?: string;
  imageUrlAttribute?: string;
  lightboxClass?: string;
  swipeThreshold?: number;
  fadeAnimationDuration?: number;
}

export function init(options?: LiteLightOptions): void;
export function initLiteLight(options?: LiteLightOptions): void;
