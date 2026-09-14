import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTrackingSettings, recordAnalyticsEvent, recordAnalyticsSession } from "@/lib/analytics.functions";
import { Button } from "@/components/ui/button";

type FacebookWindow = Window & { fbq?: (...args: unknown[]) => void; _fbq?: unknown };

function deviceType(): "mobile" | "tablet" | "desktop" {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function targetName(target: EventTarget | null): string {
  const element = target instanceof Element ? target : null;
  return (element?.closest("[data-track]")?.getAttribute("data-track") ?? element?.tagName ?? "unknown").slice(0, 120);
}

function loadMetaPixel(pixelId: string): void {
  const win = window as FacebookWindow;
  if (win.fbq) return;
  const queue = function (...args: unknown[]) {
    queue.callMethod ? queue.callMethod(...args) : queue.queue.push(args);
  } as ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string };
  queue.queue = [];
  queue.loaded = true;
  queue.version = "2.0";
  win.fbq = queue;
  win._fbq = queue;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  win.fbq("consent", "grant");
  win.fbq("init", pixelId);
  win.fbq("track", "PageView");
}

export function BehaviorTracker({ videoSeconds, leadId }: { videoSeconds: number; leadId: string | null }) {
  const sendSession = useServerFn(recordAnalyticsSession);
  const sendEvent = useServerFn(recordAnalyticsEvent);
  const fetchSettings = useServerFn(getTrackingSettings);
  const [consent, setConsent] = useState<boolean | null>(null);
  const sessionId = useRef(crypto.randomUUID());
  const startedAt = useRef(Date.now());
  const clicks = useRef(0);
  const maxScroll = useRef(0);
  const maxVideo = useRef(0);
  const lastVideoBucket = useRef(-1);

  const persist = useCallback(() => {
    if (!consent) return;
    void sendSession({ data: {
      sessionId: sessionId.current,
      pagePath: window.location.pathname,
      referrer: document.referrer || null,
      deviceType: deviceType(),
      durationMs: Date.now() - startedAt.current,
      maxVideoSeconds: maxVideo.current,
      maxScrollPercent: maxScroll.current,
      clickCount: clicks.current,
      leadId,
    } }).catch(() => undefined);
  }, [consent, leadId, sendSession]);

  useEffect(() => {
    const saved = window.localStorage.getItem("analytics-consent");
    if (saved === "granted") setConsent(true);
    if (saved === "denied") setConsent(false);
  }, []);

  useEffect(() => {
    if (!consent) return;
    void fetchSettings().then(({ pixelId, enabled }) => {
      if (enabled && pixelId) loadMetaPixel(pixelId);
    });
    void sendEvent({ data: { sessionId: sessionId.current, eventType: "page_view", targetKey: window.location.pathname } });

    const onClick = (event: MouseEvent) => {
      clicks.current += 1;
      void sendEvent({ data: {
        sessionId: sessionId.current,
        eventType: "click",
        targetKey: targetName(event.target),
        xPercent: Math.round((event.clientX / Math.max(1, window.innerWidth)) * 100),
        yPercent: Math.round((event.clientY / Math.max(1, window.innerHeight)) * 100),
      } }).catch(() => undefined);
    };
    const onScroll = () => {
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const percent = Math.min(100, Math.round((window.scrollY / total) * 100));
      if (percent <= maxScroll.current) return;
      maxScroll.current = percent;
    };
    document.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const interval = window.setInterval(persist, 15_000);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(interval);
      persist();
    };
  }, [consent, fetchSettings, persist, sendEvent]);

  useEffect(() => {
    if (!consent) return;
    maxVideo.current = Math.max(maxVideo.current, Math.floor(videoSeconds));
    const bucket = Math.floor(videoSeconds / 30);
    if (bucket <= lastVideoBucket.current) return;
    lastVideoBucket.current = bucket;
    void sendEvent({ data: {
      sessionId: sessionId.current,
      eventType: "video_progress",
      targetKey: "vturb",
      numericValue: Math.floor(videoSeconds),
    } }).catch(() => undefined);
  }, [consent, sendEvent, videoSeconds]);

  if (consent !== null) return null;
  return (
    <aside className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg">
      <p className="text-sm">Usamos dados de navegação e publicidade para analisar esta página. Nenhum conteúdo digitado é gravado.</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => { window.localStorage.setItem("analytics-consent", "denied"); setConsent(false); }}>Recusar</Button>
        <Button size="sm" onClick={() => { window.localStorage.setItem("analytics-consent", "granted"); setConsent(true); }}>Aceitar</Button>
      </div>
    </aside>
  );
}