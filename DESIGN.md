# DESIGN.md — Mi cuaderno

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
| `--ink-faint` | `#8f897c` | Placeholders y pistas |
| `--pencil-fill` | `#b9b3a6` | Rayado de la pestaña activa |
| `--highlight` | `#f3dd8c` | Botón principal (rayado amarillo) |
| `--stamp` | `#b3362f` | Sello "AYER" y errores |
| `--ribbon` / `--ribbon-edge` | `#c85a54` / `#8f3a35` | Cinta marcapáginas |
| `--future` | `#ebe6da` | Días futuros |

**Hábitos:** 10 pasteles (`PASTELS` en `src/domain/types.ts`), uno por hábito, relleno rayado.

**Ánimo:** escala rojo `hsl(356 62% 50%)` → amarillo `hsl(42 88% 63%)` → verde `hsl(135 45% 72%)` con luminosidad creciente (legible con daltonismo rojo-verde). En la escala de puntos el relleno toma el color de la nota ya ajustada a la polaridad: Pereza 2 se pinta verde.

## Tipografía

Excalifont (la de Excalidraw, licencia OFL), solo el subconjunto latino servido desde jsDelivr y cacheado por la PWA. Base 18 px.

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
| Botones | Área táctil mínima 44 × 44 px |
| Cinta | Arriba a la derecha; tocar o tirar abajo abre el calendario, subirla lo cierra |

## Movimiento

150–300 ms, solo con significado (despliegue del calendario, subida de hojas, pista de la cinta la primera vez). `prefers-reduced-motion` desactiva todas las animaciones.
