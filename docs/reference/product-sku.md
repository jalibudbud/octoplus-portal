# Product SKU

Octo+ SKU repository. The `I_SKU` filename prefix identifies this format.
Unlike the metadata (`INT01`) format, rows carry an explicit action column
(`TYPE_MOUVEMENT`), so the same file format is used to create, modify and
delete SKUs.

Accepted sample (in `samples/`): `I_SKU_VIAWORKFLOW_1782212471299.csv`
(419 rows, all `M`, bikes — SKU-level traceability, one row per barcode).

## Fields

32 columns, in file order. Required: only `TYPE_MOUVEMENT`, `CODE_ARTICLE`
and `MAIN_EAN`. The "In sample" column shows which columns were populated in
the accepted sample (419/419 rows or 0).

| # | OCTO+ column name | Description | Value | Type | Required | In sample |
|---|---|---|---|---|---|---|
| 1 | `TYPE_MOUVEMENT` | action to perform when imported to Octo+ | `enums.TYPE_MOUVEMENT` | string | yes | all |
| 2 | `CODE_ARTICLE` | SKU code (free text) | | string | yes | all |
| 3 | `MAIN_EAN` | SKU barcode — unique; a `CODE_PRODUCT` can have multiple barcodes | | string | yes | all |
| 4 | `CODE_PRODUCT` | Product code | | string | no | all |
| 5 | `SHORT_LABEL` | Short description (limited space on screen) | | string | no | all |
| 6 | `LONG_LABEL` | Full description | | string | no | empty |
| 7 | `CODE_SEASON` | Collection / season code | | string | no | empty |
| 8 | `CODE_SUPPLIER` | Supplier code | → metadata `FOURNISSEUR` | string | no | empty |
| 9 | `CODE_FAMILY` | Product category code | → metadata `FAMILLE` | string | no | all |
| 10 | `CODE_NGP` | *(unknown)* | | string | no | empty |
| 11 | `CODE_COLOR` | Color code (Blue, Red, etc…) | → metadata `COULEUR` | string | no | empty |
| 12 | `CODE_SIZE` | Size code (S, M, L, etc…) | → metadata `TAILLE` | string | no | empty |
| 13 | `PRIMARY_TYPE_TAG` | Main tag (main RFID tag type) | | string | no | all (`Multi`) |
| 14 | `SECONDARY_TYPE_TAG` | Secondary tag (swing ticket, sticker, etc…) | | string | no | all (`Multi`) |
| 15 | `SELLING_PRICE` | | | decimal | no | all |
| 16 | `BUYING_PRICE` | | | decimal | no | all |
| 17 | `URL_PICTURE` | Link to the picture of the SKU | | string | no | empty |
| 18 | `TRACEABILITY_MODE` | `0` or `SKU` = manage at the barcode level | | string | no | empty |
| 19 | `SUPPLIER_REF` | | | string | no | empty |
| 20 | `END_PRODUCT` | | | string | no | empty |
| 21 | `QUANTITY` | | | string | no | empty |
| 22 | `UNIT` | | | string | no | empty |
| 23 | `FIDELITY_PRICE` | | | string | no | empty |
| 24 | `USERFIELD_1` | free user field | | string | no | empty |
| 25 | `USERFIELD_2` | free user field | | string | no | empty |
| 26 | `USERFIELD_3` | free user field | | string | no | empty |
| 27 | `USERFIELD_4` | free user field | | string | no | empty |
| 28 | `USERFIELD_5` | free user field | | string | no | all |
| 29 | `CODE_BRAND` | | | string | no | empty |
| 30 | `PRICE_COMPARISON_UNIT` | | | string | no | empty |
| 31 | `PRICE_COMPARISON_DIVIDER` | | | string | no | empty |
| 32 | `RANK` | | | string | no | empty |

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

- `CODE_ARTICLE` is free text as far as Octo+ is concerned. The
  `[CODE_PRODUCT][<ref>]` composite seen in the sample (with `<ref>`
  duplicated into `USERFIELD_5`) is **our own convention** for handling
  serialized products — an option, not a rule.
- `MAIN_EAN` is unique across all rows: one row per physical barcode, and a
  `CODE_PRODUCT` can have multiple barcodes.
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

1. Allowed values for `PRIMARY_TYPE_TAG` / `SECONDARY_TYPE_TAG` (only
   `Multi` seen).
2. Semantics of `CODE_NGP`, `END_PRODUCT`, `QUANTITY`/`UNIT`,
   `PRICE_COMPARISON_*`, `RANK`.
3. `TRACEABILITY_MODE` exact accepted values (`0` / `SKU`?) and default when
   empty.

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
