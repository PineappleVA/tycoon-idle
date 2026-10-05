import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

/**
 * Interpola suavemente hacia un valor objetivo con requestAnimationFrame.
 *
 * Detalles:
 *  - Usa el reloj de la animación (no setState por frame sin control), así que
 *    un cambio de objetivo a mitad de la transición parte del valor visible
 *    en vez de dar un salto.
 *  - Si el valor crece de forma continua (ingresos por segundo) la animación
 *    nunca se "reinicia": se reancla al valor mostrado.
 *  - Respeta `prefers-reduced-motion`: muestra el valor directamente.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 450,
  className,
}: {
  value: number;
  format: (n: number) => string;
  /** ms de la interpolación; 0 desactiva la animación. */
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduce || duration <= 0 || !Number.isFinite(value)) {
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    if (from === value) return;

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (value - from) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums', className)} aria-label={format(value)}>
      {format(Number.isFinite(display) ? display : value)}
    </span>
  );
}
