# Tycoon Idle — Crea tu Imperio

Juego *idle / clicker* de gestión de negocios hecho con **React 19 + Vite 7 + Tailwind 4**, sin
backend: la partida vive en `localStorage` y se compila en un único `index.html` autocontenido.

```bash
npm install
npm run dev         # servidor de desarrollo
npm run test        # suite de lógica (Vitest)
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + bundle a dist/index.html
npm run check       # las tres cosas seguidas
```

## Estructura

```
index.html              punto de entrada HTML (→ /src/main.tsx)
vite.config.ts          alias "@" → src/, dev server, plugins
vitest.config.ts        configuración de tests (entorno node, sin DOM)
tsconfig.json           strict, include: ["src", "vite.config.ts"]

src/
  main.tsx              montaje de React (StrictMode)
  App.tsx               shell: estado de pestañas, tours, diálogos y animación de renacer
  index.css             tema, keyframes y prefers-reduced-motion
  game/                 lógica del juego — sin React ni DOM
    balance.ts          TODAS las constantes de balance
    data.ts             catálogo: negocios y artículos de tienda
    logic.ts            GameState, costes, ingresos, acciones y transiciones (puras)
    achievements.ts     definiciones de logros
    format.ts           formato de números, dinero y tiempos
    tabs.ts             pestañas y sus condiciones de desbloqueo
    tours.ts            guías paso a paso
    useGame.ts          único hook con estado: bucles, guardado y acciones
  components/           presentación (una responsabilidad por archivo)
    ui.tsx              primitivas compartidas: Panel, Chip, StatBox, ProgressBar, ActionButton
  lib/cn.ts             helper clsx + tailwind-merge
```

`src/game/` no importa React: toda la mecánica es función pura de `GameState`, lo que la hace
directamente testeable en Node sin navegador.

## Arquitectura

**Un solo dueño del balance.** Todos los números ajustables viven en `src/game/balance.ts`.
`data.ts` describe contenido, `logic.ts` calcula, y la UI **deriva** los textos de esas
constantes: si cambias el bonus de un inversor, el texto de la tienda, la ficha de negocio y la
barra superior cambian solos. La mitad de los bugs históricos de este proyecto venían de tener
el mismo número escrito en tres sitios.

**Acciones puras.** Comprar, mejorar, tocar, comprar en la tienda, asignar parcelas y las cuatro
transiciones de renacimiento son funciones puras en `logic.ts` que devuelven un `GameState` nuevo
(o `null` si no procede). `useGame` sólo las aplica, así que no hay efectos secundarios dentro de
los *updaters* de `setState` — en `StrictMode` React los invoca dos veces y eso duplicaba los
renacimientos.

**Una sola vía de entrada de dinero.** `earn()` actualiza a la vez el efectivo, el total de la
vida, el lifetime y la acreditación de inversores. Por eso no puede volver a producirse el
descuadre que permitía la explotación de inversores.

**`investorsClaimed` es monotónico** (`investorClaimFloor`). Como `lifetimeEarned` sobrevive a
todos los renacimientos, resetear ese contador hacía que el tick siguiente re-acreditara todo el
lifetime de golpe: $20B se convertían en ~26.600 inversores (×267 de bonus gratis).

**Tick con delta-time.** El bucle mide el tiempo real entre intervalos, así que si el navegador
retrasa los `setInterval` el dinero no se pierde. El tope `TICK_MAX_DELTA_MS` evita saltos
enormes — de las ausencias largas se ocupa el cálculo offline.

## Mecánicas

- **8 negocios** con coste geométrico y mejoras que multiplican el ingreso.
- **Offline**: al volver recibes el 25% de lo producido, con tope de 24h (48h con *Reloj
  Dimensional*); pasado el tope baja al 3%.
- **Mánagers**: compran su negocio cada segundo (y mejoras, con *Capataz Infernal*).
- **Parcelas**: empleados asignados a negocios, +100% de ingreso por empleado.
- **Renacimiento en 3 niveles**: Inversores 👽 → Cristales 💠 → Estrellas ⭐.
- **La Balanza ⚖️**: el primer ascenso al Cielo es garantizado; los siguientes son una apuesta
  25/75 hasta que caes 3 veces al Infierno, momento en el que **eliges tú** tu destino.
- **Tiendas de prestigio y diabólica**: cada compra desbloquea una *función* permanente, no un
  bonus numérico.
- **Logros con recompensa**: cada uno de los 35 suma **+2 % de ingreso permanente**. Sobreviven al
  renacimiento y están acotados (+70 % máx.).
