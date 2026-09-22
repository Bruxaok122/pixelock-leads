export async function writeAdminAudit(input: {
  actorId: string;
  action: string;
  targetId?: string | null;
  affectedCount?: number;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    target_id: input.targetId ?? null,
    affected_count: input.affectedCount ?? 1,
  });

  if (error) console.error("Falha ao registrar auditoria administrativa:", error.message);
}