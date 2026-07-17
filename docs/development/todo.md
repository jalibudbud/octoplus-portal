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

Done so far is in `release-todo.md` (schema-driven form, FR CSV preview,
CSV import core flow, portal API scaffold). Remaining to close Phase 1:

- [ ] Repository picker — add the missing INT01 split entries: **Color**
      and **Size**. The registry factory already supports them
      (`makeInt01Fields({ lockedType: 'COULEUR' | 'TAILLE' })` in
      `frontend/src/lib/schema/int01.ts`); needs two entries + slugs in
      `frontend/src/lib/schema/repos.ts` and two cards in
      `frontend/src/pages/Home.tsx`
- [ ] Validation of entered/imported data (plan §5.3): field level
      (required, type, length, enum) and set level (duplicate keys within
      a file) — applies to both manual rows and mapped CSV imports
- [ ] CSV escaping & edge cases (plan §5.3) — **silent-corruption risk**:
      `parseCSVLine` is a naive `split(delimiter)` and `serializeCSV`
      doesn't quote/escape `;` inside values
      (`frontend/src/lib/file-reader.ts`); also decimal separator,
      date format, boolean encoding

### Backend

Stack decided 2026-07-17: **Node/NestJS** portal API (see
`docs/project-plan.md` §6 and `release-todo.md`).

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
      - Note: portal API stack is decided (NestJS); Go remains the
        candidate for transform compute (e.g. Lambda) per plan §6

## Future improvements

- [ ] Entra ID app registration (SSO)
