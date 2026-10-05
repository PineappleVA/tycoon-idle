import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { formatMoney } from '../game/format';
import { TAP_VALUE_PER_LEVEL } from '../game/balance';

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  drift: number;
  passive?: boolean;
  scale?: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

let floatId = 0;

const MAX_FLOATS = 28;
const FLOAT_LIFE_MS = 1_000;
const PASSIVE_LIFE_MS = 1_500;

export const TapPanel = forwardRef<
  HTMLButtonElement,
  {
    onTap: () => void;
    tapWorth: number;
    income: number;
    tapLevel: number;
  }
>(function TapPanel({ onTap, tapWorth, income, tapLevel }, ref) {
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pressed, setPressed] = useState(false);

  const spawn = useCallback((f: Omit<FloatText, 'id'>) => {
    const id = ++floatId;
    setFloats((prev) => [...prev.slice(-(MAX_FLOATS - 1)), { ...f, id }]);
    window.setTimeout(() => setFloats((prev) => prev.filter((x) => x.id !== id)), f.passive ? PASSIVE_LIFE_MS : FLOAT_LIFE_MS);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onTap();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawn({
        x,
        y,
        text: '+' + formatMoney(tapWorth),
        drift: (Math.random() - 0.5) * 46,
        scale: 1 + Math.min(0.5, tapLevel * 0.02),
      });
      const rid = ++floatId;
      setRipples((prev) => [...prev.slice(-3), { id: rid, x, y }]);
      window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== rid)), 700);
      setPressed(true);
    },
    [onTap, tapWorth, tapLevel, spawn],
  );

  // Partículas de ingreso pasivo. `income` se lee por ref: cambia en cada tick
  // y si estuviera en las dependencias el intervalo se recrearía 10 veces/s.
  const incomeRef = useRef(income);
  incomeRef.current = income;

  useEffect(() => {
    const iv = window.setInterval(() => {
      const current = incomeRef.current;
      if (current <= 0) return;
      const el = (ref as React.RefObject<HTMLButtonElement | null>)?.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      spawn({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h * 0.72,
        text: '+' + formatMoney(current),
        drift: (Math.random() - 0.5) * 30,
        passive: true,
      });
    }, 1_000);
    return () => window.clearInterval(iv);
  }, [ref, spawn]);

  return (
    <button
      ref={ref}
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      data-tour="tap"
      aria-label="Toca para trabajar"
      className={cn(
        'group relative flex h-72 w-full select-none flex-col items-center justify-center overflow-hidden rounded-3xl',
        'border border-amber-300/20 bg-gradient-to-br from-amber-500/90 via-orange-500/90 to-rose-500/90',
        'shadow-[0_20px_60px_-15px_rgba(245,158,11,0.6)] transition-transform duration-100 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60',
        pressed ? 'scale-[0.975]' : 'scale-100 hover:scale-[1.01]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.35),transparent_55%)]" />
      <div
        className={cn(
          'shimmer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200',
          pressed && 'opacity-100',
        )}
      />

      {/* ondas al tocar */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-24 w-24 rounded-full border-2 border-white/70"
          style={{ left: r.x - 48, top: r.y - 48, animation: 'tapRipple 0.7s ease-out forwards' }}
        />
      ))}

      <div
        className="animate-coin text-7xl drop-shadow-lg"
        style={{ transform: pressed ? 'scale(0.9)' : undefined, transition: 'transform 90ms ease-out' }}
        aria-hidden
      >
        💼
      </div>
      <div className="mt-3 text-sm font-medium text-white/90">Toca para trabajar</div>
      <div className="text-2xl font-extrabold tabular-nums text-white drop-shadow">
        +{formatMoney(tapWorth)}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-full bg-black/25 px-4 py-1 text-xs font-medium text-white/90 backdrop-blur">
        <span>Pasivo: +{formatMoney(income)}/s</span>
        {tapLevel > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            Mano de obra Nv.{tapLevel} · +{tapLevel * TAP_VALUE_PER_LEVEL} base
          </span>
        )}
      </div>

      {floats.map((f) => (
        <span
          key={f.id}
          className={cn(
            'pointer-events-none absolute font-extrabold drop-shadow-lg',
            f.passive ? 'text-sm text-emerald-100/90' : 'text-lg text-white',
          )}
          style={
            {
              left: f.x,
              top: f.y,
              fontSize: f.scale ? `${f.scale}em` : undefined,
              '--drift': `${f.drift}px`,
              animation: `${f.passive ? 'floatUpSoft' : 'floatUp'} ${f.passive ? '1.5s' : '1s'} cubic-bezier(0.2,0.7,0.3,1) forwards`,
            } as React.CSSProperties
          }
        >
          {f.text}
        </span>
      ))}
    </button>
  );
});
