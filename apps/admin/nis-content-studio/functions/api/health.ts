interface BindingStatus {
  readonly database: "ready" | "unavailable";
  readonly media: "ready" | "unavailable";
  readonly status: "ok" | "degraded";
}

const checkDatabase = async (database: D1Database): Promise<boolean> => {
  try {
    await database.prepare("SELECT 1").first();
    return true;
  } catch {
    return false;
  }
};

const checkMedia = async (media: R2Bucket): Promise<boolean> => {
  try {
    await media.head("__nis_binding_healthcheck__");
    return true;
  } catch {
    return false;
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [databaseReady, mediaReady] = await Promise.all([
    checkDatabase(env.DB),
    checkMedia(env.MEDIA),
  ]);

  const response: BindingStatus = {
    database: databaseReady ? "ready" : "unavailable",
    media: mediaReady ? "ready" : "unavailable",
    status: databaseReady && mediaReady ? "ok" : "degraded",
  };

  return Response.json(response, {
    status: response.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
