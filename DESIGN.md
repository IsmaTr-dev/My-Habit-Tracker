# DESIGN.md — Mis hábitos

Fuente de verdad visual. Los tokens viven en `:root` de `src/styles.css`; cualquier cambio aquí se refleja allí en el mismo cambio.

## Concepto

Bullet journal escrito a mano: papel punteado, trazos imperfectos (rough.js, motor de Excalidraw) y color de rotulador pastel. Solo tema claro en v1.

## Color

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#fbf8f1` | Fondo (blanco roto) |
| `--dot` | `#d6cfbf` | Rejilla de puntos, 22 px |
| `--ink` | `#2b2a27` | Texto y trazos |
| `--ink-soft` | `#625d53` | Texto secundario, "ayer" |
| `--ink-faint` | `#716b5e` | Placeholders y pistas (5,0:1 sobre el papel; ≥ 4,5:1 también sobre el grano) |
| `--pencil-fill` | `#b9b3a6` | Rayado de la pestaña activa |
| `--highlight` | `#f3dd8c` | Botón principal (rayado amarillo) |
| `--stamp` | `#b3362f` | Sello "AYER" y errores |
| `--ribbon` / `--ribbon-edge` | `#c85a54` / `#8f3a35` | Cinta marcapáginas |
| `--future` | `#ebe6da` | Días futuros |
| `--desk` | `#e9e2d2` | Mesa bajo la hoja (solo escritorio, ≥ 700 px) |
| `--grain` | Ruido SVG en tono tinta, alfa ≤ 5 % | Grano del papel, junto a la rejilla de puntos en `--paper-image` |

**Hábitos:** 10 pasteles (`PASTELS` en `src/domain/types.ts`), uno por hábito, relleno rayado. En las barras de Stats el rayado lleva un 15 % de tinta para que los pasteles claros se vean sobre el papel.

**Ánimo:** escala rojo `hsl(356 46% 66%)` → amarillo `hsl(42 58% 62%)` → verde `hsl(135 36% 78%)`, con saturación contenida para convivir con los pasteles. La luminancia crece de forma apreciable en cada tramo (0,31 → 0,48 → 0,64), legible con daltonismo rojo-verde, y la tinta se lee sobre cualquier punto de la escala (≥ 4,5:1). Ambas reglas están cubiertas por test. La leyenda del calendario se genera desde `scoreColor`, sin colores repetidos en el CSS. En la escala de puntos el relleno toma el color de la nota ya ajustada a la polaridad: Pereza 2 se pinta verde.

## Tipografía

Excalifont (la de Excalidraw, licencia OFL en `public/fonts/OFL.txt`), solo el subconjunto latino. Se sirve desde la propia app (`public/fonts/Excalifont-Regular.woff2`), con `preload` en `index.html` y dentro del precache de la PWA: sin salto a la fuente de respaldo ni dependencia de CDN. Base 18 px.

Solo existe el peso Regular: `font-synthesis: none` evita la negrita borrosa que inventa el navegador. El énfasis se hace con tamaño, color (`--ink` frente a `--ink-soft`), subrayado ondulado o rayado. El subconjunto no trae flechas (↑ ↓ →): se dibujan con `SketchArrow`.

## Iconografía

Nada de emojis ni controles nativos a la vista: todo se dibuja con rough.js. Las emociones son caritas a tinta (`DoodleFace`), sin color.

## Componentes

| Componente | Regla |
|---|---|
| `SketchBox` | Marco redondeado a mano (radio 12, trazo 1,4); semilla fija por elemento para que no tiemble |
| `SketchCheck` | Caja + tick de rotulador; al marcar, mancha del color del hábito |
| `SketchBar` | Barra con relleno rayado a −50° |
| `DotScale` | Notas 0–10: once círculos a mano que se rellenan hasta la nota; se toca o se arrastra la fila y se guarda al soltar |
| `DoodleFace` | Seis caritas a tinta en lienzo 100×100; sin cabeza dentro de las celdas del calendario |
| `SketchArrow` | Flecha a tinta que toma el color del texto (polaridad "↑ mejor" / "↓ mejor") |
| Filtro `#wobble` | Trazo irregular (SVG `feTurbulence` + `feDisplacementMap`) para lo que se dibuja con CSS: cuadrícula de Stats, marcos de mini-meses y celdas del mes. En las celdas va en un `::before` para no deformar el texto |
| Sello | "AYER" estampado sobre la fecha en la cabecera; en la ficha del día, bajo el título: "HOY" / "AYER" en rojo, "SOLO LECTURA" en `--ink-soft` |
| Resumen del mes | Bajo la leyenda del calendario mensual: días anotados, media (con su color) y emoción más repetida |
| Portada | Login: tapa rayada a lápiz con la etiqueta "Mis hábitos · cuaderno de 2026" pegada y la cinta asomando |
| Hoja en escritorio | Desde 700 px, la columna de 480 px es una hoja sobre `--desk` con sombra teñida de tinta; el calendario se abre dentro de la hoja |
| Cabecera | Mes + día en Hábitos y Ánimo. En Stats, el mes consultado (año debajo) con ‹ › para cambiar de mes |
| Botones | Área táctil mínima 44 × 44 px |
| Cinta | Arriba a la derecha; tocar o tirar abajo abre el calendario, subirla lo cierra |

## Movimiento

150–300 ms, solo con significado (despliegue del calendario, subida de hojas, pista de la cinta la primera vez). `prefers-reduced-motion` desactiva todas las animaciones.

Al marcar un hábito, la mancha de color cae (180 ms) y el tick se traza (240 ms). Solo en el hábito que se acaba de marcar, nunca al montar la pantalla. Sin movimiento, el tick aparece entero.

## Pistas

Las pistas de uso (cinta del calendario, "Mantén pulsado un hábito…") salen hasta que se usa el gesto una vez y se recuerdan en el navegador (`src/ui/hints.ts`).
