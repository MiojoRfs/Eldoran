import { useState } from "react";
import { Castle } from "lucide-react";
import { ATTRS, CLASSES, CLASS_IDS, ITEMS } from "@/game/data";
import { useGame } from "@/game/store";
import type { ClassId } from "@/game/types";
import { ClassMark, ItemMark } from "./icons";

export function AuthScreen() {
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);
  const login = useGame((s) => s.login);
  const startDemo = useGame((s) => s.startDemo);
  const loading = useGame((s) => s.loading);
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    if (mode === "up" && pw !== pw2) {
      setErr("As senhas não coincidem.");
      return;
    }
    setErr("");
    const msg = await login(user, pw);
    if (msg) setErr(msg);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="seal mx-auto" data-class="paladino">
            <Castle className="size-10" strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="mt-4 text-3xl text-gold">Crônicas de Eldoria</h1>
          <p className="mt-2 text-muted">Treine e cace longe da tela. O herói continua a jornada.</p>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button type="button" className={mode === "in" ? "btn" : "btn btn-ghost"} onClick={() => setMode("in")}>
            Entrar
          </button>
          <button type="button" className={mode === "up" ? "btn" : "btn btn-ghost"} onClick={() => setMode("up")}>
            Criar conta
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input className="inp" placeholder="Usuário" autoComplete="username" maxLength={16} value={user} onChange={(e) => setUser(e.target.value)} />
          <input
            className="inp"
            placeholder="Senha"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          {mode === "up" && (
            <input className="inp" placeholder="Repita a senha" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          )}
          <p className="min-h-6 text-sm text-life" role="status">
            {loading ? "Conectando… se o servidor estiver dormindo, pode levar um minuto." : err}
          </p>
          <button className="btn w-full" type="submit" disabled={loading}>
            {mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">O progresso fica na sua conta, em qualquer aparelho.</p>
        {mode === "in" && (
          <details className="mt-3 text-sm text-muted">
            <summary className="cursor-pointer">Conta antiga, de antes das senhas?</summary>
            <p className="mt-2">Entre com a senha que quiser. A primeira senha digitada passa a valer.</p>
          </details>
        )}
        <button type="button" className="btn btn-ghost mt-4 w-full" onClick={startDemo}>
          Olhar o visual sem salvar
        </button>
      </div>
    </main>
  );
}

export function ClassScreen() {
  const begin = useGame((s) => s.begin);
  const [pick, setPick] = useState<ClassId>("guerreiro");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const c = CLASSES[pick];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl text-gold">Escolha seu destino</h1>
        <p className="mt-2 text-muted">A classe concede um bônus que não sai do herói.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const msg = begin(name, pick);
          if (msg) setErr(msg);
        }}
      >
        <input className="inp mx-auto mb-4 max-w-sm text-center" placeholder="Nome do herói" maxLength={14} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {CLASS_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-class={id}
              className={id === pick ? "btn shrink-0" : "btn btn-ghost shrink-0"}
              onClick={() => setPick(id)}
            >
              <ClassMark id={id} className="size-4" />
              {CLASSES[id].n}
            </button>
          ))}
        </div>
        <article className="panel p-6" data-class={pick}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="seal lg" data-class={pick}>
              <ClassMark id={pick} className="size-14" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-2xl" style={{ color: "var(--accent)" }}>{c.n}</h2>
              <p className="text-muted">{c.t}</p>
              <p className="mt-3 text-gold">{c.p}</p>
              <p>{c.d}</p>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted sm:justify-start">
                <ItemMark id={c.w} className="size-4" />
                Começa com {ITEMS[c.w].n}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ATTRS.map((a) => (
              <div key={a.k} className="row px-2 py-2 text-center">
                <dt className="text-sm text-muted">{a.n}</dt>
                <dd className="num text-lg">{c.a[a.k]}</dd>
              </div>
            ))}
          </dl>
        </article>
        <p className="mt-4 min-h-6 text-center text-sm text-life">{err}</p>
        <div className="text-center">
          <button className="btn px-8" type="submit">Iniciar jornada</button>
        </div>
      </form>
    </main>
  );
}
