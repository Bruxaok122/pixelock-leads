import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOG_MONITOR_PASSWORD = "AMANDA23";

type AuditContext = {
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  userId: string;
};

async function assertAdmin(context: AuditContext) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });

  if (!isAdmin) throw new Error("Acesso restrito ao administrador.");
}

function validatePassword(input: unknown) {
  if (
    !input ||
    typeof input !== "object" ||
    typeof (input as { password?: unknown }).password !== "string"
  ) {
    throw new Error("Senha inválida.");
  }

  const password = (input as { password: string }).password;

  if (password !== LOG_MONITOR_PASSWORD) {
    throw new Error("Senha incorreta.");
  }

  return { password };
}

export const authenticateLogMonitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validatePassword)
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("panel_audit_logs").insert({
      user_id: context.userId,
      action: "log_monitor_login",
      target: "Monitoramento de logs",
    });

    if (error) throw new Error(error.message);

    return { ok: true as const };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validatePassword)
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("panel_audit_logs")
      .select("id, user_id, action, target, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);

    return data ?? [];
  });

export const recordAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Registro inválido.");
    }

    const value = input as {
      action?: unknown;
      target?: unknown;
    };

    if (typeof value.action !== "string" || value.action.length === 0 || value.action.length > 120) {
      throw new Error("Ação inválida.");
    }

    if (value.target !== undefined && typeof value.target !== "string") {
      throw new Error("Alvo inválido.");
    }

    return {
      action: value.action,
      target: typeof value.target === "string" ? value.target.slice(0, 200) : null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("panel_audit_logs").insert({
      user_id: context.userId,
      action: data.action,
      target: data.target,
    });

    if (error) throw new Error(error.message);

    return { ok: true as const };
  });