import { create } from "zustand";
import { resumeAudio, setSound, sfx } from "./audio";
import { api, detail, readDb, storage } from "./api";
import { CLASSES, HUNTS, ITEMS, potPrice, RECIPES, SKILLS, TRAINS, VERSION } from "./data";
import {
  createDemo,
  createHero,
  normalize,
  simulate,
  stats,
  type StepOut,
} from "./engine";
import type { AttrKey, ClassId, LogEvent, Player, SlotKey } from "./types";

export type TabId = "jornada" | "heroi" | "vila" | "salao";

type Toast = { id: number; text: string };
export type Welcome = {
  awayMs: number;
  gold: number;
  levels: number;
  drops: { name: string; rarity: number; q: number }[];
  extra: number;
};

type State = {
  loading: boolean;
  phase: "auth" | "class" | "play";
  mode: "in" | "up";
  username: string | null;
  token: string | null;
  admin: boolean;
  demo: boolean;
  player: Player | null;
  log: LogEvent[];
  kills: number;
  tab: TabId;
  journey: "treino" | "caca";
  heroTab: "equip" | "attr";
  townTab: "loja" | "ferr";
  rankBy: "cp" | "l";
  sound: boolean;
  toasts: Toast[];
  welcome: Welcome | null;
  drop: string | null;
  flash: boolean;
  news: boolean;
  adminOpen: boolean;
  boot: () => void;
  setMode: (mode: "in" | "up") => void;
  login: (username: string, password: string) => Promise<string | null>;
  begin: (name: string, cls: ClassId) => string | null;
  startDemo: () => void;
  logout: () => void;
  tick: () => void;
  persist: () => Promise<void>;
  setTab: (tab: TabId) => void;
  setJourney: (j: "treino" | "caca") => void;
  setHeroTab: (t: "equip" | "attr") => void;
  setTownTab: (t: "loja" | "ferr") => void;
  setRankBy: (r: "cp" | "l") => void;
  toggleSound: () => void;
  startAct: (kind: "t" | "h", id: string) => void;
  halt: () => void;
  equip: (id: string) => void;
  unequip: (slot: SlotKey) => void;
  sell: (id: string) => void;
  sellAll: (maxRarity: number) => void;
  addAttr: (k: AttrKey) => void;
  respec: () => void;
  buy: (id: string, qty?: number) => void;
  forge: (id: string) => void;
  cast: (index: number) => void;
  revive: () => void;
  pushToast: (text: string) => void;
  closeWelcome: () => void;
  closeDrop: () => void;
  setNews: (open: boolean) => void;
  setAdmin: (open: boolean) => void;
};

let toastSeq = 0;
let steps = 0;
let saving = false;
let booted = false;

function welcomeFrom(src: Player, out: StepOut): Welcome {
  const map = new Map<string, { name: string; rarity: number; q: number }>();
  for (const d of out.rare) {
    const it = ITEMS[d.id];
    if (!it) continue;
    const cur = map.get(d.id) || { name: it.n, rarity: d.rarity, q: 0 };
    cur.q += 1;
    map.set(d.id, cur);
  }
  const drops = [...map.values()].sort((a, b) => b.rarity - a.rarity || b.q - a.q);
  return {
    awayMs: out.awayMs,
    gold: Math.max(0, Math.floor(out.goldDelta)),
    levels: out.levelDelta,
    drops: drops.slice(0, 6),
    extra: Math.max(0, drops.length - 6),
  };
}

function applyStep(src: Player, out: StepOut) {
  const st = useGame.getState();
  const lines = [...out.events].reverse();
  const long = out.awayMs >= 60_000 && !!src.act;
  useGame.setState({
    player: out.player,
    log: [...lines, ...st.log].slice(0, 40),
    kills: st.kills + out.kills,
    welcome: long ? welcomeFrom(src, out) : st.welcome,
    drop: st.drop || out.modal,
  });
  if (out.died) {
    useGame.setState({ flash: true });
    sfx.die();
    window.setTimeout(() => useGame.setState({ flash: false }), 1200);
  }
  if (!long) {
    for (const e of out.events) {
      if (e.kind === "level") useGame.getState().pushToast(e.text);
    }
    if (out.events.some((e) => e.kind === "level")) sfx.lvl();
    const top = out.events.reduce((m, e) => (e.kind === "drop" ? Math.max(m, e.rarity || 0) : m), 0);
    if (top >= 1 && out.awayMs < 5000) sfx.drop(top);
  }
}

