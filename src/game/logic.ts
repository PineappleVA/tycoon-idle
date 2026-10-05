import {
  BALANZA_THRESHOLD,
  CRYSTAL_BONUS_PER,
  HEAVEN_CHANCE,
  INVESTOR_BONUS_PER,
  INVESTOR_PER_EARNED,
  MANAGER_COST,
  MANAGER_MAX_BUYS_PER_TICK,
  OFFLINE_CAP_MS,
  OFFLINE_CAP_RELIC_MULT,
  OFFLINE_RATE,
  OFFLINE_REDUCED_RATE,
  PLOTS_PER_UNLOCK,
  PLOT_BONUS_PER_EMPLOYEE,
  SAVE_VERSION,
  SOULS_MAX_PER_FALL,
  SOULS_MIN_PER_FALL,
  STAR_BONUS_PER,
  TAP_BASE_VALUE,
  TICK_MAX_DELTA_MS,
  TAP_UPGRADE_BASE_COST,
  TAP_UPGRADE_COST_GROWTH,
  TAP_VALUE_PER_LEVEL,
  UPGRADE_BASE_MULT,
  UPGRADE_COST_GROWTH,
  UPGRADE_INCOME_MULT,
} from './balance';
import {
  ALL_SHOP_ITEMS,
  AUTOMATION_BUSINESS_INDEX,
  BUSINESSES,
  BusinessDef,
  FunctionId,
  ShopItem,
} from './data';

/* ================================================================== */
/* Estado                                                              */
/* ================================================================== */

export interface GameState {
  /** Versión del esquema de guardado (ver SAVE_VERSION). */
  version: number;
  cash: number;
  /** Dinero ganado en la vida actual. */
  totalEarned: number;
  /** Dinero ganado entre TODAS las vidas. Nunca decrece. */
  lifetimeEarned: number;
  taps: number;
  tapLevel: number;
  /** negocio id -> unidades poseídas */
  businesses: Record<string, number>;
  /** negocio id -> nivel de mejora */
  upgrades: Record<string, number>;
  /** negocio id -> tiene mánager */
  automated: Record<string, boolean>;
  /** función permanente comprada -> 1 */
  shopUpgrades: Record<string, number>;
  /** parcela (índice) -> id del negocio asignado como empleado */
  plotAssignments: Record<number, string>;
  lastSave: number;
  /** Marca de tiempo de inicio de la vida actual. */
  runStartedAt: number;
  rebirths: number;
  crystals: number;
  stars: number;
  tier1: number;
  tier2: number;
  tier3: number;
  alienDialogSeen: boolean;
  /** Inversores poseídos. */
  investors: number;
  /** Inversores ya acreditados desde lifetimeEarned. MONOTÓNICO. */
  investorsClaimed: number;
  /** Inversores gastados en la tienda. */
  investorsSpent: number;
  /** Si el jugador ha llegado al Cielo al menos una vez. */
  heavenReached: boolean;
  /** Veces que ha caído al Infierno. */
  hellFalls: number;
  /** Almas (moneda diabólica). */
  souls: number;
  /** Hora local (0-23) en que se cobró el último recibo offline; -1 si nunca. */
  offlineClaimHour: number;
  /**
   * Milisegundos jugados en la vida actual, acumulados por el tick.
   * Existe para que los logros dependan sólo del estado y no de Date.now().
   */
  runDurationMs: number;
}

export interface OfflineResult {
  ms: number;
  potential: number;
  claimed: number;
  deducted: number;
  msAtFull: number;
  msAtReduced: number;
}

export const DEFAULT_STATE: GameState = {
  version: SAVE_VERSION,
  cash: 0,
  totalEarned: 0,
  lifetimeEarned: 0,
  taps: 0,
  tapLevel: 0,
  businesses: {},
  upgrades: {},
  automated: {},
  shopUpgrades: {},
  plotAssignments: {},
  lastSave: Date.now(),
  runStartedAt: Date.now(),
  rebirths: 0,
  crystals: 0,
  stars: 0,
  tier1: 0,
  tier2: 0,
  tier3: 0,
  alienDialogSeen: false,
  investors: 0,
  investorsClaimed: 0,
  investorsSpent: 0,
  heavenReached: false,
  hellFalls: 0,
  souls: 0,
  offlineClaimHour: -1,
  runDurationMs: 0,
};

