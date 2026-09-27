# Mis hábitos — Habit Tracker

PWA con aspecto de bullet journal: hábitos diarios, estadísticas mensuales, estado de ánimo y calendario. Especificación en [DECISIONES.md](DECISIONES.md) y en el briefing.

## Arrancar en local

```bash
npm install
npm run dev
```

Sin configuración de Firebase la app funciona en **modo local**: los datos se guardan solo en ese navegador (`localStorage`).

## Conectar Firebase (login con Google + sincronización)

1. Crear un proyecto en la consola de Firebase y añadir una app **Web**.
2. Activar **Authentication → Google** y **Cloud Firestore**.
3. Copiar `.env.example` a `.env` y rellenar los valores de la app web.
4. Publicar las reglas de seguridad (cada persona solo accede a `users/{uid}/**`):

```bash
npx firebase-tools deploy --only firestore:rules
```

## Publicar

El `.env` tiene que existir antes del build: sin él, la versión publicada queda en modo local (sin login ni sincronización).

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Instalar en el móvil

- **Android (Chrome):** abrir la web → ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** abrir la web → *Compartir* → *Añadir a pantalla de inicio*. La app instalada no comparte sesión con Safari: se entra de nuevo dentro de ella.

Desde la pantalla de inicio el login con Google va por redirección (la ventana emergente no vuelve a la app). Para que Safari no bloquee la vuelta, la app debe abrirse desde el mismo dominio que `VITE_FIREBASE_AUTH_DOMAIN` (por defecto `<proyecto>.firebaseapp.com`): instálala desde esa dirección, no desde `<proyecto>.web.app`.

## Iconos

Generados a partir de `design/icono-cuaderno.png` (trazo en color tinta, fondo papel y cinta roja) en `public/icons/`: favicon 32 px, `apple-touch-icon` 180 px opaco para iOS y 192/512 px + versión *maskable* para Android.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests de dominio (fechas, %, rachas, ánimo) |
| `npm run typecheck` | Comprobación de tipos |
| `npm run build` | Build de producción + service worker |

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/domain` | Reglas puras: día lógico (corte 04:00), %, rachas, puntuación y color del ánimo |
| `src/data` | Repositorio de datos: `localRepo` (modo local) y `firebase` (Firestore offline) |
| `src/features` | Pantallas: Hábitos, Stats, Ánimo, calendario y página de mes nuevo |
| `src/ui` | Primitivas dibujadas con rough.js, hojas emergentes y editores |
