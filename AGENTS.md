# AGENTS.md

Context for coding agents working in this repository.

## What this is

Octo+ Data Portal — an internal web app that lets the team generate valid Octo+
(French RFID retail platform) CSV files and deliver them automatically, via an
SFTP relay, to the correct per-customer Octo+ instance. It replaces today's
manual process of hand-building CSVs against a mapping spreadsheet.

Full plan: `docs/project-plan.md`. Treat that file as the source of truth if
anything here goes stale; this file is a working summary of it.

## Current state

Pre-code / Phase 0 (discovery). Only planning docs exist so far — no
application code, no chosen repo layout.

- Frontend is decided: **Vite + React Router (SPA) + TypeScript, with
  shadcn/ui + Tailwind**. Plain SPA on purpose — interactive internal tool,
  no SSR/SEO, no server data caching (at most some config caching). Don't
  introduce Next.js/Remix or low-code builders (Retool was considered and
  rejected).
- API stack is **not** decided: Node/NestJS vs Python/FastAPI, to be picked in
  Phase 0 by team skills. Don't assume one without checking
  `docs/project-plan.md` §6 and `docs/development/todo.md` first.

## Non-negotiable constraints

- Octo+ has **no API** — SFTP/CSV is the only integration path, permanently.
- Exactly **1 Octo+ instance per customer** (contractual) — customer and
  instance config collapse into a single object.
- v1 is internal-team-only, not customer self-service.
- Not a general-purpose ETL tool; not a way to read data back out of Octo+.
- SFTP credentials live only in a secrets manager — never in DB, Git, or
  plaintext config.
- Delivery goes through a stateless relay VM in France (static,
  Octo+-whitelisted egress IP). The main app never talks to Octo+ SFTP
  directly.
- Auth is Entra ID (OIDC) — no other SSO.

## Target architecture

```
Schema Registry → Data Entry UI → Validation/Transformation → Storage → Delivery → (future) Webhook receiver
```

- **Schema Registry**: each Octo+ repository (Category, SKU, Barcode,
  Suppliers, Stores, Stock, Delivery notice, Bulk print) described as
  declarative, versioned data — FR/EN column mapping, filename prefix,
  dependencies. Not hardcoded per repository. Formats are documented per
  repository in `docs/reference/` against accepted sample files. (Pricing
  has its own Octo+ "price list" repository but is deferred — v1 uses the
  SKU file's `SELLING_PRICE`/`BUYING_PRICE`.)
- **Data Entry UI**: dynamic forms rendered from schema, grid/spreadsheet
  entry, CSV import with column mapping.
- **Validation/Transformation**: EN→FR field mapping, field/set/referential
  validation, CSV emit.
- **Storage**: S3-compatible object storage — the generated artifact and the
  structured source data (so it can be edited and regenerated).
- **Delivery**: queue → France relay → per-customer Octo+ SFTP, atomic
  upload (write `uploading_<name>`, rename — Octo+ consumes files even
  mid-upload), retries, status tracking.
- **Webhook receiver** (future, build the endpoint now, dormant until Octo+
  ships it): ingestion status callback.

Design principle: schema-driven everywhere. A new Octo+ repository, a format
change, a new filename prefix, or a new dependency should be a **config
change in the schema registry**, not a code release.

Load-order dependencies are enforced by the app (declared in the registry,
not hardcoded):
`Category → SKU → Barcode`; SKU before Stock-on-hand; Supplier + SKUs before
Delivery notice; SKUs + Store before Bulk printing.

## Things to watch out for when implementing

- Encoding is assumed UTF-8 but **unverified** — treat as an open risk until
  Phase 0's round-trip test (é, è, à, ç, œ) against a real Octo+ instance is
  confirmed. See `docs/project-plan.md` §5.3, §8.
- CSV transformation edge cases called out in the plan: `;` delimiter
  escaping, comma-vs-dot decimal separators, date/timezone formats, boolean
  encoding (`O`/`N` vs `1`/`0`), line endings, empty-vs-null.
- Filenames need repository-specific prefixes (e.g. `I_SKU`, `I_CAB`); most
  are still TBD — see plan §4.
- Two repository *kinds* need different UX/validation: master data
  (create/maintain reference data) vs transactional (must reference
  already-delivered master data for that instance).

## Where to look

- `docs/project-plan.md` — full plan: decisions locked, scope, architecture,
  delivery phases, risks, open items.
- `docs/development/todo.md` — dev task tracking (currently empty).
