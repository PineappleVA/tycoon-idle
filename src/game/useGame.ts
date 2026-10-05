import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COMBO_BONUS_PER,
  COMBO_MAX,
  COMBO_WINDOW_MS,
  CRIT_CHANCE,
  CRIT_MULT,
  FEVER_MS,
  FEVER_MULT,
  LUCK_LIFE_MS,
  LUCK_MAX_MS,
  LUCK_MIN_MS,
  MANAGER_TICK_MS,
  MIDAS_MS,
  MIDAS_TAP_MULT,
  WINDFALL_SECONDS,
  MAX_TOASTS,
  OFFLINE_MIN_MS,
  SAVE_INTERVAL_MS,
  SAVE_KEY,
  SAVE_VERSION,
  TICK_MS,
  TOAST_MS,
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
  dismissOffline as dismissOfflinePure,
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
  businessDef,
  applyHellFall,
  applyPortalRebirth,
  currencyFromEarned,
  type AscensionOutcome,
  type TierLevel,
} from './logic';

export type BuyAmount = 1 | 10 | 100 | 1000 | 'max';

export type BuffKind = 'fever' | 'midas';

export interface Buff {
  kind: BuffKind;
  mult: number;
  /** Instante (Date.now) en que caduca. Son de sesión: no se guardan. */
  until: number;
}

/** Recompensa del maletín de suerte. */
export type LuckReward = 'fever' | 'midas' | 'windfall';

export interface TapFx {
  /** Multiplicador total aplicado (combo x crítico x buffs). */
  mult: number;
  crit: boolean;
  combo: number;
}

