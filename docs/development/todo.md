# Development TODO

Working task list (source: `docs/project-plan.md` §10). Completed items move
to `release-todo.md`.

## Phase 0

- [ ] Provision France relay VM; submit its IP for whitelisting
- [ ] Encoding round-trip test (é, è, à, ç, œ) against a test instance —
      UTF-8 bytes already accepted in a real file (`Kärcher FZE`, see
      `docs/reference/metadata.md`), but label display inside Octo+ is
      still unverified
- [ ] Team stack decision (Node/NestJS vs Python/FastAPI)

## Phase 1 — Frontend POC (started 2026-07-16)

**Goal:** an interface where users can perform the mapping — create an
Octo+ file without knowing the French format.

**Stack (decided 2026-07-16):** Vite + React Router (SPA) + TypeScript,
shadcn/ui + Tailwind. No data-caching layer — the app is interactive;
at most cache some config.

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

## Backend

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
