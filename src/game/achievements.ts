import { BALANZA_THRESHOLD, SOULS_MAX_PER_FALL } from './balance';
import { BUSINESSES } from './data';
import {
  availableInvestors,
  businessCount,
  businessUpgrade,
  employeesAssignedTo,
  type GameState,
  ownedBusinessCount,
  plotsUnlocked,
  totalPlots,
} from './logic';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** Predicado PURO sobre el estado: no puede leer el reloj ni Math.random. */
  done: (s: GameState) => boolean;
  /** Progreso 0..1 para la barra. */
  progress: (s: GameState) => number;
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
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Progreso lineal hacia un objetivo, con protección contra división por 0. */
function toward(value: number, target: number): number {
  return target > 0 ? cap(value / target) : 0;
}

const UNITS_TARGETS = [10, 100, 500] as const;

export const ACHIEVEMENTS: Achievement[] = [
  /* ---- Primeros pasos ---- */
  {
    id: 'first-buck',
    name: 'Primer Dólar',
    desc: 'Gana tu primer $1',
    icon: '🪙',
    done: (s) => s.totalEarned >= 1,
    progress: (s) => toward(s.totalEarned, 1),
  },
  {
    id: 'clicker',
    name: 'Manos a la Obra',
    desc: 'Toca 100 veces',
    icon: '👆',
    done: (s) => s.taps >= 100,
    progress: (s) => toward(s.taps, 100),
  },
  {
    id: 'clicker-pro',
    name: 'Dedos de Acero',
    desc: 'Toca 1.000 veces',
    icon: '💪',
    done: (s) => s.taps >= 1_000,
    progress: (s) => toward(s.taps, 1_000),
  },
  {
    id: 'clicker-god',
    name: 'Dios del Clic',
    desc: 'Toca 10.000 veces',
    icon: '⚡',
    done: (s) => s.taps >= 10_000,
    progress: (s) => toward(s.taps, 10_000),
  },

  /* ---- Dinero ---- */
  {
    id: 'hundred',
    name: 'Calderilla',
    desc: 'Gana $100 en total',
    icon: '🪙',
    done: (s) => s.totalEarned >= 100,
    progress: (s) => toward(s.totalEarned, 100),
  },
  {
    id: 'thousandaire',
    name: 'Milarista',
    desc: 'Gana $10.000 en total',
    icon: '💵',
    done: (s) => s.totalEarned >= 10_000,
    progress: (s) => toward(s.totalEarned, 10_000),
  },
  {
    id: 'millionaire',
    name: 'Millonario',
    desc: 'Gana $1.000.000 en total',
    icon: '💰',
    done: (s) => s.totalEarned >= 1e6,
    progress: (s) => toward(s.totalEarned, 1e6),
  },
  {
    id: 'billionaire',
    name: 'Multimillonario',
    desc: 'Gana $1.000.000.000 en total',
    icon: '🏦',
    done: (s) => s.totalEarned >= 1e9,
    progress: (s) => toward(s.totalEarned, 1e9),
  },
  {
    id: 'trillionaire',
    name: 'Billonario Global',
    desc: 'Gana $1 billón en total',
    icon: '🌍',
    done: (s) => s.totalEarned >= 1e12,
    progress: (s) => toward(s.totalEarned, 1e12),
  },

  /* ---- Negocios ---- */
  {
    id: 'entrepreneur',
    name: 'Emprendedor',
    desc: 'Posee 10 negocios',
    icon: '🧑‍💼',
    done: (s) => ownedTotal(s) >= UNITS_TARGETS[0],
    progress: (s) => toward(ownedTotal(s), UNITS_TARGETS[0]),
  },
  {
    id: 'mogul',
    name: 'Magnate',
    desc: 'Posee 100 negocios',
    icon: '🎩',
    done: (s) => ownedTotal(s) >= UNITS_TARGETS[1],
    progress: (s) => toward(ownedTotal(s), UNITS_TARGETS[1]),
  },
  {
    id: 'empire',
    name: 'Imperio',
    desc: 'Posee 500 negocios',
    icon: '🏙️',
    done: (s) => ownedTotal(s) >= UNITS_TARGETS[2],
    progress: (s) => toward(ownedTotal(s), UNITS_TARGETS[2]),
  },
  {
    id: 'monopoly',
    name: 'Monopolio',
    desc: 'Ten 50 unidades de un mismo negocio',
    icon: '📊',
    done: (s) => BUSINESSES.some((b) => businessCount(s, b.id) >= 50),
    progress: (s) => toward(Math.max(0, ...BUSINESSES.map((b) => businessCount(s, b.id))), 50),
  },
  {
    id: 'tycoon',
    name: 'Gran Tycoon',
    desc: 'Desbloquea todos los negocios',
    icon: '👑',
    done: (s) => BUSINESSES.every((b) => s.totalEarned >= b.unlockAt),
    progress: (s) => toward(BUSINESSES.filter((b) => s.totalEarned >= b.unlockAt).length, BUSINESSES.length),
  },
  {
    id: 'space',
    name: 'Hasta el Infinito',
    desc: 'Compra el Programa Espacial',
    icon: '🚀',
    done: (s) => businessCount(s, 'rocket') >= 1,
    progress: (s) => toward(businessCount(s, 'rocket'), 1),
  },

  /* ---- Mejoras ---- */
  {
    id: 'improver',
    name: 'Optimizador',
    desc: 'Compra 10 mejoras de negocio',
    icon: '🔧',
    done: (s) => upgradeTotal(s) >= 10,
    progress: (s) => toward(upgradeTotal(s), 10),
  },
  {
    id: 'strong-hands',
    name: 'Puño de Titán',
    desc: 'Mejora la mano de obra al nivel 15',
    icon: '🤜',
    done: (s) => s.tapLevel >= 15,
    progress: (s) => toward(s.tapLevel, 15),
  },

  /* ---- Parcelas ---- */
  {
    id: 'landlord',
    name: 'Terrateniente',
    desc: 'Desbloquea el sistema de Parcelas',
    icon: '🏞️',
    done: plotsUnlocked,
    progress: (s) => (plotsUnlocked(s) ? 1 : 0),
  },
  {
    id: 'full-plots',
    name: 'Plantilla Completa',
    desc: 'Asigna un empleado a cada parcela',
    icon: '👷',
    done: (s) => totalPlots(s) > 0 && Object.keys(s.plotAssignments).length >= totalPlots(s),
    progress: (s) => toward(Object.keys(s.plotAssignments).length, totalPlots(s)),
  },

  /* ---- Prestigio ---- */
  {
    id: 'reborn',
    name: 'Vida Nueva',
    desc: 'Renace por primera vez',
    icon: '🔄',
    done: (s) => s.rebirths >= 1,
    progress: (s) => toward(s.rebirths, 1),
  },
  {
    id: 'alien-friends',
    name: 'Amigos del Espacio',
    desc: 'Acumula 40 Inversores',
    icon: '👽',
    done: (s) => availableInvestors(s) >= 40,
    progress: (s) => toward(availableInvestors(s), 40),
  },
  {
    id: 'portal-open',
    name: 'Viajero Dimensional',
    desc: 'Abre el Portal Dimensional (nivel 2)',
    icon: '🌀',
    done: (s) => s.tier2 >= 1,
    progress: (s) => toward(s.tier2, 1),
  },
  {
    id: 'crystal-hoard',
    name: 'Coleccionista de Cristales',
    desc: 'Acumula 25 Cristales',
    icon: '💠',
    done: (s) => s.crystals >= 25,
    progress: (s) => toward(s.crystals, 25),
  },
  {
    id: 'ascended',
    name: 'Ascensión',
    desc: 'Alcanza El Cielo (nivel 3)',
    icon: '☁️',
    done: (s) => s.tier3 >= 1,
    progress: (s) => toward(s.tier3, 1),
  },
  {
    id: 'star-lord',
    name: 'Señor de las Estrellas',
    desc: 'Consigue 5 Estrellas',
    icon: '⭐',
    done: (s) => s.stars >= 5,
    progress: (s) => toward(s.stars, 5),
  },
  {
    id: 'soul-collector',
    name: 'Coleccionista de Almas',
    desc: `Reúne ${SOULS_MAX_PER_FALL * 3} Almas`,
    icon: '🔥',
    done: (s) => s.souls >= SOULS_MAX_PER_FALL * 3,
    progress: (s) => toward(s.souls, SOULS_MAX_PER_FALL * 3),
  },
  {
    id: 'the-scales',
    name: 'La Balanza',
    desc: `Cae ${BALANZA_THRESHOLD} veces al Infierno y gana el derecho a elegir`,
    icon: '⚖️',
    hidden: true,
    done: (s) => s.hellFalls >= BALANZA_THRESHOLD,
    progress: (s) => toward(s.hellFalls, BALANZA_THRESHOLD),
  },

  /* ---- Secretos ---- */
  {
    // Depende del estado (hora registrada al cobrar), no del reloj en vivo:
    // antes leía new Date().getHours() dentro del predicado y el logro
    // aparecía y desaparecía según la hora real del equipo.
    id: 'night-owl',
    name: 'Búho Nocturno',
    desc: 'Cobra tus ganancias offline entre las 3 y las 4 de la madrugada',
    icon: '🦉',
    hidden: true,
    done: (s) => s.offlineClaimHour === 3,
    progress: () => 0,
  },
  {
    // Ahora mide el tiempo real de la vida actual (runStartedAt), no el lifetime.
    id: 'speed-demon',
    name: 'Velocista',
    desc: 'Gana $1.000 en menos de 60 segundos desde el inicio de una vida',
    icon: '🏎️',
    hidden: true,
    done: (s) => s.totalEarned >= 1_000 && Date.now() - s.runStartedAt < 60_000,
    progress: (s) => toward(s.totalEarned, 1_000),
  },
  {
    id: 'whale',
    name: 'La Ballena',
    desc: 'Acumula $1 billón en una sola vida',
    icon: '🐋',
    hidden: true,
    done: (s) => s.totalEarned >= 1e12,
    progress: (s) => toward(s.totalEarned, 1e12),
  },
  {
    id: 'lifetime-mega',
    name: 'Fortuna Eterna',
    desc: 'Acumula $10.000M entre todas tus vidas',
    icon: '♾️',
    done: (s) => s.lifetimeEarned >= 1e10,
    progress: (s) => toward(s.lifetimeEarned, 1e10),
  },
  {
    id: 'transcendent',
    name: 'Trascendente',
    desc: 'Consigue al menos 1 Inversor, 1 Cristal y 1 Estrella',
    icon: '🌟',
    hidden: true,
    done: (s) => availableInvestors(s) >= 1 && s.crystals >= 1 && s.stars >= 1,
    progress: (s) =>
      cap(
        (Math.min(availableInvestors(s), 1) + Math.min(s.crystals, 1) + Math.min(s.stars, 1)) / 3,
      ),
  },
  {
    id: 'finger-of-doom',
    name: 'Dedo de la Perdición',
    desc: 'Toca 100.000 veces en total',
    icon: '💥',
    hidden: true,
    done: (s) => s.taps >= 100_000,
    progress: (s) => toward(s.taps, 100_000),
  },
  {
    id: 'employer',
    name: 'Jefe de Personal',
    desc: 'Ten 10 empleados asignados a un mismo negocio',
    icon: '📋',
    hidden: true,
    done: (s) => BUSINESSES.some((b) => employeesAssignedTo(s, b.id) >= 10),
    progress: (s) =>
      toward(Math.max(0, ...BUSINESSES.map((b) => employeesAssignedTo(s, b.id))), 10),
  },
  {
    id: 'owner',
    name: 'Propietario Total',
    desc: 'Posee los 8 negocios a la vez',
    icon: '🗝️',
    hidden: true,
    done: (s) => ownedBusinessCount(s) >= BUSINESSES.length,
    progress: (s) => toward(ownedBusinessCount(s), BUSINESSES.length),
  },
];
