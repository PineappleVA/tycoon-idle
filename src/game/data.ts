import {
  BALANZA_THRESHOLD,
  BUSINESS_COST_MULTIPLIER,
  PLOTS_PER_UNLOCK,
  SOULS_MAX_PER_FALL,
  SOULS_MIN_PER_FALL,
} from './balance';

/**
 * data.ts — CATÁLOGO de contenido: negocios y artículos de tienda.
 * Los números de balance viven en balance.ts; aquí sólo se describen cosas.
 */

export interface BusinessDef {
  id: string;
  name: string;
  icon: string;
  /** clases de gradiente de tailwind para el acento de la tarjeta */
  gradient: string;
  textColor: string;
  baseCost: number;
  costMultiplier: number;
  baseIncome: number;
  /** totalEarned necesario para desbloquear el negocio */
  unlockAt: number;
  /** frase de ambiente mostrada en el detalle */
  flavor: string[];
}

export const BUSINESSES: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Puesto de Limonada',
    icon: '🍋',
    gradient: 'from-amber-400 to-yellow-500',
    textColor: 'text-amber-700',
    baseCost: 35,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 0.8,
    unlockAt: 0,
    flavor: ['Frescura artesanal.', 'Cada vaso es una obra maestra.', 'El sol es nuestro aliado.'],
  },
  {
    id: 'newspaper',
    name: 'Quiosco de Periódicos',
    icon: '📰',
    gradient: 'from-sky-400 to-blue-500',
    textColor: 'text-sky-700',
    baseCost: 650,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 5,
    unlockAt: 300,
    flavor: ['Noticias frescas cada mañana.', 'La verdad, impresa.', 'El poder de la información.'],
  },
  {
    id: 'donut',
    name: 'Donas Express',
    icon: '🍩',
    gradient: 'from-pink-400 to-rose-500',
    textColor: 'text-pink-700',
    baseCost: 15_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 28,
    unlockAt: 4_500,
    flavor: ['Azúcar + felicidad = $$$', 'El desayuno de los campeones.', 'Adictivos, dicen.'],
  },
  {
    id: 'pizza',
    name: 'Pizzería',
    icon: '🍕',
    gradient: 'from-orange-400 to-red-500',
    textColor: 'text-orange-700',
    baseCost: 250_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 160,
    unlockAt: 35_000,
    flavor: ['Masa madre, pasión eterna.', 'Napolitana auténtica.', 'La pizza une familias.'],
  },
  {
    id: 'taxi',
    name: 'Flota de Taxis',
    icon: '🚕',
    gradient: 'from-emerald-400 to-green-600',
    textColor: 'text-emerald-700',
    baseCost: 3_500_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 950,
    unlockAt: 260_000,
    flavor: ['Movilidad urbana premium.', 'Siempre llegamos.', 'La ciudad es nuestra.'],
  },
  {
    id: 'factory',
    name: 'Fábrica',
    icon: '🏭',
    gradient: 'from-zinc-400 to-slate-600',
    textColor: 'text-slate-700',
    baseCost: 55_000_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 4_800,
    unlockAt: 2_400_000,
    flavor: ['Producción en serie.', 'Eficiencia industrial.', 'Hierro, vapor, progreso.'],
  },
  {
    id: 'tower',
    name: 'Rascacielos',
    icon: '🏢',
    gradient: 'from-indigo-400 to-violet-600',
    textColor: 'text-indigo-700',
    baseCost: 850_000_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 32_000,
    unlockAt: 19_000_000,
    flavor: ['Oficinas con vistas.', 'El símbolo del poder.', 'Vive en las nubes.'],
  },
  {
    id: 'rocket',
    name: 'Programa Espacial',
    icon: '🚀',
    gradient: 'from-fuchsia-400 to-purple-600',
    textColor: 'text-fuchsia-700',
    baseCost: 16_000_000_000,
    costMultiplier: BUSINESS_COST_MULTIPLIER,
    baseIncome: 260_000,
    unlockAt: 190_000_000,
    flavor: ['Al infinito y más allá.', 'El cielo no es el límite.', 'Destino: Marte.'],
  },
];

/** Índice del negocio que desbloquea la automatización (mánagers). */
export const AUTOMATION_BUSINESS_INDEX = 3; // Pizzería

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

export type ShopCurrency = 'investors' | 'crystals' | 'stars' | 'souls';

export interface ShopItem {
  id: FunctionId;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  currency: ShopCurrency;
  currencyIcon: string;
  /** sólo visible/comprable si es tienda diabólica */
  diabolic?: boolean;
}

/** Tienda de Prestigio: cada compra desbloquea una FUNCIÓN permanente, no un bonus. */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'unlock_plots',
    name: 'Registro de Parcelas',
    desc: `Desbloquea las Parcelas: ${PLOTS_PER_UNLOCK} terrenos donde asignar Empleados a tus negocios.`,
    icon: '🏞️',
    cost: 60,
    currency: 'investors',
    currencyIcon: '👽',
  },
  {
    id: 'autotap',
    name: 'Autómata de Bolsillo',
    desc: 'Un robot te sustituye: toca automáticamente por ti cada segundo, para siempre.',
    icon: '🤖',
    cost: 180,
    currency: 'investors',
    currencyIcon: '👽',
  },
  {
    id: 'bulkupgrade',
    name: 'Mejora en Cadena',
    desc: 'Desbloquea los botones de mejora múltiple (+5 / +10) en cada negocio.',
    icon: '⛓️',
    cost: 25,
    currency: 'crystals',
    currencyIcon: '💠',
  },
  {
    id: 'offline48',
    name: 'Reloj Dimensional',
    desc: 'Duplica el tiempo offline al 25%: de 24h a 48h antes de bajar al 3%.',
    icon: '⏳',
    cost: 60,
    currency: 'crystals',
    currencyIcon: '💠',
  },
  {
    id: 'buyx1000',
    name: 'Comprador Compulsivo',
    desc: 'Desbloquea la opción de compra masiva ×1000 en todos los negocios.',
    icon: '🛒',
    cost: 10,
    currency: 'stars',
    currencyIcon: '⭐',
  },
];

/** Tienda Diabólica: se desbloquea al caer al Infierno. Se paga con Almas (🔥). */
export const DIABOLIC_ITEMS: ShopItem[] = [
  {
    id: 'blood_pact',
    name: 'Pacto de Sangre',
    desc: `El Diablo te concede ${PLOTS_PER_UNLOCK} Parcelas extra (desbloquea el sistema si no lo tenías).`,
    icon: '📜',
    cost: 4,
    currency: 'souls',
    currencyIcon: '🔥',
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
    diabolic: true,
  },
];

export const ALL_SHOP_ITEMS: ShopItem[] = [...SHOP_ITEMS, ...DIABOLIC_ITEMS];

/**
 * Textos de ayuda que la UI debe derivar del balance en vez de hardcodear.
 * Se construyen aquí para que cambien solos si se toca balance.ts.
 */
export const SOULS_DROP_LABEL = `+${SOULS_MIN_PER_FALL}–${SOULS_MAX_PER_FALL} Almas 🔥`;
export const BALANZA_LABEL = `Tras ${BALANZA_THRESHOLD} caídas al Infierno, El Cielo se transforma en La Balanza y eliges tú tu destino.`;
