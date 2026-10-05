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

/**
 * Intervalo del tick de ingresos. El bucle usa delta-time, así que este valor
 * sólo fija la granularidad del repintado, NO la velocidad del juego: subirlo
 * no ralentiza nada y reduce los re-renders proporcionalmente.
 */
export const TICK_MS = 200;

/** Delta máximo que se aplica de golpe: evita saltos enormes si el navegador
 *  suspende la pestaña (de eso ya se ocupa el cálculo offline). */
export const TICK_MAX_DELTA_MS = 1_000;

/** Cada cuánto se autoguarda. */
export const SAVE_INTERVAL_MS = 5_000;

/** Clave y versión del guardado en localStorage. */
export const SAVE_KEY = 'tycoon-save';
export const SAVE_VERSION = 2;

/* ---- Logros ---- */
/** Bonus de ingreso permanente por cada logro desbloqueado (2 % c/u). */
export const ACHIEVEMENT_BONUS_PER = 0.02;

/* ---- Avisos de logro ---- */
/** Cuánto vive un aviso en pantalla. La animación CSS dura exactamente esto. */
export const TOAST_MS = 4_500;
/** Máximo de avisos simultáneos: el resto se descarta para no tapar el juego. */
export const MAX_TOASTS = 4;

/* ------------------------------------------------------------------ */
/* Toque activo: que jugar con la mano siga importando siempre         */
/* ------------------------------------------------------------------ */

/**
 * Fracción del ingreso por segundo que regala cada toque.
 *
 * Sin esto el toque muere en el primer minuto: con $1 por toque y negocios
 * dando miles por segundo, jugar activamente deja de tener sentido. Con esta
 * fracción un toque siempre equivale a una parte de un segundo de producción,
 * así que la mano sigue siendo útil en toda la partida.
 */
export const TAP_INCOME_FRACTION = 0.12;

/** Puntos de combo para llegar al bonus máximo. */
export const COMBO_MAX = 40;

/** Bonus de toque por cada punto de combo (hasta +80 %). */
export const COMBO_BONUS_PER = 0.02;

/** Milisegundos sin tocar tras los que el combo se pierde. */
export const COMBO_WINDOW_MS = 1_600;

/** Probabilidad de que un toque sea crítico. */
export const CRIT_CHANCE = 0.06;

/** Multiplicador de un toque crítico. */
export const CRIT_MULT = 12;

/* ------------------------------------------------------------------ */
/* Hitos de negocio                                                    */
/* ------------------------------------------------------------------ */

/** Cada cuántas unidades del mismo negocio se alcanza un hito. */
export const MILESTONE_EVERY = 25;

/** Bonus de ingreso de ESE negocio por cada hito alcanzado. */
export const MILESTONE_BONUS = 0.1;

/** Tope de hitos que cuentan (evita que se desboque). */
export const MILESTONE_MAX = 20;

/* ------------------------------------------------------------------ */
/* Evento de suerte: el maletín                                        */
/* ------------------------------------------------------------------ */

/** Intervalo entre apariciones del maletín. */
export const LUCK_MIN_MS = 70_000;
export const LUCK_MAX_MS = 150_000;

/** Cuánto tiempo se queda en pantalla si no lo pillas. */
export const LUCK_LIFE_MS = 13_000;

/* Recompensas posibles (se elige una al azar al pillarlo). */
/** "Fiebre": multiplica todo el ingreso durante un rato. */
export const FEVER_MULT = 7;
export const FEVER_MS = 30_000;
/** "Toque de Midas": multiplica el valor del toque. */
export const MIDAS_TAP_MULT = 20;
export const MIDAS_MS = 20_000;
/** "Golpe de suerte": segundos de ingreso que se cobran al instante. */
export const WINDFALL_SECONDS = 900;
