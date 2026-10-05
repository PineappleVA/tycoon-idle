import { BALANZA_THRESHOLD, BUSINESSES, BusinessDef, FunctionId, MANAGER_COST, OFFLINE_CAP_MS, OFFLINE_RATE, OFFLINE_REDUCED_RATE, PLOTS_PER_UNLOCK, SOULS_MAX_PER_FALL, SOULS_MIN_PER_FALL } from './data';

export interface GameState {
  cash: number;
  totalEarned: number;
  taps: number;
  tapLevel: number;
  businesses: Record<string, number>;
  upgrades: Record<string, number>;
  automated: Record<string, boolean>;
  /** funciones permanentes desbloqueadas en las tiendas: itemId -> 1 (comprado) */
  shopUpgrades: Record<string, number>;
  /** parcela (índice) -> id de negocio asignado como "empleado" */
  plotAssignments: Record<number, string>;
  lastSave: number;
  rebirths: number;
  ingots: number;
  crystals: number;
  stars: number;
  tier1: number;
  tier2: number;
  tier3: number;
  lifetimeEarned: number;
  plots: number;
  alienDialogSeen: boolean;
  /** Inversores alienígenas ganados (cada 100K ganado en lifetime = 1 inversor) */
  investors: number;
  /** Inversores ya reclamados (para no dar de más) */
  investorsClaimed: number;
  /** Inversores gastados en la tienda alienígena */
  investorsSpent: number;
  /** Si el jugador ha llegado al Cielo al menos una vez (puede volver siempre). */
  heavenReached: boolean;
  /** Veces que ha caído al Infierno. */
  hellFalls: number;
  /** Almas (moneda diabólica) para la Tienda del Diablo. */
  souls: number;
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
  cash: 0,
  totalEarned: 0,
  taps: 0,
  tapLevel: 0,
  businesses: {},
  upgrades: {},
  automated: {},
  shopUpgrades: {},
  plotAssignments: {},
  lastSave: Date.now(),
  rebirths: 0,
  ingots: 0,
  crystals: 0,
  stars: 0,
  tier1: 0,
  tier2: 0,
  tier3: 0,
  lifetimeEarned: 0,
  plots: 0,
  alienDialogSeen: false,
  investors: 0,
  investorsClaimed: 0,
  investorsSpent: 0,
  heavenReached: false,
  hellFalls: 0,
  souls: 0,
};

/* ------------------------------------------------------------------ */
/* Funciones desbloqueables en las tiendas (Prestigio / Diabólica)     */
/* ------------------------------------------------------------------ */

