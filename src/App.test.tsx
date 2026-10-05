import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';

/**
 * Test de humo: renderiza el árbol completo de la aplicación con react-dom/server.
 *
 * No ejecuta efectos ni necesita navegador, pero SÍ ejecuta todo el código de
 * fase de render (inicializadores de useState/useMemo, carga de la partida,
 * cálculos de precios y formateo), que es donde se caen este tipo de apps.
 */

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
  Reflect.deleteProperty(globalThis, 'matchMedia');
});

describe('App', () => {
  it('renderiza desde una partida vacía', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('Tycoon Idle');
    expect(html).toContain('Toca para trabajar');
    expect(html).toContain('Puesto de Limonada');
  });

  it('renderiza con una partida avanzada sin romperse', () => {
    store.set(
      'tycoon-save',
      JSON.stringify({
        version: 2,
        cash: 5e12,
        totalEarned: 9e12,
        lifetimeEarned: 4e13,
        taps: 12_345,
        tapLevel: 9,
        businesses: { lemonade: 250, newspaper: 120, rocket: 3 },
        upgrades: { lemonade: 12, rocket: 2 },
        automated: { lemonade: true, pizza: true },
        shopUpgrades: { unlock_plots: 1, bulkupgrade: 1, offline48: 1, blood_pact: 1 },
        plotAssignments: { 0: 'lemonade', 2: 'rocket' },
        rebirths: 9,
        crystals: 40,
        stars: 3,
        tier1: 6,
        tier2: 3,
        tier3: 1,
        investors: 5_000,
        investorsClaimed: 53_000,
        investorsSpent: 120,
        heavenReached: true,
        hellFalls: 4,
        souls: 11,
        offlineClaimHour: 3,
        lastSave: Date.now() - 3_600_000,
        runStartedAt: Date.now() - 7_200_000,
      }),
    );
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('Tycoon Idle');
    // Con offline pendiente aparece el recibo.
    expect(html).toContain('TYCOON');
  });

  it('sobrevive a una partida corrupta en localStorage', () => {
    store.set('tycoon-save', '{{{ no es JSON');
    expect(() => renderToStaticMarkup(<App />)).not.toThrow();
  });
});
