import type { AttrKey, ClassId, ClassMods, Item, Player, Skill, SlotKey, Zone } from "./types";

export const VERSION = "1.4.0";
export const SRV = "https://rpg-1-vizh.onrender.com";

export const ATTRS: { k: AttrKey; n: string; d: string }[] = [
  { k: "for", n: "Força", d: "Dano físico" },
  { k: "agi", n: "Agilidade", d: "Dano e chance crítica" },
  { k: "int", n: "Inteligência", d: "Dano arcano e +1% de XP por ponto" },
  { k: "sor", n: "Sorte", d: "+1% de ouro e drops por ponto, crítico" },
  { k: "vit", n: "Vitalidade", d: "Vida máxima e resistência na caça" },
];

export const ATTR_NAME: Record<AttrKey, string> = {
  for: "Força",
  agi: "Agilidade",
  int: "Inteligência",
  sor: "Sorte",
  vit: "Vitalidade",
};

type ClassDef = {
  n: string;
  t: string;
  a: Record<AttrKey, number>;
  p: string;
  d: string;
  m: ClassMods;
  w: string;
};

export const CLASSES: Record<ClassId, ClassDef> = {
  guerreiro: {
    n: "Guerreiro",
    t: "Atacante",
    a: { for: 8, agi: 4, int: 1, sor: 3, vit: 7 },
    p: "Fúria de batalha",
    d: "+15% de dano e +10% de vida máxima",
    m: { dmg: 0.15, hp: 0.1 },
    w: "espada",
  },
  mago: {
    n: "Mago",
    t: "Conjurador",
    a: { for: 1, agi: 5, int: 9, sor: 5, vit: 3 },
    p: "Sabedoria arcana",
    d: "+20% de XP ganho e +10% de dano",
    m: { xp: 0.2, dmg: 0.1 },
    w: "cajado",
  },
  arqueiro: {
    n: "Arqueiro",
    t: "Atirador",
    a: { for: 3, agi: 8, int: 2, sor: 6, vit: 4 },
    p: "Olho de águia",
    d: "+15% de ouro e +8% de chance crítica",
    m: { gold: 0.15, crit: 0.08 },
    w: "arco",
  },
  paladino: {
    n: "Paladino",
    t: "Defensor",
    a: { for: 6, agi: 2, int: 4, sor: 2, vit: 9 },
    p: "Bênção sagrada",
    d: "+20% de vida máxima e regeneração dobrada",
    m: { hp: 0.2, regen: 1 },
    w: "martelo",
  },
  assassino: {
    n: "Assassino",
    t: "Furtivo",
    a: { for: 4, agi: 9, int: 2, sor: 5, vit: 3 },
    p: "Golpe fatal",
    d: "+12% de chance crítica e +10% de dano",
    m: { crit: 0.12, dmg: 0.1 },
    w: "adaga",
  },
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];

export const RARITY = ["Comum", "Raro", "Épico", "Lendário", "Mítico", "Secreto", "Administrador"];
export const RARITY_W = [59.9, 25, 10, 4, 1, 0.09, 0.01];

export const ITEMS: Record<string, Item> = {};
export const POOLS: string[][] = Array.from({ length: 7 }, () => []);

function gear(id: string, item: Item) {
  ITEMS[id] = item;
  if (typeof item.r === "number") POOLS[item.r].push(id);
}

gear("espada", { n: "Espada enferrujada", s: "arma", b: { for: 3 }, v: 8 });
gear("cajado", { n: "Cajado de carvalho", s: "arma", b: { int: 3 }, v: 8 });
gear("arco", { n: "Arco curto", s: "arma", b: { agi: 3 }, v: 8 });
gear("martelo", { n: "Martelo bento", s: "arma", b: { for: 2, vit: 1 }, v: 8 });
gear("adaga", { n: "Adaga sombria", s: "arma", b: { agi: 2, sor: 1 }, v: 8 });
gear("couro", { n: "Gibão de couro", s: "peitoral", b: { vit: 2 }, v: 15 }); // Trocado de armadura para peitoral
gear("anel", { n: "Anel de cobre", s: "anel", b: { sor: 2 }, v: 20 });       // Trocado de acessorio para anel
gear("pele", { n: "Pele de lobo", v: 6 });
gear("gosma", { n: "Gosma pantanosa", v: 12 });
gear("gema", { n: "Gema bruta", v: 40 });
gear("ferro", { n: "Barra de ferro", v: 5 });

