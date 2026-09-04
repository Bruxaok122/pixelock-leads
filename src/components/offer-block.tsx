import { ArrowUpRight } from "lucide-react";
import { CHECKOUT_BY_PRICE, pixDiscountFor, pixPriceFor } from "@/lib/checkout";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function installment(total: number, times: number) {
  return brl.format(Math.round((total / times) * 100) / 100);
}

export function OfferBlock({ price, previousPrice }: { price: number; previousPrice?: number }) {
  const pixDiscount = pixDiscountFor(price);
  const pixPrice = pixPriceFor(price);
  const checkoutUrl = CHECKOUT_BY_PRICE[price];
  const goCheckout = () => {
    if (checkoutUrl) window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="reveal-up mx-auto mt-5 w-full max-w-[760px]">
      <div className="text-center">
        <p className="text-[15px] uppercase tracking-[0.14em] text-muted-foreground">Conclua sua inscrição</p>
        <p className="text-[22px] font-extrabold uppercase tracking-tight">Agora mesmo</p>
        {previousPrice ? (
          <p className="mt-2 text-sm text-muted-foreground">
            De <span className="line-through">{brl.format(previousPrice)}</span> por{" "}
            <span className="font-bold text-success">{brl.format(price)}</span> — último valor disponível.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={goCheckout}
          className="surface-card flex w-full items-center justify-between rounded-2xl p-5 text-left"
        >
          <span className="block">
            <span className="block text-[13px] uppercase tracking-[0.12em] text-muted-foreground">
              Cartão de crédito
            </span>
            <span className="mt-1 block text-[26px] font-extrabold tracking-tight">
              {installment(price, 12)} em 12x
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              ou {brl.format(price)} à vista no cartão
            </span>
          </span>
          <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        <button
          type="button"
          onClick={goCheckout}
          className="flex w-full items-center justify-between rounded-2xl bg-success p-5 text-left text-success-foreground"
        >
          <span className="block">
            <span className="block text-[13px] uppercase tracking-[0.12em] opacity-90">Pix</span>
            <span className="mt-1 block text-[26px] font-extrabold tracking-tight">
              {Math.round(pixDiscount * 100)}% de desconto
            </span>
            <span className="mt-1 block text-xs opacity-90">{brl.format(pixPrice)} à vista no Pix</span>
          </span>
          <ArrowUpRight className="h-6 w-6 shrink-0" aria-hidden />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">Compra protegida por criptografia.</p>
    </section>
  );
}
