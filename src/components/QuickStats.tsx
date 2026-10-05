import { BUSINESSES } from '../game/data';
import { formatMoney, formatNumber } from '../game/format';
import { businessCount, type GameState } from '../game/logic';
import { AnimatedNumber } from './AnimatedNumber';

export function QuickStats({ state, income }: { state: GameState; income: number }) {
  const owned = BUSINESSES.reduce((s, b) => s + businessCount(state, b.id), 0);
  const items = [
    { label: 'Ganado total', value: <AnimatedNumber value={state.totalEarned} format={formatMoney} duration={500} />, icon: '💵' },
    { label: 'Negocios', value: formatNumber(owned), icon: '🏬' },
    { label: 'Toques', value: formatNumber(state.taps), icon: '👆' },
    { label: 'Ingreso/s', value: formatMoney(income), icon: '📈' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div
          key={it.label}
          className="animate-rise rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="text-lg" aria-hidden>
            {it.icon}
          </div>
          <div className="mt-1 text-sm font-bold tabular-nums text-white">{it.value}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
