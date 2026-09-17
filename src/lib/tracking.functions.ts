import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRACKED_PATH = "/ufhurd";
const META_PIXEL_ID_PATTERN = /^\d{5,20}$/;
const META_EVENTS = ["PageView", "ViewContent", "InitiateCheckout", "Lead"] as const;

function analyticsEventType(eventName: string, converted: boolean) {
  if (converted || eventName === "Lead") return "lead_submitted";
  if (eventName === "PixUnlocked") return "form_unlocked";
  if (eventName === "VideoProgress" || eventName === "Heartbeat") return "video_progress";
  return "page_view";
}

export interface VisitorSession {
  session_id: string;
  path: string;
  page_viewed_at: string;
  last_seen_at: string;
  video_played: boolean;
  video_seconds: number;
  converted: boolean;
}

function isValidMetaPixelId(value: string) {
  return META_PIXEL_ID_PATTERN.test(value);
}

function getIpAddress() {
  return (
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    getRequestHeader("x-real-ip") ??
    "0.0.0.0"
  );
}

function isValidSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export const getTrackingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tracking_settings")
    .select("meta_pixel_id, enabled")
    .eq("setting_key", "meta_pixel")
    .maybeSingle();

  const pixelId = typeof data?.meta_pixel_id === "string" ? data.meta_pixel_id.trim() : "";

  return {
    pixelId: isValidMetaPixelId(pixelId) ? pixelId : null,
    pixelEnabled: Boolean(data?.enabled && isValidMetaPixelId(pixelId)),
    trackedEvents: [...META_EVENTS],
  };
});

export const saveTrackingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Configuração inválida.");

    const value = input as {
      pixelId?: unknown;
      pixelEnabled?: unknown;
      trackedEvents?: unknown;
    };

    if (value.pixelId !== undefined && typeof value.pixelId !== "string") {
      throw new Error("ID do pixel inválido.");
    }

    if (
      value.trackedEvents !== undefined &&
      (!Array.isArray(value.trackedEvents) ||
        value.trackedEvents.some((event) => typeof event !== "string"))
    ) {
      throw new Error("Eventos inválidos.");
    }

    const pixelId = typeof value.pixelId === "string" ? value.pixelId.trim() : "";

    if (pixelId && !isValidMetaPixelId(pixelId)) {
      throw new Error("Informe um ID numérico válido de pixel da Meta.");
    }

    const trackedEvents = Array.isArray(value.trackedEvents)
      ? value.trackedEvents.filter(
          (event): event is (typeof META_EVENTS)[number] =>
            typeof event === "string" &&
            META_EVENTS.includes(event as (typeof META_EVENTS)[number]),
        )
      : [];

    return {
      pixelId,
      pixelEnabled: value.pixelEnabled === true && Boolean(pixelId),
      trackedEvents,
    };
  })
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
        meta_pixel_id: data.pixelId || null,
        enabled: data.pixelEnabled && Boolean(data.pixelId),
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "setting_key" },
    );

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const trackVisitorEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Evento inválido.");

    const value = input as {
      sessionId?: unknown;
      eventName?: unknown;
      videoSeconds?: unknown;
      videoPlayed?: unknown;
      converted?: unknown;
    };

    if (!isValidSessionId(value.sessionId)) throw new Error("Sessão inválida.");
    if (typeof value.eventName !== "string" || value.eventName.length > 80) {
      throw new Error("Nome do evento inválido.");
    }

    return {
      sessionId: value.sessionId,
      eventName: value.eventName,
      videoSeconds: typeof value.videoSeconds === "number" ? Math.max(0, Math.floor(value.videoSeconds)) : 0,
      videoPlayed: value.videoPlayed === true,
      converted: value.converted === true,
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userAgent = getRequestHeader("user-agent") ?? null;
    const ipAddress = getIpAddress();

    const now = new Date().toISOString();
    const { data: existingSession, error: existingSessionError } = await supabaseAdmin
      .from("analytics_sessions")
      .select("max_video_seconds")
      .eq("id", data.sessionId)
      .maybeSingle();

    if (existingSessionError) throw new Error(existingSessionError.message);

    const { error: sessionError } = await supabaseAdmin.from("analytics_sessions").upsert(
      {
        id: data.sessionId,
        page_path: TRACKED_PATH,
        device_type: userAgent?.includes("Mobile") ? "mobile" : "desktop",
        last_seen_at: now,
        max_video_seconds: Math.max(existingSession?.max_video_seconds ?? 0, data.videoSeconds),
      },
      { onConflict: "id" },
    );

    if (sessionError) throw new Error(sessionError.message);

    const { error: eventError } = await supabaseAdmin.from("analytics_events").insert({
      session_id: data.sessionId,
      event_type: analyticsEventType(data.eventName, data.converted),
      numeric_value: data.videoSeconds,
      target_key: ipAddress === "0.0.0.0" ? null : "tracked",
    });

    if (eventError) throw new Error(eventError.message);
    return { ok: true as const };
  });

export const listVisitorSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data, error }, { data: leadEvents, error: leadEventsError }] = await Promise.all([
      supabaseAdmin
        .from("analytics_sessions")
        .select("id, page_path, started_at, last_seen_at, max_video_seconds, lead_id")
        .eq("page_path", TRACKED_PATH)
        .order("last_seen_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("analytics_events").select("session_id").eq("event_type", "lead_submitted"),
    ]);

    if (error) throw new Error(error.message);
    if (leadEventsError) throw new Error(leadEventsError.message);

    const convertedSessionIds = new Set((leadEvents ?? []).map((event) => event.session_id));
    return (data ?? []).map((session): VisitorSession => ({
      session_id: session.id,
      path: session.page_path,
      page_viewed_at: session.started_at,
      last_seen_at: session.last_seen_at,
      video_played: session.max_video_seconds > 0,
      video_seconds: session.max_video_seconds,
      converted: session.lead_id !== null || convertedSessionIds.has(session.id),
    }));
  });