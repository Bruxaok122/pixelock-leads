import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { leadInputSchema, isValidWhatsapp } from "@/lib/lead-validation";

export type LeadRow = {
  id: string;
  pix_key: string;
  whatsapp: string;
  ip_address: string;
  user_agent: string | null;
  status: string;
  created_at: string;
};

export const getClaimStatus = createServerFn({ method: "GET" }).handler(async () => {
  const ip =
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    getRequestHeader("x-real-ip") ??
    "0.0.0.0";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("leads")
    .select("id, created_at")
    .eq("ip_address", ip)
    .maybeSingle();

  return { alreadyClaimed: Boolean(data), claimedAt: data?.created_at ?? null };
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadInputSchema.parse(input))
  .handler(async ({ data }) => {
    if (!isValidWhatsapp(data.whatsapp)) {
      return { ok: false as const, reason: "invalid" as const, message: "Informe um WhatsApp válido com DDD." };
    }

    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestHeader("x-real-ip") ??
      "0.0.0.0";
    const userAgent = getRequestHeader("user-agent") ?? null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("ip_address", ip)
      .maybeSingle();

    if (existing) {
      return {
        ok: false as const,
        reason: "duplicate" as const,
        message: "Já existe um resgate solicitado neste dispositivo. Apenas uma liberação por pessoa.",
      };
    }

    const { error } = await supabaseAdmin.from("leads").insert({
      pix_key: data.pixKey,
      whatsapp: data.whatsapp,
      ip_address: ip,
      user_agent: userAgent,
      status: "quente",
    });

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false as const,
          reason: "duplicate" as const,
          message: "Já existe um resgate solicitado neste dispositivo. Apenas uma liberação por pessoa.",
        };
      }
      return { ok: false as const, reason: "error" as const, message: "Não foi possível registrar agora. Tente novamente." };
    }

    return { ok: true as const, reason: "created" as const, message: "Transferência reservada com sucesso." };
  });

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const { data, error } = await context.supabase
      .from("leads")
      .select("id, pix_key, whatsapp, ip_address, user_agent, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadRow[];
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Acesso restrito ao administrador.");
}

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input || typeof input.id !== "string" || input.id.length === 0) {
      throw new Error("ID inválido.");
    }
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir este lead.");
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "lead_deleted",
      target_id: data.id,
    });
    return { ok: true as const };
  });

export const deleteAllLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("confirmation" in input) || input.confirmation !== "EXCLUIR TODOS") {
      throw new Error("Confirmação inválida.");
    }
    return { confirmation: "EXCLUIR TODOS" as const };
  })
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("leads").select("id", { count: "exact", head: true });
    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .not("id", "is", null);
    if (error) throw new Error("Não foi possível excluir os leads.");
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "all_leads_deleted",
      affected_count: count ?? 0,
    });
    return { ok: true as const };
  });
