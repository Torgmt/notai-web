import { useEffect, useState } from "react";
import { auth, onAuth, signIn, signOut } from "../lib/firebase";

export default function AuthBadge() {
  const [user, setUser] = useState(() => auth.currentUser);
  useEffect(() => onAuth(setUser), []);

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="rounded-xl px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700"
      >
        Logg på
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full" />}
      <span className="text-sm">{user.displayName ?? user.email}</span>
      <button
        onClick={signOut}
        className="rounded-xl px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700"
      >
        Logg ut
      </button>
    </div>
  );
}
