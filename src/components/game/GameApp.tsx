import { useEffect } from "react";
import { resumeAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { AuthScreen, ClassScreen } from "./AuthScreens";
import { Dialogs } from "./dialogs";
import { PlayView } from "./PlayView";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const flash = useGame((s) => s.flash);
  const toasts = useGame((s) => s.toasts);
  const boot = useGame((s) => s.boot);

  useEffect(() => {
    boot();
    let raf = 0;
    let next = performance.now() + 1000;
    const frame = (t: number) => {
      if (t >= next) {
        next = t + 1000;
        useGame.getState().tick();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const vis = () => {
      if (document.visibilityState === "visible") {
        resumeAudio();
        useGame.getState().tick();
      } else {
        void useGame.getState().persist();
      }
    };
    const hide = () => {
      void useGame.getState().persist();
    };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", hide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", hide);
    };
  }, [boot]);

  return (
    <>
      {phase === "play" ? <PlayView /> : phase === "class" ? <ClassScreen /> : <AuthScreen />}
      <Dialogs />
      {flash && <div className="flash" aria-hidden />}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="panel px-4 py-2 text-sm">{t.text}</div>
        ))}
      </div>
    </>
  );
}
