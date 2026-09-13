import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAnalyticsConsent } from "@/lib/consent";
import { recordTrackingBatch } from "@/lib/analytics.functions";

type TrackingEvent = { type: "page_view" | "click" | "scroll" | "pointer_sample" | "video_progress" | "form_unlocked" | "lead_submitted" | "page_hidden"; targetKey?: "page" | "video" | "pix-form" | "submit-lead" | "whatsapp" | "offer" | "document"; xPercent?: number; yPercent?: number; numericValue?: number };

export function useBehaviorTracking() {
  const sendBatch = useServerFn(recordTrackingBatch);
  const [enabled, setEnabled] = useState(false);
  const sessionId = useRef<string | null>(null);
  const events = useRef<TrackingEvent[]>([]);
  const startedAt = useRef(Date.now());
  const maxVideo = useRef(0);
  const maxScroll = useRef(0);
  const lastPointerAt = useRef(0);

  const flush = useCallback(() => {
    if (!enabled || !sessionId.current || events.current.length === 0) return;
    const batch = events.current.splice(0, 25);
    const width = window.innerWidth;
    void sendBatch({ data: {
      sessionId: sessionId.current, pagePath: "/ufhurd", referrer: document.referrer,
      deviceType: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
      durationMs: Date.now() - startedAt.current, maxVideoSeconds: maxVideo.current,
      maxScrollPercent: maxScroll.current, events: batch,
    }}).catch(() => { events.current.unshift(...batch); });
  }, [enabled, sendBatch]);

  const track = useCallback((event: TrackingEvent) => {
    if (!enabled) return;
    events.current.push(event);
    if (events.current.length >= 20) flush();
  }, [enabled, flush]);

  useEffect(() => {
    const activate = () => setEnabled(getAnalyticsConsent() === "accepted");
    activate();
    window.addEventListener("analytics-consent-changed", activate);
    return () => window.removeEventListener("analytics-consent-changed", activate);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    sessionId.current ??= crypto.randomUUID();
    startedAt.current = Date.now();
    events.current.push({ type: "page_view", targetKey: "page" });
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const percent = available > 0 ? Math.min(100, Math.round((window.scrollY / available) * 100)) : 100;
      if (percent >= maxScroll.current + 10) { maxScroll.current = percent; events.current.push({ type: "scroll", targetKey: "document", numericValue: percent }); }
    };
    const onClick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track]") : null;
      const key = element?.dataset.track;
      if (key === "video" || key === "pix-form" || key === "submit-lead" || key === "whatsapp" || key === "offer") {
        events.current.push({ type: "click", targetKey: key });
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (Date.now() - lastPointerAt.current < 1500) return;
      lastPointerAt.current = Date.now();
      events.current.push({ type: "pointer_sample", targetKey: "page", xPercent: Math.round(event.clientX / window.innerWidth * 100), yPercent: Math.round((event.clientY + window.scrollY) / document.documentElement.scrollHeight * 100) });
    };
    const timer = window.setInterval(flush, 5000);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    document.addEventListener("pointermove", onPointer, { passive: true });
    return () => { window.clearInterval(timer); window.removeEventListener("scroll", onScroll); document.removeEventListener("click", onClick); document.removeEventListener("pointermove", onPointer); flush(); };
  }, [enabled, flush]);

  const trackVideo = useCallback((seconds: number) => {
    const current = Math.floor(seconds);
    if (current <= maxVideo.current) return;
    maxVideo.current = current;
    if (current > 0 && current % 30 === 0) track({ type: "video_progress", targetKey: "video", numericValue: current });
  }, [track]);

  return { enabled, sessionId: sessionId.current, track, trackVideo, flush };
}