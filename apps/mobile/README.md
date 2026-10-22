# Chanchito para Android

App Expo (SDK 58) con Expo Router. Ver la spec 014 y el ADR 0005.

## Desarrollo

1. Copiar `.env.example` a `.env.local` y completar la URL y la anon key de Supabase (las mismas que `apps/web/.env.local`).
2. `pnpm dev:mobile` desde la raíz del repo.
3. Abrir **Expo Go** en el celular y escanear el QR. Expo Go tiene que ser de la SDK 58: si dice "Project is incompatible with this version of Expo Go", actualizarlo desde Play Store o desde expo.dev/go eligiendo SDK 58.

Las pantallas van en `src/features` y las rutas de `src/app` solo las reexportan: Expo Router empaqueta todo lo que está en `src/app`, incluidos los tests.

## Tests

`pnpm test` (Jest con `jest-expo`). Todos los tests usan datos falsos en memoria (`jest.setup.ts`): nunca llegan a Supabase.

## Generar el APK

El proyecto está en EAS como `@aarla.dev/chanchito`. Las variables de entorno del perfil `preview` están cargadas en EAS (`npx eas-cli env:list --environment preview`), nunca en el repo.

```sh
cd apps/mobile
npx eas-cli@latest login            # una vez; sin terminal interactiva: login --device --non-interactive
npx eas-cli@latest build --platform android --profile preview
```

Al terminar, EAS muestra un link y un QR para descargar el APK. En el celular: abrir el link, descargar e instalar (Android pide permitir instalar apps de esa fuente). Para actualizar, se instala el APK nuevo encima: se mantienen los datos y la sesión porque la firma es la misma (la guarda EAS).

## Íconos

- `assets/icon.png`, `assets/adaptive-icon.png` y `assets/adaptive-icon-monochrome.png`: el chanchito de Fluent Emoji 3D (Microsoft, MIT) sobre el fondo oscuro de la app.
- Íconos de la interfaz (Material Symbols Rounded): agregar el nombre en `scripts/build-icons.mjs` y correr `pnpm --filter @chanchito/mobile icons`.
