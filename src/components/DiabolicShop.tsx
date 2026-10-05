import { useMemo } from 'react';
import { DIABOLIC_ITEMS, SOULS_DROP_LABEL } from '../game/data';
import { formatNumber } from '../game/format';
import type { GameApi } from '../game/useGame';
import { ShopItemRow } from './PrestigeShop';

export function DiabolicShop({ game }: { game: GameApi }) {
  const { state } = game;

  // Las brasas se calculan una sola vez: con Math.random() en el render se
  // re-sorteaban en cada frame y parpadeaban.
  const embers = useMemo(
    () =>
      Array.from({ length: 8 }, (_, idx) => ({
        left: idx * 12.5 + Math.random() * 6,
        size: 3 + (idx % 3),
        duration: 2 + (idx % 4),
        delay: (idx % 5) * 0.4,
      })),
    [],
  );

  return (
    <div className="space-y-3">
      <div className="relative animate-rise overflow-hidden rounded-2xl border border-red-500/30 bg-red-950/40 p-4">
        {embers.map((e, idx) => (
          <span
            key={idx}
            className="absolute bottom-0 rounded-full bg-orange-500"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              boxShadow: '0 0 6px #f97316',
              animation: `emberRise ${e.duration}s ease-out ${e.delay}s infinite`,
            }}
            aria-hidden
          />
        ))}

        <div className="relative flex items-center justify-between">
          <span className="text-sm font-bold text-red-300">🔥 Pacto Diabólico</span>
          <span className="text-xs font-bold tabular-nums text-orange-300">{formatNumber(state.souls)} 🔥 Almas</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-red-200/80">
          Caída al Infierno = <span className="font-bold">{SOULS_DROP_LABEL}</span>. Has caído {state.hellFalls}{' '}
          {state.hellFalls === 1 ? 'vez' : 'veces'}. Cada mejora es <span className="font-bold">permanente</span> y se
          acumula con las demás.
        </p>

        {/* Contadores derivados de la lista real de artículos. */}
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          {DIABOLIC_ITEMS.map((item) => {
            const owned = (state.shopUpgrades[item.id] ?? 0) > 0;
            return (
              <span
                key={item.id}
                className={
                  owned
                    ? 'rounded bg-red-700/50 px-2 py-0.5 font-bold text-red-100'
                    : 'rounded bg-red-900/40 px-2 py-0.5 text-red-200'
                }
              >
                {item.icon} {owned ? '✓' : '—'}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {DIABOLIC_ITEMS.map((item, i) => (
          <div key={item.id} className="animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
            <ShopItemRow game={game} item={item} diabolic />
          </div>
        ))}
      </div>
    </div>
  );
}
