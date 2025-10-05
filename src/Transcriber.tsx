import { useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";



const DEV = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
const devHeaders = () => (DEV ? { ...devHeaders() } : {});
/* ------- Math helpers ------- */
function normalizeMath(input: string): string {
  let t = input;
  t = t.replace(/\b(ganger|multiplisert(?:\s+med)?)\b/gi, "*");
  t = t.replace(/\bdelt\s+p[åa]\b/gi, "/");
  t = t.replace(/\bpi\b/gi, "\\\\pi").replace(/π/gi, "\\\\pi");
  t = t.replace(/\bi\s+annen\b/gi, "^2").replace(/\bi\s+tredje\b/gi, "^3");
  t = t.replace(/\bkvadrat(?:et|isk)?\b/gi, "^2").replace(/\bkubikk\b/gi, "^3");
  t = t.replace(/[ ]{2,}/g, " ");
  const fracRe = /(?:^|[^\w\\])([A-Za-z0-9_\\^{}().]+)\s+over\s+([A-Za-z0-9_\\^{}().]+)/gi;
  t = t.replace(fracRe, (m, a, b) => `${m.startsWith(a) ? "" : m[0]}\\\\frac{${a}}{${b}}`);
  t = t.replace(/\b([A-Za-z])_([A-Za-zæøåÆØÅ0-9]+)\b/g, "$1_{$2}");
  const lines = t.split(/\r?\n/).map((line) => {
    const s = line.trim();
    if (s.length > 180) return line;
    const looksMathy = /[=+\-*/^]|\\frac|\\pi|\b[A-Za-z]\d\b|\b\d+[.,]?\d*\b/.test(s);
    const hasEnd = /[.!?]$/.test(s);
    const already = /\$[^$]+\$/.test(s);
    const eqLike = /^\s*[A-Za-z\\][A-Za-z0-9_\\^{}]*\s*=/.test(s);
    if (already) return line;
    if (eqLike || (looksMathy && !hasEnd && s.length <= 120)) return line.replace(s, `$${s}$`);
    return line;
  });
  t = lines.join("\n");
  t = t.replace(/\\frac\{([^}]*)\*([^}]*)\}\{([^}]*)\}/g, (_m, x, y, z) => `\\frac{${x.trim()} ${y.trim()}}{${z.trim()}}`);
  t = t.replace(/\${2,}([^$]+)\${2,}/g, (_m, inner) => `$${inner}$`);
  return t;
}
function renderMath(text: string) {
  try {
    return text.replace(/\$(.+?)\$|\\\((.+?)\\\)/g, (_, a, b) => {
      const expr = (a || b || "").trim();
      return katex.renderToString(expr, { throwOnError: false, displayMode: false });
    });
  } catch { return text; }
}

