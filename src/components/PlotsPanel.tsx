import { cn } from '../lib/cn';
import { BUSINESSES } from '../game/data';
import { PLOT_BONUS_PER_EMPLOYEE } from '../game/balance';
import { businessCount, employeesAssignedTo, totalPlots } from '../game/logic';
import type { GameApi } from '../game/useGame';

export function PlotsPanel({ game }: { game: GameApi }) {
  const { state } = game;
  const slots = totalPlots(state);
  const ownedBusinesses = BUSINESSES.filter((b) => businessCount(state, b.id) > 0);

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400">
        Asigna un <span className="font-bold text-emerald-300">Empleado</span> a cada Parcela. Cada empleado da{' '}
        <span className="font-bold text-emerald-300">+{PLOT_BONUS_PER_EMPLOYEE * 100}%</span> de ingresos al negocio
        que elijas. Se pierden si caes al Infierno.
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: slots }).map((_, idx) => {
          const assignedId = state.plotAssignments[idx];
          const assignedDef = BUSINESSES.find((b) => b.id === assignedId);
          return (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3 backdrop-blur transition-all duration-300',
                assignedDef
                  ? 'animate-pop border-emerald-400/30 bg-emerald-500/[0.07]'
                  : 'border-white/10 bg-white/[0.04]',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner transition-transform duration-300',
                  assignedDef ? cn('scale-105 bg-gradient-to-br', assignedDef.gradient) : 'bg-white/5',
                )}
                aria-hidden
              >
                {assignedDef ? assignedDef.icon : '🏞️'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Parcela #{idx + 1}</div>
                  {assignedDef && (
                    <div className="text-[10px] font-bold text-emerald-300">
                      +{employeesAssignedTo(state, assignedDef.id) * PLOT_BONUS_PER_EMPLOYEE * 100}%
                    </div>
                  )}
                </div>
                <select
                  value={assignedId ?? ''}
                  onChange={(e) => game.assignPlot(idx, e.target.value === '' ? null : e.target.value)}
                  aria-label={`Empleado de la parcela ${idx + 1}`}
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs font-semibold text-white outline-none transition focus:border-emerald-400/50"
                >
                  <option value="">— Sin empleado —</option>
                  {ownedBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      👷 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {ownedBusinesses.length === 0 && (
        <p className="text-[11px] italic text-slate-500">Compra negocios primero para poder asignarles empleados.</p>
      )}
    </div>
  );
}
