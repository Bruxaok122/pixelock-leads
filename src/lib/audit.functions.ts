import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, useSession } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type LogsSession = { unlocked?: boolean };

export interface AuditLogRow {
  id: string;
  action: string;
  actorEmail: string;
  affectedCount: number;
  targetId: string | null;
  createdAt: string;
}

function getLogsSession() {
  const password = process.env["LOGS_SESSION_SECRET"];
  if (!password) throw new Error("A sessão dos logs não está configurada.");
  return useSession<LogsSession>({
    password,
    name: "admin-logs-gate",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
    },
  });
}

function passwordsMatch(input: string, expected: string) {
  const inputHash = createHash("sha256").update(input, "utf8").digest();
  const expectedHash = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(inputHash, expectedHash);
}

async function requireLogsAccess() {
  const session = await getLogsSession();
  if (!session.data.unlocked) throw new Error("Acesso aos logs bloqueado.");
}

export const unlockLogs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("password" in input)) {
      throw new Error("Senha inválida.");
    }
    const password = (input as { password?: unknown }).password;
    if (typeof password !== "string" || password.length === 0 || password.length > 256) {
      throw new Error("Senha inválida.");
    }
    return { password };
  })
  .handler(async ({ data }) => {
    const expected = process.env["LOGS_PASSWORD"];
    if (!expected) throw new Error("A senha dos logs não está configurada.");
    if (!passwordsMatch(data.password, expected)) return { ok: false as const };

    const session = await getLogsSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockLogs = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getLogsSession();
  await session.clear();
  return { ok: true as const };
});

export const getLogsAccessStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getLogsSession();
  return { unlocked: session.data.unlocked === true };
});

export const getAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  await requireLogsAccess();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_audit_log")
    .select("id, actor_id, action, target_id, affected_count, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const actorIds = [...new Set((data ?? []).map((item) => item.actor_id))];
  const actorEmails = new Map<string, string>();
  await Promise.all(
    actorIds.map(async (actorId) => {
      const { data: actor } = await supabaseAdmin.auth.admin.getUserById(actorId);
      actorEmails.set(actorId, actor.user?.email ?? "Administrador");
    }),
  );

  return (data ?? []).map(
    (item): AuditLogRow => ({
      id: item.id,
      action: item.action,
      actorEmail: actorEmails.get(item.actor_id) ?? "Administrador",
      affectedCount: item.affected_count,
      targetId: item.target_id,
      createdAt: item.created_at,
    }),
  );
});

export const recordAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("action" in input)) throw new Error("Ação inválida.");
    const action = (input as { action?: unknown }).action;
    if (typeof action !== "string" || action.length === 0 || action.length > 120) {
      throw new Error("Ação inválida.");
    }
    return { action };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const userAgent = getRequestHeader("user-agent") ?? "navegador não identificado";
    const action = `${data.action} · ${userAgent.slice(0, 80)}`;
    const { writeAdminAudit } = await import("@/lib/audit.server");
    await writeAdminAudit({ actorId: context.userId, action });
    return { ok: true as const };
  });