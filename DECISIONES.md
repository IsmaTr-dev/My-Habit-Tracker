# Decisiones de diseño — Habit Tracker cuaderno

Registro de decisiones tomadas en las rondas de refinamiento. Fuente de verdad para el plan de implementación.

## Ronda 1 — Alcance y datos

| Tema | Decisión | Notas |
|---|---|---|
| Usuarios | Yo + gente cercana | Requiere login y sincronización; sin intención comercial |
| Vista "Graph" (Stats) | Cuadrícula tipo cuaderno | Días en filas × hábitos en columnas, celdas coloreadas (ref. imagen 7) |
| Edición de días pasados | Solo hoy y ayer | Días anteriores: solo lectura. Nunca días futuros. Aplica a hábitos y ánimo |
| Tipo de hábito (v1) | Sí/no diario | Modelo de datos preparado para ampliar a cantidad/frecuencia |

## Ronda 2 — Cuentas, sincronización y ciclo mensual

| Tema | Decisión | Notas |
|---|---|---|
| Proveedor | Firebase (Auth + Firestore) | Persistencia offline nativa de Firestore; plan gratuito |
| Login | Cuenta de Google | Único método en v1 |
| Corte de día | 04:00 | Hasta las 3:59 cuenta como el día anterior |
| Mes nuevo | Página nueva guiada | Día 1: pantalla "nuevo mes" → escribir mantra + confirmar/editar hábitos copiados del mes anterior |

## Ronda 3 y 4 — Estado de ánimo

| Tema | Decisión | Notas |
|---|---|---|
| Color del día | Media de las notas de los sliders | Ítems negativos invertidos (`10 - valor`) antes de promediar |
| Polaridad de ítems | Se indica al crear el ítem | "Más es mejor" / "Más es peor" |
| Notas 0–10 | Escala de 11 puntos dibujados a mano | Sustituye al slider nativo. El relleno usa el color del ánimo ya ajustado a la polaridad; junto al nombre, "↑ mejor" / "↓ mejor" |
| Slider sin tocar | "Sin valorar" (`null`) | Visualmente apagado; no cuenta en la media |
| Respaldo sin notas | Sin color | El día sin notas no se colorea; la celda muestra la carita de la emoción si la hay |
| Caritas | Emociones (sin orden), dibujadas a tinta | Una única emoción por día. Sin emojis: caritas garabateadas con rough.js |
| Catálogo de emociones | Fijo en v1 | Base: feliz, triste, enfadado, cansado, ansioso, tranquilo (ampliable) |
| Alcance de ítems de ánimo | Globales | Un ítem nuevo aparece todos los días desde su creación; se archiva sin perder historial |

## Ronda 5 y 6 — Calendario y navegación

| Tema | Decisión | Notas |
|---|---|---|
| Navegación principal | 3 botones inferiores: To-do · Stats · Mood | Sin swipe entre pestañas |
| Acceso al calendario | Cinta marcapáginas en la cabecera | Presente en las 3 pantallas. Se abre al tocar **o** tirar hacia abajo. Primera vez: animación de "asomar" como pista |
| Cabecera | Compacta y común a las 3 pantallas | Mes + día. En To-do incluye el mantra. En Mood, debajo: frase del día + círculo de emoción |
| Vista anual | Rejilla 3×4 de mini-meses | Cada día como cuadradito de color, sin números. Tocar un mes → vista mensual |
| Vista mensual | Rejilla de 7 columnas, semana empieza en lunes | Tocar un día → ficha del día |
| Ficha del día | Ánimo + hábitos | Frase, emoción, notas de sliders, texto libre y hábitos cumplidos. Editable solo si es hoy o ayer |

## Ronda 7 — Stats

| Tema | Decisión | Notas |
|---|---|---|
| Vistas | `%` · `Cuadrícula` | Swipe horizontal para cambiar de mes (+ flechas ‹ › por accesibilidad). Título con año ("Sept 2026") |
| Cálculo % (mes en curso) | Sobre días transcurridos | Denominador: desde día 1 (o creación del hábito) hasta ayer, + hoy solo si ya está marcado |
| Cálculo % (meses cerrados) | Sobre días del mes | Desde creación del hábito si se añadió a mitad de mes |
| Límite de hábitos | 10 por mes | Garantiza que la cuadrícula cabe sin scroll horizontal |
| Ánimo en Stats | No | El ánimo se consulta en el calendario |
| Rachas | Sí, en vista % | "Racha actual" (cruza meses) + "mejor racha" del mes visualizado |

## Ronda 8 — Estilo visual

| Tema | Decisión | Notas |
|---|---|---|
| Idioma | Español | Solo español en v1 |
| Papel | Punteado (bullet journal) | Rejilla de puntos suave sobre blanco roto |
| Color de hábitos | Pastel por hábito | Se elige de una paleta pastel al crear/editar el hábito. Relleno tipo rotulador/acuarela |
| Fuente | Excalifont (por el momento) | Decidida tras ver el prototipo; revisable |
| Trazos | rough.js | Bordes, checks, barras y cuadrícula con aspecto dibujado a mano |

## Ronda 9 — Transversal

| Tema | Decisión | Notas |
|---|---|---|
| Plataforma | PWA | Instalable, offline. Hosting en Firebase Hosting |
| Recordatorios | No en v1 | Evita Cloud Functions / plan Blaze |
| Privacidad | Login Google + reglas de Firestore | Cada usuario solo accede a `users/{uid}/**`. Sin PIN ni cifrado E2E en v1 |
| Gestión de hábitos | Mantener pulsado | Menú: editar nombre/color, archivar. Arrastrar para reordenar |

## Ronda 10 — Pendientes cerrados

| Tema | Decisión | Notas |
|---|---|---|
| Acceso a "ayer" | Flecha ‹ › junto al día en la cabecera | Sello "AYER" + tinta más clara. Solo dos estados (hoy/ayer). Aplica en Hábitos y Ánimo |
| Ítems de ánimo iniciales | Ninguno | Lista vacía con 2–3 propuestas (Motivación +, Felicidad +, Pereza −) que se añaden con un toque |
| Frase del día | 80 caracteres, 1 línea | |
| Cerrar calendario | Subir la cinta | |
| Niveles del calendario | Migas escritas a mano en el título | "2026 › Septiembre › 27", cada parte tocable |
| Atrás del sistema | Sube un nivel | Ficha → mes → año → cerrar calendario |
| Fuente | Excalifont | Decidida viendo la app implementada |

## Valores por defecto (decididos sin preguntar — revisables)

| Tema | Por defecto |
|---|---|
| Mantra sin escribir | La página de mes nuevo permite "más tarde"; la cabecera muestra un placeholder tocable |
| Guardado | Autoguardado en todos los campos (sin botón "guardar") |
| Archivar hábito a mitad de mes | Su % se calcula hasta el día de archivo; deja de contar para el límite de 10 |
| Cambiar color de un hábito | Se aplica también al historial |
| Tema oscuro | No en v1 (la metáfora es papel) |
| Días futuros | Visibles en gris en calendario/cuadrícula, no interactivos |
| Primer uso | Login → página de mes nuevo (mantra + crear primeros hábitos) |
| Escala de color del ánimo | Verde → amarillo → rojo con diferencia de luminosidad (apta para daltonismo rojo-verde) |