const PIECES: { slot: SlotKey; name: string; attr: AttrKey }[] = [
  { slot: "arma", name: "Lâmina", attr: "for" },
  { slot: "peitoral", name: "Peitoral", attr: "vit" },
  { slot: "elmo", name: "Elmo", attr: "agi" },
  { slot: "bota", name: "Botas", attr: "agi" },
  { slot: "calca", name: "Calças", attr: "vit" },
  { slot: "luva", name: "Manoplas", attr: "for" },
  { slot: "colar", name: "Amuleto", attr: "int" },
  { slot: "anel", name: "Anel", attr: "sor" },
];
const TIER_NAMES = ["de ferro", "de prata", "de ametista", "do dragão ancestral", "do cataclismo"];
const TIER_BONUS = [2, 5, 10, 20, 40];
const TIER_VALUE = [5, 15, 40, 120, 400];

for (const piece of PIECES) {
  TIER_NAMES.forEach((tier, r) => {
    gear(`${piece.slot}${r}`, {
      n: `${piece.name} ${tier}`,
      s: piece.slot,
      r,
      b: { [piece.attr]: TIER_BONUS[r] },
      v: TIER_VALUE[r],
    });
  });
}

gear("aura2", { n: "Brasa Rubra", s: "aura", r: 2, au: 1, b: { int: 8 }, v: 60 });
gear("aura3", { n: "Chama Solar", s: "aura", r: 3, au: 2, b: { int: 16, for: 8 }, v: 200 });
gear("aura4", { n: "Vazio Roxo", s: "aura", r: 4, au: 3, b: { int: 30, agi: 15 }, v: 600 });
gear("sec0", { n: "Lâmina do Vazio Ilimitado", s: "arma", r: 5, b: { for: 60, agi: 30 }, ps: { ig: 0.3 }, v: 5000 });
gear("sec1", { n: "Elmo do Horizonte Estelar", s: "elmo", r: 5, b: { vit: 50, int: 40 }, ps: { xp: 0.5 }, v: 5000 });
gear("sec2", { n: "Véu da Singularidade", s: "aura", r: 5, au: 4, b: { agi: 45, sor: 30 }, ps: { ex: 0.05 }, v: 5000 });
gear("adm0", { n: "Cetro do Desenvolvedor Absoluto", s: "arma", r: 6, b: { for: 120, int: 120 }, ps: { xp: 0.8, ex: 0.05 }, v: 50000 });
gear("adm1", { n: "Aura Divina do Administrador", s: "aura", r: 6, au: 5, b: { vit: 100, sor: 80 }, ps: { ig: 0.3, ex: 0.1 }, v: 50000 });

export const TRAINS: Zone[] = [
  { id: "t1", n: "Boneco de palha", kind: "t", req: 1, xp: 1.2, d: "Golpes repetidos no pátio da vila." },
  { id: "t2", n: "Arena dos veteranos", kind: "t", req: 5, xp: 3.5, d: "Duelos de treino contra mercenários." },
  { id: "t3", n: "Torre do mestre", kind: "t", req: 10, xp: 9, d: "Disciplina dura sob o olhar do arquimestre." },
];

export const HUNTS: Zone[] = [
  { id: "h1", n: "Floresta sussurrante", kind: "h", lv: 1, xp: 0.8, g: 0.6, dg: 0.5, l: [["pele", 0.02]], d: "Lobos e javalis rondam as clareiras.", pw: 150, dr: 0.02, lk: 0 },
  { id: "h2", n: "Pântano maldito", kind: "h", lv: 5, xp: 2.4, g: 1.8, dg: 1.6, l: [["gosma", 0.02], ["pele", 0.02], ["ferro", 0.02]], d: "Criaturas viscosas escondem tesouros na lama.", pw: 450, dr: 0.025, lk: 0.3 },
  { id: "h3", n: "Cavernas de cristal", kind: "h", lv: 10, xp: 6, g: 5, dg: 4, l: [["gema", 0.015], ["gosma", 0.02], ["ferro", 0.03]], d: "Golens de cristal guardam gemas brutas.", pw: 1200, dr: 0.03, lk: 0.8 },
  { id: "h4", n: "Covil do dragão jovem", kind: "h", lv: 25, xp: 16, g: 12, dg: 7, l: [["gema", 0.03]], d: "Um dragão jovem guarda um tesouro colossal.", pw: 4200, dr: 0.035, lk: 1.5 },
];

