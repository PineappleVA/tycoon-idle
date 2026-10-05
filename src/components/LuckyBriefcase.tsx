import { useEffect, useMemo, useState } from 'react';
import { LUCK_LIFE_MS } from '../game/balance';
import type { LuckReward } from '../game/useGame';

const LABELS: Record<LuckReward, { icon: string; title: string; desc: string }> = {
  fever: {
    icon: '🔥',
    title: '¡Fiebre del oro!',
    desc: 'Tus ingresos se multiplican durante 30 segundos.',
  },
  midas: {
    icon: '✨',
    title: '¡Toque de Midas!',
    desc: 'Cada toque vale 20 veces más durante 20 segundos.',
  },
  windfall: {
    icon: '💰',
    title: '¡Golpe de suerte!',
    desc: 'Cobras 15 minutos de producción al instante.',
  },
};

/**
 * El maletín de suerte: aparece solo cada poco tiempo, se queda unos segundos y
 * desaparece si no lo pillas. Es el gancho para mirar la pantalla en vez de
 * dejar el juego corriendo en segundo plano.
 */
export function LuckyBriefcase({
  active,
  onGrab,
}: {
  active: boolean;
  onGrab: () => LuckReward | null;
}) {
  const [burst, setBurst] = useState<LuckReward | null>(null);
  // Posición nueva en cada aparición: si no, siempre sale en el mismo sitio y
  // se convierte en un clic automático sin gracia.
  const spot = useMemo(
    () => ({
      left: 8 + Math.random() * 74,
      top: 18 + Math.random() * 54,
      delay: Math.random() * 0.6,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active],
  );

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(null), 2_600);
    return () => window.clearTimeout(t);
  }, [burst]);

  if (!active && !burst) return null;

  return (
    <>
      {active && (
        <button
          onClick={() => setBurst(onGrab())}
          aria-label="¡Pilla el maletín de suerte!"
          className="animate-luckBob fixed z-[65] -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ left: `${spot.left}%`, top: `${spot.top}%`, animationDelay: `${spot.delay}s` }}
        >
          <span className="relative block">
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-yellow-300/50 blur-xl" aria-hidden />
            <span className="relative block text-5xl drop-shadow-[0_0_18px_rgba(253,224,71,0.9)] transition-transform duration-150 hover:scale-125 active:scale-95">
              💼
            </span>
          </span>
        </button>
      )}

      {burst && (
        <div
          className="animate-pop pointer-events-none fixed left-1/2 top-1/3 z-[66] w-72 -translate-x-1/2 rounded-2xl border border-yellow-300/50 bg-gradient-to-br from-yellow-500/95 to-amber-600/95 p-4 text-center shadow-2xl shadow-amber-900/40 backdrop-blur"
          role="status"
        >
          <div className="text-4xl" aria-hidden>
            {LABELS[burst].icon}
          </div>
          <div className="mt-1 text-base font-black text-amber-950">{LABELS[burst].title}</div>
          <div className="mt-0.5 text-xs font-medium text-amber-900/90">{LABELS[burst].desc}</div>
        </div>
      )}
    </>
  );
}

/** Cuánto dura el maletín en pantalla (lo usa el aviso de "casi se escapa"). */
export const LUCK_WINDOW_MS = LUCK_LIFE_MS;
