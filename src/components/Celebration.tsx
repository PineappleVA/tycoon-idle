import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ráfaga de confeti que se dispara al desbloquear un logro.
 *
 * Es puramente decorativo: no recibe callbacks ni bloquea nada
 * (`pointer-events-none`) y se desmonta solo. Las partículas se derivan de una
 * semilla determinista para que el mismo logro produzca siempre la misma ráfaga
 * y el render sea estable.
 */
const PARTICLES = 26;
const LIFE_MS = 1_200;
const COLORS = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#a78bfa', '#fb7185'];

function burst(seed: number) {
  return Array.from({ length: PARTICLES }, (_, i) => {
    // Mezcla barata pero estable: misma semilla => misma ráfaga.
    const r = (n: number) => {
      const x = Math.sin(seed * 12.9898 + i * 78.233 + n * 37.719) * 43758.5453;
      return x - Math.floor(x);
    };
    const angle = (i / PARTICLES) * Math.PI * 2 + r(1) * 0.5;
    const dist = 90 + r(2) * 190;
    return {
      cx: `${Math.cos(angle) * dist}px`,
      cy: `${Math.sin(angle) * dist + 120}px`, // la gravedad tira hacia abajo
      cr: `${(r(3) - 0.5) * 900}deg`,
      color: COLORS[Math.floor(r(4) * COLORS.length)],
      size: 5 + Math.floor(r(5) * 7),
      delay: Math.floor(r(6) * 160),
      round: r(7) > 0.5,
    };
  });
}

export function Celebration({ trigger }: { trigger: string | null }) {
  const [active, setActive] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    setActive(trigger);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(null), LIFE_MS);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [trigger]);

  // Semilla numérica estable a partir del id del logro.
  const seed = useMemo(() => {
    if (!active) return 0;
    let h = 0;
    for (let i = 0; i < active.length; i++) h = (h * 31 + active.charCodeAt(i)) % 100000;
    return h;
  }, [active]);

  const particles = useMemo(() => (active ? burst(seed) : []), [active, seed]);
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      <div className="animate-celebrate-flash absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/40 blur-2xl" />
      <div className="absolute left-1/2 top-1/3">
        {particles.map((p, i) => (
          <span
            key={i}
            className="animate-confetti absolute block"
            style={{
              width: p.size,
              height: p.size * (p.round ? 1 : 1.8),
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : '2px',
              animationDelay: `${p.delay}ms`,
              ['--cx' as string]: p.cx,
              ['--cy' as string]: p.cy,
              ['--cr' as string]: p.cr,
            }}
          />
        ))}
      </div>
    </div>
  );
}
