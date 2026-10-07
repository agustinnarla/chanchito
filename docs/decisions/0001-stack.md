# 0001 — Stack y estructura

**Estado:** aceptada

## Contexto

App de finanzas personales de un solo usuario. Primero web, después mobile. Quiero reutilizar la mayor cantidad de código posible entre ambas.

## Decisión

- Monorepo con pnpm workspaces.
- Web: Vite + React + TypeScript (conocido; Next.js no aporta mucho para una app privada sin SEO).
- Mobile (futuro): Expo / React Native.
- `packages/core` con la lógica de dominio y los esquemas Zod, sin dependencias de UI ni de Supabase, compartido entre web y mobile.
- Backend: Supabase (Postgres + Auth + RLS). Sin servidor propio mientras no haga falta.

## Consecuencias

- Los datos se sincronizan solos entre web y mobile porque viven en la nube.
- Sin modo offline en el MVP.
- Si la lógica crece (por ejemplo, cotizaciones automáticas), se puede sumar una Edge Function de Supabase.
