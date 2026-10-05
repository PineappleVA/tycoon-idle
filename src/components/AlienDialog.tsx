import { useCallback, useEffect, useRef, useState } from 'react';
import { SOULS_DROP_LABEL } from '../game/data';
import { formatMoney } from '../game/format';
import { AlienSVG, GodSVG, DemonSVG } from './NpcAvatars';

/* ------------------------------------------------------------------
   Glyphs alienígenas y efecto de texto
------------------------------------------------------------------ */
const ALIEN_CHARS = '⌇⧫⊕⊗⋔⎔⏣⏢⊞⊙⟐∰⌘⌬⍟⧈⎊⏧⌁⊛∿⌂⟁⊜';

function alienify(text: string): string {
  return [...text]
    .map((ch) => ' .,!¡?¿\n'.includes(ch) ? ch : ALIEN_CHARS[Math.floor(Math.random() * ALIEN_CHARS.length)])
    .join('');
}

function useTranslatingText(text: string) {
  const [display, setDisplay] = useState('');
  const alienRef = useRef('');
  const idxRef = useRef(0);

  useEffect(() => {
    alienRef.current = alienify(text);
    idxRef.current = 0;
    setDisplay('');
    let cancelled = false;
    let timeout: number;

    const typeAlien = () => {
      if (cancelled) return;
      if (idxRef.current < alienRef.current.length) {
        idxRef.current++;
        setDisplay(alienRef.current.slice(0, idxRef.current));
        timeout = window.setTimeout(typeAlien, 12 + Math.random() * 20);
      } else {
        idxRef.current = 0;
        timeout = window.setTimeout(translate, 220);
      }
    };

    const translate = () => {
      if (cancelled) return;
      if (idxRef.current < text.length) {
        idxRef.current++;
        setDisplay(text.slice(0, idxRef.current) + alienRef.current.slice(idxRef.current));
        timeout = window.setTimeout(translate, 18 + Math.random() * 14);
      } else {
        setDisplay(text);
      }
    };

    timeout = window.setTimeout(typeAlien, 60);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [text]);

  return display;
}

/* ------------------------------------------------------------------
   Coloreado de valores numéricos
------------------------------------------------------------------ */
function ColoredText({ text }: { text: string }) {
  const parts = text.split(/(\$[\d,.KMBTa-z]+|\d+[\d,.]*[KMBTa-z%]*|\+\d+[\d,.]*%?)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\$/.test(part)) return <span key={i} className="font-bold text-amber-300">{part}</span>;
        if (/^\+/.test(part)) return <span key={i} className="font-bold text-emerald-400">{part}</span>;
        if (/^\d+.*%$/.test(part)) return <span key={i} className="font-bold text-emerald-400">{part}</span>;
        if (/^\d/.test(part)) return <span key={i} className="font-bold text-yellow-300">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ------------------------------------------------------------------
   Componente de diálogo reutilizable (estilo boceto: NPC + caja)
------------------------------------------------------------------ */
type Variant = 'alien' | 'god' | 'devil';

/** Capa de fondo animado según el NPC. */
function DialogBackdrop({ variant }: { variant: Variant }) {
  if (variant === 'god') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* rayos celestiales rotando (contenedor giratorio) */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ animation: 'spinSlow 40s linear infinite' }}>
          {Array.from({ length: 14 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute left-0 top-0 origin-top opacity-25"
              style={{
                width: 4 + (idx % 3) * 2,
                height: '140vh',
                background: 'linear-gradient(to bottom, rgba(253,224,71,0.7), transparent)',
                transform: `rotate(${idx * (360 / 14)}deg)`,
                filter: 'blur(6px)',
              }}
            />
          ))}
        </div>
        {/* nubes flotantes */}
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={`c-${idx}`}
            className="absolute rounded-full bg-white/70"
            style={{
              width: 150 + idx * 40,
              height: 55 + idx * 14,
              left: `${(idx * 17) - 8}%`,
              top: `${6 + (idx % 3) * 14}%`,
              filter: 'blur(6px)',
              animation: `coinBob ${5 + idx}s ease-in-out ${idx * 0.5}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
        {/* destellos dorados */}
        {Array.from({ length: 30 }).map((_, idx) => (
          <span
            key={`s-${idx}`}
            className="absolute rounded-full bg-amber-200"
            style={{
              left: `${(idx * 41) % 100}%`,
              top: `${(idx * 63) % 100}%`,
              width: 2 + (idx % 3),
              height: 2 + (idx % 3),
              animation: `twinkle ${2 + (idx % 4)}s ease-in-out ${(idx % 6) * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }
  if (variant === 'devil') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* resplandor de llamas inferior */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2/5"
          style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.4), transparent)', animation: 'flameFlicker 0.5s ease-in-out infinite alternate' }}
        />
        {/* brasas subiendo */}
        {Array.from({ length: 36 }).map((_, idx) => (
          <span
            key={idx}
            className="absolute bottom-0 rounded-full bg-orange-500"
            style={{
              left: `${(idx * 2.8) % 100}%`,
              width: 3 + (idx % 4) * 2,
              height: 3 + (idx % 4) * 2,
              boxShadow: '0 0 8px #f97316',
              animation: `emberRise ${2 + (idx % 4)}s ease-out ${(idx % 6) * 0.35}s infinite`,
            }}
          />
        ))}
        {/* pentagrama tenue girando */}
        <div
          className="absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-700/20 opacity-30"
          style={{ animation: 'spinSlow 40s linear infinite' }}
        />
      </div>
    );
  }
  // alien / espacio
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[160px]" style={{ animation: 'auroraShift 9s ease-in-out infinite' }} />
      <div className="absolute right-1/5 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[140px]" style={{ animation: 'auroraShift 12s ease-in-out 3s infinite' }} />
      {Array.from({ length: 70 }).map((_, idx) => (
        <span
          key={idx}
          className={`absolute rounded-full ${idx % 10 === 0 ? 'bg-amber-200' : 'bg-white'}`}
          style={{
            left: `${(idx * 41) % 100}%`,
            top: `${(idx * 67) % 100}%`,
            width: (idx % 3) + 1,
            height: (idx % 3) + 1,
            animation: `twinkle ${2 + (idx % 5)}s ease-in-out ${(idx % 7) * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function NpcDialogShell({
  variant,
  bg,
  borderColor,
  accentGradient,
  avatar,
  name,
  subtitle,
  nameColor,
  subtitleColor,
  textColor,
  cursorColor,
  btnGradient,
  btnText,
  lastBtnText,
  bigText = false,
  lines,
  onDismiss,
}: {
  variant: Variant;
  bg: string;
  borderColor: string;
  accentGradient: string;
  avatar: React.ReactNode;
  name: string;
  subtitle: string;
  nameColor: string;
  subtitleColor: string;
  textColor: string;
  cursorColor: string;
  btnGradient: string;
  btnText: string;
  lastBtnText: string;
  bigText?: boolean;
  lines: string[];
  onDismiss: () => void;
}) {
  const [i, setI] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const last = i === lines.length - 1;
  const display = useTranslatingText(lines[i]);

  useEffect(() => {
    setCanProceed(false);
    const t = window.setTimeout(() => setCanProceed(true), lines[i].length < 10 ? 1000 : 1400);
    return () => window.clearTimeout(t);
  }, [i, lines]);

  const next = useCallback(() => {
    if (!canProceed) return;
    if (last) onDismiss();
    else setI((v) => v + 1);
  }, [canProceed, last, onDismiss]);

  const cardBg = variant === 'god' ? 'bg-slate-900/80' : 'bg-slate-900/95';

  return (
    <div
      className="animate-fadeInFast pointer-events-auto fixed inset-0 z-[86] flex items-end justify-center overflow-hidden pb-12"
      style={{ background: bg }}
      onClick={canProceed ? next : undefined}
    >
      <DialogBackdrop variant={variant} />

      <div className="relative flex w-full max-w-5xl items-end gap-0 px-6">
        {/* Avatar sobresaliendo */}
        <div className="animate-npcRise relative z-20 mb-0 shrink-0 -mr-4 hidden sm:block">
          <div className="animate-coin">{avatar}</div>
          <div className={`absolute -bottom-2 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full blur-md ${cursorColor}/30`} />
        </div>

        {/* Caja de diálogo */}
        <div className={`animate-npcRise relative flex-1 overflow-hidden rounded-2xl border ${borderColor} ${cardBg} shadow-2xl backdrop-blur-xl`}>
          <div className={`absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r ${accentGradient}`} />
          <div className="p-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <div className="sm:hidden">{avatar}</div>
              <span className={`text-sm font-black uppercase tracking-[0.3em] ${nameColor}`}>{name}</span>
              <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${subtitleColor}`}>{subtitle}</span>
              <div className="ml-auto flex gap-1">
                {lines.map((_, idx) => (
                  <div key={idx} className="h-1 rounded-full transition-all duration-500" style={{
                    width: idx === i ? 20 : 6,
                    background: idx < i ? (cursorColor === 'bg-emerald-400' ? '#34d399' : cursorColor === 'bg-amber-400' ? '#fbbf24' : '#ef4444') : idx === i ? (cursorColor === 'bg-emerald-400' ? '#10b981' : cursorColor === 'bg-amber-400' ? '#f59e0b' : '#dc2626') : 'rgba(255,255,255,0.15)',
                  }} />
                ))}
              </div>
            </div>

            <p
              className={`mt-4 leading-relaxed ${textColor} ${
                bigText
                  ? 'min-h-[5.5rem] font-serif text-xl italic tracking-wide sm:text-2xl'
                  : 'min-h-[4.5rem] font-mono text-sm'
              }`}
              style={bigText ? { textShadow: '0 2px 12px rgba(251,191,36,0.35)' } : undefined}
            >
              <ColoredText text={display} />
              <span className={`ml-1 inline-block ${bigText ? 'h-6 w-1' : 'h-4 w-1.5'} translate-y-0.5 animate-pulse ${cursorColor}`} />
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-300">Omitir</button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500">{canProceed ? 'Click para continuar' : ''}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  disabled={!canProceed}
                  className={`group relative overflow-hidden rounded-xl ${btnGradient} px-6 py-2.5 text-xs font-black uppercase tracking-widest ${btnText} transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  <span className="relative z-10">{last ? lastBtnText : 'Continuar →'}</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Diálogos del Alien (Zorblax)
------------------------------------------------------------------ */
export type AlienDialogContext =
  | { type: 'first' }
  | { type: 'rebirth'; tier1: number; gained: number; lifetimeEarned: number; investors: number; heavenReached?: boolean };

function buildAlienLines(ctx: AlienDialogContext): string[] {
  if (ctx.type === 'first') {
    return [
      '¡Saludos, terrícola! Soy Zorblax, tu contacto interestelar. Hemos estado observándote.',
      'Tu especie construye imperios con... ¿limonada? Fascinante. Pero hay algo especial en ti.',
      'Te ofrecemos un trato: cada 750.000$ que acumules en tu vida, te enviaremos 1 Inversor.',
      'Cada Inversor aumenta tu velocidad de producción en +0.7%. Sin costes ocultos. Palabra de alienígena.',
      'Y un aviso: para avanzar de nivel siempre necesitarás los MATERIALES del nivel anterior, no solo dinero.',
      'Si algún día logras ascender al Cielo, sabrás que ascender es solo el principio. La caída es inevitable.',
      '¡Que comience el juego! Nos vemos cuando necesites más poder... o más limonada. 🛸',
    ];
  }
  const { tier1, gained, lifetimeEarned, investors, heavenReached } = ctx;
  const earned = formatMoney(lifetimeEarned);
  const inv = investors;
  const invPct = (inv * 0.7).toFixed(1);
  const g = gained;
  const gs = g !== 1 ? 'es' : '';

  if (tier1 === 1) {
    return [
      `¡Bienvenido de vuelta, magnate! Primer renacimiento completado. Te hemos enviado ${g} Inversor${gs} de bonificación. 👽`,
      `Hemos analizado tu rendimiento: ${earned} generados en toda tu vida. No está mal... para ser humano.`,
      `Ahora tienes ${inv} Inversor${inv !== 1 ? 'es' : ''}, lo que te da un +${invPct}% de velocidad permanente.`,
      'Consejo de Zorblax: compra varios negocios antes del próximo renacimiento. El interés compuesto es universal.',
      'Dato cósmico: en el sector 7 apostamos por ti. Las cuotas son favorables. Por ahora.',
      '¡Adelante! Cuando reúnas 100 Inversores Y $15.000M en esta vida, podrás abrir el Portal Dimensional. 🌀',
    ];
  }

  const greetings = [
    `¡Ya van ${tier1} renaceres conmigo! Te acabo de enviar ${g} Inversor${gs} más. 🛸`,
    `¡Otra vez por aquí! Renacimiento número ${tier1}. ${g} Inversor${gs} extra a tu cuenta.`,
    `¡Zorblax reportándose! Van ${tier1} veces ya. Toma tus ${g} Inversor${gs} de recompensa.`,
    `¡Terrícola! Van ${tier1} vueltas al ciclo. Aquí tienes ${g} Inversor${gs} recién salido${gs} del horno.`,
    `El sensor de renacimientos marca ${tier1}. Bonificación entregada: ${g} Inversor${gs}.`,
    `¡${tier1} vidas! En nuestro planeta eso te convierte en leyenda. Toma tus ${g} Inversor${gs}.`,
    `¿Renacer número ${tier1}? En el sector 7 hay cerveza gratis para los centenarios. Oye, ¿a qué saben los años?`,
  ];
  const middles = [
    `Rendimiento total: ${earned} generados. Cada vez lo haces más rápido, terrícola.`,
    `Llevas ${earned} acumulados. Tu curva de crecimiento nos tiene impresionados.`,
    `Balance: ${earned}. El sector 7 apuesta por ti (literalmente, hay apuestas).`,
    `${earned} en total. A este ritmo vamos a subirte de categoría en el catálogo intergaláctico.`,
    `Nuestros analistas calculan ${earned} de beneficio bruto. Tus métricas son... inusuales.`,
    `Has movido ${earned} en total. Esa es la cantidad de oro que necesitarías para comprar tu propio sol. Casi.`,
  ];
  const tips = [
    `Tienes ${inv} Inversores activos: +${invPct}% velocidad. Necesitas 100 para el Portal.`,
    `Con ${inv} Inversores tu velocidad sube un +${invPct}%. 100 Inversores + $15.000M abren el Portal.`,
    `${inv} Inversores trabajando para ti (+${invPct}%). No olvides la Tienda Especial.`,
    `+${invPct}% de velocidad con ${inv} Inversores. La Tienda también acepta esta moneda.`,
    `${inv} Inversores en nómina. El Portal exige 100 como materiales, no solo dinero.`,
    `Dato del sector 7: con ${inv} Inversores produces un +${invPct}% más rápido que un humano normal. Que tampoco es mucho decir.`,
  ];
  const facts = [
    'Los Cristales, Estrellas e Inversores multiplican tu ingreso de forma exponencial.',
    'Cada nivel de renacimiento multiplica, no suma. Los efectos se acumulan entre sí.',
    'Los Cristales valen más que los Inversores, pero cuestan mucho más conseguirlos.',
    'Para el Cielo necesitarás haber desbloqueado TODOS los negocios. Sin excepciones.',
    'Los mánagers se resetean con el renacimiento. No, no hay forma de conservarlos. Lo sentimos.',
    'Nuestros científicos dicen que tu ratio productividad/limonada es el más alto del cuadrante.',
    'El universo tiene 12 dimensiones. Tú solo conoces 3. Las otras 9 son para gatos y para inversores.',
    'Una vez nos preguntaste si los alienígenas éramos reales. La respuesta sigue siendo "depende".',
  ];
  const wisdom = [
    'Sabiduría alienígena: el dinero es como el agua, si lo guardas se estanca, si lo mueves riega.',
    'Si un alien te ofrece un trato en una limusina interestelar, no lo aceptes. Acepta cuando te invite a limusina terrestre.',
    'La paciencia es una virtud humana. Los alienígenas no la tenemos. Por eso nos gustan los negocios.',
    'Recuerda: el mejor momento para renacer es siempre. El segundo mejor momento es después de comprar más negocios.',
    'No te tomes la vida demasiado en serio. Al fin y al cabo, es solo un juego... con dinero real ficticio.',
  ];
  const heavenMentions = [
    'Por cierto... nos llegó un reporte de que estuviste en El Cielo. Ni nuestros líderes tienen ese honor.',
    '¿El Cielo, dices? Corrió la voz por toda la galaxia. Hasta el Diablo se queja de ti en foros intergalácticos.',
    'Rumores confirmados: ascendiste al Cielo. Eso te da un aura... rara. Bonita, pero rara.',
    'Un pajarito cósmico me contó que conociste a Dios. Impresionante currículum.',
    'Desde que fuiste al Cielo los precios de las apuestas sobre ti se han triplicado en el sector 7.',
    'Estuviste en El Cielo. Allí el wifi es mejor, pero no hay limonada. Es un equilibrio.',
  ];
  const goodbyes = [
    'Zorblax fuera. Y no, todavía no devolveremos las vacas que abdujimos en 1998. 🐄',
    'Nos vemos en la próxima vida. Recuerda: hidrátate y multiplica ingresos. 🥤',
    'Transmisión finalizada. Que la limonada te acompañe. 🍋',
    'Corto transmisión. Sigue así y algún día tendrás tu propio planeta. 🪐',
    'Zorblax fuera. Mi turno de descanso empieza en 3 minutos galácticos. Ciao. 👋',
    'Terminamos. Si me necesitas, silba al espacio tres veces. O compra más negocios, que es lo mismo. 🛸',
  ];
  const pick = (arr: string[]) => arr[(tier1 - 2) % arr.length];
  const lines = [pick(greetings), pick(middles), pick(tips), pick(facts), pick(wisdom)];
  if (heavenReached) lines.push(heavenMentions[(tier1 - 2) % heavenMentions.length]);
  lines.push(pick(goodbyes));
  return lines;
}

export function AlienDialog({ ctx, onDismiss }: { ctx: AlienDialogContext; onDismiss: () => void }) {
  const lines = buildAlienLines(ctx);
  return (
    <NpcDialogShell
      variant="alien"
      bg="#02030c"
      borderColor="border-emerald-500/30"
      accentGradient="from-transparent via-emerald-400/60 to-transparent"
      avatar={<AlienSVG size={160} />}
      name="Zorblax"
      subtitle="Transmisión"
      nameColor="text-emerald-400"
      subtitleColor="bg-emerald-500/15 text-emerald-300/80"
      textColor="text-slate-100"
      cursorColor="bg-emerald-400"
      btnGradient="bg-emerald-500"
      btnText="text-slate-950"
      lastBtnText="¡Entendido!"
      lines={lines}
      onDismiss={onDismiss}
    />
  );
}

/* ------------------------------------------------------------------
   Diálogo de Dios (Nivel 3, Cielo)
------------------------------------------------------------------ */
const GOD_FIRST = [
  '…',
  'Llevas un tiempo. Lo he visto todo desde aquí.',
  'El primer pellizco de limonada. Las primeras pizzas. Los taxis que se perdían.',
  'El momento en que los alienígenas llamaron a tu puerta. Eso me hizo sonreír.',
  'La apertura del Portal... eso ya me puso nervioso. Pocas almas llegan tan lejos.',
  'Y ahora estás aquí. Frente a Mí. En El Cielo.',
  'No muchos lo consiguen, ¿sabes? La mayoría se rinde en las donas.',
  '¿Sabes qué te diferencia? No paraste. Ni cuando no tenías nada. Ni cuando lo tenías todo.',
  'Eso es lo que vale aquí. No el dinero. La terquedad divina.',
  'Te concedo las Estrellas. Son el poder más puro que existe en este universo y en los otros doce.',
  'Úsalas bien. O no. Sinceramente, ya has demostrado suficiente.',
  'Una cosa más: si vuelves a intentar entrar, ya no será gratis. Habrá una apuesta. 25% Cielo, 75% Infierno.',
  'Y si caes, perderás TODO. Inversores, Cristales, Estrellas, compras de la Tienda. Solo conservarás los números que cuentan tu historia.',
  'La próxima vida empieza con todo lo ganado. Todo lo aprendido. Todo el poder.',
  '…Ahora ve. Tu imperio te espera.',
  '— Dios',
];
/** Diálogos de repetición: cortos y con un comentario sobre "qué tal la vida". */
function buildGodRepeat(visitCount: number, stars: number, lifetimeEarned: number): string[] {
  const earned = formatMoney(lifetimeEarned);
  const openers = [
    '…Has vuelto a apostar. Y has ganado. Qué suerte tienes, terrícola.',
    'Vaya, vaya. Otra vez aquí arriba, frente a Mí. El destino te sonríe.',
    'Increíble. Sigues desafiando las probabilidades una y otra vez.',
    'Tú de nuevo. Empiezas a ser un habitual de mi sala.',
    'Ah, eres tú. Ya casi te reservo asiento fijo aquí en El Cielo.',
  ];
  // Comentario sobre cómo va la vida (stats)
  const status = [
    `He revisado tu expediente: ${earned} generados en esta vida. Nada mal para un mortal.`,
    `Tu balance de vida marca ${earned}. Sí, lo veo TODO desde aquí.`,
    `${earned} acumulados en tu existencia. El universo lleva la cuenta, y Yo también.`,
    `Con ${earned} a tus espaldas y ${stars} Estrella${stars !== 1 ? 's' : ''}, tu leyenda crece.`,
  ];
  const gift = [
    `Toma más Estrellas. Ya llevas ${stars}. Úsalas con cabeza.`,
    `Aquí tienes tu recompensa. Tu colección asciende a ${stars} Estrella${stars !== 1 ? 's' : ''}.`,
    `Más poder para ti. ${stars} Estrella${stars !== 1 ? 's' : ''} en tu haber ya.`,
  ];
  const closers = [
    '¿Volverás a arriesgarte? Esa es siempre la pregunta. — Dios',
    'El Diablo pregunta mucho por ti. No le hago caso. — Dios',
    'Si algún día dejas de volver, te creeré cuando lo vea. — Dios',
    'Ve. Tu imperio renace contigo. — Dios',
  ];
  const p = (arr: string[]) => arr[(visitCount - 2) % arr.length];
  return [p(openers), p(status), p(gift), p(closers)];
}

export function GodDialog({
  visitCount = 1,
  stars = 0,
  lifetimeEarned = 0,
  onDismiss,
}: {
  visitCount?: number;
  stars?: number;
  lifetimeEarned?: number;
  onDismiss: () => void;
}) {
  const lines = visitCount <= 1 ? GOD_FIRST : buildGodRepeat(visitCount, stars, lifetimeEarned);
  return (
    <NpcDialogShell
      variant="god"
      bigText
      bg="linear-gradient(180deg, #dbeafe 0%, #ddd6fe 45%, #fce7f3 100%)"
      borderColor="border-amber-300/50"
      accentGradient="from-amber-200 via-yellow-400 to-amber-200"
      avatar={<GodSVG size={170} />}
      name="Dios"
      subtitle="Mensaje Divino"
      nameColor="text-amber-300"
      subtitleColor="bg-amber-400/20 text-amber-200"
      textColor="text-amber-50"
      cursorColor="bg-amber-400"
      btnGradient="bg-gradient-to-r from-amber-400 to-yellow-500"
      btnText="text-slate-900"
      lastBtnText="Amén"
      lines={lines}
      onDismiss={onDismiss}
    />
  );
}

/* ------------------------------------------------------------------
   Diálogo del Diablo (Infierno) — ahora el reset es TOTAL
   Solo se conservan estadísticas de vida (lifetimeEarned, taps, renacimientos,
   haber llegado al Cielo). TODO lo demás desaparece.
------------------------------------------------------------------ */
const DEVIL_SETS = [
  [
    'Jejeje… JAJAJA. Mira quién ha caído.',
    'Estuviste en El Cielo una vez. Y quisiste volver a apostarlo todo a un 25%. Qué osadía… qué estupidez.',
    'Aquí abajo no hay negocios. Ni limonada. Ni alienígenas que te salven.',
    'Tus Cristales. Tus Estrellas. Tus Inversores. La Tienda entera. TODO ha ardido.',
    'Esta vez no te dejé nada. El Infierno es TOTAL. Ni siquiera el Karma de la galaxia te salva.',
    'Empiezas de cero otra vez, terrícola. Pero esa vocecita dentro de ti te dice que volverás a subir.',
    'El Infierno es más amable que la vida, dicen. Yo diría que es más honesto.',
    'Considéralo una lección: la avaricia tiene un precio, y esta vez lo pagaste completo.',
    'Nos volveremos a ver… siempre vuelven. 🔥',
    '— El Diablo',
  ],
  [
    'Vaya, vaya… otra vez por aquí. Ya van varias caídas.',
    '¿No aprendiste? El 75% siempre gana a la larga.',
    'Esta vez me he quedado con TODO. Cristales, Estrellas, Inversores, Tienda. Cenizas.',
    'Solo los números que cuentan tu historia: renacimientos, toques, dinero total. El resto se ha ido.',
    'Empiezas de cero. Como la primera vez. Como todas las veces.',
    'Dato del sector oscuro: los humanos que más caen son los que más suben después. Curioso, ¿no?',
    '¿Volverás a intentarlo? Por supuesto que sí. Los humanos siempre volvéis.',
    'Nos vemos. 🔥',
    '— El Diablo',
  ],
  [
    'Tú de nuevo. Empiezo a conocerte mejor que a Dios mismo te conoce.',
    'Cada caída duele más, ¿verdad? El vacío de empezar de cero absoluto.',
    'Pero aquí sigues. Hay algo casi admirable en tu terquedad autodestructiva.',
    'Tu vida entera se ha borrado, terrícola. Cristales, Estrellas, Inversores, Tienda. Todo. Menos los números que cuentan tu historia.',
    'Yo colecciono almas. Tú coleccionas números. Curioso hobby para un inmortal.',
    'El ciclo continúa. Y yo, en el fondo, casi te admiro.',
    'Si algún día eres tan grande como para vencerme, ese día estaré orgulloso.',
    'Nos vemos en la próxima apuesta. Siempre nos vemos. 🔥',
    '— El Diablo',
  ],
  [
    'Aquí estás otra vez, en mi sala de trofeos. Pasas tanto tiempo aquí que ya te tengo preparada una silla.',
    'He perfeccionado la experiencia. Ahora además de quitarte TODO, te recordaré que tú lo elegiste.',
    'El 25% era tu única esperanza. Apostaste y perdiste. ¿Te arrepientes? Nunca.',
    '¿Sabes? De todas las almas que caen, las tuyas son las que más brillan al quemarse.',
    'Eso es lo que no le perdono a Dios. Te dejó ser tan persistente…',
    'Vete. Empieza de cero. Construye de nuevo. Vuelve a caer. Te estaré esperando con otra apuesta lista.',
    'Es un ciclo hermoso, ¿no crees? Como el dinero. Pero más caliente. 🔥',
    '— El Diablo',
  ],
];

export function HellDialog({
  fallCount = 1,
  soulsGained = 0,
  onDismiss,
}: {
  fallCount?: number;
  /** Almas obtenidas en ESTA caída; si es 0 se muestra el rango posible. */
  soulsGained?: number;
  onDismiss: () => void;
}) {
  const lines = [...DEVIL_SETS[(Math.max(1, fallCount) - 1) % DEVIL_SETS.length]];
  // Se muestra el botín REAL de esta caída (soulsGained), no un número fijo.
  const drop = soulsGained > 0 ? `+${soulsGained} Almas 🔥` : SOULS_DROP_LABEL;
  // Al primer descenso, anuncia la Tienda Diabólica; en los siguientes la recuerda.
  const shopNote = fallCount === 1
    ? `Pero te dejo un regalo envenenado: ${drop} y acceso a mi Tienda Diabólica. Gástalas en poder. Te hará volver antes.`
    : `Toma tus ${drop}. Ya sabes: mi Tienda Diabólica te espera. Nadie se resiste a un buen pacto.`;
  // Insertamos la nota justo antes de la firma final ("— El Diablo").
  lines.splice(lines.length - 1, 0, shopNote);
  return (
    <NpcDialogShell
      variant="devil"
      bg="radial-gradient(ellipse at 50% 100%, #7f1d1d 0%, #450a0a 40%, #1a0000 100%)"
      borderColor="border-red-500/40"
      accentGradient="from-red-700 via-orange-500 to-red-700"
      avatar={<DemonSVG size={165} />}
      name="El Diablo"
      subtitle="Has caído al Infierno"
      nameColor="text-red-400"
      subtitleColor="bg-red-500/15 text-red-400/80"
      textColor="text-red-100"
      cursorColor="bg-red-500"
      btnGradient="bg-gradient-to-r from-red-700 to-orange-600"
      btnText="text-white"
      lastBtnText="Aceptar mi destino"
      lines={lines}
      onDismiss={onDismiss}
    />
  );
}
