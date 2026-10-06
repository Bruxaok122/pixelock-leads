const PIXEL_SRC = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";

/** Load only after persisted settings arrive; never initialize a second pixel. */
export function initializeUtmifyPixel(pixelId: string): void {
  if (typeof document === "undefined" || document.querySelector(`script[src="${PIXEL_SRC}"]`)) return;
  (window as Window & { pixelId?: string }).pixelId = pixelId;
  const script = document.createElement("script");
  script.src = PIXEL_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}