/** Definición de un negocio por id, o null si no existe. */
export function businessDef(id: string): BusinessDef | null {
  return BUSINESSES.find((b) => b.id === id) ?? null;
}

/* ================================================================== */
/* Ganancias: única vía por la que entra dinero                        */
/* ================================================================== */

/**
 * Suelo seguro para `investorsClaimed`.
 *
 * Como `lifetimeEarned` sobrevive a TODOS los renacimientos, este contador
 * nunca debe bajar: si se reseteara, el siguiente tick re-acreditaría todos
 * los inversores del lifetime de golpe ($20B -> ~26.600 inversores = ×267).
 * Se usa `max` porque un renacimiento de nivel 1 puede acreditar extras.
 */
export function investorClaimFloor(s: { lifetimeEarned: number; investorsClaimed: number }): number {
  return Math.max(s.investorsClaimed, totalInvestorsEarned(s.lifetimeEarned));
}

/** Inversores que corresponden al crecimiento de `lifetimeEarned`. */
export function accrueInvestors(
  s: GameState,
  newLifetime: number,
): Pick<GameState, 'investors' | 'investorsClaimed'> {
  const newTotal = totalInvestorsEarned(newLifetime);
  return {
    investors: s.investors + Math.max(0, newTotal - s.investorsClaimed),
    investorsClaimed: Math.max(s.investorsClaimed, newTotal),
  };
}

/**
 * Única función que hace entrar dinero. Cash, total de la vida, lifetime y
 * acreditación de inversores se actualizan siempre a la vez: así no puede
 * volver a producirse el descuadre que causaba la explotación de inversores.
 *
 * Devuelve el mismo objeto si no hay nada que sumar (evita re-renders).
 */
export function earn(s: GameState, amount: number): GameState {
  if (!(amount > 0)) return s;
  const lifetimeEarned = s.lifetimeEarned + amount;
  return {
    ...s,
    cash: s.cash + amount,
    totalEarned: s.totalEarned + amount,
    lifetimeEarned,
    ...accrueInvestors(s, lifetimeEarned),
  };
}

/** Gasta efectivo si alcanza. Devuelve null si no hay fondos. */
export function spend(s: GameState, amount: number): GameState | null {
  if (!(amount > 0) || s.cash < amount) return null;
  return { ...s, cash: s.cash - amount };
}

/* ================================================================== */
/* Funciones de la tienda                                              */
/* ================================================================== */

/** ¿El jugador ha desbloqueado esta función (compra única y permanente)? */
export function hasFunction(state: GameState, id: FunctionId): boolean {
  return (state.shopUpgrades[id] ?? 0) > 0;
}

export function shopItemById(itemId: string): ShopItem | null {
  return ALL_SHOP_ITEMS.find((i) => i.id === itemId) ?? null;
}

/** Moneda disponible para un artículo de tienda. */
export function currencyBalance(state: GameState, currency: ShopItem['currency']): number {
  if (currency === 'investors') return availableInvestors(state);
  return state[currency] ?? 0;
}

/** Compra una función permanente. Devuelve null si no es posible. */
export function purchaseShopItem(state: GameState, itemId: string): GameState | null {
  const item = shopItemById(itemId);
  if (!item) return null;
  if (hasFunction(state, item.id)) return null; // compra única
  if (currencyBalance(state, item.currency) < item.cost) return null;

  if (item.currency === 'investors') {
    return {
      ...state,
      investorsSpent: state.investorsSpent + item.cost,
      shopUpgrades: { ...state.shopUpgrades, [itemId]: 1 },
    };
  }
  return {
    ...state,
    [item.currency]: state[item.currency] - item.cost,
    shopUpgrades: { ...state.shopUpgrades, [itemId]: 1 },
  };
}

/* ================================================================== */
/* Parcelas y empleados                                                */
/* ================================================================== */

/** Nº total de parcelas, derivado de las funciones compradas. */
export function totalPlots(state: GameState): number {
  let n = 0;
  if (hasFunction(state, 'unlock_plots')) n += PLOTS_PER_UNLOCK;
  if (hasFunction(state, 'blood_pact')) n += PLOTS_PER_UNLOCK;
  return n;
}

export function plotsUnlocked(state: GameState): boolean {
  return totalPlots(state) > 0;
}

