import { cn } from '../lib/cn';
import { BUSINESSES } from '../game/data';
import { formatMoney, formatNumber } from '../game/format';
import { UPGRADE_INCOME_MULT } from '../game/balance';
import {
  businessCount,
  businessUpgrade,
  bulkUpgradeCost,
  hasFunction,
  maxAffordableUpgrades,
  tapUpgradeCost,
  tapValue,
} from '../game/logic';
import type { GameApi } from '../game/useGame';
import { ActionButton, Panel } from './ui';

/** Cantidades de mejora en lote. Sólo visibles con la función "Mejora en Cadena". */
const BULK_AMOUNTS = [5, 10] as const;

export function UpgradesTab({ game }: { game: GameApi }) {
  const { state } = game;
  const tapPrice = tapUpgradeCost(state.tapLevel);
  const owned = BUSINESSES.filter((b) => businessCount(state, b.id) > 0);
  const bulkUnlocked = hasFunction(state, 'bulkupgrade');

  return (
    <div className="space-y-3">
      {/* Mano de obra */}
      <div className="relative animate-rise overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-950/50 to-slate-950 p-5">
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="animate-coin flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-3xl shadow-lg" aria-hidden>
            👆
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">Mano de Obra</span>
              <span className="rounded-md bg-purple-400/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-200">
                Nv. {state.tapLevel}
              </span>
            </div>
            <div className="text-xs tabular-nums text-slate-400">{formatMoney(tapValue(state))}/toque</div>
          </div>
        </div>

        <ActionButton
          onClick={game.upgradeTap}
          disabled={state.cash < tapPrice}
          tone="fuchsia"
          size="md"
          className="mt-4 w-full"
        >
          Mejorar — {formatMoney(tapPrice)}
        </ActionButton>
      </div>

      {/* Mejoras de negocio */}
      <Panel className="animate-rise" >
        <h3 className="mb-1 text-sm font-bold">Mejoras de Negocios</h3>
        <p className="text-xs text-slate-400">
          Cada mejora multiplica el ingreso por{' '}
          <span className="font-semibold text-amber-300">×{UPGRADE_INCOME_MULT}</span>.
        </p>

        {owned.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-500">
            Compra negocios en la pestaña Negocios.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {owned.map((def) => {
              const level = businessUpgrade(state, def.id);
              const count = businessCount(state, def.id);
              const price = bulkUpgradeCost(def, level, 1);
              const can = count > 0 && state.cash >= price;
              return (
                <div
                  key={def.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:border-white/20"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow')} aria-hidden>
                    <span className={cn('bg-gradient-to-br bg-clip-text')}>{def.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{def.name}</span>
                      <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        x{formatNumber(Math.pow(UPGRADE_INCOME_MULT, level))}
                      </span>
                    </div>
                    <div className="text-[11px] tabular-nums text-slate-400">
                      +{formatMoney(def.baseIncome * Math.pow(UPGRADE_INCOME_MULT, level))}/s por unidad ·{' '}
                      {formatNumber(count)} uds
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => game.upgrade(def.id, 1)}
                      disabled={!can}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                    >
                      +1 · {formatMoney(price)}
                    </button>

                    {/* Mejora en Cadena: requiere la función de la tienda. */}
                    {bulkUnlocked &&
                      BULK_AMOUNTS.map((n) => {
                        const bulkPrice = bulkUpgradeCost(def, level, n);
                        const affordable = maxAffordableUpgrades(def, level, state.cash);
                        const enabled = count > 0 && affordable >= n;
                        return (
                          <button
                            key={n}
                            onClick={() => game.upgrade(def.id, n)}
                            disabled={!enabled}
                            title={
                              enabled
                                ? `Compra ${n} mejoras por ${formatMoney(bulkPrice)}`
                                : `Necesitas ${formatMoney(bulkPrice)} (te faltan ${formatMoney(Math.max(0, bulkPrice - state.cash))})`
                            }
                            className="rounded-lg bg-amber-500/70 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                          >
                            +{n}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!bulkUnlocked && (
          <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-slate-500">
            ⛓️ Compra <span className="font-semibold text-amber-300">Mejora en Cadena</span> en la Tienda de
            Prestigio para desbloquear los botones +5 y +10.
          </p>
        )}
      </Panel>
    </div>
  );
}
