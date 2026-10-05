import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_BONUS_PER,
  BALANZA_THRESHOLD,
  HEAVEN_CHANCE,
  INVESTOR_PER_EARNED,
  MANAGER_COST,
  TAP_BASE_VALUE,
  CRIT_MULT,
  TAP_INCOME_FRACTION,
  MILESTONE_MAX,
  MILESTONE_EVERY,
  MILESTONE_BONUS,
  OFFLINE_CAP_MS,
  OFFLINE_RATE,
  OFFLINE_REDUCED_RATE,
  PLOTS_PER_UNLOCK,
  SOULS_MAX_PER_FALL,
  SOULS_MIN_PER_FALL,
  UPGRADE_INCOME_MULT,
} from './balance';
import { ACHIEVEMENTS } from './achievements';
import { BUSINESSES } from './data';
import {
  accrueInvestors,
  applyAlienRebirth,
  applyHeaven,
  applyHellFall,
  applyPortalRebirth,
  applyTap,
  ascensionMode,
  assignPlot,
  availableInvestors,
  balanzaUnlocked,
  bulkCost,
  bulkUpgradeCost,
  businessCount,
  businessIncome,
  buyBusiness,
  canRebirth,
  claimOffline,
  computeOffline,
  costOf,
  currencyFromEarned,
  DEFAULT_STATE,
  earn,
  type GameState,
  hasFunction,
  investorClaimFloor,
  maxAffordable,
  maxAffordableUpgrades,
  offlineCapMs,
  purchaseShopItem,
  rebirthMultiplier,
  randomSouls,
  resolveAscension,
  runManagers,
  sanitizeState,
  spend,
  tapValue,
  tickIncome,
  toggleAutomation,
  totalIncome,
  totalInvestorsEarned,
  totalPlots,
  upgradeBusiness,
  upgradeTap,
  achievementMultiplier,
  achievementsUnlocked,
  milestoneMultiplier,
  milestonesReached,
} from './logic';

/** Estado de partida rica, reutilizado por varios bloques. */
function richState(overrides: Partial<GameState> = {}): GameState {
  const lifetime = 20e9;
  return {
    ...DEFAULT_STATE,
    cash: 20e9,
    totalEarned: lifetime,
    lifetimeEarned: lifetime,
    investors: 120,
    investorsClaimed: totalInvestorsEarned(lifetime),
    investorsSpent: 60,
    crystals: 3,
    tier1: 5,
    tier2: 2,
    ...overrides,
  };
}

describe('earn / spend', () => {
  it('earn actualiza cash, vida, lifetime e inversores a la vez', () => {
    const s = earn(DEFAULT_STATE, 1_000_000);
    expect(s.cash).toBe(1_000_000);
    expect(s.totalEarned).toBe(1_000_000);
    expect(s.lifetimeEarned).toBe(1_000_000);
    expect(s.investors).toBe(totalInvestorsEarned(1_000_000));
  });

  it('earn con 0, negativo o NaN devuelve el mismo objeto (sin re-render)', () => {
    for (const bad of [0, -5, Number.NaN]) {
      expect(earn(DEFAULT_STATE, bad)).toBe(DEFAULT_STATE);
    }
  });

  it('spend devuelve null si no hay fondos y descuenta si los hay', () => {
    expect(spend({ ...DEFAULT_STATE, cash: 10 }, 20)).toBeNull();
    expect(spend({ ...DEFAULT_STATE, cash: 100 }, 40)?.cash).toBe(60);
  });
});

