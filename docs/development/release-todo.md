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
- [x] Team stack decision *(2026-07-17)* — **Node/NestJS** for the portal
      API (BFF): team ships production NestJS + BullMQ + blob storage today.
      Modular monolith (storage / files / sftp-config / delivery modules);
      relay worker (NestJS) is the second deployable. No Lambda in the
      upload path; Go + Lambda reserved as a candidate for transform
      compute (`etl-utility`). Recorded in `docs/project-plan.md` §6

- [x] Schema-driven form per repository *(2026-07-17)* — `ManualForm` +
      `FieldInput` render entirely from the schema registry: English
      labels/help text, required markers, enum dropdowns, defaults
      pre-filled, locked fields shown as fixed
- [x] Show the resulting Octo+ row(s)/CSV *(2026-07-17)* — `RowsTable` /
      `DataPreview` render FR column headers, `SchemaViewer` shows the
      FR↔EN mapping, download emits the FR-format CSV
- [x] CSV import with column mapping — core flow *(2026-07-17)* — upload a
      source file, map columns to schema fields (`ColumnMapper`), preview,
      download. Enum fields pick a fixed enum value applied to every output
      row instead of mapping a column; fields with a `defaultValue` count
      as mapped. Remaining validation/escaping work tracked in `todo.md`
- [x] Portal API scaffold *(2026-07-17)* — `backend/`: NestJS modular
      monolith. `StorageModule` (`StorageProvider` interface; S3 via
      `@aws-sdk/lib-storage`, local-disk dev driver; Azure Blob slot later)
      + `FilesModule` (`POST /api/files` multipart → storage, key
      `{repo}/{timestamp}_{filename}`). Webapp "Upload to portal" button
      beside Download in both flows. No auth, no DB yet. Verified
      end-to-end against local driver + curl

## Dropped

- ~~Ask Octo+: webhook schema/ETA + whitelisting model (global vs
  per-instance)~~ — not needed; handled internally