export function findZone(act: Player["act"]): Zone | undefined {
  if (!act) return;
  return (act.t === "h" ? HUNTS : TRAINS).find((z) => z.id === act.id);
}

export const SHOP = ["ferro", "arma0", "peitoral0", "elmo0", "elmo1", "colar0", "anel1"];

export const RECIPES: { id: string; mats: Record<string, number>; gold: number }[] = [
  { id: "arma1", mats: { ferro: 4, pele: 5 }, gold: 80 },
  { id: "arma2", mats: { ferro: 10, gosma: 6 }, gold: 300 },
  { id: "arma3", mats: { ferro: 20, gema: 4 }, gold: 1200 },
  { id: "armadura1", mats: { ferro: 4, pele: 8 }, gold: 80 },
  { id: "armadura2", mats: { ferro: 10, gosma: 9 }, gold: 300 },
  { id: "armadura3", mats: { ferro: 20, gema: 7 }, gold: 1200 },
];

export const SKILLS: Record<ClassId, Skill[]> = {
  guerreiro: [
    { name: "Grito de guerra", desc: "+40% de CP por 30 s", level: 5, dur: 30, cd: 90, fx: { cp: 0.4 } },
    { name: "Fúria imparável", desc: "+80% de CP e +30% de XP por 20 s", level: 10, dur: 20, cd: 180, fx: { cp: 0.8, xp: 0.3 } },
  ],
  mago: [
    { name: "Foco arcano", desc: "+50% de XP por 30 s", level: 5, dur: 30, cd: 90, fx: { xp: 0.5 } },
    { name: "Tempestade arcana", desc: "+100% de XP e +30% de drops por 20 s", level: 10, dur: 20, cd: 180, fx: { xp: 1, dr: 0.3 } },
  ],
  arqueiro: [
    { name: "Mira perfeita", desc: "+50% de ouro por 30 s", level: 5, dur: 30, cd: 90, fx: { gd: 0.5 } },
    { name: "Chuva de flechas", desc: "+100% de ouro e +30% de drops por 20 s", level: 10, dur: 20, cd: 180, fx: { gd: 1, dr: 0.3 } },
  ],
  paladino: [
    { name: "Luz curativa", desc: "Cura 50% da vida e reduz o risco de morte pela metade por 20 s", level: 5, dur: 20, cd: 90, fx: { heal: 0.5, safe: 0.5 } },
    { name: "Escudo divino", desc: "Zera o risco de morte por 15 s", level: 10, dur: 15, cd: 180, fx: { safe: 1 } },
  ],
  assassino: [
    { name: "Passo sombrio", desc: "−50% de risco de morte e +20% de drops por 30 s", level: 5, dur: 30, cd: 90, fx: { safe: 0.5, dr: 0.2 } },
    { name: "Golpe fatal", desc: "+60% de CP e +100% de ouro por 20 s", level: 10, dur: 20, cd: 180, fx: { cp: 0.6, gd: 1 } },
  ],
};

export const SLOTS: { k: SlotKey; n: string; area: string }[] = [
  { k: "elmo", n: "Elmo", area: "slot-helm" },
  { k: "colar", n: "Colar", area: "slot-trinket" },
  { k: "peitoral", n: "Peitoral", area: "slot-chest" },
  { k: "arma", n: "Arma", area: "slot-weapon" },
  { k: "luva", n: "Luvas", area: "slot-gloves" },
  { k: "calca", n: "Calça", area: "slot-legs" },
  { k: "bota", n: "Botas", area: "slot-boots" },
  { k: "anel1", n: "Anel Esq.", area: "slot-ring1" },
  { k: "anel2", n: "Anel Dir.", area: "slot-ring2" },
  { k: "aura", n: "Aura", area: "slot-aura" },
];

export const POWER = ["Nenhuma", "Faísca", "Incandescência", "Tempestade"];

export const SKINS: Record<string, string> = {
  armadura3: "Cavaleiro-dragão",
  armadura4: "Senhor do Cataclismo",
  sec0: "Sombra do Vazio",
  sec1: "Viajante estelar",
  sec2: "Singularidade",
  adm0: "Desenvolvedor absoluto",
  adm1: "Divindade",
};