describe('explotación de inversores (regresión)', () => {
  // Regla antigua: `investorsClaimed` se ponía a 0 al renacer conservando
  // lifetimeEarned, así que el tick siguiente re-acreditaba todo el lifetime.
  const legacyAccrual = (s: GameState) =>
    s.investors + Math.max(0, totalInvestorsEarned(s.lifetimeEarned) - 0);

  const cases = [
    { name: 'Portal (nivel 2)', make: (s: GameState) => applyPortalRebirth(s, 4, false) },
    { name: 'Infierno', make: (s: GameState) => applyHellFall(s, 3) },
    { name: 'Cielo', make: (s: GameState) => applyHeaven(s, 1, false) },
    { name: 'Alienígenas (nivel 1)', make: (s: GameState) => applyAlienRebirth(s, 33, false) },
  ] as const;

  for (const { name, make } of cases) {
    it(`${name}: el tick siguiente no regala inversores`, () => {
      const before = richState();
      const after = make(before);
      const ticked = accrueInvestors(after, after.lifetimeEarned);
      expect(ticked.investors).toBe(after.investors);
    });

    it(`${name}: el bug antiguo sí habría regalado cientos de inversores`, () => {
      const before = richState();
      const after = { ...make(before), investorsClaimed: 0 }; // simula el comportamiento roto
      expect(legacyAccrual(after)).toBeGreaterThan(20_000);
    });
  }

  it('investorsClaimed nunca baja tras ningún renacimiento', () => {
    const s = richState();
    const floor = investorClaimFloor(s);
    for (const next of [
      applyHellFall(s, 2),
      applyHeaven(s, 1, false),
      applyPortalRebirth(s, 4, false),
      applyAlienRebirth(s, 33, false),
    ]) {
      expect(investorClaimFloor(next)).toBeGreaterThanOrEqual(floor);
    }
  });

  it('la progresión legítima sigue dando inversores', () => {
    const s = richState();
    const grown = accrueInvestors(s, s.lifetimeEarned + INVESTOR_PER_EARNED);
    expect(grown.investors).toBe(s.investors + 1);
  });

  it('el multiplicador no explota tras un Portal', () => {
    const before = richState();
    const after = applyPortalRebirth(before, 4, false);
    const ticked = accrueInvestors(after, after.lifetimeEarned);
    expect(rebirthMultiplier({ ...after, ...ticked })).toBeLessThan(10);
  });
});

describe('inversores', () => {
  it('availableInvestors descuenta los gastados y nunca es negativo', () => {
    expect(availableInvestors({ ...DEFAULT_STATE, investors: 10, investorsSpent: 4 })).toBe(6);
    expect(availableInvestors({ ...DEFAULT_STATE, investors: 3, investorsSpent: 9 })).toBe(0);
  });
});

describe('costes', () => {
  const def = BUSINESSES[0];

  it('bulkCost coincide con la suma de costOf salvo el redondeo por unidad', () => {
    // costOf redondea cada unidad hacia arriba y bulkCost usa la serie
    // geométrica cerrada, así que pueden diferir hasta 1 por unidad. Lo que
    // importa es que comprar en lote NUNCA salga más caro.
    for (const amount of [1, 5, 25, 100]) {
      let manual = 0;
      for (let i = 0; i < amount; i++) manual += costOf(def, i);
      const bulk = bulkCost(def, 0, amount);
      expect(bulk).toBeLessThanOrEqual(manual);
      expect(manual - bulk).toBeLessThanOrEqual(amount);
    }
  });

  it('bulkCost es monotónico y aditivo en el número de unidades', () => {
    const a = bulkCost(def, 0, 10);
    const b = bulkCost(def, 0, 11);
    expect(b).toBeGreaterThan(a);
    // Comprar 10 y luego 11 más cuesta lo mismo que comprar 21 de golpe (±redondeo).
    const split = bulkCost(def, 0, 10) + bulkCost(def, 10, 11);
    expect(Math.abs(split - bulkCost(def, 0, 21))).toBeLessThanOrEqual(2);
  });

  it('bulkCost con 0 o cantidad negativa no cuesta nada', () => {
    expect(bulkCost(def, 5, 0)).toBe(0);
    expect(bulkCost(def, 5, -3)).toBe(0);
  });

  it('bulkUpgradeCost es la suma, no el precio de la última', () => {
    for (const amount of [1, 5, 10]) {
      const sum = bulkUpgradeCost(def, 0, amount);
      const last = bulkUpgradeCost(def, amount - 1, 1);
      if (amount > 1) expect(sum).toBeGreaterThan(last);
    }
  });

  it('maxAffordable nunca excede el efectivo disponible', () => {
    for (const cash of [0, 34, 35, 1_000, 1e6, 1e9]) {
      const n = maxAffordable(def, 0, cash);
      expect(bulkCost(def, 0, n)).toBeLessThanOrEqual(cash);
      expect(bulkCost(def, 0, n + 1)).toBeGreaterThan(cash);
    }
  });

  it('maxAffordableUpgrades es coherente con bulkUpgradeCost', () => {
    const cash = bulkUpgradeCost(def, 0, 5);
    expect(maxAffordableUpgrades(def, 0, cash)).toBe(5);
    expect(maxAffordableUpgrades(def, 0, cash - 1)).toBe(4);
  });
});

