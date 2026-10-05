import { useCallback, useEffect, useRef, useState } from 'react';
import { BUSINESSES, DIABOLIC_ITEMS, OFFLINE_MIN_MS, SHOP_ITEMS, TAP_BASE_COST } from './data';
import { ACHIEVEMENTS, Achievement } from './achievements';
import {
  accrueInvestors,
  applyAlienRebirth,
  applyHeaven,
  applyHellFall,
  applyPortalRebirth,
  automationUnlocked,
  bulkCost,
  bulkUpgradeCost,
  businessCount,
  businessUpgrade,
  computeOffline,
  costOf,
  currencyFromEarned,
  DEFAULT_STATE,
  GameState,
  hasFunction,
  HEAVEN_CHANCE,
  isAutomated,
  managerCost,
  maxAffordable,
  randomSouls,
  investorClaimFloor,
  totalPlots,
  OfflineResult,
  REBIRTH_TIERS,
  tapUpgradeCost,
  tapValue,
  TierLevel,
  totalIncome,
  upgradeCostOf,
} from './logic';

export type BuyAmount = 1 | 10 | 100 | 1000 | 'max';

const SAVE_KEY = 'tycoon-save-v1';
const TICK_MS = 100;
const SAVE_INTERVAL_MS = 5000;

function loadState(): { state: GameState; offline: OfflineResult | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: { ...DEFAULT_STATE }, offline: null };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const lifetime = parsed.lifetimeEarned ?? parsed.totalEarned ?? 0;
    const state: GameState = {
      cash: parsed.cash ?? 0,
      totalEarned: parsed.totalEarned ?? 0,
      taps: parsed.taps ?? 0,
      tapLevel: parsed.tapLevel ?? 0,
      businesses: parsed.businesses ?? {},
      upgrades: parsed.upgrades ?? {},
      lastSave: parsed.lastSave ?? Date.now(),
      rebirths: parsed.rebirths ?? 0,
      ingots: parsed.ingots ?? 0,
      crystals: parsed.crystals ?? 0,
      stars: parsed.stars ?? 0,
      tier1: parsed.tier1 ?? parsed.rebirths ?? 0,
      tier2: parsed.tier2 ?? 0,
      tier3: parsed.tier3 ?? 0,
      lifetimeEarned: lifetime,
      plots: parsed.plots ?? 0,
      alienDialogSeen: parsed.alienDialogSeen ?? false,
      automated: parsed.automated ?? {},
      shopUpgrades: parsed.shopUpgrades ?? {},
      plotAssignments: parsed.plotAssignments ?? {},
      investors: parsed.investors ?? 0,
      // Sanea partidas antiguas cuyo contador quedó por debajo del suelo.
      investorsClaimed: investorClaimFloor({
        lifetimeEarned: lifetime,
        investorsClaimed: parsed.investorsClaimed ?? 0,
      }),
      investorsSpent: parsed.investorsSpent ?? 0,
      heavenReached: parsed.heavenReached ?? false,
      hellFalls: parsed.hellFalls ?? 0,
      souls: parsed.souls ?? 0,
    };
    const offline = computeOffline(state, Date.now());
    if (offline && offline.ms < OFFLINE_MIN_MS) return { state, offline: null };
    return { state, offline };
  } catch {
    return { state: { ...DEFAULT_STATE }, offline: null };
  }
}

