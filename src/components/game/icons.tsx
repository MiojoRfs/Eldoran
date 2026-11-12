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

export function ItemMark({ id, slot, className }: { id?: string | null; slot?: SlotKey; className?: string }) {
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
