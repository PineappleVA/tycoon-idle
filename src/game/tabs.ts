import { REBIRTH_TIERS } from './logic';
import { businessCount, type GameState } from './logic';
import { BUSINESSES } from './data';

export type TabId = 'business' | 'upgrades' | 'rebirth' | 'stats' | 'achievements';

export interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  /** Cuándo se desbloquea la pestaña. */
  unlocked: (s: GameState, achievementsDone: number) => boolean;
  /** Frase corta que explica el desbloqueo mientras está oculta. */
  hint: string;
}

/** Umbral de lifetime que abre la pestaña Mejoras. */
export const UPGRADES_TAB_AT = 250;
/** Umbral de lifetime que abre Stats. */
export const STATS_TAB_AT = 10_000;
/** Fracción del requisito de renacimiento que abre la pestaña Renacer. */
export const REBIRTH_TAB_FRACTION = 0.2;

export const TABS: TabDef[] = [
  {
    id: 'business',
    label: 'Negocios',
    icon: '🏪',
    hint: 'Siempre disponible.',
    unlocked: () => true,
  },
  {
    id: 'upgrades',
    label: 'Mejoras',
    icon: '⚡',
    hint: 'Gana $250 o compra tu primer negocio.',
    unlocked: (s) => s.lifetimeEarned >= UPGRADES_TAB_AT || BUSINESSES.some((b) => businessCount(s, b.id) > 0),
  },
  {
    id: 'achievements',
    label: 'Logros',
    icon: '🏆',
    hint: 'Consigue tu primer logro.',
    unlocked: (_s, achievementsDone) => achievementsDone >= 1,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: '📊',
    hint: 'Gana $10.000 en total.',
    unlocked: (s) => s.lifetimeEarned >= STATS_TAB_AT,
  },
  {
    id: 'rebirth',
    label: 'Renacer',
    icon: '♾️',
    hint: 'Acércate al primer renacimiento.',
    unlocked: (s) => s.rebirths > 0 || s.lifetimeEarned >= REBIRTH_TIERS[0].requirement * REBIRTH_TAB_FRACTION,
  },
];
