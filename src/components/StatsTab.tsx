import {
  OFFLINE_RATE,
  OFFLINE_REDUCED_RATE,
} from '../game/balance';
import { BUSINESSES } from '../game/data';
import { formatMoney, formatNumber } from '../game/format';
import {
  ascensionMode,
  availableInvestors,
  businessCount,
  employeesAssignedTo,
  offlineCapMs,
  ownedBusinessCount,
  plotsUnlocked,
  rebirthMultiplier,
  totalPlots,
} from '../game/logic';
import type { GameApi } from '../game/useGame';
import { AnimatedNumber } from './AnimatedNumber';
import { Panel, SectionTitle, StatBox } from './ui';

export function StatsTab({ game }: { game: GameApi }) {
  const { state, income } = game;
  const units = BUSINESSES.reduce((s, b) => s + businessCount(state, b.id), 0);

  // Derivado del estado: 24h, o 48h con la función "Reloj Dimensional".
  const capSeconds = offlineCapMs(state) / 1000;
  const capHours = Math.round(capSeconds / 3600);
  const fullPct = Math.round(OFFLINE_RATE * 100);
  const reducedPct = Math.round(OFFLINE_REDUCED_RATE * 100);

  const rows = [
    { label: 'Efectivo actual', value: formatMoney(state.cash), icon: '💵' },
    { label: 'Ganado en esta vida', value: formatMoney(state.totalEarned), icon: '🏦' },
    { label: 'Ganado entre todas las vidas', value: formatMoney(state.lifetimeEarned), icon: '♾️' },
    { label: 'Ingreso por segundo', value: formatMoney(income) + '/s', icon: '📈' },
    { label: 'Multiplicador de prestigio', value: 'x' + rebirthMultiplier(state).toFixed(2), icon: '✨' },
    { label: 'Toques totales', value: formatNumber(state.taps), icon: '👆' },
    { label: 'Unidades de negocio', value: formatNumber(units), icon: '🏬' },
    { label: 'Negocios distintos', value: `${ownedBusinessCount(state)} / ${BUSINESSES.length}`, icon: '🗝️' },
    { label: 'Renacimientos', value: String(state.rebirths), icon: '🔄' },
    { label: 'Inversores activos', value: formatNumber(availableInvestors(state)), icon: '👽' },
    { label: 'Caídas al Infierno', value: String(state.hellFalls), icon: '🔥' },
    { label: 'Almas', value: formatNumber(state.souls), icon: '🕯️' },
  ];

  const ascension = ascensionMode(state);
  const ascensionLabel =
    ascension === 'guaranteed'
      ? 'Primer ascenso garantizado'
      : ascension === 'choice'
        ? 'La Balanza: eliges tú'
        : 'Apuesta Cielo / Infierno';

  return (
    <div className="space-y-3">
      <Panel className="animate-rise">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              Offline / {capHours}h ({fullPct}%)
            </div>
            <AnimatedNumber
              value={income * capSeconds * OFFLINE_RATE}
              format={formatMoney}
              duration={600}
              className="text-lg font-bold text-emerald-400"
            />
          </div>
          <div className="text-right text-[10px] uppercase tracking-widest text-slate-400">
            Máx. {capHours}h al {fullPct}%
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Tras las primeras {capHours}h offline el bonus baja al {reducedPct}%. Siempre conservas íntegro lo generado
          en esas {capHours}h.
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatBox className="animate-rise" icon="💰" label="Efectivo" value={formatMoney(state.cash)} tone="emerald" />
        <StatBox className="animate-rise" icon="📈" label="Ingreso/s" value={formatMoney(income)} tone="sky" />
        <StatBox className="animate-rise" icon="✨" label="Multiplicador" value={'x' + rebirthMultiplier(state).toFixed(2)} tone="amber" />
      </div>

      <Panel className="animate-rise">
        <SectionTitle icon="📋">Historial completo</SectionTitle>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:border-white/20"
            >
              <span className="text-lg" aria-hidden>
                {r.icon}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">{r.label}</div>
                <div className="truncate font-bold tabular-nums">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="animate-rise">
        <SectionTitle icon="☁️">Estado de la ascensión</SectionTitle>
        <div className="space-y-1.5 text-xs text-slate-300">
          <Row label="Modo del próximo ascenso" value={ascensionLabel} />
          <Row label="Veces en el Cielo" value={String(state.tier3)} />
          <Row label="Caídas al Infierno" value={String(state.hellFalls)} />
          <Row
            label="Parcelas"
            value={plotsUnlocked(state) ? `${Object.keys(state.plotAssignments).length} / ${totalPlots(state)} ocupadas` : 'Bloqueadas'}
          />
          <Row
            label="Empleados asignados"
            value={String(BUSINESSES.reduce((n, b) => n + employeesAssignedTo(state, b.id), 0))}
          />
          <Row
            label="Último recibo offline"
            value={
              state.offlineClaimHour >= 0
                ? `Cobrado a las ${state.offlineClaimHour}:00`
                : 'Todavía no has cobrado ninguno'
            }
          />
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold tabular-nums text-slate-200">{value}</span>
    </div>
  );
}
