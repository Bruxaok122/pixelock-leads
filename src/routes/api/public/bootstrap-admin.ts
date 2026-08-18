import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if ((count ?? 0) > 0) {
          return new Response(JSON.stringify({ ok: false, reason: "already_configured" }), {
            status: 409,
            headers: { "content-type": "application/json" },
          });
        }

        const email = process.env["ADMIN_BOOTSTRAP_EMAIL"];
        const password = process.env["ADMIN_BOOTSTRAP_PASSWORD"];
        if (!email || !password) {
          return new Response(JSON.stringify({ ok: false, reason: "missing_env" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (error || !data.user) {
          return new Response(JSON.stringify({ ok: false, reason: error?.message ?? "create_failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "admin" });

        if (roleError) {
          return new Response(JSON.stringify({ ok: false, reason: roleError.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
