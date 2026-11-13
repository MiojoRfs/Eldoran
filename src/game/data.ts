import type { AttrKey, ClassId, ClassMods, Item, Player, RealmId, Skill, SlotKey, Zone } from "./types";

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

gear("espada", { n: "Espada enferrujada", s: "arma", cls: ["guerreiro"], b: { for: 3 }, v: 8 });
gear("cajado", { n: "Cajado de carvalho", s: "arma", cls: ["mago"], b: { int: 3 }, v: 8 });
gear("arco", { n: "Arco curto", s: "arma", cls: ["arqueiro"], b: { agi: 3 }, v: 8 });
gear("martelo", { n: "Martelo bento", s: "arma", cls: ["paladino"], b: { for: 2, vit: 1 }, v: 8 });
gear("adaga", { n: "Adaga sombria", s: "arma", cls: ["assassino"], b: { agi: 2, sor: 1 }, v: 8 });
gear("couro", { n: "Gibão de couro", s: "peitoral", b: { vit: 2 }, v: 15 });
gear("anel", { n: "Anel de cobre", s: "anel", b: { sor: 2 }, v: 20 });
gear("pele", { n: "Pele de lobo", v: 6 });
gear("gosma", { n: "Gosma pantanosa", v: 12 });
gear("gema", { n: "Gema bruta", v: 40 });
gear("ferro", { n: "Barra de ferro", v: 5 });

