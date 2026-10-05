import { Achievement } from '../game/achievements';

export function Toasts({ toasts }: { toasts: Achievement[] }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.map((a) =>
        a.hidden ? (
          /*
           * Los logros secretos no se muestran NUNCA, ni siquiera al
           * desbloquearse: se celebra el hallazgo sin revelar qué era.
           * El recuento aparece en la pestaña Logros.
           */
          <div
            key={a.id}
            className="animate-toast flex items-center gap-3 rounded-2xl border border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-700/95 to-purple-900/95 p-3 shadow-2xl shadow-purple-950/40 backdrop-blur"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/30 text-2xl"
              aria-hidden
            >
              🔒
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-200/90">
                ¡Logro secreto!
              </div>
              <div className="truncate text-sm font-bold text-white">Has descubierto uno oculto…</div>
            </div>
          </div>
        ) : (
          <div
            key={a.id}
            className="animate-toast flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-500/95 to-yellow-600/95 p-3 shadow-2xl shadow-amber-900/40 backdrop-blur"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 text-2xl"
              aria-hidden
            >
              {a.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-950/80">
                ¡Logro desbloqueado!
              </div>
              <div className="truncate text-sm font-bold text-white">{a.name}</div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
