/* SVG Avatares de los tres NPCs: Zorblax (Alien), Dios, Demonio */

/** Zorblax — alienígena corpulento verde con casco. */
export function AlienSVG({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {/* Aura alienígena */}
      <ellipse cx="100" cy="100" rx="80" ry="85" fill="#10b981" opacity="0.08" />
      {/* Antena y bola */}
      <line x1="100" y1="14" x2="100" y2="38" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="12" r="10" fill="#6ee7b7" />
      <circle cx="100" cy="12" r="5" fill="white" opacity="0.7" />
      {/* Lóbulos de cabeza */}
      <ellipse cx="34" cy="80" rx="14" ry="20" fill="#34d399" />
      <ellipse cx="166" cy="80" rx="14" ry="20" fill="#34d399" />
      {/* Cabeza principal */}
      <ellipse cx="100" cy="78" rx="68" ry="62" fill="#34d399" />
      <ellipse cx="100" cy="82" rx="60" ry="52" fill="#6ee7b7" />
      {/* Brillo de cabeza */}
      <ellipse cx="78" cy="58" rx="20" ry="10" fill="white" opacity="0.18" />
      {/* Ojos grandes con párpados */}
      <ellipse cx="76" cy="76" rx="22" ry="26" fill="#022c22" />
      <ellipse cx="124" cy="76" rx="22" ry="26" fill="#022c22" />
      <ellipse cx="78" cy="74" rx="8" ry="11" fill="#a7f3d0" />
      <ellipse cx="126" cy="74" rx="8" ry="11" fill="#a7f3d0" />
      {/* Brillos en ojos */}
      <circle cx="75" cy="68" r="4" fill="white" opacity="0.9" />
      <circle cx="123" cy="68" r="4" fill="white" opacity="0.9" />
      <circle cx="82" cy="80" r="2" fill="white" opacity="0.6" />
      <circle cx="130" cy="80" r="2" fill="white" opacity="0.6" />
      {/* Nariz pequeña */}
      <ellipse cx="100" cy="93" rx="6" ry="3" fill="#059669" />
      {/* Boca sonriente */}
      <path d="M84 104 Q100 116 116 104" stroke="#064e3b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M88 108 Q100 113 112 108" fill="#064e3b" opacity="0.3" />
      {/* Dientes/colmillos verdes */}
      <path d="M92 104 L96 110 L100 104" fill="#d1fae5" />
      <path d="M100 104 L104 110 L108 104" fill="#d1fae5" />
      {/* Cuerpo */}
      <ellipse cx="100" cy="160" rx="42" ry="32" fill="#34d399" />
      {/* Brazos */}
      <path d="M60 145 Q38 165 50 182" stroke="#34d399" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M140 145 Q162 165 150 182" stroke="#34d399" strokeWidth="14" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dios — ser luminoso etéreo con MUCHOS ojos y rayos. */
export function GodSVG({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {/* Aura exterior extendida */}
      <circle cx="100" cy="100" r="92" fill="#fef3c7" opacity="0.18" />
      <circle cx="100" cy="100" r="80" fill="#fde68a" opacity="0.18" />
      <circle cx="100" cy="100" r="65" fill="#fcd34d" opacity="0.18" />
      {/* Rayos salidos */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <line
          key={a}
          x1="100"
          y1="100"
          x2={100 + Math.cos((a * Math.PI) / 180) * 92}
          y2={100 + Math.sin((a * Math.PI) / 180) * 92}
          stroke="#fbbf24"
          strokeWidth="3"
          opacity="0.45"
          strokeLinecap="round"
        />
      ))}
      {/* Rayos pequeños intermedios */}
      {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((a) => (
        <line
          key={`s-${a}`}
          x1="100"
          y1="100"
          x2={100 + Math.cos((a * Math.PI) / 180) * 75}
          y2={100 + Math.sin((a * Math.PI) / 180) * 75}
          stroke="#fde68a"
          strokeWidth="2"
          opacity="0.35"
          strokeLinecap="round"
        />
      ))}
      {/* Cuerpo luminoso oval */}
      <ellipse cx="100" cy="100" rx="50" ry="55" fill="#fef9c3" />
      <ellipse cx="100" cy="100" rx="44" ry="49" fill="#fefce8" />
      <ellipse cx="100" cy="80" rx="30" ry="10" fill="white" opacity="0.5" />
      {/* OJOS — muchos en múltiples filas */}
      {/* Fila 1: tres ojos arriba */}
      <ellipse cx="75" cy="76" rx="11" ry="13" fill="#fbbf24" />
      <ellipse cx="100" cy="68" rx="11" ry="13" fill="#fbbf24" />
      <ellipse cx="125" cy="76" rx="11" ry="13" fill="#fbbf24" />
      <circle cx="75" cy="76" r="5" fill="#78350f" />
      <circle cx="100" cy="68" r="5" fill="#78350f" />
      <circle cx="125" cy="76" r="5" fill="#78350f" />
      <circle cx="73" cy="73" r="2.5" fill="white" opacity="0.95" />
      <circle cx="98" cy="65" r="2.5" fill="white" opacity="0.95" />
      <circle cx="123" cy="73" r="2.5" fill="white" opacity="0.95" />
      {/* Fila 2: dos ojos a los lados */}
      <ellipse cx="62" cy="100" rx="10" ry="12" fill="#f59e0b" />
      <ellipse cx="138" cy="100" rx="10" ry="12" fill="#f59e0b" />
      <circle cx="62" cy="100" r="4.5" fill="#451a03" />
      <circle cx="138" cy="100" r="4.5" fill="#451a03" />
      <circle cx="60" cy="97" r="2.2" fill="white" opacity="0.95" />
      <circle cx="136" cy="97" r="2.2" fill="white" opacity="0.95" />
      {/* Fila 3: dos ojos más abajo */}
      <ellipse cx="80" cy="122" rx="9" ry="11" fill="#fbbf24" />
      <ellipse cx="120" cy="122" rx="9" ry="11" fill="#fbbf24" />
      <circle cx="80" cy="122" r="4" fill="#78350f" />
      <circle cx="120" cy="122" r="4" fill="#78350f" />
      <circle cx="78" cy="119" r="2" fill="white" opacity="0.9" />
      <circle cx="118" cy="119" r="2" fill="white" opacity="0.9" />
      {/* Ojo central extra (un solo ojo en el medio, sello místico) */}
      <ellipse cx="100" cy="102" rx="6" ry="4" fill="#fff7ed" />
      <circle cx="100" cy="102" r="2.5" fill="#fbbf24" />
      {/* Boca serena y curva */}
      <path d="M86 138 Q100 146 114 138" stroke="#b45309" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M88 140 Q100 144 112 140" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Barba de luz */}
      <path d="M100 145 L92 162 L100 168 L108 162 Z" fill="#fde68a" opacity="0.7" />
    </svg>
  );
}