async function saveSnapshot(player: Player, username: string, token: string | null) {
  const copy = { ...player, cp: stats(player, false).cp };
  const db = readDb();
  db[username] = { p: copy };
  storage.set("eld_db", JSON.stringify(db));
  if (!token || saving) return;
  saving = true;
  try {
    const { res, data } = await api(
      "/api/save",
      { method: "POST", body: JSON.stringify({ username, player_data: copy }) },
      token,
    );
    if (res.status === 401) {
      kick("Sua conta foi aberta em outro lugar ou a sessão expirou. Entre novamente.");
      return;
    }
    if (res.status === 403) {
      kick(detail(data));
      return;
    }
    const updated = data.updated;
    const cur = useGame.getState().player;
    if (updated && cur && useGame.getState().username === username) {
      const merged = normalize({ ...cur, ...(updated as object), last: cur.last });
      if (merged) {
        merged.cp = stats(merged, false).cp;
        useGame.setState({ player: merged });
        useGame.getState().pushToast("O administrador atualizou sua conta.");
      }
    }
  } catch {
    /* fica o save local */
  } finally {
    saving = false;
  }
}

function kick(msg: string) {
  storage.del("eld_tok");
  storage.del("eld_ses");
  useGame.setState({
    phase: "auth",
    player: null,
    token: null,
    username: null,
    admin: false,
    demo: false,
    loading: false,
    welcome: null,
    drop: null,
  });
  useGame.getState().pushToast(msg);
}

async function enter(username: string, token: string) {
  try {
    const { res, data } = await api(`/api/load/${encodeURIComponent(username)}`, {}, token);
    if (res.status === 401) {
      kick("Sessão expirada. Entre novamente.");
      return "Sessão expirada. Entre novamente.";
    }
    if (res.status === 403) {
      const msg = detail(data);
      kick(msg);
      return msg;
    }
    if (!res.ok) return "Não foi possível carregar o progresso.";
    const remote = data.status === "encontrado" ? normalize(data.player_data) : null;
    const db = readDb();
    const local = db[username]?.p ? normalize(db[username].p) : null;
    const picked = remote && local ? ((local.last || 0) > (remote.last || 0) ? local : remote) : remote || local;
    useGame.setState({
      username,
      token,
      admin: !!data.admin,
      demo: false,
      loading: false,
      kills: 0,
      log: [],
    });
    if (!picked) {
      useGame.setState({ phase: "class", player: null });
      return null;
    }
    useGame.setState({ phase: "play", player: picked });
    useGame.getState().tick();
    void useGame.getState().persist();
    void checkNews();
    return null;
  } catch {
    const db = readDb();
    const local = db[username]?.p ? normalize(db[username].p) : null;
    if (!local) return "Servidor indisponível e não há um save neste aparelho.";
    useGame.setState({
      phase: "play",
      player: local,
      username,
      token,
      demo: false,
      loading: false,
      admin: false,
      kills: 0,
      log: [],
    });
    useGame.getState().tick();
    return null;
  }
}

async function checkNews() {
  const old = storage.get("eld_ver");
  storage.set("eld_ver", VERSION);
  if (old && old !== VERSION) {
    useGame.getState().pushToast(`Atualização v${VERSION}. As novidades estão no pergaminho.`);
    useGame.setState({ news: true });
  }
  try {
    const { data } = await api("/api/version");
    if (typeof data.version !== "string") return;
    const key = `${data.version}|${String(data.commit || "")}`;
    const prev = storage.get("eld_srv");
    storage.set("eld_srv", key);
    if (prev && prev !== key) useGame.getState().pushToast(`Servidor atualizado (v${data.version}).`);
  } catch {
    /* servidor dormindo */
  }
}

function mutate(fn: (p: Player) => string | null, sound?: () => void) {
  const p = useGame.getState().player;
  if (!p) return;
  const n = structuredClone(p);
  const err = fn(n);
  if (err) {
    useGame.getState().pushToast(err);
    return;
  }
  n.cp = stats(n, false).cp;
  useGame.setState({ player: n });
  sound?.();
  void useGame.getState().persist();
}

