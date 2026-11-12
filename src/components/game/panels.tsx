import { useEffect, useState } from "react";
import { Lock, Trophy } from "lucide-react";
import {
  achievements,
  ATTRS,
  CLASSES,
  HUNTS,
  ITEMS,
  itemLines,
  LEGENDS,
  potPrice,
  RARITY,
  RECIPES,
  SHOP,
  SLOTS,
  TRAINS,
} from "@/game/data";
import { cpDelta, odds, riskOf, stats } from "@/game/engine";
import { dec, num, signed } from "@/game/format";
import { api } from "@/game/api";
import { useGame } from "@/game/store";
import type { ClassId, Zone } from "@/game/types";
import { ClassMark, ItemMark, ZoneMark } from "./icons";

export function Journey() {
  const journey = useGame((s) => s.journey);
  const setJourney = useGame((s) => s.setJourney);
  const list = journey === "treino" ? TRAINS : HUNTS;
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={journey === "caca" ? "btn" : "btn btn-ghost"} onClick={() => setJourney("caca")}>Caça</button>
        <button type="button" className={journey === "treino" ? "btn" : "btn btn-ghost"} onClick={() => setJourney("treino")}>Treino</button>
      </div>
      <div className="space-y-3">
        {list.map((z) => <ZoneCard key={z.id} zone={z} />)}
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: Zone }) {
  const player = useGame((s) => s.player)!;
  const startAct = useGame((s) => s.startAct);
  const [open, setOpen] = useState(false);
  const s = stats(player, false);
  const locked = zone.kind === "t" && player.level < (zone.req || 1);
  const active = player.act?.id === zone.id;
  const recovering = zone.kind === "h" && (player.cd || 0) > Date.now();
  const rk = zone.kind === "h" ? riskOf(player, zone, false) : 0;
  return (
    <article className="row p-3" data-zone={zone.id} style={{ borderColor: active ? "var(--color-gold)" : undefined }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="grid size-12 shrink-0 place-items-center rounded-md border border-line bg-surface text-gold">
            <ZoneMark id={zone.id} className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg">{zone.n}</span>
            <span className="block text-sm text-muted">{zone.d}</span>
            <span className="mt-1 block text-sm">
              XP +{dec(zone.xp * s.xm)}/s
              {zone.g ? ` · Ouro +${dec(zone.g * s.gm)}/s` : ""}
              {zone.kind === "h" ? ` · ${rk <= 0 ? "risco baixo" : `risco ${rk}%/min`}` : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="btn w-full shrink-0 sm:w-auto"
          disabled={locked || active || recovering}
          onClick={() => startAct(zone.kind, zone.id)}
        >
          {locked ? `Nível ${zone.req}` : active ? "Agora" : recovering ? "Ferido" : zone.kind === "h" ? "Caçar" : "Treinar"}
        </button>
      </div>
      {open && zone.kind === "h" && (
        <ZoneDetail zone={zone} rk={rk} luck={(zone.lk || 0) + s.attrs.sor * 0.01} drain={(zone.dg || 0) * s.vr * rk / 100} />
      )}
    </article>
  );
}

function ZoneDetail({ zone, rk, luck, drain }: { zone: Zone; rk: number; luck: number; drain: number }) {
  const o = odds(luck);
  return (
    <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
      <div><dt className="text-muted">Nível do lugar</dt><dd className="num">{zone.lv}</dd></div>
      <div><dt className="text-muted">Poder</dt><dd className="num">{num(zone.pw || 0)}</dd></div>
      <div><dt className="text-muted">Vida por segundo</dt><dd className="num">{dec(drain, 2)}</dd></div>
      <div><dt className="text-muted">Risco</dt><dd>{rk <= 0 ? "Baixo" : `${rk}% por minuto`}</dd></div>
      <div><dt className="text-muted">Lendário</dt><dd>{dec(o[3])}%</dd></div>
      <div><dt className="text-muted">Mítico</dt><dd>{dec(o[4], 2)}%</dd></div>
      <div><dt className="text-muted">Secreto</dt><dd>{dec(o[5], 3)}%</dd></div>
    </dl>
  );
}

export function HeroPanel() {
  const heroTab = useGame((s) => s.heroTab);
  const setHeroTab = useGame((s) => s.setHeroTab);
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={heroTab === "equip" ? "btn" : "btn btn-ghost"} onClick={() => setHeroTab("equip")}>Equipamento</button>
        <button type="button" className={heroTab === "attr" ? "btn" : "btn btn-ghost"} onClick={() => setHeroTab("attr")}>Atributos</button>
      </div>
      {heroTab === "equip" ? <Equipment /> : <Attributes />}
    </div>
  );
}

const POS: Record<string, [number, number]> = {
  elmo: [50, 10],
  colar: [50, 26],
  peitoral: [50, 43],
  calca: [50, 62],
  bota: [50, 84],
  arma: [13, 42],
  luva: [87, 42],
  anel1: [13, 60],
  anel2: [87, 60],
  aura: [87, 12],
};

function Equipment() {
  const player = useGame((s) => s.player)!;
  const unequip = useGame((s) => s.unequip);
  const equip = useGame((s) => s.equip);
  const sell = useGame((s) => s.sell);
  const sellAll = useGame((s) => s.sellAll);
  const [sel, setSel] = useState<string | null>(null);
  const bag = Object.entries(player.inv).filter(([, q]) => q > 0);
  const cur = SLOTS.find((s) => s.k === sel);
  const curId = cur ? player.eq[cur.k] : null;
  const curIt = curId ? ITEMS[curId] : undefined;
  return (
    <div>
      <h3 className="mb-3 text-gold">Boneco</h3>
      <div className="paperdoll">
        <svg viewBox="0 0 100 133" aria-hidden fill="currentColor" stroke="currentColor">
          <defs>
            <radialGradient id="pd-glow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.14 }} />
              <stop offset="100%" style={{ stopColor: "var(--color-gold)", stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          <rect width="100" height="133" fill="url(#pd-glow)" stroke="none" />
          <g opacity="0.55">
            <circle cx="50" cy="13" r="8" stroke="none" />
            <rect x="46" y="20" width="8" height="12" rx="3" stroke="none" />
            <rect x="34" y="31" width="32" height="47" rx="10" stroke="none" />
            <path d="M35 34 L15 56 M65 34 L85 56" strokeWidth="8" strokeLinecap="round" fill="none" />
            <rect x="37" y="74" width="12" height="46" rx="6" stroke="none" />
            <rect x="51" y="74" width="12" height="46" rx="6" stroke="none" />
          </g>
        </svg>
        {SLOTS.map((slot) => {
          const pos = POS[slot.k];
          if (!pos) return null;
          const id = player.eq[slot.k];
          const it = id ? ITEMS[id] : undefined;
          return (
            <button
              key={slot.k}
              type="button"
              className={`pd-slot ${it ? "glow" : ""}`}
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
              data-filled={it ? "true" : "false"}
              data-rarity={it ? it.r || 0 : undefined}
              data-active={sel === slot.k || undefined}
              aria-label={`${slot.n}: ${it ? it.n : "vazio"}`}
              title={`${slot.n}: ${it ? it.n : "vazio"}`}
              onClick={() => setSel(sel === slot.k ? null : slot.k)}
            >
              <ItemMark id={id} slot={slot.k} className={`size-[55%] ${it ? "" : "opacity-40"}`} />
            </button>
          );
        })}
      </div>
      <div className="row mt-3 min-h-20 p-3 text-sm" data-rarity={curIt ? curIt.r || 0 : undefined}>
        {!cur ? (
          <p className="text-muted">Toque em um espaço para ver o item.</p>
        ) : curIt ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-muted">{cur.n}</div>
              <div className="truncate text-base">{curIt.n}</div>
              <div>
                <span className="rarity">{RARITY[curIt.r || 0]}</span>
                {itemLines(curIt).length ? ` · ${itemLines(curIt).join(", ")}` : ""}
              </div>
            </div>
            <button type="button" className="btn btn-ghost shrink-0" onClick={() => unequip(cur.k)}>Tirar</button>
          </div>
        ) : (
          <p className="text-muted">{cur.n}: vazio. Equipe um item da mochila.</p>
        )}
      </div>
      <div className="mt-6 mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-gold">Mochila</h3>
        <button type="button" className="btn btn-ghost" onClick={() => sellAll(0)}>Vender comuns</button>
        <button type="button" className="btn btn-ghost" onClick={() => sellAll(1)}>Vender até raros</button>
      </div>
      {bag.length === 0 ? (
        <p className="text-muted">Mochila vazia. Cace para encontrar itens.</p>
      ) : (
        <div className="space-y-2">
          {bag.map(([id, q]) => {
            const it = ITEMS[id];
            const delta = it?.s ? cpDelta(player, id) : 0;
            return (
              <div key={id} className="row flex flex-col gap-3 p-3 sm:flex-row sm:items-center" data-rarity={it?.r || 0}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ItemMark id={id} className="size-7 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate">{it?.n || id} <b className="num text-gold">×{q}</b></div>
                    <div className="text-sm text-muted">
                      {it ? <span className="rarity">{RARITY[it.r || 0]}</span> : "Desconhecido"}
                      {it ? ` · ${itemLines(it).join(", ") || "Material"} · ${num(it.v)} ouro` : ""}
                      {delta !== 0 && (
                        <b className={delta > 0 ? "text-gold" : "text-life"}> {signed(delta)} CP</b>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {it?.s && <button type="button" className="btn flex-1 sm:flex-none" onClick={() => equip(id)}>Equipar</button>}
                  <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={() => sell(id)}>Vender</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Attributes() {
  const player = useGame((s) => s.player)!;
  const addAttr = useGame((s) => s.addAttr);
  const respec = useGame((s) => s.respec);
  const s = stats(player, false);
  const c = CLASSES[player.cls];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="row px-3 py-2">Pontos livres <b className="num text-gold">{player.pts}</b></p>
        <button type="button" className="btn btn-ghost" onClick={respec}>Redistribuir · {num(50 * player.level)} ouro</button>
      </div>
      <div className="space-y-2">
        {ATTRS.map((a) => (
          <div key={a.k} className="row flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div>{a.n} <b className="num text-gold">{s.attrs[a.k]}</b>{s.bonus[a.k] ? <span className="text-gold"> +{s.bonus[a.k]}</span> : null}</div>
              <div className="text-sm text-muted">{a.d}</div>
            </div>
            <button type="button" className="btn" disabled={player.pts <= 0} aria-label={`Aumentar ${a.n}`} onClick={() => addAttr(a.k)}>+</button>
          </div>
        ))}
      </div>
      <h3 className="mt-6 mb-2 text-gold">Habilidades</h3>
      <div className="row mb-2 p-3" data-class={player.cls}>
        <b style={{ color: "var(--accent)" }}>{c.p}</b>
        <p className="text-sm text-muted">Passiva, sempre ativa. {c.d}</p>
      </div>
      <p className="text-sm text-muted">As ativas ficam no retrato, acima. O registro não lista cada golpe.</p>
    </div>
  );
}

export function Town() {
  const townTab = useGame((s) => s.townTab);
  const setTownTab = useGame((s) => s.setTownTab);
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={townTab === "loja" ? "btn" : "btn btn-ghost"} onClick={() => setTownTab("loja")}>Loja</button>
        <button type="button" className={townTab === "ferr" ? "btn" : "btn btn-ghost"} onClick={() => setTownTab("ferr")}>Ferreiro</button>
      </div>
      {townTab === "loja" ? <Shop /> : <Smith />}
    </div>
  );
}

function Shop() {
  const player = useGame((s) => s.player)!;
  const buy = useGame((s) => s.buy);
  const price = potPrice(player.level);
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm text-muted">Equipamento básico e barras para o ferreiro. Vender continua na mochila.</p>
      <div className="row flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div>Poção de vida</div>
          <div className="text-sm text-muted">Restaura toda a vida na hora.</div>
        </div>
        <button type="button" className="btn" onClick={() => buy("pot")}>{num(price)} ouro</button>
      </div>
      {SHOP.map((id) => {
        const it = ITEMS[id];
        if (!it) return null; // PROTEÇÃO: Se o item não existir, pula e não quebra o jogo
        const p = (it.v || 10) * 6;
        return (
          <div key={id} className="row flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ItemMark id={id} className="size-7 shrink-0" />
              <div className="min-w-0">
                <div className="truncate">{it.n} <span className="text-sm text-muted">você tem {player.inv[id] || 0}</span></div>
                <div className="text-sm text-muted">{it.s ? itemLines(it).join(", ") : "Material de forja"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {!it.s && <button type="button" className="btn btn-ghost" onClick={() => buy(id, 10)}>×10 · {num(p * 10)}</button>}
              <button type="button" className="btn" onClick={() => buy(id)}>{num(p)} ouro</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Smith() {
  const player = useGame((s) => s.player)!;
  const forge = useGame((s) => s.forge);
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm text-muted">O ferreiro troca materiais, barras e ouro por uma peça melhor.</p>
      {RECIPES.map((r) => {
        const it = ITEMS[r.id];
        if (!it) return null; // PROTEÇÃO: Se a receita apontar para item nulo, ignora
        return (
          <div key={r.id} className="row flex flex-col gap-3 p-3 glow sm:flex-row sm:items-center" data-rarity={it.r || 0}>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <ItemMark id={r.id} className="size-8 shrink-0" />
              <div className="min-w-0">
                <div className="font-display">{it.n}</div>
                <div className="text-sm"><span className="rarity">{RARITY[it.r || 0]}</span> · {itemLines(it).join(", ")}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-sm">
                  {Object.entries(r.mats).map(([k, v]) => (
                    <span key={k} className={(player.inv[k] || 0) >= v ? "text-gold" : "text-life"}>
                      {ITEMS[k]?.n || k} {player.inv[k] || 0}/{v}
                    </span>
                  ))}
                  <span className={player.gold >= r.gold ? "text-gold" : "text-life"}>{num(r.gold)} ouro</span>
                </div>
              </div>
            </div>
            <button type="button" className="btn" onClick={() => forge(r.id)}>Forjar</button>
          </div>
        );
      })}
    </div>
  );
}

type RankRow = { n: string; u: string; l: number; cp: number; cls?: string };

export function Hall() {
  const player = useGame((s) => s.player)!;
  const username = useGame((s) => s.username);
  const rankBy = useGame((s) => s.rankBy);
  const setRankBy = useGame((s) => s.setRankBy);
  const [rows, setRows] = useState<RankRow[] | null>(null);
  const [err, setErr] = useState(false);
  const s = stats(player, false);
  const ach = achievements(player);
  const done = ach.filter((a) => a[2]).length;

  useEffect(() => {
    let cancel = false;
    setErr(false);
    void api("/api/ranking").then(({ res, data }) => {
      if (cancel) return;
      if (!res.ok || !Array.isArray(data)) {
        setErr(true);
        setRows([]);
        return;
      }
      setRows(data as RankRow[]);
    }).catch(() => {
      if (!cancel) {
        setErr(true);
        setRows([]);
      }
    });
    return () => {
      cancel = true;
    };
  }, []);

  const adv = [...(rows || [])].sort((a, b) => (rankBy === "cp" ? b.cp - a.cp : b.l - a.l) || b.cp - a.cp);
  const legends = [...LEGENDS].sort((a, b) => (rankBy === "cp" ? b.cp - a.cp : b.l - a.l) || b.cp - a.cp);
  const mine = adv.findIndex((r) => r.u === username);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={rankBy === "cp" ? "btn" : "btn btn-ghost"} onClick={() => setRankBy("cp")}>Por CP</button>
        <button type="button" className={rankBy === "l" ? "btn" : "btn btn-ghost"} onClick={() => setRankBy("l")}>Por nível</button>
      </div>
      <div className="row mb-4 p-3">
        <div className="text-sm text-muted">Você agora</div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <b>{player.name}</b>
          <span>Nv {player.level} · <b className="num text-gold">{num(s.cp)} CP</b></span>
        </div>
        <p className="text-sm text-muted">
          {rows === null ? "Lendo o salão…" : mine >= 0 ? `${mine + 1}º entre os aventureiros desta lista.` : "Seu CP ainda não entrou nos 20 do servidor."}
        </p>
      </div>
      <h3 className="mb-2 text-gold">Aventureiros</h3>
      {err && <p className="mb-2 text-sm text-life">O ranking não respondeu. O servidor pode estar acordando.</p>}
      <List
        rows={adv.map((r, i) => ({
          key: r.u || r.n,
          pos: i + 1,
          name: r.n,
          cls: (r.cls && r.cls in CLASSES ? r.cls : "guerreiro") as ClassId,
          level: r.l,
          cp: r.cp,
          me: r.u === username,
          tag: "",
        }))}
        empty="Nenhum aventureiro no salão."
      />
      <h3 className="mt-6 mb-1 text-gold">Lendas de Eldoria</h3>
      <p className="mb-2 text-sm text-muted">Figuras da crônica. Não são jogadores.</p>
      <List
        rows={legends.map((r, i) => ({
          key: r.n,
          pos: i + 1,
          name: r.n,
          cls: r.cls,
          level: r.l,
          cp: r.cp,
          me: false,
          tag: "Lenda",
        }))}
      />
      <h3 className="mt-6 mb-2 text-gold">Conquistas {done}/{ach.length}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {ach.map(([name, desc, ok]) => (
          <div key={name} className={`row p-3 ${ok ? "" : "opacity-50"}`}>
            <b className={ok ? "text-gold" : ""}>{ok ? <Trophy className="mr-1 inline size-4" aria-hidden /> : <Lock className="mr-1 inline size-4" aria-hidden />}{name}</b>
            <div className="text-sm text-muted">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function List({ rows, empty }: { rows: { key: string; pos: number; name: string; cls: ClassId; level: number; cp: number; me: boolean; tag: string }[]; empty?: string }) {
  if (!rows.length) return <p className="text-muted">{empty}</p>;
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.key} className="row flex items-center gap-3 p-2" style={r.me ? { borderColor: "var(--color-gold)" } : undefined}>
          <b className="num w-8 text-center">{r.pos}</b>
          <ClassMark id={r.cls} className="size-5 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            {r.name}
            {r.me ? " (você)" : ""}
            {r.tag ? <span className="text-muted"> · {r.tag}</span> : ""}
          </div>
          <span className="text-sm text-muted">Nv {r.level}</span>
          <b className="num w-24 text-right text-gold">{num(r.cp)}</b>
        </div>
      ))}
    </div>
  );
}
