import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CalendarIcon, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTrackingSettings, listVisitorSessions, saveTrackingSettings } from "@/lib/tracking.functions";
import { supabase } from "@/integrations/supabase/client";
import { listLeads, deleteLead, deleteAllLeads, type LeadRow } from "@/lib/leads.functions";
import { formatDateTime, formatWhatsapp, getBrasiliaDateKey, whatsappLink } from "@/lib/lead-validation";
import { useLeadChime } from "@/hooks/use-lead-chime";
import { recordAdminAction } from "@/lib/audit.functions";
import metaLogo from "@/assets/meta-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de leads | Indicador Pro" },
      { name: "description", content: "Acompanhe em tempo real os resgates solicitados." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel de leads | Indicador Pro" },
      { property: "og:description", content: "Acompanhe em tempo real os resgates solicitados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const removeLead = useServerFn(deleteLead);
  const removeAllLeads = useServerFn(deleteAllLeads);
  const recordAction = useServerFn(recordAdminAction);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);
  const { play, unlock } = useLeadChime();
  const [soundOn, setSoundOn] = useState(false);
  const [refreshingVisitors, setRefreshingVisitors] = useState(false);
  const [todayDate, setTodayDate] = useState(() => getBrasiliaDateKey());
  const [selectedDate, setSelectedDate] = useState(() => getBrasiliaDateKey());
  const knownCount = useRef<number | null>(null);

  useEffect(() => {
    setSoundOn(window.localStorage.getItem("painel-sound-enabled") === "true");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextToday = getBrasiliaDateKey();
      setTodayDate((currentToday) => {
        if (currentToday === nextToday) return currentToday;
        setSelectedDate(nextToday);
        return nextToday;
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const [section, setSection] = useState<"dashboard" | "leads" | "pixel" | "visitors">("dashboard");
  const [pixelId, setPixelId] = useState("");
  const [savedPixelId, setSavedPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [trackingEvents, setTrackingEvents] = useState(["PageView", "ViewContent", "InitiateCheckout", "Lead"]);
  const [pixelMessage, setPixelMessage] = useState<string | null>(null);
  const fetchTrackingSettings = useServerFn(getTrackingSettings);
  const updateTrackingSettings = useServerFn(saveTrackingSettings);
  const fetchVisitors = useServerFn(listVisitorSessions);
  const visitorIsOnline = (visitor: (typeof visitors)[number]) => visitor.is_online;

  const { data: visitorData, error: visitorsError } = useQuery({
    queryKey: ["visitor-sessions", selectedDate],
    queryFn: () => fetchVisitors({ data: { date: selectedDate } }),
    // Mantém o painel atualizado mesmo quando o realtime do Supabase
    // estiver indisponível no ambiente atual.
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
  const visitors = visitorData?.visitors ?? [];
  const metrics = visitorData?.metrics;

  useEffect(() => {
    void fetchTrackingSettings().then((settings) => {
      setPixelId(settings.pixelId ?? "");
      setSavedPixelId(settings.pixelId ?? "");
      setPixelEnabled(settings.pixelEnabled);
      setTrackingEvents(settings.trackedEvents);
    });
  }, [fetchTrackingSettings]);

  async function handleSavePixel() {
    setPixelMessage(null);
    try {
      await updateTrackingSettings({ data: { pixelId, pixelEnabled, trackedEvents: trackingEvents } });
      setSavedPixelId(pixelId.trim());
      setPixelMessage("Configuração salva. O rastreamento da página /ufhurd será atualizado automaticamente.");
    } catch (saveError) {
      setPixelMessage((saveError as Error).message);
    }
  }

  async function handleDeletePixel() {
    if (!window.confirm("Excluir o Pixel Meta atual?")) return;
    setPixelMessage(null);
    try {
      await updateTrackingSettings({ data: { pixelId: "", pixelEnabled: false, trackedEvents: [] } });
      setPixelId("");
      setSavedPixelId("");
      setPixelEnabled(false);
      setTrackingEvents(["PageView", "ViewContent", "InitiateCheckout", "Lead"]);
      setPixelMessage("Pixel excluído. Agora você pode cadastrar outro.");
    } catch (deleteError) {
      setPixelMessage((deleteError as Error).message);
    }
  }

  async function handleRefreshVisitors() {
    setRefreshingVisitors(true);
    try {
      await queryClient.refetchQueries({ queryKey: ["visitor-sessions"], type: "active" });
      await recordAction({ data: { action: "Atualizou manualmente o status dos visitantes" } });
    } finally {
      setRefreshingVisitors(false);
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads", selectedDate],
    queryFn: () => fetchLeads({ data: { date: selectedDate } }),
    refetchInterval: 20000,
  });

  const leads: LeadRow[] = data ?? [];

  useEffect(() => {
    const channel = supabase
      .channel("panel-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["leads"] });
        play();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, play]);

  useEffect(() => {
    if (!data) return;
    if (knownCount.current !== null && data.length > knownCount.current) play();
    knownCount.current = data.length;
  }, [data, play]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    await recordAction({ data: { action: "Saiu do painel" } });
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  async function handleDeleteAllLeads() {
    if (leads.length === 0 || !window.confirm("Excluir todos os leads? Essa ação não pode ser desfeita.")) {
      return;
    }

    setWiping(true);
    try {
      await removeAllLeads();
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } finally {
      setWiping(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
      <aside className="scrollbar-panel sticky top-6 hidden h-[calc(100vh-3rem)] w-56 shrink-0 overflow-y-auto rounded-2xl border border-border bg-secondary/60 p-3 md:block">
        <p className="px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Indicador Pro
        </p>
        <nav className="mt-3 grid gap-1">
          {[
            ["dashboard", "Dashboard"],
            ["leads", "Leads recebidos"],
            ["pixel", "Pixel e conversões"],
            ["visitors", "Visitantes online"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value as typeof section)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                section === value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leads recebidos</h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} {leads.length === 1 ? "resgate solicitado" : "resgates solicitados"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              unlock();
              window.localStorage.setItem("painel-sound-enabled", "true");
              setSoundOn(true);
              play();
            }}
          >
            {soundOn ? "Som ativado 🔔" : "Ativar som"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSignOut()}
          >
            Sair
          </Button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon aria-hidden />
              {selectedDate === todayDate
                ? `Hoje, ${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                    new Date(`${selectedDate}T12:00:00Z`),
                  )}`
                : new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                    new Date(`${selectedDate}T12:00:00Z`),
                  )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={new Date(`${selectedDate}T12:00:00`)}
              disabled={{ after: new Date(`${todayDate}T23:59:59`) }}
              onSelect={(date) => {
                if (!date) return;
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                setSelectedDate(`${year}-${month}-${day}`);
              }}
              className="pointer-events-auto p-3"
            />
          </PopoverContent>
        </Popover>
        {selectedDate !== todayDate ? (
          <Button type="button" variant="ghost" onClick={() => setSelectedDate(todayDate)}>
            Voltar para hoje
          </Button>
        ) : null}
        <span className="text-xs text-muted-foreground">Dados do dia selecionado</span>
      </div>

      {!soundOn ? (
        <p className="mt-3 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          Clique em “Ativar som” uma vez para liberar o alerta sonoro de novos leads neste navegador.
        </p>
      ) : null}

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Carregando...</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">{(error as Error).message}</p> : null}

      {section === "dashboard" ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visitorsError ? (
            <p className="col-span-full rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Não foi possível atualizar as métricas agora. A próxima tentativa será automática.
            </p>
          ) : null}
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visitantes registrados</p>
            <p className="mt-2 text-3xl font-extrabold">{metrics?.total ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sessões na página /ufhurd</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Online agora</p>
            <p className="mt-2 text-3xl font-extrabold">
               {metrics?.online ?? 0}
            </p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assistindo</p>
            <p className="mt-2 text-3xl font-extrabold">
               {metrics?.played ?? 0}
            </p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pix liberado</p>
            <p className="mt-2 text-3xl font-extrabold">
               {metrics?.unlocked ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Alcançaram 2 minutos de vídeo</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversão</p>
            <p className="mt-2 text-3xl font-extrabold">
              {metrics?.total
                ? `${Math.round((metrics.converted / metrics.total) * 100)}%`
                : "0%"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Visitantes que enviaram lead</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tempo médio</p>
            <p className="mt-2 text-3xl font-extrabold">
              {metrics?.average_seconds ?? 0}s
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Vídeo assistido por visitante</p>
          </article>
        </section>
      ) : null}

      {section === "pixel" ? (
        <section className="surface-card mt-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">Pixel e conversões</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O pixel da Meta é aplicado somente em /ufhurd e atualizado automaticamente, sem nova publicação.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-3 py-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-background/50 p-1.5">
                <img src={metaLogo.url} alt="Meta" className="size-full object-contain" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest">Meta</p>
                <p className="text-[11px] text-muted-foreground">Meta Pixel</p>
              </div>
            </div>
          </div>

          {savedPixelId ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-secondary/40">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-background/60 p-2.5">
                    <img src={metaLogo.url} alt="Meta" className="size-full object-contain" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold">Pixel Meta</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${pixelEnabled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                        {pixelEnabled ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-sm text-muted-foreground">ID {savedPixelId}</p>
                  </div>
                </div>
                <Button type="button" variant="destructive" onClick={() => void handleDeletePixel()}>
                  <Trash2 aria-hidden /> Excluir pixel
                </Button>
              </div>
              <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                Para cadastrar outro pixel, exclua este primeiro.
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <label className="block text-sm font-bold" htmlFor="pixel-id">ID do pixel da Meta</label>
              <input
                id="pixel-id"
                value={pixelId}
                onChange={(event) => setPixelId(event.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ex.: 123456789012345"
                className="field-input mt-1.5 w-full rounded-lg px-3 py-2 outline-none"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Informe somente o ID numérico fornecido pela Meta.</p>

              <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={pixelEnabled} onChange={(event) => setPixelEnabled(event.target.checked)} />
                Ativar rastreamento
              </label>

              <p className="mt-5 text-sm font-bold">Eventos enviados</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {["PageView", "ViewContent", "InitiateCheckout", "Lead"].map((eventName) => (
                  <label key={eventName} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={trackingEvents.includes(eventName)}
                      onChange={(event) => setTrackingEvents((current) => event.target.checked ? [...current, eventName] : current.filter((item) => item !== eventName))}
                    />
                    {eventName}
                  </label>
                ))}
              </div>

              <Button type="button" className="mt-6" disabled={!pixelId.trim()} onClick={() => void handleSavePixel()}>
                Salvar pixel
              </Button>
            </div>
          )}

          {pixelMessage ? <p className="mt-3 text-sm text-muted-foreground">{pixelMessage}</p> : null}
        </section>
      ) : null}

      {section === "visitors" ? (
        <section className="surface-card mt-6 rounded-2xl p-6">
           <div className="flex flex-wrap items-start justify-between gap-3">
             <div>
               <h2 className="text-xl font-extrabold">Visitantes em /ufhurd</h2>
               <p className="mt-1 text-sm text-muted-foreground">
                 A presença e a última ação são atualizadas automaticamente em tempo real.
               </p>
             </div>
             <Button
               type="button"
               variant="outline"
               disabled={refreshingVisitors}
               onClick={() => void handleRefreshVisitors()}
             >
               <RefreshCw className={refreshingVisitors ? "animate-spin" : undefined} aria-hidden />
               {refreshingVisitors ? "Atualizando" : "Atualizar status"}
             </Button>
           </div>

          <div className="mt-5 grid gap-3">
            {visitorsError ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Não foi possível atualizar os visitantes agora. Tentando novamente automaticamente.
              </p>
            ) : null}
            {!visitorsError && visitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum visitante registrado ainda.</p>
            ) : null}
            {visitors.map((visitor) => {
              // O heartbeat é enviado a cada 5s; sem nova presença, a sessão
              // muda para offline automaticamente após 10s.
              const online = visitorIsOnline(visitor);
              return (
                <article key={visitor.session_id} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${online ? "text-success" : "text-destructive"}`}>
                      {online ? "● Online" : "○ Offline"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Última atividade: {formatDateTime(visitor.last_seen_at)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm sm:grid-cols-3">
                    <span>
                      {visitor.last_event === "checkout_clicked"
                        ? "↗ Foi pro checkout"
                        : visitor.last_event === "video_played"
                        ? "▶ Deu play novamente"
                        : visitor.last_event === "video_paused"
                          ? "⏸ Parou o vídeo"
                          : visitor.last_event === "form_unlocked"
                            ? "🔓 Pix liberado"
                            : visitor.last_event === "page_exit"
                              ? "↩ Saiu da página"
                              : visitor.last_event === "pix_focused"
                                ? "👆 Clicou no campo da chave Pix"
                                : visitor.last_event === "pix_typing"
                                   ? "✍️ Digitando chave"
                                  : visitor.last_event === "pix_typing_stopped"
                                    ? "⌨️ Parou de digitar a chave Pix"
                                    : visitor.last_event === "pix_blurred"
                                      ? "↗️ Saiu do campo da chave Pix"
                                      : visitor.last_event === "whatsapp_focused"
                                        ? "👆 Clicou no campo do WhatsApp"
                                : visitor.last_event === "whatsapp_typing"
                                          ? "📱 Digitando o WhatsApp..."
                                          : visitor.last_event === "whatsapp_typing_stopped"
                                            ? "⌨️ Parou de digitar o WhatsApp"
                                            : visitor.last_event === "whatsapp_blurred"
                                              ? "↗️ Saiu do campo do WhatsApp"
                                               : visitor.last_event === "back_intercepted"
                                                 ? "⚠️ Clicou em voltar — popup exibido"
                                     : visitor.last_event === "lead_submitted"
                                       ? "✅ Enviou a chave Pix"
                                      : visitor.video_played
                                        ? "▶ Assistindo o vídeo"
                                        : "⌛ Ainda não deu play"}
                    </span>
                    <span>{visitor.video_seconds >= 120 ? "🔓 Pix liberado" : `${visitor.video_seconds}s de vídeo`}</span>
                    <span>{visitor.converted ? "Lead convertido" : "Sem conversão"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {section === "leads" ? (
      <>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Leads recebidos</h2>
            <p className="text-sm text-muted-foreground">
              Consulte e gerencie os resgates registrados.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={wiping || leads.length === 0}
            onClick={() => void handleDeleteAllLeads()}
          >
            {wiping ? "Excluindo..." : "Excluir todos os leads"}
          </Button>
        </div>

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
        {leads.map((lead) => (
          <article key={lead.id} className="surface-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-highlight px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-highlight-foreground">
                🔥 Lead quente
              </span>
              <time className="text-[11px] text-muted-foreground">{formatDateTime(lead.created_at)}</time>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Chave Pix
                </dt>
                <dd className="mt-0.5 break-all font-semibold">{lead.pix_key}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  WhatsApp
                </dt>
                <dd className="mt-0.5 font-semibold">{formatWhatsapp(lead.whatsapp)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  IP
                </dt>
                <dd className="mt-0.5 text-muted-foreground">{lead.ip_address}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-stretch gap-2">
              <a
                href={whatsappLink(lead.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="btn-cta flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-center text-sm font-extrabold"
              >
                Chamar no WhatsApp
              </a>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 flex-1"
                disabled={busyId === lead.id}
                onClick={async () => {
                  if (!window.confirm("Excluir este lead?")) return;
                  setBusyId(lead.id);
                  await removeLead({ data: { id: lead.id } });
                  await queryClient.invalidateQueries({ queryKey: ["leads"] });
                  setBusyId(null);
                }}
              >
                {busyId === lead.id ? "..." : "Excluir"}
              </Button>
            </div>
          </article>
        ))}
        </section>
      </>
      ) : null}

      {!isLoading && leads.length === 0 && section === "leads" ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum lead recebido ainda.</p>
      ) : null}
      </div>
    </main>
  );
}
