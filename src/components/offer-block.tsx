const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function installments(total: number, times: number) {
  return brl.format(Math.round((total / times) * 100) / 100);
}

export function OfferBlock({ price, previousPrice }: { price: number; previousPrice?: number }) {
  return (
    <section className="surface-card reveal-up mx-auto mt-5 w-full max-w-[760px] rounded-2xl p-6">
      <span className="rounded-full bg-highlight px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-highlight-foreground">
        Liberação da tecnologia
      </span>

      <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight">
        Garanta a tecnologia por{" "}
        <span className="text-success">{brl.format(price)}</span>
      </h2>

      {previousPrice ? (
        <p className="mt-1 text-sm text-muted-foreground">
          De <span className="line-through">{brl.format(previousPrice)}</span> por{" "}
          <span className="font-bold text-success">{brl.format(price)}</span> — último valor disponível.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Pagamento único, sem mensalidade.</p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-panel-border bg-secondary p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide">Pix à vista</h3>
          <p className="mt-2 text-3xl font-extrabold text-success">{brl.format(price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Liberação imediata após a confirmação.</p>
          <button type="button" className="btn-cta mt-4 min-h-12 w-full rounded-xl text-sm font-extrabold">
            Pagar com Pix
          </button>
        </div>

        <div className="rounded-xl border border-panel-border bg-secondary p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide">Cartão de crédito</h3>
          <p className="mt-2 text-3xl font-extrabold text-brand-soft">
            12x <span className="text-2xl">de {installments(price, 12)}</span>
          </p>
          <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
            <li>1x de {installments(price, 1)}</li>
            <li>3x de {installments(price, 3)}</li>
            <li>6x de {installments(price, 6)}</li>
            <li>12x de {installments(price, 12)}</li>
          </ul>
          <button
            type="button"
            className="mt-4 min-h-12 w-full rounded-xl border border-panel-border bg-card text-sm font-extrabold"
          >
            Pagar com Cartão
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">Compra protegida por criptografia.</p>
    </section>
  );
}
