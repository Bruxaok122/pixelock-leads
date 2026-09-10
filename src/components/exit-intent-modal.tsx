import { useEffect, useState } from "react";

/**
 * Popup de intenção de saída. Dispara quando o cursor sai pelo topo (desktop)
 * ou quando o usuário aciona o botão voltar (mobile).
 */
export function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  useEffect(() => {
    if (used) return;

    const trigger = () => {
      if (used) return;
      setOpen(true);
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) trigger();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") trigger();
    };

    const handlePopState = () => {
      trigger();
      try {
        window.history.pushState({ exitGuard: true }, "");
      } catch {
        /* noop */
      }
    };

    try {
      window.history.pushState({ exitGuard: true }, "");
    } catch {
      /* noop */
    }

    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [used]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tem certeza que deseja sair?"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-[820px] overflow-hidden rounded-2xl border border-white/10 bg-[#111111] px-6 py-8 text-center shadow-2xl sm:px-10 sm:py-12">
        <span aria-hidden className="pointer-events-none absolute left-4 top-8 text-[110px] leading-none opacity-[0.13]">
          ⚠️
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-16 right-4 text-[110px] leading-none opacity-[0.13]"
        >
          ⚠️
        </span>

        <p aria-hidden className="mb-2 text-2xl">
          ⚠️
        </p>

        <h2 className="text-[clamp(26px,5vw,44px)] font-extrabold uppercase leading-[1.1] tracking-tight text-[#F5B324]">
          Espera!
        </h2>
        <h3 className="mt-1 text-[clamp(22px,4.4vw,40px)] font-extrabold uppercase leading-[1.1] tracking-tight text-white">
          Tem certeza que deseja sair?
        </h3>

        <p className="mx-auto mt-6 max-w-[720px] text-[clamp(14px,2.2vw,18px)] leading-relaxed text-white/60">
          Se você sair agora, nosso sistema vai interpretar essa ação como{" "}
          <b className="font-bold text-white">desistência voluntária</b> e os{" "}
          <b className="font-bold text-white">R$ 250,00</b> reservados na sua conta serão liberados para o próximo da
          fila.
        </p>

        <p className="mx-auto mt-5 max-w-[720px] text-[clamp(14px,2.2vw,18px)] leading-relaxed text-white/80">
          <b className="font-bold text-[#F5B324]">Esta é a sua única chance</b> — não será possível recuperar depois.
        </p>

        <button
          type="button"
          onClick={() => {
            setUsed(true);
            setOpen(false);
          }}
          className="mt-8 w-full rounded-xl bg-[#2BA84A] px-6 py-4 text-[clamp(16px,3vw,26px)] font-semibold uppercase tracking-wide text-white shadow-[0_0_28px_rgba(43,168,74,0.45)] transition hover:brightness-110"
        >
          Aperte aqui para continuar assistindo
        </button>
      </div>
    </div>
  );
}
