import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { formatNumber } from '../game/format';
import {
  availableInvestors,
  investorsUnlocked,
  REBIRTH_TIERS,
  achievementMultiplier,
  achievementsUnlocked,
  rebirthMultiplier,
  type AscensionOutcome,
  type TierLevel,
  tierUnlocked,
  plotsUnlocked,
} from '../game/logic';
import type { GameApi } from '../game/useGame';
import { RebirthTierCard } from './RebirthTierCard';
import { PlotsPanel } from './PlotsPanel';
import { PrestigeShop } from './PrestigeShop';
import { DiabolicShop } from './DiabolicShop';

export function RebirthTab({
  game,
  onRebirth,
}: {
  game: GameApi;
  onRebirth: (level: TierLevel, choice?: AscensionOutcome) => void;
}) {
  const { state } = game;
  const achieveMult = achievementMultiplier(state);
  const mult = rebirthMultiplier(state) * achieveMult;
  const unlockedTiers = REBIRTH_TIERS.filter((t) => tierUnlocked(state, t.level));
  const [sub, setSub] = useState<TierLevel>(() => unlockedTiers[unlockedTiers.length - 1]?.level ?? 1);

  // Si la sub-pestaña seleccionada deja de estar disponible, vuelve a la última válida.
  useEffect(() => {
    if (!unlockedTiers.some((t) => t.level === sub)) {
      setSub(unlockedTiers[unlockedTiers.length - 1]?.level ?? 1);
    }
  }, [unlockedTiers, sub]);

  const prestigeAvailable = state.tier1 + state.tier2 + state.tier3 > 0;
  const diabolicAvailable = state.hellFalls > 0;
  const [shopTab, setShopTab] = useState<'prestige' | 'diabolic'>(diabolicAvailable ? 'diabolic' : 'prestige');

  useEffect(() => {
    if (shopTab === 'diabolic' && !diabolicAvailable) setShopTab('prestige');
  }, [shopTab, diabolicAvailable]);

  const summary = [
    { label: 'Bonus', value: `x${formatNumber(mult)}`, tone: 'text-amber-300', show: true },
    {
      label: 'Logros',
      value: `${achievementsUnlocked(state)}🏅`,
      tone: 'text-yellow-300',
      show: achieveMult > 1,
    },
    { label: 'Cristales', value: `${formatNumber(state.crystals)}💠`, tone: 'text-fuchsia-300', show: state.crystals > 0 },
    { label: 'Estrellas', value: `${formatNumber(state.stars)}⭐`, tone: 'text-sky-300', show: state.stars > 0 },
    { label: 'Inversores', value: `${availableInvestors(state)}👽`, tone: 'text-lime-300', show: investorsUnlocked(state) },
  ].filter((s) => s.show);

  return (
    <div className="space-y-3">
      {/* Resumen */}
      <div className="relative animate-rise overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-indigo-950/70 via-fuchsia-950/50 to-slate-950 p-6">
        <div className="animate-aurora pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="animate-coin flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 text-4xl shadow-lg" aria-hidden>
            ♾️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Renacimiento</h2>
            <p className="text-sm text-fuchsia-200/80">
              Bonus total: <span className="font-bold tabular-nums text-amber-300">x{formatNumber(mult)}</span>
              {achieveMult > 1 && (
                <span className="text-yellow-300/80"> · logros +{formatNumber((achieveMult - 1) * 100)}%</span>
              )}
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="animate-pop rounded-2xl bg-black/30 px-2 py-3">
              <div className="uppercase tracking-wider text-slate-400">{s.label}</div>
              <div className={cn('text-base font-bold tabular-nums', s.tone)}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selector de nivel */}
      {unlockedTiers.length === 1 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-slate-300 backdrop-blur">
          <span className="text-base" aria-hidden>
            {unlockedTiers[0].icon}
          </span>
          {unlockedTiers[0].name}
        </div>
      ) : (
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
          {unlockedTiers.map((tier) => (
            <button
              key={tier.level}
              onClick={() => setSub(tier.level)}
              aria-pressed={sub === tier.level}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold transition-all duration-200',
                sub === tier.level
                  ? cn('scale-[1.02] bg-gradient-to-br text-white shadow-lg', tier.gradient)
                  : 'text-slate-300 hover:bg-white/5',
              )}
            >
              <span className="text-base" aria-hidden>
                {tier.icon}
              </span>
              <span className="hidden sm:inline">{tier.name.split(' ').pop()}</span>
            </button>
          ))}
        </div>
      )}

      <div className="animate-rise">
        <RebirthTierCard state={state} level={sub} onRebirth={onRebirth} />
      </div>

      {plotsUnlocked(state) && (
        <section className="animate-rise pt-2">
          <Divider icon="🏞️">Parcelas</Divider>
          <PlotsPanel game={game} />
        </section>
      )}

      {prestigeAvailable && (
        <section className="animate-rise pt-2">
          <Divider icon="🛍️">Tienda</Divider>
          {diabolicAvailable && (
            <div className="flex gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1">
              <button
                onClick={() => setShopTab('prestige')}
                className={cn(
                  'flex-1 rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wider transition',
                  shopTab === 'prestige' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:bg-white/5',
                )}
              >
                ✨ Prestigio
              </button>
              <button
                onClick={() => setShopTab('diabolic')}
                className={cn(
                  'flex-1 rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wider transition',
                  shopTab === 'diabolic' ? 'bg-red-500/20 text-red-300 shadow' : 'text-slate-400 hover:bg-white/5',
                )}
              >
                🔥 Diabólica
              </button>
            </div>
          )}
          <div className="mt-2">{shopTab === 'diabolic' && diabolicAvailable ? <DiabolicShop game={game} /> : <PrestigeShop game={game} />}</div>
        </section>
      )}
    </div>
  );
}

function Divider({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
      <span aria-hidden>{icon}</span> {children}
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}
