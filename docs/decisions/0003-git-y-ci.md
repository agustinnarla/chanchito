# 0003 — Git, ramas y CI

**Estado:** aceptada

## Contexto

Trabajo solo, pero quiero que `main` esté siempre estable y que nada se mergee sin pasar los tests. Gitflow completo (con ramas `release/*`) es demasiado ceremonioso para una sola persona.

## Decisión

- **Gitflow liviano:**
  - `main`: estable. Solo recibe merges desde `develop` (o `hotfix/*`), cada uno con un tag `vX.Y.Z`.
  - `develop`: integración.
  - `feature/NNN-nombre`: una rama por spec, con PR hacia `develop`.
  - `hotfix/*`: solo si hace falta corregir algo en `main`. Se mergea a `main` y a `develop`.
- **Commits** en inglés con Conventional Commits (`feat`, `fix`, `docs`, `chore`, `ci`, `test`, `refactor`), uno por tarea de la spec.
- **CI con GitHub Actions:** en cada PR y push a `develop` y `main` corre `lint`, `typecheck`, `test` y `build`.
- **Tests solo con Vitest:** unitarios en `packages/core` y de componentes en `apps/web` (jsdom + Testing Library, con Supabase mockeado). Sin tests en navegador por ahora.
- **Repo público** en GitHub, porque la protección de ramas en el plan gratis solo funciona en repos públicos. `main` y `develop` exigen PR y el check de CI en verde.

## Consecuencias

- El repo no contiene datos ni claves; los datos viven en Supabase, protegidos por Auth y RLS. La anon/publishable key es pública por diseño y la seguridad depende de RLS y de tener desactivado el registro público.
- El CI no necesita credenciales de Supabase porque los tests no usan red.
- Si más adelante hace falta probar RLS de verdad, se suma Supabase local (Docker) al CI.