export function employeesAssignedTo(state: GameState, businessId: string): number {
  return Object.values(state.plotAssignments).filter((b) => b === businessId).length;
}

/** Bonus multiplicativo por empleados asignados a un negocio. */
export function plotBonusForBusiness(state: GameState, businessId: string): number {
  return 1 + employeesAssignedTo(state, businessId) * PLOT_BONUS_PER_EMPLOYEE;
}

/** Asigna o desasigna (businessId = null) un empleado en una parcela. */
export function assignPlot(
  state: GameState,
  plotIndex: number,
  businessId: string | null,
): GameState | null {
  if (plotIndex < 0 || plotIndex >= totalPlots(state)) return null;
  if (businessId !== null && !businessDef(businessId)) return null;
  if ((state.plotAssignments[plotIndex] ?? null) === businessId) return null;

  const plotAssignments = { ...state.plotAssignments };
  if (businessId === null) delete plotAssignments[plotIndex];
  else plotAssignments[plotIndex] = businessId;
  return { ...state, plotAssignments };
}

/* ================================================================== */
/* Inversores alienígenas                                              */
/* ================================================================== */

/** Bonus de velocidad por inversor. Se reexporta para que la UI lo derive. */
export { INVESTOR_BONUS_PER };

export function availableInvestors(s: GameState): number {
  return Math.max(0, s.investors - s.investorsSpent);
}

export function totalInvestorsEarned(lifetime: number): number {
  return Math.floor(lifetime / INVESTOR_PER_EARNED);
}

/** Bonus multiplicativo de los inversores poseídos. */
export function investorBonus(s: GameState): number {
  return 1 + availableInvestors(s) * INVESTOR_BONUS_PER;
}

/** % de velocidad que aportan los inversores (para la UI). */
export function investorBonusPct(s: GameState): number {
  return availableInvestors(s) * INVESTOR_BONUS_PER * 100;
}

export function investorsUnlocked(s: GameState): boolean {
  return s.tier1 >= 1;
}

/* ================================================================== */
/* Renacimiento                                                        */
/* ================================================================== */

export type TierLevel = 1 | 2 | 3;

export interface RebirthTierDef {
  level: TierLevel;
  name: string;
  icon: string;
  currency: string;
  currencyIcon: string;
  gradient: string;
  bonusPer: number;
  requirement: number;
  unlockNeeds: number;
  desc: string;
}

export const REBIRTH_TIERS: RebirthTierDef[] = [
  {
    level: 1,
    name: 'Inversores Alienígenas',
    icon: '👽',
    currency: 'Inversores',
    currencyIcon: '👽',
    gradient: 'from-emerald-500 to-teal-600',
    bonusPer: INVESTOR_BONUS_PER,
    requirement: 18_000_000,
    unlockNeeds: 0,
    desc: `Los alienígenas invierten en tu imperio. Alcanza $18M en esta vida para renacer y ganar Inversores (+${INVESTOR_BONUS_PER * 100}% velocidad c/u). Cada ${(INVESTOR_PER_EARNED / 1000).toLocaleString('es-ES')}K$ acumulados en total te regalan un Inversor extra.`,
  },
  {
    level: 2,
    name: 'Portal Dimensional',
    icon: '🌀',
    currency: 'Cristales',
    currencyIcon: '💠',
    gradient: 'from-fuchsia-500 to-purple-600',
    bonusPer: CRYSTAL_BONUS_PER,
    requirement: 20_000_000_000,
    unlockNeeds: 120,
    desc: `Para abrir el Portal necesitas 120 Inversores acumulados Y alcanzar $20.000M en esta vida. Sacrificas tus Inversores a cambio de Cristales (+${CRYSTAL_BONUS_PER * 100}% c/u).`,
  },
  {
    level: 3,
    name: 'El Cielo',
    icon: '☁️',
    currency: 'Estrellas',
    currencyIcon: '⭐',
    gradient: 'from-sky-400 to-indigo-500',
    bonusPer: STAR_BONUS_PER,
    requirement: 3_000_000_000_000,
    unlockNeeds: 70,
    desc: `Antes de ascender debes desbloquear TODOS los negocios, reunir 70 Cristales y alcanzar $3 billones. Tu primer ascenso está garantizado; los siguientes son una apuesta: ${HEAVEN_CHANCE * 100}% Cielo, ${(1 - HEAVEN_CHANCE) * 100}% Infierno.`,
  },
];

