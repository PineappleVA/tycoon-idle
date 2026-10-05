import { cn } from '../lib/cn';
import { SHOP_ITEMS, type ShopItem } from '../game/data';
import { currencyBalance } from '../game/logic';
import type { GameApi } from '../game/useGame';

export function ShopItemRow({
  game,
  item,
  diabolic,
}: {
  game: GameApi;
  item: ShopItem;
  diabolic?: boolean;
}) {
  const { state } = game;
  const owned = (state.shopUpgrades[item.id] ?? 0) > 0;
  const balance = currencyBalance(state, item.currency);
  const canAfford = balance >= item.cost;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3 backdrop-blur transition-all duration-200',
        owned
          ? diabolic
            ? 'border-red-400/40 bg-red-900/20'
            : 'border-emerald-400/30 bg-emerald-500/10'
          : diabolic
            ? 'border-red-500/20 bg-red-950/20 hover:border-red-400/40'
            : 'border-white/10 bg-white/[0.04] hover:border-white/20',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner',
          !owned && 'animate-coin',
          diabolic ? 'bg-red-500/10' : 'bg-white/5',
        )}
        aria-hidden
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-white">{item.name}</span>
          {owned && (
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                diabolic ? 'bg-red-400/20 text-red-300' : 'bg-emerald-400/20 text-emerald-300',
              )}
            >
              ✅ Desbloqueado
            </span>
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-400">{item.desc}</div>
      </div>
      {owned ? (
        <span className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-500">Activa</span>
      ) : (
        <button
          onClick={() => game.buyShopItem(item.id)}
          disabled={!canAfford}
          title={canAfford ? `Comprar por ${item.cost} ${item.currencyIcon}` : `Te faltan ${item.cost - balance} ${item.currencyIcon}`}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95',
            'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 disabled:active:scale-100',
            diabolic ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-amber-500 text-slate-900 hover:bg-amber-400',
          )}
        >
          <span className="tabular-nums">
            {item.cost} {item.currencyIcon}
          </span>
        </button>
      )}
    </div>
  );
}

export function PrestigeShop({ game }: { game: GameApi }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
        ✨ Compra <span className="font-semibold text-amber-300">funciones permanentes</span> que se conservan entre
        renacimientos. No dan bonus numérico: abren mecánicas nuevas.
      </div>
      <div className="space-y-2">
        {SHOP_ITEMS.map((item, i) => (
          <div key={item.id} className="animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
            <ShopItemRow game={game} item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
