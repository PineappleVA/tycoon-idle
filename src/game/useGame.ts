import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MANAGER_TICK_MS,
  OFFLINE_MIN_MS,
  SAVE_INTERVAL_MS,
  SAVE_KEY,
  SAVE_VERSION,
  TICK_MS,
} from './balance';
import { ACHIEVEMENTS, type Achievement } from './achievements';
import {
  applyTap,
  assignPlot as assignPlotPure,
  buyBusiness,
  canRebirth,
  claimOffline as claimOfflinePure,
  computeOffline,
  DEFAULT_STATE,
  earn,
  type GameState,
  hasFunction,
  type OfflineResult,
  purchaseShopItem,
  randomSouls,
  resolveAscension,
  runManagers,
  sanitizeState,
  tapValue,
  tickIncome,
  toggleAutomation as toggleAutomationPure,
  totalIncome,
  upgradeBusiness,
  upgradeTap as upgradeTapPure,
  applyAlienRebirth,
  applyHeaven,
  applyHellFall,
  applyPortalRebirth,
  currencyFromEarned,
  type AscensionOutcome,
  type TierLevel,
} from './logic';

export type BuyAmount = 1 | 10 | 100 | 1000 | 'max';

const TOAST_MS = 4_500;

function persist(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSave: Date.now(), version: SAVE_VERSION }));
  } catch {
    /* cuota llena o modo privado: se ignora */
  }
}

function loadState(): { state: GameState; offline: OfflineResult | null } {
  let state = DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = sanitizeState(JSON.parse(raw));
  } catch {
    state = DEFAULT_STATE;
  }
  const offline = computeOffline(state, Date.now());
  return { state, offline: offline && offline.ms >= OFFLINE_MIN_MS ? offline : null };
}

export interface RebirthResult {
  outcome: AscensionOutcome | null;
  soulsGained: number;
}

