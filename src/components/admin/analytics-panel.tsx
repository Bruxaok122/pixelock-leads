import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { listAnalyticsSessions, type AnalyticsSession } from "@/lib/analytics.functions";
import { formatDateTime } from "@/lib/lead-validation";

function duration(ms: number): string { const seconds = Math.round(ms / 1000); return `${Math.floor(seconds / 60)}min ${seconds % 60}s`; }

function SessionRow({ session }: { session: AnalyticsSession }) {
  const [open, setOpen] = useState(false);
  return <article className="rounded-md border border-border bg-card p-4">
    <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((value) => !value)}>
      <span><b className="text-sm">{formatDateTime(session.started_at)}</b><span className="mt-1 block text-xs text-muted-foreground">{session.device_type} · {duration(session.duration_ms)} · vídeo {Math.floor(session.max_video_seconds / 60)}min {session.max_video_seconds % 60}s</span></span>
      <ChevronDown className={open ? "rotate-180" : ""} />
    </button>
    {open ? <div className="mt-4 border-t border-border pt-3">
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4"><div><dt className="text-muted-foreground">Rolagem</dt><dd>{session.max_scroll_percent}%</dd></div><div><dt className="text-muted-foreground">Cliques</dt><dd>{session.click_count}</dd></div><div><dt className="text-muted-foreground">Origem</dt><dd className="truncate">{session.referrer || "Direto"}</dd></div><div><dt className="text-muted-foreground">Eventos</dt><dd>{session.analytics_events.length}</dd></div></dl>
      <ol className="mt-4 max-h-56 space-y-2 overflow-auto text-xs">{session.analytics_events.map((event) => <li key={event.id} className="flex justify-between gap-2 border-b border-border pb-2"><span>{event.event_type}{event.target_key ? ` · ${event.target_key}` : ""}{event.numeric_value !== null ? ` · ${event.numeric_value}` : ""}</span><time className="text-muted-foreground">{new Date(event.created_at).toLocaleTimeString("pt-BR")}</time></li>)}</ol>
    </div> : null}
  </article>;
}

export function AnalyticsPanel() {
  const fetchSessions = useServerFn(listAnalyticsSessions);
  const { data, isLoading, error } = useQuery({ queryKey: ["analytics-sessions"], queryFn: () => fetchSessions(), refetchInterval: 30000 });
  return <section className="mt-8 border-t border-border pt-8"><h2 className="text-xl font-bold">Comportamento dos visitantes</h2><p className="mt-1 text-sm text-muted-foreground">Sessões autorizadas pelo visitante, da mais recente para a mais antiga.</p>
    {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Carregando...</p> : null}{error ? <p className="mt-4 text-sm text-destructive">Não foi possível carregar as sessões.</p> : null}
    <div className="mt-4 grid gap-3">{(data ?? []).map((session) => <SessionRow key={session.id} session={session} />)}</div>
    {!isLoading && data?.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhuma sessão autorizada registrada ainda.</p> : null}
  </section>;
}