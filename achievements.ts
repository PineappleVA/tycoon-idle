import { BUSINESSES } from './data';
import { businessCount, businessUpgrade, GameState } from './logic';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  done: (s: GameState) => boolean;
  progress: (s: GameState) => number; // 0..1
  /** oculto hasta desbloquearse */
  hidden?: boolean;
}

function ownedTotal(s: GameState): number {
  return BUSINESSES.reduce((sum, b) => sum + businessCount(s, b.id), 0);
}

function upgradeTotal(s: GameState): number {
  return BUSINESSES.reduce((sum, b) => sum + businessUpgrade(s, b.id), 0);
}

function cap(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-buck',
    name: 'Primer Dólar',
    desc: 'Gana tu primer $1',
    icon: '🪙',
    done: (s) => s.totalEarned >= 1,
    progress: (s) => cap(s.totalEarned / 1),
  },
  {
    id: 'clicker',
    name: 'Manos a la Obra',
    desc: 'Toca 100 veces',
    icon: '👆',
    done: (s) => s.taps >= 100,
    progress: (s) => cap(s.taps / 100),
  },
  {
    id: 'clicker-pro',
    name: 'Dedos de Acero',
    desc: 'Toca 1,000 veces',
    icon: '💪',
    done: (s) => s.taps >= 1000,
    progress: (s) => cap(s.taps / 1000),
  },
  {
    id: 'entrepreneur',
    name: 'Emprendedor',
    desc: 'Posee 10 negocios',
    icon: '🧑‍💼',
    done: (s) => ownedTotal(s) >= 10,
    progress: (s) => cap(ownedTotal(s) / 10),
  },
  {
    id: 'mogul',
    name: 'Magnate',
    desc: 'Posee 100 negocios',
    icon: '🎩',
    done: (s) => ownedTotal(s) >= 100,
    progress: (s) => cap(ownedTotal(s) / 100),
  },
  {
    id: 'thousandaire',
    name: 'Milarista',
    desc: 'Gana $10,000 en total',
    icon: '💵',
    done: (s) => s.totalEarned >= 10_000,
    progress: (s) => cap(s.totalEarned / 10_000),
  },
  {
    id: 'millionaire',
    name: 'Millonario',
    desc: 'Gana $1,000,000 en total',
    icon: '💰',
    done: (s) => s.totalEarned >= 1_000_000,
    progress: (s) => cap(s.totalEarned / 1_000_000),
  },
  {
    id: 'billionaire',
    name: 'Multimillonario',
    desc: 'Gana $1,000,000,000 en total',
    icon: '🏦',
    done: (s) => s.totalEarned >= 1_000_000_000,
    progress: (s) => cap(s.totalEarned / 1_000_000_000),
  },
  {
    id: 'tycoon',
    name: 'Gran Tycoon',
    desc: 'Desbloquea todos los negocios',
    icon: '👑',
    done: (s) => BUSINESSES.every((b) => s.totalEarned >= b.unlockAt),
    progress: (s) => cap(BUSINESSES.filter((b) => s.totalEarned >= b.unlockAt).length / BUSINESSES.length),
  },
  {
    id: 'space',
    name: 'Hasta el Infinito',
    desc: 'Compra el Programa Espacial',
    icon: '🚀',
    done: (s) => businessCount(s, 'rocket') >= 1,
    progress: (s) => cap(businessCount(s, 'rocket') / 1),
  },

  /* ---- Toques ---- */
  {
    id: 'clicker-god',
    name: 'Dios del Clic',
    desc: 'Toca 10,000 veces',
    icon: '⚡',
    done: (s) => s.taps >= 10_000,
    progress: (s) => cap(s.taps / 10_000),
  },

  /* ---- Dinero ---- */
  {
    id: 'hundred',
    name: 'Calderilla',
    desc: 'Gana $100 en total',
    icon: '🪙',
    done: (s) => s.totalEarned >= 100,
    progress: (s) => cap(s.totalEarned / 100),
  },
  {
    id: 'trillionaire',
    name: 'Billonario Global',
    desc: 'Gana $1,000,000,000,000 en total',
    icon: '🌍',
    done: (s) => s.totalEarned >= 1e12,
    progress: (s) => cap(s.totalEarned / 1e12),
  },
  {
    id: 'lifetime-mega',
    name: 'Fortuna Eterna',
    desc: 'Acumula $10B entre todas tus vidas',
    icon: '♾️',
    done: (s) => s.lifetimeEarned >= 1e10,
    progress: (s) => cap(s.lifetimeEarned / 1e10),
  },

  /* ---- Negocios ---- */
  {
    id: 'empire',
    name: 'Imperio',
    desc: 'Posee 500 negocios',
    icon: '🏙️',
    done: (s) => ownedTotal(s) >= 500,
    progress: (s) => cap(ownedTotal(s) / 500),
  },
  {
    id: 'monopoly',
    name: 'Monopolio',
    desc: 'Ten 50 unidades de un mismo negocio',
    icon: '📊',
    done: (s) => BUSINESSES.some((b) => businessCount(s, b.id) >= 50),
    progress: (s) => cap(Math.max(...BUSINESSES.map((b) => businessCount(s, b.id))) / 50),
  },

  /* ---- Mejoras ---- */
  {
    id: 'improver',
    name: 'Optimizador',
    desc: 'Compra 10 mejoras de negocio',
    icon: '🔧',
    done: (s) => upgradeTotal(s) >= 10,
    progress: (s) => cap(upgradeTotal(s) / 10),
  },
  {
    id: 'strong-hands',
    name: 'Puño de Titán',
    desc: 'Mejora la mano de obra al nivel 15',
    icon: '🤜',
    done: (s) => s.tapLevel >= 15,
    progress: (s) => cap(s.tapLevel / 15),
  },

  /* ---- Prestigio: Nivel 1 ---- */
  {
    id: 'reborn',
    name: 'Vida Nueva',
    desc: 'Renace por primera vez',
    icon: '🔄',
    done: (s) => s.rebirths >= 1,
    progress: (s) => cap(s.rebirths / 1),
  },
  {
    id: 'alien-friends',
    name: 'Amigos del Espacio',
    desc: 'Acumula 40 Lingotes',
    icon: '👽',
    done: (s) => s.ingots >= 40,
    progress: (s) => cap(s.ingots / 40),
  },

  /* ---- Prestigio: Nivel 2 ---- */
  {
    id: 'portal-open',
    name: 'Viajero Dimensional',
    desc: 'Abre el Portal Dimensional (nivel 2)',
    icon: '🌀',
    done: (s) => s.tier2 >= 1,
    progress: (s) => cap(s.tier2 / 1),
  },
  {
    id: 'crystal-hoard',
    name: 'Coleccionista de Cristales',
    desc: 'Acumula 25 Cristales',
    icon: '💠',
    done: (s) => s.crystals >= 25,
    progress: (s) => cap(s.crystals / 25),
  },

  /* ---- Prestigio: Nivel 3 ---- */
  {
    id: 'ascended',
    name: 'Ascensión',
    desc: 'Alcanza El Cielo (nivel 3)',
    icon: '☁️',
    done: (s) => s.tier3 >= 1,
    progress: (s) => cap(s.tier3 / 1),
  },
  {
    id: 'star-lord',
    name: 'Señor de las Estrellas',
    desc: 'Consigue 5 Estrellas',
    icon: '⭐',
    done: (s) => s.stars >= 5,
    progress: (s) => cap(s.stars / 5),
  },

  /* ---- Logros OCULTOS ---- */
  {
    id: 'night-owl',
    name: 'Búho Nocturno',
    desc: 'Reclama tus ganancias offline a las 3 de la madrugada',
    icon: '🦉',
    hidden: true,
    done: (s) => s.totalEarned >= 50 && new Date().getHours() === 3,
    progress: () => 0,
  },
  {
    id: 'speed-demon',
    name: 'Velocista',
    desc: 'Gana $1,000 en menos de 60 segundos desde el inicio',
    icon: '🏎️',
    hidden: true,
    done: (s) => s.lifetimeEarned >= 1000,
    progress: (s) => cap(s.lifetimeEarned / 1000),
  },
  {
    id: 'whale',
    name: 'La Ballena',
    desc: 'Acumula $1,000,000,000,000 en una sola vida',
    icon: '🐋',
    hidden: true,
    done: (s) => s.totalEarned >= 1e12,
    progress: (s) => cap(s.totalEarned / 1e12),
  },
  {
    id: 'transcendent',
    name: 'Trascendente',
    desc: 'Consigue al menos 1 Lingote, 1 Cristal y 1 Estrella',
    icon: '🌟',
    hidden: true,
    done: (s) => s.ingots >= 1 && s.crystals >= 1 && s.stars >= 1,
    progress: (s) => cap((Math.min(s.ingots, 1) + Math.min(s.crystals, 1) + Math.min(s.stars, 1)) / 3),
  },
  {
    id: 'finger-of-doom',
    name: 'Dedo de la Perdición',
    desc: 'Toca 100,000 veces en total',
    icon: '💥',
    hidden: true,
    done: (s) => s.taps >= 100_000,
    progress: (s) => cap(s.taps / 100_000),
  },
];
