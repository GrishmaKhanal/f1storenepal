# Releasing

## Branches

- Work happens on `develop` (or a feature branch off it).
- `main` is production. Merging to `main` deploys.
- Never push straight to `main`.

## The loop

```sh
git switch develop
# …change code…
npm run lint && npm run typecheck && npm test
npm run build              # optional locally: catches build-only errors
git commit -am "…" && git push
# open a PR develop → main, check the preview deployment, merge
```

## Preview deployments

Vercel builds every push to a non-production branch as a preview URL.

- Previews **don't migrate** (no `RUN_MIGRATIONS`), so a branch with a schema change will fail against the production schema until merged. Give previews their own database for that (a Neon branch per preview, via the Neon integration) and set `RUN_MIGRATIONS=true` only there.
- Previews share the production bucket unless you set different `S3_*` values for the Preview environment. Uploads from a preview are real files; prefer testing uploads locally.
- Set a different `ADMIN_PATH`/password for previews if you share preview links.

## Schema changes

Follow [../database/migrations.md](../database/migrations.md): additive first, commit schema and SQL together. The production build applies them before the new code goes live.

## Rollback

- **Code:** Vercel → Deployments → pick the last good one → **Promote to Production** (or `git revert` and push).
- **Database:** migrations don't auto-reverse. Write a new migration that undoes the change, or restore from a Neon branch/point-in-time restore. This is why destructive changes are split into steps.
- **Content mistakes:** fix them in the admin; they're live on save.