export function ownedBusinessCount(state: GameState): number {
  return BUSINESSES.filter((b) => (state.businesses[b.id] ?? 0) > 0).length;
}

export function allBusinessesOwned(state: GameState): boolean {
  return ownedBusinessCount(state) >= BUSINESSES.length;
}

export function isFirstHeavenAttempt(state: GameState): boolean {
  return state.tier3 === 0;
}

/** Tras BALANZA_THRESHOLD caídas, el jugador elige su destino. */
export function balanzaUnlocked(state: GameState): boolean {
  return state.hellFalls >= BALANZA_THRESHOLD;
}

export function rebirthMultiplier(state: GameState): number {
  const tierMult =
    (1 + state.crystals * CRYSTAL_BONUS_PER) * (1 + state.stars * STAR_BONUS_PER);
  return tierMult * investorBonus(state);
}

export function currencyFromEarned(level: TierLevel, totalEarned: number): number {
  const tier = REBIRTH_TIERS[level - 1];
  if (totalEarned < tier.requirement) return 0;
  return Math.floor(Math.sqrt(totalEarned / tier.requirement));
}

export function tierUnlocked(state: GameState, level: TierLevel): boolean {
  if (level === 1) return true;
  if (level === 2) return availableInvestors(state) >= REBIRTH_TIERS[1].unlockNeeds;
  if (state.heavenReached) return true;
  return allBusinessesOwned(state) && state.crystals >= REBIRTH_TIERS[2].unlockNeeds;
}

/* ---- Ascensión: garantizada / apuesta / La Balanza ---- */

export type AscensionOutcome = 'heaven' | 'hell';
export type AscensionMode = 'guaranteed' | 'gamble' | 'choice';

/**
 * Cómo se resuelve el próximo intento de nivel 3:
 *  - 'guaranteed': primer ascenso, siempre Cielo.
 *  - 'choice':     La Balanza (tras BALANZA_THRESHOLD caídas): elige el jugador.
 *  - 'gamble':     apuesta HEAVEN_CHANCE / (1 - HEAVEN_CHANCE).
 */
export function ascensionMode(state: GameState): AscensionMode {
  if (isFirstHeavenAttempt(state)) return 'guaranteed';
  if (balanzaUnlocked(state)) return 'choice';
  return 'gamble';
}

/**
 * Resuelve el destino del ascenso.
 *
 * `decided` fija el resultado cuando ya se ha determinado antes (la UI lo
 * necesita para elegir la animación correcta): así el dado se tira UNA sola
 * vez y lo que se anima es exactamente lo que ocurre.
 */
export function resolveAscension(state: GameState, decided?: AscensionOutcome): AscensionOutcome {
  const mode = ascensionMode(state);
  // El primer ascenso es una promesa del juego: gana al destino que se pida.
  if (mode === 'guaranteed') return 'heaven';
  if (decided) return decided;
  if (mode === 'choice') return 'heaven';
  return Math.random() < HEAVEN_CHANCE ? 'heaven' : 'hell';
}

export function canRebirth(state: GameState, level: TierLevel): boolean {
  return tierUnlocked(state, level) && currencyFromEarned(level, state.totalEarned) > 0;
}

/* ---- Transiciones de renacimiento (puras) ---- */

/** Campos que sobreviven a cualquier renacimiento. */
function legacyStats(s: GameState) {
  return {
    rebirths: s.rebirths,
    lifetimeEarned: s.lifetimeEarned,
    tier1: s.tier1,
    tier2: s.tier2,
    tier3: s.tier3,
    heavenReached: s.heavenReached,
    alienDialogSeen: s.alienDialogSeen,
    shopUpgrades: s.shopUpgrades,
    hellFalls: s.hellFalls,
    souls: s.souls,
    taps: s.taps,
    offlineClaimHour: s.offlineClaimHour,
  };
}

/**
 * INFIERNO: reset total. Se conservan sólo las estadísticas de vida
 * (ver legacyStats). Se pierde efectivo, negocios, mejoras, mánagers (siempre,
 * incluso con Contrato Eterno), tap level, Cristales, Estrellas, parcelas e
 * Inversores — pero NO el contador de inversores ya acreditados.
 */
