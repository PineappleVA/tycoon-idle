const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Decimales según la magnitud del valor ya escalado. */
function decimalsFor(scaled: number): number {
  return scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
}

export function formatNumber(n: number): string {
  if (Number.isNaN(n)) return '∞';
  if (n === Number.POSITIVE_INFINITY) return '∞';
  if (n === Number.NEGATIVE_INFINITY) return '-∞';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) return Math.floor(n).toString();

  let tier = Math.min(UNITS.length - 1, Math.floor(Math.log10(n) / 3));
  let scaled = n / Math.pow(10, tier * 3);
  let decimals = decimalsFor(scaled);

  // Al redondear con menos decimales el valor puede llegar a 1000 (999.999 -> "1000K").
  // En ese caso subimos de escala, salvo que ya estemos en la última unidad.
  if (Number(scaled.toFixed(decimals)) >= 1000 && tier < UNITS.length - 1) {
    tier += 1;
    scaled = n / Math.pow(10, tier * 3);
    decimals = decimalsFor(scaled);
  }

  return scaled.toFixed(decimals) + UNITS[tier];
}

export function formatMoney(n: number): string {
  return '$' + formatNumber(n);
}

export function formatTime(ms: number): string {
  // Un tiempo negativo no tiene sentido en la UI: se muestra 0s.
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ${minutes % 60}m`;
}
