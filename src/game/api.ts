import { SRV } from "./data";

export function detail(data: unknown) {
  if (!data || typeof data !== "object") return "Algo deu errado.";
  const d = (data as { detail?: unknown }).detail;
  return typeof d === "string" ? d : "Dados inválidos.";
}

export async function api(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(SRV + path, { ...opts, headers });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, data };
}

const mem: Record<string, string> = {};

export const storage = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return mem[k] ?? null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      mem[k] = v;
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      delete mem[k];
    }
  },
};

export function readDb(): Record<string, { p?: unknown }> {
  try {
    const raw = JSON.parse(storage.get("eld_db") || "{}") as Record<string, { p?: unknown }>;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
