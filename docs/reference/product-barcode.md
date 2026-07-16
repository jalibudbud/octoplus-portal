# Product barcode

Octo+ barcode repository. The `I_CAB` filename prefix identifies this format.
Attaches barcodes to existing SKUs — one row per barcode; a `CODE_ARTICLE`
can have multiple barcodes.

Accepted sample (in `samples/`): `I_CAB_30024_21789_202606111312.csv`
(4,134 rows, all `M`).

## Fields

4 columns, in file order.

| # | OCTO+ column name | Description | Value | Type | Required | In sample |
|---|---|---|---|---|---|---|
| 1 | `TYPE_MOUVEMENT` | action to perform when imported to Octo+ | `enums.TYPE_MOUVEMENT` (see `product-sku.md`: `C`/`M`/`S`) | string | yes | all (`M`) |
| 2 | `CODE_ARTICLE` | SKU code | → `I_SKU` `CODE_ARTICLE` | string | yes | all |
| 3 | `TYPE_BARCODE` | barcode type | | string | no | empty |
| 4 | `BARCODE` | the barcode value — unique | | string | yes | all |

`CODE_ARTICLE` is referential: the SKU must already exist on the target
instance (load order: SKU before barcode).

## Observations from the accepted sample

- `BARCODE` is unique across all rows; `CODE_ARTICLE` repeats — one SKU,
  many barcodes.
- Codes in this sample are plain numeric — no bracket convention.

## File-level format (verified against the accepted sample)

| Property | Value |
|---|---|
| Filename | `I_CAB_<free text>.csv` — only the `I_CAB_` prefix is significant (e.g. `I_CAB_30024_21789_202606111312.csv`) |
| Header row | yes |
| Separator | `;` |
| Quoting | none observed |
| Line endings | LF (`\n`); trailing newline **present** at EOF (unlike the `I_SKU`/`INT01` samples — Octo+ evidently accepts both) |
| Empty fields | consecutive separators (`;;`) |
| Encoding | sample is pure ASCII; UTF-8 assumed (see `metadata.md`) |

## Open questions

1. Allowed values for `TYPE_BARCODE` (always empty in the sample).
2. Is `BARCODE` required to be globally unique per instance, or only within
   a file?

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
