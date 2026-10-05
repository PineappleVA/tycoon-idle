import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/* ------------------------------------------------------------------ */
/* Primitivas de UI compartidas por todas las pestañas                 */
/* ------------------------------------------------------------------ */

export function Panel({
  className,
  children,
  as: As = 'div',
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section';
}) {
  return (
    <As className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur', className)}>
      {children}
    </As>
  );
}

export function SectionTitle({ icon, children, className }: { icon?: string; children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400', className)}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </h3>
  );
}

export function Chip({
  icon,
  children,
  tone = 'neutral',
  className,
}: {
  icon?: string;
  children: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  className?: string;
}) {
  const tones = {
    neutral: 'border-white/10 bg-white/5 text-slate-200',
    good: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    bad: 'border-red-400/30 bg-red-500/10 text-red-200',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}

export function StatBox({
  label,
  value,
  icon,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  tone?: 'neutral' | 'emerald' | 'sky' | 'violet' | 'amber' | 'fuchsia';
  className?: string;
}) {
  const tones = {
    neutral: 'border-white/10 text-white',
    emerald: 'border-emerald-400/20 text-emerald-300',
    sky: 'border-sky-400/20 text-sky-300',
    violet: 'border-violet-400/20 text-violet-300',
    amber: 'border-amber-400/20 text-amber-300',
    fuchsia: 'border-fuchsia-400/20 text-fuchsia-300',
  } as const;
  return (
    <div className={cn('rounded-xl border bg-white/[0.04] p-3', tones[tone], className)}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </div>
      <div className="mt-1 text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function ProgressBar({
  value,
  gradient = 'from-amber-400 to-yellow-500',
  className,
  height = 'h-2',
}: {
  /** 0..1 */
  value: number;
  gradient?: string;
  className?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100;
  return (
    <div className={cn('overflow-hidden rounded-full bg-white/10', height, className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out', gradient)}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

/** Botón de acción principal con estados disabled/loading coherentes. */
export function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'amber',
  size = 'md',
  className,
  pulse,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'amber' | 'emerald' | 'fuchsia' | 'sky' | 'red' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'className'>) {
  const tones = {
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-lg shadow-amber-900/30 hover:brightness-110',
    emerald: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-900/30 hover:brightness-110',
    fuchsia: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-900/30 hover:brightness-110',
    sky: 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-900/30 hover:brightness-110',
    red: 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-900/30 hover:brightness-110',
    ghost: 'bg-white/10 text-slate-200 hover:bg-white/20',
  } as const;
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3.5 text-base',
  } as const;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl font-bold transition-all duration-150 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none disabled:active:scale-100',
        tones[tone],
        sizes[size],
        pulse && !disabled && 'animate-pulse-ring',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Tarjeta de contenido bloqueado con barra de progreso. */
export function LockedNotice({
  icon,
  title,
  children,
  className,
}: {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-white/5 bg-white/[0.02] p-5', className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl opacity-40 grayscale">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-bold text-slate-400">🔒 {title}</div>
          <div className="text-xs text-slate-500">{children}</div>
        </div>
      </div>
    </div>
  );
}
