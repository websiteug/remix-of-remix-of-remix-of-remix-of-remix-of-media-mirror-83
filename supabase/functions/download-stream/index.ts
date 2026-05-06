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
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function getTokenFromRequest(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const pathToken = url.pathname.split("/").pop() || "";
  return token || (pathToken !== "download-stream" ? pathToken : "");
}

function getCookieHeader(headers: Headers) {
  const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie ? getSetCookie.call(headers) : [headers.get("set-cookie") || ""];
  return cookies.filter(Boolean).map((cookie) => cookie.split(";")[0]).join("; ");
}

function htmlDecode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#38;/g, "&").replace(/&quot;/g, '"');
}

function confirmedDriveUrl(fileId: string, html: string) {
  const action = html.match(/<form[^>]+action=["']([^"']+)["'][^>]*>/i)?.[1] || "https://drive.usercontent.google.com/download";
  const params = new URLSearchParams();
  for (const match of html.matchAll(/<input[^>]+type=["']hidden["'][^>]*>/gi)) {
    const input = match[0];
    const name = input.match(/name=["']([^"']+)["']/i)?.[1];
    const value = input.match(/value=["']([^"']*)["']/i)?.[1] || "";
    if (name) params.set(name, htmlDecode(value));
  }
  const confirm = html.match(/[?&]confirm=([0-9A-Za-z_-]+)/)?.[1] || html.match(/name=["']confirm["'][^>]+value=["']([^"']+)["']/i)?.[1];
  if (confirm) params.set("confirm", htmlDecode(confirm));
  params.set("id", params.get("id") || fileId);
  params.set("export", params.get("export") || "download");
  return `${htmlDecode(action)}?${params.toString()}`;
}

async function fetchGoogleDriveDownload(fileId: string) {
  const first = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, { redirect: "follow" });
  const firstType = first.headers.get("content-type") || "";
  const firstDisposition = first.headers.get("content-disposition") || "";
  if (firstDisposition.includes("attachment") || !firstType.includes("text/html")) return first;

  const html = await first.text();
  const cookie = getCookieHeader(first.headers);
  return fetch(confirmedDriveUrl(fileId, html), {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "follow",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return expired();

  const token = getTokenFromRequest(req);
  if (!token) return expired();

  try {
    const doc = await fsGet("downloadTokens", token);
    if (!doc) return expired();
    if (doc.used === true) return expired();
    if (typeof doc.expiresAt === "number" && Date.now() > doc.expiresAt) return expired();

    const filename = (doc.filename as string) || "video.mp4";
    let upstream: Response;
    if (doc.fileId) {
      upstream = await fetchGoogleDriveDownload(String(doc.fileId));
    } else if (doc.videoUrl) {
      upstream = await fetch(doc.videoUrl as string, { redirect: "follow" });
    } else {
      return expired();
    }

    const type = upstream.headers.get("content-type") || "";
    const disposition = upstream.headers.get("content-disposition") || "";
    if ((!upstream.ok && upstream.status !== 206) || (type.includes("text/html") && !disposition.includes("attachment"))) {
      console.error(`download upstream failed: ${upstream.status} ${type}`);
      return expired();
    }

    const ok = await fsAtomicMarkUsed("downloadTokens", token);
    if (!ok) return expired();

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