/** ¿El jugador ha desbloqueado esta función (compra única y permanente)? */
export function hasFunction(state: GameState, id: FunctionId): boolean {
  return (state.shopUpgrades[id] ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* Sistema de Parcelas y Empleados                                     */
/* ------------------------------------------------------------------ */

/** Nº total de parcelas disponibles, calculado a partir de las funciones compradas. */
export function totalPlots(state: GameState): number {
  let n = 0;
  if (hasFunction(state, 'unlock_plots')) n += PLOTS_PER_UNLOCK;
  if (hasFunction(state, 'blood_pact')) n += PLOTS_PER_UNLOCK;
  return n;
}

/** Si el sistema de parcelas está desbloqueado (al menos una función lo activa). */
export function plotsUnlocked(state: GameState): boolean {
  return totalPlots(state) > 0;
}

/** Cuántos empleados hay asignados a un negocio concreto. */
export function employeesAssignedTo(state: GameState, businessId: string): number {
  return Object.values(state.plotAssignments).filter((b) => b === businessId).length;
}

/** Bonus multiplicativo que da tener empleados asignados a un negocio: +100% por empleado. */
export function plotBonusForBusiness(state: GameState, businessId: string): number {
  return 1 + employeesAssignedTo(state, businessId);
}

/* ------------------------------------------------------------------ */
/* Sistema de Inversores Alienígenas                                   */
/* ------------------------------------------------------------------ */

/** Cada 750K de lifetimeEarned = 1 inversor potencial (nerfeado BASTANTE) */
const INVESTOR_PER = 750_000;

/** Cuántos inversores tiene disponible (sin gastar) */
export function availableInvestors(s: GameState): number {
  return s.investors - s.investorsSpent;
}

/** Cuántos inversores se han ganado en total dado el lifetime */
export function totalInvestorsEarned(lifetime: number): number {
  return Math.floor(lifetime / INVESTOR_PER);
}

/** Bonus multiplicativo de los inversores: +1% por cada inversor que posees */
export function investorBonus(s: GameState): number {
  return 1 + availableInvestors(s) * 0.01;
}

/** Se ha desbloqueado el sistema de inversores (primer renacimiento) */
export function investorsUnlocked(s: GameState): boolean {
  return s.tier1 >= 1;
}

/** Cuántos negocios distintos posee el jugador (al menos 1 unidad). */
export function ownedBusinessCount(state: GameState): number {
  return BUSINESSES.filter((b) => (state.businesses[b.id] ?? 0) > 0).length;
}

/** Si el jugador ha desbloqueado (comprado al menos 1 de) TODOS los negocios del juego. */
export function allBusinessesOwned(state: GameState): boolean {
  return ownedBusinessCount(state) >= BUSINESSES.length;
}

/* ------------------------------------------------------------------ */
/* Sistema de Renacimiento (3 niveles)                                 */
/* ------------------------------------------------------------------ */

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
    bonusPer: 0.007, // cada inversor da +0.7% velocidad (nerfeado)
    requirement: 18_000_000, // $18M para renacer (nerfeado BASTANTE, antes 6M)
    unlockNeeds: 0,
    desc: 'Los alienígenas invierten en tu imperio. Alcanza $18M en esta vida para renacer y ganar Inversores (+0.7% velocidad c/u). Cada 750K$ acumulados en total te regalan un Inversor extra.',
  },
  {
    level: 2,
    name: 'Portal Dimensional',
    icon: '🌀',
    currency: 'Cristales',
    currencyIcon: '💠',
    gradient: 'from-fuchsia-500 to-purple-600',
    bonusPer: 0.20, // +20% por cristal (re-nerfeado de 0.22 a 0.20)
    requirement: 20_000_000_000, // $20B (re-nerfeado de 15B a 20B)
    unlockNeeds: 120, // 120 inversores (re-nerfeado de 100 a 120)
    desc: 'Para abrir el Portal necesitas 120 Inversores acumulados Y alcanzar $20.000M en esta vida. Sacrificas tus Inversores a cambio de Cristales (+20% c/u).',
  },
  {
    level: 3,
    name: 'El Cielo',
    icon: '☁️',
    currency: 'Estrellas',
    currencyIcon: '⭐',
    gradient: 'from-sky-400 to-indigo-500',
    bonusPer: 1.2, // +120% por estrella (nerfeado, antes 200%)
    requirement: 3_000_000_000_000, // $3T (nerfeado BASTANTE, antes 800B)
    unlockNeeds: 70, // 70 cristales (materiales del nivel anterior, nerfeado de 40)
    desc: 'Antes de ascender debes desbloquear TODOS los negocios, reunir 70 Cristales y alcanzar $3 billones. Tu primer ascenso está garantizado y libre de riesgo; los siguientes son una apuesta: 25% Cielo, 75% Infierno (reinicias tu vida actual).',
  },
];

/** Probabilidad de ir al Cielo (vs Infierno) en intentos REPETIDOS (la primera vez siempre es Cielo garantizado). */
export const HEAVEN_CHANCE = 0.25;

/** Si el próximo intento al nivel 3 sería el primero (garantizado) o una apuesta repetida. */
export function isFirstHeavenAttempt(state: GameState): boolean {
  return state.tier3 === 0;
}

export function rebirthMultiplier(state: GameState): number {
  const c = state.crystals;
  const s = state.stars;
  // Los alienígenas (nivel 1) ya NO usan lingotes: su bonus viene sólo de Inversores.
  // Las tiendas ya NO dan bonus numéricos: solo desbloquean funciones (ver hasFunction).
  const tierMult =
    (1 + c * REBIRTH_TIERS[1].bonusPer) *
    (1 + s * REBIRTH_TIERS[2].bonusPer);

  return tierMult * investorBonus(state);
}

export function currencyFromEarned(level: TierLevel, totalEarned: number): number {
  const tier = REBIRTH_TIERS[level - 1];
  if (totalEarned < tier.requirement) return 0;
  return Math.floor(Math.sqrt(totalEarned / tier.requirement));
}

export function tierUnlocked(state: GameState, level: TierLevel): boolean {
  if (level === 1) return true;

  if (level === 2) {
    // Necesitas los MATERIALES (Inversores) del nivel anterior disponibles ahora mismo.
    return availableInvestors(state) >= REBIRTH_TIERS[1].unlockNeeds;
  }

  // Nivel 3 (El Cielo): una vez alcanzado, siempre puedes volver a intentarlo.
  if (state.heavenReached) return true;
  // La primera vez exige haber desbloqueado TODO el juego (todos los negocios)
  // además de los materiales (Cristales) del nivel anterior.
  return allBusinessesOwned(state) && state.crystals >= REBIRTH_TIERS[2].unlockNeeds;
}

