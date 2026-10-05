import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import type { BusinessDef } from '../game/data';
import { formatMoney, formatNumber } from '../game/format';
import {
  automationUnlocked,
  businessCount,
  businessIncome,
  businessUpgrade,
  bulkCost,
  employeesAssignedTo,
  isAutomated,
  managerCost,
  maxAffordable,
  type GameState,
  upgradeCostOf,
} from '../game/logic';
import { ProgressBar } from './ui';
import type { GameApi } from '../game/useGame';

export function BusinessCard({
  game,
  def,
  onSelect,
}: {
  game: GameApi;
  def: BusinessDef;
  onSelect: (id: string) => void;
}) {
  const { state } = game;
  const unlocked = state.totalEarned >= def.unlockAt;

  if (!unlocked) return <LockedBusinessCard state={state} def={def} />;
  return <OwnedBusinessCard game={game} def={def} onSelect={onSelect} />;
}

function LockedBusinessCard({ state, def }: { state: GameState; def: BusinessDef }) {
  const progress = Math.min(1, state.totalEarned / def.unlockAt);
  return (
    <div className="flex animate-pop flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
      <div className="text-4xl opacity-30 grayscale" aria-hidden>
        {def.icon}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-400">🔒 {def.name}</div>
      <ProgressBar value={progress} gradient="from-slate-500 to-slate-300" className="mt-2 w-full" height="h-1.5" />
      <div className="mt-1 text-[11px] tabular-nums text-slate-500">
        {formatMoney(state.totalEarned)} / {formatMoney(def.unlockAt)}
      </div>
    </div>
  );
}

function OwnedBusinessCard({
  game,
  def,
  onSelect,
}: {
  game: GameApi;
  def: BusinessDef;
  onSelect: (id: string) => void;
}) {
  const { state } = game;
  const id = def.id;
  const count = businessCount(state, id);
  const level = businessUpgrade(state, id);
  const myIncome = count > 0 ? businessIncome(def, state) : 0;
  const autoUnlocked = automationUnlocked(state);
  const automated = isAutomated(state, id);
  const canAffordManager = state.cash >= managerCost();
  const employees = employeesAssignedTo(state, id);

  const amount: number =
    game.buyAmount === 'max' ? Math.max(1, maxAffordable(def, count, state.cash)) : game.buyAmount;
  const price = bulkCost(def, count, amount);
  const canBuy =
    game.buyAmount === 'max' ? maxAffordable(def, count, state.cash) > 0 : state.cash >= price;

  const upgPrice = upgradeCostOf(def, level);
  const canUpgrade = count > 0 && state.cash >= upgPrice;

  // Parpadeo verde al aumentar el número de unidades.
  const [flash, setFlash] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 420);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left backdrop-blur transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60',
        flash
          ? 'animate-purchase-flash border-emerald-400/60 bg-emerald-500/10'
          : 'border-white/10 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40',
          def.gradient,
        )}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-lg transition-transform duration-200 group-hover:scale-110',
            def.gradient,
          )}
          aria-hidden
        >
          {def.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-bold">{def.name}</span>
            {automated && <Badge tone="emerald">AUTO</Badge>}
            {level > 0 && <Badge tone="amber">x{Math.pow(2, level)}</Badge>}
            {employees > 0 && <Badge tone="sky">🏞️×{employees}</Badge>}
          </div>
          <div className="text-xs tabular-nums text-slate-400">
            {formatNumber(count)} uds · {formatMoney(myIncome)}/s
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2">
        <ActionButton
          disabled={!canBuy}
          tone="emerald"
          label={`Comprar x${amount}`}
          price={price}
          onClick={() => game.buy(id)}
        />
        <ActionButton
          disabled={!canUpgrade}
          tone="amber"
          label="Mejorar x2"
          price={upgPrice}
          onClick={() => game.upgrade(id)}
        />
      </div>

      {autoUnlocked && (
        <button
          data-automation
          onClick={(e) => {
            e.stopPropagation();
            game.toggleAutomation(id);
          }}
          disabled={!automated && !canAffordManager}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition',
            automated
              ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
              : canAffordManager
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-500',
          )}
        >
          <span aria-hidden>{automated ? '🤖' : '👤'}</span>
          <span>
            {automated ? 'Mánager activo (auto-compra)' : `Contratar mánager — ${formatMoney(managerCost())}`}
          </span>
        </button>
      )}
    </button>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'amber' | 'emerald' | 'sky' }) {
  const tones = {
    amber: 'bg-amber-400/20 text-amber-300',
    emerald: 'bg-emerald-400/20 text-emerald-300',
    sky: 'bg-sky-400/20 text-sky-300',
  } as const;
  return <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold', tones[tone])}>{children}</span>;
}

function ActionButton({
  label,
  price,
  disabled,
  tone,
  onClick,
}: {
  label: string;
  price: number;
  disabled: boolean;
  tone: 'emerald' | 'amber';
  onClick: () => void;
}) {
  const tones = {
    emerald: 'bg-emerald-500 hover:bg-emerald-400',
    amber: 'bg-amber-500 hover:bg-amber-400',
  } as const;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center rounded-xl px-3 py-2 text-white transition active:scale-95',
        'disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 disabled:active:scale-100',
        tones[tone],
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-sm font-bold tabular-nums">{formatMoney(price)}</span>
    </button>
  );
}
