import { useMemo, useState } from 'react';
import { BusinessDef } from '../game/data';
import {
  availableInvestors,
  businessCount,
  businessIncome,
  businessUpgrade,
  bulkUpgradeCost,
  costOf,
  employeesAssignedTo,
  hasFunction,
  INVESTOR_BONUS_PER,
  isAutomated,
  managerCost,
  REBIRTH_TIERS,
  upgradeCostOf,
} from '../game/logic';
import { formatMoney, formatNumber } from '../game/format';
import { GameApi } from '../game/useGame';

export function BusinessDetail({
  game,
  def,
  onClose,
}: {
  game: GameApi;
  def: BusinessDef;
  onClose: () => void;
}) {
  const { state } = game;
  const count = businessCount(state, def.id);
  const level = businessUpgrade(state, def.id);
  const automated = isAutomated(state, def.id);
  const unlocked = state.totalEarned >= def.unlockAt;

  const incomePerSec = businessIncome(def, state);
  const incomePerMin = incomePerSec * 60;
  const incomePerHour = incomePerSec * 3600;

  const nextBuyPrice = costOf(def, count);
  const canBuy = state.cash >= nextBuyPrice;
  const nextUpPrice = upgradeCostOf(def, level);
  const canUpgrade = count > 0 && state.cash >= nextUpPrice;
  const canAffordManager = state.cash >= managerCost();

  // Se elige una vez al montar: antes se leía Date.now() en cada render y la
  // frase rotaba sola mientras el juego hacía tick.
  const flavor = useMemo(() => def.flavor.length ? def.flavor : ['Construye tu imperio.'], [def]);
  const flavorIdx = useState(() => Math.floor(Math.random() * flavor.length))[0];

  return (
    <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="animate-pop relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
        {/* Header */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${def.gradient} p-8`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
          
          {/* Botón X Mejorado */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 active:scale-90 border border-white/10"
            aria-label="Cerrar"
          >
            <span className="text-xl font-bold">✕</span>
          </button>

          <div className="relative flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black/30 text-5xl shadow-inner">
              {def.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-white drop-shadow">{def.name}</h2>
              <p className="mt-1 italic text-white/80">"{flavor[flavorIdx]}"</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-md bg-black/30 px-2 py-0.5 text-xs font-bold text-white">
                  {count} unidades
                </span>
                {level > 0 && (
                  <span className="rounded-md bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-slate-900">
                    ×{Math.pow(2, level)}
                  </span>
                )}
                {automated && (
                  <span className="rounded-md bg-emerald-400/90 px-2 py-0.5 text-xs font-bold text-slate-900">
                    🤖 AUTO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          {/* Estadísticas */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              📊 Estadísticas
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Por segundo" value={formatMoney(incomePerSec)} color="emerald" />
              <StatBox label="Por minuto" value={formatMoney(incomePerMin)} color="sky" />
              <StatBox label="Por hora" value={formatMoney(incomePerHour)} color="violet" />
            </div>
          </section>

          {/* Trabajadores y Manager */}
          {unlocked && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                👥 Trabajadores & Mánager
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👷</span>
                    <div>
                      <div className="text-sm font-semibold">Trabajadores</div>
                      <div className="text-xs text-slate-400">{count} empleados activos</div>
                    </div>
                  </div>
                  <button
                    onClick={() => game.buy(def.id)}
                    disabled={!canBuy}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                  >
                    Contratar · {formatMoney(nextBuyPrice)}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="text-sm font-semibold">
                        Mánager {automated ? '(Activo)' : ''}
                      </div>
                      <div className="text-xs text-slate-400">
                        {automated
                          ? 'Auto-compra 1 empleado/s'
                          : 'Automatiza este negocio'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => game.toggleAutomation(def.id)}
                    disabled={!automated && !canAffordManager}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                      automated
                        ? 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500'
                    }`}
                  >
                    {automated ? 'Desactivar' : `Contratar · ${formatMoney(managerCost())}`}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Mejoras */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              ⚡ Mejoras (duplican ingreso)
            </h3>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Nivel actual</div>
                  <div className="text-xs text-slate-400">
                    Nivel {level} · Multiplicador ×{Math.pow(2, level)}
                  </div>
                </div>
                <button
                  onClick={() => game.upgrade(def.id)}
                  disabled={!canUpgrade}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                >
                  +1 Nivel · {formatMoney(nextUpPrice)}
                </button>
              </div>

              {/* Barra visual */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(20, Math.max(3, level + 3)) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3 flex-1 rounded-sm ${
                      idx < level ? 'bg-amber-400' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Mejora múltiple: requiere la función "Mejora en Cadena" de la tienda.
                  El precio es la SUMA de las n mejoras, no el de la última. */}
              {hasFunction(state, 'bulkupgrade') && count > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[1, 5, 10].map((n) => {
                    const price = bulkUpgradeCost(def, level, n);
                    const can = state.cash >= price;
                    return (
                      <button
                        key={n}
                        onClick={() => game.upgrade(def.id, n)}
                        disabled={!can}
                        className="rounded-lg bg-amber-500/90 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                      >
                        +{n} · {formatMoney(price)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Empleados en parcelas */}
          {hasFunction(state, 'unlock_plots') || hasFunction(state, 'blood_pact') ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                🏞️ Empleados en Parcelas
              </h3>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-300">
                {employeesAssignedTo(state, def.id) > 0 ? (
                  <span>
                    <span className="font-bold text-emerald-300">{employeesAssignedTo(state, def.id)}</span> empleado(s) asignados aquí:{' '}
                    <span className="font-bold text-emerald-300">+{employeesAssignedTo(state, def.id) * 100}%</span> ingresos extra.
                  </span>
                ) : (
                  <span className="text-slate-500">Sin empleados asignados. Ve a la pestaña Renacer → Parcelas.</span>
                )}
              </div>
            </section>
          ) : null}

          {/* Bonus activos */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              ✨ Bonus de Renacimiento activos
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.crystals > 0 && (
                <Chip icon="💠" label={`${formatNumber(state.crystals)} Cristales (+${Math.round(state.crystals * REBIRTH_TIERS[1].bonusPer * 100)}%)`} />
              )}
              {state.stars > 0 && (
                <Chip icon="⭐" label={`${formatNumber(state.stars)} Estrellas (+${Math.round(state.stars * REBIRTH_TIERS[2].bonusPer * 100)}%)`} />
              )}
              {availableInvestors(state) > 0 && (
                <Chip icon="👽" label={`${availableInvestors(state)} Inversores (+${(availableInvestors(state) * INVESTOR_BONUS_PER * 100).toFixed(1)}%)`} />
              )}
              {state.crystals === 0 && state.stars === 0 && availableInvestors(state) === 0 && (
                <div className="text-xs italic text-slate-500">Sin bonus activos aún.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-300 border-emerald-400/20',
    sky: 'text-sky-300 border-sky-400/20',
    violet: 'text-violet-300 border-violet-400/20',
  };
  return (
    <div className={`rounded-xl border bg-white/[0.04] p-3 text-center ${colorMap[color]}`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
