import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUSINESSES, DIABOLIC_ITEMS, SHOP_ITEMS } from './game/data';
import {
  allBusinessesOwned,
  automationUnlocked,
  availableInvestors,
  balanzaUnlocked,
  bulkCost,
  businessCount,
  businessIncome,
  businessUpgrade,
  currencyFromEarned,
  employeesAssignedTo,
  GameState,
  hasFunction,
  HEAVEN_CHANCE,
  investorBonus,
  investorsUnlocked,
  isAutomated,
  isFirstHeavenAttempt,
  managerCost,
  maxAffordable,
  ownedBusinessCount,
  plotsUnlocked,
  REBIRTH_TIERS,
  rebirthMultiplier,
  tapUpgradeCost,
  tapValue,
  TierLevel,
  tierUnlocked,
  totalIncome,
  totalPlots,
  upgradeCostOf,
} from './game/logic';
import { ACHIEVEMENTS } from './game/achievements';
import { formatMoney, formatNumber, formatTime } from './game/format';
import { BuyAmount, GameApi, useGame } from './game/useGame';
import { Background } from './components/Background';
import { Toasts } from './components/Toasts';
import { Tutorial, TourStep } from './components/Tutorial';
import { AlienDialog, GodDialog, HellDialog } from './components/AlienDialog';
import { BusinessDetail } from './components/BusinessDetail';
import { DebugPanel } from './components/DebugPanel';
import { RebirthAnimation } from './components/RebirthAnimation';

type TabId = 'business' | 'upgrades' | 'rebirth' | 'stats' | 'achievements';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  unlocked: (s: GameState, achDone: number) => boolean;
}

const TABS: TabDef[] = [
  { id: 'business', label: 'Negocios', icon: '🏪', unlocked: () => true },
  {
    id: 'upgrades',
    label: 'Mejoras',
    icon: '⚡',
    unlocked: (s) => s.lifetimeEarned >= 250 || BUSINESSES.some((b) => businessCount(s, b.id) > 0),
  },
  {
    id: 'achievements',
    label: 'Logros',
    icon: '🏆',
    unlocked: (_s, achDone) => achDone >= 1,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: '📊',
    unlocked: (s) => s.lifetimeEarned >= 10_000,
  },
  {
    id: 'rebirth',
    label: 'Renacer',
    icon: '♾️',
    unlocked: (s) => s.rebirths > 0 || s.lifetimeEarned >= REBIRTH_TIERS[0].requirement * 0.2,
  },
];

const TOURS_KEY = 'tycoon-tours-v1';

const TOURS: {
  id: string;
  label: string;
  accent: 'amber' | 'fuchsia' | 'emerald';
  steps: TourStep[];
  when: (s: GameState, achDone: number) => boolean;
  requires?: string;
}[] = [
  {
    id: 'intro',
    label: 'Bienvenida',
    accent: 'amber',
    when: () => true,
    steps: [
      {
        emoji: '💼',
        title: '¡Bienvenido, futuro magnate!',
        text: 'Vas a construir un imperio desde cero. Te muestro lo básico en 20 segundos.',
      },
      {
        emoji: '👆',
        selector: '[data-tour="tap"]',
        title: 'Gana dinero a mano',
        text: 'Toca este maletín para trabajar y conseguir tus primeros billetes. ¡Cada toque cuenta!',
        action: { type: 'tap', hint: 'Pulsa el maletín 💼 para continuar.' },
      },
      {
        emoji: '💰',
        selector: '[data-tour="cash"]',
        title: 'Tu efectivo',
        text: 'Aquí ves cuánto dinero tienes disponible para gastar. Sube en tiempo real.',
      },
      {
        emoji: '🏪',
        selector: '[data-tour="business"]',
        title: 'Compra negocios',
        text: 'Cada negocio produce dinero automáticamente por segundo, ¡incluso mientras no juegas! Usa x1/x10/x100/MÁX para comprar en lote.',
      },
      {
        emoji: '📈',
        selector: '[data-tour="income"]',
        title: 'Ingresos pasivos',
        text: 'Esto es lo que ganas por segundo. Al volver tras cerrar el juego recibes el 25% de lo producido offline.',
      },
      {
        emoji: '🗂️',
        selector: '[data-tour="tabs"]',
        title: 'Pestañas',
        text: 'Aquí navegas el juego. Aparecerán nuevas pestañas a medida que progresas.',
      },
      {
        emoji: '🚀',
        title: '¡Todo listo!',
        text: 'Toca, compra y crece. Te iré dando más consejos según avances. ¡Mucha suerte!',
      },
    ],
  },
  {
    id: 'upgrades',
    label: 'Nueva función',
    accent: 'emerald',
    when: (s) => s.lifetimeEarned >= 250 || BUSINESSES.some((b) => businessCount(s, b.id) > 0),
    requires: '[data-tour="tab-upgrades"]',
    steps: [
      {
        emoji: '⚡',
        selector: '[data-tour="tab-upgrades"]',
        title: '¡Nueva pestaña: Mejoras!',
        text: 'Acabas de desbloquear las Mejoras. Ábrela para potenciar tu imperio.',
        action: { type: 'click', hint: 'Pulsa la pestaña Mejoras ⚡ para continuar.' },
      },
      {
        emoji: '✖️',
        selector: '[data-tour="tab-upgrades"]',
        title: 'Duplica ingresos',
        text: 'Cada mejora de un negocio DUPLICA su producción. También mejora tu mano de obra.',
      },
    ],
  },
  {
    id: 'achievements',
    label: 'Nueva función',
    accent: 'amber',
    when: (_s, achDone) => achDone >= 1,
    requires: '[data-tour="tab-achievements"]',
    steps: [
      {
        emoji: '🏆',
        selector: '[data-tour="tab-achievements"]',
        title: '¡Primer logro!',
        text: 'Has conseguido tu primer logro. En esta pestaña ves todos los retos.',
      },
    ],
  },
  {
    id: 'rebirth',
    label: 'Renacimiento',
    accent: 'fuchsia',
    when: (s) => s.rebirths > 0 || s.lifetimeEarned >= REBIRTH_TIERS[0].requirement * 0.2,
    requires: '[data-tour="tab-rebirth"]',
    steps: [
      {
        emoji: '♾️',
        selector: '[data-tour="tab-rebirth"]',
        title: '¡El Renacimiento te espera!',
        text: 'Cuando renaces reinicias tu imperio a cambio de poder PERMANENTE.',
      },
    ],
  },
  {
    id: 'managers',
    label: 'Nueva función',
    accent: 'emerald',
    when: (s) => s.totalEarned >= BUSINESSES[3].unlockAt,
    requires: '[data-automation]',
    steps: [
      {
        emoji: '🤖',
        selector: '[data-automation]',
        title: '¡Managers desbloqueados!',
        text: 'Al alcanzar la Pizzería puedes contratar managers. Un manager compra automáticamente ese negocio cada segundo.',
      },
    ],
  },
];

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  drift?: number;
  passive?: boolean;
}
let floatId = 0;

