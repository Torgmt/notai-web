const DEV = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
export const devHeaders = () => (DEV ? { "X-Debug-Bypass-Auth": "1" } : {});
export const API = "/api";
export async function health() {
  const r = await fetch(`${API}/health`);
  if (!r.ok) throw new Error(`/health ${r.status}`);
  return r.json();
}

export async function chat(payload: {
  prompt: string;
  system?: string;
  max_tokens?: number;
  temperature?: number;
}) {
  const r = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Bypass-Auth": "1"
    },
    body: JSON.stringify({ max_tokens: 800, temperature: 0.4, ...payload })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`chat ${r.status}: ${t}`);
  }
  return r.json() as Promise<{ reply: string }>;
}

export type Segment = { id: number; start: number; end: number; text: string };

export async function transcribe(file: File, lang_hint?: string) {
  const fd = new FormData();
  fd.append("file", file);
  if (lang_hint) fd.append("lang_hint", lang_hint);

  const r = await fetch(`${API}/transcribe`, {
    method: "POST",
    headers: { "X-Debug-Bypass-Auth": "1" },
    body: fd
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`transcribe ${r.status}: ${t}`);
  }
  return r.json() as Promise<{
    text: string;
    language?: string;
    duration?: number;
    segments: Segment[];
  }>;
}
export async function postNote(text: string): Promise<{ saved: boolean; id: string | null }> {
  const res = await fetch(`${API}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...devHeaders() },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`POST /note failed: ${res.status} ${res.statusText} ${t}`);
  }
  return res.json();
}