- **Hitos de negocio**: cada 25 unidades de un negocio, ese negocio rinde +10 % (tope 20 hitos).
  Da una razón para seguir invirtiendo en lo que ya tienes, no sólo en desbloquear el siguiente.
- **Toque siempre relevante**: cada toque suma una fracción del ingreso por segundo
  (`TAP_INCOME_FRACTION`), así que jugar con la mano sigue pagando en el endgame en vez de morir
  en el primer minuto.
- **Combo y críticos**: encadenar toques dentro de 1,6 s sube un combo hasta +80 %, y el 6 % de
  los toques son críticos (×12).
- **Maletín de suerte 💼**: aparece solo cada 70–150 s y dura 13 s. Da *Fiebre* (×7 ingreso, 30 s),
  *Toque de Midas* (×20 al toque, 20 s) o un *Golpe de suerte* (15 min de producción al instante).

### El bucle de juego

```
tocar (combo/críticos) ─┐
                        ├─► efectivo ─► comprar negocios ─► hitos (+10 % c/25 uds)
maletín de suerte ──────┘                      │
                                               ├─► mejoras (×2) ─► más ingreso/s
       ingreso/s ─► logros (+2 % c/u) ─────────┘        │
                                                        └─► 18M ─► RENACER ─► multiplicador
                                                                     permanente ─► otra vez,
                                                                     pero más rápido
```

Tres escalas de recompensa a la vez: segundos (toques, críticos, combo), minutos (compras, hitos,
logros, maletín) y horas (renacimiento, offline). Siempre hay algo a punto de desbloquearse.

## Tests

```bash
npm test
```

**118 pruebas** en cinco ficheros:

| Fichero | Qué cubre |
| --- | --- |
| `src/game/logic.test.ts` | lógica pura: costes, ingresos, renacimiento, hitos, buffs, logros |
| `src/game/format.test.ts` | formato de números, dinero y tiempos |
| `src/App.test.tsx` | humo: render completo con `react-dom/server` |
| `src/playtest.test.tsx` | **juego real en jsdom**: se monta, se hace clic y se avanza el reloj |
| `src/playtest.endgame.test.tsx` | tienda, parcelas, mánagers, renacimiento, tienda diabólica |

Los *playtests* no leen el código: montan la aplicación, hacen clic en los botones, cambian de
pestaña y avanzan los temporizadores falsos. Así se encontraron bugs que ningún test de lógica
podía ver — botones anidados, tutoriales que nunca arrancaban, avisos que no se iban nunca.

Incluyen regresiones de bugs reales que tuvo el proyecto: la explotación de inversores, el
`formatNumber` que mostraba `1000K`, el precio mal sumado de las mejoras en lote, el primer
ascenso que podía caer en el Infierno y el aviso de logro que no desaparecía.

## Accesibilidad

- `prefers-reduced-motion` desactiva las animaciones decorativas forzando el estado final, para
  que nada quede oculto.
- Navegación por teclado con `:focus-visible` visible, `role="tablist"` en las pestañas,
  `aria-label`/`aria-pressed` en controles y `role="progressbar"` en las barras.
- Los números animados exponen el valor real en `aria-label`, no el interpolado.

## Debug

`Ctrl+Shift+D` abre el panel de desarrollo: efectivo, monedas de prestigio, fijar un ingreso
objetivo para probar balance, y reset de partida con confirmación.

## Publicar en GitHub Pages

Ya está preparado; sólo falta activarlo una vez en GitHub.

1. **Settings → Pages → Build and deployment → Source**: elige **GitHub Actions**.
2. Fusiona la rama en `main`. El workflow `.github/workflows/deploy.yml` se dispara solo.
3. El juego queda en `https://<usuario>.github.io/tycoon-idle/`.

Qué hace el workflow: `npm ci` → `npm run check` (tipos + tests + build) → sube `dist/` con
`actions/upload-pages-artifact` → publica con `actions/deploy-pages`. **No se publica nada que no
pasen los tests.** También se puede lanzar a mano desde la pestaña *Actions*.

Por qué funciona sin más configuración:

- `viteSingleFile` deja todo (JS y CSS) **inline en un único `dist/index.html`**, así que no hay
  rutas de assets que se rompan al servir desde un subdirectorio.
- Aun así `vite.config.ts` lleva `base: "./"` por si algún día se quita el plugin.
- No hay router ni rutas internas, así que no hace falta `404.html`.
- `npm ci` funciona porque `package-lock.json` está versionado y sincronizado.

Para probar localmente el bundle de producción tal cual se publicará:

```bash
npm run build
npm run preview     # sirve dist/ en http://localhost:4173
```
