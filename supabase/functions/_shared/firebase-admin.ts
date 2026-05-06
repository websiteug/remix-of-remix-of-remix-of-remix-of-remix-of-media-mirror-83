// Firebase service account embedded directly (per user request)
// Used to mint Google OAuth access tokens for Firestore REST API.

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "luo-ancient-movies-com",
  private_key_id: "62b2f77c3667c27e178c280f58fc7a776109e118",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSBdLVp9hITKbu\nf+r3JvczDqqp05i59fZUf2Od9OGA2vDljVlYJurFiEGqtTUsp3WS7UMY8tfTmglu\nEiYTfmGz/w6JRUoXnsrudfjhjPZ8nZAZUts7v523iIOGFYmsonhDfyNWE7MwQFKl\niQSp9H7uiP7tnquGomr3JENwcjpt6xYqI90MgMgRlFj4BhGKhj+aERS3o7pYjJM4\np7R0REjt0GIeODoVnWJ+OvRA3tXdl3qKdTBfWv3aAKVLWCJYg21rjpD0QSGStQer\ngm8IQhEQXq8bdkaIFfRVZWBsfhrwfoU0ajTNqLopHcJIxBrcpqAWGT6wbjLuWWd3\nYWeVB9YNAgMBAAECggEALSFUupYgbvrPtTjWIglkvbs1V5xxOWad6e7c1mS4b2K8\nuKscy4lDUjKTH85kEIYkiO/EhxAp6h2z0IwEVBSIhK/2bO9vei9kXoUJt9f9YG5Q\nOGzaUNa+WqGyV4X5yVe5PZHMo1LE4sWzrMAKeUXhX7sfAqshoyL0FsrbVgapwRQL\nN8G1ZJozDjiULJIevZ/hIYlkm3wTiX4th9f4dNwGC1AiFUPf0MNyFIlU5r4HPj1H\nE7A2YlFpOMHyGEvVCT0h3O60somJK58SMdUsCwcY28PNIGtpDnL7PKuLY22k+dzH\nfAoGJ+PbSRTd4oeVHNnuvWKVo9k6vNvY5B4jumwxqQKBgQDx1QpdeiZkomayo34k\nxYgZ7FetjpTSp9Mxm9KGpYtD1ymOweb9FzcHkCxpn38LcDJjOi4gW/T8TBaKcfug\nOR7C+MWVUYGbgFBrnho6nl1SzrWsAH1EIl+ZSsEcqqWfBrGya69R150pemMYBDsu\neyV+SNV5vtpNOEJ13my3dCdPlQKBgQDeU7XWefFJsymgCa01F4LFa/IbglsKLq1t\nvLVTPVn7KVzrUkihHyb+PmkwR0sFtyX2FsByVZ0H7WSNRI0D9/0gBjR9zSULqmZb\nqFjuxguzh35ggX4vDNxeF79j38je4n4JeOCVsimqSaoQfZQvz1BgUyH3Y7sD74Ni\n3e2bFyqumQKBgQCVwV/R0zrDRu5h4WzUSJ6nrvv8tjbi3JqkNeKBDzLWp/9MMDdi\ns2WYgWd/YQ3Df480c2rtDwT+1/99bGhuJ/Esu/FfLkIckbE7c4S6mCciiG9oPEVW\nVBLvUqOTpPk7KWIRIy5GeEcS0H9c+AHOHuRw95l68v0spJJDe6HHWV6eoQKBgFQ/\nIE6PktE8pO9R+2J88D7jMrEd6mWnXmyQ750FSI2WFPHPElqLtXjuKWnz+gfGaQoh\ngPdSXdjdKhcl/NGeLTrvXwC0te7/uR3OYzTHszNqiocDSs+FbhPxp8Ku0C01YlEw\njtnq00MF+v2YuIiNZIW7uslF714EaqMSObFlS/UxAoGAUvB0gqA/I81ZgOtMJzkI\nMJG6eHSHat3ZhLUQhDtHvJse9ore3qqK1jUG6irrtIYHc6Tr56g8KtVyrv+YmLVH\nuFLZIvPGu3RZ5ksVGc6mHjOx8/MfJsrWu2SQPuvhW0Ln++SIx2RvwF/E1+Xiktls\niNzQTO6IMkKZ0fvkP05ekx4=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@luo-ancient-movies-com.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token",
};

export const PROJECT_ID = SERVICE_ACCOUNT.project_id;
export const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function b64url(buf: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof buf === "string") bytes = new TextEncoder().encode(buf);
  else if (buf instanceof Uint8Array) bytes = buf;
  else bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: SERVICE_ACCOUNT.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(SERVICE_ACCOUNT.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch(SERVICE_ACCOUNT.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth token failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

// Firestore document helpers (REST API value encoding)
type FsValue = any;
function toFsValue(v: any): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v) };
}
function fromFsValue(v: FsValue): any {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  return null;
}
export function fsFields(obj: Record<string, any>) {
  const fields: Record<string, FsValue> = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = toFsValue(val);
  return fields;
}
export function fsParse(fields: Record<string, FsValue>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = fromFsValue(v);
  return out;
}

export async function fsCreate(collection: string, docId: string, data: Record<string, any>) {
  const token = await getAccessToken();
  const url = `${FIRESTORE_BASE}/${collection}?documentId=${encodeURIComponent(docId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: fsFields(data) }),
  });
  if (!res.ok) throw new Error(`fsCreate failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fsGet(collection: string, docId: string): Promise<Record<string, any> | null> {
  const token = await getAccessToken();
  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fsGet failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return fsParse(json.fields || {});
}

// Atomic mark-used using updateMask + currentDocument precondition (used == false)
export async function fsAtomicMarkUsed(collection: string, docId: string): Promise<boolean> {
  const token = await getAccessToken();
  // Use commit with conditional update transform
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  const docName = `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const body = {
    writes: [
      {
        update: {
          name: docName,
          fields: fsFields({ used: true, usedAt: Date.now() }),
        },
        updateMask: { fieldPaths: ["used", "usedAt"] },
        currentDocument: { exists: true },
      },
    ],
  };
  const res = await fetch(commitUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`fsAtomicMarkUsed failed: ${res.status} ${await res.text()}`);
  return res.ok;
}