const PIECES: { slot: SlotKey; name: string; attr: AttrKey }[] = [
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

// Compatibilidade com armas de saves antigos (não entra nas POOLS de drop)
TIER_NAMES.forEach((tier, r) => {
  ITEMS[`arma${r}`] = {
    n: `Espada ${tier}`,
    s: "arma",
    r,
    b: { for: TIER_BONUS[r] },
    v: TIER_VALUE[r],
  };
});

// ================= AURAS, SECRETOS & ADMINISTRADOR =================
gear("aura2", { n: "Brasa Rubra", s: "aura", r: 2, au: 1, b: { int: 8 }, v: 60 });
gear("aura3", { n: "Aura Esmeralda", s: "aura", r: 3, au: 2, b: { int: 16, for: 8 }, v: 200 });
gear("aura4", { n: "Vazio Roxo", s: "aura", r: 4, au: 3, b: { int: 30, agi: 15 }, v: 600 });
gear("sec0", { n: "Lâmina do Vazio Ilimitado", s: "arma", r: 5, b: { for: 60, agi: 30 }, ps: { ig: 0.3 }, v: 5000 });
gear("sec1", { n: "Elmo do Horizonte Estelar", s: "elmo", r: 5, b: { vit: 50, int: 40 }, ps: { xp: 0.5 }, v: 5000 });
gear("sec2", { n: "Véu da Singularidade", s: "aura", r: 5, au: 4, b: { agi: 45, sor: 30 }, ps: { ex: 0.05 }, v: 5000 });
gear("adm0", { n: "Cetro do Desenvolvedor Absoluto", s: "arma", r: 6, b: { for: 120, int: 120 }, ps: { xp: 0.8, ex: 0.05 }, v: 50000 });
gear("adm1", { n: "Aura Divina do Administrador", s: "aura", r: 6, au: 5, b: { vit: 100, sor: 80 }, ps: { ig: 0.3, ex: 0.1 }, v: 50000 });

// ================= MASCOTES (PETS) =================
// ================= CONJUNTOS DE ARMADURA TEMÁTICOS =================
// Conjunto do Caçador (Tier 1 - Agilidade / Sorte / Crítico)
gear("elmo_cac1", { n: "Capuz do Caçador", s: "elmo", r: 1, b: { agi: 6, sor: 3 }, ps: { crit: 0.03 }, v: 40 });
gear("peitoral_cac1", { n: "Gibão do Caçador", s: "peitoral", r: 1, b: { agi: 7, vit: 4 }, ps: { gd: 0.1 }, v: 50 });
gear("calca_cac1", { n: "Calças do Caçador", s: "calca", r: 1, b: { agi: 6, vit: 3 }, ps: { crit: 0.03 }, v: 40 });
gear("bota_cac1", { n: "Botas do Caçador", s: "bota", r: 1, b: { agi: 7, sor: 2 }, ps: { gd: 0.08 }, v: 40 });

// Conjunto Arcano (Tier 2 - Inteligência / XP / Dano)
gear("elmo_mag2", { n: "Capuz Arcano", s: "elmo", r: 2, b: { int: 14, sor: 4 }, ps: { xp: 0.12 }, v: 110 });
gear("peitoral_mag2", { n: "Manto Arcano", s: "peitoral", r: 2, b: { int: 18, vit: 6 }, ps: { dmg: 0.14, xp: 0.1 }, v: 150 });
gear("calca_mag2", { n: "Calças Arcanas", s: "calca", r: 2, b: { int: 13, agi: 5 }, ps: { xp: 0.1 }, v: 110 });
gear("bota_mag2", { n: "Botas Arcanas", s: "bota", r: 2, b: { int: 12, agi: 6 }, ps: { dmg: 0.08 }, v: 110 });

// Conjunto Sombrio (Tier 3 - Agilidade / Crítico / Execução)
gear("elmo_drk3", { n: "Máscara Sombria", s: "elmo", r: 3, b: { agi: 24, sor: 10 }, ps: { crit: 0.08 }, v: 320 });
gear("peitoral_drk3", { n: "Couraça Sombria", s: "peitoral", r: 3, b: { agi: 28, vit: 12 }, ps: { dmg: 0.18, ex: 0.02 }, v: 420 });
gear("calca_drk3", { n: "Calças Sombrias", s: "calca", r: 3, b: { agi: 22, sor: 10 }, ps: { crit: 0.07 }, v: 320 });
gear("bota_drk3", { n: "Botas Sombrias", s: "bota", r: 3, b: { agi: 24, sor: 8 }, ps: { ig: 0.1 }, v: 320 });

// Conjunto do Shogun (Tier 4 - Força / Agilidade / Penetração)
gear("elmo_sam4", { n: "Kabuto do Shogun", s: "elmo", r: 4, b: { for: 38, agi: 22 }, ps: { crit: 0.1 }, v: 850 });
gear("peitoral_sam4", { n: "Armadura do Shogun", s: "peitoral", r: 4, b: { for: 48, vit: 28 }, ps: { dmg: 0.28, hp: 0.15 }, v: 1100 });
gear("calca_sam4", { n: "Hakama de Guerra", s: "calca", r: 4, b: { for: 36, agi: 24 }, ps: { ig: 0.15 }, v: 850 });
gear("bota_sam4", { n: "Grevas do Shogun", s: "bota", r: 4, b: { agi: 40, for: 20 }, ps: { crit: 0.09 }, v: 850 });

ITEMS["pet_dragao"] = {
  n: "Bebê Dragão",
  s: "pet",
  r: 4,
  b: { for: 15, int: 15, sor: 10 },
  ps: { dmg: 0.15, gd: 0.1, xp: 0.1 },
  v: 2500,
};

gear("pet_adm", {
  n: "Bebê Dragão do Administrador",
  s: "pet",
  r: 6,
  b: { for: 90, agi: 90, int: 90, sor: 90, vit: 90 },
  ps: { dmg: 0.5, xp: 0.5, gd: 0.5, crit: 0.15, ex: 0.05 },
  v: 50000,
});

// ================= ARMAS DE MAGO (CAJADOS & CETROS) =================
gear("cajado_fogo1", { n: "Cajado de Brasa", s: "arma", r: 1, cls: ["mago"], b: { int: 6 }, ps: { dmg: 0.12 }, v: 30 });
gear("cajado_fogo2", { n: "Cajado Piromante", s: "arma", r: 2, cls: ["mago"], b: { int: 14 }, ps: { dmg: 0.22 }, v: 90 });
gear("cajado_fogo3", { n: "Cajado do Sol Negro", s: "arma", r: 3, cls: ["mago"], b: { int: 28, for: 10 }, ps: { dmg: 0.35 }, v: 300 });
gear("cajado_fogo4", { n: "Cajado do Cataclismo Ígneo", s: "arma", r: 4, cls: ["mago"], b: { int: 55, for: 20 }, ps: { dmg: 0.55 }, v: 900 });

gear("cajado_nat1", { n: "Cajado da Clareira", s: "arma", r: 1, cls: ["mago"], b: { int: 5, vit: 3 }, ps: { xp: 0.15 }, v: 30 });
gear("cajado_nat2", { n: "Cajado Ancestral", s: "arma", r: 2, cls: ["mago"], b: { int: 12, vit: 8 }, ps: { xp: 0.28, hp: 0.1 }, v: 90 });
gear("cajado_nat3", { n: "Cajado de Yggdrasil", s: "arma", r: 3, cls: ["mago"], b: { int: 24, vit: 18 }, ps: { xp: 0.45, hp: 0.2 }, v: 300 });

gear("cajado_cos2", { n: "Cajado Astral", s: "arma", r: 2, cls: ["mago"], b: { int: 12, agi: 6 }, ps: { ig: 0.15, crit: 0.05 }, v: 95 });
gear("cajado_cos4", { n: "Cetro da Singularidade", s: "arma", r: 4, cls: ["mago"], b: { int: 48, agi: 25 }, ps: { ig: 0.28, crit: 0.12 }, v: 950 });

// ================= ARMAS DE GUERREIRO (ESPADAS & MACHADOS) =================
gear("espada_ber1", { n: "Machado de Batalha", s: "arma", r: 1, cls: ["guerreiro"], b: { for: 7 }, ps: { dmg: 0.1 }, v: 30 });
gear("espada_ber2", { n: "Montante de Aço Negro", s: "arma", r: 2, cls: ["guerreiro"], b: { for: 16 }, ps: { dmg: 0.2 }, v: 90 });
gear("espada_ber3", { n: "Machado do Colosso", s: "arma", r: 3, cls: ["guerreiro"], b: { for: 32, vit: 10 }, ps: { dmg: 0.32 }, v: 300 });
gear("espada_ber4", { n: "Espada do Apocalipse", s: "arma", r: 4, cls: ["guerreiro"], b: { for: 65, vit: 20 }, ps: { dmg: 0.5 }, v: 900 });

gear("espada_due1", { n: "Sabre de Prata", s: "arma", r: 1, cls: ["guerreiro"], b: { for: 4, agi: 4 }, ps: { crit: 0.06 }, v: 30 });
gear("espada_due2", { n: "Katana do Vento", s: "arma", r: 2, cls: ["guerreiro"], b: { for: 10, agi: 10 }, ps: { crit: 0.12, ig: 0.1 }, v: 90 });
gear("espada_due3", { n: "Lâmina da Tempestade", s: "arma", r: 3, cls: ["guerreiro"], b: { for: 20, agi: 22 }, ps: { crit: 0.18, ig: 0.2 }, v: 300 });

// ================= ARMAS DE ARQUEIRO (ARCOS & BESTAS) =================
gear("arco_snp1", { n: "Arco Longo de Teixo", s: "arma", r: 1, cls: ["arqueiro"], b: { agi: 7 }, ps: { crit: 0.08 }, v: 30 });
gear("arco_snp2", { n: "Arco de Mithril", s: "arma", r: 2, cls: ["arqueiro"], b: { agi: 15 }, ps: { crit: 0.14, ig: 0.12 }, v: 90 });
gear("arco_snp3", { n: "Arco Caçador de Dragões", s: "arma", r: 3, cls: ["arqueiro"], b: { agi: 30, for: 10 }, ps: { crit: 0.2, ig: 0.25 }, v: 300 });
gear("arco_snp4", { n: "Arco Estelar", s: "arma", r: 4, cls: ["arqueiro"], b: { agi: 60, for: 20 }, ps: { crit: 0.25, dmg: 0.35 }, v: 900 });

gear("arco_oro1", { n: "Besta de Caça", s: "arma", r: 1, cls: ["arqueiro"], b: { agi: 4, sor: 4 }, ps: { gd: 0.2 }, v: 30 });
gear("arco_oro2", { n: "Besta Dourada", s: "arma", r: 2, cls: ["arqueiro"], b: { agi: 9, sor: 10 }, ps: { gd: 0.35 }, v: 90 });
gear("arco_oro3", { n: "Arco da Fortuna", s: "arma", r: 3, cls: ["arqueiro"], b: { agi: 18, sor: 22 }, ps: { gd: 0.6, xp: 0.15 }, v: 300 });

// ================= ARMAS DE ASSASSINO (ADAGAS & GARRAS) =================
gear("adaga_cei1", { n: "Adaga Envenenada", s: "arma", r: 1, cls: ["assassino"], b: { agi: 6, sor: 2 }, ps: { ex: 0.015 }, v: 30 });
gear("adaga_cei2", { n: "Lâmina Oculta", s: "arma", r: 2, cls: ["assassino"], b: { agi: 14, sor: 5 }, ps: { ex: 0.03, crit: 0.08 }, v: 90 });
gear("adaga_cei3", { n: "Adaga do Ceifador", s: "arma", r: 3, cls: ["assassino"], b: { agi: 28, sor: 12 }, ps: { ex: 0.05, crit: 0.14 }, v: 300 });
gear("adaga_cei4", { n: "Presa do Abismo", s: "arma", r: 4, cls: ["assassino"], b: { agi: 55, sor: 25 }, ps: { ex: 0.08, dmg: 0.3 }, v: 900 });

gear("adaga_lad1", { n: "Punhal Serrilhado", s: "arma", r: 1, cls: ["assassino"], b: { agi: 4, sor: 5 }, ps: { gd: 0.22 }, v: 30 });
gear("adaga_lad2", { n: "Punhal de Ouro", s: "arma", r: 2, cls: ["assassino"], b: { agi: 8, sor: 12 }, ps: { gd: 0.4, crit: 0.06 }, v: 90 });
gear("adaga_lad3", { n: "Adaga da Ganância", s: "arma", r: 3, cls: ["assassino"], b: { agi: 16, sor: 26 }, ps: { gd: 0.7 }, v: 300 });

// ================= ARMAS DE PALADINO (MARTELOS, MAÇAS & LANÇAS) =================
gear("mart_cru1", { n: "Maça de Guerra", s: "arma", r: 1, cls: ["paladino"], b: { for: 5, vit: 3 }, ps: { dmg: 0.12 }, v: 30 });
gear("mart_cru2", { n: "Martelo do Julgamento", s: "arma", r: 2, cls: ["paladino"], b: { for: 12, vit: 6 }, ps: { dmg: 0.24 }, v: 90 });
gear("mart_cru3", { n: "Martelo da Luz Solar", s: "arma", r: 3, cls: ["paladino"], b: { for: 25, vit: 14 }, ps: { dmg: 0.38 }, v: 300 });
gear("mart_cru4", { n: "Martelo Celestial", s: "arma", r: 4, cls: ["paladino"], b: { for: 50, vit: 30 }, ps: { dmg: 0.52, hp: 0.15 }, v: 900 });

gear("mart_gua1", { n: "Lança Sagrada", s: "arma", r: 1, cls: ["paladino"], b: { vit: 6, int: 2 }, ps: { hp: 0.15, xp: 0.1 }, v: 30 });
gear("mart_gua2", { n: "Maça do Bastião", s: "arma", r: 2, cls: ["paladino"], b: { vit: 15, int: 5 }, ps: { hp: 0.28, xp: 0.2 }, v: 90 });
gear("mart_gua3", { n: "Alabarda do Arcanjo", s: "arma", r: 3, cls: ["paladino"], b: { vit: 32, int: 12 }, ps: { hp: 0.45, xp: 0.35 }, v: 300 });

// ================= ACESSÓRIOS & PEÇAS DE BUILD ESTRATÉGICA =================
// Foco em Farm (XP e Ouro)
gear("anel_xp1", { n: "Anel do Aprendiz", s: "anel", r: 1, b: { int: 3 }, ps: { xp: 0.12 }, v: 35 });
gear("anel_xp2", { n: "Anel do Erudito", s: "anel", r: 2, b: { int: 8 }, ps: { xp: 0.25 }, v: 110 });
gear("anel_ouro1", { n: "Anel da Avareza", s: "anel", r: 1, b: { sor: 4 }, ps: { gd: 0.18 }, v: 35 });
gear("anel_ouro2", { n: "Anel do Magnata", s: "anel", r: 2, b: { sor: 10 }, ps: { gd: 0.35 }, v: 110 });
gear("colar_sabio", { n: "Amuleto da Clarividência", s: "colar", r: 2, b: { int: 10, sor: 6 }, ps: { xp: 0.2, gd: 0.2 }, v: 130 });

// Foco em Dano, Crítico e Agilidade (Glass Cannon)
gear("anel_crit1", { n: "Anel da Precisão", s: "anel", r: 1, b: { agi: 4 }, ps: { crit: 0.05 }, v: 35 });
gear("anel_crit2", { n: "Anel do Carrasco", s: "anel", r: 2, b: { agi: 8, for: 5 }, ps: { crit: 0.09, dmg: 0.1 }, v: 120 });
gear("colar_sangue", { n: "Gargantilha da Fúria", s: "colar", r: 2, b: { for: 10, agi: 8 }, ps: { dmg: 0.18, ig: 0.1 }, v: 140 });
gear("luva_arcana", { n: "Luvas do Tecelão", s: "luva", r: 2, b: { int: 12, agi: 4 }, ps: { dmg: 0.12, crit: 0.05 }, v: 100 });
gear("bota_vento", { n: "Botas do Passo Leve", s: "bota", r: 2, b: { agi: 14, sor: 4 }, ps: { crit: 0.07 }, v: 100 });

// Foco em Sobrevivência (Tanque)
gear("colar_colosso", { n: "Coração de Pedra", s: "colar", r: 2, b: { vit: 16 }, ps: { hp: 0.22 }, v: 130 });
gear("peitoral_guard", { n: "Couraça do Bastião", s: "peitoral", r: 2, b: { vit: 18, for: 6 }, ps: { hp: 0.25 }, v: 150 });
gear("elmo_guard", { n: "Elmo do Baluarte", s: "elmo", r: 2, b: { vit: 14, for: 4 }, ps: { hp: 0.15 }, v: 110 });

// ================= REINOS & ZONAS =================
export const REALMS: { id: RealmId; n: string; sub: string; reqLv: number }[] = [
  {
    id: "valete",
    n: "Reino Valete",
    sub: "Terras iniciais onde novos aventureiros forjam suas primeiras builds.",
    reqLv: 1,
  },
  {
    id: "proximo",
    n: "2º Reino (Em breve)",
    sub: "Terras além do covil do dragão. Novas zonas e materiais em construção.",
    reqLv: 25,
  },
];

export const TRAINS: Zone[] = [
  { id: "t1", realm: "valete", n: "Boneco de palha", kind: "t", req: 1, xp: 1.2, d: "Golpes repetidos no pátio da vila." },
  { id: "t2", realm: "valete", n: "Arena dos veteranos", kind: "t", req: 5, xp: 3.5, d: "Duelos de treino contra mercenários." },
  { id: "t3", realm: "valete", n: "Torre do mestre", kind: "t", req: 10, xp: 9, d: "Disciplina dura sob o olhar do arquimestre." },
];

export const HUNTS: Zone[] = [
  { id: "h1", realm: "valete", n: "Floresta sussurrante", kind: "h", lv: 1, xp: 0.8, g: 0.6, dg: 0.5, l: [["pele", 0.02]], d: "Lobos e javalis rondam as clareiras.", pw: 150, dr: 0.02, lk: 0 },
  { id: "h2", realm: "valete", n: "Pântano maldito", kind: "h", lv: 5, xp: 2.4, g: 1.8, dg: 1.6, l: [["gosma", 0.02], ["pele", 0.02], ["ferro", 0.02]], d: "Criaturas viscosas escondem tesouros na lama.", pw: 450, dr: 0.025, lk: 0.3 },
  { id: "h3", realm: "valete", n: "Cavernas de cristal", kind: "h", lv: 10, xp: 6, g: 5, dg: 4, l: [["gema", 0.015], ["gosma", 0.02], ["ferro", 0.03]], d: "Golens de cristal guardam gemas brutas.", pw: 1200, dr: 0.03, lk: 0.8 },
  { id: "h4", realm: "valete", n: "Covil do dragão jovem", kind: "h", lv: 25, xp: 16, g: 12, dg: 7, l: [["gema", 0.03], ["pet_dragao", 0.008], ["pet_adm", 0.0001]], d: "Um dragão jovem guarda um tesouro colossal.", pw: 4200, dr: 0.035, lk: 1.5 },
];

export function findZone(act: Player["act"]): Zone | undefined {
  if (!act) return;
  return (act.t === "h" ? HUNTS : TRAINS).find((z) => z.id === act.id);
}

// ================= LOJA FUNCIONAL (MATERIAIS + SET INICIAL + ARMAS TIER 1) =================
export const SHOP = [
  "ferro",
  "pele",
  "gosma",
  "couro",
  "elmo0",
  "luva0",
  "calca0",
  "bota0",
  "colar0",
  "anel",
  "espada_ber1",
  "cajado_fogo1",
  "arco_snp1",
  "adaga_cei1",
  "mart_cru1",
];

// ================= RECEITAS DO FERREIRO (CALIBRADAS PARA PROGRESSÃO) =================
export const RECIPES: { id: string; mats: Record<string, number>; gold: number }[] = [
  // --- Acessórios Estratégicos (Definem a build cedo) ---
  { id: "anel_xp1", mats: { ferro: 8, gosma: 4 }, gold: 240 },
  { id: "anel_ouro1", mats: { ferro: 8, pele: 6 }, gold: 240 },
  { id: "anel_crit1", mats: { ferro: 8, pele: 5, gosma: 3 }, gold: 260 },
  { id: "anel_xp2", mats: { ferro: 22, gosma: 12, gema: 2 }, gold: 900 },
  { id: "anel_ouro2", mats: { ferro: 22, pele: 16, gema: 2 }, gold: 900 },
  { id: "anel_crit2", mats: { ferro: 24, pele: 14, gema: 3 }, gold: 1000 },
  { id: "colar_sabio", mats: { ferro: 26, gosma: 16, gema: 3 }, gold: 1150 },
  { id: "colar_sangue", mats: { ferro: 28, pele: 20, gema: 3 }, gold: 1250 },
  { id: "colar_colosso", mats: { ferro: 28, gosma: 18, gema: 3 }, gold: 1250 },

  // --- Armaduras & Peças Principais ---
  { id: "peitoral1", mats: { ferro: 12, pele: 10 }, gold: 320 },
  { id: "elmo1", mats: { ferro: 10, pele: 6 }, gold: 260 },
  { id: "calca1", mats: { ferro: 10, pele: 8 }, gold: 280 },
  { id: "luva1", mats: { ferro: 9, pele: 6 }, gold: 250 },
  { id: "bota1", mats: { ferro: 9, pele: 7 }, gold: 250 },
  { id: "peitoral2", mats: { ferro: 28, pele: 18, gema: 2 }, gold: 1050 },
  { id: "peitoral_guard", mats: { ferro: 34, gosma: 20, gema: 3 }, gold: 1400 },
  { id: "elmo_guard", mats: { ferro: 24, gosma: 15, gema: 2 }, gold: 980 },
  { id: "luva_arcana", mats: { ferro: 22, gosma: 14, gema: 2 }, gold: 920 },
  { id: "bota_vento", mats: { ferro: 22, pele: 16, gema: 2 }, gold: 920 },
  { id: "peitoral3", mats: { ferro: 65, pele: 40, gosma: 30, gema: 8 }, gold: 3800 },

  // --- Armas de Mago ---
  { id: "cajado_nat1", mats: { ferro: 10, gosma: 6 }, gold: 290 },
  { id: "cajado_fogo2", mats: { ferro: 26, gosma: 14, gema: 2 }, gold: 980 },
  { id: "cajado_nat2", mats: { ferro: 26, gosma: 16, gema: 2 }, gold: 980 },
  { id: "cajado_cos2", mats: { ferro: 28, pele: 12, gema: 3 }, gold: 1100 },
  { id: "cajado_fogo3", mats: { ferro: 58, gosma: 35, gema: 7 }, gold: 3500 },
  { id: "cajado_nat3", mats: { ferro: 58, gosma: 40, gema: 7 }, gold: 3500 },

  // --- Armas de Guerreiro ---
  { id: "espada_due1", mats: { ferro: 11, pele: 5 }, gold: 290 },
  { id: "espada_ber2", mats: { ferro: 28, pele: 14, gema: 2 }, gold: 1000 },
  { id: "espada_due2", mats: { ferro: 26, pele: 16, gema: 2 }, gold: 1000 },
  { id: "espada_ber3", mats: { ferro: 62, pele: 32, gema: 7 }, gold: 3550 },
  { id: "espada_due3", mats: { ferro: 60, pele: 36, gema: 7 }, gold: 3550 },

  // --- Armas de Arqueiro ---
  { id: "arco_oro1", mats: { ferro: 10, pele: 7 }, gold: 290 },
  { id: "arco_snp2", mats: { ferro: 26, pele: 16, gema: 2 }, gold: 990 },
  { id: "arco_oro2", mats: { ferro: 24, pele: 18, gema: 2 }, gold: 990 },
  { id: "arco_snp3", mats: { ferro: 60, pele: 38, gema: 7 }, gold: 3500 },
  { id: "arco_oro3", mats: { ferro: 58, pele: 40, gema: 7 }, gold: 3500 },

  // --- Armas de Assassino ---
  { id: "adaga_lad1", mats: { ferro: 10, gosma: 5, pele: 4 }, gold: 290 },
  { id: "adaga_cei2", mats: { ferro: 26, gosma: 16, gema: 2 }, gold: 1000 },
  { id: "adaga_lad2", mats: { ferro: 24, pele: 18, gema: 2 }, gold: 1000 },
  { id: "adaga_cei3", mats: { ferro: 60, gosma: 36, gema: 7 }, gold: 3550 },
  { id: "adaga_lad3", mats: { ferro: 58, pele: 40, gema: 7 }, gold: 3550 },

  // --- Armas de Paladino ---
  { id: "mart_gua1", mats: { ferro: 11, gosma: 5 }, gold: 290 },
  { id: "mart_cru2", mats: { ferro: 28, pele: 14, gema: 2 }, gold: 1000 },
  { id: "mart_gua2", mats: { ferro: 28, gosma: 16, gema: 2 }, gold: 1000 },
  { id: "mart_cru3", mats: { ferro: 62, pele: 34, gema: 7 }, gold: 3550 },
  { id: "mart_gua3", mats: { ferro: 62, gosma: 36, gema: 7 }, gold: 3550 },

  // --- Conjuntos Temáticos ---
  { id: "elmo_cac1", mats: { ferro: 8, pele: 8 }, gold: 260 },
  { id: "peitoral_cac1", mats: { ferro: 10, pele: 12 }, gold: 340 },
  { id: "calca_cac1", mats: { ferro: 8, pele: 10 }, gold: 280 },
  { id: "bota_cac1", mats: { ferro: 8, pele: 9 }, gold: 260 },

  { id: "elmo_mag2", mats: { ferro: 20, gosma: 14, gema: 2 }, gold: 950 },
  { id: "peitoral_mag2", mats: { ferro: 26, gosma: 18, gema: 3 }, gold: 1250 },
  { id: "calca_mag2", mats: { ferro: 22, gosma: 14, gema: 2 }, gold: 980 },
  { id: "bota_mag2", mats: { ferro: 20, gosma: 12, gema: 2 }, gold: 920 },

  { id: "elmo_drk3", mats: { ferro: 48, pele: 30, gosma: 20, gema: 6 }, gold: 2900 },
  { id: "peitoral_drk3", mats: { ferro: 60, pele: 38, gosma: 25, gema: 8 }, gold: 3700 },
  { id: "calca_drk3", mats: { ferro: 50, pele: 32, gosma: 20, gema: 6 }, gold: 3000 },
  { id: "bota_drk3", mats: { ferro: 46, pele: 28, gosma: 18, gema: 6 }, gold: 2800 },

  { id: "elmo_sam4", mats: { ferro: 95, pele: 60, gosma: 45, gema: 15 }, gold: 7500 },
  { id: "peitoral_sam4", mats: { ferro: 120, pele: 75, gosma: 55, gema: 20 }, gold: 9800 },
  { id: "calca_sam4", mats: { ferro: 100, pele: 65, gosma: 45, gema: 16 }, gold: 7800 },
  { id: "bota_sam4", mats: { ferro: 90, pele: 55, gosma: 40, gema: 15 }, gold: 7200 },
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
  { k: "pet", n: "Mascote", area: "slot-pet" },
];

export const POWER = ["Nenhuma", "Faísca", "Incandescência", "Tempestade"];

export const SKINS: Record<string, string> = {
  peitoral_cac1: "Rastreador das Clareiras",
  peitoral_mag2: "Arquimago Errante",
  peitoral_drk3: "Lâmina Fantasma",
  peitoral_sam4: "Shogun Carmesim",
  peitoral3: "Cavaleiro-dragão",
  peitoral4: "Senhor do Cataclismo",
  peitoral_guard: "Muralha Viva",
  cajado_fogo4: "Senhor das Cinzas",
  espada_ber4: "Arauto do Apocalipse",
  arco_snp4: "Olho Estelar",
  adaga_cei4: "Sombra do Abismo",
  mart_cru4: "Campeão Celestial",
  sec0: "Sombra do Vazio",
  sec1: "Viajante estelar",
  sec2: "Singularidade",
  adm0: "Desenvolvedor absoluto",
  adm1: "Divindade",
  pet_adm: "Domador Supremo",
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
  if (it.cls && it.cls.length > 0) {
    lines.push(`Classe: ${it.cls.map((c) => CLASSES[c].n).join(", ")}`);
  }
  for (const k of ["for", "agi", "int", "sor", "vit"] as AttrKey[]) {
    if (it.b?.[k]) lines.push(`+${it.b[k]} ${ATTR_NAME[k]}`);
  }
  if (it.ps?.dmg) lines.push(`+${Math.round(it.ps.dmg * 100)}% de dano`);
  if (it.ps?.hp) lines.push(`+${Math.round(it.ps.hp * 100)}% de vida máxima`);
  if (it.ps?.crit) lines.push(`+${Math.round(it.ps.crit * 100)}% de chance crítica`);
  if (it.ps?.xp) lines.push(`+${Math.round(it.ps.xp * 100)}% de ganho de XP`);
  if (it.ps?.gd) lines.push(`+${Math.round(it.ps.gd * 100)}% de ouro`);
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