export function applyHellFall(s: GameState, soulsGained: number, now: number = Date.now()): GameState {
  return {
    ...DEFAULT_STATE,
    ...legacyStats(s),
    rebirths: s.rebirths + 1,
    hellFalls: s.hellFalls + 1,
    souls: s.souls + soulsGained,
    investors: 0,
    investorsSpent: 0,
    investorsClaimed: investorClaimFloor(s),
    runStartedAt: now,
    lastSave: now,
  };
}

/** CIELO: ganas Estrellas y conservas Inversores, parcelas y tienda. */
export function applyHeaven(s: GameState, gained: number, keepManagers: boolean, now: number = Date.now()): GameState {
  return {
    ...DEFAULT_STATE,
    ...legacyStats(s),
    rebirths: s.rebirths + 1,
    tier3: s.tier3 + 1,
    heavenReached: true,
    stars: s.stars + gained,
    crystals: 0,
    investors: s.investors,
    investorsClaimed: s.investorsClaimed,
    investorsSpent: s.investorsSpent,
    plotAssignments: s.plotAssignments,
    automated: keepManagers ? s.automated : {},
    runStartedAt: now,
    lastSave: now,
  };
}

/** NIVEL 1 — ALIENÍGENAS: ganas Inversores. */
export function applyAlienRebirth(s: GameState, gained: number, keepManagers: boolean, now: number = Date.now()): GameState {
  return {
    ...DEFAULT_STATE,
    ...legacyStats(s),
    rebirths: s.rebirths + 1,
    tier1: s.tier1 + 1,
    crystals: s.crystals,
    stars: s.stars,
    alienDialogSeen: false,
    investors: s.investors + gained,
    investorsClaimed: s.investorsClaimed + gained,
    investorsSpent: s.investorsSpent,
    plotAssignments: s.plotAssignments,
    automated: keepManagers ? s.automated : {},
    runStartedAt: now,
    lastSave: now,
  };
}

/** NIVEL 2 — PORTAL: sacrificas TODOS tus Inversores a cambio de Cristales. */
export function applyPortalRebirth(s: GameState, gained: number, keepManagers: boolean, now: number = Date.now()): GameState {
  return {
    ...DEFAULT_STATE,
    ...legacyStats(s),
    rebirths: s.rebirths + 1,
    tier2: s.tier2 + 1,
    crystals: s.crystals + gained,
    stars: s.stars,
    investors: 0,
    investorsClaimed: investorClaimFloor(s),
    investorsSpent: 0,
    plotAssignments: s.plotAssignments,
    automated: keepManagers ? s.automated : {},
    runStartedAt: now,
    lastSave: now,
  };
}

/** Almas aleatorias (SOULS_MIN..SOULS_MAX) por caída al Infierno. */
export function randomSouls(): number {
  return SOULS_MIN_PER_FALL + Math.floor(Math.random() * (SOULS_MAX_PER_FALL - SOULS_MIN_PER_FALL + 1));
}

/* ================================================================== */
/* Costes e ingresos                                                   */
/* ================================================================== */

export function businessCount(state: GameState, id: string): number {
  return state.businesses[id] ?? 0;
}

export function businessUpgrade(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

export function costOf(def: BusinessDef, count: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costMultiplier, count));
}

/** Coste de las próximas `amount` unidades, empezando por la que tienes. */
export function bulkCost(def: BusinessDef, count: number, amount: number): number {
  if (amount <= 0) return 0;
  const r = def.costMultiplier;
  const first = def.baseCost * Math.pow(r, count);
  return Math.ceil((first * (Math.pow(r, amount) - 1)) / (r - 1));
}

/** Cuántas unidades puedes pagar con `cash`. */
export function maxAffordable(def: BusinessDef, count: number, cash: number): number {
  const r = def.costMultiplier;
  const first = def.baseCost * Math.pow(r, count);
  if (!(cash >= first)) return 0;
  const n = Math.floor(Math.log((cash * (r - 1)) / first + 1) / Math.log(r));
  // La fórmula logarítmica puede desviarse ±1 por error de punto flotante:
  // se corrige contra el coste real en vez de fiarse del logaritmo.
  let amount = Math.max(0, n);
  while (amount > 0 && bulkCost(def, count, amount) > cash) amount -= 1;
  while (bulkCost(def, count, amount + 1) <= cash) amount += 1;
  return amount;
}

export function upgradeCostOf(def: BusinessDef, level: number): number {
  return Math.ceil(def.baseCost * UPGRADE_BASE_MULT * Math.pow(UPGRADE_COST_GROWTH, level));
}