/** Negocio que usa el panel de debug para fijar un ingreso objetivo. */
const DEBUG_BUSINESS = 'lemonade';

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
  /* Buffs de sesión (Fiebre, Midas)                                 */
  /* -------------------------------------------------------------- */
  // No viven en GameState a propósito: son efímeros y no deben colarse en la
  // partida guardada ni en los logros, que siguen siendo puros.
  const buffsRef = useRef<Buff[]>([]);
  const [buffs, setBuffs] = useState<Buff[]>([]);

  const buffMult = useCallback((kind: BuffKind) => {
    const now = Date.now();
    let m = 1;
    for (const b of buffsRef.current) if (b.kind === kind && b.until > now) m *= b.mult;
    return m;
  }, []);

  const addBuff = useCallback((kind: BuffKind, mult: number, ms: number) => {
    const now = Date.now();
    const next = [...buffsRef.current.filter((b) => b.until > now), { kind, mult, until: now + ms }];
    buffsRef.current = next;
    setBuffs(next);
  }, []);

  // Poda los caducados para que la barra de buffs no muestre fantasmas.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      if (buffsRef.current.some((b) => b.until <= now)) {
        const next = buffsRef.current.filter((b) => b.until > now);
        buffsRef.current = next;
        setBuffs(next);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  /* -------------------------------------------------------------- */
  /* Combo y críticos: que tocar rápido y seguido tenga premio        */
  /* -------------------------------------------------------------- */
  const comboRef = useRef(0);
  const lastTapAt = useRef(0);
  const [combo, setCombo] = useState(0);
  const [tapFx, setTapFx] = useState<TapFx | null>(null);

  /* -------------------------------------------------------------- */
  /* Maletín de suerte                                               */
  /* -------------------------------------------------------------- */
  const luckRef = useRef(false);
  const [luck, setLuck] = useState(false);
  const [lastLuck, setLastLuck] = useState<LuckReward | null>(null);

  /* -------------------------------------------------------------- */
  // Ingresos con delta-time real: si el navegador retrasa el intervalo,
  // el dinero no se pierde.
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setState((s) => tickIncome(s, delta, buffMult('fever')));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [buffMult]);

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

  // Los temporizadores de cierre NO pueden devolverse como cleanup de este
  // efecto: `newlyUnlocked` se recalcula en cada tick, así que el cleanup se
  // ejecutaba a los 200 ms y borraba el cierre antes de que se disparara.
  // Se guardan en un ref y sólo se limpian al desmontar.
  const toastTimers = useRef<number[]>([]);

  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    for (const a of newlyUnlocked) unlockedRef.current.add(a.id);
    // Se limita la cola: si caen muchos logros a la vez no deben tapar el juego.
    setToasts((t) => [...t, ...newlyUnlocked].slice(-MAX_TOASTS));
    for (const a of newlyUnlocked) {
      toastTimers.current.push(
        window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== a.id)), TOAST_MS),
      );
    }
  }, [newlyUnlocked]);

  useEffect(() => {
    const timers = toastTimers;
    return () => timers.current.forEach(window.clearTimeout);
  }, []);

  /* -------------------------------------------------------------- */
  /* Acciones                                                        */
  /* -------------------------------------------------------------- */
  const tap = useCallback(() => {
    const now = Date.now();
    // El combo sólo sube si encadenas toques dentro de la ventana.
    const next =
      now - lastTapAt.current <= COMBO_WINDOW_MS ? Math.min(COMBO_MAX, comboRef.current + 1) : 1;
    comboRef.current = next;
    lastTapAt.current = now;
    setCombo(next);

    const crit = Math.random() < CRIT_CHANCE;
    const mult = (1 + (next - 1) * COMBO_BONUS_PER) * (crit ? CRIT_MULT : 1) * buffMult('midas');
    const fx: TapFx = { mult, crit, combo: next };
    setTapFx(fx);
    setState((s) => applyTap(s, mult));
    // Se devuelve para que el panel pinte el número exacto de ESE toque: si lo
    // leyera del estado llegaría un render tarde.
    return fx;
  }, [buffMult]);

  // El combo decae en cuanto dejas de tocar.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (comboRef.current > 0 && Date.now() - lastTapAt.current > COMBO_WINDOW_MS) {
        comboRef.current = 0;
        setCombo(0);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  /**
   * El maletín aparece cada cierto tiempo y se va si no lo pillas. Es el gancho
   * clásico de los idle: una razón para mirar la pantalla en vez de dejarla
   * corriendo en segundo plano.
   */
  useEffect(() => {
    const roll = () => LUCK_MIN_MS + Math.random() * (LUCK_MAX_MS - LUCK_MIN_MS);
    let life = 0;
    let timer = 0;
    const appear = () => {
      luckRef.current = true;
      setLuck(true);
      life = window.setTimeout(() => {
        luckRef.current = false;
        setLuck(false);
      }, LUCK_LIFE_MS);
      timer = window.setTimeout(appear, roll());
    };
    timer = window.setTimeout(appear, roll());
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(life);
    };
  }, []);

  /** Recoge el maletín. Devuelve la recompensa para que la UI la celebre. */
  const grabLuck = useCallback(() => {
    if (!luckRef.current) return null;
    luckRef.current = false;
    setLuck(false);
    const r = Math.random();
    const reward: LuckReward = r < 0.4 ? 'fever' : r < 0.75 ? 'midas' : 'windfall';
    if (reward === 'fever') addBuff('fever', FEVER_MULT, FEVER_MS);
    else if (reward === 'midas') addBuff('midas', MIDAS_TAP_MULT, MIDAS_MS);
    else setState((s) => earn(s, totalIncome(s) * WINDFALL_SECONDS));
    setLastLuck(reward);
    return reward;
  }, [addBuff]);

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

  // Se calcula fuera del updater y se persiste en el acto: si sólo se
  // actualizara el estado, habría hasta 5s (el intervalo de autoguardado) en
  // los que un cierre del navegador dejaría el recibo sin consumir en disco y
  // se cobraría dos veces al recargar.
  const claimOffline = useCallback(() => {
    if (!offline) return;
    const next = claimOfflinePure(stateRef.current, offline);
    setState(next);
    persist(next);
    setOffline(null);
  }, [offline]);

  const dismissOffline = useCallback(() => {
    const next = dismissOfflinePure(stateRef.current);
    setState(next);
    persist(next);
    setOffline(null);
  }, []);

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
  /**
   * Ajusta el ingreso por segundo al objetivo indicado subiendo el nivel de
   * mejora de la Limonada. Tiene en cuenta el resto de negocios, las parcelas
   * y el multiplicador de prestigio, así que el resultado es el que se pide.
   */
  const debugSetIncome = useCallback((perSec: number) => {
    setState((s) => {
      const target = Math.max(0, Number.isFinite(perSec) ? perSec : 0);
      const def = businessDef(DEBUG_BUSINESS);
      if (!def) return s;

      const withLemonade = (count: number, level: number): GameState => ({
        ...s,
        businesses: { ...s.businesses, [DEBUG_BUSINESS]: count },
        upgrades: { ...s.upgrades, [DEBUG_BUSINESS]: level },
      });

      if (target <= 0) return withLemonade(0, 0);

      /**
       * El ingreso total es monótono no decreciente respecto a las "unidades
       * efectivas" de limonada (unidades x 2^nivel): más unidades suben la base
       * y, como mucho, desbloquean logros que suben el multiplicador. Se busca
       * por bisección el valor que alcanza el objetivo y luego se elige la
       * factorización unidades/nivel que menos se desvía.
       *
       * Antes se despejaba el nivel con un logaritmo y un multiplicador fijo, y
       * fallaba dos veces: el redondeo del log2 daba saltos de x1,6 (pedir
       * 10.000 -> 13.107) y el bonus de logros cambiaba al cambiar las unidades
       * (pedir 10.000 -> 11.200).
       */
      let lo = 0;
      let hi = 1;
      while (hi < 1e15 && totalIncome(withLemonade(hi, 0)) < target) hi *= 2;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (totalIncome(withLemonade(mid, 0)) < target) lo = mid + 1;
        else hi = mid;
      }
      // `lo` es el primer valor que alcanza el objetivo; se compara con el
      // anterior y se escoge el que quede más cerca.
      const below = Math.max(0, lo - 1);
      const k =
        Math.abs(totalIncome(withLemonade(below, 0)) - target) <
        Math.abs(totalIncome(withLemonade(lo, 0)) - target)
          ? below
          : lo;

      let best = { count: k, level: 0, err: Math.abs(totalIncome(withLemonade(k, 0)) - target) };
      for (let level = 1; level <= 50; level++) {
        const count = Math.max(1, Math.round(k / Math.pow(2, level)));
        const err = Math.abs(totalIncome(withLemonade(count, level)) - target);
        if (err < best.err) best = { count, level, err };
      }

      return withLemonade(best.count, best.level);
    });
  }, []);

  const income = useMemo(() => totalIncome(state), [state]);
  const tapWorth = useMemo(() => tapValue(state), [state]);

  return {
    state,
    income,
    tapWorth,
    combo,
    tapFx,
    buffs,
    luck,
    lastLuck,
    grabLuck,
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
