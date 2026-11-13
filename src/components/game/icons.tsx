import { useEffect, useState } from "react";
import babyDragonImg from "@/assets/baby_dragon.png";
import bowImg from "@/assets/Bow.png";
import crossbowImg from "@/assets/crossbow.png";
import smallSwordImg from "@/assets/smallSword.png";
import swordImg from "@/assets/Sword.png";
import warhammerImg from "@/assets/Warhammer.png";
import staffImg from "@/assets/Staff.png";
import daggerImg from "@/assets/dagger.png";
import darckBootsImg from "@/assets/DarckBoots.png";
import darckChestImg from "@/assets/DarckChestplate.png";
import darckHelmetImg from "@/assets/DarckHelmet.png";
import darckLegsImg from "@/assets/DarckLegs.png";
import necklaceReligionImg from "@/assets/NecklaceReligion.png";
import necklaceSkullImg from "@/assets/NecklaceSkull.png";
import necklaceWoodImg from "@/assets/NecklaceWood.png";
import heavyBootsImg from "@/assets/HeavyBoots.png";
import heavyChestImg from "@/assets/HeavyChestplate.png";
import heavyHelmetImg from "@/assets/HeavyHelmet.png";
import heavyLegsImg from "@/assets/HeavyLegs.png";
import hunterBootsImg from "@/assets/HunterBoots.png";
import hunterChestImg from "@/assets/HunterChestplate.png";
import hunterHelmetImg from "@/assets/HunterHelmet.png";
import hunterLegsImg from "@/assets/HunterLegs.png";
import mageBootsImg from "@/assets/MageBoots.png";
import mageChestImg from "@/assets/MageChestplate.png";
import mageHelmetImg from "@/assets/MageHelmet.png";
import mageLegsImg from "@/assets/MageLegs.png";
import samuraiBootsImg from "@/assets/SamuraiBoots.png";
import samuraiChestImg from "@/assets/SamuraiChestplate.png";
import samuraiHelmetImg from "@/assets/SamuraiHelmet.png";
import samuraiLegsImg from "@/assets/SamuraiLegs.png";
import ringImg from "@/assets/Ring.png";
import goldenRingImg from "@/assets/GoldenRing.png";
import gloveImg from "@/assets/Glove.png";
import {
  Anvil,
  Castle,
  Crosshair,
  Crown,
  Droplets,
  Flame,
  FlaskConical,
  Gem,
  Hammer,
  Shield,
  Sword,
  Swords,
  TreePine,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { ITEMS } from "@/game/data";
import type { ClassId, SlotKey } from "@/game/types";

const AURA_GLOB = import.meta.glob<string>("@/assets/Aura*.png", {
  eager: true,
  import: "default",
});

function getAuraFrames(prefix: string): string[] {
  const frames: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const match = Object.entries(AURA_GLOB).find(([path]) =>
      path.endsWith(`/${prefix}${i}.png`),
    );
    if (match) frames.push(match[1]);
  }
  return frames;
}

const AURA_FRAMES: Record<string, string[]> = {
  aura2: getAuraFrames("AuraVermelha"),
  aura3: getAuraFrames("AuraVerde"),
  aura4: getAuraFrames("AuraRoxa"),
  sec2: getAuraFrames("AuraAzul"),
  adm1: getAuraFrames("AuraNegra"),
};

function AnimatedSprite({
  frames,
  alt,
  className,
}: {
  frames: string[];
  alt: string;
  className?: string;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (frames.length <= 1) return;
    const timer = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 110);
    return () => window.clearInterval(timer);
  }, [frames]);

  if (!frames.length) return null;

  return (
    <img
      src={frames[frame] ?? frames[0]}
      alt={alt}
      className={`${className ?? ""} scale-125 object-contain [image-rendering:pixelated]`}
    />
  );
}

