import { Castle, Coins, LogOut, ScrollText, Swords, Volume2, VolumeX } from "lucide-react";
import { findZone, POWER, powerTier, SKILLS, skinName } from "@/game/data";
import { dec, num } from "@/game/format";
import { riskOf, stats } from "@/game/engine";
import { useGame, type TabId } from "@/game/store";
import type { Player } from "@/game/types";
import { ClassMark, ZoneMark } from "./icons";
import { Hall, HeroPanel, Journey, Town } from "./panels";

const TABS: [TabId, string][] = [
  ["jornada", "Jornada"],
  ["heroi", "Herói"],
  ["vila", "Vila"],
  ["salao", "Salão"],
];

export function PlayView() {
  const player = useGame((s) => s.player);
  if (!player) return null;
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pt-4 pb-28 md:px-6 md:pb-8">
      <Top />
      <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
        <Stage player={player} />
        <div className="min-w-0">
          <Scene player={player} />
          <Destinations />
          <section className="panel mt-4 p-4 sm:p-5">
            <Panel />
          </section>
          <Log />
        </div>
      </div>
    </div>
  );
}

function Top() {
  const player = useGame((s) => s.player)!;
  const username = useGame((s) => s.username);
  const demo = useGame((s) => s.demo);
  const admin = useGame((s) => s.admin);
  const sound = useGame((s) => s.sound);
  const s = stats(player, false);
  const toggleSound = useGame((s) => s.toggleSound);
  const logout = useGame((s) => s.logout);
  const setNews = useGame((s) => s.setNews);
  const setAdmin = useGame((s) => s.setAdmin);
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Castle className="size-7 text-gold" aria-hidden />
        <div>
          <h1 className="text-xl text-gold sm:text-2xl">
            <span className="sm:hidden">Eldoria</span>
            <span className="hidden sm:inline">Crônicas de Eldoria</span>
          </h1>
          <p className="text-sm text-muted">{demo ? "Demonstração" : username}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill"><Coins className="size-4" aria-hidden /> <span className="num">{num(player.gold)}</span></span>
        <span className="pill"><Swords className="size-4" aria-hidden /> <span className="num">{num(s.cp)}</span> CP</span>
        {admin && (
          <button type="button" className="btn btn-ghost" onClick={() => setAdmin(true)}>ADM</button>
        )}
        <button type="button" className="icon-btn" aria-label="Novidades" onClick={() => setNews(true)}>
          <ScrollText className="size-5" />
        </button>
        <button type="button" className="icon-btn" aria-label={sound ? "Silenciar" : "Ativar som"} data-on={sound} onClick={toggleSound}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
        <button type="button" className="icon-btn" aria-label="Sair" onClick={logout}>
          <LogOut className="size-5" />
        </button>
      </div>
      {demo && (
        <p className="row w-full px-3 py-2 text-sm text-muted">
          Demonstração local. Entre com sua conta para salvar no servidor.
        </p>
      )}
    </header>
  );
}

function Stage({ player }: { player: Player }) {
  const s = stats(player, false);
  const skin = skinName(player);
  const aura = player.eq.aura ? "equipada" : POWER[powerTier(s.cp)];

  // VERIFICA QUAL AURA ESTÁ EQUIPADA PARA INJETAR O CSS
  let auraFx = "";
  if (player.eq.aura === "sec2") auraFx = "aura-gojo";
  if (player.eq.aura === "adm1") auraFx = "aura-adm";

  return (
    // Injetamos a variável auraFx direto na classe do painel principal
    <aside className={`panel p-5 lg:sticky lg:top-4 ${auraFx}`} data-class={player.cls}>
      <div className="flex items-center gap-4 lg:flex-col lg:text-center">
        <div className="seal lg shrink-0">
          <ClassMark id={player.cls} className="size-12" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-2xl">{player.name}</h2>
          <p style={{ color: "var(--accent)" }}>
            {player.cls === "guerreiro" ? "Guerreiro" : player.cls === "mago" ? "Mago" : player.cls === "arqueiro" ? "Arqueiro" : player.cls === "paladino" ? "Paladino" : "Assassino"}
            {" · "}nível {player.level}
          </p>
          <p className="text-sm text-muted">
            {skin ? skin : "Sem skin"} · aura {aura}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div>
          <div className="mb-1 text-sm text-muted">Vida</div>
          <Meter kind="life" value={player.hp} max={s.max} />
        </div>
        <div>
          <div className="mb-1 text-sm text-muted">Experiência</div>
          <Meter kind="xp" value={player.xp} max={needOf(player.level)} />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Dano <b className="num text-fg">{s.dmg}</b>
        <span className="px-2">·</span>
        Crítico <b className="num text-fg">{dec(s.crit)}%</b>
      </p>
      <div className="mt-4">
        <Skills player={player} />
      </div>
    </aside>
  );
}

function needOf(level: number) {
  return Math.floor(100 * 1.35 ** (level - 1));
}

