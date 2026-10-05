import { useMemo } from 'react';

const EMOJIS = ['💰', '💵', '🪙', '💎', '📈', '🤑', '💸'];

export function Background() {
  const bits = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 12 + Math.random() * 12,
        size: 14 + Math.random() * 26,
        emoji: EMOJIS[i % EMOJIS.length],
        opacity: 0.05 + Math.random() * 0.08,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[#0a0a12]" />
      {/* aurora blobs */}
      <div className="animate-aurora absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-emerald-500/20 blur-[120px]" />
      <div
        className="animate-aurora absolute -right-40 top-20 h-[34rem] w-[34rem] rounded-full bg-amber-500/20 blur-[120px]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="animate-aurora absolute bottom-[-10rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-violet-600/20 blur-[130px]"
        style={{ animationDelay: '-10s' }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
      {/* floating money */}
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute select-none"
          style={{
            left: `${b.left}%`,
            bottom: '-10%',
            fontSize: `${b.size}px`,
            opacity: b.opacity,
            animation: `floatBg ${b.duration}s linear ${b.delay}s infinite`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
