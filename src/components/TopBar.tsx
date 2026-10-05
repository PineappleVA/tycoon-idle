import { formatMoney, formatNumber } from '../game/format';
import { availableInvestors, investorBonusPct, type GameState, rebirthMultiplier } from '../game/logic';
import { AnimatedNumber } from './AnimatedNumber';

export function TopBar({
  state,
  income,
  onOpenRebirth,
}: {
  state: GameState;
  income: number;
  onOpenRebirth: () => void;
}) {
  // Misma función que usa el motor: el bonus mostrado nunca diverge del aplicado.
  const mult = rebirthMultiplier(state);
  const investors = availableInvestors(state);
  const prestigeVisible = state.rebirths > 0 || investors > 0 || state.crystals > 0 || state.stars > 0;

  return (
    <header className="animate-rise flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="animate-coin text-4xl drop-shadow-[0_4px_10px_rgba(250,204,21,0.4)]" aria-hidden>
          💰
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Tycoon Idle
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Crea tu imperio</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {prestigeVisible && (
          <button
            onClick={onOpenRebirth}
            className="animate-pop flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-left transition hover:border-amber-300/60 hover:bg-amber-400/20 active:scale-[0.98]"
            title="Ver detalle de Renacimiento"
          >
            <span className="text-lg" aria-hidden>
              🏅
            </span>
            <div className="leading-none">
              <div className="flex items-center gap-2 text-sm font-bold tabular-nums text-amber-200">
                {investors > 0 && <span>{formatNumber(investors)}👽</span>}
                {state.crystals > 0 && <span>{formatNumber(state.crystals)}💠</span>}
                {state.stars > 0 && <span>{formatNumber(state.stars)}⭐</span>}
                {state.souls > 0 && <span>{formatNumber(state.souls)}🔥</span>}
              </div>
              <div className="mt-1 text-[10px] text-amber-300/80">
                x{mult.toFixed(2)} bonus · {state.rebirths} renacer{state.rebirths !== 1 ? 'es' : ''}
                {investors > 0 && ` · +${investorBonusPct(state).toFixed(0)}% 👽`}
              </div>
            </div>
          </button>
        )}

        <div className="text-right" data-tour="cash">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Efectivo</p>
          <AnimatedNumber
            value={state.cash}
            format={formatMoney}
            duration={320}
            className="block text-2xl font-bold text-white sm:text-3xl"
          />
        </div>

        <div className="hidden text-right sm:block" data-tour="income">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Por segundo</p>
          <span className="block text-lg font-semibold tabular-nums text-emerald-400">
            +{formatMoney(income)}
          </span>
        </div>
      </div>
    </header>
  );
}
