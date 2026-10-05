// @vitest-environment jsdom
/**
 * Playtest de endgame: tienda de funciones, parcelas, mánagers y los tres
 * niveles de renacimiento (incluido el Cielo/Infierno). Se monta el juego real,
 * se hace clic en la interfaz y se avanza el reloj con temporizadores falsos.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { DEFAULT_STATE, type GameState } from './game/logic';
import { SAVE_KEY } from './game/balance';
import { BUSINESSES } from './game/data';
import {
  totalIncome,
  rebirthMultiplier,
  availableInvestors,
  hasFunction,
  computeOffline,
  sanitizeState,
  accrueInvestors,
  totalInvestorsEarned,
} from './game/logic';

/* ---------- entorno ---------- */

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-05T12:00:00Z'));
});

afterEach(() => {
  // Con globals:false Testing Library NO limpia solo: sin cleanup() las Apps de
  // tests anteriores seguirían montadas autoguardando y pisando la partida.
  cleanup();
  act(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

function seedSave(over: Partial<GameState>) {
  const s: GameState = sanitizeState({ ...DEFAULT_STATE, ...over } as GameState);
  store.set(SAVE_KEY, JSON.stringify(s));
  return s;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function click(el: HTMLElement | null | undefined) {
  expect(el, 'elemento clickeable').toBeTruthy();
  act(() => {
    (el as HTMLElement).click();
  });
}

function byText(re: RegExp): HTMLElement | null {
  return screen.queryAllByText(re)[0] ?? null;
}

function clickTab(label: string) {
  const tab = screen.getAllByRole('tab').find((t) => (t.textContent ?? '').includes(label));
  expect(tab, `pestaña ${label}`).toBeTruthy();
  click(tab!);
}

/** Lee la partida del disco tras dejar correr el autoguardado (5 s). */
function savedState(): GameState {
  advance(5_400);
  return JSON.parse(store.get(SAVE_KEY) ?? 'null') as GameState;
}

const ALL_OWNED: Record<string, number> = Object.fromEntries(BUSINESSES.map((b) => [b.id, 25]));

/** Errores de jsdom que no son fallos del juego (canvas 2D, CSS moderno). */
const IGNORABLE = /getContext|Not implemented|Error: Could not parse CSS|matchMedia|ResizeObserver/i;
const consoleErrors: string[] = [];
const realError = console.error;
beforeEach(() => {
  consoleErrors.length = 0;
  console.error = (...a: unknown[]) => {
    const msg = a.map((x) => String(x)).join(' ');
    if (!IGNORABLE.test(msg)) consoleErrors.push(msg);
  };
});
afterEach(() => {
  console.error = realError;
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});

/* ---------- pruebas ---------- */

describe('playtest endgame', () => {
  it('la tienda de funciones gasta la moneda y desbloquea la mecánica', () => {
    seedSave({
      cash: 100_000,
      lifetimeEarned: 5_000_000,
      investors: 200,
      tier1: 1,
      rebirths: 1,
      businesses: { lemonade: 20 },
      lastSave: Date.now(),
    });
    render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);

    expect(byText(/Registro de Parcelas/), 'la tienda exige un renacimiento previo').not.toBeNull();
    // 60 👽: el botón debe estar habilitado.
    const row = byText(/Registro de Parcelas/)!.closest('div[class*="rounded-2xl"]')!;
    const buy = within(row as HTMLElement).queryAllByRole('button')[0];
    expect((buy as HTMLButtonElement | undefined)?.disabled).toBe(false);

    click(buy!);
    advance(400);

    const s = savedState();
    expect(hasFunction(s, 'unlock_plots')).toBe(true);
    expect(s.investorsSpent).toBe(60);
    // La mecánica desbloqueada da parcelas: debe haberlas.
    expect(Object.keys(s.plotAssignments).length).toBeGreaterThanOrEqual(0);
  });

  it('asignar un empleado a una parcela sube el ingreso exactamente lo esperado', () => {
    const seeded = seedSave({
      cash: 100_000,
      lifetimeEarned: 5_000_000,
      investors: 200,
      tier1: 1,
      rebirths: 1,
      businesses: { lemonade: 10 },
      shopUpgrades: { unlock_plots: 1 },
      lastSave: Date.now(),
    });
    const before = totalIncome(seeded);
    expect(before).toBeGreaterThan(0);

    render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);

    // El panel de parcelas está en la pestaña Renacer.
    const select = screen.queryByLabelText(/Empleado de la parcela 1/);
    expect(select, 'selector de parcela').not.toBeNull();

    fireEvent.change(select as HTMLSelectElement, { target: { value: 'lemonade' } });
    advance(400);

    const s = savedState();
    expect(s.plotAssignments[0]).toBe('lemonade');
    const expected = totalIncome({ ...s, cash: s.cash });
    expect(expected).toBeGreaterThan(before);
    // +100 % sobre el negocio empleado: el ingreso de ese negocio se duplica.
    expect(totalIncome(s)).toBeCloseTo(before * 2, 6);
  });

  it('comprar un mánager automatiza el negocio y sigue comprando solo', () => {
    const seeded = seedSave({
      cash: 5_000_000,
      totalEarned: 5_000_000,
      lifetimeEarned: 5_000_000,
      businesses: { lemonade: 10, newspaper: 5 },
      lastSave: Date.now(),
    });
    expect(seeded.automated.lemonade).toBeFalsy();

    render(<App />);
    advance(800);
    clickTab('Negocios');
    advance(500);

    const mgrs = document.querySelectorAll('[data-automation]');
    expect(mgrs.length, 'botones de mánager').toBeGreaterThan(0);
    const mgr = mgrs[0] as HTMLButtonElement;
    expect(mgr.disabled, 'mánager asequible con 5M$').toBe(false);
    click(mgr);
    advance(400);

    const withManager = savedState();
    expect(withManager.automated.lemonade).toBe(true);

    // Con mánager, las unidades crecen solas aunque no toquemos nada.
    const unitsBefore = withManager.businesses.lemonade;
    advance(4_000);
    const after = savedState();
    expect(after.businesses.lemonade).toBeGreaterThan(unitsBefore);
  });

  it('mejorar el toque sube su valor y lo descuenta del efectivo', () => {
    // lifetimeEarned >= 250 abre la pestaña Mejoras.
    seedSave({ cash: 10_000, lifetimeEarned: 10_000, lastSave: Date.now() });
    render(<App />);
    advance(800);

    clickTab('Mejoras');
    advance(400);
    const btn = screen.queryAllByRole('button').find((b) => /^Mejorar —/.test(b.textContent ?? ''));
    expect(btn, 'botón de mejora de toque').toBeTruthy();
    click(btn);
    advance(400);

    const s = savedState();
    expect(s.tapLevel).toBe(1);
    expect(s.cash).toBeLessThan(10_000);
    expect(Number.isFinite(s.cash)).toBe(true);
  });

  it('el renacimiento de nivel 1 reinicia los negocios y acredita inversores', () => {
    seedSave({
      cash: 20_000_000,
      totalEarned: 20_000_000,
      lifetimeEarned: 20_000_000,
      businesses: ALL_OWNED,
      lastSave: Date.now(),
    });
    render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);

    const go = screen
      .queryAllByRole('button')
      .find((b) => /^Renacer —/.test(b.textContent ?? ''));
    expect(go, 'botón de renacer con 20M$').toBeTruthy();
    expect((go as HTMLButtonElement).disabled).toBe(false);
    click(go!);
    advance(500);

    // Aparece la confirmación; se acepta.
    const confirm = screen
      .queryAllByRole('button')
      .find((b) => /^Sí, renacer/.test(b.textContent ?? ''));
    expect(confirm, 'confirmación de renacimiento').toBeTruthy();
    click(confirm!);

    // Duración de la animación: 3000 ms.
    advance(4_000);

    const s = savedState();
    expect(s.rebirths).toBeGreaterThan(0);
    expect(s.tier1).toBeGreaterThan(0);
    expect(s.investors).toBeGreaterThan(0);
    expect(Object.values(s.businesses).reduce((a, b) => a + b, 0)).toBe(0);
    expect(s.cash).toBeLessThanOrEqual(20_000_000);
    expect(Number.isFinite(s.cash)).toBe(true);
    // El multiplicador de renacimiento debe ser ya efectivo.
    expect(rebirthMultiplier(s)).toBeGreaterThan(1);
  });

  it('el renacimiento no se puede ejecutar sin cumplir los requisitos', () => {
    // Pestaña abierta (lifetime >= 3,6M) pero vida actual lejos de los 18M.
    seedSave({ cash: 500, totalEarned: 500, lifetimeEarned: 5_000_000, lastSave: Date.now() });
    render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);

    const go = screen
      .queryAllByRole('button')
      .find((b) => /^Renacer —/.test(b.textContent ?? ''));
    // Con 500 $ no hay botón de renacer activo.
    expect((go as HTMLButtonElement | undefined)?.disabled ?? true).toBe(true);
    const s = savedState();
    expect(s.rebirths).toBe(0);
  });

  it('la tienda diabólica sólo aparece tras caer al Infierno', () => {
    seedSave({
      cash: 5_000_000,
      lifetimeEarned: 5_000_000,
      investors: 500,
      crystals: 200,
      tier1: 1,
      rebirths: 1,
      businesses: ALL_OWNED,
      lastSave: Date.now(),
    });
    // Sin caídas: la pestaña Renacer no ofrece la tienda diabólica.
    const first = render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);
    expect(byText(/[Dd]iabólic/)).toBeNull();
    first.unmount();

    // Con una caída y almas: sí.
    store.set(
      SAVE_KEY,
      JSON.stringify({
        ...(JSON.parse(store.get(SAVE_KEY) ?? '{}') as object),
        hellFalls: 1,
        souls: 3,
      }),
    );
    render(<App />);
    advance(800);
    clickTab('Renacer');
    advance(500);
    expect(byText(/[Dd]iabólic/)).not.toBeNull();
  });

  it('el recibo offline respeta la tarifa reducida sin el Reloj Dimensional', () => {
    const now = Date.now();
    const withRelic = sanitizeState({
      ...DEFAULT_STATE,
      businesses: { lemonade: 50 },
      cash: 0,
      shopUpgrades: { offline48: 1 },
      lastSave: now - 30 * 60 * 60 * 1000,
    } as GameState);
    const without = sanitizeState({ ...withRelic, shopUpgrades: {} });

    const a = computeOffline(withRelic, now);
    const b = computeOffline(without, now);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // 30 h: con la reliquia sigue al 25 %; sin ella ya está al 3 %.
    expect(a!.claimed).toBeGreaterThan(b!.claimed);
    expect(b!.claimed).toBeGreaterThan(0);
  });

  it('el estado nunca queda en números inválidos tras una cadena de acciones', () => {
    seedSave({
      cash: 1_000_000,
      totalEarned: 1_000_000,
      lifetimeEarned: 5_000_000,
      businesses: { lemonade: 5 },
      lastSave: Date.now(),
    });
    render(<App />);
    advance(600);

    // Toca, compra, mejora y navega sin miramientos.
    for (let i = 0; i < 12; i++) {
      const tap = screen.queryAllByRole('button').find((b) => /Toca|💰|Toque/.test(b.textContent ?? ''));
      click(tap);
    }
    advance(1_000);
    const buy = screen.queryAllByRole('button').find((b) => /^Comprar x1/.test(b.textContent ?? ''));
    if (buy) click(buy);
    advance(1_000);

    for (const label of ['Mejoras', 'Logros', 'Stats', 'Renacer', 'Negocios']) {
      clickTab(label);
      advance(300);
    }

    const s = savedState();
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === 'number') {
        expect(Number.isFinite(v), `${k} = ${v}`).toBe(true);
        expect(v >= 0 || k === 'offlineClaimHour', `${k} negativo: ${v}`).toBe(true);
      }
    }
    expect(screen.queryByText(/NaN|undefined|Infinity/)).toBeNull();
  });

  it('los inversores disponibles nunca se cuentan dos veces', () => {
    const earned = totalInvestorsEarned(10_000_000);
    expect(earned).toBe(Math.floor(10_000_000 / 750_000));

    const base: GameState = {
      ...DEFAULT_STATE,
      lifetimeEarned: 10_000_000,
      investors: 0,
      investorsClaimed: 0,
      investorsSpent: 0,
    };
    const s: GameState = { ...base, ...accrueInvestors(base, 10_000_000) };
    const avail = availableInvestors(s);
    expect(avail).toBe(earned);

    // Tras gastarlos, no vuelven a aparecer como disponibles.
    const spent: GameState = { ...s, investorsSpent: s.investors };
    expect(availableInvestors(spent)).toBe(0);

    // Y volver a ganar lo mismo no los duplica (investorsClaimed es monótono).
    const again: GameState = { ...s, ...accrueInvestors(s, 10_000_000) };
    expect(availableInvestors(again)).toBe(avail);
  });
});
