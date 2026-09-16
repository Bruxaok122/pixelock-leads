import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { getTrackingSettings, trackVisitorEvent } from "@/lib/tracking.functions";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: Window["fbq"];
  }
}

function getSessionId() {
  const key = "ufhurd_tracking_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const value = `${crypto.randomUUID().replaceAll("-", "")}${Date.now()}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export function TrackingRuntime({
  videoSeconds,
  converted,
}: {
  videoSeconds: number;
  converted: boolean;
}) {
  const getSettings = useServerFn(getTrackingSettings);
  const sendEvent = useServerFn(trackVisitorEvent);
  const sessionIdRef = useRef<string | null>(null);
  const lastSecondRef = useRef(0);
  const playedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = getSessionId();

    void getSettings().then((settings) => {
      if (!settings.pixelEnabled || !settings.pixelId) return;
      if (document.querySelector(`[data-dynamic-pixel="${settings.pixelId}"]`)) return;

      const script = document.createElement("script");
      script.dataset.dynamicPixel = settings.pixelId;
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

    return () => {
      // A sessão permanece válida durante a visita; o heartbeat identifica
      // quando o visitante deixa de enviar atualizações.
    };
  }, [getSettings]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    const isPlaying = videoSeconds > 0;
    if (isPlaying) playedRef.current = true;

    const shouldSend =
      videoSeconds === 0 ||
      videoSeconds - lastSecondRef.current >= 10 ||
      converted;

    if (!shouldSend) return;
    lastSecondRef.current = videoSeconds;

    void sendEvent({
      data: {
        sessionId,
        eventName: converted ? "Lead" : playedRef.current ? "VideoProgress" : "PageView",
        videoSeconds,
        videoPlayed: playedRef.current,
        converted,
      },
    });
  }, [converted, sendEvent, videoSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      void sendEvent({
        data: {
          sessionId,
          eventName: playedRef.current ? "Heartbeat" : "PageView",
          videoSeconds: lastSecondRef.current,
          videoPlayed: playedRef.current,
          converted,
        },
      });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [converted, sendEvent]);

  return null;
}