/** Coste TOTAL de `amount` mejoras seguidas desde `level`. */
export function bulkUpgradeCost(def: BusinessDef, level: number, amount: number): number {
  let total = 0;
  for (let i = 0; i < amount; i++) total += upgradeCostOf(def, level + i);
  return total;
}

/** Cuántas mejoras se pueden pagar con `cash` desde `level`. */
export function maxAffordableUpgrades(def: BusinessDef, level: number, cash: number): number {
  let total = 0;
  let n = 0;
  while (n < 1_000) {
    const next = upgradeCostOf(def, level + n);
    if (total + next > cash) break;
    total += next;
    n += 1;
  }
  return n;
}

export function tapUpgradeCost(level: number): number {
  return Math.ceil(TAP_UPGRADE_BASE_COST * Math.pow(TAP_UPGRADE_COST_GROWTH, level));
}

export function businessBaseIncome(def: BusinessDef, count: number, upgradeLevel: number): number {
  return count * def.baseIncome * Math.pow(UPGRADE_INCOME_MULT, upgradeLevel);
}

export function businessIncome(def: BusinessDef, state: GameState): number {
  const base = businessBaseIncome(def, businessCount(state, def.id), businessUpgrade(state, def.id));
  return base * plotBonusForBusiness(state, def.id) * rebirthMultiplier(state);
}

export function totalIncome(state: GameState): number {
  let sum = 0;
  for (const def of BUSINESSES) {
    const base = businessBaseIncome(def, businessCount(state, def.id), businessUpgrade(state, def.id));
    sum += base * plotBonusForBusiness(state, def.id);
  }
  return sum * rebirthMultiplier(state);
}

export function tapValue(state: GameState): number {
  return (TAP_BASE_VALUE + state.tapLevel * TAP_VALUE_PER_LEVEL) * rebirthMultiplier(state);
}

/* ================================================================== */
/* Automatización                                                      */
/* ================================================================== */

export function automationUnlocked(state: GameState): boolean {
  return state.totalEarned >= BUSINESSES[AUTOMATION_BUSINESS_INDEX].unlockAt;
}

export function isAutomated(state: GameState, id: string): boolean {
  return state.automated[id] ?? false;
}

export function managerCost(): number {
  return MANAGER_COST;
}

/** Alterna el mánager de un negocio, cobrando su precio al activarlo. */
export function toggleAutomation(state: GameState, id: string): GameState | null {
  if (!automationUnlocked(state)) return null;
  const def = businessDef(id);
  if (!def || state.totalEarned < def.unlockAt) return null;

  const current = isAutomated(state, id);
  if (current) return { ...state, automated: { ...state.automated, [id]: false } };

  const affordable = spend(state, managerCost());
  if (!affordable) return null;
  return { ...affordable, automated: { ...affordable.automated, [id]: true } };
}

/**
 * Un ciclo de mánagers: cada negocio automatizado intenta comprar unidades
 * (y mejoras si tienes Capataz Infernal) hasta agotar el efectivo o el tope
 * por tick. Devuelve el mismo objeto si no cambió nada.
 */
export function runManagers(state: GameState): GameState {
  if (!automationUnlocked(state)) return state;
  const foreman = hasFunction(state, 'foreman_upgrade');

  let next = state;
  let changed = false;

  for (const def of BUSINESSES) {
    if (!isAutomated(next, def.id)) continue;
    if (next.totalEarned < def.unlockAt) continue;

    // Unidades: compra en lote todo lo que quepa, con tope por tick.
    const count = businessCount(next, def.id);
    const affordable = Math.min(maxAffordable(def, count, next.cash), MANAGER_MAX_BUYS_PER_TICK);
    if (affordable > 0) {
      const price = bulkCost(def, count, affordable);
      const paid = spend(next, price);
      if (paid) {
        next = { ...paid, businesses: { ...paid.businesses, [def.id]: count + affordable } };
        changed = true;
      }
    }

    // Mejoras: sólo con el Capataz Infernal, y sólo lo que se pueda pagar.
    if (foreman && businessCount(next, def.id) > 0) {
      const level = businessUpgrade(next, def.id);
      const levels = Math.min(maxAffordableUpgrades(def, level, next.cash), MANAGER_MAX_BUYS_PER_TICK);
      if (levels > 0) {
        const price = bulkUpgradeCost(def, level, levels);
        const paid = spend(next, price);
        if (paid) {
          next = { ...paid, upgrades: { ...paid.upgrades, [def.id]: level + levels } };
          changed = true;
        }
      }
    }
  }

  return changed ? next : state;
}