export default function App() {
  const game = useGame();
  const { state } = game;
  const [tab, setTab] = useState<TabId>('business');
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [activeTour, setActiveTour] = useState<(typeof TOURS)[0] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [rebirthAnim, setRebirthAnim] = useState<TierLevel | null>(null);
  const [godDialog, setGodDialog] = useState(false);
  const [hellDialog, setHellDialog] = useState(false);
  const pendingSkyOutcome = useRef<'heaven' | 'hell' | null>(null);
  const lastAlienGained = useRef(0);
  const [heavenVisitCount, setHeavenVisitCount] = useState(0);
  const [hellFallCount, setHellFallCount] = useState(0);
  const seenToursRef = useRef<Set<string>>(new Set());
  const tapRef = useRef<HTMLButtonElement>(null);

  const doRebirth = useCallback((level: TierLevel) => {
    if (level === 1) {
      lastAlienGained.current = currencyFromEarned(1, game.state.totalEarned);
    }
    if (level === 3) {
      // La primera vez SIEMPRE es Cielo garantizado. A partir de la segunda: 25% Cielo / 75% Infierno.
      const heaven = isFirstHeavenAttempt(game.state) || Math.random() < HEAVEN_CHANCE;
      pendingSkyOutcome.current = heaven ? 'heaven' : 'hell';
      setRebirthAnim(3);
    } else {
      setRebirthAnim(level);
    }
  }, [game.state]);

  const finishRebirthAnim = useCallback(() => {
    setRebirthAnim((lvl) => {
      if (lvl === 3) {
        const heaven = pendingSkyOutcome.current === 'heaven';
        game.rebirthTier(3, heaven);
        // Transición inmediata: el diálogo hace su propio fade-in.
        if (heaven) {
          setHeavenVisitCount((v) => v + 1);
          window.setTimeout(() => setGodDialog(true), 150);
        } else {
          setHellFallCount((v) => v + 1);
          window.setTimeout(() => setHellDialog(true), 150);
        }
        pendingSkyOutcome.current = null;
      } else if (lvl) {
        game.rebirthTier(lvl);
      }
      return null;
    });
  }, [game]);

  const income = useMemo(() => totalIncome(state), [state]);
  const tapWorth = tapValue(state);
  const achDone = useMemo(() => ACHIEVEMENTS.filter((a) => a.done(state)).length, [state]);
  const visibleTabs = useMemo(
    () => TABS.filter((t) => t.unlocked(state, achDone)),
    [state, achDone],
  );

  // Load seen tours
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TOURS_KEY);
      if (raw) seenToursRef.current = new Set(JSON.parse(raw) as string[]);
    } catch {}
  }, []);

  // Trigger next eligible tour
  useEffect(() => {
    if (activeTour) return;
    const t = window.setTimeout(() => {
      const candidate = TOURS.find(
        (t) =>
          !seenToursRef.current.has(t.id) &&
          t.when(state, achDone) &&
          (!t.requires || document.querySelector(t.requires)),
      );
      if (candidate) setActiveTour(candidate);
    }, 400);
    return () => window.clearTimeout(t);
  }, [state, achDone, activeTour]);

  const finishTour = useCallback(() => {
    setActiveTour((cur) => {
      if (cur) {
        seenToursRef.current.add(cur.id);
        try {
          localStorage.setItem(TOURS_KEY, JSON.stringify([...seenToursRef.current]));
        } catch {}
      }
      return null;
    });
  }, []);

  // Auto-switch if active tab becomes hidden
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab('business');
  }, [visibleTabs, tab]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      game.tap();
      const rect = tapRef.current?.getBoundingClientRect();
      const x = rect ? e.clientX - rect.left : 0;
      const y = rect ? e.clientY - rect.top : 0;
      const id = ++floatId;
      const drift = (Math.random() - 0.5) * 40;
      setFloats((f) => [...f.slice(-24), { id, x, y, text: '+' + formatMoney(tapWorth), drift }]);
      window.setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1000);
    },
    [game, tapWorth],
  );

  // Passive income particles
  useEffect(() => {
    if (income <= 0) return;
    const iv = window.setInterval(() => {
      const rect = tapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const id = ++floatId;
      const x = rect.width / 2 + (Math.random() - 0.5) * 60;
      const y = rect.height * 0.7;
      const drift = (Math.random() - 0.5) * 30;
      setFloats((f) => [...f.slice(-24), { id, x, y, text: '+' + formatMoney(income), drift, passive: true }]);
      window.setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1400);
    }, 1000);
    return () => window.clearInterval(iv);
  }, [income]);

  // Debug mode listener (Ctrl+Shift+D)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode((d) => !d);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100">
      <Background />
      <Toasts toasts={game.toasts} />

      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <TopBar
          cash={state.cash}
          income={income}
          ingots={state.ingots}
          crystals={state.crystals}
          stars={state.stars}
          rebirths={state.rebirths}
          investors={availableInvestors(state)}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* left: tap dashboard */}
          <div className="space-y-4">
            <TapPanel
              ref={tapRef}
              onTap={handleTap}
              tapWorth={tapWorth}
              income={income}
              floats={floats}
            />
            <QuickStats state={state} income={income} />
          </div>

          {/* right: tabbed content */}
          <div className="min-w-0">
            <TabBar tab={tab} setTab={setTab} tabs={visibleTabs} achDone={achDone} />
            <div key={tab} className="animate-rise mt-4">
              {tab === 'business' && (
                <BusinessTab
                  game={game}
                  income={income}
                  onBusinessSelect={(id) => setSelectedBusiness(id)}
                />
              )}
              {tab === 'upgrades' && <UpgradesTab game={game} />}
              {tab === 'rebirth' && <RebirthTab game={game} onRebirth={doRebirth} />}
              {tab === 'stats' && <StatsTab game={game} income={income} />}
              {tab === 'achievements' && <AchievementsTab state={state} />}
            </div>
          </div>
        </div>
      </div>

      {game.offline && (
        <OfflineInvoice
          ms={game.offline.ms}
          msAtFull={game.offline.msAtFull}
          msAtReduced={game.offline.msAtReduced}
          potential={game.offline.potential}
          claimed={game.offline.claimed}
          deducted={game.offline.deducted}
          onClaim={game.claimOffline}
        />
      )}

      {activeTour && (
        <Tutorial
          steps={activeTour.steps}
          label={activeTour.label}
          accent={activeTour.accent}
          onFinish={finishTour}
        />
      )}

      {state.tier1 >= 1 && !state.alienDialogSeen && (
        <AlienDialog
          ctx={
            state.tier1 === 1
              ? { type: 'first' }
              : {
                  type: 'rebirth',
                  tier1: state.tier1,
                  gained: lastAlienGained.current,
                  lifetimeEarned: state.lifetimeEarned,
                  investors: availableInvestors(state),
                  heavenReached: state.heavenReached,
                }
          }
          onDismiss={game.markAlienDialogSeen}
        />
      )}

      {godDialog && (
        <GodDialog
          visitCount={heavenVisitCount}
          stars={state.stars}
          lifetimeEarned={state.lifetimeEarned}
          onDismiss={() => setGodDialog(false)}
        />
      )}

      {hellDialog && (
        <HellDialog fallCount={hellFallCount} onDismiss={() => setHellDialog(false)} />
      )}

      {selectedBusiness && (
        <BusinessDetail
          game={game}
          def={BUSINESSES.find((b) => b.id === selectedBusiness)!}
          onClose={() => setSelectedBusiness(null)}
        />
      )}

      {debugMode && <DebugPanel game={game} onClose={() => setDebugMode(false)} />}

      {rebirthAnim !== null && (
        <RebirthAnimation
          level={rebirthAnim}
          skyOutcome={pendingSkyOutcome.current}
          portalRebirths={state.tier2}
          onDone={finishRebirthAnim}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar                                                             */
/* ------------------------------------------------------------------ */
function TopBar({
  cash,
  income,
  ingots,
  crystals,
  stars,
  rebirths,
  investors,
}: {
  cash: number;
  income: number;
  ingots: number;
  crystals: number;
  stars: number;
  rebirths: number;
  investors: number;
}) {
  const mult = investorBonus({ investors, investorsSpent: 0 } as GameState) *
    (1 + ingots * REBIRTH_TIERS[0].bonusPer) *
    (1 + crystals * REBIRTH_TIERS[1].bonusPer) *
    (1 + stars * REBIRTH_TIERS[2].bonusPer);
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="animate-coin text-4xl drop-shadow-[0_4px_10px_rgba(250,204,21,0.4)]">💰</div>
        <div>
          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Tycoon Idle
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Crea tu imperio</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {(ingots > 0 || rebirths > 0 || investors > 0) && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-1.5">
            <span className="text-lg">🏅</span>
            <div className="leading-none">
              <div className="flex items-center gap-2 text-sm font-bold tabular-nums text-amber-200">
                {ingots > 0 && <span>{formatNumber(ingots)}🏅</span>}
                {crystals > 0 && <span>{formatNumber(crystals)}💠</span>}
                {stars > 0 && <span>{formatNumber(stars)}⭐</span>}
                {investors > 0 && <span>{investors}👽</span>}
              </div>
              <div className="text-[10px] text-amber-300/80">
                x{mult.toFixed(1)} bonus · {rebirths} renacer{rebirths !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        )}
        <div className="text-right" data-tour="cash">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Efectivo</p>
          <span className="block text-2xl font-bold tabular-nums text-white sm:text-3xl">
            {formatMoney(cash)}
          </span>
        </div>
        <div className="hidden text-right sm:block" data-tour="income">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Por segundo</p>
          <span className="block text-lg font-semibold tabular-nums text-emerald-400">
            +{formatMoney(income)}
          </span>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Tap panel                                                           */
/* ------------------------------------------------------------------ */
const TapPanel = React.forwardRef<
  HTMLButtonElement,
  {
    onTap: (e: React.MouseEvent<HTMLButtonElement>) => void;
    tapWorth: number;
    income: number;
    floats: FloatText[];
  }
>(function TapPanel({ onTap, tapWorth, income, floats }, ref) {
  return (
    <button
      ref={ref}
      onClick={onTap}
      data-tour="tap"
      className="group relative flex h-72 w-full select-none flex-col items-center justify-center overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/90 via-orange-500/90 to-rose-500/90 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.6)] transition active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.35),transparent_55%)]" />
      <div className="shimmer pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-100" />

      <div className="animate-coin text-7xl drop-shadow-lg">💼</div>
      <div className="mt-3 text-sm font-medium text-white/90">Toca para trabajar</div>
      <div className="text-2xl font-extrabold tabular-nums text-white drop-shadow">
        +{formatMoney(tapWorth)}
      </div>
      <div className="mt-4 rounded-full bg-black/25 px-4 py-1 text-xs font-medium text-white/90 backdrop-blur">
        Pasivo: +{formatMoney(income)}/s
      </div>

      {floats.map((f) => (
        <span
          key={f.id}
          className={`pointer-events-none absolute font-extrabold drop-shadow-lg ${
            f.passive ? 'text-sm text-emerald-200/90' : 'text-lg text-white'
          }`}
          style={{
            left: f.x,
            top: f.y,
            '--drift': `${f.drift ?? 0}px`,
            animation: `${f.passive ? 'floatUpSoft' : 'floatUp'} ${f.passive ? '1.4s' : '1s'} ease-out forwards`,
          } as React.CSSProperties}
        >
          {f.text}
        </span>
      ))}
    </button>
  );
});

function QuickStats({
  state,
  income,
}: {
  state: GameApi['state'];
  income: number;
}) {
  const owned = BUSINESSES.reduce((s, b) => s + businessCount(state, b.id), 0);
  const items = [
    { label: 'Ganado total', value: formatMoney(state.totalEarned), icon: '💵' },
    { label: 'Negocios', value: formatNumber(owned), icon: '🏬' },
    { label: 'Toques', value: formatNumber(state.taps), icon: '👆' },
    { label: 'Ingreso/s', value: formatMoney(income), icon: '📈' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
        >
          <div className="text-lg">{it.icon}</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-white">{it.value}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab bar                                                             */
/* ------------------------------------------------------------------ */
function TabBar({
  tab,
  setTab,
  tabs,
  achDone,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  tabs: TabDef[];
  achDone: number;
}) {
  return (
    <div
      data-tour="tabs"
      className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur"
    >
      {tabs.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            data-tour={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`animate-pop relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
              active
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-lg'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'achievements' && (
              <span
                className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-slate-900 text-amber-300' : 'bg-amber-400 text-slate-900'
                }`}
              >
                {achDone}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business tab                                                        */
/* ------------------------------------------------------------------ */
const BUY_OPTIONS: BuyAmount[] = [1, 10, 100, 'max'];

function BusinessTab({
  game,
  income,
  onBusinessSelect,
}: {
  game: GameApi;
  income: number;
  onBusinessSelect: (id: string) => void;
}) {
  const { state } = game;
  const nextUnlock = BUSINESSES.find((b) => state.totalEarned < b.unlockAt);
  const buyOptions = hasFunction(state, 'buyx1000')
    ? ([1, 10, 100, 1000, 'max'] as BuyAmount[])
    : BUY_OPTIONS;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
        <span className="text-sm text-slate-300">
          Ingreso total: <span className="font-bold text-emerald-400">{formatMoney(income)}/s</span>
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1">
          <span className="px-2 text-xs text-slate-400">Comprar</span>
          {buyOptions.map((opt) => (
            <button
              key={String(opt)}
              onClick={() => game.setBuyAmount(opt)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                game.buyAmount === opt
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {opt === 'max' ? 'MÁX' : `x${opt}`}
            </button>
          ))}
        </div>
      </div>

      {/* Inversores alienígenas */}
      {investorsUnlocked(state) && availableInvestors(state) > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 backdrop-blur">
          <div>
            <span className="text-sm font-semibold text-emerald-200">👽 Inversores</span>
            <span className="ml-2 text-xs text-emerald-300/80">
              {availableInvestors(state)} activos · +{availableInvestors(state)}% velocidad
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-tour="business">
        {BUSINESSES.filter((def) => {
          // Show if unlocked
          if (state.totalEarned >= def.unlockAt) return true;
          // Show only the NEXT locked one
          const prevAll = BUSINESSES.filter((b) => b.unlockAt < def.unlockAt);
          return prevAll.every((b) => state.totalEarned >= b.unlockAt);
        }).map((def) => (
          <BusinessCard
            key={def.id}
            game={game}
            id={def.id}
            onSelect={onBusinessSelect}
          />
        ))}
      </div>

      {nextUnlock && (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 backdrop-blur">
          🔒 Próximo: <span className="font-semibold">{nextUnlock.name}</span> al ganar{' '}
          {formatMoney(nextUnlock.unlockAt)} en total.
        </div>
      )}
    </div>
  );
}

function BusinessCard({
  game,
  id,
  onSelect,
}: {
  game: GameApi;
  id: string;
  onSelect: (id: string) => void;
}) {
  const def = BUSINESSES.find((b) => b.id === id)!;
  const { state } = game;
  const unlocked = state.totalEarned >= def.unlockAt;
  const count = businessCount(state, id);
  const level = businessUpgrade(state, id);
  const myIncome = count > 0 ? businessIncome(def, state) : 0;
  const autoUnlocked = automationUnlocked(state);
  const automated = isAutomated(state, id);
  const canAffordManager = state.cash >= managerCost();

  if (!unlocked) {
    const progress = Math.min(1, state.totalEarned / def.unlockAt);
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
        <div className="text-4xl opacity-30 grayscale">{def.icon}</div>
        <div className="mt-2 text-sm font-semibold text-slate-400">🔒 {def.name}</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-300 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {formatMoney(state.totalEarned)} / {formatMoney(def.unlockAt)}
        </div>
      </div>
    );
  }

  const amount =
    game.buyAmount === 'max' ? Math.max(1, maxAffordable(def, count, state.cash)) : game.buyAmount;
  const price = bulkCost(def, count, amount);
  const canBuy = state.cash >= price && (game.buyAmount !== 'max' ? true : maxAffordable(def, count, state.cash) > 0);
  const upgPrice = upgradeCostOf(def, level);
  const canUpgrade = count > 0 && state.cash >= upgPrice;

  return (
    <button
      onClick={() => onSelect(id)}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur transition hover:border-white/20 hover:bg-white/[0.08]"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${def.gradient} opacity-20 blur-2xl transition group-hover:opacity-40`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${def.gradient} text-2xl shadow-lg`}
        >
          {def.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold">{def.name}</span>
            {automated && (
              <span className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                AUTO
              </span>
            )}
            {level > 0 && (
              <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                x{Math.pow(2, level)}
              </span>
            )}
            {employeesAssignedTo(state, id) > 0 && (
              <span className="rounded-md bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                🏞️×{employeesAssignedTo(state, id)}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {formatNumber(count)} uds · {formatMoney(myIncome)}/s
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            game.buy(id);
          }}
          disabled={!canBuy}
          className="flex flex-col items-center rounded-xl bg-emerald-500 px-3 py-2 text-white transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
            Comprar x{amount}
          </span>
          <span className="text-sm font-bold">{formatMoney(price)}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            game.upgrade(id);
          }}
          disabled={!canUpgrade}
          className="flex flex-col items-center rounded-xl bg-amber-500 px-3 py-2 text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
            Mejorar x2
          </span>
          <span className="text-sm font-bold">{formatMoney(upgPrice)}</span>
        </button>
      </div>

      {autoUnlocked && (
        <button
          data-automation
          onClick={(e) => {
            e.stopPropagation();
            game.toggleAutomation(id);
          }}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            automated
              ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
              : canAffordManager
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-500'
          }`}
          disabled={!automated && !canAffordManager}
        >
          <span>{automated ? '🤖' : '👤'}</span>
          <span>
            {automated
              ? 'Manager activo (auto-compra)'
              : `Contratar manager — ${formatMoney(managerCost())}`}
          </span>
        </button>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Upgrades tab                                                        */
/* ------------------------------------------------------------------ */
function UpgradesTab({ game }: { game: GameApi }) {
  const { state } = game;
  const tapPrice = tapUpgradeCost(state.tapLevel);
  const canTap = state.cash >= tapPrice;
  const owned = BUSINESSES.filter((b) => businessCount(state, b.id) > 0);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-950/50 to-slate-950 p-5">
        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-3xl shadow-lg animate-coin">
            👆
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">Mano de Obra</span>
              <span className="rounded-md bg-purple-400/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-200">
                Nv. {state.tapLevel}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {formatMoney(tapValue(state))}/toque
            </div>
          </div>
        </div>

        <button
          onClick={game.upgradeTap}
          disabled={!canTap}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mejorar — {formatMoney(tapPrice)}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        <h3 className="mb-1 text-sm font-bold">Mejoras de Negocios</h3>
        <p className="text-xs text-slate-400">
          Cada mejora <span className="font-semibold text-amber-300">duplica</span> el ingreso.
        </p>
        {owned.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-500">
            Compra negocios en la pestaña Negocios.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {owned.map((def) => {
              const level = businessUpgrade(state, def.id);
              const price = upgradeCostOf(def, level);
              const count = businessCount(state, def.id);
              const can = count > 0 && state.cash >= price;
              return (
                <div
                  key={def.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${def.gradient} text-xl shadow`}>
                    {def.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{def.name}</span>
                      <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        x{Math.pow(2, level)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      +{formatMoney(def.baseIncome * Math.pow(2, level))}/s por unidad
                    </div>
                  </div>
                  <button
                    onClick={() => game.upgrade(def.id)}
                    disabled={!can}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                  >
                    +1 · {formatMoney(price)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rebirth tab (sub-tabs)                                             */
/* ------------------------------------------------------------------ */
function RebirthTab({ game, onRebirth }: { game: GameApi; onRebirth: (level: TierLevel) => void }) {
  const { state } = game;
  const mult = rebirthMultiplier(state);
  // Solo mostramos sub-pestañas de niveles desbloqueados (nunca se ven niveles bloqueados)
  const unlockedTiers = REBIRTH_TIERS.filter((t) => tierUnlocked(state, t.level));
  const [sub, setSub] = useState<TierLevel>(() => {
    const last = unlockedTiers[unlockedTiers.length - 1]?.level;
    return last ?? 1;
  });
  // La tienda de prestigio se desbloquea tras el primer renacimiento de cualquier nivel.
  const prestigeAvailable = state.tier1 + state.tier2 + state.tier3 > 0;
  // La tienda diabólica sólo aparece tras caer al Infierno al menos una vez.
  const diabolicAvailable = state.hellFalls > 0;
  const [shopTab, setShopTab] = useState<'prestige' | 'diabolic'>(diabolicAvailable ? 'diabolic' : 'prestige');

  // Si el tab seleccionado queda bloqueado, vuelve al disponible.
  useEffect(() => {
    if (shopTab === 'diabolic' && !diabolicAvailable) setShopTab('prestige');
  }, [shopTab, diabolicAvailable]);

  return (
    <div className="space-y-3">
      {/* Hero resumen */}
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-indigo-950/70 via-fuchsia-950/50 to-slate-950 p-6">
        <div className="animate-aurora pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 text-4xl shadow-lg animate-coin">
            ♾️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Renacimiento</h2>
            <p className="text-sm text-fuchsia-200/80">
              Bonus total:{' '}
              <span className="font-bold text-amber-300">x{formatNumber(mult)}</span>
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-black/30 px-2 py-3">
            <div className="uppercase tracking-wider text-slate-400">Bonus</div>
            <div className="text-base font-bold text-amber-300">x{formatNumber(mult)}</div>
          </div>
          {state.crystals > 0 && (
            <div className="rounded-2xl bg-black/30 px-2 py-3">
              <div className="uppercase tracking-wider text-slate-400">Cristales</div>
              <div className="text-base font-bold text-fuchsia-300">{formatNumber(state.crystals)}💠</div>
            </div>
          )}
          {state.stars > 0 && (
            <div className="rounded-2xl bg-black/30 px-2 py-3">
              <div className="uppercase tracking-wider text-slate-400">Estrellas</div>
              <div className="text-base font-bold text-sky-300">{formatNumber(state.stars)}⭐</div>
            </div>
          )}
          {investorsUnlocked(state) && (
            <div className="rounded-2xl bg-black/30 px-2 py-3">
              <div className="uppercase tracking-wider text-slate-400">Inversores</div>
              <div className="text-base font-bold text-lime-300">{availableInvestors(state)}👽</div>
            </div>
          )}
        </div>
      </div>

      <>
        {unlockedTiers.length === 1 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span className="text-base">{unlockedTiers[0].icon}</span>
              {unlockedTiers[0].name}
            </div>
          </div>
        ) : (
          <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
            {unlockedTiers.map((tier) => {
              const active = sub === tier.level;
              return (
                <button
                  key={tier.level}
                  onClick={() => setSub(tier.level)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                    active
                      ? `bg-gradient-to-br ${tier.gradient} text-white shadow-lg`
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base">{tier.icon}</span>
                  <span className="hidden sm:inline">{tier.name.split(' ').pop()}</span>
                </button>
              );
            })}
          </div>
        )}

        <RebirthTierCard game={game} level={sub} onRebirth={onRebirth} />
      </>

      {plotsUnlocked(state) && (
        <div className="pt-2">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>🏞️ Parcelas</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <PlotsPanel game={game} />
        </div>
      )}

      {prestigeAvailable && (
        <div className="pt-2">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>🛍️ Tienda</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          {diabolicAvailable ? (
            <div className="flex gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1">
              <button
                onClick={() => setShopTab('prestige')}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
                  shopTab === 'prestige' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                ✨ Prestigio
              </button>
              <button
                onClick={() => setShopTab('diabolic')}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
                  shopTab === 'diabolic' ? 'bg-red-500/20 text-red-300 shadow' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                🔥 Diabólica
              </button>
            </div>
          ) : null}
          <div className="mt-2">
            {shopTab === 'diabolic' && diabolicAvailable ? (
              <DiabolicShop game={game} />
            ) : (
              <PrestigeShop game={game} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlotsPanel({ game }: { game: GameApi }) {
  const { state } = game;
  const slots = totalPlots(state);
  const ownedBusinesses = BUSINESSES.filter((b) => businessCount(state, b.id) > 0);

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400">
        Asigna un <span className="font-bold text-emerald-300">Empleado</span> a cada Parcela. Cada empleado da{' '}
        <span className="font-bold text-emerald-300">+100%</span> de ingresos al negocio que elijas. Se pierden si caes al Infierno.
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: slots }).map((_, idx) => {
          const assignedId = state.plotAssignments[idx];
          const assignedDef = BUSINESSES.find((b) => b.id === assignedId);
          return (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner ${
                  assignedDef ? `bg-gradient-to-br ${assignedDef.gradient}` : 'bg-white/5'
                }`}
              >
                {assignedDef ? assignedDef.icon : '🏞️'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Parcela #{idx + 1}</div>
                <select
                  value={assignedId ?? ''}
                  onChange={(e) => game.assignPlot(idx, e.target.value === '' ? null : e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs font-semibold text-white outline-none focus:border-emerald-400/50"
                >
                  <option value="">— Sin empleado —</option>
                  {ownedBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      👷 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      {ownedBusinesses.length === 0 && (
        <p className="text-[11px] italic text-slate-500">Compra negocios primero para poder asignarles empleados.</p>
      )}
    </div>
  );
}

function ShopItemRow({ game, item, diabolic }: { game: GameApi; item: (typeof SHOP_ITEMS)[number]; diabolic?: boolean }) {
  const { state } = game;
  const owned = (state.shopUpgrades[item.id] ?? 0) > 0;
  const currentCurrencyVal =
    item.currency === 'investors' ? availableInvestors(state) : (state[item.currency] as number);
  const canAfford = currentCurrencyVal >= item.cost;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 backdrop-blur ${
        owned
          ? diabolic
            ? 'border-red-400/40 bg-red-900/20'
            : 'border-emerald-400/30 bg-emerald-500/10'
          : diabolic
            ? 'border-red-500/20 bg-red-950/20'
            : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner ${owned ? '' : 'animate-coin'} ${diabolic ? 'bg-red-500/10' : 'bg-white/5'}`}>
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-white">{item.name}</span>
          {owned && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${diabolic ? 'bg-red-400/20 text-red-300' : 'bg-emerald-400/20 text-emerald-300'}`}>
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
          className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 ${
            diabolic ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
          }`}
        >
          <span>{item.cost} {item.currencyIcon}</span>
        </button>
      )}
    </div>
  );
}

function PrestigeShop({ game }: { game: GameApi }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
        ✨ Compra mejoras permanentes que se conservan entre renacimientos. El multiplicador se acumula de forma exponencial.
      </div>
      <div className="space-y-2">
        {SHOP_ITEMS.map((item) => (
          <ShopItemRow key={item.id} game={game} item={item} />
        ))}
      </div>
    </div>
  );
}

function DiabolicShop({ game }: { game: GameApi }) {
  const { state } = game;
  const tier1Count = state.shopUpgrades['infernal_pact'] ?? 0;
  const tier2Count = state.shopUpgrades['demonic_forge'] ?? 0;
  const tier3Count = state.shopUpgrades['abyssal_throne'] ?? 0;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 relative overflow-hidden">
        {/* Brasas decorativas en la cabecera */}
        {Array.from({ length: 8 }).map((_, idx) => (
          <span
            key={idx}
            className="absolute bottom-0 rounded-full bg-orange-500"
            style={{
              left: `${(idx * 12.5) + Math.random() * 6}%`,
              width: 3 + (idx % 3),
              height: 3 + (idx % 3),
              boxShadow: '0 0 6px #f97316',
              animation: `emberRise ${2 + (idx % 4)}s ease-out ${(idx % 5) * 0.4}s infinite`,
            }}
          />
        ))}
        <div className="relative flex items-center justify-between">
          <span className="text-sm font-bold text-red-300">🔥 Pacto Diabólico</span>
          <span className="text-xs font-bold text-orange-300">{formatNumber(state.souls)} 🔥 Almas</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-red-200/80">
          Caída al Infierno = <span className="font-bold">+3 Almas 🔥</span>. Has caído {state.hellFalls} {state.hellFalls === 1 ? 'vez' : 'veces'}. Cada mejora es{' '}
          <span className="font-bold">permanente</span> y se acumula con las demas.
        </p>
        <div className="mt-2 flex gap-2 text-[10px]">
          <span className="rounded bg-red-900/40 px-2 py-0.5 text-red-200">📜 ×{tier1Count}</span>
          <span className="rounded bg-red-900/40 px-2 py-0.5 text-red-200">⚒️ ×{tier2Count}</span>
          <span className="rounded bg-red-900/40 px-2 py-0.5 text-red-200">🕯️ ×{tier3Count}</span>
        </div>
      </div>
      <div className="space-y-2">
        {DIABOLIC_ITEMS.map((item) => (
          <ShopItemRow key={item.id} game={game} item={item} diabolic />
        ))}
      </div>
    </div>
  );
}

function RebirthTierCard({
  game,
  level,
  onRebirth,
}: {
  game: GameApi;
  level: TierLevel;
  onRebirth: (level: TierLevel) => void;
}) {
  const { state } = game;
  const tier = REBIRTH_TIERS[level - 1];
  const [confirming, setConfirming] = useState(false);

  const unlocked = tierUnlocked(state, level);
  const pending = currencyFromEarned(level, state.totalEarned);
  const canRebirth = unlocked && pending > 0;
  const progress = Math.min(1, state.totalEarned / tier.requirement);
  const ownedCurrency = level === 1 ? availableInvestors(state) : level === 2 ? state.crystals : state.stars;
  const doneCount = level === 1 ? state.tier1 : level === 2 ? state.tier2 : state.tier3;

  const prevCurrencyName = level === 2 ? REBIRTH_TIERS[0].currency : level === 3 ? REBIRTH_TIERS[1].currency : '';
  const prevOwned = level === 2 ? availableInvestors(state) : level === 3 ? state.crystals : 0;
  const needed = tier.unlockNeeds;

  if (!unlocked) {
    // Nivel 3 (El Cielo): además de los materiales, exige desbloquear TODOS los negocios.
    if (level === 3) {
      const ownedBiz = ownedBusinessCount(state);
      const totalBiz = BUSINESSES.length;
      const bizDone = allBusinessesOwned(state);
      const crystalsDone = state.crystals >= needed;
      return (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl opacity-40 grayscale">
              {tier.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold text-slate-400">
                🔒 {tier.name}
              </div>
              <div className="text-xs text-slate-500">
                Debes desbloquearlo TODO antes de poder ascender.
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={bizDone ? 'text-emerald-400' : 'text-slate-400'}>
                {bizDone ? '✅' : '🏬'} Todos los negocios
              </span>
              <span className="text-slate-500">{ownedBiz} / {totalBiz}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(1, ownedBiz / totalBiz) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={crystalsDone ? 'text-emerald-400' : 'text-slate-400'}>
                {crystalsDone ? '✅' : '💠'} Cristales (materiales)
              </span>
              <span className="text-slate-500">{formatNumber(state.crystals)} / {needed}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(1, state.crystals / needed) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Además necesitarás alcanzar {formatMoney(tier.requirement)} en esta vida.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl opacity-40 grayscale">
            {tier.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-bold text-slate-400">
              🔒 {tier.name}
            </div>
            <div className="text-xs text-slate-500">
              Requiere {needed} {prevCurrencyName.toLowerCase()} (materiales) para desbloquear.
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
            style={{ width: `${Math.min(1, prevOwned / needed) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-slate-500">
          {formatNumber(prevOwned)} / {needed} {prevCurrencyName.toLowerCase()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 transition ${
        canRebirth ? 'border-amber-300/30 bg-white/[0.06]' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tier.gradient} opacity-20 blur-2xl`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tier.gradient} text-2xl shadow-lg`}
        >
          {tier.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold">
              {tier.name}
            </span>
            {doneCount > 0 && (
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                x{doneCount}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {formatNumber(ownedCurrency)} {tier.currencyIcon} · +{(tier.bonusPer * 100).toFixed(tier.bonusPer * 100 < 5 ? 1 : 0)}% por{' '}
            {tier.currency.toLowerCase().slice(0, -1)}
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-xs leading-relaxed text-slate-400">{tier.desc}</p>

      {canRebirth ? (
        <>
          <div className="relative mt-3 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
            <span className="text-sm text-slate-300">Ganarías</span>
            <span className={`bg-gradient-to-r ${tier.gradient} bg-clip-text text-2xl font-extrabold text-transparent`}>
              +{formatNumber(pending)} {tier.currencyIcon}
            </span>
          </div>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className={`animate-pulse-ring relative mt-3 w-full rounded-2xl bg-gradient-to-r ${tier.gradient} py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]`}
            >
              Renacer — {tier.name}
            </button>
          ) : (
            <div className="relative mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-100">
                {level === 1 && 'Perderás efectivo, negocios y mejoras. Conservas tu prestigio.'}
                {level === 2 && 'Perderás todo lo anterior Y tus Inversores, a cambio de Cristales.'}
                {level === 3 &&
                  (isFirstHeavenAttempt(state)
                    ? '✅ Primer intento: Cielo GARANTIZADO, sin riesgo. Ganarás Estrellas y podrás volver siempre.'
                    : '⚠️ Apuesta arriesgada: 25% Cielo (+Estrellas) / 75% INFIERNO. Si caes, se reinicia TODO tu progreso: efectivo, negocios, mejoras, mánagers, Inversores, Cristales, Estrellas y compras de la Tienda. Solo se conservan los contadores históricos (renacimientos, toques, dinero total).')}{' '}
                ¿Seguro?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    onRebirth(level);
                    setConfirming(false);
                  }}
                  className={`flex-1 rounded-xl bg-gradient-to-r ${tier.gradient} py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95`}
                >
                  Sí, renacer
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold transition hover:bg-white/20"
                >
                  Cancelar
                </button>
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
          <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="relative mt-2 text-[11px] text-slate-500">
            Gana {formatMoney(tier.requirement)} en esta vida para renacer en este nivel.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats tab                                                           */
/* ------------------------------------------------------------------ */
function StatsTab({ game, income }: { game: GameApi; income: number }) {
  const { state } = game;
  const owned = BUSINESSES.reduce((s, b) => s + businessCount(state, b.id), 0);

  const rows = [
    { label: 'Efectivo actual', value: formatMoney(state.cash), icon: '💵' },
    { label: 'Dinero ganado total', value: formatMoney(state.totalEarned), icon: '🏦' },
    { label: 'Ingreso por segundo', value: formatMoney(income) + '/s', icon: '📈' },
    { label: 'Toques totales', value: formatNumber(state.taps), icon: '👆' },
    { label: 'Negocios totales', value: formatNumber(owned), icon: '🏬' },
    { label: 'Renaceres', value: String(state.rebirths), icon: '♾️' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              Offline / día (25%)
            </div>
            <div className="text-lg font-bold tabular-nums text-emerald-400">
              {formatMoney(income * 86400 * 0.25)}
            </div>
          </div>
          <div className="text-right text-[10px] uppercase tracking-widest text-slate-400">
            Máx. 24h al 25%
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Tras las primeras 24h offline, el bonus baja al 3%. Siempre conservas lo generado en las primeras 24h.
        </p>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur"
          >
            <span className="text-lg">{r.icon}</span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{r.label}</div>
              <div className="font-bold tabular-nums">{r.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Achievements tab                                                    */
/* ------------------------------------------------------------------ */
function AchievementsTab({ state }: { state: GameApi['state'] }) {
  const visible = ACHIEVEMENTS.filter((a) => !a.hidden || a.done(state));
  const hiddenCount = ACHIEVEMENTS.filter((a) => a.hidden && !a.done(state)).length;
  const done = ACHIEVEMENTS.filter((a) => a.done(state)).length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">Progreso de logros</span>
          <span className="text-amber-300">
            {done}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${(done / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        {hiddenCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>🔒</span> {hiddenCount} logro(s) secreto(s) por descubrir…
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((a) => {
          const complete = a.done(state);
          const progress = a.progress(state);
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 backdrop-blur transition ${
                complete
                  ? 'border-amber-300/40 bg-amber-500/10'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  complete ? 'bg-amber-400/20' : 'bg-white/5 grayscale'
                }`}
              >
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm font-bold ${complete ? 'text-amber-200' : ''}`}>
                    {a.name}
                  </span>
                  {a.hidden && (
                    <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-fuchsia-300">
                      Secreto
                    </span>
                  )}
                  {complete && <span className="text-xs">✅</span>}
                </div>
                <div className="text-[11px] text-slate-400">{a.desc}</div>
                {!complete && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Offline invoice (ticket)                                            */
/* ------------------------------------------------------------------ */
function OfflineInvoice({
  ms,
  msAtFull,
  msAtReduced,
  potential,
  claimed,
  deducted,
  onClaim,
}: {
  ms: number;
  msAtFull: number;
  msAtReduced: number;
  potential: number;
  claimed: number;
  deducted: number;
  onClaim: () => void;
}) {
  const invoiceNo = useMemo(
    () => 'TYC-' + Math.floor(100000 + Math.random() * 899999),
    [],
  );
  const date = useMemo(
    () =>
      new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );

  const [printing, setPrinting] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPrinting(false), 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="animate-pop w-full max-w-sm">
        {/* Ticket de papel térmico con animación de impresión */}
        <div
          className={`relative overflow-hidden bg-[#fdfbf4] font-mono text-[#1c1917] shadow-2xl ${
            printing ? 'animate-print' : ''
          }`}
        >
          <div className="px-7 pb-6 pt-2">
            <div className="text-center">
              <div className="text-xl font-black tracking-[0.25em]">TYCOON&nbsp;INC.</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-[#78716c]">
                Recibo de producción offline
              </div>
            </div>

            <div className="my-3 border-t-2 border-dashed border-[#b8b0a0]" />

            <div className="flex items-center justify-between text-[11px] text-[#57534e]">
              <span>FACTURA&nbsp;#{invoiceNo}</span>
              <span>{date}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#57534e]">
              <span>Periodo ausente</span>
              <span className="font-bold text-[#1c1917]">{formatTime(ms)}</span>
            </div>

            <div className="my-3 border-t-2 border-dashed border-[#b8b0a0]" />

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span>Producción bruta</span>
                <span className="tabular-nums font-semibold">{formatMoney(potential)}</span>
              </div>
              {msAtFull > 0 && (
                <div className="flex items-center justify-between">
                  <span>Primeras 24h al 25%</span>
                  <span className="tabular-nums">{formatTime(msAtFull)}</span>
                </div>
              )}
              {msAtReduced > 0 && (
                <div className="flex items-center justify-between text-[#b45309]">
                  <span>Tras 24h al 3%</span>
                  <span className="tabular-nums">{formatTime(msAtReduced)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[#b91c1c]">
                <span>Comisión de gestión</span>
                <span className="tabular-nums">−{formatMoney(deducted)}</span>
              </div>
            </div>

            <div className="my-3 border-t-2 border-double border-[#1c1917]" />

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#78716c]">
                  Neto a cobrar · 25%
                </div>
                <div className="text-3xl font-black tabular-nums">{formatMoney(claimed)}</div>
              </div>
              <div className="rotate-6 rounded border-2 border-[#15803d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                Pagado
              </div>
            </div>

            <div
              className="mt-4 h-9 w-full opacity-80"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #1c1917 0 2px, transparent 2px 4px, #1c1917 4px 5px, transparent 5px 9px, #1c1917 9px 12px, transparent 12px 14px)',
              }}
            />
            <div className="mt-1 text-center text-[9px] tracking-[0.4em] text-[#57534e]">
              {invoiceNo}
            </div>

            <div className="mt-3 border-t-2 border-dashed border-[#b8b0a0]" />
            <p className="mt-2 text-center text-[9px] leading-relaxed text-[#78716c]">
              *Tus negocios operaron sin supervisión. Se retiene el 75% en concepto de
              gestión automática. ¡Gracias por confiar en Tycoon Inc.!
            </p>
          </div>

          {/* borde dentado inferior */}
          <div
            className="h-3 w-full bg-[#fdfbf4]"
            style={{
              maskImage: 'radial-gradient(circle at 6px 12px, transparent 6px, black 6.5px)',
              maskSize: '16px 12px',
              maskRepeat: 'repeat-x',
              WebkitMaskImage: 'radial-gradient(circle at 6px 12px, transparent 6px, black 6.5px)',
              WebkitMaskSize: '16px 12px',
              WebkitMaskRepeat: 'repeat-x',
            }}
          />
        </div>

        <button
          onClick={onClaim}
          className="animate-pulse-ring mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
        >
          Cobrar {formatMoney(claimed)}
        </button>
      </div>
    </div>
  );
}