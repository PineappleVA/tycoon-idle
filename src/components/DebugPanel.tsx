import { GameApi } from '../game/useGame';
import { formatMoney } from '../game/format';

export function DebugPanel({ game, onClose }: { game: GameApi; onClose: () => void }) {
  const { state } = game;

  const addCash = (amount: number) => {
    // Mutamos el estado a través del hook de juego
    game.debugAddCash(amount);
  };

  const addIngot = () => {
    game.debugAddIngot();
  };

  const addCrystal = () => {
    game.debugAddCrystal();
  };

  const addStar = () => {
    game.debugAddStar();
  };

  const addInvestor = () => {
    game.debugAddInvestor();
  };

  const resetGame = () => {
    if (confirm('¿Seguro que quieres resetear el juego?')) {
      game.reset();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 rounded-xl border border-red-500/30 bg-slate-900/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-red-400">🐛 Modo Debug</h3>
        <button
          onClick={onClose}
          className="text-slate-400 transition hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="rounded-lg bg-slate-800/50 p-2">
          <div className="text-xs text-slate-400">Efectivo actual</div>
          <div className="text-lg font-bold tabular-nums text-emerald-400">
            {formatMoney(state.cash)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addCash(1000)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            +$1K
          </button>
          <button
            onClick={() => addCash(1_000_000)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            +$1M
          </button>
          <button
            onClick={() => addCash(1_000_000_000)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            +$1B
          </button>
          <button
            onClick={() => addCash(1_000_000_000_000)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            +$1T
          </button>
        </div>

        <div className="rounded-lg bg-slate-800/50 p-2">
          <div className="text-xs text-slate-400">Prestigio</div>
          <div className="mt-1 flex gap-2">
            <button
              onClick={addIngot}
              className="flex-1 rounded-lg bg-amber-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
            >
              +🏅
            </button>
            <button
              onClick={addCrystal}
              className="flex-1 rounded-lg bg-fuchsia-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-fuchsia-500"
            >
              +💠
            </button>
            <button
              onClick={addStar}
              className="flex-1 rounded-lg bg-sky-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
            >
              +⭐
            </button>
            <button
              onClick={addInvestor}
              className="flex-1 rounded-lg bg-lime-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-500"
            >
              +👽
            </button>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
        >
          🔄 Resetear juego
        </button>
      </div>
    </div>
  );
}
