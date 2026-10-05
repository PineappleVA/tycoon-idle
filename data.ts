export interface BusinessDef {
  id: string;
  name: string;
  icon: string;
  /** tailwind gradient classes for the card accent */
  gradient: string;
  textColor: string;
  baseCost: number;
  costMultiplier: number;
  baseIncome: number;
  /** totalEarned required before this business is unlocked */
  unlockAt: number;
}

export const BUSINESSES: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Puesto de Limonada',
    icon: '🍋',
    gradient: 'from-amber-400 to-yellow-500',
    textColor: 'text-amber-700',
    baseCost: 35,
    costMultiplier: 1.24,
    baseIncome: 0.8,
    unlockAt: 0,
  },
  {
    id: 'newspaper',
    name: 'Quiosco de Periódicos',
    icon: '📰',
    gradient: 'from-sky-400 to-blue-500',
    textColor: 'text-sky-700',
    baseCost: 650,
    costMultiplier: 1.24,
    baseIncome: 5,
    unlockAt: 300,
  },
  {
    id: 'donut',
    name: 'Donas Express',
    icon: '🍩',
    gradient: 'from-pink-400 to-rose-500',
    textColor: 'text-pink-700',
    baseCost: 15_000,
    costMultiplier: 1.24,
    baseIncome: 28,
    unlockAt: 4_500,
  },
  {
    id: 'pizza',
    name: 'Pizzería',
    icon: '🍕',
    gradient: 'from-orange-400 to-red-500',
    textColor: 'text-orange-700',
    baseCost: 250_000,
    costMultiplier: 1.24,
    baseIncome: 160,
    unlockAt: 35_000,
  },
  {
    id: 'taxi',
    name: 'Flota de Taxis',
    icon: '🚕',
    gradient: 'from-emerald-400 to-green-600',
    textColor: 'text-emerald-700',
    baseCost: 3_500_000,
    costMultiplier: 1.24,
    baseIncome: 950,
    unlockAt: 260_000,
  },
  {
    id: 'factory',
    name: 'Fábrica',
    icon: '🏭',
    gradient: 'from-zinc-400 to-slate-600',
    textColor: 'text-slate-700',
    baseCost: 55_000_000,
    costMultiplier: 1.24,
    baseIncome: 4_800,
    unlockAt: 2_400_000,
  },
  {
    id: 'tower',
    name: 'Rascacielos',
    icon: '🏢',
    gradient: 'from-indigo-400 to-violet-600',
    textColor: 'text-indigo-700',
    baseCost: 850_000_000,
    costMultiplier: 1.24,
    baseIncome: 32_000,
    unlockAt: 19_000_000,
  },
  {
    id: 'rocket',
    name: 'Programa Espacial',
    icon: '🚀',
    gradient: 'from-fuchsia-400 to-purple-600',
    textColor: 'text-fuchsia-700',
    baseCost: 16_000_000_000,
    costMultiplier: 1.24,
    baseIncome: 260_000,
    unlockAt: 190_000_000,
  },
];

export const TAP_BASE_COST = 50;
export const OFFLINE_RATE = 0.25;
export const OFFLINE_REDUCED_RATE = 0.03;
export const OFFLINE_CAP_MS = 24 * 60 * 60 * 1000; // 24 horas al 25%
export const OFFLINE_MIN_MS = 5_000; // ignore very short gaps

/** Manager para automatizar la compra de un negocio. Desbloqueado al tener pizzería. */
export const MANAGER_COST = 150_000;

/** Identificadores de las funciones que se pueden desbloquear en las tiendas. */
export type FunctionId =
  | 'unlock_plots'
  | 'autotap'
  | 'bulkupgrade'
  | 'offline48'
  | 'buyx1000'
  | 'blood_pact'
  | 'foreman_upgrade'
  | 'permanent_managers';

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  currency: 'investors' | 'crystals' | 'stars' | 'souls';
  currencyIcon: string;
  /** función que desbloquea esta compra (compra única, no da bonus numérico) */
  unlocks: FunctionId;
  /** solo visible/comprable si es tienda diabólica */
  diabolic?: boolean;
}

/** Tienda de Prestigio: cada compra desbloquea una FUNCIÓN permanente, no un bonus. */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'unlock_plots',
    name: 'Registro de Parcelas',
    desc: 'Desbloquea las Parcelas: 3 terrenos donde asignar Empleados a tus negocios.',
    icon: '🏞️',
    cost: 60,
    currency: 'investors',
    currencyIcon: '👽',
    unlocks: 'unlock_plots',
  },
  {
    id: 'autotap',
    name: 'Autómata de Bolsillo',
    desc: 'Un robot te sustituye: toca automáticamente por ti cada segundo, para siempre.',
    icon: '🤖',
    cost: 180,
    currency: 'investors',
    currencyIcon: '👽',
    unlocks: 'autotap',
  },
  {
    id: 'bulkupgrade',
    name: 'Mejora en Cadena',
    desc: 'Desbloquea los botones de mejora múltiple (+10 / +25) en cada negocio.',
    icon: '⛓️',
    cost: 25,
    currency: 'crystals',
    currencyIcon: '💠',
    unlocks: 'bulkupgrade',
  },
  {
    id: 'offline48',
    name: 'Reloj Dimensional',
    desc: 'Duplica el tiempo offline al 25%: de 24h a 48h antes de bajar al 3%.',
    icon: '⏳',
    cost: 60,
    currency: 'crystals',
    currencyIcon: '💠',
    unlocks: 'offline48',
  },
  {
    id: 'buyx1000',
    name: 'Comprador Compulsivo',
    desc: 'Desbloquea la opción de compra masiva ×1000 en todos los negocios.',
    icon: '🛒',
    cost: 10,
    currency: 'stars',
    currencyIcon: '⭐',
    unlocks: 'buyx1000',
  },
];

/** Tienda Diabólica: se desbloquea al caer al Infierno. Se paga con Almas (🔥). */
export const DIABOLIC_ITEMS: ShopItem[] = [
  {
    id: 'blood_pact',
    name: 'Pacto de Sangre',
    desc: 'El Diablo te concede 3 Parcelas extra (desbloquea el sistema si no lo tenías).',
    icon: '📜',
    cost: 4,
    currency: 'souls',
    currencyIcon: '🔥',
    unlocks: 'blood_pact',
    diabolic: true,
  },
  {
    id: 'foreman_upgrade',
    name: 'Capataz Infernal',
    desc: 'Tus mánagers también compran mejoras automáticamente cuando puedan.',
    icon: '⚒️',
    cost: 8,
    currency: 'souls',
    currencyIcon: '🔥',
    unlocks: 'foreman_upgrade',
    diabolic: true,
  },
  {
    id: 'permanent_managers',
    name: 'Contrato Eterno',
    desc: 'Tus mánagers sobreviven a los renacimientos (excepto al caer al Infierno).',
    icon: '🕯️',
    cost: 14,
    currency: 'souls',
    currencyIcon: '🔥',
    unlocks: 'permanent_managers',
    diabolic: true,
  },
];

/** Rango de Almas ganadas por cada caída al Infierno (aleatorio). */
export const SOULS_MIN_PER_FALL = 1;
export const SOULS_MAX_PER_FALL = 4;

/** Nº de parcelas que otorga cada función que las concede. */
export const PLOTS_PER_UNLOCK = 3;

/** Caídas al Infierno necesarias para que "El Cielo" se transforme en "La Balanza". */
export const BALANZA_THRESHOLD = 3;
