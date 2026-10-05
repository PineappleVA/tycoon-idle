import { Achievement } from '../game/achievements';

export function Toasts({ toasts }: { toasts: Achievement[] }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.map((a) => (
        <div
          key={a.id}
          className="animate-toast flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-500/95 to-yellow-600/95 p-3 shadow-2xl shadow-amber-900/40 backdrop-blur"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 text-2xl">
            {a.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-950/80">
              ¡Logro desbloqueado!
            </div>
            <div className="truncate text-sm font-bold text-white">{a.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
