# Development TODO

Working task list (source: `docs/project-plan.md` §10). Completed items move
to `release-todo.md`.

## Backlog

See `backlog.md` for items that are not yet in the working task list.

## Phase 1 — Frontend POC (started 2026-07-16)

### Frontend

**Goal:** an interface where users can perform the mapping — create an
Octo+ file without knowing the French format.

**Stack (scaffolded 2026-07-16):** `./frontend` — pnpm workspace, Vite 8,
React 19, React Router 8, TypeScript 6, shadcn/ui (Nova preset), Tailwind
CSS 4. Run: `cd frontend && pnpm dev`. No data-caching layer — the app is
interactive; at most cache some config.

Example flow:

1. User picks the file he wants to create. Source: the Octo+ repositories
   documented in `docs/reference/`. Metadata (`INT01`) is split into its
   individual items — Category, Color, Size, Supplier, Store — so the user
   picks e.g. "Category" directly and is never confused by the shared
   underlying format.
2. POC-level functionality only: a form where the user populates the
   values (grid/import/delivery come later).

Tasks:

- [ ] Repository picker — list entries from `docs/reference/` with
      metadata split per item (Category, Color, Size, Supplier, Store,
      SKU, Barcode, Stock on hand, Bulk printing, Delivery notice)
- [ ] Schema-driven form per repository: English labels/help text, required
      markers, enum dropdowns, defaults pre-filled (per the reference docs)
- [ ] Show the resulting Octo+ row(s)/CSV so the EN→FR mapping is visible
- [ ] CSV import with column mapping (started ahead of plan, 2026-07-17):
      upload a source file and map its columns to schema fields
      (`frontend/src/components/transform/ColumnMapper.tsx`). Enum fields
      don't map to a source column — the user picks one of the field's enum
      values, applied as a constant to every output row. Remaining:
      field/set validation of mapped values, delimiter/decimal edge cases

### Backend

Stack decided 2026-07-17: **Node/NestJS** portal API (see
`docs/project-plan.md` §6 and `release-todo.md`).

- [ ] Portal API scaffold (`backend/`, started 2026-07-17): NestJS modular
      monolith. This iteration: `StorageModule` (provider interface —
      S3 via SDK, local disk for dev; Azure Blob slot later) +
      `FilesModule` (`POST /api/files` multipart → storage). Webapp gets
      an "Upload to portal" action beside Download. No auth, no DB yet
- [ ] SFTP instance config CRUD (customer+instance object, plan §5.5) —
      next backend task; credentials go to a secrets manager, never DB
- [ ] Delivery queue (BullMQ) + France relay worker (NestJS) — later;
      relay is the second deployable
- [ ] Document the existing Go ETL project (`etl-utility`) **in that repo**,
      then reference it from this project's docs. It already implements the
      Octo+ file transformation we need to extract functionality from.
      - Repo: <https://github.com/moxalibudbud/etl-utility/tree/go>
        (local clone: `/Users/dev/dev/etl-utility`, branch `go`)
      - Everything funnels through one JSON-serializable `etl.Run(Config)` —
        designed to be driven from CLI, queue worker, cloud function, or
        in-process
      - `skuserial` implements the `[sku][serial]` bracket codec (the
        serialized-product convention in `docs/reference/product-sku.md`)
      - Repo self-documents in `ETL_CODE_REVIEW_AND_GO_DESIGN.md` and
        `MIGRATION_PROCESS.md`
      - Note: this puts **Go** in the backend stack conversation alongside
        Node/NestJS and Python/FastAPI (Phase 0 decision above)

## Future improvements

- [ ] Entra ID app registration (SSO)
