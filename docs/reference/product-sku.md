# Product SKU

Octo+ SKU repository. The `I_SKU` filename prefix identifies this format.
Unlike the metadata (`INT01`) format, rows carry an explicit action column
(`TYPE_MOUVEMENT`), so the same file format is used to create, modify and
delete SKUs.

Accepted sample (in `samples/`): `I_SKU_VIAWORKFLOW_1782212471299.csv`
(419 rows, all `M`, bikes — SKU-level traceability, one row per barcode).

## Fields

32 columns, in file order. Required-ness is **not yet confirmed** — the
"In sample" column shows which columns were populated in the accepted sample
(419/419 rows or 0).

| # | OCTO+ column name | Description | Value | Type | In sample |
|---|---|---|---|---|---|
| 1 | `TYPE_MOUVEMENT` | action to perform when imported to Octo+ | `enums.TYPE_MOUVEMENT` | string | all |
| 2 | `CODE_ARTICLE` | SKU code | | string | all |
| 3 | `MAIN_EAN` | SKU barcode | | string | all |
| 4 | `CODE_PRODUCT` | Product code | | string | all |
| 5 | `SHORT_LABEL` | Short description (limited space on screen) | | string | all |
| 6 | `LONG_LABEL` | Full description | | string | empty |
| 7 | `CODE_SEASON` | Collection / season code | | string | empty |
| 8 | `CODE_SUPPLIER` | Supplier code | → metadata `FOURNISSEUR` | string | empty |
| 9 | `CODE_FAMILY` | Product category code | → metadata `FAMILLE` | string | all |
| 10 | `CODE_NGP` | *(unknown)* | | string | empty |
| 11 | `CODE_COLOR` | Color code (Blue, Red, etc…) | → metadata `COULEUR` | string | empty |
| 12 | `CODE_SIZE` | Size code (S, M, L, etc…) | → metadata `TAILLE` | string | empty |
| 13 | `PRIMARY_TYPE_TAG` | Main tag (main RFID tag type) | | string | all (`Multi`) |
| 14 | `SECONDARY_TYPE_TAG` | Secondary tag (swing ticket, sticker, etc…) | | string | all (`Multi`) |
| 15 | `SELLING_PRICE` | | | decimal | all |
| 16 | `BUYING_PRICE` | | | decimal | all |
| 17 | `URL_PICTURE` | Link to the picture of the SKU | | string | empty |
| 18 | `TRACEABILITY_MODE` | `0` or `SKU` = manage at the barcode level | | string | empty |
| 19 | `SUPPLIER_REF` | | | string | empty |
| 20 | `END_PRODUCT` | | | string | empty |
| 21 | `QUANTITY` | | | string | empty |
| 22 | `UNIT` | | | string | empty |
| 23 | `FIDELITY_PRICE` | | | string | empty |
| 24 | `USERFIELD_1` | free user field | | string | empty |
| 25 | `USERFIELD_2` | free user field | | string | empty |
| 26 | `USERFIELD_3` | free user field | | string | empty |
| 27 | `USERFIELD_4` | free user field | | string | empty |
| 28 | `USERFIELD_5` | free user field | | string | all |
| 29 | `CODE_BRAND` | | | string | empty |
| 30 | `PRICE_COMPARISON_UNIT` | | | string | empty |
| 31 | `PRICE_COMPARISON_DIVIDER` | | | string | empty |
| 32 | `RANK` | | | string | empty |

Columns marked `→ metadata …` are referential: they must match a
`CODE_ATTRIBUT` of that `TYPE_ATTRIBUT` already delivered to the same
instance via the `INT01` metadata format (load order: metadata before SKU).

## Enums

### TYPE_MOUVEMENT

| Value | Description |
|---|---|
| `C` | create |
| `M` | modify |
| `S` | delete |

## Observations from the accepted sample

Patterns that hold on every row of the sample — customer convention vs
Octo+ rule not yet confirmed:

- `CODE_ARTICLE` is a composite: `[CODE_PRODUCT][<ref>]`, where `<ref>` is
  also written to `USERFIELD_5` (e.g.
  `[7615523507993][SJM04AA0M23090124A]`).
- `MAIN_EAN` is unique across all rows (one row per physical barcode);
  `CODE_PRODUCT` repeats across rows of the same product.
- Prices use **dot** as decimal separator, 2–4 decimal places seen
  (`1237.63`, `1497.9043`). Comma-decimal behavior unknown — emit dot.
- `CODE_FAMILY` values (`Mountain Bike`) are `FAMILLE` codes, confirming the
  referential link to the metadata repository.

## File-level format (verified against the accepted sample)

| Property | Value |
|---|---|
| Filename | `I_SKU_<free text>.csv` — only the `I_SKU_` prefix is significant; the rest is ours for uniqueness (e.g. `I_SKU_VIAWORKFLOW_1782212471299.csv`) |
| Header row | yes |
| Separator | `;` |
| Quoting | none observed. ⚠️ Behavior when a value contains `;` unknown — validate/reject until confirmed |
| Line endings | LF (`\n`); **no trailing newline at EOF** |
| Empty optional fields | consecutive separators (`;;`), including trailing `;` |
| Encoding | sample is pure ASCII; UTF-8 assumed (accepted for `INT01`, see `metadata.md`) |

## Open questions

1. Which columns does Octo+ actually require? (Sample suggests at minimum
   `TYPE_MOUVEMENT`, `CODE_ARTICLE`, `MAIN_EAN`, `CODE_PRODUCT`,
   `SHORT_LABEL`, `CODE_FAMILY`, tag types and prices — unconfirmed.)
2. Allowed values for `PRIMARY_TYPE_TAG` / `SECONDARY_TYPE_TAG` (only
   `Multi` seen).
3. Semantics of `CODE_NGP`, `END_PRODUCT`, `QUANTITY`/`UNIT`,
   `PRICE_COMPARISON_*`, `RANK`.
4. Is the `[CODE_PRODUCT][ref]` shape of `CODE_ARTICLE` an Octo+ rule or a
   customer convention?
5. `TRACEABILITY_MODE` exact accepted values (`0` / `SKU`?) and default when
   empty.

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