export const useGame = create<State>((set, get) => ({
  loading: false,
  phase: "auth",
  mode: "in",
  username: null,
  token: null,
  admin: false,
  demo: false,
  player: null,
  log: [],
  kills: 0,
  tab: "jornada",
  journey: "caca",
  heroTab: "equip",
  townTab: "loja",
  rankBy: "cp",
  sound: true,
  toasts: [],
  welcome: null,
  drop: null,
  flash: false,
  news: false,
  adminOpen: false,

  boot() {
    if (booted) return;
    booted = true;
    const sound = storage.get("eld_snd") !== "0";
    setSound(sound);
    const token = storage.get("eld_tok");
    const ses = storage.get("eld_ses");
    set({ sound });
    if (token && ses) {
      set({ loading: true, token, username: ses });
      void enter(ses, token);
    }
  },

  setMode(mode) {
    set({ mode });
  },

  async login(username, password) {
    const u = username.trim().toLowerCase();
    const mode = get().mode;
    if (!/^[a-z0-9_]{3,16}$/.test(u)) return "Use de 3 a 16 caracteres: letras, números ou _.";
    if (password.length < 4 || password.length > 128) return "A senha precisa ter de 4 a 128 caracteres.";
    set({ loading: true });
    try {
      const { res, data } = await api(`/api/${mode === "up" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({ username: u, password }),
      });
      if (!res.ok) {
        set({ loading: false });
        return detail(data);
      }
      const token = typeof data.token === "string" ? data.token : "";
      if (!token) {
        set({ loading: false });
        return "O servidor não devolveu uma sessão.";
      }
      storage.set("eld_tok", token);
      storage.set("eld_ses", u);
      set({ token, username: u, demo: false });
      return await enter(u, token);
    } catch {
      set({ loading: false });
      return "Servidor indisponível. Se ele estiver dormindo, espere um minuto e tente de novo.";
    }
  },

  begin(name, cls) {
    const n = name.trim();
    if (n.length < 2) return "Dê um nome ao herói, com pelo menos 2 letras.";
    if (!CLASSES[cls]) return "Escolha uma classe para continuar.";
    const p = createHero(n.slice(0, 14), cls);
    set({ player: p, phase: "play", kills: 0, log: [] });
    void get().persist();
    void checkNews();
    return null;
  },

  startDemo() {
    set({
      demo: true,
      phase: "play",
      username: null,
      token: null,
      admin: false,
      loading: false,
      player: createDemo(),
      kills: 0,
      log: [{ kind: "note", text: "Demonstração local. Nada desta tela vai para o servidor." }],
      welcome: null,
      drop: null,
    });
  },

  logout() {
    const { demo, player, username, token } = get();
    if (!demo && player && username) {
      get().tick();
      const snap = get().player;
      if (snap) void saveSnapshot(snap, username, token);
    }
    storage.del("eld_ses");
    storage.del("eld_tok");
    set({
      phase: "auth",
      player: null,
      token: null,
      username: null,
      admin: false,
      demo: false,
      loading: false,
      welcome: null,
      drop: null,
      news: false,
      adminOpen: false,
      flash: false,
      mode: "in",
    });
  },

  tick() {
    const { phase, player } = get();
    if (phase !== "play" || !player) return;
    const out = simulate(player, Date.now());
    applyStep(player, out);
    steps = (steps + 1) % 5;
    if (steps === 0) void get().persist();
  },

  async persist() {
    const { player, username, token, demo } = get();
    if (!player || !username || demo) return;
    await saveSnapshot(player, username, token);
  },

  setTab(tab) {
    set({ tab });
  },
  setJourney(journey) {
    set({ journey });
  },
  setHeroTab(heroTab) {
    set({ heroTab });
  },
  setTownTab(townTab) {
    set({ townTab });
  },
  setRankBy(rankBy) {
    set({ rankBy });
  },

  toggleSound() {
    const sound = !get().sound;
    setSound(sound);
    storage.set("eld_snd", sound ? "1" : "0");
    set({ sound });
    if (sound) {
      resumeAudio();
      sfx.equip();
    }
  },

  startAct(kind, id) {
    get().tick();
    mutate((p) => {
      const found = (kind === "h" ? HUNTS : TRAINS).find((z) => z.id === id);
      if (!found) return "Lugar desconhecido.";
      if (kind === "t" && p.level < (found.req || 1)) return `Requer nível ${found.req}.`;
      if (kind === "h" && (p.cd || 0) > Date.now()) return "Você ainda está se recuperando da derrota.";
      if (kind === "h" && p.hp < stats(p, false).max * 0.2) return "Vida baixa demais para caçar. Descanse um pouco.";
      p.act = { t: kind, id };
      return null;
    });
  },

  halt() {
    get().tick();
    mutate((p) => {
      p.act = null;
      return null;
    });
  },

  equip(id) {
    mutate((p) => {
      const it = ITEMS[id];
      if (!it?.s || (p.inv[id] || 0) <= 0) return "Item indisponível.";
      
      let targetSlot = it.s;
      if (it.s === "anel") {
        if (!p.eq.anel1) targetSlot = "anel1";
        else if (!p.eq.anel2) targetSlot = "anel2";
        else targetSlot = "anel1";
      }

      const old = p.eq[targetSlot];
      p.inv[id] -= 1;
      if (old) p.inv[old] = (p.inv[old] || 0) + 1;
      p.eq[targetSlot] = id;
      p.hp = Math.min(p.hp, stats(p, false).max);
      return null;
    }, () => sfx.equip());
  },

  unequip(slot) {
    mutate((p) => {
      const old = p.eq[slot];
      if (!old) return null;
      p.inv[old] = (p.inv[old] || 0) + 1;
      p.eq[slot] = null;
      p.hp = Math.min(p.hp, stats(p, false).max);
      return null;
    });
  },

  sell(id) {
    mutate((p) => {
      const it = ITEMS[id];
      const have = p.inv[id] || 0;
      if (!it || have <= 0) return "Nada para vender.";
      if (it.s) {
        p.inv[id] = have - 1;
        p.gold += it.v;
      } else {
        p.gold += it.v * have;
        p.inv[id] = 0;
      }
      return null;
    });
  },

  sellAll(maxRarity) {
    mutate((p) => {
      let g = 0;
      for (const id of Object.keys(p.inv)) {
        const it = ITEMS[id];
        if (it?.s && (it.r || 0) <= maxRarity && p.inv[id] > 0) {
          g += it.v * p.inv[id];
          p.inv[id] = 0;
        }
      }
      if (!g) return "Nada para vender.";
      p.gold += g;
      get().pushToast(`Vendido por ${Math.floor(g).toLocaleString("pt-BR")} de ouro.`);
      return null;
    });
  },

  addAttr(k) {
    mutate((p) => {
      if (p.pts <= 0) return "Sem pontos livres.";
      p.pts -= 1;
      p.at[k] += 1;
      return null;
    });
  },

  respec() {
    mutate((p) => {
      const cost = 50 * p.level;
      if (p.gold < cost) return "Ouro insuficiente para redistribuir.";
      p.gold -= cost;
      p.at = { ...CLASSES[p.cls].a };
      p.pts = (p.level - 1) * 3;
      p.hp = Math.min(p.hp, stats(p, false).max);
      return null;
    });
  },

  buy(id, qty = 1) {
    mutate((p) => {
      const n = Math.max(1, Math.floor(qty));
      if (id === "pot") {
        const price = potPrice(p.level);
        const s = stats(p, false);
        if (p.gold < price) return "Ouro insuficiente.";
        if (p.hp >= s.max) return "Sua vida já está cheia.";
        p.gold -= price;
        p.hp = s.max;
        return null;
      }
      const it = ITEMS[id];
      if (!it) return "Item desconhecido.";
      const price = it.v * 6 * n;
      if (p.gold < price) return "Ouro insuficiente.";
      p.gold -= price;
      p.inv[id] = (p.inv[id] || 0) + n;
      return null;
    });
  },

  forge(id) {
    mutate((p) => {
      const rec = RECIPES.find((r) => r.id === id);
      const it = ITEMS[id];
      if (!rec || !it) return "Receita desconhecida.";
      if (p.gold < rec.gold || Object.entries(rec.mats).some(([k, v]) => (p.inv[k] || 0) < v)) {
        return "Faltam materiais ou ouro para forjar.";
      }
      p.gold -= rec.gold;
      for (const [k, v] of Object.entries(rec.mats)) p.inv[k] -= v;
      p.fg = (p.fg || 0) + 1;
      p.inv[id] = (p.inv[id] || 0) + 1;
      get().pushToast(`Você forjou ${it.n}.`);
      const cur = get().log;
      const line: LogEvent = { kind: "forge", text: `Forjado: ${it.n}`, rarity: it.r || 0 };
      set({ log: [line, ...cur].slice(0, 40) });
      return null;
    }, () => sfx.forge());
  },

  cast(index) {
    mutate((p) => {
      const s = SKILLS[p.cls][index];
      if (!s) return "Habilidade desconhecida.";
      const now = Date.now();
      const st = p.sk?.[index];
      if (p.level < s.level) return `Requer nível ${s.level}.`;
      if (st && st.c > now) return "Habilidade em recarga.";
      p.sk = { ...(p.sk || {}) };
      p.sk[index] = { u: now + s.dur * 1000, c: now + s.cd * 1000 };
      if (s.fx.heal) {
        const snap = stats(p, false);
        p.hp = Math.min(snap.max, p.hp + snap.max * s.fx.heal);
      }
      const cur = get().log;
      const line: LogEvent = { kind: "skill", text: `${s.name}. ${s.desc}` };
      set({ log: [line, ...cur].slice(0, 40) });
      return null;
    }, () => sfx.skill());
  },

  revive() {
    mutate((p) => {
      const cost = 50 * p.level;
      if ((p.cd || 0) <= Date.now()) return null;
      if (p.gold < cost) return "Ouro insuficiente para reviver.";
      p.gold -= cost;
      p.cd = 0;
      p.hp = stats(p, false).max;
      const cur = get().log;
      const line: LogEvent = { kind: "revive", text: `Você pagou ${cost} de ouro e voltou à vida.` };
      set({ log: [line, ...cur].slice(0, 40) });
      return null;
    });
  },

  pushToast(text) {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, text }].slice(-3) });
    window.setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3800);
  },

  closeWelcome() {
    set({ welcome: null });
  },
  closeDrop() {
    set({ drop: null });
  },
  setNews(news) {
    set({ news });
  },
  setAdmin(adminOpen) {
    set({ adminOpen });
  },
}));
