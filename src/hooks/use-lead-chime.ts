import { useCallback, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

/**
 * Alerta sonoro agradável (três notas ascendentes) para novos leads.
 * Volume moderado: audível sem assustar.
 */
export function useLeadChime() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    return ctxRef.current;
  }, []);

  const unlock = useCallback(() => {
    const ctx = ensureContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }, [ensureContext]);

  const play = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const notes = [659.25, 830.61, 987.77];

    notes.forEach((freq, index) => {
      const start = now + index * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }, [ensureContext]);

  return { play, unlock };
}
