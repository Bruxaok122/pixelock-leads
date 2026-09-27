declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: Window["fbq"];
  }
}

let activePixelId: string | null = null;
const LEGACY_PIXEL_ID = "1721826848934056";

/** Prepare the queue before third-party video scripts can initialize a retired pixel. */
export function preventLegacyPixel(): void {
  if (typeof window === "undefined" || window.fbq) return;

  const fbq = (...args: unknown[]) => {
    if (args[0] === "init" && args[1] === LEGACY_PIXEL_ID) return;
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  fbq.queue = [] as unknown[][];
  fbq.callMethod = undefined as ((...args: unknown[]) => void) | undefined;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
}

/** Initialize the configured pixel once; subsequent page visits can still send PageView. */
export function initializeMetaPixel(pixelId: string): void {
  if (!/^\d{5,20}$/.test(pixelId)) return;
  if (pixelId === LEGACY_PIXEL_ID) return;

  preventLegacyPixel();
  if (!document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  if (activePixelId !== pixelId) {
    window.fbq("init", pixelId);
    activePixelId = pixelId;
  }
  window.fbq("trackSingle", pixelId, "PageView");
}

export function trackMetaEvent(eventName: "ViewContent" | "Lead" | "InitiateCheckout"): void {
  if (!activePixelId) return;
  window.fbq?.("trackSingle", activePixelId, eventName);
}