function persist(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function useGame() {
  const initialRef = useRef<{ state: GameState; offline: OfflineResult | null } | null>(null);
  if (initialRef.current === null) {
    initialRef.current = loadState();
  }

  const [state, setState] = useState<GameState>(initialRef.current.state);
  const [offline, setOffline] = useState<OfflineResult | null>(initialRef.current.offline);
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [toasts, setToasts] = useState<Achievement[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const unlockedRef = useRef<Set<string>>(
    new Set(ACHIEVEMENTS.filter((a) => a.done(initialRef.current!.state)).map((a) => a.id)),
  );

  // Watch for newly completed achievements and push toasts
  useEffect(() => {
    const newly: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!unlockedRef.current.has(a.id) && a.done(state)) {
        unlockedRef.current.add(a.id);
        newly.push(a);
      }
    }
    if (newly.length) {
      setToasts((t) => [...t, ...newly]);
      newly.forEach((a) => {
        window.setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== a.id));
        }, 4500);
      });
    }
  }, [state]);

  // Income tick + investor accrual
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const inc = totalIncome(s) * (TICK_MS / 1000);
        if (inc <= 0) return s;
        const newLifetime = s.lifetimeEarned + inc;
        return {
          ...s,
          cash: s.cash + inc,
          totalEarned: s.totalEarned + inc,
          lifetimeEarned: newLifetime,
          ...accrueInvestors(s, newLifetime),
        };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Auto-buy loop for automated businesses (+ auto-upgrade si tienes "Capataz Infernal")
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!automationUnlocked(stateRef.current)) return;
      setState((s) => {
        let next = { ...s };
        let changed = false;
        const foreman = hasFunction(next, 'foreman_upgrade');
        for (const def of BUSINESSES) {
          if (!isAutomated(next, def.id)) continue;
          if (next.totalEarned < def.unlockAt) continue;
          const count = businessCount(next, def.id);
          const price = costOf(def, count);
          if (next.cash >= price) {
            next = {
              ...next,
              cash: next.cash - price,
              businesses: { ...next.businesses, [def.id]: count + 1 },
            };
            changed = true;
          }
          // El Capataz Infernal también compra mejoras automáticamente.
          if (foreman && businessCount(next, def.id) > 0) {
            const level = businessUpgrade(next, def.id);
            const upPrice = upgradeCostOf(def, level);
            if (next.cash >= upPrice) {
              next = {
                ...next,
                cash: next.cash - upPrice,
                upgrades: { ...next.upgrades, [def.id]: level + 1 },
              };
              changed = true;
            }
          }
        }
        return changed ? next : s;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-tap: si se desbloqueó la función "autotap", toca automáticamente cada segundo.
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        if (!hasFunction(s, 'autotap')) return s;
        const v = tapValue(s);
        return {
          ...s,
          cash: s.cash + v,
          totalEarned: s.totalEarned + v,
          lifetimeEarned: s.lifetimeEarned + v,
          taps: s.taps + 1,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Periodic autosave
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const next = { ...s, lastSave: Date.now() };
        persist(next);
        return next;
      });
    }, SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Save on tab hide / close so the offline timer is accurate
  useEffect(() => {
    const saveNow = () => {
      const next = { ...stateRef.current, lastSave: Date.now() };
      persist(next);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveNow();
    };
    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const tap = useCallback(() => {
    setState((s) => {
      const v = tapValue(s);
      return {
        ...s,
        cash: s.cash + v,
        totalEarned: s.totalEarned + v,
        lifetimeEarned: s.lifetimeEarned + v,
        taps: s.taps + 1,
      };
    });
  }, []);

  const buy = useCallback(
    (id: string) => {
      setState((s) => {
        const def = BUSINESSES.find((b) => b.id === id);
        if (!def) return s;
        const count = businessCount(s, id);
        let amount =
          buyAmount === 'max' ? maxAffordable(def, count, s.cash) : buyAmount;
        if (amount <= 0) return s;
        let price = bulkCost(def, count, amount);
        // safety clamp for rounding
        while (amount > 0 && price > s.cash) {
          amount -= 1;
          price = bulkCost(def, count, amount);
        }
        if (amount <= 0) return s;
        return {
          ...s,
          cash: s.cash - price,
          businesses: { ...s.businesses, [id]: count + amount },
        };
      });
    },
    [buyAmount],
  );

  const upgrade = useCallback((id: string) => {
    setState((s) => {
      const def = BUSINESSES.find((b) => b.id === id);
      if (!def) return s;
      const count = businessCount(s, id);
      if (count <= 0) return s;
      const level = businessUpgrade(s, id);
      const price = upgradeCostOf(def, level);
      if (s.cash < price) return s;
      return {
        ...s,
        cash: s.cash - price,
        upgrades: { ...s.upgrades, [id]: level + 1 },
      };
    });
  }, []);

  /** Compra `amount` mejoras de golpe en una sola transacción (precio = suma real). */
  const upgradeBulk = useCallback((id: string, amount: number) => {
    setState((s) => {
      const def = BUSINESSES.find((b) => b.id === id);
      if (!def || amount <= 0) return s;
      if (businessCount(s, id) <= 0) return s;
      const level = businessUpgrade(s, id);
      const price = bulkUpgradeCost(def, level, amount);
      if (s.cash < price) return s;
      return {
        ...s,
        cash: s.cash - price,
        upgrades: { ...s.upgrades, [id]: level + amount },
      };
    });
  }, []);

  const upgradeTap = useCallback(() => {
    setState((s) => {
      const price = tapUpgradeCost(s.tapLevel);
      if (s.cash < price) return s;
      return { ...s, cash: s.cash - price, tapLevel: s.tapLevel + 1 };
    });
  }, []);

  const toggleAutomation = useCallback((id: string) => {
    setState((s) => {
      if (!automationUnlocked(s)) return s;
      const def = BUSINESSES.find((b) => b.id === id);
      if (!def || s.totalEarned < def.unlockAt) return s;
      const current = isAutomated(s, id);
      if (!current && s.cash < managerCost()) return s;
      return {
        ...s,
        cash: current ? s.cash : s.cash - managerCost(),
        automated: { ...s.automated, [id]: !current },
      };
    });
  }, []);

  const claimOffline = useCallback(() => {
    if (!offline) return;
    setState((s) => ({
      ...s,
      cash: s.cash + offline.claimed,
      totalEarned: s.totalEarned + offline.claimed,
      lifetimeEarned: s.lifetimeEarned + offline.claimed,
    }));
    setOffline(null);
  }, [offline]);

  const dismissOffline = useCallback(() => setOffline(null), []);

  // Devuelve el resultado del renacimiento (útil para el nivel 3: cielo/infierno)
  const rebirthTier = useCallback((level: TierLevel, forcedHeaven?: boolean): 'heaven' | 'hell' | null => {
    let outcome: 'heaven' | 'hell' | null = null;
    setState((s) => {
      const tier = REBIRTH_TIERS[level - 1];
      if (s.totalEarned < tier.requirement) return s;
      const gained = currencyFromEarned(level, s.totalEarned);
      if (gained <= 0) return s;

      // Los mánagers sólo sobreviven a un renacimiento normal si tienes "Contrato Eterno".
      // El Infierno SIEMPRE te los quita, sin excepción.
      const keepManagers = hasFunction(s, 'permanent_managers');

      // ---- NIVEL 3: EL CIELO — primer intento SIEMPRE es Cielo garantizado. ----
      // A partir del segundo intento: 25% Cielo / 75% Infierno.
      if (level === 3) {
        const isFirstAttempt = s.tier3 === 0;
        const wentHeaven = isFirstAttempt ? true : (forcedHeaven ?? Math.random() < HEAVEN_CHANCE);
        if (!wentHeaven) {
          outcome = 'hell';
          const fallen = applyHellFall(s, randomSouls());
          persist(fallen);
          return fallen;
        }
        outcome = 'heaven';
        const next = applyHeaven(s, gained, keepManagers);
        persist(next);
        return next;
      }

      // ---- NIVEL 1: ALIENÍGENAS — ganas Inversores ----
      if (level === 1) {
        const next = applyAlienRebirth(s, gained, keepManagers);
        persist(next);
        return next;
      }

      // ---- NIVEL 2: PORTAL — sacrificas Inversores, ganas Cristales ----
      const next = applyPortalRebirth(s, gained, keepManagers);
      persist(next);
      return next;
    });
    return outcome;
  }, []);

  /** Asigna (o desasigna con businessId = null) un negocio como "empleado" en una parcela. */
  const assignPlot = useCallback((plotIndex: number, businessId: string | null) => {
    setState((s) => {
      if (plotIndex < 0 || plotIndex >= totalPlots(s)) return s;
      const nextAssignments = { ...s.plotAssignments };
      if (businessId === null) {
        delete nextAssignments[plotIndex];
      } else {
        nextAssignments[plotIndex] = businessId;
      }
      const next = { ...s, plotAssignments: nextAssignments };
      persist(next);
      return next;
    });
  }, []);

  const markAlienDialogSeen = useCallback(() => {
    setState((s) => {
      const next = { ...s, alienDialogSeen: true };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = { ...DEFAULT_STATE, lastSave: Date.now() };
    persist(fresh);
    unlockedRef.current = new Set();
    setToasts([]);
    setOffline(null);
    setState(fresh);
  }, []);

  // Debug functions
  const debugAddCash = useCallback((amount: number) => {
    setState((s) => {
      const next = {
        ...s,
        cash: s.cash + amount,
        totalEarned: s.totalEarned + amount,
        lifetimeEarned: s.lifetimeEarned + amount,
      };
      persist(next);
      return next;
    });
  }, []);

  const debugAddIngot = useCallback(() => {
    setState((s) => {
      const next = { ...s, ingots: s.ingots + 1 };
      persist(next);
      return next;
    });
  }, []);

  const debugAddCrystal = useCallback(() => {
    setState((s) => {
      const next = { ...s, crystals: s.crystals + 1 };
      persist(next);
      return next;
    });
  }, []);

  const debugAddStar = useCallback(() => {
    setState((s) => {
      const next = { ...s, stars: s.stars + 1 };
      persist(next);
      return next;
    });
  }, []);

  const debugAddInvestor = useCallback(() => {
    setState((s) => {
      const next = { ...s, investors: s.investors + 1, investorsClaimed: s.investorsClaimed + 1 };
      persist(next);
      return next;
    });
  }, []);

  // Compra ÚNICA de una función (no da bonus numérico, sólo desbloquea mecánicas).
  const buyShopItem = useCallback((itemId: string) => {
    setState((s) => {
      const item = [...SHOP_ITEMS, ...DIABOLIC_ITEMS].find((x) => x.id === itemId);
      if (!item) return s;
      // Ya comprado: es una función permanente, no se puede volver a comprar.
      if ((s.shopUpgrades[itemId] ?? 0) > 0) return s;

      let next: GameState;
      if (item.currency === 'investors') {
        // Inversores disponibles = investors - investorsSpent
        const available = s.investors - s.investorsSpent;
        if (available < item.cost) return s;
        next = {
          ...s,
          investorsSpent: s.investorsSpent + item.cost,
          shopUpgrades: { ...s.shopUpgrades, [itemId]: 1 },
        };
      } else {
        const currentVal = s[item.currency];
        if (currentVal < item.cost) return s;
        next = {
          ...s,
          [item.currency]: currentVal - item.cost,
          shopUpgrades: { ...s.shopUpgrades, [itemId]: 1 },
        };
      }
      persist(next);
      return next;
    });
  }, []);

  return {
    state,
    offline,
    buyAmount,
    setBuyAmount,
    toasts,
    tapBaseCost: TAP_BASE_COST,
    tap,
    buy,
    upgrade,
    upgradeBulk,
    upgradeTap,
    toggleAutomation,
    claimOffline,
    dismissOffline,
    rebirthTier,
    reset,
    assignPlot,
    markAlienDialogSeen,
    buyShopItem,
    debugAddCash,
    debugAddIngot,
    debugAddCrystal,
    debugAddStar,
    debugAddInvestor,
  };
}

export type GameApi = ReturnType<typeof useGame>;
