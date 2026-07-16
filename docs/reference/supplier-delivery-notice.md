# Supplier delivery notice

Octo+ supplier delivery notice repository. The `I_DSU` filename prefix
identifies this format. Announces incoming supplier deliveries: one row per
PO line, rows grouped into documents by `EXTERNAL_DOC_REFERENCE`. A single
file **may carry multiple documents** (several `EXTERNAL_DOC_REFERENCE`
values).

Accepted sample (in `samples/`): `I_DSU_PO-05087_1782376887790.csv`
(45 line rows for a single delivery document).

## Fields

16 columns, in file order. Note the column names are **English** in this
format (unlike `I_SKU`/`I_CAB`). "Required" values marked *default* are
mandatory columns the app fills with a fixed default rather than user input.

| # | OCTO+ column name | Description | Value | Type | Required | In sample |
|---|---|---|---|---|---|---|
| 1 | `EXTERNAL_DOC_REFERENCE` | main identifier of the document in the source PO system — same on every row of the document | | string | yes | all (UUID) |
| 2 | `EXTERNAL_ORDER_REFERENCE` | PO number reference | | string | yes | all (`PO-05087`) |
| 3 | `USER_REASON` | reason/type of the delivery | | string | yes — default `PO` | all (`PO`) |
| 4 | `CODE_SUPPLIER` | supplier code | → metadata `FOURNISSEUR` | string | yes | all |
| 5 | `TRACKING_NUMBER` | receiving reference — distinguishes deliveries when a PO is received in multiple receivings (paired with `PARCEL`) | | string | yes | all |
| 6 | `LOCATION_TO` | destination location | → metadata `Store` | string | yes | all (`Main Warehouse`) |
| 7 | `DELIVERY_AREA` | not used — keep empty | `""` | string | no | empty |
| 8 | `IS_OVERSUPPLY` | oversupply flag | | boolean | yes — default `0` | all (`0`) |
| 9 | `PARCEL_QUANTITY` | number of parcels | | integer | yes — default `1` | all (`1`) |
| 10 | `DELIVERY_DATE` | expected delivery date | `YYYYMMDD` | date | yes | all (`20260615`) |
| 11 | `EXTERNAL_LINE_REFERENCE` | line reference of each PO line — unique per row | | string | yes | all (UUID) |
| 12 | `CODE_ARTICLE` | SKU code | → `I_SKU` `CODE_ARTICLE` | string | yes | all |
| 13 | `EXPECTED_QUANTITY` | expected quantity for the line | | integer | yes | all |
| 14 | `PARCEL` | receiving reference, paired with `TRACKING_NUMBER` | | string | yes | all |
| 15 | `PALLET` | not used — keep empty | `""` | string | no | empty |
| 16 | `STATUS` | initial document/line status | | string | yes — default `to_check` | all (`to_check`) |

Referential columns (load order: metadata + SKU before delivery notice):
`CODE_SUPPLIER` → `FOURNISSEUR`, `LOCATION_TO` → `Store`, `CODE_ARTICLE` →
`I_SKU.CODE_ARTICLE`. `LOCATION_TO` value `Main Warehouse` appears verbatim
in the accepted store metadata sample — codes join on exact string, spaces
included.

## Current implementation mapping (reference)

Per-PO-line mapping used by the existing project (JS):

```js
{
  "EXTERNAL_DOC_REFERENCE": line.id,
  "EXTERNAL_ORDER_REFERENCE": line.purchase_order,
  "USER_REASON": "PO",
  "CODE_SUPPLIER": line.supplier,
  "TRACKING_NUMBER": line.invoice_number,
  "LOCATION_TO": line.location,
  "DELIVERY_AREA": "",
  "IS_OVERSUPPLY": 0,
  "PARCEL_QUANTITY": 1,
  "DELIVERY_DATE": deliveryDate,
  "EXTERNAL_LINE_REFERENCE": line.product_id,
  "CODE_ARTICLE": line.sku,
  "EXPECTED_QUANTITY": line.quantity,
  "PARCEL": line.invoice_number,
  "PALLET": "",
  "STATUS": "to_check"
}
```

## Observations from the accepted sample

- Document/line structure: `EXTERNAL_DOC_REFERENCE` identical on all rows
  (one document in this sample; multiple documents per file are allowed),
  `EXTERNAL_LINE_REFERENCE` unique per row. Both come from the source PO
  system, not from Octo+.
- `EXTERNAL_ORDER_REFERENCE` (`PO-05087`) matches the filename — our
  traceability convention.
- `DELIVERY_DATE` is `YYYYMMDD`, no separators, no time component.
- `TRACKING_NUMBER` and `PARCEL` identify a *receiving*: when a PO is
  received in multiple deliveries, each receiving gets its own reference.
  The current implementation uses the invoice number for both. This sample
  is a single receiving, so both carry the same value (`63758`) on every
  row.
- Other Octo+-accepted values for `USER_REASON`/`STATUS` (beyond the `PO` /
  `to_check` defaults) are unknown — we never send anything else.

## File-level format (verified against the accepted sample)

| Property | Value |
|---|---|
| Filename | `I_DSU_<free text>.csv` — only the `I_DSU_` prefix is significant |
| Header row | yes |
| Separator | `;` |
| Quoting | none observed — values contain spaces and `(` `)` unquoted |
| Line endings | LF (`\n`); no trailing newline at EOF |
| Empty fields | consecutive separators (`;;`) |
| Encoding | sample is pure ASCII; UTF-8 assumed (see `metadata.md`) |

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
