import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHECKOUT_BY_PRICE } from "@/lib/checkout";

const PRICES = [149.99, 119.99, 19] as const;

function validateLinks(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Links inválidos.");
  const input = value as Record<string, unknown>;
  const links: Record<string, string> = {};
  for (const price of PRICES) {
    const link = input[String(price)];
    if (typeof link !== "string" || link.trim().length > 2048) throw new Error("Informe os três links de checkout.");
    let url: URL;
    try { url = new URL(link.trim()); } catch { throw new Error(`Link inválido para R$ ${price}.`); }
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("Use links completos e seguros, começando com https://.");
    }
    links[String(price)] = url.toString();
  }
  return links;
}

export const getCheckoutLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.from("tracking_settings").select("checkout_links")
    .eq("setting_key", "checkout_links").maybeSingle();
  if (error) throw new Error("Não foi possível carregar os links de pagamento. Tente novamente.");
  return validateLinks(data?.checkout_links ?? CHECKOUT_BY_PRICE);
});

export const saveCheckoutLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateLinks)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Acesso restrito ao administrador.");
    const { error } = await context.supabase.from("tracking_settings").upsert({
      setting_key: "checkout_links", checkout_links: data, enabled: true,
      updated_at: new Date().toISOString(), updated_by: context.userId,
    }, { onConflict: "setting_key" });
    if (error) throw new Error("Não foi possível salvar os links de checkout.");
    const { writeAdminAudit } = await import("@/lib/audit.server");
    await writeAdminAudit({ actorId: context.userId, action: "Atualizou os links de checkout das três ofertas" });
    return { ok: true as const };
  });