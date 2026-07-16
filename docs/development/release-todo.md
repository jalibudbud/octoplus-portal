# Release TODO — completed & dropped

Items moved from `todo.md` / `docs/project-plan.md` §10 once resolved.

## Done

- [x] Frontend stack scaffolded *(2026-07-16)* — `./frontend`: pnpm workspace
      (root `pnpm-workspace.yaml`), Vite 8 + React 19 + TypeScript 6 + React
      Router 8 (SPA/library mode via `createBrowserRouter`), shadcn/ui (Nova
      preset — IBM Plex Sans, zero-radius theme), Tailwind CSS 4 via
      `@tailwindcss/vite`, lucide-react; `@/` path alias wired in both
      `vite.config.ts` and `tsconfig.app.json`; Hello Octo+ Portal page at
      `src/pages/Home.tsx` with 8-repo grid as the boilerplate entry point

- [x] Share mapping spreadsheet + full prefix lookup table + accepted sample
      files *(2026-07-16)* — converted into per-repository format docs in
      `docs/reference/` (all 8 v1 repositories verified against accepted
      samples in `docs/reference/samples/`)
- [x] Request Octo+ test SFTP instance access *(2026-07-16)*

## Dropped

- ~~Ask Octo+: webhook schema/ETA + whitelisting model (global vs
  per-instance)~~ — not needed; handled internally