describe('acciones del jugador', () => {
  it('buyBusiness descuenta exactamente el precio y suma unidades', () => {
    const s = { ...DEFAULT_STATE, cash: 1_000_000 };
    const next = buyBusiness(s, 'lemonade', 10)!;
    expect(businessCount(next, 'lemonade')).toBe(10);
    expect(s.cash - next.cash).toBe(bulkCost(BUSINESSES[0], 0, 10));
  });

  it('buyBusiness en modo max gasta todo lo que cabe sin pasarse', () => {
    const s = { ...DEFAULT_STATE, cash: 12_345 };
    const next = buyBusiness(s, 'lemonade', 'max')!;
    expect(next.cash).toBeGreaterThanOrEqual(0);
    expect(next.cash).toBeLessThan(costOf(BUSINESSES[0], businessCount(next, 'lemonade')));
  });

  it('buyBusiness devuelve null sin fondos', () => {
    expect(buyBusiness({ ...DEFAULT_STATE, cash: 0 }, 'lemonade', 1)).toBeNull();
  });

  it('buyBusiness devuelve null con un id inexistente', () => {
    expect(buyBusiness({ ...DEFAULT_STATE, cash: 1e9 }, 'no-existe', 1)).toBeNull();
  });

  it('upgradeBusiness no funciona sin unidades del negocio', () => {
    expect(upgradeBusiness({ ...DEFAULT_STATE, cash: 1e9 }, 'lemonade', 1)).toBeNull();
  });

  it('upgradeBusiness en lote sube los niveles exactos y multiplica el ingreso', () => {
    let s = buyBusiness({ ...DEFAULT_STATE, cash: 1e12 }, 'lemonade', 1)!;
    const before = totalIncome(s);
    s = upgradeBusiness(s, 'lemonade', 3)!;
    expect(s.upgrades.lemonade).toBe(3);
    expect(totalIncome(s)).toBeCloseTo(before * Math.pow(UPGRADE_INCOME_MULT, 3), 6);
  });

  it('upgradeBusiness compra sólo los niveles que se pueden pagar', () => {
    let s = buyBusiness({ ...DEFAULT_STATE, cash: 1e12 }, 'lemonade', 1)!;
    const price2 = bulkUpgradeCost(BUSINESSES[0], 0, 2);
    const next = upgradeBusiness({ ...s, cash: price2 + 1 }, 'lemonade', 10)!;
    expect(next.upgrades.lemonade).toBe(2);
  });

  it('applyTap suma el valor del toque y cuenta el toque', () => {
    const s = applyTap(DEFAULT_STATE);
    expect(s.taps).toBe(1);
    expect(s.cash).toBe(tapValue(DEFAULT_STATE));
  });

  it('upgradeTap sube nivel y cobra el precio', () => {
    const s = upgradeTap({ ...DEFAULT_STATE, cash: 1e6 })!;
    expect(s.tapLevel).toBe(1);
    expect(tapValue(s)).toBeGreaterThan(tapValue(DEFAULT_STATE));
  });

  it('tickIncome es proporcional al delta y no produce NaN', () => {
    const s = buyBusiness({ ...DEFAULT_STATE, cash: 1e6 }, 'lemonade', 5)!;
    const perSec = totalIncome(s);
    expect(tickIncome(s, 1_000).totalEarned - s.totalEarned).toBeCloseTo(perSec, 6);
    expect(tickIncome(s, 0)).toBe(s);
    expect(tickIncome(s, -100)).toBe(s);
    expect(Number.isNaN(tickIncome(s, Number.NaN).totalEarned)).toBe(false);
  });

  it('tickIncome recorta deltas enormes al tope', () => {
    const s = buyBusiness({ ...DEFAULT_STATE, cash: 1e6 }, 'lemonade', 5)!;
    const oneSecond = tickIncome(s, 1_000).totalEarned - s.totalEarned;
    const huge = tickIncome(s, 10_000_000).totalEarned - s.totalEarned;
    expect(huge).toBeLessThanOrEqual(oneSecond * 1.01);
  });
});

