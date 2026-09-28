import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordAdminAction } from "@/lib/audit.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso ao painel | Indicador Pro" },
      { name: "description", content: "Área restrita de administração dos resgates." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso ao painel | Indicador Pro" },
      { property: "og:description", content: "Área restrita de administração dos resgates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const recordAction = useServerFn(recordAdminAction);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    await recordAction({ data: { action: "Entrou no painel" } });
    void navigate({ to: "/painel", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-sm rounded-2xl p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse com suas credenciais.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label htmlFor="email" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-3 text-sm outline-none focus:border-brand"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-3 text-sm outline-none focus:border-brand"
              autoComplete="current-password"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-cta mt-1 min-h-12 rounded-xl text-sm font-extrabold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