/* ================================================================== */
/* Acciones del jugador (puras)                                        */
/* ================================================================== */

/** Un toque: suma el valor del toque. */
export function applyTap(state: GameState): GameState {
  return { ...earn(state, tapValue(state)), taps: state.taps + 1 };
}

/**
 * Compra `amount` unidades de un negocio ('max' = todo lo que quepa).
 * Devuelve null si no se pudo comprar nada.
 */
export function buyBusiness(state: GameState, id: string, amount: number | 'max'): GameState | null {
  const def = businessDef(id);
  if (!def) return null;

  const count = businessCount(state, id);
  const wanted = amount === 'max' ? maxAffordable(def, count, state.cash) : amount;
  if (wanted <= 0) return null;

  // Recorte defensivo: nunca gastar más de lo que hay.
  let n = wanted;
  let price = bulkCost(def, count, n);
  while (n > 0 && price > state.cash) {
    n -= 1;
    price = bulkCost(def, count, n);
  }
  if (n <= 0) return null;

  const paid = spend(state, price);
  if (!paid) return null;
  return { ...paid, businesses: { ...paid.businesses, [id]: count + n } };
}

/** Compra `amount` mejoras de un negocio en una sola transacción. */
export function upgradeBusiness(state: GameState, id: string, amount = 1): GameState | null {
  const def = businessDef(id);
  if (!def || amount <= 0) return null;
  if (businessCount(state, id) <= 0) return null;

  const level = businessUpgrade(state, id);
  const levels = Math.min(amount, maxAffordableUpgrades(def, level, state.cash));
  if (levels <= 0) return null;

  const paid = spend(state, bulkUpgradeCost(def, level, levels));
  if (!paid) return null;
  return { ...paid, upgrades: { ...paid.upgrades, [id]: level + levels } };
}

/** Mejora la mano de obra un nivel. */
export function upgradeTap(state: GameState): GameState | null {
  const paid = spend(state, tapUpgradeCost(state.tapLevel));
  if (!paid) return null;
  return { ...paid, tapLevel: paid.tapLevel + 1 };
}

/**
 * Tick de ingresos. Usa delta-time real: si el navegador retrasa el intervalo
 * (pestaña en segundo plano, equipo cargado) el dinero no se pierde, y el tope
 * TICK_MAX_DELTA_MS evita saltos enormes — de eso se ocupa el cálculo offline.
 */
export function tickIncome(state: GameState, deltaMs: number): GameState {
  const clamped = Math.min(Math.max(0, deltaMs), TICK_MAX_DELTA_MS);
  if (clamped <= 0) return state;
  const earned = earn(state, totalIncome(state) * (clamped / 1000));
  // La duración se acumula aunque no haya ingresos: un jugador sin negocios
  // también está jugando.
  return { ...earned, runDurationMs: state.runDurationMs + clamped };
}

/* ================================================================== */
/* Offline                                                             */
/* ================================================================== */

/** Tope de tiempo al 25%: se duplica con la función "Reloj Dimensional". */
export function offlineCapMs(state: GameState): number {
  return hasFunction(state, 'offline48') ? OFFLINE_CAP_MS * OFFLINE_CAP_RELIC_MULT : OFFLINE_CAP_MS;
}

export function computeOffline(state: GameState, now: number): OfflineResult | null {
  const ms = now - state.lastSave;
  if (ms <= 0) return null;

  const perSec = totalIncome(state);
  if (perSec <= 0) return null;

  const potential = perSec * (ms / 1000);
  const cap = offlineCapMs(state);
  const msAtFull = Math.min(ms, cap);
  const msAtReduced = Math.max(0, ms - cap);

  const claimed =
    perSec * (msAtFull / 1000) * OFFLINE_RATE +
    perSec * (msAtReduced / 1000) * OFFLINE_REDUCED_RATE;

  return { ms, potential, claimed, deducted: potential - claimed, msAtFull, msAtReduced };
}

