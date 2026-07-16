# TransformFile — Implementation Reference

## Purpose

The `TransformFile` page lets a user generate a valid Octo+ CSV file from
either a manual form or an uploaded source file, without knowing the French
column format. It is the first interactive feature of the portal and serves
as the Phase 1 POC.

---

## Feature Overview

**Route:** `/transform/:repo` (`:repo` is one of the slugs below)

**Entry point:** repo cards on the Home page navigate here.

**Two data-entry modes:**

| Mode | Description |
|------|-------------|
| Manual entry | Dynamic form driven by the repo schema. User fills one row at a time and clicks "Add row". |
| File upload | User uploads any CSV/TSV. The app reads only the header row, lets the user map source columns to Octo+ columns, then streams the full file and shows a preview. |

**Always visible:** a Schema Viewer panel listing every expected Octo+ column
for the selected repo (name, type, required, notes).

---

## File and Directory Layout

```
frontend/src/
├── lib/
│   ├── schema/
│   │   ├── types.ts        — FieldDef, RepoSchema, RepoSlug, RepoKind types
│   │   ├── int01.ts        — makeInt01Fields() factory for INT01 repos
│   │   ├── repos.ts        — all 8 RepoSchema objects + REPO_SCHEMAS map
│   │   └── index.ts        — re-exports
│   └── file-reader.ts      — browser file streaming library
├── pages/
│   └── TransformFile.tsx   — page component
└── components/
    └── transform/
        ├── SchemaViewer.tsx
        ├── ManualForm.tsx
        ├── FieldInput.tsx
        ├── RowsTable.tsx
        ├── FileUpload.tsx
        ├── ColumnMapper.tsx
        └── DataPreview.tsx
```

shadcn components added: `select`, `table`, `badge`, `input`, `label`, `tabs`

---

## Schema Layer

### Type definitions (`types.ts`)

```ts
type FieldType = 'string' | 'integer' | 'decimal' | 'date' | 'boolean' | 'enum'

interface EnumOption { value: string; label: string }

interface FieldDef {
  name: string           // exact Octo+ column name (used as CSV header)
  label: string          // English display label for forms
  type: FieldType
  required: boolean
  maxLength?: number
  enumOptions?: EnumOption[]
  locked?: string        // field is pre-filled and read-only
  defaultValue?: string  // form pre-fill, user can change
  notes?: string         // shown in schema viewer and form hint
}

type RepoSlug =
  | 'category' | 'sku' | 'barcode' | 'suppliers'
  | 'stores' | 'stock' | 'delivery-notice' | 'bulk-printing'

type RepoKind = 'master' | 'transactional'

interface RepoSchema {
  slug: RepoSlug
  name: string
  filePrefix: string   // e.g. 'INT01', 'I_SKU' — used in filename
  kind: RepoKind
  delimiter: ';'
  fields: FieldDef[]
}
```

No TypeScript `enum` keyword anywhere (violates `erasableSyntaxOnly`). Use
string literal unions and `as const` arrays.

### INT01 factory (`int01.ts`)

Five logical repos (Category, Color, Size, Suppliers, Stores) share the same
physical INT01 format. `makeInt01Fields()` returns the 5-field array with
`TYPE_ATTRIBUT` handled differently per logical repo:

| Logical repo | TYPE_ATTRIBUT handling |
|---|---|
| Category | Constrained to `GROUPE \| RAYON \| FAMILLE` — user selects |
| Stores | Constrained to `Store \| Store_level_2 \| Store_level_3` — user selects |
| Suppliers | Locked to `FOURNISSEUR` — read-only, auto-filled |
| Color | Locked to `COULEUR` — read-only, auto-filled |
| Size | Locked to `TAILLE` — read-only, auto-filled |

Signature:
```ts
makeInt01Fields(options?: {
  lockedType?: string      // lock TYPE_ATTRIBUT to this value
  allowedTypes?: string[]  // constrain enum to these values only
}): FieldDef[]
```

### Repo schemas (`repos.ts`)

Key field decisions per repo:

**I_SKU (32 fields)**
- `TYPE_MOUVEMENT`: enum `C/M/S`, required
- `CODE_ARTICLE`, `MAIN_EAN`: required
- Prices use dot decimal separator
- All other fields optional

**I_CAB / Barcode (4 fields)**
- `TYPE_MOUVEMENT`, `CODE_ARTICLE`, `BARCODE`: required
- `TYPE_BARCODE`: optional

**INT04 / Stock (4 fields)**
- Column is `TYPE_MOVEMENT` (English spelling — different from `TYPE_MOUVEMENT` in other repos)
- Default `TYPE_MOVEMENT` = `M`
- `SKU`, `LOCATION`, `EXPECTED_QUANTITY`: all required

**I_DSU / Delivery notice (16 fields)**
- `USER_REASON`: default `PO`
- `IS_OVERSUPPLY`: default `0`
- `PARCEL_QUANTITY`: default `1`
- `STATUS`: default `to_check`
- `DELIVERY_AREA`, `PALLET`: locked to `""` (never used)
- `DELIVERY_DATE`: type `date`, format `YYYYMMDD`
- Multiple lines per document grouped by `EXTERNAL_DOC_REFERENCE`

**INT05 / Bulk printing (7 fields)**
- `TYPE_DOCUMENT`: locked to `print_query_warehouse`
- `LOC_DEST`: locked to `""` (not used)
- `QTE_STOCK`: integer, minimum 1

---

## File Reader Library (`file-reader.ts`)

Provides browser-native streaming utilities. Zero external dependencies.

### API

