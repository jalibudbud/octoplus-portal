# Bulk RFID printing

Octo+ bulk-printing repository. The `INT05` filename prefix identifies this
format. Requests RFID label printing for existing SKUs (e.g. for a purchase
order's incoming units).

Accepted sample (in `samples/`): `INT05_PO-05479_1782380686193.csv`
(3 rows, from a test instance — values like `test`/`test2` are data, not
placeholders in the format).

## Fields

7 columns, in file order.

| # | OCTO+ column name | Description | Value | Type | Required | In sample |
|---|---|---|---|---|---|---|
| 1 | `TYPE_DOCUMENT` | print document type — fixed default | `print_query_warehouse` | string | yes | all |
| 2 | `LOC_DEP` | location where the printer is | → metadata `Store` code | string | yes | all (`store123`) |
| 3 | `LOC_DEST` | not used | `""` | string | no | empty |
| 4 | `N_COLIS` | free-text reference of the printing | | string | yes | all |
| 5 | `CODE_ARTICLE` | SKU code | → `I_SKU` `CODE_ARTICLE` | string | yes | all |
| 6 | `QTE_STOCK` | quantity of labels to print | | integer | yes | all (`1`) |
| 7 | `REF_EXTERNE` | free-text reference of the printing | | string | yes | all |

Referential columns: `CODE_ARTICLE` must match a SKU already delivered to
the target instance (load order: SKU before bulk printing); `LOC_DEP` is a
`Store` code from the metadata repository (load order: store metadata
before bulk printing).

## Observations from the accepted sample

- `CODE_ARTICLE` values use the same `[product][ref]` bracket convention as
  the SKU sample (`[7616185386230][PO-05479-1]`) — our serialized-product
  convention; the column simply has to match the SKU's `CODE_ARTICLE`
  exactly.
- The filename and `REF_EXTERNE`/refs carry the purchase-order number
  (`PO-05479`) — our convention for traceability.

## File-level format (verified against the accepted sample)

| Property | Value |
|---|---|
| Filename | `INT05_<free text>.csv` — only the `INT05_` prefix is significant |
| Header row | yes |
| Separator | `;` |
| Quoting | none observed — values contain spaces and `-` unquoted |
| Line endings | LF (`\n`); no trailing newline at EOF |
| Empty fields | consecutive separators (`;;`) |
| Encoding | sample is pure ASCII; UTF-8 assumed (see `metadata.md`) |

## Open questions

1. Can `QTE_STOCK` be > 1 for serialized articles, or is it one row per
   label?

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
