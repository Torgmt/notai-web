import React, { useState } from "react";
import { auth, googleProvider, appleProvider } from "./lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doEmailSignIn() {
    setBusy(true); setErr(null);
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); }
    catch (e: any) { setErr(e?.message ?? "Innlogging feilet"); }
    finally { setBusy(false); }
  }

  async function doEmailSignUp() {
    setBusy(true); setErr(null);
    try { await createUserWithEmailAndPassword(auth, email.trim(), pw); }
    catch (e: any) { setErr(e?.message ?? "Registrering feilet"); }
    finally { setBusy(false); }
  }

  async function doGoogle() {
    setBusy(true); setErr(null);
    try { await signInWithPopup(auth, googleProvider); }
    catch (e: any) { setErr(e?.message ?? "Google-innlogging feilet"); }
    finally { setBusy(false); }
  }

  async function doApple() {
    setBusy(true); setErr(null);
    try { await signInWithPopup(auth, appleProvider); }
    catch (e: any) { setErr(e?.message ?? "Apple-innlogging feilet"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
        <h1 className="text-2xl font-semibold mb-1">Logg inn</h1>
        <p className="text-sm text-slate-400 mb-6">Fortsett med e-post, Google eller Apple.</p>

        <div className="space-y-3">
          <input
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            type="email" placeholder="E-post" value={email} onChange={e=>setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            type="password" placeholder="Passord" value={pw} onChange={e=>setPw(e.target.value)}
          />

          <div className="flex gap-2">
            <button onClick={doEmailSignIn} disabled={busy}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-medium disabled:opacity-60">
              Logg inn
            </button>
            <button onClick={doEmailSignUp} disabled={busy}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 font-medium disabled:opacity-60">
              Opprett bruker
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900/60 px-3 text-xs text-slate-500">eller</span>
            </div>
          </div>

          <button onClick={doGoogle} disabled={busy}
            className="w-full rounded-xl bg-white text-black px-4 py-3 font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
            {/* Google G */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.651 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.793 6.053 29.64 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.814C14.464 15.108 18.861 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.793 6.053 29.64 4 24 4 15.317 4 7.961 9.065 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.165 0 9.86-1.977 13.409-5.197l-6.196-5.238C29.092 35.031 26.689 36 24 36c-5.202 0-9.62-3.318-11.281-7.955l-6.542 5.036C7.803 38.772 15.269 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.237-2.266 4.166-4.195 5.565.002-.001 6.196 5.238 6.196 5.238C39.732 36.045 44 30.688 44 24c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            Fortsett med Google
          </button>

          <button onClick={doApple} disabled={busy}
            className="w-full rounded-xl bg-black text-white px-4 py-3 font-medium flex items-center justify-center gap-2 border border-slate-700 hover:bg-black/90 disabled:opacity-60">
            {/* Apple logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-current">
              <path d="M216.2 167.9c-4.9 11.2-7.4 16.2-13.9 26.1-9 13.6-21.7 30.6-37.5 30.7-14.1.1-17.8-9-37-9s-22.4 8.9-36.6 9.1c-15.7.3-27.8-14.8-36.8-28.3-20.1-29.4-35.5-83.1-14.9-119.2 10.3-18 28.8-29.4 49.1-29.7 15.3-.3 29.7 10.1 37 10.1s25.5-12.4 42.9-10.6c7.3.3 27.9 2.9 41.1 21.7-1.1.7-24.6 14.4-24.4 42.9.3 34.1 30 45.4 30.3 45.6-.3.8-4.8 16.7-9.3 30.6zM159.9 24.3c7.5-9.1 12.4-21.7 11-34.3-10.6.4-23.8 7.6-31.5 16.7-6.9 8-12.9 21-11.3 33.4 12.1.9 24.4-6.1 31.8-15.8z"/>
            </svg>
            Fortsett med Apple
          </button>

          {err && <p className="text-rose-400 text-sm">{err}</p>}
        </div>
      </div>
    </div>
  );
}