/* ------- Utils ------- */
function dl(name: string, content: string, mime="text/markdown;charset=utf-8") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ------- Component ------- */
export default function Transcriber() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busySumm, setBusySumm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const niceName = useMemo(() => file?.name || "opptak", [file]);
  const transcriptHTML = out?.text ? renderMath(normalizeMath(out.text)) : "";
  const summaryHTML = summary ? renderMath(normalizeMath(summary)) : "";

  async function transcribe() {
    if (!file) { setErr("Velg eller slipp en fil først."); return; }
    setBusy(true); setErr(null); setSummary(null); setSaved(null); setOut(null);

    const form = new FormData();
    form.append("file", file);
    form.append("lang_hint", "no");

    try {
      const res = await fetch("/api/transcribe?vad=true&ts=false&beam_size=5&temperature=0.0", {
        method: "POST",
        headers: { ...devHeaders() },
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOut(data);
    } catch (e: any) {
      setErr(e.message || "Noe gikk galt under transkripsjon");
    } finally { setBusy(false); }
  }

  async function makeSummary() {
    if (!out?.text) return;
    setBusySumm(true); setErr(null); setSaved(null);

    const prompt = [
      "SVAR KUN PÅ NORSK (BOKMÅL). Du får en transkripsjon av undervisning/foredrag/forklaring.",
      "Skriv et nøytralt fagnotat: Sammendrag, Hovedprinsipper og metoder, Viktige formler/eksempler, Konklusjon.",
      "Bevar symboler og marker formler med dollartegn, f.eks. $V = \\frac{\\pi r^2 h}{3}$.",
      "Ingen meta-fraser. Ingen tidsstempler.",
      "", "TRANSKRIPSJON:", out.text
    ].join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...devHeaders() },
        body: JSON.stringify({ prompt, max_tokens: 850, temperature: 0.1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.reply || String(data));
    } catch (e: any) { setErr(e.message || "Klarte ikke å oppsummere"); }
    finally { setBusySumm(false); }
  }

  function copyTranscript() {
    if (!out?.text) return;
    navigator.clipboard.writeText(out.text).catch(() => {});
  }
  function downloadNote() {
    if (!out?.text) return;
    const md = [
      `# Notat – ${niceName}`, "", "## Transkripsjon", "", out.text, "",
      summary ? "## Oppsummering\n\n" + summary : ""
    ].join("\n");
    dl(`${niceName.replace(/\.[a-z0-9]+$/i, "")}-notat.md`, md);
  }
  async function saveNote() {
    if (!out?.text) return;
    setErr(null); setSaved(null);
    const md = [
      `# Notat – ${niceName}`, "", "## Transkripsjon", "", out.text, "",
      summary ? "## Oppsummering\n\n" + summary : ""
    ].join("\n");
    const payload = { title: `Notat – ${niceName.replace(/\.[a-z0-9]+$/i, "")}`, content: md, format: "markdown", source: "transcribe" };
    try {
      const res = await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...devHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved("Notat lagret ✓");
    } catch (e: any) { setErr(e.message || "Klarte ikke å lagre notat"); }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) setFile(f);
  }

  return (
    <section style={{ position:"relative", zIndex:1 }}>
      <div className="card">
        <div className="row">
          <div
            className="grow drop"
            onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}
            style={dragOver ? { outline: "2px solid rgba(56,189,248,.6)", outlineOffset: 2 } : undefined}
          >
            <label className="drop-inner">
              <div className="icon" aria-hidden>🎧</div>
              <div style={{flex:1}}>
                <div className="file-name">{file ? file.name : "Velg fil eller slipp her"}</div>
                <div className="file-info">Støtter lyd og video</div>
              </div>
              <input type="file" accept="audio/*,video/*" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:"none"}} />
            </label>
          </div>

          <button onClick={transcribe} disabled={!file || busy} className="btn btn-cyan">
            <span className="icon">⬆️</span>{busy ? "Transkriberer…" : "Transkriber"}
          </button>
          <button onClick={makeSummary} disabled={!out?.text || busySumm} className="btn btn-violet">
            <span className="icon">✨</span>{busySumm ? "Oppsummerer…" : "Oppsummer"}
          </button>
        </div>

        {(err || saved || out) && (
          <div className="status">
            {out && <>Språk: <span style={{color:"#e6edf7"}}>{out.language}</span> — Varighet: <span style={{color:"#e6edf7"}}>{out.duration?.toFixed?.(2)}s</span></>}
            {err && <div className="err">{err}</div>}
            {saved && <div className="ok">{saved}</div>}
          </div>
        )}

        <div className="grid">
          <div className="panel">
            <div className="head">Transkripsjon</div>
            <div className="body" dangerouslySetInnerHTML={{ __html: transcriptHTML || "<div style=color:rgba(255,255,255,.6)>Ingen transkripsjon ennå.</div>" }} />
            <div className="actions">
              <button onClick={copyTranscript} disabled={!out?.text} className="btn"><span className="icon">📋</span>Kopier</button>
              <button onClick={downloadNote} disabled={!out?.text} className="btn"><span className="icon">⬇️</span>Lag notat (.md)</button>
              <button onClick={saveNote} disabled={!out?.text} className="btn btn-primary"><span className="icon">💾</span>Lagre i Notai</button>
            </div>
          </div>

          <div className="panel">
            <div className="head">Oppsummering</div>
            <div className="body" dangerouslySetInnerHTML={{ __html: summaryHTML || "<div style=color:rgba(255,255,255,.6)>Ingen oppsummering ennå. Kjør “Oppsummer”.</div>" }} />
          </div>
        </div>
      </div>
    </section>
  );
}


