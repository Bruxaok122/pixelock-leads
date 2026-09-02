import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://player.vimeo.com/api/player.js";

function loadVimeoScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { Vimeo?: unknown };
  if (w.Vimeo) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve(), { once: true }));
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    document.body.appendChild(script);
  });
}

export function VimeoPlayer({
  videoId,
  onTime,
  hash,
}: {
  videoId: string;
  onTime: (seconds: number) => void;
  hash?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const onTimeRef = useRef(onTime);
  onTimeRef.current = onTime;

  useEffect(() => {
    let cancelled = false;
    let player: { on: (e: string, cb: (d: { seconds: number }) => void) => void; destroy: () => void } | null =
      null;

    void loadVimeoScript().then(() => {
      if (cancelled || !frameRef.current) return;
      const w = window as unknown as { Vimeo?: { Player: new (el: HTMLIFrameElement) => typeof player } };
      if (!w.Vimeo) return;
      player = new w.Vimeo.Player(frameRef.current) as typeof player;
      player?.on("timeupdate", (data: { seconds: number }) => onTimeRef.current(data.seconds));
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* noop */
      }
    };
  }, [videoId]);

  return (
    <div className="relative w-full overflow-hidden rounded-[15px]" style={{ paddingTop: "46.21%" }}>
      <iframe
        ref={frameRef}
        src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479${hash ? `&h=${hash}` : ""}`}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Vídeo informativo"
        className="absolute left-0 top-0 h-full w-full border-0"
      />
    </div>
  );
}
