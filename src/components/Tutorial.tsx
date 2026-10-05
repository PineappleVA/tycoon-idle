import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TourStep {
  /** CSS selector del elemento a resaltar. Si falta, la tarjeta se muestra libre. */
  selector?: string;
  title: string;
  text: string;
  emoji: string;
  /**
   * Si existe, el usuario debe completar esta acción para avanzar
   * (en vez del botón "Siguiente"). Por ahora admitimos: 'tap' (tocar el
   * elemento resaltado) y 'click' (pulsar un botón dentro del elemento).
   */
  action?: { type: 'tap' | 'click'; hint: string };
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type Accent = 'amber' | 'fuchsia' | 'emerald';

const ACCENTS: Record<Accent, { ring: string; text: string; chip: string; btn: string }> = {
  amber: {
    ring: 'rgba(251,191,36,0.95)',
    text: 'text-amber-200',
    chip: 'bg-amber-400/15',
    btn: 'from-amber-400 to-orange-500',
  },
  fuchsia: {
    ring: 'rgba(232,121,249,0.95)',
    text: 'text-fuchsia-200',
    chip: 'bg-fuchsia-400/15',
    btn: 'from-fuchsia-500 to-purple-600',
  },
  emerald: {
    ring: 'rgba(52,211,153,0.95)',
    text: 'text-emerald-200',
    chip: 'bg-emerald-400/15',
    btn: 'from-emerald-400 to-teal-500',
  },
};

export function Tutorial({
  steps,
  label = 'Tutorial',
  accent = 'amber',
  onFinish,
}: {
  steps: TourStep[];
  label?: string;
  accent?: Accent;
  onFinish: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false); // acción completada
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const step = steps[i];
  const a = ACCENTS[accent];

  const measure = useCallback(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    if (!step.action) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const r = el.getBoundingClientRect();
    const pad = 8;
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [step]);

  useLayoutEffect(() => {
    measure();
    const t = window.setTimeout(measure, 280);
    return () => window.clearTimeout(t);
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // Reset interacción al cambiar de paso y posición inicial junto al foco
  useEffect(() => {
    setDone(false);
    setPos(null);
  }, [i]);

  const last = i === steps.length - 1;
  const next = () => {
    if (step.action && !done) return;
    if (last) onFinish();
    else setI((v) => v + 1);
  };
  const prev = () => setI((v) => Math.max(0, v - 1));

  // --- arrastre de la tarjeta ---
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { dx: e.clientX - (pos?.x ?? e.clientX), dy: e.clientY - (pos?.y ?? e.clientY) };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = Math.max(8, Math.min(window.innerWidth - 8, e.clientX - dragRef.current.dx));
    const ny = Math.max(8, Math.min(window.innerHeight - 8, e.clientY - dragRef.current.dy));
    setPos({ x: nx, y: ny });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  // --- interacción con el elemento resaltado ---
  const onTargetClick = useCallback(() => {
    if (step.action) setDone(true);
  }, [step]);

  useEffect(() => {
    if (!step.selector || !step.action) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    el.addEventListener('click', onTargetClick, true);
    el.addEventListener('pointerdown', onTargetClick, true);
    return () => {
      el.removeEventListener('click', onTargetClick, true);
      el.removeEventListener('pointerdown', onTargetClick, true);
    };
  }, [step, onTargetClick]);

  // Posición de la tarjeta
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let cardStyle: React.CSSProperties;
  if (pos) {
    cardStyle = { left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' };
  } else if (rect) {
    const below = rect.top + rect.height < vh * 0.55;
    cardStyle = below
      ? { top: rect.top + rect.height + 22, left: '50%', transform: 'translateX(-50%)' }
      : { top: Math.max(16, rect.top - 22), left: '50%', transform: 'translate(-50%, -100%)' };
  } else {
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {/* Overlay con foco recortado */}
      {rect ? (
        <>
          <div
            className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-out"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: '0 0 0 9999px rgba(2,6,23,0.85)',
              outline: `3px solid ${a.ring}`,
              outlineOffset: 2,
              animation: 'pulseRing 1.8s ease-out infinite',
            }}
          />
          {!step.action && (
            <div
              key={`arrow-${i}`}
              className="pointer-events-none absolute text-2xl"
              style={
                rect.top + rect.height < vh * 0.55
                  ? { top: rect.top + rect.height + 2, left: '50%', transform: 'translateX(-50%)', animation: 'bobDown 1s ease-in-out infinite' }
                  : { top: rect.top - 30, left: '50%', transform: 'translateX(-50%)', animation: 'bobUp 1s ease-in-out infinite' }
              }
            >
              {rect.top + rect.height < vh * 0.55 ? '👆' : '👇'}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-950/85" />
      )}

      {/* Tarjeta arrastrable */}
      <div
        key={i}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="animate-pop pointer-events-auto absolute z-[91] w-[min(21rem,92vw)] touch-none overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl"
        style={cardStyle}
      >
        {/* cabecera (asidero de arrastre) */}
        <div className="flex cursor-grab items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2 active:cursor-grabbing">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${a.text}`}>
            <span className="cursor-move">⠿</span> {label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums text-slate-400">{i + 1} / {steps.length}</span>
            <button
              onClick={onFinish}
              aria-label="Cerrar"
              className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`animate-coin flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${a.chip}`}>
              {step.emoji}
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold ${a.text}`}>{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.text}</p>
              {step.action && (
                <p className="mt-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-amber-200/90">
                  ✋ {step.action.hint}
                  {done && <span className="ml-1 text-emerald-400">✓ hecho</span>}
                </p>
              )}
            </div>
          </div>

          {/* Progreso por puntos */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === i ? `w-5 bg-current ${a.text}` : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button onClick={onFinish} className="text-xs text-slate-500 transition hover:text-slate-300">
              Saltar
            </button>
            <div className="flex gap-2">
              {i > 0 && (
                <button
                  onClick={prev}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/20"
                >
                  Atrás
                </button>
              )}
              {step.action ? (
                <button
                  onClick={next}
                  disabled={!done}
                  className={`rounded-lg bg-gradient-to-r ${a.btn} px-4 py-1.5 text-sm font-bold text-slate-900 shadow transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {done ? (last ? '¡Entendido!' : 'Siguiente') : 'Completa la acción…'}
                </button>
              ) : (
                <button
                  onClick={next}
                  className={`rounded-lg bg-gradient-to-r ${a.btn} px-4 py-1.5 text-sm font-bold text-slate-900 shadow transition hover:brightness-110 active:scale-95`}
                >
                  {last ? '¡Entendido!' : 'Siguiente'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
