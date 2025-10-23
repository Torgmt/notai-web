import { apiGet, apiPost, apiUrl } from './api';
import AuthBadge from "./components/AuthBadge";
import React from "react";
import "./index.css";

const API = "/api";

type Msg = { role: "user" | "assistant"; text: string };
type Stage = "transcribing"|"result"|"chat";
type Card = "record"|"upload"|"youtube"|null;

/** Spinner-tannhjul i knappestørrelse */
const LoaderGear: React.FC<{label?:string}> = ({label="Transkriberer…"}) => (
  <div className="inline-flex items-center gap-3">
    <div className="h-10 px-6 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <path d="M12 6.5a5.5 5.5 0 1 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 3v2M12 19v2M4.9 7.1l1.4 1.4M17.7 19.3l1.4 1.4M3 12h2M19 12h2M4.9 16.9l1.4-1.4M17.7 4.7l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    <span className="text-slate-300 text-sm">{label}</span>
  </div>
);

export default function App() {
  // --- MODE-indikator (henter /api/config) ---
  const [mode, setMode] = React.useState<string|null>(null);
  React.useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => setMode(j?.mode ?? null))
      .catch(() => setMode(null));
  }, []);

  // Kort/panel
  const [expanded, setExpanded] = React.useState<Card>(null);
  const [fadeIn, setFadeIn] = React.useState(true);

  // Opptak
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [recording, setRecording] = React.useState(false);

  // Inndata
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [ytUrl, setYtUrl] = React.useState("");

  // Progress / videre steg
  const [stage, setStage] = React.useState<Stage | null>(null);

  // Resultat / chat
  const [transcript, setTranscript] = React.useState<string>("");
  const [aiBusy, setAiBusy] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);

  function toggle(card: Card) {
    setFadeIn(false);
    window.setTimeout(() => {
      setExpanded(prev => prev === card ? null : card);
      setFadeIn(true);
    }, 90);
  }

  // Opptak
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      alert("Kunne ikke starte opptak. Sjekk mikrofontillatelse.");
    }
  }
  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  // Transkripsjon
  async function transcribeBlob(blob: Blob) {
    setStage("transcribing");
    const form = new FormData();
    form.append("file", blob, "recording.webm");
    try {
      const r = await fetch(`${API}/transcribe`, { method: "POST", body: form });
      const j = await r.json();
      setTranscript(j.text || "");
      setStage("result");
    } catch {
      alert("Transkripsjon feilet."); setStage(null);
    }
  }
  async function transcribeFile(f: File) {
    setStage("transcribing");
    const form = new FormData();
    form.append("file", f, f.name);
    try {
      const r = await fetch(`${API}/transcribe`, { method: "POST", body: form });
      const j = await r.json();
      setTranscript(j.text || "");
      setStage("result");
    } catch {
      alert("Transkripsjon feilet."); setStage(null);
    }
  }
  async function transcribeYouTube(url: string) {
    setStage("transcribing");
    try {
      const r = await fetch(`${API}/transcribe?youtube_url=` + encodeURIComponent(url), { method: "POST" });
      const j = await r.json();
      setTranscript(j.text || "");
      setStage("result");
    } catch {
      alert("Transkripsjon feilet."); setStage(null);
    }
  }

  // AI
  async function askAI_onceNote() {
    setAiBusy(true);
    try {
      const prompt = `Lag et godt, strukturert notat fra følgende transkripsjon. Bruk overskrifter og punktlister når det hjelper. Norsk språk.\n\nTRANSKRIPSJON:\n${transcript}`;
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 600, temperature: 0.2 })
      });
      const j = await r.json();
      const text = j?.reply ?? j?.text ?? j?.response ?? (typeof j==="string" ? j : JSON.stringify(j));
      setMessages([{ role: "assistant", text }]);
      setStage("chat");
    } catch {
      alert("AI-notat feilet.");
    } finally { setAiBusy(false); }
  }
  async function sendChat(input: string) {
    const msg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, msg]);
    try {
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, max_tokens: 400, temperature: 0.3 })
      });
      const j = await r.json();
      const text = j?.reply ?? j?.text ?? j?.response ?? (typeof j==="string" ? j : JSON.stringify(j));
      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Beklager, forespørselen feilet." }]);
    }
  }

  // UI — shell
  const PageShell: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="min-h-dvh bg-[#0b1020] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-20">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/90" />
            <span className="font-semibold tracking-tight">Notai</span>
          </div>
          {/* MODE-indikator */}
          {mode && (
            <div className="rounded-xl px-3 py-1 text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300 backdrop-blur-sm shadow-sm">
              {mode === "openai" ? (
                <span className="text-emerald-400">?? GPT-4o-mini aktiv</span>
              ) : (
                <span className="text-indigo-400">?? Ollama aktiv</span>
              )}
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  );

  // Tre kort i én vannrett rad (låst på desktop)
  const RowCards = () => (
    <div className="flex flex-col md:flex-row md:items-stretch gap-4">
      <Card title="Spill inn" desc="Ta opp med mikrofon og få tekst." active={expanded==="record"} onClick={()=>toggle("record")} />
      <Card title="Legg inn fil" desc="Velg fil eller dra & slipp (i panelet)." active={expanded==="upload"} onClick={()=>toggle("upload")} />
      <Card title="YouTube" desc="Lim inn lenke og transkriber." active={expanded==="youtube"} onClick={()=>toggle("youtube")} />
    </div>
  );

  const Card: React.FC<{title:string; desc:string; active?:boolean; onClick:()=>void}> =
  ({title, desc, active=false, onClick}) => (
    <button
      onClick={onClick}
      className={
        "group basis-1/3 rounded-2xl border p-5 text-left transition-all outline-none " +
        "focus:ring-4 " +
        (active
          ? "border-indigo-500/50 bg-slate-900/70"
          : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/60 focus:ring-indigo-500/20 hover:-translate-y-0.5")
      }>
      <div className="flex items-center gap-3">
        <div className={"h-2 w-2 rounded-full " + (active ? "bg-indigo-400" : "bg-slate-600")} />
        <div className="text-base font-medium">{title}</div>
        <svg className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-slate-400 text-sm mt-2">{desc}</p>
    </button>
  );

  // Panelwrapper – “dras ned” følelse: max-height + translateY/opacity
  function PanelWrapper({show, children}:{show:boolean; children:React.ReactNode}) {
    return (
      <div className={"overflow-hidden transition-all duration-400 ease-out " + (show ? "max-h-[1600px]" : "max-h-0")}>
        <div className={
          "rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-6 mt-4 " +
          "transition-[opacity,transform] duration-300 " +
          (show && fadeIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")
        }>
          {children}
        </div>
      </div>
    );
  }

  // Panelinnhold
  const PanelRecord = () => (
    <>
      <div className="flex items-center gap-3 mb-3">
        {!recording ? (
          <button className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30" onClick={startRecording}>Start opptak</button>
        ) : (
          <button className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/30" onClick={stopRecording}>Stopp</button>
        )}
        <button
          className="rounded-xl px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-600/30 disabled:opacity-50"
          disabled={recording || chunksRef.current.length === 0 || stage==="transcribing"}
          onClick={() => transcribeBlob(new Blob(chunksRef.current, { type: "audio/webm" }))}
        >
          {stage==="transcribing" ? <LoaderGear label="Transkriberer…" /> : "Transkriber"}
        </button>
      </div>
      <p className="text-sm text-slate-400">Når du stopper opptaket kan du transkribere med en gang.</p>
    </>
  );

  const PanelUpload = () => {
    const [isDropping, setIsDropping] = React.useState(false);
    return (
      <div>
        <div
          className={
            "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition " +
            (isDropping ? "border-indigo-400 bg-slate-800/60" : "border-slate-700 bg-slate-800/40 hover:bg-slate-800/50")
          }
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e)=>{ e.preventDefault(); setIsDropping(true); }}
          onDragLeave={()=> setIsDropping(false)}
          onDrop={(e)=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) setFile(f); setIsDropping(false); }}
        >
          <div className="mb-2 font-medium">Dra & slipp fil her</div>
          <div className="text-sm text-slate-400 mb-4">…eller trykk på knappen under</div>
          <button
            className="rounded-xl px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600"
            onClick={(e)=>{ e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Velg fil
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={(e)=>{ const f=e.target.files?.[0]||null; setFile(f); }}
          />
        </div>

        {file && (
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-slate-400">{Math.round(file.size/1024)} KB</div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700" onClick={() => { setFile(null); }}>Fjern</button>
              <button className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                onClick={() => file && transcribeFile(file)} disabled={stage==="transcribing"}>
                {stage==="transcribing" ? <LoaderGear label="Transkriberer…" /> : "Transkriber"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PanelYouTube = () => (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Lim inn YouTube-lenke"
        value={ytUrl}
        onChange={e=>setYtUrl(e.target.value)}
      />
      <button
        className="rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
        disabled={!ytUrl.trim() || stage==="transcribing"}
        onClick={() => transcribeYouTube(ytUrl.trim())}
      >
        {stage==="transcribing" ? <LoaderGear label="Transkriberer…" /> : "Transkriber"}
      </button>
    </div>
  );

  // Videre steg
  const StageBlocks = () => {
    if (!stage) return null;
    if (stage === "transcribing") {
      return (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-6 mt-4">
          <LoaderGear />
        </div>
      );
    }
    if (stage === "result") {
      return (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Whisper-tekst</h3>
            <button className="rounded-xl px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50" onClick={askAI_onceNote} disabled={aiBusy}>
              {aiBusy ? "Tenker…" : "Spør AI"}
            </button>
          </div>
          <div className="whitespace-pre-wrap">{transcript || "—"}</div>
        </div>
      );
    }
    if (stage === "chat") {
      return (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-6 mt-4">
          <h3 className="font-medium mb-4">AI-notat & chat</h3>
          <div className="space-y-3">
            {messages.length === 0 && <p className="text-slate-400 text-sm">Ingen meldinger ennå.</p>}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={"inline-block px-3 py-2 rounded-xl " + (m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-100")}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={mode==="openai" ? "Skriv til GPT…" : "Skriv til OLLAMA…"}
              onKeyDown={(e)=>{ const el=e.target as HTMLInputElement; if(e.key==="Enter"&&el.value.trim()){ const v=el.value.trim(); el.value=""; sendChat(v); } }}
            />
            <button className="rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-500" onClick={()=>{
              const el = document.activeElement as HTMLInputElement | null;
              if(el && el.tagName==="INPUT" && el.value.trim()){ const v=el.value.trim(); el.value=""; sendChat(v); }
            }}>Send</button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <PageShell>
      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hva vil du gjøre?</h1>
        <p className="text-slate-400 mt-1">Tre valg i rad. Klikk ett – panelet dras rolig ned under raden.</p>
      </section>

      <RowCards />

      {/* Myk pull-down: kun ett panel synlig om gangen */}
      <PanelWrapper show={expanded==="record"}><PanelRecord /></PanelWrapper>
      <PanelWrapper show={expanded==="upload"}><PanelUpload /></PanelWrapper>
      <PanelWrapper show={expanded==="youtube"}><PanelYouTube /></PanelWrapper>

      {/* Videre steg */}
      <StageBlocks />
    </PageShell>
  );
}






