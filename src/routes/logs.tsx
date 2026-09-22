import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, LockKeyhole, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditLogs, lockLogs, unlockLogs } from "@/lib/audit.functions";
import { formatDateTime } from "@/lib/lead-validation";

export const Route = createFileRoute("/logs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Logs administrativos | Indicador Pro" },
      { name: "description", content: "Histórico protegido de acessos e ações administrativas." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Logs administrativos | Indicador Pro" },
      { property: "og:description", content: "Histórico protegido de acessos e ações administrativas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const queryClient = useQueryClient();
  const fetchLogs = useServerFn(getAuditLogs);
  const unlock = useServerFn(unlockLogs);
  const lock = useServerFn(lockLogs);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logsQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: fetchLogs,
    enabled: unlocked,
    refetchInterval: 5000,
    retry: false,
  });

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlocking(true);
    setErrorMessage(null);
    try {
      const result = await unlock({ data: { password } });
      if (!result.ok) {
        setErrorMessage("Senha incorreta.");
        return;
      }
      setPassword("");
      setUnlocked(true);
    } catch {
      setErrorMessage("Não foi possível acessar os logs agora.");
    } finally {
      setUnlocking(false);
    }
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <section className="surface-card w-full max-w-sm rounded-xl p-7">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">Logs administrativos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Digite a senha exclusiva para visualizar o histórico.</p>
          <form className="mt-6 grid gap-4" onSubmit={handleUnlock}>
            <div>
              <label htmlFor="logs-password" className="text-xs font-bold text-muted-foreground">Senha</label>
              <Input
                id="logs-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 h-11 bg-secondary"
              />
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button type="submit" size="lg" disabled={unlocking}>
              {unlocking ? "Verificando..." : "Acessar logs"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  const logs = logsQuery.data ?? [];
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><ShieldCheck aria-hidden /><span className="text-xs font-bold uppercase">Acesso protegido</span></div>
          <h1 className="mt-2 text-3xl font-extrabold">Atividade do painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acessos e ações administrativas, atualizados automaticamente.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void logsQuery.refetch()} disabled={logsQuery.isFetching}>
            <RefreshCw className={logsQuery.isFetching ? "animate-spin" : undefined} aria-hidden /> Atualizar
          </Button>
          <Button type="button" variant="secondary" onClick={async () => { await lock(); queryClient.removeQueries({ queryKey: ["admin-audit-logs"] }); setUnlocked(false); }}>
            <LogOut aria-hidden /> Sair
          </Button>
        </div>
      </header>

      <section className="surface-card mt-7 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2"><Activity className="text-primary" aria-hidden /><h2 className="font-bold">Últimas atividades</h2></div>
          <span className="text-xs text-muted-foreground">{logs.length} registros</span>
        </div>
        {logsQuery.isLoading ? <p className="p-6 text-sm text-muted-foreground">Carregando histórico...</p> : null}
        {logsQuery.error ? <p className="p-6 text-sm text-destructive">Não foi possível carregar os registros.</p> : null}
        {!logsQuery.isLoading && !logsQuery.error && logs.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p> : null}
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <article key={log.id} className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-semibold">{log.action}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{log.actorEmail}</p>
              </div>
              <div className="text-xs text-muted-foreground md:text-right">
                <p>{formatDateTime(log.createdAt)}</p>
                {log.affectedCount > 1 ? <p>{log.affectedCount} registros afetados</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}