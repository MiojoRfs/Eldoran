import { useEffect, useState, type ReactNode } from "react";
import { CLASSES, ITEMS, NEWS, RARITY, SRV, VERSION } from "@/game/data";
import { api, detail } from "@/game/api";
import { awayLabel, num } from "@/game/format";
import { useGame } from "@/game/store";
import { ItemMark } from "./icons";

export function Dialogs() {
  const welcome = useGame((s) => s.welcome);
  const drop = useGame((s) => s.drop);
  const news = useGame((s) => s.news);
  const adminOpen = useGame((s) => s.adminOpen);
  return (
    <>
      {welcome && <Welcome />}
      {drop && <Drop id={drop} />}
      {news && <News />}
      {adminOpen && <Admin />}
    </>
  );
}

function Overlay({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel modal-card p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Welcome() {
  const w = useGame((s) => s.welcome)!;
  const close = useGame((s) => s.closeWelcome);
  return (
    <Overlay label="De volta a Eldoria" onClose={close}>
      <h2 className="text-2xl text-gold">De volta à crônica</h2>
      <p className="mt-1 text-muted">Você ficou fora por {awayLabel(w.awayMs)}. O herói não parou.</p>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="row p-3"><dt className="text-sm text-muted">Ouro</dt><dd className="num text-xl text-gold">+{num(w.gold)}</dd></div>
        <div className="row p-3"><dt className="text-sm text-muted">Níveis</dt><dd className="num text-xl">+{w.levels}</dd></div>
      </dl>
      {w.drops.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {w.drops.map((d) => (
            <li key={d.name} data-rarity={d.rarity}>
              <span className="rarity">{RARITY[d.rarity]}</span> · {d.name} ×{d.q}
            </li>
          ))}
          {w.extra > 0 && <li className="text-muted">e mais {w.extra}.</li>}
        </ul>
      )}
      {w.gold === 0 && w.levels === 0 && w.drops.length === 0 && (
        <p className="mt-4 text-sm text-muted">A trilha rendeu pouco desta vez — ou a morte interrompeu cedo.</p>
      )}
      <button type="button" className="btn mt-5 w-full" onClick={close}>Seguir</button>
    </Overlay>
  );
}

function Drop({ id }: { id: string }) {
  const close = useGame((s) => s.closeDrop);
  const equip = useGame((s) => s.equip);
  const it = ITEMS[id];
  if (!it) return null;
  const r = it.r || 0;
  return (
    <Overlay label="Drop raro" onClose={close}>
      <div className="glow mx-auto max-w-sm p-2 text-center" data-rarity={r}>
        <ItemMark id={id} className="mx-auto size-16 text-gold" />
        <h2 className="mt-3 text-2xl rarity">{it.n}</h2>
        <p className="mt-2 text-sm"><span className="rarity">{RARITY[r]}</span></p>
        <p className="mt-2 text-sm text-muted">{it.s ? "Pode equipar agora." : ""}</p>
        <div className="mt-5 flex justify-center gap-2">
          {it.s && (
            <button type="button" className="btn" onClick={() => { equip(id); close(); }}>Equipar</button>
          )}
          <button type="button" className="btn btn-ghost" onClick={close}>Guardar</button>
        </div>
      </div>
    </Overlay>
  );
}

function News() {
  const close = useGame((s) => s.setNews);
  const [text, setText] = useState("Verificando o servidor…");
  useEffect(() => {
    let cancel = false;
    void api("/api/version").then(({ data }) => {
      if (cancel || typeof data.version !== "string") return;
      const when = typeof data.started_at === "string" ? new Date(data.started_at).toLocaleString("pt-BR") : "—";
      const same = data.version === VERSION ? "" : ` O servidor está na v${data.version}; esta tela é a v${VERSION}. O progresso é o mesmo.`;
      const db = data.db === "sqlite" ? " Banco SQLite: no Render os dados podem sumir se o DATABASE_URL não estiver configurado." : "";
      setText(`Servidor no ar. Tela v${VERSION} · servidor v${data.version} · ${String(data.db || "banco")} · desde ${when}.${same}${db}`);
    }).catch(() => {
      if (!cancel) setText("Servidor offline ou acordando. No plano grátis isso leva cerca de um minuto.");
    });
    return () => {
      cancel = true;
    };
  }, []);
  return (
    <Overlay label="Novidades" onClose={() => close(false)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl text-gold">Novidades</h2>
        <button type="button" className="btn btn-ghost" onClick={() => close(false)}>Fechar</button>
      </div>
      <p className="row mb-4 p-3 text-sm text-muted">{text}</p>
      {NEWS.map((n) => (
        <section key={n.version} className="mb-4">
          <h3 className="text-gold">v{n.version} <span className="text-sm font-sans text-muted">{n.date}</span></h3>
          <ul className="list-disc pl-5 text-sm">
            {n.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted">Servidor: {SRV.replace("https://", "")}</p>
    </Overlay>
  );
}

type AdminRow = { u: string; l: number; cp: number; banned: boolean; admin: boolean };
type AdminDetail = {
  username: string;
  banned: boolean;
  ban_msg: string;
  pending: number;
  data?: {
    cls?: string;
    level?: number;
    gold?: number;
    pts?: number;
    inv?: Record<string, number>;
    eq?: Record<string, string | null>;
  } | null;
};

function Admin() {
  const token = useGame((s) => s.token);
  const close = useGame((s) => s.setAdmin);
  const pushToast = useGame((s) => s.pushToast);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [err, setErr] = useState("");
  const [who, setWho] = useState<string | null>(null);

  async function load(query = q) {
    setErr("");
    setRows(null);
    try {
      const { res, data } = await api(`/api/admin/players?q=${encodeURIComponent(query)}`, {}, token);
      if (!res.ok) throw new Error(detail(data));
      setRows(data as unknown as AdminRow[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
      setRows([]);
    }
  }

  useEffect(() => {
    void load("");
    // apenas na abertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Overlay label="Painel do administrador" onClose={() => close(false)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl text-gold">Administrador</h2>
        <button type="button" className="btn btn-ghost" onClick={() => close(false)}>Fechar</button>
      </div>
      {who ? (
        <AdminPlayer username={who} token={token} onBack={() => { setWho(null); void load(); }} toast={pushToast} />
      ) : (
        <>
          <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void load(); }}>
            <input className="inp" placeholder="Buscar jogador" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" type="submit">Buscar</button>
          </form>
          {err && <p className="text-sm text-life">{err}</p>}
          {rows === null && <p className="text-muted">Carregando…</p>}
          {rows && rows.length === 0 && <p className="text-muted">Nenhum jogador.</p>}
          <div className="space-y-1">
            {rows?.map((r) => (
              <div key={r.u} className="row flex items-center gap-3 p-2">
                <div className="min-w-0 flex-1 truncate">
                  {r.u}
                  {r.admin ? " · coroa" : ""}
                  {r.banned ? <span className="text-life"> · banido</span> : ""}
                </div>
                <span className="text-sm text-muted">Nv {r.l}</span>
                <b className="num w-20 text-right text-gold">{num(r.cp || 0)}</b>
                <button type="button" className="btn btn-ghost" onClick={() => setWho(r.u)}>Abrir</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Overlay>
  );
}

function AdminPlayer({ username, token, onBack, toast }: { username: string; token: string | null; onBack: () => void; toast: (m: string) => void }) {
  const [info, setInfo] = useState<AdminDetail | null>(null);
  const [err, setErr] = useState("");
  const [item, setItem] = useState("ferro");
  const [qty, setQty] = useState("1");
  const [gold, setGold] = useState("1000");
  const [level, setLevel] = useState("1");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState("0");
  const [pw, setPw] = useState("");
  const [arm, setArm] = useState(false);

  async function load() {
    setErr("");
    try {
      const { res, data } = await api(`/api/admin/player/${encodeURIComponent(username)}`, {}, token);
      if (!res.ok) throw new Error(detail(data));
      const d = data as unknown as AdminDetail;
      setInfo(d);
      setLevel(String(d.data?.level || 1));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function act(path: string, body: unknown, ok: string) {
    try {
      const { res, data } = await api(`/api/admin/${path}`, { method: "POST", body: JSON.stringify(body) }, token);
      if (!res.ok) throw new Error(detail(data));
      toast(ok);
      if (path === "delete") onBack();
      else void load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro");
    }
  }

  const d = info?.data;
  const inv = Object.entries(d?.inv || {}).filter(([, q]) => q > 0);
  const opts = Object.keys(ITEMS).sort((a, b) => ITEMS[a].n.localeCompare(ITEMS[b].n, "pt-BR"));

  return (
    <div>
      <button type="button" className="btn btn-ghost mb-3" onClick={onBack}>Voltar</button>
      {err && <p className="text-sm text-life">{err}</p>}
      {!info && !err && <p className="text-muted">Carregando…</p>}
      {info && (
        <>
          <div className="row mb-3 p-3">
            <b className="text-lg text-gold">{info.username}</b>
            {info.banned && <p className="text-sm text-life">{info.ban_msg}</p>}
            <p className="text-sm text-muted">
              {d?.cls && CLASSES[d.cls as keyof typeof CLASSES] ? CLASSES[d.cls as keyof typeof CLASSES].n : d?.cls || "sem classe"}
              {" · "}Nv {d?.level || "—"} · {num(d?.gold || 0)} ouro · {d?.pts || 0} pontos
              {info.pending ? ` · ${info.pending} ação(ões) na fila` : ""}
            </p>
            <p className="text-sm">Mochila: {inv.length ? inv.map(([id, q]) => `${ITEMS[id]?.n || id} ×${q}`).join(", ") : "vazia"}</p>
          </div>
          <Field title="Item">
            <select className="inp" value={item} onChange={(e) => setItem(e.target.value)}>
              {opts.map((id) => <option key={id} value={id}>{ITEMS[id].n}{ITEMS[id].r ? ` (${RARITY[ITEMS[id].r || 0]})` : ""}</option>)}
            </select>
            <input className="inp w-24" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            <button type="button" className="btn" onClick={() => act("action", { username, t: "item", id: item, q: Math.floor(+qty || 0) }, "Item enfileirado.")}>Dar</button>
            <button type="button" className="btn btn-ghost" onClick={() => act("action", { username, t: "item", id: item, q: -Math.floor(+qty || 0) }, "Remoção enfileirada.")}>Remover</button>
          </Field>
          <Field title="Ouro">
            <input className="inp w-32" type="number" min={1} value={gold} onChange={(e) => setGold(e.target.value)} />
            <button type="button" className="btn" onClick={() => act("action", { username, t: "gold", q: Math.floor(+gold || 0) }, "Ouro enfileirado.")}>Dar</button>
            <button type="button" className="btn btn-ghost" onClick={() => act("action", { username, t: "gold", q: -Math.floor(+gold || 0) }, "Retirada enfileirada.")}>Tirar</button>
          </Field>
          <Field title="Nível — zera o XP deste nível e dá 3 pontos por nível subido">
            <input className="inp w-24" type="number" min={1} value={level} onChange={(e) => setLevel(e.target.value)} />
            <button type="button" className="btn" onClick={() => act("action", { username, t: "level", v: Math.floor(+level || 0) }, "Nível enfileirado.")}>Definir</button>
          </Field>
          <Field title="Banimento">
            <input className="inp" placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
            <input className="inp w-40" type="number" min={0} placeholder="Horas, 0 = permanente" value={hours} onChange={(e) => setHours(e.target.value)} />
            <button type="button" className="btn btn-danger" onClick={() => act("ban", { username, reason, hours: Math.max(0, Math.floor(+hours || 0)) }, "Jogador banido.")}>Banir</button>
            <button type="button" className="btn btn-ghost" onClick={() => act("unban", { username }, "Desbanido.")}>Desbanir</button>
          </Field>
          <Field title="Senha">
            <input className="inp" placeholder="Nova senha" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" className="btn" onClick={() => act("set-password", { username, new_password: pw }, "Senha redefinida.")}>Redefinir</button>
          </Field>
          <div className="mt-3 border border-life p-3">
            <p className="mb-2 text-sm text-life">Zona de perigo</p>
            {arm ? (
              <button type="button" className="btn btn-danger" onClick={() => act("delete", { username }, "Conta excluída.")}>Confirmar exclusão</button>
            ) : (
              <button type="button" className="btn btn-danger" onClick={() => setArm(true)}>Excluir conta</button>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">Itens, ouro e nível chegam em até 5 segundos se a pessoa estiver online, ou no próximo login.</p>
        </>
      )}
    </div>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="row mb-2 p-3">
      <div className="mb-2 text-sm text-gold">{title}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
