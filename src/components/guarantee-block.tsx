import { ArrowUpRight, ShieldCheck } from "lucide-react";
import selo from "@/assets/selo-garantia-30-dias.png";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function GuaranteeBlock({ price = 185 }: { price?: number }) {
  const parcela = brl.format(Math.round((price / 12) * 100) / 100);
  const pixPrice = Math.round(price * 0.95 * 100) / 100;

  return (
    <section aria-label="Garantia de 30 dias" className="pb-12">
      <div className="mx-auto max-w-[520px] rounded-[28px] bg-sheet p-6 text-center text-sheet-foreground">
        <img
          src={selo}
          alt="Selo de garantia de 30 dias"
          width={816}
          height={816}
          loading="lazy"
          className="mx-auto mb-4 h-20 w-20 object-contain"
        />

        <h2 className="text-[22px] font-bold uppercase tracking-tight">Segurança e proteção</h2>
        <p className="mt-1 text-[15px] uppercase tracking-tight text-sheet-foreground/70">
          Período de avaliação de 30 dias
        </p>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-relaxed text-sheet-foreground/70">
          Você tem a liberdade de experimentar e otimizar seus resultados com nossa tecnologia pelos próximos 30
          dias. Se, por qualquer razão, você decidir não prosseguir, cancelamento e reembolso total estão
          disponíveis.
        </p>

        <div className="mt-5 rounded-2xl bg-sheet-foreground/5 p-4">
          <p className="text-sm font-bold">Comprometimento, sem barreiras</p>
          <p className="mt-1 text-sm text-sheet-foreground/70">Processo de devolução simples e imediato.</p>
        </div>

        <div className="mt-5 rounded-[24px] border border-sheet-foreground/10 p-5">
          <span className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="text-[19px] uppercase leading-snug tracking-tight">
            Conclua sua inscrição com <span className="font-bold underline">total segurança</span> agora mesmo
          </h3>

          <div className="mt-4 grid gap-3 text-left">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-sheet-foreground/10 bg-sheet-foreground/[0.03] p-4"
            >
              <span className="block">
                <span className="block text-[11px] uppercase tracking-[0.12em] text-sheet-foreground/60">
                  Cartão de crédito
                </span>
                <span className="mt-1 block text-[22px] font-extrabold tracking-tight">{parcela} em 12x</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl bg-success p-4 text-success-foreground"
            >
              <span className="block">
                <span className="block text-[11px] uppercase tracking-[0.12em] opacity-90">Pix</span>
                <span className="mt-1 block text-[22px] font-extrabold tracking-tight">5% de desconto</span>
                <span className="mt-0.5 block text-[11px] opacity-90">{brl.format(pixPrice)} à vista</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
