import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const pixelIdSchema = z.string().trim().regex(/^\d{5,25}$/, "Informe um ID de Pixel válido.");

const eventSchema = z.object({
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view", "click", "scroll", "video_progress", "form_open", "lead_submitted", "session_end"]),
  targetKey: z.string().trim().max(120).nullable().optional(),
  xPercent: z.number().int().min(0).max(100).nullable().optional(),
  yPercent: z.number().int().min(0).max(100).nullable().optional(),
  numericValue: z.number().int().min(0).max(86_400_000).nullable().optional(),
});

const sessionSchema = z.object({
  sessionId: z.string().uuid(),
  pagePath: z.string().max(200),
  referrer: z.string().max(500).nullable(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  durationMs: z.number().int().min(0).max(86_400_000),
  maxVideoSeconds: z.number().int().min(0).max(86_400),
  maxScrollPercent: z.number().int().min(0).max(100),
  clickCount: z.number().int().min(0).max(100_000),
  leadId: z.string().uuid().nullable().optional(),
});

export const getTrackingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tracking_settings")
    .select("meta_pixel_id, enabled")
    .eq("setting_key", "meta_pixel")
    .maybeSingle();
  return { pixelId: data?.meta_pixel_id ?? null, enabled: data?.enabled ?? false };
});

export const saveTrackingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pixelId: pixelIdSchema.nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tracking_settings").upsert(
      {
        setting_key: "meta_pixel",
        meta_pixel_id: data.pixelId,
        enabled: Boolean(data.pixelId),
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const recordAnalyticsSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sessionSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_sessions").upsert(
      {
        id: data.sessionId,
        page_path: data.pagePath,
        referrer: data.referrer,
        device_type: data.deviceType,
        duration_ms: data.durationMs,
        max_video_seconds: data.maxVideoSeconds,
        max_scroll_percent: data.maxScrollPercent,
        click_count: data.clickCount,
        last_seen_at: new Date().toISOString(),
        ...(data.leadId ? { lead_id: data.leadId } : {}),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error("Não foi possível registrar a sessão.");
    return { ok: true as const };
  });

export const recordAnalyticsEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => eventSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      session_id: data.sessionId,
      event_type: data.eventType,
      target_key: data.targetKey ?? null,
      x_percent: data.xPercent ?? null,
      y_percent: data.yPercent ?? null,
      numeric_value: data.numericValue ?? null,
    });
    if (error) throw new Error("Não foi possível registrar o evento.");
    return { ok: true as const };
  });

export type AnalyticsSessionRow = {
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
};

export type AnalyticsEventRow = {
  id: string;
  session_id: string;
  event_type: string;
  target_key: string | null;
  x_percent: number | null;
  y_percent: number | null;
  numeric_value: number | null;
  created_at: string;
};

export const listAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const [sessionsResult, eventsResult] = await Promise.all([
      context.supabase.from("analytics_sessions").select("*").order("started_at", { ascending: false }).limit(200),
      context.supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    if (sessionsResult.error) throw new Error(sessionsResult.error.message);
    if (eventsResult.error) throw new Error(eventsResult.error.message);
    return {
      sessions: (sessionsResult.data ?? []) as AnalyticsSessionRow[],
      events: (eventsResult.data ?? []) as AnalyticsEventRow[],
    };
  });