const CLASS_ICON: Record<ClassId, LucideIcon> = {
  guerreiro: Swords,
  mago: WandSparkles,
  arqueiro: Crosshair,
  paladino: Shield,
  assassino: Sword,
};

const ZONE_ICON: Record<string, LucideIcon> = {
  t1: Swords,
  t2: Castle,
  t3: Castle,
  h1: TreePine,
  h2: Droplets,
  h3: Gem,
  h4: Flame,
  rest: Castle,
  down: Shield,
};

export function ClassMark({ id, className }: { id: ClassId; className?: string }) {
  const I = CLASS_ICON[id];
  return <I className={className} strokeWidth={1.75} aria-hidden />;
}

export function ZoneMark({ id, className }: { id: string; className?: string }) {
  const I = ZONE_ICON[id] || Castle;
  return <I className={className} strokeWidth={1.5} aria-hidden />;
}

const RARITY_FILTER: Record<number, string> = {
  0: "",
  1: "brightness-110 drop-shadow-[0_0_3px_rgba(56,189,248,0.7)]",
  2: "hue-rotate-[255deg] saturate-150 drop-shadow-[0_0_4px_rgba(192,132,252,0.8)]",
  3: "hue-rotate-[35deg] saturate-150 brightness-110 drop-shadow-[0_0_5px_rgba(250,204,21,0.9)]",
  4: "hue-rotate-[325deg] saturate-200 brightness-110 drop-shadow-[0_0_6px_rgba(248,113,113,0.95)]",
  5: "hue-rotate-[155deg] saturate-200 brightness-125 drop-shadow-[0_0_7px_rgba(34,211,238,0.95)]",
  6: "hue-rotate-[270deg] saturate-200 brightness-125 drop-shadow-[0_0_8px_rgba(253,224,71,1)]",
};
const RARITY_GLOW_ONLY: Record<number, string> = {
  0: "",
  1: "drop-shadow-[0_0_3px_rgba(56,189,248,0.75)]",
  2: "drop-shadow-[0_0_4px_rgba(192,132,252,0.85)]",
  3: "drop-shadow-[0_0_5px_rgba(250,204,21,0.9)]",
  4: "drop-shadow-[0_0_6px_rgba(248,113,113,0.95)]",
  5: "drop-shadow-[0_0_7px_rgba(34,211,238,0.95)]",
  6: "drop-shadow-[0_0_8px_rgba(253,224,71,1)]",
};

function isCustomColored(id: string): boolean {
  return (
    id === "pet_dragao" ||
    id in AURA_FRAMES ||
    id === "anel_ouro1" ||
    id === "anel_ouro2" ||
    id === "colar_sabio" ||
    id === "colar_sangue" ||
    id === "colar_colosso" ||
    id.includes("_cac") ||
    id.includes("_mag") ||
    id.includes("_drk") ||
    id.includes("_sam")
  );
}

function rarityFilter(id: string, rarity: number): string {
  if (isCustomColored(id)) {
    return RARITY_GLOW_ONLY[rarity] ?? "";
  }
  return RARITY_FILTER[rarity] ?? "";
}



