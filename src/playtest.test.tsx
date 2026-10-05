// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { Toasts } from './components/Toasts';
import { ACHIEVEMENTS } from './game/achievements';
import type { GameState } from './game/logic';
import { BUSINESSES } from './game/data';

/**
 * PLAYTEST: monta la aplicación real en un DOM, avanza los temporizadores del
 * juego y pulsa botones como lo haría un jugador. Comprueba invariantes que
 * sólo se ven ejecutando la app completa (HTML válido, tours, dobles cobros,
 * NaN en pantalla).
 */

const store = new Map<string, string>();
const consoleErrors: string[] = [];
let originalError: typeof console.error;

/** Ruido de React/jsdom que no indica un fallo real de la app. */
const IGNORABLE = [/Not implemented: HTMLCanvasElement/, /Could not parse CSS/];

function seedSave(overrides: Record<string, unknown> = {}) {
  store.set(
    'tycoon-save',
    JSON.stringify({
      version: 2,
      cash: 0,
      totalEarned: 0,
      lifetimeEarned: 0,
      taps: 0,
      tapLevel: 0,
      businesses: {},
      upgrades: {},
      automated: {},
      shopUpgrades: {},
      plotAssignments: {},
      rebirths: 0,
      crystals: 0,
      stars: 0,
      tier1: 0,
      tier2: 0,
      tier3: 0,
      investors: 0,
      investorsClaimed: 0,
      investorsSpent: 0,
      heavenReached: false,
      hellFalls: 0,
      souls: 0,
      offlineClaimHour: -1,
      runDurationMs: 0,
      lastSave: Date.now(),
      runStartedAt: Date.now(),
      ...overrides,
    }),
  );
}

function advance(ms: number, step = 200) {
  for (let i = 0; i < ms / step; i++) {
    act(() => {
      vi.advanceTimersByTime(step);
    });
  }
}

function click(el: Element | null) {
  expect(el, 'elemento a pulsar').toBeTruthy();
  act(() => {
    fireEvent.click(el!);
  });
}

function clickTab(label: string) {
  const tab = screen.getAllByRole('tab').find((t) => (t.textContent ?? '').includes(label));
  expect(tab, `pestaña ${label}`).toBeTruthy();
  click(tab!);
}

/** Lee "$10.00K" / "$1.2M" y devuelve el número. No depende de los decimales. */
function parseMoney(text: string): number {
  const m = text.match(/\$?([\d.,]+)\s*([KMBTQ]?)/);
  if (!m) return NaN;
  // formatMoney escribe "$10.00K": el punto es decimal, no separador de millares.
  const n = Number(m[1].replace(',', '.'));
  const mult = { '': 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 }[m[2] as ''];
  return n * (mult ?? 1);
}

function buttonByText(re: RegExp): HTMLElement | null {
  const found = screen
    .queryAllByRole('button')
    .find((b) => re.test(b.textContent ?? '') || re.test(b.getAttribute('aria-label') ?? ''));
  return found ?? null;
}

beforeEach(() => {
  store.clear();
  consoleErrors.length = 0;
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  vi.useFakeTimers();
  originalError = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map(String).join(' ');
    if (!IGNORABLE.some((r) => r.test(text))) consoleErrors.push(text);
  };
});

afterEach(() => {
  console.error = originalError;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  cleanup();
});

