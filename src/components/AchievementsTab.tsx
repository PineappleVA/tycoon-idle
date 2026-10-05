import { useState } from 'react';
import { cn } from '../lib/cn';
import { ACHIEVEMENTS, type Achievement } from '../game/achievements';
import type { GameState } from '../game/logic';
import { Panel, ProgressBar } from './ui';

type Filter = 'all' | 'done' | 'pending' | 'secret';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'done', label: 'Conseguidos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'secret', label: 'Secretos' },
];

export function AchievementsTab({ state }: { state: GameState }) {
  const [filter, setFilter] = useState<Filter>('all');

  const doneCount = ACHIEVEMENTS.filter((a) => a.done(state)).length;
  const hiddenPending = ACHIEVEMENTS.filter((a) => a.hidden && !a.done(state)).length;

  const visible = ACHIEVEMENTS.filter((a) => {
    const complete = a.done(state);
    if (a.hidden && !complete) return filter === 'secret';
    if (filter === 'done') return complete;
    if (filter === 'pending') return !complete;
    if (filter === 'secret') return a.hidden;
    return true;
  });

  return (
    <div className="space-y-3">
      <Panel className="animate-rise">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">Progreso de logros</span>
          <span className="tabular-nums text-amber-300">
            {doneCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <ProgressBar value={doneCount / ACHIEVEMENTS.length} className="mt-2" />
        {hiddenPending > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span aria-hidden>🔒</span> {hiddenPending} logro(s) secreto(s) por descubrir…
          </div>
        )}

        <div className="mt-3 flex gap-1 rounded-xl bg-black/25 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-150',
                filter === f.id ? 'bg-amber-400 text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((a, i) => (
          <div key={a.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
            <AchievementCard achievement={a} state={state} />
          </div>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs text-slate-500">
            No hay logros en esta categoría.
          </p>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement: a, state }: { achievement: Achievement; state: GameState }) {
  const complete = a.done(state);
  const progress = a.progress(state);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3 backdrop-blur transition-all duration-300',
        complete
          ? 'border-amber-300/40 bg-amber-500/10 shadow-lg shadow-amber-900/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300',
          complete ? 'animate-tada bg-amber-400/20' : 'bg-white/5 grayscale',
        )}
        aria-hidden
      >
        {a.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('truncate text-sm font-bold', complete && 'text-amber-200')}>{a.name}</span>
          {a.hidden && (
            <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-fuchsia-300">
              Secreto
            </span>
          )}
          {complete && <span aria-hidden>✅</span>}
        </div>
        <div className="text-[11px] text-slate-400">{a.desc}</div>
        {!complete && progress > 0 && <ProgressBar value={progress} gradient="from-slate-400 to-slate-300" className="mt-1" height="h-1" />}
      </div>
    </div>
  );
}
