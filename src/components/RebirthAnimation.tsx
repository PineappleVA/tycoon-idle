import { useEffect, useMemo, useState } from 'react';
import { TierLevel } from '../game/logic';

export function RebirthAnimation({
  level,
  skyOutcome,
  portalRebirths = 0,
  onDone,
}: {
  level: TierLevel;
  skyOutcome?: 'heaven' | 'hell' | null;
  portalRebirths?: number;
  onDone: () => void;
}) {
  if (level === 1) return <SpaceAnim onDone={onDone} />;
  if (level === 2) return <PortalAnim onDone={onDone} themeIndex={portalRebirths} />;
  if (skyOutcome === 'hell') return <HellAnim onDone={onDone} />;
  return <HeavenAnim onDone={onDone} />;
}

/* Paletas de color distintas para el Portal — cambian cada vez que renaces en el nivel 2 */
const PORTAL_THEMES = [
  {
    name: 'Dimensión Violeta',
    conic: 'conic-gradient(from 0deg, #d946ef, #8b5cf6, #6366f1, #3b82f6, #06b6d4, #a855f7, #d946ef)',
    core: 'radial-gradient(circle, #f9a8d4, #8b5cf6 40%, #090514)',
    glow: 'rgba(168,85,247,0.7)',
    bg: 'radial-gradient(circle, transparent 15%, #1e1b4b 55%, #030014 100%)',
    revealBg: 'radial-gradient(ellipse at 50% 40%, #4c1d95, #1e1b4b 50%, #030014)',
    nebula1: 'bg-fuchsia-500/25',
    nebula2: 'bg-indigo-500/25',
    text: 'from-fuchsia-300 via-purple-200 to-fuchsia-300',
    ring: 'text-fuchsia-300',
    ring2: 'text-violet-200',
  },
  {
    name: 'Dimensión Glacial',
    conic: 'conic-gradient(from 0deg, #22d3ee, #38bdf8, #60a5fa, #818cf8, #67e8f9, #22d3ee)',
    core: 'radial-gradient(circle, #e0f2fe, #38bdf8 40%, #041a2e)',
    glow: 'rgba(56,189,248,0.7)',
    bg: 'radial-gradient(circle, transparent 15%, #0c2a3e 55%, #010a14 100%)',
    revealBg: 'radial-gradient(ellipse at 50% 40%, #0e7490, #0c2a3e 50%, #010a14)',
    nebula1: 'bg-cyan-400/25',
    nebula2: 'bg-blue-500/25',
    text: 'from-cyan-200 via-sky-200 to-cyan-200',
    ring: 'text-cyan-300',
    ring2: 'text-sky-200',
  },
  {
    name: 'Dimensión Ígnea',
    conic: 'conic-gradient(from 0deg, #f97316, #ef4444, #f59e0b, #dc2626, #fb923c, #f97316)',
    core: 'radial-gradient(circle, #fed7aa, #f97316 40%, #2c0a02)',
    glow: 'rgba(249,115,22,0.7)',
    bg: 'radial-gradient(circle, transparent 15%, #3f1208 55%, #140401 100%)',
    revealBg: 'radial-gradient(ellipse at 50% 40%, #9a3412, #3f1208 50%, #140401)',
    nebula1: 'bg-orange-500/25',
    nebula2: 'bg-red-500/25',
    text: 'from-orange-300 via-amber-200 to-orange-300',
    ring: 'text-orange-300',
    ring2: 'text-amber-200',
  },
  {
    name: 'Dimensión Esmeralda',
    conic: 'conic-gradient(from 0deg, #34d399, #10b981, #22c55e, #4ade80, #2dd4bf, #34d399)',
    core: 'radial-gradient(circle, #d1fae5, #10b981 40%, #022c22)',
    glow: 'rgba(16,185,129,0.7)',
    bg: 'radial-gradient(circle, transparent 15%, #04302a 55%, #010f0c 100%)',
    revealBg: 'radial-gradient(ellipse at 50% 40%, #065f46, #04302a 50%, #010f0c)',
    nebula1: 'bg-emerald-500/25',
    nebula2: 'bg-teal-500/25',
    text: 'from-emerald-300 via-teal-200 to-emerald-300',
    ring: 'text-emerald-300',
    ring2: 'text-teal-200',
  },
  {
    name: 'Dimensión Áurea',
    conic: 'conic-gradient(from 0deg, #fbbf24, #f43f5e, #ec4899, #fb7185, #facc15, #fbbf24)',
    core: 'radial-gradient(circle, #fef3c7, #f43f5e 40%, #2c0512)',
    glow: 'rgba(244,63,94,0.7)',
    bg: 'radial-gradient(circle, transparent 15%, #3c0a1c 55%, #12030a 100%)',
    revealBg: 'radial-gradient(ellipse at 50% 40%, #9f1239, #3c0a1c 50%, #12030a)',
    nebula1: 'bg-rose-500/25',
    nebula2: 'bg-amber-400/25',
    text: 'from-amber-200 via-rose-200 to-amber-200',
    ring: 'text-rose-300',
    ring2: 'text-amber-200',
  },
];