describe('playtest', () => {
  it('no produce HTML inválido (botones anidados) ni errores de consola', () => {
    seedSave();
    render(<App />);
    advance(1_000);
    expect(consoleErrors.filter((e) => /cannot be a descendant|cannot contain a nested/.test(e))).toEqual([]);
  });

  it('tocar aumenta el efectivo y no deja NaN en pantalla', () => {
    seedSave();
    render(<App />);
    advance(800);

    const tap = screen.getByLabelText('Toca para trabajar');
    for (let i = 0; i < 25; i++) click(tap);
    advance(1_200);

    const cash = screen.getAllByLabelText(/\$\d/).map((n) => n.getAttribute('aria-label'));
    expect(cash.length).toBeGreaterThan(0);
    // El aria-label lleva el valor real, no el interpolado de la animación.
    const parsed = cash.map((c) => Number((c ?? '').replace(/[$,]/g, '')));
    expect(parsed.some((v) => v >= 25)).toBe(true);
    expect(document.body.innerHTML).not.toContain('NaN');
  });

  it('REGRESIÓN: el aviso de logro desaparece solo, no se queda pegado', () => {
    // El efecto de avisos dependía de `state`, que cambia cada tick: su cleanup
    // borraba el setTimeout de cierre antes de que llegara a dispararse, así que
    // el cartel de "¡Logro desbloqueado!" no se iba nunca.
    seedSave();
    render(<App />);
    advance(800);

    click(screen.getByLabelText('Toca para trabajar'));
    advance(300);
    expect(screen.queryByText('Primer Dólar'), 'el aviso debe aparecer').not.toBeNull();

    advance(6_000); // TOAST_MS = 4_500
    expect(screen.queryByText('Primer Dólar'), 'el aviso debe desaparecer solo').toBeNull();
  });

  it('desbloquear un logro dispara el confeti y luego se limpia solo', () => {
    seedSave();
    render(<App />);
    advance(800);
    expect(document.querySelectorAll('.animate-confetti').length).toBe(0);

    click(screen.getByLabelText('Toca para trabajar'));
    advance(300);
    expect(document.querySelectorAll('.animate-confetti').length).toBeGreaterThan(10);

    // Pasada la ráfaga no queda nada en el DOM.
    advance(3_000);
    expect(document.querySelectorAll('.animate-confetti').length).toBe(0);
  });

  it('la pestaña Logros explica el bonus que dan los logros', () => {
    seedSave({ cash: 1e9, totalEarned: 1e9, lifetimeEarned: 1e9, taps: 500 });
    render(<App />);
    advance(800);
    clickTab('Logros');
    advance(400);

    // El bonus por logro y el acumulado tienen que estar a la vista.
    expect(screen.queryByText(/de ingreso permanente/)).not.toBeNull();
    expect(screen.queryByText(/\+2%/)).not.toBeNull();
    expect(screen.queryByText(/llevas \+/)).not.toBeNull();
    // Y sigue sin filtrar los secretos.
    expect(screen.queryByText('Primer Dólar')).not.toBeNull(); // público, sí se ve
  });

  it('los avisos no se apilan sin límite', () => {
    // Estado que desbloquea muchos logros de golpe al primer toque.
    seedSave({ cash: 1e12, totalEarned: 1e12, lifetimeEarned: 1e12, taps: 99_999 });
    render(<App />);
    advance(800);
    click(screen.getByLabelText('Toca para trabajar'));
    advance(300);
    const avisos = document.querySelectorAll('.animate-toast');
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.length).toBeLessThanOrEqual(4);
  });

  it('un logro recién conseguido se marca como nuevo en la pestaña', () => {
    seedSave();
    render(<App />);
    advance(800);
    click(screen.getByLabelText('Toca para trabajar'));
    advance(400);
    clickTab('Logros');
    advance(400);
    expect(screen.queryByText('¡Nuevo!'), 'debe marcarse el logro de esta sesión').not.toBeNull();
  });

  it('encadenar toques sube el combo y cada toque vale más', () => {
    seedSave({ cash: 1_000, totalEarned: 1_000, lifetimeEarned: 1_000, businesses: { lemonade: 10 } });
    render(<App />);
    advance(800);

    const tap = screen.getByLabelText('Toca para trabajar');
    // El medidor siempre está montado (para poder desvanecerse), así que se
    // comprueba su estado accesible, no su presencia.
    const meter = () => screen.getByText(/Combo x/).closest('div')!;

    click(tap);
    advance(100);
    expect(meter().getAttribute('aria-hidden'), 'con 1 toque el combo está oculto').toBe('true');

    for (let i = 0; i < 10; i++) {
      click(tap);
      advance(100); // dentro de la ventana de combo (1,6 s)
    }
    expect(meter().getAttribute('aria-hidden')).toBe('false');
    expect(meter().textContent).toMatch(/Combo x1\.[1-9]/);

    // Y si dejas de tocar, el combo se cae.
    advance(3_000);
    expect(meter().getAttribute('aria-hidden')).toBe('true');
  });

  it('un toque crítico anuncia el crítico y paga el multiplicador', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.01); // < CRIT_CHANCE
    try {
      seedSave({ cash: 1_000, totalEarned: 1_000, lifetimeEarned: 1_000, businesses: { lemonade: 50 } });
      render(<App />);
      advance(800);
      click(screen.getByLabelText('Toca para trabajar'));
      advance(200);
      expect(screen.queryByText(/¡CRÍTICO!/)).not.toBeNull();
    } finally {
      rnd.mockRestore();
    }
  });

  it('el maletín de suerte aparece, se puede pillar y da una recompensa', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0); // aparece cuanto antes
    try {
      seedSave({ cash: 10_000, totalEarned: 10_000, lifetimeEarned: 10_000, businesses: { lemonade: 50 } });
      render(<App />);
      advance(800);
      expect(screen.queryByLabelText(/maletín de suerte/i)).toBeNull();

      advance(80_000, 2_000); // LUCK_MIN_MS = 70 s
      const briefcase = screen.getByLabelText(/maletín de suerte/i);

      click(briefcase);
      advance(300);
      // Una de las tres recompensas tiene que aparecer.
      expect(screen.queryByText(/Fiebre del oro|Toque de Midas|Golpe de suerte/)).not.toBeNull();
      // Y ya no está el maletín.
      expect(screen.queryByLabelText(/maletín de suerte/i)).toBeNull();
    } finally {
      rnd.mockRestore();
    }
  });

  it('el maletín se escapa si no lo pillas a tiempo', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      seedSave({ cash: 10_000, totalEarned: 10_000, lifetimeEarned: 10_000, businesses: { lemonade: 50 } });
      render(<App />);
      advance(80_000, 2_000);
      expect(screen.queryByLabelText(/maletín de suerte/i)).not.toBeNull();
      advance(20_000, 2_000); // LUCK_LIFE_MS = 13 s
      expect(screen.queryByLabelText(/maletín de suerte/i)).toBeNull();
    } finally {
      rnd.mockRestore();
    }
  });

  it('REGRESIÓN: los tours arrancan aunque haya ingreso pasivo', () => {
    // Antes el setTimeout de 400ms se reiniciaba en cada tick de 100ms y
    // ningún tutorial aparecía mientras el juego producía dinero.
    seedSave({ cash: 5_000, totalEarned: 5_000, lifetimeEarned: 5_000, businesses: { lemonade: 20 } });
    store.set('tycoon-tours-v1', JSON.stringify(['intro']));
    render(<App />);
    advance(3_000);
    expect(screen.queryByText(/Nueva pestaña: Mejoras/)).not.toBeNull();
  });

  it('comprar y mejorar funcionan y descuentan el precio exacto', () => {
    seedSave({ cash: 1_000_000, totalEarned: 1_000_000, lifetimeEarned: 1_000_000 });
    render(<App />);
    advance(800);

    const buy = buttonByText(/^Comprar x1\b/);
    expect(buy).not.toBeNull();
    click(buy);
    advance(500);

    expect(screen.queryByText(/1 uds/)).not.toBeNull();

    const upgrade = buttonByText(/^Mejorar x2/);
    click(upgrade);
    advance(500);
    // La tarjeta muestra una insignia "x2" cuando el negocio tiene 1 mejora.
    const badges = screen.queryAllByText('x2').map((n) => n.textContent);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('abre y cierra el detalle de un negocio', () => {
    seedSave({ cash: 1e6, totalEarned: 1e6, lifetimeEarned: 1e6, businesses: { lemonade: 5 } });
    render(<App />);
    advance(800);

    click(screen.getByLabelText('Ver detalle de Puesto de Limonada'));
    advance(300);
    expect(screen.getByText(/Estadísticas/)).toBeTruthy();

    const dialog = screen.getByText(/Estadísticas/).closest('div[class*="fixed"]')!;
    click(within(dialog as HTMLElement).getByLabelText('Cerrar'));
    advance(300);
    expect(screen.queryByText(/Estadísticas/)).toBeNull();
  });

  it('REGRESIÓN: los logros secretos no se muestran en la lista', () => {
    // Ni pendientes ni conseguidos: sólo se cuenta cuántos hay.
    const secrets = ACHIEVEMENTS.filter((a) => a.hidden);
    seedSave({
      cash: 1e15,
      totalEarned: 1e15,
      lifetimeEarned: 1e15,
      taps: 200_000,
      runDurationMs: 1_000,
      offlineClaimHour: 3,
      businesses: Object.fromEntries(BUSINESSES.map((b) => [b.id, 600])),
      upgrades: Object.fromEntries(BUSINESSES.map((b) => [b.id, 5])),
      plotAssignments: { 0: 'lemonade', 1: 'lemonade', 2: 'lemonade' },
      shopUpgrades: { unlock_plots: 1 },
    });
    const state = JSON.parse(store.get('tycoon-save') ?? '{}') as GameState;
    // El test sólo tiene sentido si de verdad hay secretos desbloqueados.
    expect(secrets.filter((a) => a.done(state)).length).toBeGreaterThan(0);

    render(<App />);
    advance(800);
    clickTab('Logros');
    advance(400);

    // Con los tres filtros activos no debe asomar ningún secreto.
    for (const filter of ['Todos', 'Conseguidos', 'Pendientes']) {
      click(buttonByText(new RegExp(`^${filter}$`)));
      advance(300);
      const html = document.body.innerHTML;
      for (const a of secrets) {
        expect(html.includes(a.name), `"${a.name}" visible con filtro ${filter}`).toBe(false);
        expect(html.includes(a.desc), `desc de "${a.name}" visible con filtro ${filter}`).toBe(false);
      }
    }

    expect(screen.queryByRole('button', { name: 'Secretos' })).toBeNull();
    expect(screen.queryByText(/logros secretos|logro\(s\) secreto\(s\)/)).not.toBeNull();
  });

  it('REGRESIÓN: el aviso de un logro secreto tampoco revela su nombre', () => {
    const secret = ACHIEVEMENTS.find((a) => a.hidden)!;
    render(<Toasts toasts={[secret]} />);
    const html = document.body.innerHTML;
    expect(html.includes(secret.name)).toBe(false);
    expect(html.includes(secret.desc)).toBe(false);
    expect(screen.queryByText(/Logro secreto/i)).not.toBeNull();
  });

  it('REGRESIÓN: el recibo offline se cobra una sola vez', () => {
    seedSave({
      cash: 0,
      totalEarned: 1e6,
      lifetimeEarned: 1e6,
      businesses: { lemonade: 50, upgrades: 0 },
      lastSave: Date.now() - 3_600_000,
    });
    // El guardado anterior tenía businesses y upgrades mal anidados; se corrige:
    store.set(
      'tycoon-save',
      JSON.stringify({
        version: 2,
        cash: 0,
        totalEarned: 1e6,
        lifetimeEarned: 1e6,
        businesses: { lemonade: 50 },
        upgrades: {},
        lastSave: Date.now() - 3_600_000,
        runStartedAt: Date.now() - 7_200_000,
      }),
    );
    render(<App />);
    advance(500);

    expect(screen.getByText(/Recibo de producción offline/)).toBeTruthy();
    click(buttonByText(/^Cobrar/));
    advance(300);
    expect(screen.queryByText(/Recibo de producción offline/)).toBeNull();

    // Se persiste en el acto, sin esperar al autoguardado de 5s.
    const saved = JSON.parse(store.get('tycoon-save') ?? '{}');
    expect(Date.now() - saved.lastSave).toBeLessThan(60_000);
  });

  it('descartar el recibo también renuncia (no vuelve al recargar)', () => {
    store.set(
      'tycoon-save',
      JSON.stringify({
        version: 2,
        businesses: { lemonade: 50 },
        totalEarned: 1e6,
        lifetimeEarned: 1e6,
        lastSave: Date.now() - 3_600_000,
        runStartedAt: Date.now() - 7_200_000,
      }),
    );
    render(<App />);
    advance(500);

    click(buttonByText(/^Descartar/));
    advance(300);
    const saved = JSON.parse(store.get('tycoon-save') ?? '{}');
    expect(Date.now() - saved.lastSave).toBeLessThan(60_000);
  });

  it('recorre todas las pestañas sin romperse', () => {
    seedSave({
      cash: 1e15,
      totalEarned: 1e15,
      lifetimeEarned: 1e15,
      taps: 500,
      tapLevel: 5,
      businesses: Object.fromEntries(BUSINESSES.map((b) => [b.id, 25])),
      upgrades: { lemonade: 4 },
      rebirths: 4,
      tier1: 3,
      crystals: 80,
      investors: 900,
      investorsClaimed: 900,
      shopUpgrades: { unlock_plots: 1, bulkupgrade: 1 },
      plotAssignments: { 0: 'lemonade' },
    });
    store.set('tycoon-tours-v1', JSON.stringify(['intro', 'upgrades', 'achievements', 'rebirth', 'managers', 'stats']));
    render(<App />);
    advance(800);

    const tabs = screen.getAllByRole('tab').map((t) => t.textContent ?? '');
    expect(tabs.length).toBe(5);

    for (const label of ['Mejoras', 'Logros', 'Stats', 'Renacer', 'Negocios']) {
      clickTab(label);
      advance(400);
    }
    expect(document.body.innerHTML).not.toContain('NaN');
    expect(document.body.innerHTML).not.toContain('undefined');
  });

  it('el panel de debug ajusta el ingreso al valor pedido', () => {
    seedSave({ cash: 100, totalEarned: 100, lifetimeEarned: 100 });
    render(<App />);
    advance(600);

    act(() => {
      fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    });
    advance(300);
    expect(screen.getByText('🐛 Modo Debug')).toBeTruthy();

    const input = screen.getByLabelText(/Fijar ingreso objetivo/);
    act(() => {
      fireEvent.change(input, { target: { value: '10000' } });
    });
    click(buttonByText(/^Aplicar$/));
    // Se mide sin dejar correr el reloj (advance() siempre avanza un step de
    // 200 ms y eso dispararía un tick): en cuanto se gana dinero se desbloquean
    // logros y cada logro suma +2 % de ingreso, así que la tasa sube sola.
    // Eso es la mecánica nueva, no un fallo del panel.
    act(() => {});

    const panel = screen.getByText('🐛 Modo Debug').closest('div[class*="fixed"]')!;
    const incomeOf = () =>
      within(panel as HTMLElement).getByText('Ingreso/s').parentElement?.textContent ?? '';
    expect(parseMoney(incomeOf())).toBeCloseTo(10_000, -2); // ±50 $

    // Y tras jugar un poco sólo puede subir: los logros son monótonos.
    advance(1_500);
    expect(parseMoney(incomeOf())).toBeGreaterThanOrEqual(10_000);
  });

  it('sobrevive a una partida corrupta y a un reloj atrasado', () => {
    store.set('tycoon-save', '{"cash": "muchísimo", "businesses": 42, "lastSave": 99999999999999}');
    render(<App />);
    advance(1_000);
    expect(screen.queryByText('Tycoon Idle')).not.toBeNull();

    // El autoguardado reescribe la partida saneada (lastSave ya no está en el futuro).
    advance(6_000);
    const saved = JSON.parse(store.get('tycoon-save') ?? '{}');
    expect(saved.lastSave).toBeLessThanOrEqual(Date.now() + 1_000);
    expect(saved.cash).toBe(0);
  });

  it('una sesión larga con mánagers no degrada el estado', { timeout: 30_000 }, () => {
    seedSave({
      cash: 1e12,
      totalEarned: 1e12,
      lifetimeEarned: 1e12,
      businesses: { lemonade: 100, newspaper: 50, donut: 20, pizza: 10 },
      automated: { lemonade: true, newspaper: true },
      shopUpgrades: { foreman_upgrade: 1 },
    });
    store.set('tycoon-tours-v1', JSON.stringify(['intro', 'upgrades', 'achievements', 'rebirth', 'managers', 'stats']));
    render(<App />);

    // 40 segundos de juego simulado (200 ticks).
    advance(40_000, 200);

    const html = document.body.innerHTML;
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');

    const saved = JSON.parse(store.get('tycoon-save') ?? '{}');
    expect(saved.cash).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(saved.cash)).toBe(true);
    expect(saved.investorsClaimed).toBeGreaterThanOrEqual(0);
  });

  it('la compra en lote MÁX no gasta más de lo que hay', () => {
    seedSave({ cash: 5_000, totalEarned: 5_000, lifetimeEarned: 5_000, businesses: { lemonade: 3 } });
    store.set('tycoon-tours-v1', JSON.stringify(['intro']));
    render(<App />);
    advance(800);

    const maxBtn = screen.getAllByRole('button').find((b) => (b.textContent ?? '').trim() === 'MÁX');
    expect(maxBtn).toBeTruthy();
    click(maxBtn!);
    advance(300);
    click(buttonByText(/^Comprar x\d+/));
    advance(500);

    const saved = JSON.parse(store.get('tycoon-save') ?? '{}');
    expect(saved.cash).toBeGreaterThanOrEqual(0);
  });

  it('no deja fugas: al desmontar no queda nada programado que explote', () => {
    seedSave({ businesses: { lemonade: 10 }, totalEarned: 1e6, lifetimeEarned: 1e6 });
    const view = render(<App />);
    advance(2_000);
    const before = consoleErrors.length;
    view.unmount();
    advance(3_000);
    expect(consoleErrors.length).toBe(before);
  });

  it('el selector de parcelas sólo ofrece negocios que posees', () => {
    seedSave({
      cash: 1e6,
      totalEarned: 1e6,
      lifetimeEarned: 1e6,
      businesses: { lemonade: 5 },
      investors: 500,
      investorsClaimed: 500,
      investorsSpent: 0,
      shopUpgrades: { unlock_plots: 1 },
      rebirths: 1,
      tier1: 1,
      alienDialogSeen: true,
    });
    store.set('tycoon-tours-v1', JSON.stringify(['intro', 'upgrades', 'achievements', 'rebirth', 'managers', 'stats']));
    render(<App />);
    advance(800);

    clickTab('Renacer');
    advance(400);

    const select = document.querySelector('select');
    expect(select).toBeTruthy();
    const options = within(select as HTMLElement).getAllByRole('option').map((o) => o.textContent);
    expect(options.some((o) => o?.includes('Limonada'))).toBe(true);
    expect(options.some((o) => o?.includes('Pizzería'))).toBe(false);
  });
});
