import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getTrackingSettings, listVisitorSessions, saveTrackingSettings } from "@/lib/tracking.functions";
import { supabase } from "@/integrations/supabase/client";
import { listLeads, deleteLead, deleteAllLeads, type LeadRow } from "@/lib/leads.functions";
import { formatDateTime, formatWhatsapp, whatsappLink } from "@/lib/lead-validation";
import { useLeadChime } from "@/hooks/use-lead-chime";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de leads | Indicador Pro" },
      { name: "description", content: "Acompanhe em tempo real os resgates solicitados." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel de leads | Indicador Pro" },
      { property: "og:description", content: "Acompanhe em tempo real os resgates solicitados." },
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);
  const { play, unlock } = useLeadChime();
  const [soundOn, setSoundOn] = useState(false);
  const knownCount = useRef<number | null>(null);

  useEffect(() => {
    setSoundOn(window.localStorage.getItem("painel-sound-enabled") === "true");
  }, []);
  const [section, setSection] = useState<"dashboard" | "leads" | "pixel" | "visitors">("dashboard");
  const [pixelId, setPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [trackingEvents, setTrackingEvents] = useState(["PageView", "ViewContent", "InitiateCheckout", "Lead"]);
  const [pixelMessage, setPixelMessage] = useState<string | null>(null);
  const fetchTrackingSettings = useServerFn(getTrackingSettings);
  const updateTrackingSettings = useServerFn(saveTrackingSettings);
  const fetchVisitors = useServerFn(listVisitorSessions);

  const { data: visitors = [] } = useQuery({
    queryKey: ["visitor-sessions"],
    queryFn: () => fetchVisitors(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    void fetchTrackingSettings().then((settings) => {
      setPixelId(settings.pixelId ?? "");
      setPixelEnabled(settings.pixelEnabled);
      setTrackingEvents(settings.trackedEvents);
    });
  }, [fetchTrackingSettings]);

  async function handleSavePixel() {
    setPixelMessage(null);
    try {
      await updateTrackingSettings({ data: { pixelId, pixelEnabled, trackedEvents: trackingEvents } });
      setPixelMessage("Configuração salva. O rastreamento da página /ufhurd será atualizado automaticamente.");
    } catch (saveError) {
      setPixelMessage((saveError as Error).message);
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
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
      .on("postgres_changes", { event: "*", schema: "public", table: "analytics_sessions" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["visitor-sessions"] });
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
      <aside className="hidden w-56 shrink-0 rounded-2xl border border-border bg-secondary/60 p-3 md:block">
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
          <button
            onClick={() => {
              unlock();
              window.localStorage.setItem("painel-sound-enabled", "true");
              setSoundOn(true);
              play();
            }}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-bold"
          >
            {soundOn ? "Som ativado 🔔" : "Ativar som"}
          </button>
          <button
            onClick={() => void handleSignOut()}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-bold"
          >
            Sair
          </button>
        </div>
      </header>

      {!soundOn ? (
        <p className="mt-3 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          Clique em “Ativar som” uma vez para liberar o alerta sonoro de novos leads neste navegador.
        </p>
      ) : null}

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Carregando...</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">{(error as Error).message}</p> : null}

      {section === "dashboard" ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visitantes registrados</p>
            <p className="mt-2 text-3xl font-extrabold">{visitors.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sessões na página /ufhurd</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Online agora</p>
            <p className="mt-2 text-3xl font-extrabold">
              {visitors.filter((visitor) => Date.now() - new Date(visitor.last_seen_at).getTime() < 30000).length}
            </p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assistindo</p>
            <p className="mt-2 text-3xl font-extrabold">
              {visitors.filter((visitor) => visitor.video_played).length}
            </p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pix liberado</p>
            <p className="mt-2 text-3xl font-extrabold">
              {visitors.filter((visitor) => visitor.video_seconds >= 120).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Alcançaram 2 minutos de vídeo</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversão</p>
            <p className="mt-2 text-3xl font-extrabold">
              {visitors.length
                ? `${Math.round((visitors.filter((visitor) => visitor.converted).length / visitors.length) * 100)}%`
                : "0%"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Visitantes que enviaram lead</p>
          </article>
          <article className="surface-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tempo médio</p>
            <p className="mt-2 text-3xl font-extrabold">
              {visitors.length
                ? `${Math.round(visitors.reduce((total, visitor) => total + visitor.video_seconds, 0) / visitors.length)}s`
                : "0s"}
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

            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                M
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest">Meta</p>
                <p className="text-[11px] text-muted-foreground">Meta Pixel</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-sm font-bold">Provedor ativo: Meta</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ao salvar, qualquer configuração anterior incompatível é desativada para evitar conflito de pixels.
            </p>
          </div>

          <label className="mt-5 block text-sm font-bold" htmlFor="pixel-id">ID do pixel da Meta</label>
          <input
            id="pixel-id"
            value={pixelId}
            onChange={(event) => setPixelId(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ex.: 123456789012345"
            className="field-input mt-1.5 w-full rounded-lg px-3 py-2 outline-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Informe somente o ID numérico fornecido pelo Events Manager da Meta.
          </p>

          <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={pixelEnabled}
              onChange={(event) => setPixelEnabled(event.target.checked)}
            />
            Ativar rastreamento
          </label>

          <p className="mt-5 text-sm font-bold">Eventos enviados</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {["PageView", "ViewContent", "InitiateCheckout", "Lead"].map((eventName) => (
              <label key={eventName} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={trackingEvents.includes(eventName)}
                  onChange={(event) =>
                    setTrackingEvents((current) =>
                      event.target.checked
                        ? [...current, eventName]
                        : current.filter((item) => item !== eventName),
                    )
                  }
                />
                {eventName}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleSavePixel()}
            className="btn-cta mt-6 rounded-lg px-4 py-2 text-sm font-extrabold"
          >
            Salvar configuração
          </button>

          {pixelMessage ? <p className="mt-3 text-sm text-muted-foreground">{pixelMessage}</p> : null}
        </section>
      ) : null}

      {section === "visitors" ? (
        <section className="surface-card mt-6 rounded-2xl p-6">
          <h2 className="text-xl font-extrabold">Visitantes em /ufhurd</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Um visitante é considerado online quando enviou atividade nos últimos 30 segundos.
          </p>

          <div className="mt-5 grid gap-3">
            {visitors.map((visitor) => {
              const online = Date.now() - new Date(visitor.last_seen_at).getTime() < 30000;
              return (
                <article key={visitor.session_id} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${online ? "text-success" : "text-muted-foreground"}`}>
                      {online ? "● Online" : "○ Saiu"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Última atividade: {formatDateTime(visitor.last_seen_at)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm sm:grid-cols-3">
                    <span>{visitor.video_played ? "▶ Deu play" : "⏸ Ainda não deu play"}</span>
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

            <div className="mt-4 flex gap-2">
            <a
              href={whatsappLink(lead.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn-cta mt-4 flex min-h-11 items-center justify-center rounded-xl text-sm font-extrabold"
            >
              Chamar no WhatsApp
            </a>
            <Button
              type="button"
              variant="outline"
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