export const LEGENDS: { n: string; cls: ClassId; l: number; cp: number }[] = [
  { n: "Sir Aldric", cls: "guerreiro", l: 12, cp: 900 },
  { n: "Lyra Sombralua", cls: "assassino", l: 18, cp: 2600 },
  { n: "Mestre Orvyn", cls: "mago", l: 25, cp: 5200 },
  { n: "Thalia Ventoforte", cls: "arqueiro", l: 31, cp: 8800 },
  { n: "Dama Seraphine", cls: "paladino", l: 38, cp: 14000 },
  { n: "Kael, o Devorador", cls: "assassino", l: 46, cp: 23000 },
  { n: "Archimago Vael", cls: "mago", l: 55, cp: 37000 },
  { n: "Rei Eldoran", cls: "guerreiro", l: 70, cp: 60000 },
];

export const NEWS: { version: string; date: string; items: string[] }[] = [
  {
    version: "1.4.0",
    date: "11/11/2026",
    items: [
      "A caça e o treino agora têm uma cena, não uma linha de planilha",
      "Quatro destinos: Jornada, Herói, Vila e Salão",
      "Equipamento em boneco, com a diferença de CP antes de equipar",
      "Ao voltar, um resumo do tempo longe da tela",
      "Lendas do reino separadas dos aventureiros de verdade",
    ],
  },
  {
    version: "1.3.0",
    date: "11/11/2026",
    items: [
      "Contas banidas somem do ranking e não conseguem entrar",
      "O administrador pode devolver itens e ouro a quem perdeu progresso",
    ],
  },
  {
    version: "1.2.0",
    date: "11/11/2026",
    items: [
      "A senha fica no servidor: dá para entrar de qualquer aparelho",
      "Contas antigas: a primeira senha digitada passa a valer",
      "Abrir a conta em outro lugar encerra a sessão anterior",
    ],
  },
  {
    version: "1.1.0",
    date: "11/11/2026",
    items: [
      "O progresso não volta mais ao sair do jogo",
      "O save mais novo sempre vence",
      "Painel de novidades e status do servidor",
    ],
  },
];

export function potPrice(level: number) {
  return 20 + 8 * level;
}

export function need(level: number) {
  return Math.floor(100 * 1.35 ** (level - 1));
}

export function powerTier(cp: number) {
  return cp >= 7000 ? 3 : cp >= 2500 ? 2 : cp >= 800 ? 1 : 0;
}

export function skinName(p: Player) {
  const id = (Object.values(p.eq).filter((i) => i && SKINS[i]) as string[]).sort(
    (a, b) => (ITEMS[b]?.r || 0) - (ITEMS[a]?.r || 0),
  )[0];
  return id ? SKINS[id] : null;
}

export function itemLines(it: Item) {
  const lines: string[] = [];
  for (const k of ["for", "agi", "int", "sor", "vit"] as AttrKey[]) {
    if (it.b?.[k]) lines.push(`+${it.b[k]} ${ATTR_NAME[k]}`);
  }
  if (it.ps?.xp) lines.push(`+${Math.round(it.ps.xp * 100)}% de ganho de XP`);
  if (it.ps?.ig) lines.push(`ignora ${Math.round(it.ps.ig * 100)}% da defesa`);
  if (it.ps?.ex) lines.push(`${Math.round(it.ps.ex * 100)}% de chance de executar`);
  return lines;
}

export function achievements(p: Player) {
  const best = Math.max(
    p.mr || 0,
    ...Object.keys(p.inv).filter((k) => p.inv[k] > 0).map((k) => ITEMS[k]?.r || 0),
    ...Object.values(p.eq).map((k) => (k && ITEMS[k] ? ITEMS[k].r || 0 : 0)),
  );
  return [
    ["Aprendiz", "Chegue ao nível 5", p.level >= 5],
    ["Veterano", "Chegue ao nível 20", p.level >= 20],
    ["Lenda viva", "Chegue ao nível 50", p.level >= 50],
    ["Bolso cheio", "Tenha 10.000 de ouro", p.gold >= 1e4],
    ["Mão de ferro", "Forje 5 equipamentos", (p.fg || 0) >= 5],
    ["Escola da morte", "Morra 3 vezes", (p.dd || 0) >= 3],
    ["Brilho lendário", "Encontre um item Lendário", best >= 3],
    ["Sangue mítico", "Encontre um item Mítico", best >= 4],
    ["Segredo do vazio", "Encontre um item Secreto", best >= 5],
    ["Palavra do criador", "Encontre um item Administrador", best >= 6],
  ] as [string, string, boolean][];
}
