import { fsCreate } from "../_shared/firebase-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genToken(len = 48): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

function getFileIdFromUrl(url: string): string | null {
  const patterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /https?:\/\/docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isDirect(url: string) {
  return !url.includes("drive.google.com") && !url.includes("docs.google.com");
}

function sanitize(name: string) {
  return name.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").substring(0, 180);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { contentId, contentTitle, videoUrl, userId } = await req.json();
    if (!contentId || !contentTitle || !videoUrl) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filename = sanitize(`${contentTitle}.mp4`);
    const token = genToken();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;

    const fileId = isDirect(videoUrl) ? "" : getFileIdFromUrl(videoUrl);
    if (!isDirect(videoUrl) && !fileId) {
      return new Response(JSON.stringify({ error: "Invalid video URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await fsCreate("downloadTokens", token, {
      contentId, contentTitle, filename,
      videoUrl: isDirect(videoUrl) ? videoUrl : "",
      fileId: fileId || "",
      userId: userId || "",
      used: false, createdAt: now, expiresAt,
    });

    const projectRef = Deno.env.get("SUPABASE_URL") || "";
    const downloadUrl = `${projectRef}/functions/v1/download-stream`;

    return new Response(JSON.stringify({ downloadUrl, token, filename }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