```ts
// Detect the delimiter in the first line of a CSV sample.
// Checks for ';' first (all Octo+ files use ';'); falls back to ','.
detectDelimiter(sample: string): ';' | ','

// Split a single CSV line on the given delimiter.
// Does not handle quoted fields — Octo+ files never quote values.
parseCSVLine(line: string, delimiter: ';' | ','): string[]

// Read only the header row of a File using File.slice(0, 2048).
// Returns column names and detected delimiter.
// Throws if no newline found in the first 2048 bytes.
readHeader(file: File): Promise<{ columns: string[]; delimiter: ';' | ',' }>

// Mapping from Octo+ field name → source column name (or null = skip).
type ColumnMapping = Record<string, string | null>

// Stream the full file line by line, apply the column mapping, yield
// one string[] per data row (in Octo+ field order).
// Use options.maxRows to stop early (preview mode passes 5).
streamRows(
  file: File,
  sourceColumns: string[],
  targetFields: FieldDef[],
  mapping: ColumnMapping,
  options?: { maxRows?: number }
): AsyncGenerator<string[]>

// Serialize rows to a ';'-delimited CSV string (LF line endings, no BOM).
// First row is the header (field names).
serializeCSV(fields: FieldDef[], rows: string[][]): string
```

### Implementation notes

**Header reading:** `file.slice(0, 2048).text()` — 2048 bytes safely covers
the longest possible header row (I_SKU at 32 columns ≈ 570 chars). The
`Blob.prototype.text()` method is baseline since 2020.

**Full-file streaming:** `file.stream()` → `pipeThrough(new TextDecoderStream('utf-8'))`.
For each data line, look up each target field's source column index and yield
the mapped values. The `maxRows` option lets the preview component stop after
5 rows without reading the whole file.

**Delimiter detection:** Count `;` occurrences in the first line. If > 0,
return `';'`; else `','`. Edge case: if a source file header contains `;` in
a column name, it will be misidentified — this is unlikely but worth noting.

**No quoting support:** Octo+ files never quote values. If a source file has
quoted fields containing the delimiter, mapping may break. A warning should
be shown if a parsed field count doesn't match the expected column count.

---

## Column Mapping Flow

```
User uploads file
       │
       ▼
readHeader(file)
       │
       ├─ columns: ['Order ID', 'Item Code', 'Qty', ...]
       └─ delimiter: ';'
       │
       ▼
ColumnMapper rendered
  - Left: Octo+ field name (required badge)
  - Right: <Select> with source column names + "— skip —"
       │
User maps columns, clicks Confirm
       │
       ▼
streamRows(file, sourceColumns, schema.fields, mapping, { maxRows: 5 })
       │
       ▼
DataPreview shows first 5 rows
       │
User clicks "Download CSV"
       │
       ▼
streamRows(...) — no maxRows limit — collect all rows
serializeCSV(schema.fields, allRows) → Blob → <a download>
```

---

## Page Layout

```
← Octo+ Portal
[Repo name]  [INT01 badge]  [master badge]

┌─────────────────────────────────┬──────────────────┐
│  Tabs: Manual entry | File upload│  Schema Viewer   │
│  ───────────────────────────────│  (sticky aside)  │
│  [ManualForm or FileUpload]     │  Columns table:  │
│                                 │  Field / Type /  │
│  [RowsTable or ColumnMapper     │  Req / Notes     │
│   + DataPreview]                │                  │
│                                 │                  │
│  [Download CSV button]          │                  │
└─────────────────────────────────┴──────────────────┘
```

Two-column grid (`grid-cols-[1fr_360px]`). Collapses to single column on
mobile (internal tool, desktop-first).

---

## Component Props

```ts
// Always-visible column reference table (sticky aside)
SchemaViewer: { schema: RepoSchema }

// Mode A — dynamic form, one row at a time
ManualForm: {
  schema: RepoSchema
  currentRow: Record<string, string>
  onFieldChange: (name: string, value: string) => void
  onAddRow: () => void
}

// Single field: locked → disabled input; enum → Select; else → Input
FieldInput: {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}

// Scrollable table of accumulated rows with per-row delete
RowsTable: {
  schema: RepoSchema
  rows: string[][]
  onDeleteRow: (index: number) => void
}

// File picker; on select reads header and fires callback
FileUpload: {
  onFileSelected: (file: File, columns: string[], delimiter: ';' | ',') => void
}

// Two-column mapping table: Octo+ field → source column dropdown
ColumnMapper: {
  schema: RepoSchema
  sourceColumns: string[]
  mapping: ColumnMapping
  onMappingChange: (fieldName: string, sourceColumn: string | null) => void
  onConfirm: () => void
}

// First 5 streamed rows after mapping + optional streaming indicator
DataPreview: {
  schema: RepoSchema
  rows: string[][]
  isStreaming: boolean
}
```

---

## Known Limitations (v1)

- **No quoted-field support** — source files with values containing the
  delimiter wrapped in quotes will parse incorrectly. Workaround: pre-clean
  source file before uploading.
- **Large-file memory** — the Download flow collects all rows in memory as
  `string[][]`. At ~500 bytes/row a 50k-row file uses ~25 MB; acceptable for
  v1 but would benefit from direct Blob streaming in future.
- **Single-row manual form** — the form adds one row at a time. Bulk paste
  or grid editing are out of scope for the POC.
- **No referential validation** — the app does not verify that a `CODE_FAMILY`
  value exists in a previously uploaded INT01 file. That requires a storage
  layer (Phase 2+).
- **Encoding unverified** — UTF-8 is assumed. The round-trip test for French
  characters (é, è, à, ç, œ) against a real Octo+ instance is a Phase 0 open
  item.
