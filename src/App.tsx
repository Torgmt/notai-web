import Transcriber from "./Transcriber";

export default function App() {
  return (
    <div>
      <div className="bg-grid" style={{position:"fixed", inset:0, opacity:.35, pointerEvents:"none"}}/>
      <header>
        <div className="container header">
          <div className="brand">
            <div className="brand-badge">✨</div>
            <span>notai</span>
          </div>
          <nav className="nav">Hjem · Min konto</nav>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Din AI-assistent for opptak og notater</h1>
          <p>Last opp lyd/video, få transkripsjon, faglig oppsummering, og lagre notater – alt i én strømlinjeformet arbeidsflyt.</p>
          <div className="badge">🛡️ Lokalt utviklingsmiljø – kun for deg</div>
        </section>

        <Transcriber />
      </main>

      <footer className="footer">© 2025 Notai</footer>
    </div>
  );
}
