import {
  CLASSES,
  findZone,
  ITEMS,
  need,
  POOLS,
  RARITY_W,
  SKILLS,
} from "./data";
import { ATTR_KEYS, type AttrKey, type ClassId, type ItemPassives, type LogEvent, type Player, type SkillFx, type SlotKey, type Stats, type Zone } from "./types";

const EMPTY_BONUS = (): Record<AttrKey, number> => ({ for: 0, agi: 0, int: 0, sor: 0, vit: 0 });

export function passive(p: Player, key: keyof ItemPassives) {
  return Object.values(p.eq).reduce((acc, id) => acc + (id ? ITEMS[id]?.ps?.[key] || 0 : 0), 0);
}

export function skillVal(p: Player, key: keyof SkillFx, offline: boolean) {
  if (offline || !p.sk) return 0;
  const now = Date.now();
  return SKILLS[p.cls].reduce((acc, s, i) => {
    const st = p.sk?.[i];
    return acc + (st && st.u > now ? s.fx[key] || 0 : 0);
  }, 0);
}

export function stats(p: Player, offline: boolean): Stats {
  const c = CLASSES[p.cls];
  const attrs = { ...p.at };
  const bonus = EMPTY_BONUS();
  for (const id of Object.values(p.eq)) {
    const it = id ? ITEMS[id] : undefined;
    if (!it?.b) continue;
    for (const k of ATTR_KEYS) {
      const v = it.b[k] || 0;
      attrs[k] += v;
      bonus[k] += v;
    }
  }
  const m = c.m;
  const max = Math.floor((50 + attrs.vit * 10 + p.level * 5) * (1 + (m.hp || 0)));
  const dmg = Math.floor((attrs.for * 2 + attrs.agi + attrs.int * 2 + p.level * 2) * (1 + (m.dmg || 0)));
  const crit = Math.round(Math.min(60, attrs.agi * 0.5 + attrs.sor * 0.3 + (m.crit || 0) * 100) * 10) / 10;
  const xm = 1 + (m.xp || 0) + attrs.int * 0.01 + passive(p, "xp") + skillVal(p, "xp", offline);
  const gm = 1 + (m.gold || 0) + attrs.sor * 0.01 + skillVal(p, "gd", offline);
  const vr = 1 - Math.min(0.7, attrs.vit * 0.015);
  const base = Math.floor(dmg * 6 + max * 0.5 + (attrs.agi * 0.5 + attrs.sor * 0.3 + (m.crit || 0) * 100) * 8);
  const cp = (base * (1 + skillVal(p, "cp", offline))) | 0;
  return { attrs, bonus, mods: m, max, dmg, crit, xm, gm, vr, cp };
}

export function riskOf(p: Player, z: Zone, offline: boolean) {
  const s = stats(p, offline);
  const q = (z.pw ?? 0) * (1 - passive(p, "ig")) / (s.cp || 1);
  if (q < 1.2) return 0;
  return Math.round(Math.min(80, 20 + (q - 1.2) * 50) * (1 - Math.min(1, skillVal(p, "safe", offline))));
}

export function odds(lk: number) {
  const w = RARITY_W.map((v, r) => v * (1 + lk) ** Math.max(0, r - 2));
  const t = w.reduce((a, b) => a + b, 0);
  return w.map((v) => (v / t) * 100);
}

