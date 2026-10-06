import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutLinks, saveCheckoutLinks } from "@/lib/checkout.functions";

export function CheckoutLinkSettings() {
  const fetchLinks = useServerFn(getCheckoutLinks);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["checkout-links"], queryFn: () => fetchLinks(), staleTime: 0,
  });
  return (
    <section aria-label="Links de checkout" className="mt-6 border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-xl font-extrabold"><Link2 aria-hidden /> Links de checkout</h2>
      {isPending ? <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</p>
        : error ? <div className="mt-4" role="alert"><p className="text-sm text-destructive">Não foi possível carregar os links.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div>
        : data ? <CheckoutLinkForm links={data} /> : null}
    </section>
  );
}

function CheckoutLinkForm({ links }: { links: Record<string, string> }) {
  const [values, setValues] = useState(links);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const save = useServerFn(saveCheckoutLinks);
  const queryClient = useQueryClient();
  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      await save({ data: values });
      queryClient.setQueryData(["checkout-links"], values);
      setMessage("Links salvos e ativos imediatamente.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  }
  return (
    <form className="mt-5 grid gap-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {["149.99", "119.99", "19"].map((price) => (
        <div key={price}>
          <label htmlFor={`checkout-${price}`} className="text-sm font-bold">Checkout — {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price))}</label>
          <input id={`checkout-${price}`} type="url" required maxLength={2048} disabled={busy} value={values[price] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [price]: event.target.value }))} className="field-input mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none" />
        </div>
      ))}
      <div><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Salvar links de checkout</Button></div>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}