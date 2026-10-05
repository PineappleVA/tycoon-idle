import { cn } from '../lib/cn';
import type { TabDef, TabId } from '../game/tabs';

export function TabBar({
  tab,
  setTab,
  tabs,
  achievementsDone,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  tabs: TabDef[];
  achievementsDone: number;
}) {
  return (
    <div
      data-tour="tabs"
      role="tablist"
      className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur"
    >
      {tabs.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            data-tour={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold transition-all duration-200',
              active
                ? 'animate-pop bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-lg'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )}
          >
            <span className={cn('text-base transition-transform duration-200', active && 'scale-110')} aria-hidden>
              {t.icon}
            </span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'achievements' && (
              <span
                className={cn(
                  'absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active ? 'bg-slate-900 text-amber-300' : 'bg-amber-400 text-slate-900',
                )}
              >
                {achievementsDone}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