export function roll(lk: number) {
  const w = odds(lk);
  let x = Math.random() * 100;
  let r = 0;
  while (r < 6 && x >= w[r]) {
    x -= w[r];
    r++;
  }
  const pool = POOLS[r];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function cpDelta(p: Player, id: string) {
  const it = ITEMS[id];
  if (!it?.s) return 0;
  const before = stats(p, false).cp;
  const n = structuredClone(p);
  
  let target = it.s;
  if (it.s === "anel") {
    target = !p.eq.anel1 ? "anel1" : (!p.eq.anel2 ? "anel2" : "anel1");
  }
  
  n.eq[target] = id;
  return stats(n, false).cp - before;
}

export type StepOut = {
  player: Player;
  events: LogEvent[];
  kills: number;
  died: boolean;
  modal: string | null;
  awayMs: number;
  goldDelta: number;
  levelDelta: number;
  rare: { id: string; rarity: number }[];
};

export function simulate(src: Player, now: number): StepOut {
  const p = structuredClone(src);
  const gold0 = p.gold;
  const level0 = p.level;
  const awayMs = Math.max(0, now - p.last);
  const dt = Math.min(awayMs / 1000, 28800);
  p.last = now;
  const events: LogEvent[] = [];
  let kills = 0;
  let died = false;
  let modal: string | null = null;
  const rare: { id: string; rarity: number }[] = [];
  if ((p.cd || 0) <= now) p.cd = 0;
  if (dt <= 0) {
    p.cp = stats(p, false).cp;
    return { player: p, events, kills, died, modal, awayMs, goldDelta: 0, levelDelta: 0, rare };
  }
  const offline = dt > 5;
  const s = stats(p, offline);
  const hunting = p.act?.t === "h";
  const z = findZone(p.act);
  let t = z ? dt : 0;
  let rest = dt;
  if (z && hunting) {
    const rk = riskOf(p, z, offline);
    const dr = (z.dg ?? 0) * s.vr * rk / 100;
    t = dr > 0 ? Math.min(dt, p.hp / dr) : dt;
    p.hp -= dr * t;
    rest = dt - t;
    if (p.hp <= 0.01) {
      died = true;
      applyDeath(p, events, "Vida esgotada na caçada.", now);
    } else if (rk > 0) {
      const r = rk / 100;
      if (Math.random() < 1 - (1 - r) ** (t / 60)) {
        t *= Math.random();
        died = true;
        applyDeath(p, events, `Derrotado por ${z.n}.`, now);
      }
    }
  }
  if (z) {
    gain(p, z.xp * s.xm * t, offline, events);
    if (z.g) p.gold += z.g * s.gm * t;
    for (const [id, chance] of z.l ?? []) {
      const q = Math.floor(chance * s.gm * t + Math.random());
      if (q > 0) p.inv[id] = (p.inv[id] || 0) + q;
    }
    if (hunting && t > 0) {
      const h = hunt(p, z, s, t, offline, events);
      kills += h.kills;
      rare.push(...h.rare);
      if (h.modal) modal = h.modal;
    }
  }
  p.hp = Math.min(s.max, p.hp + s.max * 0.01 * (1 + (s.mods.regen || 0)) * rest);
  p.cp = stats(p, false).cp;
  return {
    player: p,
    events,
    kills,
    died,
    modal,
    awayMs,
    goldDelta: p.gold - gold0,
    levelDelta: p.level - level0,
    rare,
  };
}

function applyDeath(p: Player, events: LogEvent[], why: string, now: number) {
  const lost = Math.floor(p.xp * 0.3);
  p.xp -= lost;
  p.hp = 0;
  p.act = null;
  p.cd = now + 45000;
  p.dd = (p.dd || 0) + 1;
  events.push({ kind: "death", text: `Você morreu. ${why} Perdeu ${lost} de XP.` });
}

function gain(p: Player, x: number, offline: boolean, events: LogEvent[]) {
  p.xp += x;
  while (p.xp >= need(p.level)) {
    p.xp -= need(p.level);
    p.level += 1;
    p.pts += 3;
    p.hp = stats(p, offline).max;
    events.push({ kind: "level", text: `Nível ${p.level}. Você ganhou 3 pontos de atributo.` });
  }
}

function hunt(p: Player, z: Zone, s: Stats, t: number, offline: boolean, events: LogEvent[]) {
  const on = t <= 3;
  const ex = passive(p, "ex");
  let kills = 0;
  let modal: string | null = null;
  const rare: { id: string; rarity: number }[] = [];
  const nKills = Math.floor(0.3 * t + Math.random());
  for (let i = nKills; i > 0; i--) {
    if (on) kills += 1;
    const crit = Math.random() * 100 < s.crit;
    const exec = Math.random() < ex;
    if (exec) gain(p, z.xp * 8 * s.xm, offline, events);
    if (on && exec) events.push({ kind: "exec", text: `Execução. ${z.n} caiu sem reagir.` });
    else if (on && crit) events.push({ kind: "crit", text: `Crítico. ${z.n} sofreu ${s.dmg * 2} de dano.` });
  }
  const nDrops = Math.floor((z.dr ?? 0) * (1 + skillVal(p, "dr", offline)) * t + Math.random());
  for (let i = nDrops; i > 0; i--) {
    const id = roll((z.lk || 0) + s.attrs.sor * 0.01);
    const it = ITEMS[id];
    if (!it) continue;
    const r = it.r || 0;
    p.mr = Math.max(p.mr || 0, r);
    p.inv[id] = (p.inv[id] || 0) + 1;
    if (r >= 3 || (on && r >= 1)) events.push({ kind: "drop", text: `${it.n}`, rarity: r });
    if (r >= 3) rare.push({ id, rarity: r });
    if (r >= 5 && (!modal || r >= (ITEMS[modal].r || 0))) modal = id;
  }
  return { kills, modal, rare };
}

export function createHero(name: string, cls: ClassId): Player {
  const c = CLASSES[cls];
const p: Player = {
    name,
    cls,
    level: 1,
    xp: 0,
    gold: 50,
    pts: 0,
    at: { ...c.a },
    inv: { couro: 1, anel: 1 },
    eq: { arma: c.w, peitoral: null, elmo: null, bota: null, calca: null, luva: null, colar: null, anel: null, anel1: null, anel2: null, aura: null },
    act: null,
    hp: 1,
    last: Date.now(),
  };
  p.hp = stats(p, false).max;
  p.cp = stats(p, false).cp;
  return p;
}

export function createDemo(): Player {
  const p = createHero("Seraphine", "paladino");
  p.level = 12;
  p.xp = 80;
  p.gold = 860;
  p.pts = 6;
  p.at = { for: 12, agi: 6, int: 8, sor: 5, vit: 19 };
  p.inv = { pele: 8, gosma: 3, ferro: 6, gema: 1, arma1: 1, couro: 1 };
  p.eq = { arma: "martelo", peitoral: "peitoral1", elmo: "elmo1", bota: null, calca: null, luva: null, colar: null, anel: null, anel1: "anel", anel2: null, aura: null };
  p.act = { t: "h", id: "h1" };
  p.fg = 2;
  p.dd = 1;
  const s = stats(p, false);
  p.hp = Math.round(s.max * 0.72);
  p.cp = s.cp;
  p.last = Date.now();
  return p;
}

export function normalize(raw: unknown): Player | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Partial<Player> & { eq?: Record<string, string | null | undefined> };
  if (typeof src.cls !== "string" || !(src.cls in CLASSES)) return null;
  const cls = src.cls as ClassId;
  const eqIn = (src.eq ?? {}) as Record<string, string | null | undefined>;
  const at = { ...CLASSES[cls].a };
  if (src.at && typeof src.at === "object") {
    for (const k of ATTR_KEYS) {
      const v = src.at[k];
      if (typeof v === "number" && Number.isFinite(v)) at[k] = v;
    }
  }
  const inv: Record<string, number> = {};
  if (src.inv && typeof src.inv === "object") {
    for (const [k, v] of Object.entries(src.inv)) {
      if (typeof v === "number" && Number.isFinite(v)) inv[k] = v;
    }
  }
  let act: Player["act"] = null;
  if (src.act && (src.act.t === "h" || src.act.t === "t") && typeof src.act.id === "string") {
    act = { t: src.act.t, id: src.act.id };
  }
  const p: Player = {
    name: typeof src.name === "string" && src.name.trim() ? src.name : "Herói",
    cls,
    level: Number(src.level) || 1,
    xp: Number(src.xp) || 0,
    gold: Number(src.gold) || 0,
    pts: Number(src.pts) || 0,
    at,
    inv,
eq: {
      arma: eqIn.arma ?? null,
      peitoral: eqIn.peitoral ?? eqIn.armadura ?? null,
      elmo: eqIn.elmo ?? null,
      bota: eqIn.bota ?? null,
      calca: eqIn.calca ?? null,
      luva: eqIn.luva ?? null,
      colar: eqIn.colar ?? eqIn.acessorio ?? null,
      anel: null, // Deixa o fantasma sempre nulo
      anel1: eqIn.anel1 ?? eqIn.anel ?? null, // Migra o anel antigo pra cá
      anel2: eqIn.anel2 ?? null,
      aura: eqIn.aura ?? null,
    },
    act,
    hp: Number(src.hp) || 0,
    last: Number(src.last) || Date.now(),
    cd: Number(src.cd) || 0,
    sk: src.sk,
    dd: Number(src.dd) || 0,
    fg: Number(src.fg) || 0,
    mr: Number(src.mr) || 0,
    cp: Number(src.cp) || 0,
  };
  if (!p.hp) p.hp = stats(p, false).max;
  return p;
}

export function emptySlots(): Record<SlotKey, string | null> {
  return { arma: null, peitoral: null, elmo: null, bota: null, calca: null, luva: null, colar: null, anel: null, anel1: null, anel2: null, aura: null };
}