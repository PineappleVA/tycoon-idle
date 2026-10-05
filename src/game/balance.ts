/**
 * balance.ts — TODAS las constantes de balance del juego.
 *
 * Regla del proyecto: ningún otro módulo escribe un número de balance.
 * La lógica los importa de aquí y la UI los deriva de la lógica, de modo que
 * un cambio de diseño se hace en un único sitio y no puede desincronizarse
 * con lo que se muestra en pantalla.
 */

/* ------------------------------------------------------------------ */
/* Negocios                                                            */
/* ------------------------------------------------------------------ */

/** Crecimiento geométrico del coste de cada unidad adicional. */
export const BUSINESS_COST_MULTIPLIER = 1.24;

/** Coste de la mejora nivel 0, como múltiplo del coste base del negocio. */
export const UPGRADE_BASE_MULT = 25;

/** Crecimiento del coste de cada nivel de mejora. */
export const UPGRADE_COST_GROWTH = 7.5;

/** Cada nivel de mejora multiplica el ingreso del negocio por este valor. */
export const UPGRADE_INCOME_MULT = 2;

/* ------------------------------------------------------------------ */
/* Mano de obra (tap)                                                  */
/* ------------------------------------------------------------------ */

/** Coste de la primera mejora de mano de obra. */
export const TAP_UPGRADE_BASE_COST = 90;

/** Crecimiento del coste de cada nivel de mano de obra. */
export const TAP_UPGRADE_COST_GROWTH = 2.8;

/** Valor base de un toque sin mejoras. */
export const TAP_BASE_VALUE = 1;

/** Dinero extra por toque que aporta cada nivel de mano de obra. */
export const TAP_VALUE_PER_LEVEL = 3;

/* ------------------------------------------------------------------ */
/* Ganancias offline                                                   */
/* ------------------------------------------------------------------ */

/** Fracción de la producción offline que se cobra dentro del tope. */
export const OFFLINE_RATE = 0.25;

/** Fracción que se cobra una vez superado el tope. */
export const OFFLINE_REDUCED_RATE = 0.03;

/** Tope de tiempo offline que se paga a OFFLINE_RATE (24h). */
export const OFFLINE_CAP_MS = 24 * 60 * 60 * 1000;

/** Multiplicador del tope que concede la función "Reloj Dimensional". */
export const OFFLINE_CAP_RELIC_MULT = 2;

/** Ausencias más cortas que esto no generan recibo. */
export const OFFLINE_MIN_MS = 5_000;

/* ------------------------------------------------------------------ */
/* Mánagers (automatización)                                           */
/* ------------------------------------------------------------------ */

/** Precio de contratar un mánager para un negocio. */
export const MANAGER_COST = 150_000;

/** Cada cuántos ms actúa cada mánager. */
export const MANAGER_TICK_MS = 1_000;

/** Unidades máximas que un mánager compra en un solo tick. */
export const MANAGER_MAX_BUYS_PER_TICK = 25;

/* ------------------------------------------------------------------ */
/* Parcelas y empleados                                                */
/* ------------------------------------------------------------------ */

/** Parcelas que otorga cada función que las concede. */
export const PLOTS_PER_UNLOCK = 3;

/** Bonus multiplicativo (+1 = +100%) que aporta cada empleado asignado. */
export const PLOT_BONUS_PER_EMPLOYEE = 1;

/* ------------------------------------------------------------------ */
/* Inversores alienígenas                                              */
/* ------------------------------------------------------------------ */

/** Dinero acumulado en lifetime que genera un inversor. */
export const INVESTOR_PER_EARNED = 750_000;

/** Bonus de velocidad que aporta CADA inversor poseído. */
export const INVESTOR_BONUS_PER = 0.01;

/* ------------------------------------------------------------------ */
/* Renacimiento                                                        */
/* ------------------------------------------------------------------ */

/** Bonus por Cristal (nivel 2). */
export const CRYSTAL_BONUS_PER = 0.2;

/** Bonus por Estrella (nivel 3). */
export const STAR_BONUS_PER = 1.2;

/** Probabilidad de Cielo en ascensos repetidos (el primero es garantizado). */
export const HEAVEN_CHANCE = 0.25;

/* ------------------------------------------------------------------ */
/* Infierno / La Balanza                                               */
/* ------------------------------------------------------------------ */

/** Rango de Almas ganadas por cada caída al Infierno (aleatorio). */
export const SOULS_MIN_PER_FALL = 1;
export const SOULS_MAX_PER_FALL = 4;

/** Caídas al Infierno tras las cuales "El Cielo" se vuelve "La Balanza":
 *  el jugador elige su destino en vez de apostar. */
export const BALANZA_THRESHOLD = 3;

/* ------------------------------------------------------------------ */
/* Bucle de juego y guardado                                           */
/* ------------------------------------------------------------------ */

/** Intervalo nominal del tick de ingresos. El tick real usa delta-time,
 *  así que esto sólo fija la granularidad, no la velocidad del juego. */
export const TICK_MS = 100;

/** Delta máximo que se aplica de golpe: evita saltos enormes si el navegador
 *  suspende la pestaña (de eso ya se ocupa el cálculo offline). */
export const TICK_MAX_DELTA_MS = 1_000;

/** Cada cuánto se autoguarda. */
export const SAVE_INTERVAL_MS = 5_000;

/** Clave y versión del guardado en localStorage. */
export const SAVE_KEY = 'tycoon-save';
export const SAVE_VERSION = 2;
