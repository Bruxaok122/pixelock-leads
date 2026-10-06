import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PIXEL_ID_PATTERN = /^[0-9a-f]{24}$/i;

export const getUtmifySettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.from("tracking_settings")
    .select("utmify_pixel_id, enabled").eq("setting_key", "utmify_pixel").maybeSingle();
  if (error) throw new Error("Não foi possível carregar o Pixel UTMify.");
  const pixelId = typeof data?.utmify_pixel_id === "string" && PIXEL_ID_PATTERN.test(data.utmify_pixel_id)
    ? data.utmify_pixel_id : null;
  return { pixelId, enabled: Boolean(pixelId && data?.enabled) };
});

export const saveUtmifySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Configuração inválida.");
    const value = input as { pixelId?: unknown; enabled?: unknown };
    if (typeof value.pixelId !== "string" || typeof value.enabled !== "boolean") {
      throw new Error("Configuração inválida.");
    }
    const pixelId = value.pixelId.trim();
    if (pixelId && !PIXEL_ID_PATTERN.test(pixelId)) {
      throw new Error("Informe o ID de 24 caracteres fornecido pela UTMify.");
    }
    return { pixelId, enabled: Boolean(pixelId && value.enabled) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Acesso restrito ao administrador.");
    const { error } = await context.supabase.from("tracking_settings").upsert({
      setting_key: "utmify_pixel", utmify_pixel_id: data.pixelId || null,
      enabled: data.enabled, updated_at: new Date().toISOString(), updated_by: context.userId,
    }, { onConflict: "setting_key" });
    if (error) throw new Error("Não foi possível salvar o Pixel UTMify.");
    const { writeAdminAudit } = await import("@/lib/audit.server");
    await writeAdminAudit({ actorId: context.userId, action: data.pixelId
      ? `Salvou o Pixel UTMify ${data.pixelId} (${data.enabled ? "ativo" : "inativo"})`
      : "Excluiu o Pixel UTMify" });
    return { ok: true as const };
  });