describe('tienda de funciones', () => {
  it('compra una función y descuenta la moneda', () => {
    const s = { ...DEFAULT_STATE, crystals: 30 };
    const next = purchaseShopItem(s, 'bulkupgrade')!;
    expect(hasFunction(next, 'bulkupgrade')).toBe(true);
    expect(next.crystals).toBe(5);
  });

  it('rechaza compra repetida, sin fondos o de id desconocido', () => {
    const s = { ...DEFAULT_STATE, crystals: 30, shopUpgrades: { bulkupgrade: 1 } };
    expect(purchaseShopItem(s, 'bulkupgrade')).toBeNull();
    expect(purchaseShopItem({ ...DEFAULT_STATE, crystals: 0 }, 'bulkupgrade')).toBeNull();
    expect(purchaseShopItem({ ...DEFAULT_STATE, crystals: 999 }, 'no-existe')).toBeNull();
  });

  it('los inversores se descuentan vía investorsSpent, no del contador total', () => {
    const s = { ...DEFAULT_STATE, investors: 100, investorsClaimed: 100, investorsSpent: 0 };
    const next = purchaseShopItem(s, 'unlock_plots')!;
    expect(next.investors).toBe(100);
    expect(next.investorsSpent).toBe(60);
    expect(availableInvestors(next)).toBe(40);
  });

  it('cada función de parcelas suma el mismo número de terrenos', () => {
    const base = { ...DEFAULT_STATE, investors: 500, investorsClaimed: 500 };
    const one = purchaseShopItem(base, 'unlock_plots')!;
    expect(totalPlots(one)).toBe(PLOTS_PER_UNLOCK);
    const two = purchaseShopItem({ ...one, souls: 10 }, 'blood_pact')!;
    expect(totalPlots(two)).toBe(PLOTS_PER_UNLOCK * 2);
  });

  it('assignPlot valida índice, negocio y no-op', () => {
    const s = { ...DEFAULT_STATE, investors: 500, investorsClaimed: 500, businesses: { lemonade: 1 } };
    const withPlots = purchaseShopItem(s, 'unlock_plots')!;
    const assigned = assignPlot(withPlots, 0, 'lemonade')!;
    expect(assigned.plotAssignments[0]).toBe('lemonade');
    expect(assignPlot(assigned, 0, 'lemonade')).toBeNull(); // ya estaba así
    expect(assignPlot(assigned, 0, null)?.plotAssignments[0]).toBeUndefined(); // desasignar
    expect(assignPlot(withPlots, 99, 'lemonade')).toBeNull(); // fuera de rango
    expect(assignPlot(withPlots, 0, 'no-existe')).toBeNull(); // negocio inválido
    expect(assignPlot(withPlots, 0, null)?.plotAssignments[0]).toBeUndefined();
  });
});

