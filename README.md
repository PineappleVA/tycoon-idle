# Tycoon Idle — Crea tu Imperio

Juego *idle / clicker* de gestión de negocios hecho con **React 19 + Vite 7 + Tailwind 4**, sin
backend: la partida vive en `localStorage` y se compila en un único `index.html` autocontenido.

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # typecheck + bundle a dist/index.html
npm run typecheck  # sólo tsc --noEmit
```

## Estructura

```
index.html              punto de entrada HTML (→ /src/main.tsx)
vite.config.ts          alias "@" → src/, plugins react + tailwind + singlefile
tsconfig.json           strict, include: ["src", "vite.config.ts"]
src/
  main.tsx              montaje de React (StrictMode)
  App.tsx               shell, pestañas, tiendas, diálogos y tours
  index.css             tema, keyframes y utilidades
  game/                 lógica pura del juego (sin React ni DOM)
    data.ts             negocios, tiendas, constantes de balance
    logic.ts            GameState, costes, ingresos, renacimientos, transiciones
    achievements.ts     definiciones de logros
    format.ts           formato de números, dinero y tiempos
    useGame.ts          único hook con estado: tick, guardado, acciones
  components/           componentes de presentación
  lib/cn.ts             helper clsx + tailwind-merge
```

`src/game/` no importa React: toda la mecánica es función pura de `GameState`, lo que la hace
directamente testeable en Node.

## Mecánicas

- **8 negocios** con coste geométrico (×1,24) y mejoras que duplican el ingreso (×7,5 de coste).
- **Offline**: al volver recibes el 25% de lo producido, con tope de 24h (48h con *Reloj
  Dimensional*); pasado el tope baja al 3%.
- **Mánagers**: automatizan la compra de un negocio (1/s). Desbloqueados con la Pizzería.
- **Parcelas**: asignas empleados a negocios, +100% de ingreso por empleado.
- **Renacimiento en 3 niveles**: Inversores 👽 → Cristales 💠 → Estrellas ⭐.
  El primer ascenso al Cielo está garantizado; los siguientes son 25% Cielo / 75% Infierno.
- **Tiendas de prestigio y diabólica**: cada compra desbloquea una *función* permanente, no un
  bonus numérico.

## Notas de balance

El multiplicador global vive en `rebirthMultiplier()` (`src/game/logic.ts`) y es la única fuente
de verdad: la barra superior lo llama en vez de recalcularlo. El bonus por inversor se lee de
`INVESTOR_BONUS_PER`, y los textos de la UI derivan de esas constantes para no desincronizarse.

`investorsClaimed` es **monotónico** (ver `investorClaimFloor`). Como `lifetimeEarned` sobrevive
a todos los renacimientos, resetear ese contador provocaría que el siguiente tick re-acreditara
todos los inversores del lifetime de golpe.