/** Demonio — rojo con cuernos, colmillos y llamas internas. */
export function DemonSVG({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {/* Llama de fondo */}
      <path d="M40 200 Q60 130 50 80 Q70 100 65 60 Q80 90 80 30 Q90 80 100 20 Q110 80 120 30 Q120 90 135 60 Q130 100 150 80 Q140 130 160 200 Z" fill="#7f1d1d" opacity="0.25" />
      {/* Cuernos curvados hacia afuera */}
      <path d="M58 75 Q35 25 18 8" stroke="#450a0a" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M142 75 Q165 25 182 8" stroke="#450a0a" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M58 75 Q35 25 18 8" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M142 75 Q165 25 182 8" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M58 75 Q35 25 18 8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M142 75 Q165 25 182 8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* Cabeza roja con sombreado */}
      <ellipse cx="100" cy="100" rx="55" ry="50" fill="#7f1d1d" />
      <ellipse cx="100" cy="100" rx="52" ry="47" fill="#dc2626" />
      <ellipse cx="100" cy="92" rx="40" ry="20" fill="#ef4444" />
      {/* Ojos fuego con fondo amarillo */}
      <ellipse cx="78" cy="92" rx="15" ry="18" fill="#1c0000" />
      <ellipse cx="122" cy="92" rx="15" ry="18" fill="#1c0000" />
      {/* Brillo de ojos */}
      <ellipse cx="78" cy="92" rx="8" ry="10" fill="#fbbf24" />
      <ellipse cx="122" cy="92" rx="8" ry="10" fill="#fbbf24" />
      {/* Pupilas verticales */}
      <ellipse cx="78" cy="92" rx="2" ry="7" fill="#000" />
      <ellipse cx="122" cy="92" rx="2" ry="7" fill="#000" />
      {/* Brillos en ojos */}
      <circle cx="75" cy="86" r="2" fill="#fef9c3" opacity="0.95" />
      <circle cx="119" cy="86" r="2" fill="#fef9c3" opacity="0.95" />
      {/* Cejas malvadas */}
      <path d="M60 76 L90 82 L92 78" stroke="#450a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M140 76 L110 82 L108 78" stroke="#450a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Sonrisa malvada con colmillos */}
      <path d="M68 122 Q100 145 132 122" stroke="#450a0a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M70 122 Q100 142 130 122" fill="#7f1d1d" />
      {/* Colmillos blancos */}
      <polygon points="80,123 84,138 88,123" fill="#fefce8" />
      <polygon points="112,123 116,138 120,123" fill="#fefce8" />
      {/* Bigote demoníaco */}
      <path d="M68 110 Q78 116 90 110" stroke="#450a0a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M132 110 Q122 116 110 110" stroke="#450a0a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Perilla puntiaguda */}
      <path d="M100 150 L92 170 L100 178 L108 170 Z" fill="#7f1d1d" />
      <path d="M100 178 L100 188" stroke="#450a0a" strokeWidth="3" strokeLinecap="round" />
      {/* Cuerpo */}
      <ellipse cx="100" cy="180" rx="35" ry="20" fill="#7f1d1d" />
      <ellipse cx="100" cy="178" rx="32" ry="16" fill="#dc2626" />
    </svg>
  );
}