describe('mánagers', () => {
  it('no hace nada si la automatización no está desbloqueada', () => {
    expect(runManagers(DEFAULT_STATE)).toBe(DEFAULT_STATE);
  });

  it('el mánager compra solo y gasta lo justo', () => {
    let s: GameState = { ...DEFAULT_STATE, totalEarned: 1e9, cash: 1e9, automated: { lemonade: true } };
    const before = s.cash;
    s = runManagers(s);
    expect(businessCount(s, 'lemonade')).toBeGreaterThan(0);
    expect(s.cash).toBeLessThan(before);
    expect(s.cash).toBeGreaterThanOrEqual(0);
  });

  it('contratar mánager cobra MANAGER_COST y descontratar no devuelve nada', () => {
    const base = { ...DEFAULT_STATE, totalEarned: 1e9, cash: MANAGER_COST * 2 };
    const on = toggleAutomation(base, 'lemonade')!;
    expect(on.cash).toBe(MANAGER_COST);
    const off = toggleAutomation(on, 'lemonade')!;
    expect(off.cash).toBe(MANAGER_COST);
    expect(off.automated.lemonade).toBe(false);
  });

  it('el Capataz Infernal también compra mejoras', () => {
    const s = {
      ...DEFAULT_STATE,
      totalEarned: 1e12,
      cash: 1e12,
      businesses: { lemonade: 5 },
      automated: { lemonade: true },
      shopUpgrades: { foreman_upgrade: 1 },
    };
    expect(runManagers(s).upgrades.lemonade).toBeGreaterThan(0);
  });
});

describe('renacimiento', () => {
  it('currencyFromEarned es 0 por debajo del requisito', () => {
    expect(currencyFromEarned(1, 0)).toBe(0);
    expect(currencyFromEarned(1, 18e6 - 1)).toBe(0);
    expect(currencyFromEarned(1, 18e6)).toBeGreaterThan(0);
  });

  it('canRebirth exige nivel desbloqueado Y requisito alcanzado', () => {
    expect(canRebirth(richState(), 1)).toBe(true);
    expect(canRebirth({ ...richState(), totalEarned: 0 }, 1)).toBe(false);
    expect(canRebirth(DEFAULT_STATE, 2)).toBe(false);
  });

  it('el Infierno conserva estadísticas de vida y pierde lo demás', () => {
    const s = richState({ taps: 4242, souls: 1, hellFalls: 2, shopUpgrades: { unlock_plots: 1 }, tapLevel: 7 });
    const hell = applyHellFall(s, 3);
    expect(hell.lifetimeEarned).toBe(s.lifetimeEarned);
    expect(hell.taps).toBe(4242);
    expect(hell.shopUpgrades.unlock_plots).toBe(1);
    expect(hell.hellFalls).toBe(3);
    expect(hell.souls).toBe(4);
    expect(hell.cash).toBe(0);
    expect(hell.tapLevel).toBe(0);
    expect(hell.investors).toBe(0);
    expect(hell.crystals).toBe(0);
    expect(hell.stars).toBe(0);
    expect(Object.keys(hell.businesses)).toHaveLength(0);
  });

  it('el Cielo suma estrellas y conserva inversores', () => {
    const s = richState();
    const heaven = applyHeaven(s, 7, false);
    expect(heaven.stars).toBe(7);
    expect(heaven.tier3).toBe(1);
    expect(heaven.heavenReached).toBe(true);
    expect(heaven.investors).toBe(s.investors);
    expect(heaven.crystals).toBe(0);
  });

  it('el Portal convierte inversores en cristales', () => {
    const s = richState();
    const portal = applyPortalRebirth(s, 9, false);
    expect(portal.crystals).toBe(s.crystals + 9);
    expect(portal.investors).toBe(0);
    expect(portal.investorsSpent).toBe(0);
    expect(portal.tier2).toBe(s.tier2 + 1);
  });

  it('Contrato Eterno conserva los mánagers; el Infierno nunca', () => {
    const s = richState({ automated: { lemonade: true }, shopUpgrades: { permanent_managers: 1 } });
    expect(applyHeaven(s, 1, true).automated.lemonade).toBe(true);
    expect(applyHeaven(s, 1, false).automated).toEqual({});
    expect(applyHellFall(s, 1).automated).toEqual({});
  });
});