export function useGame() {
  const initialRef = useRef<{ state: GameState; offline: OfflineResult | null } | null>(null);
  if (initialRef.current === null) initialRef.current = loadState();

  const [state, setState] = useState<GameState>(initialRef.current.state);
  const [offline, setOffline] = useState<OfflineResult | null>(initialRef.current.offline);
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [toasts, setToasts] = useState<Achievement[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const unlockedRef = useRef<Set<string>>(
    new Set(ACHIEVEMENTS.filter((a) => a.done(initialRef.current!.state)).map((a) => a.id)),
  );

  /* -------------------------------------------------------------- */
  /* Guardado                                                        */
  /* -------------------------------------------------------------- */
  // Ningún efecto secundario dentro de los updaters de setState: se guarda
  // desde un intervalo y al ocultar la pestaña, leyendo siempre stateRef.
  useEffect(() => {
    const id = window.setInterval(() => persist(stateRef.current), SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const saveNow = () => persist(stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveNow();
    };
    window.addEventListener('beforeunload', saveNow);
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      window.removeEventListener('pagehide', saveNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* Bucles de juego                                                 */
  /* -------------------------------------------------------------- */
  // Ingresos con delta-time real: si el navegador retrasa el intervalo,
  // el dinero no se pierde.
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setState((s) => tickIncome(s, delta));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Mánagers: compran unidades (y mejoras con el Capataz Infernal).
  useEffect(() => {
    const id = window.setInterval(() => setState(runManagers), MANAGER_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Autotap: el robot toca por ti cada segundo.
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => (hasFunction(s, 'autotap') ? applyTap(s) : s));
    }, 1_000);
    return () => window.clearInterval(id);
  }, []);

  /* -------------------------------------------------------------- */
  /* Logros                                                          */
  /* -------------------------------------------------------------- */
  const newlyUnlocked = useMemo(
    () => ACHIEVEMENTS.filter((a) => !unlockedRef.current.has(a.id) && a.done(state)),
    [state],
  );

  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    for (const a of newlyUnlocked) unlockedRef.current.add(a.id);
    setToasts((t) => [...t, ...newlyUnlocked]);
    const timers = newlyUnlocked.map((a) =>
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== a.id)), TOAST_MS),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [newlyUnlocked]);

  /* -------------------------------------------------------------- */
  /* Acciones                                                        */
  /* -------------------------------------------------------------- */
  const tap = useCallback(() => setState(applyTap), []);

  const buy = useCallback(
    (id: string) =>
      setState((s) => buyBusiness(s, id, buyAmount) ?? s),
    [buyAmount],
  );

  const upgrade = useCallback(
    (id: string, amount = 1) => setState((s) => upgradeBusiness(s, id, amount) ?? s),
    [],
  );

  const upgradeTap = useCallback(() => setState((s) => upgradeTapPure(s) ?? s), []);

  const toggleAutomation = useCallback(
    (id: string) => setState((s) => toggleAutomationPure(s, id) ?? s),
    [],
  );

  const buyShopItem = useCallback(
    (itemId: string) => setState((s) => purchaseShopItem(s, itemId) ?? s),
    [],
  );

  const assignPlot = useCallback(
    (plotIndex: number, businessId: string | null) =>
      setState((s) => assignPlotPure(s, plotIndex, businessId) ?? s),
    [],
  );

  const claimOffline = useCallback(() => {
    if (!offline) return;
    setState((s) => claimOfflinePure(s, offline));
    setOffline(null);
  }, [offline]);

  const dismissOffline = useCallback(() => setOffline(null), []);

  const markAlienDialogSeen = useCallback(
    () => setState((s) => (s.alienDialogSeen ? s : { ...s, alienDialogSeen: true })),
    [],
  );

  /**
   * Ejecuta un renacimiento. Para el nivel 3 devuelve el destino real
   * (Cielo/Infierno) y las Almas ganadas, que la UI necesita para la animación.
   *
   * Todo el cálculo ocurre en funciones puras de logic.ts; aquí sólo se aplica
   * el resultado. `playerChoice` se usa cuando La Balanza está desbloqueada.
   */
  const rebirthTier = useCallback(
    (level: TierLevel, playerChoice?: AscensionOutcome): RebirthResult => {
      const s = stateRef.current;
      const result: RebirthResult = { outcome: null, soulsGained: 0 };

      if (!canRebirth(s, level)) return result;
      const gained = currencyFromEarned(level, s.totalEarned);
      const keepManagers = hasFunction(s, 'permanent_managers');

      let next: GameState;
      if (level === 3) {
        const outcome = resolveAscension(s, playerChoice);
        result.outcome = outcome;
        if (outcome === 'hell') {
          result.soulsGained = randomSouls();
          next = applyHellFall(s, result.soulsGained);
        } else {
          next = applyHeaven(s, gained, keepManagers);
        }
      } else if (level === 1) {
        next = applyAlienRebirth(s, gained, keepManagers);
      } else {
        next = applyPortalRebirth(s, gained, keepManagers);
      }

      persist(next);
      setState(next);
      return result;
    },
    [],
  );

  const reset = useCallback(() => {
    const fresh: GameState = { ...DEFAULT_STATE, lastSave: Date.now(), runStartedAt: Date.now() };
    persist(fresh);
    unlockedRef.current = new Set();
    setToasts([]);
    setOffline(null);
    setState(fresh);
  }, []);

  /* -------------------------------------------------------------- */
  /* Debug (Ctrl+Shift+D)                                            */
  /* -------------------------------------------------------------- */
  const debugAddCash = useCallback(
    (amount: number) => setState((s) => earn(s, amount)),
    [],
  );
  const debugAddCurrency = useCallback(
    (key: 'crystals' | 'stars' | 'souls' | 'investors', amount = 1) =>
      setState((s) =>
        key === 'investors'
          ? { ...s, investors: s.investors + amount, investorsClaimed: s.investorsClaimed + amount }
          : { ...s, [key]: s[key] + amount },
      ),
    [],
  );
  const debugSetIncome = useCallback(
    (perSec: number) =>
      setState((s) => ({
        ...s,
        // Fuerza un ingreso objetivo subiendo el nivel de mejora del primer negocio.
        upgrades: { ...s.upgrades, lemonade: Math.max(0, Math.round(Math.log2(perSec || 1))) },
        businesses: { ...s.businesses, lemonade: Math.max(1, s.businesses.lemonade ?? 1) },
      })),
    [],
  );

  const income = useMemo(() => totalIncome(state), [state]);
  const tapWorth = useMemo(() => tapValue(state), [state]);

  return {
    state,
    income,
    tapWorth,
    offline,
    buyAmount,
    setBuyAmount,
    toasts,
    tap,
    buy,
    upgrade,
    upgradeTap,
    toggleAutomation,
    buyShopItem,
    assignPlot,
    claimOffline,
    dismissOffline,
    markAlienDialogSeen,
    rebirthTier,
    reset,
    debugAddCash,
    debugAddCurrency,
    debugSetIncome,
  };
}

export type GameApi = ReturnType<typeof useGame>;
