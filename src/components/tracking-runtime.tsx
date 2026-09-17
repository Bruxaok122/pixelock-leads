import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { getTrackingSettings, trackVisitorEvent } from "@/lib/tracking.functions";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: Window["fbq"];
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createSessionId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getSessionId() {
  const key = "ufhurd_tracking_session";

  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing && UUID_PATTERN.test(existing)) return existing;

    const value = createSessionId();
    window.sessionStorage.setItem(key, value);
    return value;
  } catch {
    return createSessionId();
  }
}

export function TrackingRuntime({
  videoSeconds,
  converted,
  pixUnlocked,
}: {
  videoSeconds: number;
  converted: boolean;
  pixUnlocked: boolean;
}) {
  const getSettings = useServerFn(getTrackingSettings);
  const sendEvent = useServerFn(trackVisitorEvent);
  const sessionIdRef = useRef<string | null>(null);
  const lastSecondRef = useRef(0);
  const playedRef = useRef(false);
  const pixUnlockedRef = useRef(false);
  const convertedRef = useRef(converted);
  const videoSecondsRef = useRef(videoSeconds);

  useEffect(() => {
    convertedRef.current = converted;
    videoSecondsRef.current = videoSeconds;
  }, [converted, videoSeconds]);

  useEffect(() => {
    const sessionId = getSessionId();
    sessionIdRef.current = sessionId;

    // Registra a sessão imediatamente ao abrir /ufhurd.
    void sendEvent({
      data: {
        sessionId,
        eventName: "PageView",
        videoSeconds: 0,
        videoPlayed: false,
        converted: convertedRef.current,
      },
    });

    void getSettings().then((settings) => {
      if (!settings.pixelEnabled || !settings.pixelId) return;
      if (document.querySelector(`[data-dynamic-pixel="${settings.pixelId}"]`)) return;

      const script = document.createElement("script");
      script.dataset["dynamicPixel"] = settings.pixelId;
      script.innerHTML = `
        !function(f,b,e,v,n,t,s){
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
          s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
        }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.pixelId.replaceAll("'", "")}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    });
  }, [getSettings, sendEvent]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    if (videoSeconds > 0) playedRef.current = true;

    const justUnlocked = pixUnlocked && !pixUnlockedRef.current;
    if (pixUnlocked) pixUnlockedRef.current = true;

    const shouldSend =
      (videoSeconds > 0 && videoSeconds - lastSecondRef.current >= 10) ||
      justUnlocked ||
      converted;

    if (!shouldSend) return;
    lastSecondRef.current = videoSeconds;

    void sendEvent({
      data: {
        sessionId,
        eventName: converted ? "Lead" : justUnlocked ? "PixUnlocked" : "VideoProgress",
        videoSeconds,
        videoPlayed: playedRef.current,
        converted,
      },
    });
  }, [converted, pixUnlocked, sendEvent, videoSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      void sendEvent({
        data: {
          sessionId,
          eventName: playedRef.current ? "Heartbeat" : "PageView",
          videoSeconds: videoSecondsRef.current,
          videoPlayed: playedRef.current,
          converted: convertedRef.current,
        },
      });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [sendEvent]);

  return null;
}