describe('La Balanza', () => {
  it('el primer ascenso es siempre Cielo', () => {
    const s = richState({ tier3: 0 });
    expect(ascensionMode(s)).toBe('guaranteed');
    for (let i = 0; i < 50; i++) expect(resolveAscension(s, 'hell')).toBe('heaven');
  });

  it('sin caídas suficientes es una apuesta con la probabilidad configurada', () => {
    const s = richState({ tier3: 2, hellFalls: BALANZA_THRESHOLD - 1 });
    expect(ascensionMode(s)).toBe('gamble');
    expect(balanzaUnlocked(s)).toBe(false);
    const trials = 4_000;
    let heavens = 0;
    for (let i = 0; i < trials; i++) if (resolveAscension(s) === 'heaven') heavens += 1;
    const observed = heavens / trials;
    expect(Math.abs(observed - HEAVEN_CHANCE)).toBeLessThan(0.03);
  });

  it(`tras ${BALANZA_THRESHOLD} caídas el jugador elige`, () => {
    const s = richState({ tier3: 2, hellFalls: BALANZA_THRESHOLD });
    expect(balanzaUnlocked(s)).toBe(true);
    expect(ascensionMode(s)).toBe('choice');
    expect(resolveAscension(s, 'heaven')).toBe('heaven');
    expect(resolveAscension(s, 'hell')).toBe('hell');
  });

  it('las almas sorteadas están dentro del rango configurado', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const souls = randomSouls();
      expect(souls).toBeGreaterThanOrEqual(SOULS_MIN_PER_FALL);
      expect(souls).toBeLessThanOrEqual(SOULS_MAX_PER_FALL);
      seen.add(souls);
    }
    // Con 500 sorteos y un rango de 1..4 tienen que salir todos los valores.
    expect(seen.size).toBe(SOULS_MAX_PER_FALL - SOULS_MIN_PER_FALL + 1);
  });
});

describe('offline', () => {
  const producing = () => buyBusiness({ ...DEFAULT_STATE, cash: 1e6 }, 'lemonade', 10)!;

  it('sin producción no hay recibo', () => {
    expect(computeOffline(DEFAULT_STATE, Date.now() + 1e6)).toBeNull();
  });

  it('dentro del tope se cobra la tasa completa', () => {
    const s = producing();
    const now = s.lastSave + 3_600_000; // 1h
    const r = computeOffline(s, now)!;
    expect(r.msAtFull).toBe(3_600_000);
    expect(r.msAtReduced).toBe(0);
    expect(r.claimed).toBeCloseTo(r.potential * OFFLINE_RATE, 6);
  });

  it('pasado el tope el excedente va a la tasa reducida', () => {
    const s = producing();
    const now = s.lastSave + OFFLINE_CAP_MS + 3_600_000;
    const r = computeOffline(s, now)!;
    expect(r.msAtFull).toBe(OFFLINE_CAP_MS);
    expect(r.msAtReduced).toBe(3_600_000);
    expect(r.claimed).toBeLessThan(r.potential * OFFLINE_RATE);
    expect(r.deducted).toBeCloseTo(r.potential - r.claimed, 6);
  });

  it('el Reloj Dimensional duplica el tope', () => {
    const s = { ...producing(), shopUpgrades: { offline48: 1 } };
    expect(offlineCapMs(s)).toBe(OFFLINE_CAP_MS * 2);
    expect(offlineCapMs(producing())).toBe(OFFLINE_CAP_MS);
  });

  it('cobrar el recibo suma el dinero y registra la hora', () => {
    const s = producing();
    const r = computeOffline(s, s.lastSave + 3_600_000)!;
    const claimed = claimOffline(s, r, new Date(2026, 0, 1, 3, 15).getTime());
    expect(claimed.cash).toBeCloseTo(s.cash + r.claimed, 6);
    expect(claimed.offlineClaimHour).toBe(3);
  });

  it('el tiempo pasado no se cobra dos veces (lastSave avanza)', () => {
    const s = { ...producing(), lastSave: Date.now() };
    const first = computeOffline(s, s.lastSave + 3_600_000)!;
    const after = claimOffline(s, first, s.lastSave + 3_600_000);
    const second = computeOffline({ ...after, lastSave: s.lastSave + 3_600_000 }, s.lastSave + 3_600_000);
    expect(second).toBeNull();
    expect(first.claimed).toBeGreaterThan(0);
    expect(OFFLINE_REDUCED_RATE).toBeLessThan(OFFLINE_RATE);
  });
});

