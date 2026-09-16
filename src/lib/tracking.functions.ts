import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRACKED_PATH = "/ufhurd";

function getIpAddress() {
  return (
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    getRequestHeader("x-real-ip") ??
    "0.0.0.0"
  );
}

function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

export const getTrackingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tracking_settings")
    .select("pixel_id, pixel_enabled, tracked_events")
    .eq("id", true)
    .maybeSingle();

  return {
    pixelId: data?.pixel_id ?? null,
    pixelEnabled: Boolean(data?.pixel_enabled && data.pixel_id),
    trackedEvents: Array.isArray(data?.tracked_events) ? data.tracked_events : [],
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

    return {
      pixelId: typeof value.pixelId === "string" ? value.pixelId.trim() : "",
      pixelEnabled: value.pixelEnabled === true,
      trackedEvents: Array.isArray(value.trackedEvents) ? value.trackedEvents : [],
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tracking_settings").upsert({
      id: true,
      pixel_id: data.pixelId || null,
      pixel_enabled: data.pixelEnabled && Boolean(data.pixelId),
      tracked_events: data.trackedEvents,
      updated_at: new Date().toISOString(),
    });

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

    const { error: sessionError } = await supabaseAdmin.from("visitor_sessions").upsert(
      {
        session_id: data.sessionId,
        path: TRACKED_PATH,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
        video_played: data.videoPlayed,
        video_seconds: data.videoSeconds,
        converted: data.converted,
      },
      { onConflict: "session_id" },
    );

    if (sessionError) throw new Error(sessionError.message);

    const { error: eventError } = await supabaseAdmin.from("tracking_events").insert({
      session_id: data.sessionId,
      path: TRACKED_PATH,
      event_name: data.eventName,
      event_data: {
        videoSeconds: data.videoSeconds,
        videoPlayed: data.videoPlayed,
        converted: data.converted,
      },
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
    const { data, error } = await supabaseAdmin
      .from("visitor_sessions")
      .select("session_id, path, user_agent, page_viewed_at, last_seen_at, video_played, video_seconds, converted")
      .eq("path", TRACKED_PATH)
      .order("last_seen_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return data ?? [];
  });