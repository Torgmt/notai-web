export const apiJoin = (...parts: string[]) =>
  parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+/,'')))
    .join('/')
    .replace(/\/{2,}/g,'/');
