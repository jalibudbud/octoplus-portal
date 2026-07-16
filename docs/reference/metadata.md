# Metadata

Octo+ metadata/attribute repositories. All of them share the **same file
format** (the fields below); they differ only in which `TYPE_ATTRIBUT` values
they carry. The `INT01` filename prefix identifies this format; the
repository/domain of each row is given by its `TYPE_ATTRIBUT` value.

Accepted samples (in `samples/`):

- `INT01_VIAWORKFLOW_1784188826437.csv` — product categories
- `INT01_SUPPLIER_VIAWORKFLOW_1784156419852.csv` — suppliers
- `INT01_Store_1784156423456.csv` — stores (3 levels)

## Fields

| OCTO+ column name | Description | Value | Type | Max length | Required |
|---|---|---|---|---|---|
| `TYPE_ATTRIBUT` | metadata type | `enums.TYPES` | string | 100 | yes |
| `CODE_ATTRIBUT` | metadata code | | string | 100 | yes |
| `LIBELLE_ATTRIBUT` | metadata label | | string | 100 | yes |
| `TYPE_ATTRIBUT_PARENT` | metadata parent type | `enums.TYPES` | string | 100 | no¹ |
| `CODE_ATTRIBUT_PARENT` | metadata parent code | | string | 100 | no¹ |

¹ Parent fields are all-or-nothing: a child row must fill `TYPE_ATTRIBUT_PARENT`
and `CODE_ATTRIBUT_PARENT` together (they identify the parent record); a root
row (e.g. `GROUPE`, `Store`) leaves both empty.

Max lengths are not documented by Octo+ — 100 is our own defensive default.

### Key / identity rules

- `CODE_ATTRIBUT` is unique per `TYPE_ATTRIBUT`.
- The same code may exist under different types (e.g. the category sample has
  both `GROUPE;wolfis` and `RAYON;wolfis`) — the key is TYPE + CODE.
- Codes are free text, not just numeric: accepted samples include codes with
  spaces, punctuation, and even company names as codes
  (`1two1 GmbH & Co KG ( Eclipse )`).

## Enums

### TYPES

Values are **literal and case-sensitive** — the mixed French-uppercase /
English-mixed-case is exactly what Octo+ expects, not a typo.

| Value | Description |
|---|---|
| `GROUPE` | product category level 1 in the hierarchy |
| `RAYON` | product category level 2 in the hierarchy |
| `FAMILLE` | product category level 3 in the hierarchy |
| `COULEUR` | Color |
| `TAILLE` | Size |
| `FOURNISSEUR` | Supplier |
| `Store` | Store location - parent |
| `Store_level_2` | Store storage - storage sub location |
| `Store_level_3` | Store area - area sub location |

## Repository list

All metadata repositories share the `INT01` file format. The repository is
implied by `TYPE_ATTRIBUT`, not by the filename.

| Name | TYPE_ATTRIBUT values | Root/parent |
|---|---|---|
| Product categories | `GROUPE` → `RAYON` → `FAMILLE` | `GROUPE` is root |
| Product color | `COULEUR` | flat |
| Product size | `TAILLE` | flat |
| Supplier | `FOURNISSEUR` | flat |
| Store | `Store` → `Store_level_2` → `Store_level_3` | `Store` is root |

## File-level format (verified against the accepted samples)

| Property | Value |
|---|---|
| Filename | `INT01_<free text>.csv` — only the `INT01_` prefix is significant; the rest is ours, used to make files unique/identifiable (e.g. `INT01_SUPPLIER_VIAWORKFLOW_1784156419852.csv`) |
| Header row | yes, French column names |
| Separator | `;` |
| Quoting | none — values contain `&`, `'`, `:`, `/`, `(`, `)`, spaces unquoted. ⚠️ Behavior when a value contains `;` is unknown — validate/reject `;` in values until confirmed |
| Line endings | LF (`\n`); **no trailing newline at EOF** in accepted samples |
| Empty optional fields | consecutive separators (`;;`), including trailing `;` at end of line |
| Encoding | UTF-8 — an accepted supplier file contains `Kärcher FZE` as UTF-8 bytes. Full round-trip (label display inside Octo+) still worth confirming in Phase 0 |
| Whitespace | leading/trailing spaces inside values occur in accepted files and are apparently preserved (e.g. `IQ Fullfilment ` with trailing space). ⚠️ Risky for matching/joins — the app should trim on input, or at minimum warn |
| Row order | parents appear before children (declare `GROUPE` before its `RAYON`s, etc.) |

## SFTP delivery

- Default remote landing path: `/share/in`. Same folder structure across
  repositories — path per repository is a **configuration value with this
  default**, never hardcoded.
- **Upload protocol:** Octo+ consumes files as soon as they appear — even
  mid-upload. So upload as `uploading_<final name>` (e.g.
  `uploading_INT01_20260618_1781765522294.csv`), then rename to the final
  name once the transfer completes. Octo+ ignores files not matching the
  repository prefix.
