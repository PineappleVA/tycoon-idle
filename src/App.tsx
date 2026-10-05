import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OFFLINE_REDUCED_RATE } from './game/balance';
import { ACHIEVEMENTS } from './game/achievements';
import {
  businessDef,
  type AscensionOutcome,
  offlineCapMs,
  resolveAscension,
  type TierLevel,
} from './game/logic';
import { useGame } from './game/useGame';
import { TABS, type TabId } from './game/tabs';
import { TOURS, TOURS_KEY, type TourDef } from './game/tours';

import { AchievementsTab } from './components/AchievementsTab';
import { AlienDialog, GodDialog, HellDialog } from './components/AlienDialog';
import { Background } from './components/Background';
import { BusinessDetail } from './components/BusinessDetail';
import { BusinessTab } from './components/BusinessTab';
import { DebugPanel } from './components/DebugPanel';
import { OfflineInvoice } from './components/OfflineInvoice';
import { QuickStats } from './components/QuickStats';
import { RebirthAnimation } from './components/RebirthAnimation';
import { RebirthTab } from './components/RebirthTab';
import { StatsTab } from './components/StatsTab';
import { TabBar } from './components/TabBar';
import { TapPanel } from './components/TapPanel';
import { Toasts } from './components/Toasts';
import { TopBar } from './components/TopBar';
import { Tutorial } from './components/Tutorial';
import { UpgradesTab } from './components/UpgradesTab';

const DEBUG_HOTKEY = 'D';
const TOUR_START_DELAY_MS = 400;
const DIALOG_DELAY_MS = 150;

