import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game/GameApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
  }, []);
  if (!on) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl text-gold">Crônicas de Eldoria</p>
          <p className="mt-2 text-muted">Abrindo os portões…</p>
        </div>
      </main>
    );
  }
  return <GameApp />;
}
