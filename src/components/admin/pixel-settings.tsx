import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getTrackingSettings, removeTrackingSettings, saveTrackingSettings } from "@/lib/analytics.functions";

export function PixelSettings() {
  const getSettings = useServerFn(getTrackingSettings);
  const saveSettings = useServerFn(saveTrackingSettings);
  const removeSettings = useServerFn(removeTrackingSettings);
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["tracking-settings"], queryFn: () => getSettings() });
  const [pixelId, setPixelId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { setPixelId(data?.pixelId ?? ""); setEnabled(data?.enabled ?? false); }, [data]);

  const save = async () => {
    if (!/^[0-9]{5,30}$/.test(pixelId)) { setMessage("Informe um ID numérico válido."); return; }
    setBusy(true); setMessage(null);
    try { await saveSettings({ data: { pixelId, enabled } }); await queryClient.invalidateQueries({ queryKey: ["tracking-settings"] }); setMessage("Configuração salva."); }
    catch { setMessage("Não foi possível salvar."); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setMessage(null);
    try { await removeSettings(); setPixelId(""); setEnabled(false); await queryClient.invalidateQueries({ queryKey: ["tracking-settings"] }); setMessage("Pixel removido."); }
    catch { setMessage("Não foi possível remover."); } finally { setBusy(false); }
  };

  return <section className="mt-8 border-t border-border pt-8">
    <h2 className="text-xl font-bold">Pixel da Meta</h2><p className="mt-1 text-sm text-muted-foreground">Configure o rastreamento publicitário da página.</p>
    <div className="mt-4 grid max-w-xl gap-3">
      <label className="text-xs font-bold" htmlFor="pixel-id">ID do Pixel</label>
      <input id="pixel-id" inputMode="numeric" value={pixelId} onChange={(event) => setPixelId(event.target.value.replace(/\D/g, ""))} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ex.: 123456789012345" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Pixel ativo</label>
      <div className="flex gap-2"><Button onClick={() => void save()} disabled={busy}>Salvar</Button><Button variant="outline" onClick={() => void remove()} disabled={busy || !data?.pixelId}>Remover</Button></div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  </section>;
}