export default function App() {
  const game = useGame();
  const { state } = game;

  const [tab, setTab] = useState<TabId>('business');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  const [rebirthAnim, setRebirthAnim] = useState<TierLevel | null>(null);
  const rebirthAnimRef = useRef<TierLevel | null>(null);
  const pendingOutcome = useRef<AscensionOutcome | null>(null);
  const lastAlienGained = useRef(0);

  const [godDialog, setGodDialog] = useState(false);
  const [hellDialog, setHellDialog] = useState(false);
  const [heavenVisitCount, setHeavenVisitCount] = useState(0);
  const [hellFallCount, setHellFallCount] = useState(0);
  const [lastSoulsGained, setLastSoulsGained] = useState(0);

  const [activeTour, setActiveTour] = useState<TourDef | null>(null);
  const seenToursRef = useRef<Set<string>>(new Set());
  const tapRef = useRef<HTMLButtonElement>(null);

  /* ---------------- Pestañas ---------------- */
  const achievementsDone = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.done(state)).length,
    [state],
  );
  const visibleTabs = useMemo(
    () => TABS.filter((t) => t.unlocked(state, achievementsDone)),
    [state, achievementsDone],
  );

  // Si la pestaña activa deja de estar disponible, vuelve a Negocios.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab('business');
  }, [visibleTabs, tab]);

  /* ---------------- Tours ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TOURS_KEY);
      if (raw) seenToursRef.current = new Set(JSON.parse(raw) as string[]);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  useEffect(() => {
    if (activeTour) return;
    const t = window.setTimeout(() => {
      const candidate = TOURS.find(
        (tour) =>
          !seenToursRef.current.has(tour.id) &&
          tour.when(state, achievementsDone) &&
          (!tour.requires || document.querySelector(tour.requires)),
      );
      if (candidate) setActiveTour(candidate);
    }, TOUR_START_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [state, achievementsDone, activeTour]);

  const finishTour = useCallback(() => {
    const current = activeTour;
    setActiveTour(null);
    if (!current) return;
    seenToursRef.current.add(current.id);
    try {
      localStorage.setItem(TOURS_KEY, JSON.stringify([...seenToursRef.current]));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [activeTour]);

  /* ---------------- Renacimiento ---------------- */
  // El destino se decide AQUÍ, una sola vez, para que la animación que se ve
  // sea exactamente lo que ocurre al aplicar la transición.
  const doRebirth = useCallback(
    (level: TierLevel, choice?: AscensionOutcome) => {
      if (level === 3) {
        pendingOutcome.current = resolveAscension(state, choice);
      } else {
        pendingOutcome.current = null;
        if (level === 1) lastAlienGained.current = 0;
      }
      rebirthAnimRef.current = level;
      setRebirthAnim(level);
    },
    [state],
  );

  const finishRebirthAnim = useCallback(() => {
    const level = rebirthAnimRef.current;
    if (level === null) return;
    rebirthAnimRef.current = null;
    setRebirthAnim(null);

    if (level === 3 && pendingOutcome.current) {
      const outcome = pendingOutcome.current;
      pendingOutcome.current = null;
      const result = game.rebirthTier(3, outcome);
      if (result.outcome === 'heaven') {
        setHeavenVisitCount((v) => v + 1);
        window.setTimeout(() => setGodDialog(true), DIALOG_DELAY_MS);
      } else {
        setHellFallCount((v) => v + 1);
        setLastSoulsGained(result.soulsGained);
        window.setTimeout(() => setHellDialog(true), DIALOG_DELAY_MS);
      }
    } else {
      game.rebirthTier(level);
    }
  }, [game]);

  /* ---------------- Panel de debug ---------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === DEBUG_HOTKEY) {
        e.preventDefault();
        setDebugMode((d) => !d);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const offline = game.offline;
  const capHours = Math.round(offlineCapMs(state) / 3_600_000);
  const selectedDef = selectedBusiness ? businessDef(selectedBusiness) : null;

  return (
    <div className="relative min-h-screen text-slate-100">
      <Background />
      <Toasts toasts={game.toasts} />

      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <TopBar state={state} income={game.income} onOpenRebirth={() => setTab('rebirth')} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <TapPanel ref={tapRef} onTap={game.tap} tapWorth={game.tapWorth} income={game.income} tapLevel={state.tapLevel} />
            <QuickStats state={state} income={game.income} />
          </div>

          <div className="min-w-0">
            <TabBar tab={tab} setTab={setTab} tabs={visibleTabs} achievementsDone={achievementsDone} />
            {/* key={tab} reinicia la animación de entrada al cambiar de pestaña */}
            <div key={tab} className="animate-rise mt-4">
              {tab === 'business' && <BusinessTab game={game} onBusinessSelect={setSelectedBusiness} />}
              {tab === 'upgrades' && <UpgradesTab game={game} />}
              {tab === 'rebirth' && <RebirthTab game={game} onRebirth={doRebirth} />}
              {tab === 'stats' && <StatsTab game={game} />}
              {tab === 'achievements' && <AchievementsTab state={state} />}
            </div>
          </div>
        </div>
      </div>

      {offline && (
        <OfflineInvoice
          ms={offline.ms}
          msAtFull={offline.msAtFull}
          msAtReduced={offline.msAtReduced}
          potential={offline.potential}
          claimed={offline.claimed}
          deducted={offline.deducted}
          capHours={capHours}
          reducedPct={Math.round(OFFLINE_REDUCED_RATE * 100)}
          onClaim={game.claimOffline}
          onDismiss={game.dismissOffline}
        />
      )}

      {activeTour && (
        <Tutorial steps={activeTour.steps} label={activeTour.label} accent={activeTour.accent} onFinish={finishTour} />
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
                  investors: state.investors - state.investorsSpent,
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
        <HellDialog fallCount={hellFallCount} soulsGained={lastSoulsGained} onDismiss={() => setHellDialog(false)} />
      )}

      {selectedDef && (
        <BusinessDetail game={game} def={selectedDef} onClose={() => setSelectedBusiness(null)} />
      )}

      {debugMode && <DebugPanel game={game} onClose={() => setDebugMode(false)} />}

      {rebirthAnim !== null && (
        <RebirthAnimation
          level={rebirthAnim}
          skyOutcome={pendingOutcome.current}
          portalRebirths={state.tier2}
          onDone={finishRebirthAnim}
        />
      )}
    </div>
  );
}
