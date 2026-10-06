import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Power, Save, Trash2 } from "lucide-react";
import utmifyLogo from "@/assets/utmify-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUtmifySettings, saveUtmifySettings } from "@/lib/utmify.functions";

export function UtmifyPixelSettings() {
  const fetchSettings = useServerFn(getUtmifySettings);
  const saveSettings = useServerFn(saveUtmifySettings);
  const queryClient = useQueryClient();
  const [pixelId, setPixelId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { data, isPending, error } = useQuery({
    queryKey: ["utmify-pixel-settings"], queryFn: () => fetchSettings(), staleTime: 30000,
  });

  async function update(nextId: string, nextEnabled: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      await saveSettings({ data: { pixelId: nextId, enabled: nextEnabled } });
      await queryClient.invalidateQueries({ queryKey: ["utmify-pixel-settings"] });
      setPixelId("");
      setMessage(nextId ? "Configuração salva." : "Pixel excluído.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Pixel UTMify" className="mt-8 border-t border-border pt-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background/60 p-1">
          <img src={utmifyLogo.url} alt="UTMify" className="size-full object-contain" />
        </span>
        <h3 className="text-lg font-extrabold">Pixel UTMify</h3>
      </div>
      {isPending ? <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando...</p>
        : error ? <div role="alert" className="mt-4"><p className="text-sm text-destructive">Não foi possível carregar o Pixel UTMify.</p><Button variant="outline" className="mt-2" onClick={() => void queryClient.invalidateQueries({ queryKey: ["utmify-pixel-settings"] })}>Tentar novamente</Button></div>
        : data?.pixelId ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 p-5">
            <div className="min-w-0">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", data.enabled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>{data.enabled ? "Ativo" : "Inativo"}</span>
              <p className="mt-2 break-all font-mono text-sm text-muted-foreground">ID {data.pixelId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={busy} onClick={() => void update(data.pixelId ?? "", !data.enabled)}><Power aria-hidden />{data.enabled ? "Desativar UTMify" : "Ativar UTMify"}</Button>
              <Button variant="destructive" disabled={busy} onClick={() => {
                if (window.confirm("Excluir o Pixel UTMify atual?")) void update("", false);
              }}><Trash2 aria-hidden /> Excluir Pixel UTMify</Button>
            </div>
          </div>
        ) : (
          <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void update(pixelId.trim(), enabled); }}>
            <label htmlFor="utmify-pixel-id" className="block text-sm font-bold">ID do Pixel UTMify</label>
            <input id="utmify-pixel-id" value={pixelId} onChange={(event) => setPixelId(event.target.value)} autoComplete="off" required disabled={busy} maxLength={24} className="field-input mt-1.5 w-full rounded-lg px-3 py-2 outline-none" />
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.target.checked)} /> Ativar Pixel UTMify</label>
            <Button type="submit" className="mt-4" disabled={busy || !pixelId.trim()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Salvar Pixel UTMify</Button>
          </form>
        )}
      {message ? <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}