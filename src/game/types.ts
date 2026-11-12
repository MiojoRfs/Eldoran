export const ATTR_KEYS = ["for", "agi", "int", "sor", "vit"] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type ClassId = "guerreiro" | "mago" | "arqueiro" | "paladino" | "assassino";
export type SlotKey = "arma" | "peitoral" | "elmo" | "bota" | "calca" | "luva" | "colar" | "anel" | "anel1" | "anel2" | "aura";
export type ActKind = "t" | "h";

export type ClassMods = {
  dmg?: number;
  hp?: number;
  xp?: number;
  gold?: number;
  crit?: number;
  regen?: number;
};

export type ItemPassives = {
  xp?: number;   // +% de XP
  gd?: number;   // +% de Ouro
  dmg?: number;  // +% de Dano total
  crit?: number; // +% de Chance Crítica
  hp?: number;   // +% de Vida máxima
  ig?: number;   // Ignora % da defesa inimiga
  ex?: number;   // Chance de execução (hit-kill)
};

export type Item = {
  n: string;
  s?: SlotKey;
  r?: number;
  au?: number;
  cls?: ClassId[]; // Se definido, só essas classes podem equipar
  b?: Partial<Record<AttrKey, number>>;
  ps?: ItemPassives;
  v: number;
};

export type SkillFx = {
  cp?: number;
  xp?: number;
  dr?: number;
  gd?: number;
  heal?: number;
  safe?: number;
};

export type Skill = {
  name: string;
  desc: string;
  level: number;
  dur: number;
  cd: number;
  fx: SkillFx;
};

export type Zone = {
  id: string;
  n: string;
  kind: ActKind;
  xp: number;
  d: string;
  req?: number;
  lv?: number;
  g?: number;
  dg?: number;
  l?: [string, number][];
  pw?: number;
  dr?: number;
  lk?: number;
};

export type Player = {
  name: string;
  cls: ClassId;
  level: number;
  xp: number;
  gold: number;
  pts: number;
  at: Record<AttrKey, number>;
  inv: Record<string, number>;
  eq: Record<SlotKey, string | null>;
  act: { t: ActKind; id: string } | null;
  hp: number;
  last: number;
  cd?: number;
  sk?: Record<number, { u: number; c: number }>;
  dd?: number;
  fg?: number;
  mr?: number;
  cp?: number;
};

export type LogKind = "crit" | "exec" | "drop" | "death" | "revive" | "skill" | "forge" | "level" | "note";

export type LogEvent = {
  kind: LogKind;
  text: string;
  rarity?: number;
};

export type Stats = {
  attrs: Record<AttrKey, number>;
  bonus: Record<AttrKey, number>;
  mods: ClassMods;
  max: number;
  dmg: number;
  crit: number;
  xm: number;
  gm: number;
  vr: number;
  cp: number;
};
