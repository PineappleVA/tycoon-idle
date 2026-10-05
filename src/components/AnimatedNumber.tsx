import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates towards a target value using requestAnimationFrame.
 * `format` turns the numeric value into the displayed string.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);
  const targetRef = useRef(value);

  useEffect(() => {
    targetRef.current = value;
    fromRef.current = display;
    startRef.current = performance.now();

    const duration = 450;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (targetRef.current - fromRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}
