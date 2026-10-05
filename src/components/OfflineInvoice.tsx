import { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/cn';
import { OFFLINE_RATE } from '../game/balance';
import { formatMoney, formatTime } from '../game/format';
import { ActionButton } from './ui';

export function OfflineInvoice({
  ms,
  msAtFull,
  msAtReduced,
  potential,
  claimed,
  deducted,
  capHours,
  reducedPct,
  onClaim,
  onDismiss,
}: {
  ms: number;
  msAtFull: number;
  msAtReduced: number;
  potential: number;
  claimed: number;
  deducted: number;
  /** Horas cubiertas al tipo completo (24, o 48 con Reloj Dimensional). */
  capHours: number;
  /** % aplicado tras superar el tope. */
  reducedPct: number;
  onClaim: () => void;
  onDismiss: () => void;
}) {
  const invoiceNo = useMemo(() => 'TYC-' + Math.floor(100_000 + Math.random() * 899_999), []);
  const date = useMemo(
    () =>
      new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );

  const [printing, setPrinting] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPrinting(false), 1_800);
    return () => window.clearTimeout(t);
  }, []);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClaim();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClaim]);

  const fullPct = Math.round(OFFLINE_RATE * 100);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="animate-pop w-full max-w-sm">
        <div className={cn('relative overflow-hidden bg-[#fdfbf4] font-mono text-[#1c1917] shadow-2xl', printing && 'animate-print')}>
          <div className="px-7 pb-6 pt-2">
            <div className="text-center">
              <div className="text-xl font-black tracking-[0.25em]">TYCOON&nbsp;INC.</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-[#78716c]">Recibo de producción offline</div>
            </div>

            <div className="my-3 border-t-2 border-dashed border-[#b8b0a0]" />

            <div className="flex items-center justify-between text-[11px] text-[#57534e]">
              <span>FACTURA&nbsp;#{invoiceNo}</span>
              <span>{date}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#57534e]">
              <span>Periodo ausente</span>
              <span className="font-bold text-[#1c1917]">{formatTime(ms)}</span>
            </div>

            <div className="my-3 border-t-2 border-dashed border-[#b8b0a0]" />

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span>Producción bruta</span>
                <span className="font-semibold tabular-nums">{formatMoney(potential)}</span>
              </div>
              {msAtFull > 0 && (
                <div className="flex items-center justify-between">
                  <span>Primeras {capHours}h al {fullPct}%</span>
                  <span className="tabular-nums">{formatTime(msAtFull)}</span>
                </div>
              )}
              {msAtReduced > 0 && (
                <div className="flex items-center justify-between text-[#b45309]">
                  <span>Tras {capHours}h al {reducedPct}%</span>
                  <span className="tabular-nums">{formatTime(msAtReduced)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[#b91c1c]">
                <span>Comisión de gestión</span>
                <span className="tabular-nums">−{formatMoney(deducted)}</span>
              </div>
            </div>

            <div className="my-3 border-t-2 border-double border-[#1c1917]" />

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#78716c]">Neto a cobrar · {fullPct}%</div>
                <div className="text-3xl font-black tabular-nums">{formatMoney(claimed)}</div>
              </div>
              <div className="rotate-6 animate-stamp rounded border-2 border-[#15803d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                Pagado
              </div>
            </div>

            <div
              className="mt-4 h-9 w-full opacity-80"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #1c1917 0 2px, transparent 2px 4px, #1c1917 4px 5px, transparent 5px 9px, #1c1917 9px 12px, transparent 12px 14px)',
              }}
              aria-hidden
            />
            <div className="mt-1 text-center text-[9px] tracking-[0.4em] text-[#57534e]">{invoiceNo}</div>

            <div className="mt-3 border-t-2 border-dashed border-[#b8b0a0]" />
            <p className="mt-2 text-center text-[9px] leading-relaxed text-[#78716c]">
              *Tus negocios operaron sin supervisión. Se retiene el {100 - fullPct}% en concepto de gestión
              automática. ¡Gracias por confiar en Tycoon Inc.!
            </p>
          </div>

          {/* borde dentado inferior */}
          <div
            className="h-3 w-full bg-[#fdfbf4]"
            style={{
              maskImage: 'radial-gradient(circle at 6px 12px, transparent 6px, black 6.5px)',
              maskSize: '16px 12px',
              maskRepeat: 'repeat-x',
              WebkitMaskImage: 'radial-gradient(circle at 6px 12px, transparent 6px, black 6.5px)',
              WebkitMaskSize: '16px 12px',
              WebkitMaskRepeat: 'repeat-x',
            }}
            aria-hidden
          />
        </div>

        <div className="mt-4 flex gap-2">
          <ActionButton onClick={onClaim} tone="emerald" size="lg" className="flex-1">
            Cobrar {formatMoney(claimed)}
          </ActionButton>
          <ActionButton onClick={onDismiss} tone="ghost" size="lg">
            Descartar
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
