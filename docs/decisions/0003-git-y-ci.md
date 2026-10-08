# 0003 — Git, ramas y CI

**Estado:** aceptada

## Contexto

Trabajo solo, pero quiero que `main` esté siempre estable y que nada se mergee sin pasar los tests. Gitflow completo (con ramas `release/*`) es demasiado ceremonioso para una sola persona.

## Decisión

- **Gitflow liviano:**
  - `main`: estable. Solo recibe merges desde `develop` (o `hotfix/*`), cada uno con un tag `vX.Y.Z`.
  - `develop`: integración.
  - `feature/NNN-nombre`: una rama por spec, con PR hacia `develop`. Para cambios chicos fuera de una spec (docs, CI, mantenimiento): `feature/nombre-corto`.
  - `hotfix/*`: solo si hace falta corregir algo en `main`. Se mergea a `main` y a `develop`.
- **Merges siempre con merge commit**, tanto `feature/*` → `develop` como `develop` → `main`. El repo tiene desactivados "Squash and merge" y "Rebase and merge". Las ramas `feature/*` se borran después del merge; `develop` nunca (por eso `delete_branch_on_merge` queda desactivado).
- **Commits** en inglés con Conventional Commits (`feat`, `fix`, `docs`, `chore`, `ci`, `test`, `refactor`), uno por tarea de la spec.
- **CI con GitHub Actions:** en cada PR y push a `develop` y `main` corre `lint`, `typecheck`, `test` y `build`.
- **Tests solo con Vitest.** Qué test va en cada capa y la cobertura mínima: ver `0004-testing.md`. El job `db` del CI corre los tests contra Supabase local.
- **Repo público** en GitHub, porque la protección de ramas en el plan gratis solo funciona en repos públicos. `main` y `develop` exigen PR y el check de CI en verde.

## Consecuencias

- El repo no contiene datos ni claves; los datos viven en Supabase, protegidos por Auth y RLS. La anon/publishable key es pública por diseño y la seguridad depende de RLS y de tener desactivado el registro público.
- El CI no necesita credenciales de Supabase porque los tests no usan red.
- Si más adelante hace falta probar RLS de verdad, se suma Supabase local (Docker) al CI.
- Con merge commits se conserva un commit por tarea: se puede revertir una tarea puntual, usar `git bisect` y ver cuándo entró cada cosa. Squash solo convendría con commits desprolijos, que la convención de un commit por tarea evita.
- Un squash de `develop` → `main` desconecta los historiales: los commits de `develop` dejan de figurar en `main` y la release siguiente muestra cambios que ya estaban (pasó con la release v0.1.0, PR #2, y se corrigió con un merge commit en el #3). Por eso squash está desactivado para todo el repo, sin excepciones por rama.
