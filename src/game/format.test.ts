import { describe, expect, it } from 'vitest';
import { formatMoney, formatNumber, formatTime } from './format';

describe('formatNumber', () => {
  it('no redondea a 1000 dentro de una escala (regresión: "1000K")', () => {
    expect(formatNumber(999_999)).toBe('1.00M');
    expect(formatNumber(999_999_999)).toBe('1.00B');
    expect(formatNumber(999_999_999_999)).toBe('1.00T');
  });

  it('mantiene los valores que sí caben en su escala', () => {
    expect(formatNumber(999_499)).toBe('999K');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1_000)).toBe('1.00K');
    expect(formatNumber(1_000_000)).toBe('1.00M');
  });

  it('ajusta los decimales según la magnitud', () => {
    expect(formatNumber(1_234)).toBe('1.23K');
    expect(formatNumber(12_345)).toBe('12.3K');
    expect(formatNumber(123_456)).toBe('123K');
  });

  it('cubre toda la tabla de unidades sin desbordarse', () => {
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    units.forEach((unit, tier) => {
      const value = Math.pow(10, tier * 3) * 1.5;
      const out = formatNumber(value);
      expect(out.endsWith(unit)).toBe(true);
      expect(out).not.toContain('NaN');
      expect(out).not.toMatch(/^1000/);
    });
  });

  it('maneja cero, negativos, decimales e infinito', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(0.7)).toBe('0');
    expect(formatNumber(-1_500)).toBe('-1.50K');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('∞');
    expect(formatNumber(Number.NEGATIVE_INFINITY)).toBe('-∞');
    expect(formatNumber(Number.NaN)).toBe('∞');
  });
});

describe('formatMoney', () => {
  it('añade el símbolo de dólar', () => {
    expect(formatMoney(1_500)).toBe('$1.50K');
    expect(formatMoney(0)).toBe('$0');
  });
});

describe('formatTime', () => {
  it('elige la unidad adecuada', () => {
    expect(formatTime(5_000)).toBe('5s');
    expect(formatTime(59_000)).toBe('59s');
    expect(formatTime(90_000)).toBe('1m 30s');
    expect(formatTime(3_600_000)).toBe('1h 0m');
    expect(formatTime(90_000_000)).toBe('1d 1h 0m');
  });

  it('no produce NaN ni negativos', () => {
    for (const ms of [0, 1, -100, 999, 86_400_000 * 400]) {
      expect(formatTime(ms)).not.toContain('NaN');
      expect(formatTime(ms)).not.toContain('-');
    }
  });
});