function SkipButton({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={onDone}
      className="pointer-events-auto absolute right-6 top-6 z-[99] rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white"
    >
      Saltar ▸▸
    </button>
  );
}

/* ======================================================================
   NIVEL 1 — ESPACIO
   ====================================================================== */
function SpaceAnim({ onDone }: { onDone: () => void }) {
  const stars = useMemo(
    () => Array.from({ length: 200 }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5, delay: Math.random() * 4, dur: Math.random() * 3 + 2,
      bright: Math.random() > 0.85,
    })),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden bg-[#02030c]">
      <SkipButton onDone={onDone} />
      <div className="absolute inset-0" style={{ animation: 'warpIn 1s ease-out both' }}>
        <div className="absolute rounded-full bg-emerald-500/20 blur-[150px]" style={{ left: '15%', top: '20%', width: 520, height: 520, animation: 'auroraShift 8s ease-in-out infinite' }} />
        <div className="absolute rounded-full bg-violet-600/20 blur-[130px]" style={{ right: '10%', bottom: '15%', width: 440, height: 440, animation: 'auroraShift 10s ease-in-out 3s infinite' }} />
        {stars.map((s, i) => (
          <span key={i} className={`absolute rounded-full ${s.bright ? 'bg-amber-200' : 'bg-white'}`}
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}
        <div className="absolute right-[8%] bottom-[14%] h-44 w-44 rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle at 35% 30%, #6ee7b7, #0d9488 50%, #042f2e)', boxShadow: '0 0 80px rgba(52,211,153,0.35)' }} />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="animate-ufoIn text-8xl drop-shadow-[0_0_45px_rgba(52,211,153,0.9)]">🛸</div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.35em] text-emerald-300 opacity-80">Contacto establecido…</p>
      </div>
    </div>
  );
}

/* ======================================================================
   NIVEL 2 — PORTAL (simple, sin bugs)
   Un vórtice CSS puro que crece y te traga. Sin DOM dinámico pesado.
   ====================================================================== */
function PortalAnim({ onDone, themeIndex }: { onDone: () => void; themeIndex: number }) {
  const [sec, setSec] = useState(0);
  const theme = PORTAL_THEMES[((themeIndex % PORTAL_THEMES.length) + PORTAL_THEMES.length) % PORTAL_THEMES.length];

  useEffect(() => {
    const iv = window.setInterval(() => setSec((s) => s + 1), 1000);
    const done = window.setTimeout(onDone, 7000);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [onDone]);

  // 0-2: aparece, 3-4: acelera, 5: flash, 6: nueva dimensión
  const entered = sec >= 5;
  const arrived = sec >= 6;

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-black">
      <SkipButton onDone={onDone} />

      {!arrived && (
        <>
          {/* Fondo oscuro con gradiente radial (varía por tema) */}
          <div className="absolute inset-0 transition-colors duration-500" style={{ background: theme.bg }} />

          {/* Espiral de color — CSS puro, sin re-renders */}
          <div
            className="absolute rounded-full"
            style={{
              width: '200vmax',
              height: '200vmax',
              background: theme.conic,
              maskImage: 'radial-gradient(circle, transparent 12%, black 50%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 12%, black 50%)',
              mixBlendMode: 'screen',
              opacity: 0.7,
              animation: `spinSlow ${sec >= 3 ? '2s' : '8s'} linear infinite`,
              transition: 'animation-duration 1s',
            }}
          />

          {/* Núcleo brillante */}
          <div
            className="rounded-full transition-all duration-[2000ms] ease-in-out"
            style={{
              width: sec >= 3 ? 800 : 140,
              height: sec >= 3 ? 800 : 140,
              background: theme.core,
              boxShadow: `0 0 ${sec >= 3 ? 200 : 80}px ${sec >= 3 ? 100 : 25}px ${theme.glow}`,
            }}
          />

          {/* Flash al cruzar */}
          {entered && (
            <div className="absolute inset-0 bg-white" style={{ animation: 'crossFlash 1.5s ease-out forwards' }} />
          )}

          {/* Texto */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
            {sec < 3 && <p className={`animate-pulse text-sm font-black uppercase tracking-[0.4em] ${theme.ring}`}>Portal abriéndose — {theme.name}…</p>}
            {sec >= 3 && sec < 5 && <p className={`animate-pulse text-sm font-black uppercase tracking-[0.4em] ${theme.ring2}`}>Aceleración hiperespacial…</p>}
            {sec >= 5 && <p className="text-base font-black uppercase tracking-[0.5em] text-white">¡Cruzando!</p>}
          </div>
        </>
      )}

      {/* Nueva dimensión */}
      {arrived && (
        <div className="absolute inset-0 overflow-hidden" style={{ animation: 'dimensionReveal 1.2s ease-out both' }}>
          <div className="absolute inset-0" style={{ background: theme.revealBg }} />
          <div className={`absolute rounded-full ${theme.nebula1} blur-[140px]`} style={{ left: '20%', top: '25%', width: 480, height: 480, animation: 'auroraShift 9s ease-in-out infinite' }} />
          <div className={`absolute rounded-full ${theme.nebula2} blur-[130px]`} style={{ right: '15%', bottom: '20%', width: 420, height: 420, animation: 'auroraShift 11s ease-in-out 2s infinite' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ animation: 'rise 1s ease-out 0.3s both' }}>
            <div className="animate-coin text-7xl drop-shadow-[0_0_30px_rgba(217,70,239,0.8)]">🌀</div>
            <p className={`mt-4 bg-gradient-to-r ${theme.text} bg-clip-text text-2xl font-black uppercase tracking-[0.4em] text-transparent`}>{theme.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   NIVEL 3 — EL CIELO (doble flash)
   ====================================================================== */
function HeavenAnim({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'build' | 'flash1' | 'heaven' | 'flash2'>('build');
  const rays = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);
  const clouds = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      size: 90 + Math.random() * 140, left: i * 10 - 10,
      top: 4 + Math.random() * 72, delay: Math.random() * 0.9,
      opacity: 0.55 + Math.random() * 0.45,
    })),
    [],
  );

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('flash1'), 950);
    const t2 = window.setTimeout(() => setPhase('heaven'), 1250);
    const t3 = window.setTimeout(() => setPhase('flash2'), 3600);
    const t4 = window.setTimeout(onDone, 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-black">
      <SkipButton onDone={onDone} />
      {phase === 'build' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            {rays.map((i) => (
              <div key={i} className="absolute origin-center" style={{ width: 2, height: '70vh', background: 'linear-gradient(to top, rgba(255,255,220,0.95), transparent)', transform: `rotate(${i * (360 / rays.length)}deg) translateY(-50%)`, animation: 'flashCharge 0.95s ease-in forwards', animationDelay: `${i * 0.008}s` }} />
            ))}
            <div className="absolute rounded-full bg-white" style={{ width: 24, height: 24, boxShadow: '0 0 80px 40px rgba(255,255,200,0.95)', animation: 'flashCharge 0.95s ease-in forwards' }} />
          </div>
          <p className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-pulse text-sm font-black uppercase tracking-[0.4em] text-amber-200">Una luz cegadora…</p>
        </>
      )}
      {(phase === 'flash1' || phase === 'flash2') && <div className="absolute inset-0 bg-white" style={{ animation: 'flashFade 0.6s ease-out' }} />}
      {phase === 'heaven' && (
        <>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #bfdbfe 0%, #dbeafe 30%, #ede9fe 60%, #fdf2f8 100%)', animation: 'fadeInSlow 1.5s ease-out both' }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute top-0 origin-top opacity-40" style={{ width: 3 + (i % 3), height: '110vh', background: 'linear-gradient(to bottom, rgba(253,224,71,0.9), transparent)', left: `${(i + 1) * 7.5}%`, transform: `rotate(${(i - 6) * 3}deg)`, filter: 'blur(10px)', animation: `twinkle ${3 + i * 0.3}s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
          {clouds.map((c, i) => (
            <div key={i} className="absolute" style={{ left: `${c.left}%`, top: `${c.top}%`, width: c.size, height: c.size / 2.2, opacity: 0, animation: `riseCloud 1.6s ease-out ${c.delay}s forwards` }}>
              <div className="h-full w-full rounded-full bg-white" style={{ boxShadow: `0 0 ${c.size / 3}px rgba(255,255,255,0.9)`, opacity: c.opacity }} />
            </div>
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ animation: 'rise 1.2s ease-out 0.6s both' }}>
            <div className="text-8xl drop-shadow-lg" style={{ animation: 'coinBob 3s ease-in-out infinite' }}>😇</div>
            <p className="mt-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-3xl font-black uppercase tracking-[0.4em] text-transparent drop-shadow">Has ascendido</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ======================================================================
   NIVEL 3 (fallo) — EL INFIERNO
   ====================================================================== */
function HellAnim({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'fall' | 'flames' | 'end'>('fall');
  const embers = useMemo(
    () => Array.from({ length: 50 }, () => ({ left: Math.random() * 100, size: 3 + Math.random() * 8, dur: 1.5 + Math.random() * 2.5, delay: Math.random() * 2 })),
    [],
  );

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('flames'), 1600);
    const t2 = window.setTimeout(() => setPhase('end'), 3400);
    const t3 = window.setTimeout(onDone, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-black">
      <SkipButton onDone={onDone} />
      {phase === 'fall' && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #450a0a 60%, #000 100%)' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-0.5 bg-gradient-to-b from-transparent via-red-500/60 to-transparent" style={{ left: `${(i * 3.4) % 100}%`, height: '40vh', top: '-40vh', animation: `fallLine ${0.6 + (i % 5) * 0.15}s linear ${(i % 7) * 0.1}s infinite` }} />
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-7xl" style={{ animation: 'fallSpin 1.6s ease-in forwards' }}>😱</div>
            <p className="mt-6 animate-pulse text-lg font-black uppercase tracking-[0.4em] text-red-400">Cayendo…</p>
          </div>
        </div>
      )}
      {phase === 'flames' && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, #dc2626, #7f1d1d 40%, #1a0000 100%)', animation: 'fadeInSlow 0.6s ease-out both' }}>
          <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.7), transparent)', animation: 'flameFlicker 0.4s ease-in-out infinite alternate' }} />
          {embers.map((e, i) => (
            <span key={i} className="absolute bottom-0 rounded-full bg-orange-400" style={{ left: `${e.left}%`, width: e.size, height: e.size, boxShadow: '0 0 8px #f97316', animation: `emberRise ${e.dur}s ease-out ${e.delay}s infinite` }} />
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-8xl" style={{ animation: 'coinBob 1.5s ease-in-out infinite' }}>👹</div>
            <p className="mt-4 text-3xl font-black uppercase tracking-[0.3em] text-red-300 drop-shadow-[0_0_20px_rgba(220,38,38,0.9)]">El Infierno</p>
            <p className="mt-2 text-sm font-bold text-red-400/90">Lo has perdido TODO…</p>
          </div>
        </div>
      )}
      {phase === 'end' && (
        <div className="absolute inset-0 bg-black" style={{ animation: 'fadeInSlow 1.2s ease-out both' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-black uppercase tracking-[0.4em] text-red-800">Todo se ha ido.</p>
            <p className="mt-3 text-sm text-red-900/80">Empiezas de cero…</p>
          </div>
        </div>
      )}
    </div>
  );
}
