import type { TourStep } from '../components/Tutorial';
import { BUSINESSES } from './data';
import { AUTOMATION_BUSINESS_INDEX } from './data';
import { REBIRTH_TIERS, businessCount, type GameState } from './logic';
import { REBIRTH_TAB_FRACTION, STATS_TAB_AT, UPGRADES_TAB_AT } from './tabs';

export interface TourDef {
  id: string;
  label: string;
  accent: 'amber' | 'fuchsia' | 'emerald' | 'sky';
  steps: TourStep[];
  /** Condición para que el tour sea candidato. */
  when: (s: GameState, achievementsDone: number) => boolean;
  /** Selector que debe existir en el DOM para que el tour arranque. */
  requires?: string;
}

export const TOURS_KEY = 'tycoon-tours-v1';

export const TOURS: TourDef[] = [
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
    when: (s) =>
      s.lifetimeEarned >= UPGRADES_TAB_AT || BUSINESSES.some((b) => businessCount(s, b.id) > 0),
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
    when: (_s, achievementsDone) => achievementsDone >= 1,
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
    when: (s) => s.rebirths > 0 || s.lifetimeEarned >= REBIRTH_TIERS[0].requirement * REBIRTH_TAB_FRACTION,
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
    when: (s) => s.totalEarned >= BUSINESSES[AUTOMATION_BUSINESS_INDEX].unlockAt,
    requires: '[data-automation]',
    steps: [
      {
        emoji: '🤖',
        selector: '[data-automation]',
        title: '¡Mánagers desbloqueados!',
        text: 'Al alcanzar la Pizzería puedes contratar mánagers. Un mánager compra automáticamente ese negocio cada segundo.',
      },
    ],
  },
  {
    id: 'stats',
    label: 'Nueva función',
    accent: 'sky',
    when: (s) => s.lifetimeEarned >= STATS_TAB_AT,
    requires: '[data-tour="tab-stats"]',
    steps: [
      {
        emoji: '📊',
        selector: '[data-tour="tab-stats"]',
        title: 'Tus estadísticas',
        text: 'Aquí ves el detalle de tu imperio: cuánto produces, cuánto ganas offline y tu historial completo.',
      },
    ],
  },
];