function spriteFor(id?: string | null): string | null {
  if (!id) return null;
// Pets
  if (id === "pet_dragao" || id === "pet_adm") return babyDragonImg;

  // Armas
  if (id === "espada") return smallSwordImg;
  if (id.startsWith("espada_") || id.startsWith("arma") || id === "sec0") return swordImg;
  if (id === "cajado" || id.startsWith("cajado_") || id === "adm0") return staffImg;
  if (id === "arco_oro1" || id === "arco_oro2") return crossbowImg;
  if (id === "arco" || id.startsWith("arco_")) return bowImg;
  if (id === "adaga" || id.startsWith("adaga_")) return daggerImg;
  if (id === "martelo" || id.startsWith("mart_")) return warhammerImg;

  // Anéis
  if (id === "anel_ouro1" || id === "anel_ouro2") return goldenRingImg;
  if (id === "anel" || id.startsWith("anel")) return ringImg;

  // Conjunto Caçador (Hunter)
  if (id === "elmo_cac1") return hunterHelmetImg;
  if (id === "peitoral_cac1" || id === "couro") return hunterChestImg;
  if (id === "calca_cac1") return hunterLegsImg;
  if (id === "bota_cac1" || id === "bota_vento") return hunterBootsImg;

  // Conjunto Arcano (Mage)
  if (id === "elmo_mag2") return mageHelmetImg;
  if (id === "peitoral_mag2") return mageChestImg;
  if (id === "calca_mag2") return mageLegsImg;
  if (id === "bota_mag2") return mageBootsImg;

  // Conjunto Sombrio (Darck)
  if (id === "elmo_drk3" || id === "sec1") return darckHelmetImg;
  if (id === "peitoral_drk3") return darckChestImg;
  if (id === "calca_drk3") return darckLegsImg;
  if (id === "bota_drk3") return darckBootsImg;

  // Conjunto Shogun (Samurai)
  if (id === "elmo_sam4") return samuraiHelmetImg;
  if (id === "peitoral_sam4") return samuraiChestImg;
  if (id === "calca_sam4") return samuraiLegsImg;
  if (id === "bota_sam4") return samuraiBootsImg;

  // Armaduras Pesadas / Padrão (Heavy)
  if (id.startsWith("elmo")) return heavyHelmetImg;
  if (id.startsWith("peitoral")) return heavyChestImg;
  if (id.startsWith("calca")) return heavyLegsImg;
  if (id.startsWith("bota")) return heavyBootsImg;
  // Luvas / Manoplas (aplica filtro automático de raridade 0 a 6)
  if (id.startsWith("luva")) return gloveImg;
  // Colares / Amuletos
  if (id === "colar_sangue") return necklaceSkullImg;
  if (id === "colar_sabio") return necklaceWoodImg;
  if (id === "colar_colosso" || id.startsWith("colar")) return necklaceReligionImg;

  return null;
}


export function ItemMark({ id, slot, className }: { id?: string | null; slot?: SlotKey; className?: string }) {
  if (id && id in AURA_FRAMES && AURA_FRAMES[id].length > 0) {
    const it = ITEMS[id];
    const filter = rarityFilter(id, it?.r || 0);
    return (
      <AnimatedSprite
        frames={AURA_FRAMES[id]}
        alt={it?.n || ""}
        className={`${className ?? ""} ${filter}`}
      />
    );
  }

  const sprite = spriteFor(id);
  if (id && sprite) {
    const it = ITEMS[id];
    const filter = rarityFilter(id, it?.r || 0);
    return (
      <img
        src={sprite}
        alt={it?.n || ""}
        className={`${className ?? ""} object-contain [image-rendering:pixelated] ${filter}`}
      />
    );
  }
  const I = iconFor(id, slot);
  return <I className={className} strokeWidth={1.75} aria-hidden />;
}

function iconFor(id?: string | null, slot?: SlotKey): LucideIcon {
  if (id === "ferro") return Anvil;
  if (id === "pele") return Shield;
  if (id === "gosma") return Droplets;
  if (id === "gema") return Gem;
  if (id === "pot") return FlaskConical;
  const it = id ? ITEMS[id] : undefined;
  const s = it?.s || slot;
  if (id === "cajado" || id === "adm0") return WandSparkles;
  if (id === "arco") return Crosshair;
  if (id === "martelo") return Hammer;
  if (s === "arma") return Sword;
  if (s === "peitoral" || s === "calca" || s === "bota" || s === "luva") return Shield;
  if (s === "elmo") return Crown;
  if (s === "colar" || s === "anel" || s === "anel1" || s === "anel2") return Gem;
  if (s === "aura") return Flame;
  return Gem;
}

export function itemLabel(id: string) {
  return ITEMS[id]?.n || id;
}