/**
 * Cobra el recibo offline: suma el dinero, registra la hora local (logro Búho
 * Nocturno) y AVANZA lastSave. Sin ese avance, si el navegador se cerraba antes
 * del siguiente autoguardado el mismo periodo se podía cobrar otra vez.
 */
export function claimOffline(state: GameState, result: OfflineResult, now: number = Date.now()): GameState {
  return {
    ...earn(state, result.claimed),
    offlineClaimHour: new Date(now).getHours(),
    lastSave: Math.max(state.lastSave, now),
  };
}

/**
 * Descarta el recibo sin cobrarlo. También avanza lastSave: descartar es
 * renunciar, no aparcar el premio para la próxima recarga.
 */
export function dismissOffline(state: GameState, now: number = Date.now()): GameState {
  return { ...state, lastSave: Math.max(state.lastSave, now) };
}

/* ================================================================== */
/* Saneamiento de partidas                                             */
/* ================================================================== */

/**
 * Normaliza una partida cargada de localStorage: rellena campos que falten,
 * descarta números inválidos y repara invariantes. Nunca lanza.
 */
export function sanitizeState(input: unknown): GameState {
  const raw = (input ?? {}) as Partial<GameState>;
  const num = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
  const record = <T,>(v: unknown): Record<string, T> =>
    v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Record<string, T>) } : {};

  const lifetimeEarned = num(raw.lifetimeEarned, num(raw.totalEarned));
  const investorsClaimed = Math.max(num(raw.investorsClaimed), totalInvestorsEarned(lifetimeEarned));
  const investors = Math.max(num(raw.investors), 0);

  const state: GameState = {
    ...DEFAULT_STATE,
    version: SAVE_VERSION,
    cash: num(raw.cash),
    totalEarned: num(raw.totalEarned),
    lifetimeEarned,
    taps: num(raw.taps),
    tapLevel: Math.floor(num(raw.tapLevel)),
    businesses: record<number>(raw.businesses),
    upgrades: record<number>(raw.upgrades),
    automated: record<boolean>(raw.automated),
    shopUpgrades: record<number>(raw.shopUpgrades),
    plotAssignments: record<string>(raw.plotAssignments),
    // Un lastSave en el futuro bloquearía el cálculo offline para siempre.
    lastSave: Math.min(num(raw.lastSave, Date.now()) || Date.now(), Date.now()),
    runStartedAt: num(raw.runStartedAt, Date.now()) || Date.now(),
    rebirths: Math.floor(num(raw.rebirths)),
    crystals: num(raw.crystals),
    stars: num(raw.stars),
    tier1: Math.floor(num(raw.tier1, num(raw.rebirths))),
    tier2: Math.floor(num(raw.tier2)),
    tier3: Math.floor(num(raw.tier3)),
    alienDialogSeen: Boolean(raw.alienDialogSeen),
    investors,
    investorsClaimed,
    investorsSpent: Math.min(num(raw.investorsSpent), investors),
    heavenReached: Boolean(raw.heavenReached),
    hellFalls: Math.floor(num(raw.hellFalls)),
    souls: num(raw.souls),
    offlineClaimHour: typeof raw.offlineClaimHour === 'number' ? raw.offlineClaimHour : -1,
    runDurationMs: num(raw.runDurationMs),
  };

  // Los negocios y mejoras desconocidos se descartan: si cambia el catálogo,
  // una partida antigua no debe arrastrar ids que ya no existen.
  const known = new Set(BUSINESSES.map((b) => b.id));
  for (const key of Object.keys(state.businesses)) if (!known.has(key)) delete state.businesses[key];
  for (const key of Object.keys(state.upgrades)) if (!known.has(key)) delete state.upgrades[key];
  for (const key of Object.keys(state.automated)) if (!known.has(key)) delete state.automated[key];

  const knownFunctions = new Set<string>(ALL_SHOP_ITEMS.map((i) => i.id));
  for (const key of Object.keys(state.shopUpgrades)) if (!knownFunctions.has(key)) delete state.shopUpgrades[key];

  // Parcelas por encima del total disponible no tienen sentido.
  const slots = totalPlots(state);
  for (const key of Object.keys(state.plotAssignments)) {
    const idx = Number(key);
    if (!Number.isInteger(idx) || idx < 0 || idx >= slots || !known.has(state.plotAssignments[idx])) {
      delete state.plotAssignments[idx];
    }
  }

  return state;
}
