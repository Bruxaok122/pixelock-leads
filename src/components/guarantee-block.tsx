import { ArrowUpRight, ShieldCheck } from "lucide-react";
import selo from "@/assets/selo-garantia-30-dias.png";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function CardArt() {
  return (
    <svg
      viewBox="0 0 120 80"
      aria-hidden
      className="pointer-events-none absolute right-14 top-1/2 h-[86%] w-auto -translate-y-1/2 opacity-90"
    >
      <g transform="rotate(-8 60 40)">
        <rect x="14" y="14" width="92" height="56" rx="9" fill="oklch(0.93 0.008 260)" />
        <rect
          x="14.5"
          y="14.5"
          width="91"
          height="55"
          rx="8.5"
          fill="none"
          stroke="oklch(0.86 0.01 260)"
        />
        <rect x="24" y="26" width="18" height="13" rx="3" fill="oklch(0.87 0.03 250)" />
        <rect x="24" y="50" width="46" height="5" rx="2.5" fill="oklch(0.89 0.01 260)" />
      </g>
    </svg>
  );
}

function PixArt() {
  return (
    <svg
      viewBox="0 0 120 90"
      aria-hidden
      className="pointer-events-none absolute right-12 top-1/2 h-[120%] w-auto -translate-y-1/2 opacity-[0.22]"
    >
      <g fill="oklch(1 0 0)">
        <path d="M60 6 L84 30 L72 30 L60 18 L48 30 L36 30 Z" />
        <path d="M60 84 L36 60 L48 60 L60 72 L72 60 L84 60 Z" />
        <path d="M6 45 L30 21 L30 33 L18 45 L30 57 L30 69 Z" />
        <path d="M114 45 L90 69 L90 57 L102 45 L90 33 L90 21 Z" />
      </g>
    </svg>
  );
}

export function GuaranteeBlock({ price = 185 }: { price?: number }) {
  const parcela = brl.format(Math.round((price / 12) * 100) / 100);
  const pixPrice = Math.round(price * 0.95 * 100) / 100;

  return (
    <section aria-label="Garantia de 30 dias" className="pb-12">
      <div className="w-full rounded-[28px] bg-sheet p-6 text-center text-sheet-foreground sm:p-10">
        <img
          src={selo}
          alt="Selo de garantia de 30 dias"
          width={816}
          height={816}
          loading="lazy"
          className="mx-auto mb-4 h-20 w-20 object-contain sm:h-24 sm:w-24"
        />

        <h2 className="text-[22px] font-bold uppercase tracking-tight sm:text-[28px]">
          Segurança e proteção
        </h2>
        <p className="mt-1 text-[15px] uppercase tracking-tight text-sheet-foreground/70">
          Período de avaliação de 30 dias
        </p>

        <p className="mx-auto mt-4 max-w-[620px] text-sm leading-relaxed text-sheet-foreground/70">
          Você tem a liberdade de experimentar e otimizar seus resultados com nossa tecnologia pelos próximos 30
          dias. Se, por qualquer razão, você decidir não prosseguir, cancelamento e reembolso total estão
          disponíveis.
        </p>

        <div className="mx-auto mt-5 max-w-[620px] rounded-2xl bg-sheet-foreground/5 p-4">
          <p className="text-sm font-bold">Comprometimento, sem barreiras</p>
          <p className="mt-1 text-sm text-sheet-foreground/70">Processo de devolução simples e imediato.</p>
        </div>

        <div className="mt-6 w-full rounded-[24px] border-2 border-brand/70 p-5 sm:p-8">
          <span className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="mx-auto max-w-[720px] text-[20px] uppercase leading-snug tracking-tight sm:text-[30px]">
            Conclua sua inscrição com{" "}
            <span className="font-bold text-brand underline decoration-brand decoration-[3px] underline-offset-[6px]">
              total segurança
            </span>{" "}
            agora mesmo
          </h3>

          <div className="mt-6 grid gap-4 text-left">
            <button
              type="button"
              className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-sheet-foreground/10 bg-sheet-foreground/[0.03] p-5 sm:p-7"
            >
              <CardArt />
              <span className="relative block">
                <span className="block text-[15px] uppercase tracking-tight text-sheet-foreground/45 sm:text-[20px]">
                  Cartão de crédito
                </span>
                <span className="mt-1 block text-[26px] uppercase tracking-tight sm:text-[38px]">
                  {parcela} em 12x
                </span>
              </span>
              <ArrowUpRight className="relative h-7 w-7 shrink-0 text-brand sm:h-9 sm:w-9" aria-hidden />
            </button>

            <button
              type="button"
              className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-success p-5 text-success-foreground sm:p-7"
            >
              <PixArt />
              <span className="relative block">
                <span className="block text-[15px] uppercase tracking-tight opacity-80 sm:text-[20px]">
                  Pix
                </span>
                <span className="mt-1 block text-[26px] uppercase tracking-tight sm:text-[38px]">
                  5% de desconto
                </span>
                <span className="mt-0.5 block text-[12px] uppercase opacity-80">
                  {brl.format(pixPrice)} à vista
                </span>
              </span>
              <ArrowUpRight className="relative h-7 w-7 shrink-0 sm:h-9 sm:w-9" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
