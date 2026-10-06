import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { getTrackingSettings, trackVisitorEvent } from "@/lib/tracking.functions";
import { initializeMetaPixel, trackMetaEvent } from "@/lib/meta-pixel";
import { getUtmifySettings } from "@/lib/utmify.functions";
import { initializeUtmifyPixel } from "@/lib/utmify-pixel";

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
  videoPlaying,
}: {
  videoSeconds: number;
  converted: boolean;
  pixUnlocked: boolean;
  videoPlaying: boolean;
}) {
  const getSettings = useServerFn(getTrackingSettings);
  const getUtmify = useServerFn(getUtmifySettings);
  const sendEvent = useServerFn(trackVisitorEvent);
  const sessionIdRef = useRef<string | null>(null);
  const lastSecondRef = useRef(0);
  const playedRef = useRef(false);
  const pixUnlockedRef = useRef(false);
  const convertedRef = useRef(converted);
  const videoSecondsRef = useRef(videoSeconds);
  const videoPlayingRef = useRef(videoPlaying);
  const lastTypingAtRef = useRef(0);
  const leadSubmittedRef = useRef(converted);
  const viewContentSentRef = useRef(false);
  const checkoutClickedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getUtmify().then((settings) => {
      if (active && settings.enabled && settings.pixelId) initializeUtmifyPixel(settings.pixelId);
    }).catch(() => {
      // UTMify failure must not interrupt the video, leads or Meta tracking.
    });
    return () => { active = false; };
  }, [getUtmify]);

  useEffect(() => {
    convertedRef.current = converted;
    videoSecondsRef.current = videoSeconds;
  }, [converted, videoSeconds]);

  useEffect(() => {
    let active = true;
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
      if (active && settings.pixelEnabled && settings.pixelId) initializeMetaPixel(settings.pixelId);
    }).catch(() => {
      // A temporary settings failure must not interrupt visitor tracking.
    });

    const handlePageExit = () => {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;

      void sendEvent({
        data: {
          sessionId: currentSessionId,
          eventName: "PageExit",
          videoSeconds: videoSecondsRef.current,
          videoPlayed: playedRef.current,
          converted: convertedRef.current,
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // O checkout abre em outra aba; não substitua o clique por uma saída.
        if (checkoutClickedRef.current) return;
        handlePageExit();
        return;
      }

      sendImmediateEvent("Heartbeat");
    };

    const sendImmediateEvent = (eventName: string) => {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;

      void sendEvent({
        data: {
          sessionId: currentSessionId,
          eventName,
          videoSeconds: videoSecondsRef.current,
          videoPlayed: playedRef.current,
          converted: convertedRef.current,
        },
      });
    };

    const handleInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

      const now = Date.now();
      if (target.id === "pix-key") {
        if (now - lastTypingAtRef.current >= 350) {
          lastTypingAtRef.current = now;
          sendImmediateEvent("PixTyping");
        }
      } else if (target.id === "whatsapp") {
        if (now - lastTypingAtRef.current >= 350) {
          lastTypingAtRef.current = now;
          sendImmediateEvent("WhatsAppTyping");
        }
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.id === "pix-key") sendImmediateEvent("PixFocused");
      if (target.id === "whatsapp") sendImmediateEvent("WhatsAppFocused");
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.id === "pix-key") {
        sendImmediateEvent("PixBlurred");
      }
      if (target.id === "whatsapp") {
        sendImmediateEvent("WhatsAppBlurred");
      }
    };

    const handleBackIntercepted = () => sendImmediateEvent("BackIntercepted");
    const handleCheckoutClicked = () => {
      checkoutClickedRef.current = true;
      sendImmediateEvent("CheckoutClicked");
    };
    const handleLeadSubmitted = () => {
      if (leadSubmittedRef.current) return;
      leadSubmittedRef.current = true;
      trackMetaEvent("Lead");
      sendImmediateEvent("Lead");
    };

    window.addEventListener("pagehide", handlePageExit);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    window.addEventListener("ufhurd:back-intercepted", handleBackIntercepted);
    window.addEventListener("ufhurd:checkout-clicked", handleCheckoutClicked);
    window.addEventListener("ufhurd:lead-submitted", handleLeadSubmitted);

    return () => {
      active = false;
      window.removeEventListener("pagehide", handlePageExit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      window.removeEventListener("ufhurd:back-intercepted", handleBackIntercepted);
      window.removeEventListener("ufhurd:checkout-clicked", handleCheckoutClicked);
      window.removeEventListener("ufhurd:lead-submitted", handleLeadSubmitted);
    };
  }, [getSettings, sendEvent]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    if (videoSeconds > 0) playedRef.current = true;
    if (videoSeconds > 0 && !viewContentSentRef.current) {
      viewContentSentRef.current = true;
      trackMetaEvent("ViewContent");
    }

    const justUnlocked = pixUnlocked && !pixUnlockedRef.current;
    if (pixUnlocked) pixUnlockedRef.current = true;

    const justConverted = converted && !leadSubmittedRef.current;
    if (justConverted) leadSubmittedRef.current = true;

    const shouldSend =
      (videoSeconds > 0 && videoSeconds - lastSecondRef.current >= 10) ||
      justUnlocked ||
      justConverted;

    if (!shouldSend) return;
    lastSecondRef.current = videoSeconds;

    void sendEvent({
      data: {
        sessionId,
        eventName: justConverted ? "Lead" : justUnlocked ? "PixUnlocked" : "VideoProgress",
        videoSeconds,
        videoPlayed: playedRef.current,
        converted,
      },
    });
  }, [converted, pixUnlocked, sendEvent, videoSeconds]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    const eventName = videoPlaying ? "VideoPlay" : "VideoPause";
    if (videoPlaying === videoPlayingRef.current) return;

    videoPlayingRef.current = videoPlaying;
    void sendEvent({
      data: {
        sessionId,
        eventName,
        videoSeconds,
        videoPlayed: videoPlaying || playedRef.current,
        converted: convertedRef.current,
      },
    });
  }, [sendEvent, videoPlaying, videoSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const sessionId = sessionIdRef.current;
      // Uma aba de pagamento aberta em primeiro plano não mantém a visita online.
      if (!sessionId || (checkoutClickedRef.current && document.visibilityState === "hidden")) return;

      void sendEvent({
        data: {
          sessionId,
          eventName: "Heartbeat",
          videoSeconds: videoSecondsRef.current,
          videoPlayed: playedRef.current,
          converted: convertedRef.current,
        },
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [sendEvent]);

  return null;
}