export function Meter({ kind, value, max }: { kind: "life" | "xp"; value: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`meter ${kind}`} role="meter" aria-valuenow={Math.floor(value)} aria-valuemin={0} aria-valuemax={Math.floor(max)}>
      <i style={{ width: `${pct}%` }} />
      <b>{num(value)} / {num(max)}</b>
    </div>
  );
}

function Skills({ player }: { player: Player }) {
  const cast = useGame((s) => s.cast);
  const now = Date.now();
  return (
    <div className="grid grid-cols-2 gap-2">
      {SKILLS[player.cls].map((s, i) => {
        const st = player.sk?.[i];
        const locked = player.level < s.level;
        const hot = !!st && st.u > now;
        const cooling = !!st && st.c > now;
        const sub = locked ? `Nível ${s.level}` : hot ? `${Math.ceil((st.u - now) / 1000)}s` : cooling ? `${Math.ceil((st.c - now) / 1000)}s` : "Pronta";
        return (
          <button
            key={s.name}
            type="button"
            className="btn btn-ghost"
            data-hot={hot || undefined}
            disabled={locked || cooling}
            title={s.desc}
            onClick={() => cast(i)}
          >
            <span className="flex flex-col items-center leading-tight">
              <span>{s.name}</span>
              <span className="text-sm font-normal">{sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Scene({ player }: { player: Player }) {
  const halt = useGame((s) => s.halt);
  const revive = useGame((s) => s.revive);
  const now = Date.now();
  const recovering = (player.cd || 0) > now;
  const z = findZone(player.act);
  const s = stats(player, false);
  const zone = recovering ? "down" : z?.id || "rest";
  const rk = z && z.kind === "h" ? riskOf(player, z, false) : 0;
  return (
    <section className="scene p-4 sm:p-5" data-zone={zone}>
      <ZoneMark id={zone} className="scene-mark size-28" />
      {recovering ? (
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-life">Recuperando</p>
            <h2 className="text-2xl">Derrota recente</h2>
            <p className="text-muted">A caça volta em {Math.max(1, Math.ceil(((player.cd || 0) - now) / 1000))}s. O treino continua liberado.</p>
          </div>
          <button type="button" className="btn" onClick={revive}>Reviver · {num(50 * player.level)} ouro</button>
        </div>
      ) : z ? (
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gold">{z.kind === "h" ? "Caçando" : "Treinando"}</p>
            <h2 className="text-2xl">{z.n}</h2>
            <p className="text-muted">
              XP +{dec(z.xp * s.xm)}/s
              {z.g ? ` · Ouro +${dec(z.g * s.gm)}/s` : ""}
            </p>
            {z.kind === "h" && <Risk value={rk} />}
          </div>
          <button type="button" className="btn btn-ghost" onClick={halt}>Parar</button>
        </div>
      ) : (
        <div className="relative">
          <p className="text-sm text-gold">Em descanso</p>
          <h2 className="text-2xl">O herói espera</h2>
          <p className="max-w-xl text-muted">Escolha um treino ou uma caça. O tempo fora da tela também conta, até oito horas.</p>
        </div>
      )}
    </section>
  );
}

function Risk({ value }: { value: number }) {
  const heat = value <= 0 ? "cool" : value < 40 ? "warm" : "hot";
  return (
    <div className="mt-3 max-w-sm">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">Risco de morte</span>
        <span className="num">{value <= 0 ? "Baixo" : `${value}%/min`}</span>
      </div>
      <div className="meter risk" data-heat={heat}>
        <i style={{ width: `${Math.min(100, (value / 80) * 100)}%` }} />
      </div>
    </div>
  );
}

function Destinations() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  return (
    <nav className="dock fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-line bg-surface px-2 pt-2 md:static md:z-auto md:mt-4 md:border-0 md:bg-transparent md:px-0 md:pt-0" aria-label="Destinos">
      {TABS.map(([id, label]) => (
        <button key={id} type="button" className={tab === id ? "btn" : "btn btn-ghost"} onClick={() => setTab(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}

function Panel() {
  const tab = useGame((s) => s.tab);
  if (tab === "heroi") return <HeroPanel />;
  if (tab === "vila") return <Town />;
  if (tab === "salao") return <Hall />;
  return <Journey />;
}

function Log() {
  const log = useGame((s) => s.log);
  const kills = useGame((s) => s.kills);
  return (
    <section className="mt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-gold">Registro</h3>
        <p className="text-sm text-muted">Abates nesta visita <b className="num text-fg">{kills}</b></p>
      </div>
      <div className="row h-36 overflow-y-auto p-3 text-sm" aria-live="polite">
        {log.length === 0 ? (
          <p className="text-muted">Golpes comuns ficam de fora. Críticos, drops e mortes aparecem aqui.</p>
        ) : (
          log.map((e, i) => (
            <p key={`${e.kind}-${i}`} className={e.kind === "death" ? "text-life" : undefined} data-rarity={e.rarity}>
              {e.rarity ? <span className="rarity">{labelRarity(e.rarity)} · </span> : null}
              {e.text}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

function labelRarity(r: number) {
  return ["Comum", "Raro", "Épico", "Lendário", "Mítico", "Secreto", "Administrador"][r] || "";
}
