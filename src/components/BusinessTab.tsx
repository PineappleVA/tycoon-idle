import { cn } from '../lib/cn';
import { BUSINESSES } from '../game/data';
import { formatMoney } from '../game/format';
import { availableInvestors, hasFunction, investorBonusPct } from '../game/logic';
import type { BuyAmount, GameApi } from '../game/useGame';
import { BusinessCard } from './BusinessCard';

const BASE_BUY_OPTIONS: BuyAmount[] = [1, 10, 100, 'max'];
const EXTENDED_BUY_OPTIONS: BuyAmount[] = [1, 10, 100, 1000, 'max'];

export function BusinessTab({
  game,
  onBusinessSelect,
}: {
  game: GameApi;
  onBusinessSelect: (id: string) => void;
}) {
  const { state, income } = game;
  const nextUnlock = BUSINESSES.find((b) => state.totalEarned < b.unlockAt);
  const buyOptions = hasFunction(state, 'buyx1000') ? EXTENDED_BUY_OPTIONS : BASE_BUY_OPTIONS;

  // Muestra los desbloqueados más el siguiente bloqueado (para enseñar el objetivo).
  const visible = BUSINESSES.filter((def) => {
    if (state.totalEarned >= def.unlockAt) return true;
    return BUSINESSES.filter((b) => b.unlockAt < def.unlockAt).every((b) => state.totalEarned >= b.unlockAt);
  });

  const investors = availableInvestors(state);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
        <span className="text-sm text-slate-300">
          Ingreso total: <span className="font-bold tabular-nums text-emerald-400">{formatMoney(income)}/s</span>
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1">
          <span className="px-2 text-xs text-slate-400">Comprar</span>
          {buyOptions.map((opt) => (
            <button
              key={String(opt)}
              onClick={() => game.setBuyAmount(opt)}
              aria-pressed={game.buyAmount === opt}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-bold transition-all duration-150',
                game.buyAmount === opt
                  ? 'scale-105 bg-amber-400 text-slate-900 shadow'
                  : 'text-slate-300 hover:bg-white/10',
              )}
            >
              {opt === 'max' ? 'MÁX' : `x${opt}`}
            </button>
          ))}
        </div>
      </div>

      {investors > 0 && (
        <div className="animate-pop flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 backdrop-blur">
          <span className="text-lg" aria-hidden>
            👽
          </span>
          <span className="text-sm font-semibold text-emerald-200">Inversores</span>
          <span className="text-xs text-emerald-300/80">
            {investors} activos · +{investorBonusPct(state).toFixed(0)}% velocidad
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-tour="business">
        {visible.map((def, i) => (
          <div key={def.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
            <BusinessCard game={game} def={def} onSelect={onBusinessSelect} />
          </div>
        ))}
      </div>

      {nextUnlock && (
        <div className="animate-rise rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 backdrop-blur">
          🔒 Próximo: <span className="font-semibold">{nextUnlock.name}</span> al ganar{' '}
          {formatMoney(nextUnlock.unlockAt)} en total.
        </div>
      )}
    </div>
  );
}
