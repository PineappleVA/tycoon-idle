import { useState } from 'react';
import { cn } from '../lib/cn';
import { BUSINESSES } from '../game/data';
import { formatMoney, formatNumber } from '../game/format';
import { BALANZA_LABEL } from '../game/data';
import { BALANZA_THRESHOLD, HEAVEN_CHANCE } from '../game/balance';
import {
  allBusinessesOwned,
  ascensionMode,
  availableInvestors,
  balanzaUnlocked,
  canRebirth,
  currencyFromEarned,
  REBIRTH_TIERS,
  type AscensionOutcome,
  type GameState,
  type TierLevel,
  tierUnlocked,
} from '../game/logic';
import { ActionButton, LockedNotice, ProgressBar } from './ui';

export function RebirthTierCard({
  state,
  level,
  onRebirth,
}: {
  state: GameState;
  level: TierLevel;
  onRebirth: (level: TierLevel, choice?: AscensionOutcome) => void;
}) {
  const tier = REBIRTH_TIERS[level - 1];
  const [confirming, setConfirming] = useState(false);
  // Elección del jugador cuando La Balanza está activa.
  const [choice, setChoice] = useState<AscensionOutcome>('heaven');

  const unlocked = tierUnlocked(state, level);
  const pending = currencyFromEarned(level, state.totalEarned);
  const ready = canRebirth(state, level);
  const progress = Math.min(1, state.totalEarned / tier.requirement);
  const ownedCurrency = level === 1 ? availableInvestors(state) : level === 2 ? state.crystals : state.stars;
  const doneCount = level === 1 ? state.tier1 : level === 2 ? state.tier2 : state.tier3;
  const mode = ascensionMode(state);

  if (!unlocked) return <LockedTier state={state} level={level} />;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border p-5 transition-colors duration-300',
        ready ? 'border-amber-300/30 bg-white/[0.06]' : 'border-white/10 bg-white/[0.04]',
      )}
    >
      <div
        className={cn('pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl', tier.gradient)}
      />

      <div className="relative flex items-center gap-3">
        <div
          className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg', tier.gradient)}
          aria-hidden
        >
          {tier.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold">{tier.name}</span>
            {doneCount > 0 && (
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                x{doneCount}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {formatNumber(ownedCurrency)} {tier.currencyIcon} · +{(tier.bonusPer * 100).toFixed(tier.bonusPer * 100 < 5 ? 1 : 0)}%
            por {tier.currency.toLowerCase().replace(/s$/, '')}
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-xs leading-relaxed text-slate-400">{tier.desc}</p>

      {/* La Balanza: tras BALANZA_THRESHOLD caídas el jugador elige su destino. */}
      {level === 3 && balanzaUnlocked(state) && (
        <div className="relative mt-3 animate-pop rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-200">
            <span aria-hidden>⚖️</span> La Balanza
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-200/80">
            Has caído {state.hellFalls} veces. El azar ya no decide por ti: eliges tu destino.{' '}
            <span className="opacity-70">{BALANZA_LABEL}</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { id: 'heaven', icon: '☁️', label: 'El Cielo', tone: 'sky' as const, note: `+${formatNumber(pending)} ⭐` },
                { id: 'hell', icon: '🔥', label: 'El Infierno', tone: 'red' as const, note: 'Almas y reset total' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setChoice(opt.id)}
                aria-pressed={choice === opt.id}
                className={cn(
                  'rounded-xl border px-2 py-2 text-left text-[11px] transition-all duration-150',
                  choice === opt.id
                    ? opt.tone === 'sky'
                      ? 'scale-[1.02] border-sky-300/70 bg-sky-400/25 text-sky-100 shadow-lg'
                      : 'scale-[1.02] border-red-300/70 bg-red-500/25 text-red-100 shadow-lg'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07]',
                )}
              >
                <div className="font-bold">
                  {opt.icon} {opt.label}
                </div>
                <div className="opacity-80">{opt.note}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {ready ? (
        <>
          <div className="relative mt-3 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
            <span className="text-sm text-slate-300">Ganarías</span>
            <span className={cn('animate-pop bg-gradient-to-r bg-clip-text text-2xl font-extrabold text-transparent', tier.gradient)}>
              +{formatNumber(pending)} {tier.currencyIcon}
            </span>
          </div>

          {!confirming ? (
            <ActionButton onClick={() => setConfirming(true)} tone="amber" size="lg" className="mt-3 w-full" pulse>
              Renacer — {tier.name}
            </ActionButton>
          ) : (
            <div className="relative mt-3 animate-pop rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-100">{confirmText(level, mode, choice)}</p>
              <div className="mt-3 flex gap-2">
                <ActionButton
                  onClick={() => {
                    onRebirth(level, level === 3 && mode === 'choice' ? choice : undefined);
                    setConfirming(false);
                  }}
                  tone={level === 3 && choice === 'hell' ? 'red' : 'emerald'}
                  size="md"
                  className="flex-1"
                >
                  Sí, renacer
                </ActionButton>
                <ActionButton onClick={() => setConfirming(false)} tone="ghost" size="md" className="flex-1">
                  Cancelar
                </ActionButton>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="relative mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Progreso</span>
            <span className="tabular-nums text-slate-400">
              {formatMoney(state.totalEarned)} / {formatMoney(tier.requirement)}
            </span>
          </div>
          <ProgressBar value={progress} gradient={tier.gradient} className="relative mt-2" height="h-3" />
          <p className="relative mt-2 text-[11px] text-slate-500">
            Gana {formatMoney(tier.requirement)} en esta vida para renacer en este nivel.
          </p>
        </>
      )}
    </div>
  );
}

function confirmText(level: TierLevel, mode: ReturnType<typeof ascensionMode>, choice: AscensionOutcome): string {
  if (level === 1) return 'Perderás efectivo, negocios y mejoras. Conservas tu prestigio.';
  if (level === 2) return 'Perderás todo lo anterior Y tus Inversores, a cambio de Cristales.';

  if (mode === 'guaranteed')
    return '✅ Primer intento: Cielo GARANTIZADO, sin riesgo. Ganarás Estrellas y podrás volver siempre.';

  if (mode === 'choice')
    return choice === 'heaven'
      ? '⚖️ La Balanza te ofrece el Cielo: ganarás Estrellas y conservarás tus Inversores.'
      : '⚖️ La Balanza te ofrece el Infierno: ganarás Almas, pero se reinicia TODO tu progreso.';

  return `⚠️ Apuesta arriesgada: ${HEAVEN_CHANCE * 100}% Cielo (+Estrellas) / ${(1 - HEAVEN_CHANCE) * 100}% INFIERNO. Si caes, se reinicia TODO tu progreso: efectivo, negocios, mejoras, mánagers, Inversores, Cristales, Estrellas y compras de la Tienda. Tras ${BALANZA_THRESHOLD} caídas podrás elegir tú.`;
}

function LockedTier({ state, level }: { state: GameState; level: TierLevel }) {
  const tier = REBIRTH_TIERS[level - 1];
  const needed = tier.unlockNeeds;

  if (level === 3) {
    const ownedBiz = BUSINESSES.filter((b) => (state.businesses[b.id] ?? 0) > 0).length;
    const totalBiz = BUSINESSES.length;
    const bizDone = allBusinessesOwned(state);
    const crystalsDone = state.crystals >= needed;
    return (
      <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <LockedNotice icon={tier.icon} title={tier.name}>
          Debes desbloquearlo TODO antes de poder ascender.
        </LockedNotice>

        <RequirementRow
          done={bizDone}
          icon="🏬"
          label="Todos los negocios"
          current={ownedBiz}
          target={totalBiz}
          gradient={tier.gradient}
        />
        <RequirementRow
          done={crystalsDone}
          icon="💠"
          label="Cristales (materiales)"
          current={state.crystals}
          target={needed}
          gradient={tier.gradient}
          format={formatNumber}
        />
        <p className="text-[11px] text-slate-500">
          Además necesitarás alcanzar {formatMoney(tier.requirement)} en esta vida.
        </p>
      </div>
    );
  }

  const prevCurrencyName = REBIRTH_TIERS[level - 2].currency.toLowerCase();
  const prevOwned = level === 2 ? availableInvestors(state) : 0;

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
      <LockedNotice icon={tier.icon} title={tier.name}>
        Requiere {needed} {prevCurrencyName} (materiales) para desbloquear.
      </LockedNotice>
      <ProgressBar value={prevOwned / needed} gradient={tier.gradient} className="mt-3" />
      <div className="mt-1 text-right text-[11px] tabular-nums text-slate-500">
        {formatNumber(prevOwned)} / {needed} {prevCurrencyName}
      </div>
    </div>
  );
}

function RequirementRow({
  done,
  icon,
  label,
  current,
  target,
  gradient,
  format = String,
}: {
  done: boolean;
  icon: string;
  label: string;
  current: number;
  target: number;
  gradient: string;
  format?: (n: number) => string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className={done ? 'text-emerald-400' : 'text-slate-400'}>
          {done ? '✅' : icon} {label}
        </span>
        <span className="tabular-nums text-slate-500">
          {format(current)} / {format(target)}
        </span>
      </div>
      <ProgressBar value={target > 0 ? Math.min(1, current / target) : 0} gradient={gradient} />
    </div>
  );
}
