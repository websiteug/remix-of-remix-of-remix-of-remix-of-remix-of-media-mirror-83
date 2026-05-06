import { fsGet, fsAtomicMarkUsed } from "../_shared/firebase-admin.ts";

const REDIRECT_URL = "https://www.luoancientmovies.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function expiredHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Link expired</title>
<meta http-equiv="refresh" content="2;url=${REDIRECT_URL}">
<style>body{font-family:system-ui,sans-serif;background:#0b0b0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}a{color:#3b82f6}</style>
</head><body><div><h1>Download link expired</h1><p>This one-time link has already been used or has expired.</p><p>Redirecting to <a href="${REDIRECT_URL}">${REDIRECT_URL}</a>...</p><script>setTimeout(function(){location.href='${REDIRECT_URL}'},2000)</script></div></body></html>`;
}

function expired() {
  return new Response(expiredHtml(), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return expired();

  const requestUrl = new URL(req.url);
  const token = requestUrl.searchParams.get("token") || "";
  if (!token) return expired();

  try {
    const doc = await fsGet("downloadTokens", token);
    if (!doc) return expired();
    if (doc.used === true) return expired();
    if (typeof doc.expiresAt === "number" && Date.now() > doc.expiresAt) return expired();

    // Atomically mark used BEFORE streaming so a second request can't slip in
    const ok = await fsAtomicMarkUsed("downloadTokens", token);
    if (!ok) return expired();

    const filename = (doc.filename as string) || "video.mp4";
    let sourceUrl = "";
    if (doc.fileId) {
      sourceUrl = `https://drive.usercontent.google.com/download?id=${doc.fileId}&export=download&confirm=t`;
    } else if (doc.videoUrl) {
      sourceUrl = doc.videoUrl as string;
    } else {
      return expired();
    }

    // Backend fetches the real file URL and returns it as a download response.
    const upstream = await fetch(sourceUrl, {
      headers: req.headers.get("range") ? { Range: req.headers.get("range")! } : {},
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Upstream error", { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    const range = upstream.headers.get("content-range");
    if (range) headers.set("Content-Range", range);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "no-store");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    console.error("stream error", e);
    return expired();
  }
});
