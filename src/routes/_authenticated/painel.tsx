import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
  const { play, unlock } = useLeadChime();
  const [soundOn, setSoundOn] = useState(false);
  const knownCount = useRef<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
    refetchInterval: 20000,
  });

  const leads: LeadRow[] = data ?? [];

  useEffect(() => {
    const channel = supabase
      .channel("leads-realtime")
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
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
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

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
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

            <a
              href={whatsappLink(lead.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn-cta mt-4 flex min-h-11 items-center justify-center rounded-xl text-sm font-extrabold"
            >
              Chamar no WhatsApp
            </a>
          </article>
        ))}
      </section>

      {!isLoading && leads.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum lead recebido ainda.</p>
      ) : null}
    </main>
  );
}
