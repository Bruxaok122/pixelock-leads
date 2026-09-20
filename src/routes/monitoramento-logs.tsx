import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authenticateLogMonitor, listAuditLogs } from "@/lib/audit.functions";
import { formatDateTime } from "@/lib/lead-validation";

export const Route = createFileRoute("/monitoramento-logs")({
  head: () => ({
    meta: [
      { title: "Monitoramento de logs | Indicador Pro" },
      {
        name: "description",
        content: "Consulte os acessos e as interações realizadas no painel.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MonitoramentoLogsPage,
});

function MonitoramentoLogsPage() {
  const authenticate = useServerFn(authenticateLogMonitor);
  const fetchLogs = useServerFn(listAuditLogs);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["standalone-panel-audit-logs"],
    queryFn: () => fetchLogs({ data: { password } }),
    enabled: authenticated,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      await authenticate({ data: { password } });
      setAuthenticated(true);
    } catch (loginError) {
      setMessage((loginError as Error).message);
      setAuthenticated(false);
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    setPassword("");
    setMessage(null);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Monitoramento de logs</CardTitle>
              <CardDescription className="mt-1">
                Consulte os horários e as datas de acessos e interações realizadas no painel.
              </CardDescription>
            </div>

            {authenticated ? (
              <Button type="button" variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            ) : null}
          </CardHeader>

          <CardContent>
            {!authenticated ? (
              <form className="max-w-sm space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="monitoramento-logs-password">
                    Senha do monitoramento
                  </label>
                  <Input
                    id="monitoramento-logs-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite a senha"
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit">Entrar no monitoramento</Button>

                {message ? <p className="text-sm text-destructive">{message}</p> : null}
              </form>
            ) : (
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando logs...</p>
                ) : null}

                {error ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Não foi possível carregar os logs.
                  </p>
                ) : null}

                {!isLoading && !error && logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atividade registrada ainda.
                  </p>
                ) : null}

                <div className="grid gap-3">
                  {logs.map((log) => (
                    <article
                      key={log.id}
                      className="rounded-xl border border-border bg-secondary/40 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold">
                          {log.action === "log_monitor_login"
                            ? "Entrou no monitoramento"
                            : "Interagiu com o painel"}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </time>
                      </div>

                      {log.target ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Elemento utilizado: {log.target}
                        </p>
                      ) : null}

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Usuário: {log.user_id ?? "desconhecido"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}