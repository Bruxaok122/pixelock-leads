import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const eventSchema = z.object({
  type: z.enum(["page_view", "click", "scroll", "pointer_sample", "video_progress", "form_unlocked", "lead_submitted", "page_hidden"]),
  targetKey: z.enum(["page", "video", "pix-form", "submit-lead", "whatsapp", "offer", "document"]).optional(),
  xPercent: z.number().int().min(0).max(100).optional(),
  yPercent: z.number().int().min(0).max(100).optional(),
  numericValue: z.number().int().min(0).max(7_200_000).optional(),
}).strict();

const trackingBatchSchema = z.object({
  sessionId: z.string().uuid(),
  pagePath: z.literal("/ufhurd"),
  referrer: z.string().url().max(500).or(z.literal("")),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  durationMs: z.number().int().min(0).max(7_200_000),
  maxVideoSeconds: z.number().int().min(0).max(7_200),
  maxScrollPercent: z.number().int().min(0).max(100),
  events: z.array(eventSchema).min(1).max(25),
}).strict();

export type TrackingSettings = { pixelId: string | null; enabled: boolean };
export type AnalyticsSession = {
  id: string;
  lead_id: string | null;
  page_path: string;
  referrer: string | null;
  device_type: string;
  started_at: string;
  last_seen_at: string;
  duration_ms: number;
  max_video_seconds: number;
  max_scroll_percent: number;
  click_count: number;
  analytics_events: Array<{
    id: string;
    event_type: string;
    target_key: string | null;
    x_percent: number | null;
    y_percent: number | null;
    numeric_value: number | null;
    created_at: string;
  }>;
};

async function assertAdmin(context: Parameters<Parameters<typeof requireSupabaseAuth>[0]>[0] extends never ? never : { supabase: { rpc: Function }; userId: string }): Promise<void> {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

export const getTrackingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tracking_settings")
    .select("meta_pixel_id, enabled")
    .eq("setting_key", "main")
    .maybeSingle();
  return { pixelId: data?.meta_pixel_id ?? null, enabled: data?.enabled ?? false } satisfies TrackingSettings;
});

export const saveTrackingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pixelId: z.string().regex(/^[0-9]{5,30}$/), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tracking_settings").upsert({
      setting_key: "main", meta_pixel_id: data.pixelId, enabled: data.enabled,
      updated_by: context.userId, updated_at: new Date().toISOString(),
    }, { onConflict: "setting_key" });
    if (error) throw new Error("Não foi possível salvar o Pixel.");
    await supabaseAdmin.from("admin_audit_log").insert({ actor_id: context.userId, action: "tracking_settings_updated" });
    return { ok: true as const };
  });

export const removeTrackingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tracking_settings").delete().eq("setting_key", "main");
    if (error) throw new Error("Não foi possível remover o Pixel.");
    await supabaseAdmin.from("admin_audit_log").insert({ actor_id: context.userId, action: "tracking_settings_removed" });
    return { ok: true as const };
  });

export const recordTrackingBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => trackingBatchSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const clickCount = data.events.filter((event) => event.type === "click").length;
    const { error: sessionError } = await supabaseAdmin.from("analytics_sessions").upsert({
      id: data.sessionId, page_path: data.pagePath, referrer: data.referrer || null,
      device_type: data.deviceType, last_seen_at: new Date().toISOString(), duration_ms: data.durationMs,
      max_video_seconds: data.maxVideoSeconds, max_scroll_percent: data.maxScrollPercent,
    }, { onConflict: "id" });
    if (sessionError) throw new Error("Não foi possível registrar a sessão.");
    const { error: eventError } = await supabaseAdmin.from("analytics_events").insert(data.events.map((event) => ({
      session_id: data.sessionId, event_type: event.type, target_key: event.targetKey ?? null,
      x_percent: event.xPercent ?? null, y_percent: event.yPercent ?? null, numeric_value: event.numericValue ?? null,
    })));
    if (eventError) throw new Error("Não foi possível registrar os eventos.");
    if (clickCount > 0) {
      const { data: current } = await supabaseAdmin.from("analytics_sessions").select("click_count").eq("id", data.sessionId).single();
      await supabaseAdmin.from("analytics_sessions").update({ click_count: (current?.click_count ?? 0) + clickCount }).eq("id", data.sessionId);
    }
    return { ok: true as const };
  });

export const listAnalyticsSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");
    const { data, error } = await context.supabase.from("analytics_sessions")
      .select("id, lead_id, page_path, referrer, device_type, started_at, last_seen_at, duration_ms, max_video_seconds, max_scroll_percent, click_count, analytics_events(id, event_type, target_key, x_percent, y_percent, numeric_value, created_at)")
      .order("started_at", { ascending: false }).limit(100);
    if (error) throw new Error("Não foi possível carregar as sessões.");
    return (data ?? []) as AnalyticsSession[];
  });