describe('sanitizeState', () => {
  it('rellena una partida vacía o corrupta sin lanzar', () => {
    for (const bad of [null, undefined, {}, [], 'texto', 42, { cash: 'mucho' }]) {
      const s = sanitizeState(bad);
      expect(s.cash).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(s.lifetimeEarned)).toBe(true);
    }
  });

  it('descarta negocios y funciones que ya no existen en el catálogo', () => {
    const s = sanitizeState({
      businesses: { lemonade: 3, inventado: 99 },
      upgrades: { lemonade: 2, inventado: 9 },
      shopUpgrades: { bulkupgrade: 1, inventado: 1 },
    });
    expect(s.businesses).toEqual({ lemonade: 3 });
    expect(s.upgrades).toEqual({ lemonade: 2 });
    expect(s.shopUpgrades).toEqual({ bulkupgrade: 1 });
  });

  it('repara investorsClaimed por debajo del suelo del lifetime', () => {
    const s = sanitizeState({ lifetimeEarned: 20e9, investorsClaimed: 0, investors: 5 });
    expect(s.investorsClaimed).toBe(totalInvestorsEarned(20e9));
    expect(accrueInvestors(s, s.lifetimeEarned).investors).toBe(5);
  });

  it('limita investorsSpent a los inversores poseídos', () => {
    expect(sanitizeState({ investors: 5, investorsSpent: 999 }).investorsSpent).toBe(5);
  });

  it('descarta parcelas fuera de rango o de negocios inexistentes', () => {
    const s = sanitizeState({
      shopUpgrades: { unlock_plots: 1 },
      plotAssignments: { 0: 'lemonade', 1: 'invento', 99: 'pizza' },
    });
    expect(s.plotAssignments).toEqual({ 0: 'lemonade' });
  });
});

describe('bonus de logros', () => {
  it('sin logros el multiplicador es 1', () => {
    const s: GameState = { ...DEFAULT_STATE, cash: 0, totalEarned: 0, lifetimeEarned: 0 };
    expect(achievementsUnlocked(s)).toBe(0);
    expect(achievementMultiplier(s)).toBe(1);
  });

  it('cada logro suma su parte y el tope es el número de logros', () => {
    const pobre: GameState = { ...DEFAULT_STATE, totalEarned: 0, lifetimeEarned: 0 };
    const rico: GameState = { ...DEFAULT_STATE, cash: 1e18, totalEarned: 1e18, lifetimeEarned: 1e18,
      taps: 1e6, businesses: Object.fromEntries(BUSINESSES.map((b) => [b.id, 10_000])),
      upgrades: Object.fromEntries(BUSINESSES.map((b) => [b.id, 50])) };
    const n = achievementsUnlocked(rico);
    expect(n).toBeGreaterThan(achievementsUnlocked(pobre));
    expect(achievementMultiplier(rico)).toBeCloseTo(1 + n * ACHIEVEMENT_BONUS_PER, 10);
    // Acotado: nunca puede desbocarse.
    expect(achievementMultiplier(rico)).toBeLessThanOrEqual(1 + ACHIEVEMENTS.length * ACHIEVEMENT_BONUS_PER);
  });

  it('el bonus entra en el ingreso total y es monótono', () => {
    const base: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 10 } };
    const conLogro: GameState = { ...base, totalEarned: 1e6, lifetimeEarned: 1e6 };
    expect(achievementMultiplier(conLogro)).toBeGreaterThan(achievementMultiplier(base));
    expect(totalIncome(conLogro)).toBeGreaterThan(totalIncome(base));
    // Es exactamente proporcional: el bonus no toca la base.
    expect(totalIncome(conLogro) / totalIncome(base)).toBeCloseTo(
      achievementMultiplier(conLogro) / achievementMultiplier(base), 10);
  });

  it('sobrevive al renacimiento: los logros no se pierden', () => {
    const antes: GameState = { ...DEFAULT_STATE, totalEarned: 20e6, lifetimeEarned: 20e6,
      businesses: Object.fromEntries(BUSINESSES.map((b) => [b.id, 10])) };
    const despues = applyAlienRebirth(antes, 5, false);
    expect(achievementsUnlocked(despues)).toBeGreaterThan(0);
    expect(achievementMultiplier(despues)).toBeGreaterThan(1);
  });
});