export const REBIRTH_REQUIREMENT = REBIRTH_TIERS[0].requirement;

/* ------------------------------------------------------------------ */
/* Automatización (Managers)                                           */
/* ------------------------------------------------------------------ */

export function automationUnlocked(state: GameState): boolean {
  return state.totalEarned >= BUSINESSES[3].unlockAt;
}

export function isAutomated(state: GameState, id: string): boolean {
  return state.automated[id] ?? false;
}

export function managerCost(): number {
  return MANAGER_COST;
}

/* ------------------------------------------------------------------ */
/* Funciones de negocio                                                */
/* ------------------------------------------------------------------ */

export function businessCount(state: GameState, id: string): number {
  return state.businesses[id] ?? 0;
}

export function businessUpgrade(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

export function costOf(def: BusinessDef, count: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costMultiplier, count));
}

export function upgradeCostOf(def: BusinessDef, level: number): number {
  return Math.ceil(def.baseCost * 25 * Math.pow(7.5, level));
}

export function bulkCost(def: BusinessDef, count: number, amount: number): number {
  if (amount <= 0) return 0;
  const r = def.costMultiplier;
  const first = def.baseCost * Math.pow(r, count);
  return Math.ceil((first * (Math.pow(r, amount) - 1)) / (r - 1));
}

export function maxAffordable(def: BusinessDef, count: number, cash: number): number {
  const r = def.costMultiplier;
  const first = def.baseCost * Math.pow(r, count);
  if (cash < first) return 0;
  const n = Math.floor(Math.log((cash * (r - 1)) / first + 1) / Math.log(r));
  return Math.max(0, n);
}

export function tapUpgradeCost(level: number): number {
  return Math.ceil(90 * Math.pow(2.8, level));
}

export function businessBaseIncome(def: BusinessDef, count: number, upgradeLevel: number): number {
  return count * def.baseIncome * Math.pow(2, upgradeLevel);
}

export function totalIncome(state: GameState): number {
  let sum = 0;
  for (const def of BUSINESSES) {
    const base = businessBaseIncome(def, businessCount(state, def.id), businessUpgrade(state, def.id));
    sum += base * plotBonusForBusiness(state, def.id);
  }
  return sum * rebirthMultiplier(state);
}

export function businessIncome(def: BusinessDef, state: GameState): number {
  const base = businessBaseIncome(def, businessCount(state, def.id), businessUpgrade(state, def.id));
  return base * plotBonusForBusiness(state, def.id) * rebirthMultiplier(state);
}

export function tapValue(state: GameState): number {
  return (1 + state.tapLevel * 3) * rebirthMultiplier(state);
}

/** Duración máxima al 25% offline: se duplica con la función "offline48". */
export function offlineCapMs(state: GameState): number {
  return hasFunction(state, 'offline48') ? OFFLINE_CAP_MS * 2 : OFFLINE_CAP_MS;
}

export function computeOffline(state: GameState, now: number): OfflineResult | null {
  const ms = now - state.lastSave;
  if (ms <= 0) return null;
  const perSec = totalIncome(state);
  const potential = perSec * (ms / 1000);

  const cap = offlineCapMs(state);
  const msAtFull = Math.min(ms, cap);
  const msAtReduced = Math.max(0, ms - cap);

  const claimed =
    perSec * (msAtFull / 1000) * OFFLINE_RATE +
    perSec * (msAtReduced / 1000) * OFFLINE_REDUCED_RATE;

  const deducted = potential - claimed;
  return { ms, potential, claimed, deducted, msAtFull, msAtReduced };
}

/* ------------------------------------------------------------------ */
/* Infierno / Almas / La Balanza                                       */
/* ------------------------------------------------------------------ */

/** Almas aleatorias (1 a 4) que otorga cada caída al Infierno. */
export function randomSouls(): number {
  return SOULS_MIN_PER_FALL + Math.floor(Math.random() * (SOULS_MAX_PER_FALL - SOULS_MIN_PER_FALL + 1));
}

/** Si tras muchas caídas, "El Cielo" se transforma en "La Balanza" (elección Cielo/Infierno). */
export function balanzaUnlocked(state: GameState): boolean {
  return state.hellFalls >= BALANZA_THRESHOLD;
}
