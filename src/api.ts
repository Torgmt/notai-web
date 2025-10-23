/**
 * Sentral API-helper som alltid ruter via Vercel-rewrite til /api/*.
 * Bruk:
 *   fetch(u("health"))
 *   axios.get(u("health"))
 */

import axios from "axios";

/** Frontend skal bruke relative kall. Base er alltid "/api". */
export const API = "/api";

/** Slår sammen base + path trygt */
export const u = (path: string) => {
  if (!path) return API;
  if (path.startsWith("/")) path = path.slice(1);
  return `${API}/${path}`;
};

/** Axios-instans – bruk http.get("health"), http.post("chat", data), etc. */
export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});