describe('loop de juego: toque, hitos y buffs', () => {
  it('el toque nunca se queda obsoleto: escala con el ingreso', () => {
    const pobre: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 1 } };
    const rico: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 5_000, rocket: 500 } };
    expect(totalIncome(rico)).toBeGreaterThan(totalIncome(pobre) * 1000);
    // El toque crece en la misma proporción, no se queda en $1 para siempre.
    expect(tapValue(rico)).toBeGreaterThan(tapValue(pobre) * 1000);
    expect(tapValue(rico)).toBeCloseTo(
      totalIncome(rico) * TAP_INCOME_FRACTION + TAP_BASE_VALUE, 6);
  });

  it('applyTap aplica el multiplicador de combo/crítico', () => {
    const s: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 100 } };
    const normal = applyTap(s);
    const critico = applyTap(s, CRIT_MULT);
    expect(critico.cash).toBeCloseTo(s.cash + tapValue(s) * CRIT_MULT, 6);
    expect(critico.cash).toBeGreaterThan(normal.cash);
    // Un multiplicador inválido no puede romper el estado.
    expect(applyTap(s, NaN).cash).toBe(normal.cash);
    expect(applyTap(s, -5).cash).toBe(normal.cash);
    expect(applyTap(s, CRIT_MULT).taps).toBe(1);
  });

  it('los hitos dan +10% cada 25 unidades y tienen tope', () => {
    expect(milestonesReached(0)).toBe(0);
    expect(milestonesReached(24)).toBe(0);
    expect(milestonesReached(25)).toBe(1);
    expect(milestonesReached(50)).toBe(2);
    expect(milestoneMultiplier(50)).toBeCloseTo(1 + 2 * MILESTONE_BONUS, 10);
    // Acotado: no puede crecer sin límite.
    expect(milestonesReached(1e9)).toBe(MILESTONE_MAX);
    expect(milestoneMultiplier(1e9)).toBeCloseTo(1 + MILESTONE_MAX * MILESTONE_BONUS, 10);
  });

  it('los hitos entran en el ingreso del negocio y en el total', () => {
    const sinHito: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 24 } };
    const conHito: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 25 } };
    const def = BUSINESSES[0];
    // 25 unidades rinden más que 24 incluso descontando la unidad extra.
    expect(businessIncome(def, conHito) / businessIncome(def, sinHito)).toBeCloseTo(
      (25 / 24) * (1 + MILESTONE_BONUS), 10);
    expect(totalIncome(conHito)).toBeGreaterThan(totalIncome(sinHito) * (25 / 24));
  });

  it('el buff de Fiebre multiplica el tick sin tocarse la partida', () => {
    const s: GameState = { ...DEFAULT_STATE, businesses: { lemonade: 100 } };
    const normal = tickIncome(s, 1_000);
    const fiebre = tickIncome(s, 1_000, 7);
    expect(fiebre.cash).toBeCloseTo(s.cash + totalIncome(s) * 7, 6);
    expect(fiebre.cash).toBeCloseTo(normal.cash * 7, 6);
    // El multiplicador no se guarda en ningún campo: el estado sigue siendo puro.
    expect(Object.keys(fiebre).sort()).toEqual(Object.keys(normal).sort());
    expect(tickIncome(s, 1_000, NaN).cash).toBe(normal.cash);
  });

  it('cada hito es un objetivo alcanzable: el coste de 25 unidades más es finito', () => {
    // El loop no debe tener un muro: seguir comprando siempre es posible.
    const s: GameState = { ...DEFAULT_STATE, cash: Infinity, businesses: { lemonade: 0 } };
    let cur = s;
    for (let i = 0; i < MILESTONE_EVERY; i++) {
      const next = buyBusiness(cur, 'lemonade', 1);
      expect(next, `compra ${i + 1}`).not.toBeNull();
      cur = next!;
    }
    expect(milestonesReached(businessCount(cur, 'lemonade'))).toBe(1);
  });
});
