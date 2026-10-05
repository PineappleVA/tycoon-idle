import { useState } from 'react';
import { cn } from '../lib/cn';
import { formatMoney, formatNumber } from '../game/format';
import { totalIncome } from '../game/logic';
import type { GameApi } from '../game/useGame';

const CASH_STEPS = [
  { label: '+$1K', amount: 1_000 },
  { label: '+$1M', amount: 1_000_000 },
  { label: '+$1B', amount: 1_000_000_000 },
  { label: '+$1T', amount: 1_000_000_000_000 },
] as const;

const CURRENCIES = [
  { key: 'crystals', icon: '💠', label: 'Cristales' },
  { key: 'stars', icon: '⭐', label: 'Estrellas' },
  { key: 'souls', icon: '🔥', label: 'Almas' },
  { key: 'investors', icon: '👽', label: 'Inversores' },
] as const;

export function DebugPanel({ game, onClose }: { game: GameApi; onClose: () => void }) {
  const { state } = game;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [targetIncome, setTargetIncome] = useState('1000');

  return (
    <div className="animate-pop fixed bottom-4 right-4 z-[100] w-80 rounded-xl border border-red-500/30 bg-slate-900/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-red-400">🐛 Modo Debug</h3>
        <button onClick={onClose} aria-label="Cerrar panel de debug" className="text-slate-400 transition hover:text-slate-200">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-800/50 p-2">
            <div className="text-slate-400">Efectivo</div>
            <div className="font-bold tabular-nums text-emerald-400">{formatMoney(state.cash)}</div>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <div className="text-slate-400">Ingreso/s</div>
            <div className="font-bold tabular-nums text-sky-400">{formatMoney(totalIncome(state))}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CASH_STEPS.map((step) => (
            <button
              key={step.label}
              onClick={() => game.debugAddCash(step.amount)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 active:scale-95"
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Salto directo a un ingreso objetivo: útil para probar balance. */}
        <div className="rounded-lg bg-slate-800/50 p-2">
          <label className="text-xs text-slate-400" htmlFor="debug-income">
            Fijar ingreso objetivo ($/s)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="debug-income"
              value={targetIncome}
              onChange={(e) => setTargetIncome(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs tabular-nums outline-none focus:border-red-400/50"
            />
            <button
              onClick={() => game.debugSetIncome(Number(targetIncome) || 0)}
              className="shrink-0 rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-sky-500 active:scale-95"
            >
              Aplicar
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-800/50 p-2">
          <div className="text-xs text-slate-400">Prestigio</div>
          <div className="mt-1 flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.key}
                onClick={() => game.debugAddCurrency(c.key)}
                title={`+1 ${c.label}`}
                className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold transition hover:bg-white/20 active:scale-95"
              >
                +{c.icon}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-2 text-[10px] text-slate-500">
            <span>💠{formatNumber(state.crystals)}</span>
            <span>⭐{formatNumber(state.stars)}</span>
            <span>🔥{formatNumber(state.souls)}</span>
            <span>👽{formatNumber(state.investors)}</span>
            <span>caídas {state.hellFalls}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <span>tier1 {state.tier1} · tier2 {state.tier2} · tier3 {state.tier3}</span>
          <span>acreditados {formatNumber(state.investorsClaimed)}</span>
        </div>

        {confirmingReset ? (
          <div className="animate-pop rounded-lg border border-red-400/40 bg-red-500/10 p-2 text-center">
            <p className="text-xs text-red-200">Se borrará la partida guardada.</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  game.reset();
                  setConfirmingReset(false);
                }}
                className="flex-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
              >
                Sí, resetear
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold transition hover:bg-white/20"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 active:scale-95"
          >
            🔄 Resetear juego
          </button>
        )}
      </div>

      <p className={cn('mt-3 text-center text-[10px] text-slate-600')}>Ctrl+Shift+D para ocultar</p>
    </div>
  );
}
