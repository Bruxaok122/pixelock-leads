import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getTrackingSettings } from "@/lib/analytics.functions";
import { getAnalyticsConsent } from "@/lib/consent";

declare global { interface Window { fbq?: (...args: unknown[]) => void; _fbq?: unknown } }

export function MetaPixel() {
  const getSettings = useServerFn(getTrackingSettings);
  useEffect(() => {
    const load = async () => {
      if (window.location.pathname !== "/ufhurd" || getAnalyticsConsent() !== "accepted") return;
      const settings = await getSettings();
      if (!settings.enabled || !settings.pixelId || window.fbq) return;
      const queue = function (...args: unknown[]) { (queue as unknown as { callMethod?: (...values: unknown[]) => void; queue: unknown[][] }).callMethod?.(...args) ?? (queue as unknown as { queue: unknown[][] }).queue.push(args); };
      Object.assign(queue, { queue: [], loaded: true, version: "2.0" });
      window.fbq = queue;
      const script = document.createElement("script"); script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(script);
      window.fbq("init", settings.pixelId); window.fbq("track", "PageView");
    };
    void load();
    const onConsent = () => void load();
    window.addEventListener("analytics-consent-changed", onConsent);
    return () => window.removeEventListener("analytics-consent-changed", onConsent);
  }, [getSettings]);
  return null;
}