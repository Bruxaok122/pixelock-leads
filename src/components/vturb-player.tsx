import { createElement, useEffect, useRef } from "react";

const ACCOUNT_ID = "f17b7cf5-56fb-4776-bb77-71769cdf107c";
const PLAYER_ID = "6aa1f56413889c63d1af501d";
const PLAYER_SRC = `https://scripts.converteai.net/${ACCOUNT_ID}/players/${PLAYER_ID}/v4/player.js`;

function loadPlayerScript(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${PLAYER_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = PLAYER_SRC;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Lê o tempo atual do vídeo. O smartplayer expõe a instância global, mas o
 * caminho mais confiável é o <video> dentro do shadow DOM do custom element.
 */
function readCurrentTime(host: HTMLElement | null): number | null {
  try {
    const shadowVideo = host?.shadowRoot?.querySelector("video") as HTMLVideoElement | null;
    if (shadowVideo && Number.isFinite(shadowVideo.currentTime)) return shadowVideo.currentTime;

    const lightVideo = host?.querySelector("video") as HTMLVideoElement | null;
    if (lightVideo && Number.isFinite(lightVideo.currentTime)) return lightVideo.currentTime;

    const w = window as unknown as {
      smartplayer?: { instances?: Array<{ video?: HTMLVideoElement; getCurrentTime?: () => number }> };
    };
    const instance = w.smartplayer?.instances?.[0];
    if (instance?.video && Number.isFinite(instance.video.currentTime)) return instance.video.currentTime;
    if (typeof instance?.getCurrentTime === "function") {
      const value = instance.getCurrentTime();
      if (Number.isFinite(value)) return value;
    }
  } catch {
    /* noop */
  }
  return null;
}

export function VturbPlayer({
  onTime,
  onPlaybackChange,
}: {
  onTime: (seconds: number) => void;
  onPlaybackChange?: (playing: boolean) => void;
}) {
  const hostRef = useRef<HTMLElement | null>(null);
  const onTimeRef = useRef(onTime);
  const onPlaybackChangeRef = useRef(onPlaybackChange);
  onTimeRef.current = onTime;
  onPlaybackChangeRef.current = onPlaybackChange;

  useEffect(() => {
    loadPlayerScript();

    let lastPlaying: boolean | null = null;

    const interval = setInterval(() => {
      const video =
        (hostRef.current?.shadowRoot?.querySelector("video") as HTMLVideoElement | null) ??
        (hostRef.current?.querySelector("video") as HTMLVideoElement | null);

      const seconds = readCurrentTime(hostRef.current);
      if (seconds !== null) onTimeRef.current(seconds);

      if (video && lastPlaying !== !video.paused) {
        lastPlaying = !video.paused;
        onPlaybackChangeRef.current?.(lastPlaying);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // O custom element do smartplayer nao existe em JSX.IntrinsicElements,
  // portanto e criado via createElement com tipagem generica.
  return (
    <div className="overflow-hidden rounded-[15px]">
      {createElement("vturb-smartplayer", {
        ref: hostRef,
        id: `vid-${PLAYER_ID}`,
        style: { display: "block", margin: "0 auto", width: "100%" },
      })}
    </div>
  );
}
