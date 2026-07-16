# Stock on hand

Octo+ stock-on-hand repository. The `INT04` filename prefix identifies this
format. Declares expected inventory quantities per SKU per location.

Accepted sample (in `samples/`): `INT04_492_20260716_1.csv`
(12,477 rows, all `M`, single location `P492`).

## Fields

4 columns, in file order. All fields are mandatory — but see the caveat
below.

| # | OCTO+ column name | Description | Value | Type | In sample |
|---|---|---|---|---|---|
| 1 | `TYPE_MOVEMENT` | action to perform when imported to Octo+ | `enums.TYPE_MOUVEMENT` (`C`/`M`/`S`, see `product-sku.md`) — in practice we only use `M` | string | all (`M`) |
| 2 | `SKU` | SKU code | → `I_SKU` `CODE_ARTICLE` | string | ~80% |
| 3 | `LOCATION` | location/store code | → metadata `Store` | string | all (`P492`) |
| 4 | `EXPECTED_QUANTITY` | expected on-hand quantity | | integer | ~80% |

⚠️ **Spelling is not a typo:** this format uses the English
`TYPE_MOVEMENT`, while `I_SKU`/`I_CAB` use the French `TYPE_MOUVEMENT`.
Emit exactly what each format expects.

⚠️ Mandatory vs reality: 2,471 of 12,477 rows in the accepted sample have an
empty `SKU` and `EXPECTED_QUANTITY` (`M;;P492;`). The file was accepted, but
those rows were presumably ignored or errored inside Octo+. The app must
never emit such rows — treat `SKU` and `EXPECTED_QUANTITY` as hard-required.

## Observations from the accepted sample

- `EXPECTED_QUANTITY` can be **negative** (−1, −2, −3 occur) — Octo+
  accepts negative stock. The app should probably warn but not block.
- The same `SKU` appears in multiple rows for the same location. The app
  does **not** de-duplicate: we push whatever the source contains —
  duplicates are the end user's responsibility.
- Filename `INT04_492_...` embeds the location number (`492` ↔ `P492`) —
  our convention, not a rule (only the `INT04_` prefix is significant).

## File-level format (verified against the accepted sample)

| Property | Value |
|---|---|
| Filename | `INT04_<free text>.csv` — only the `INT04_` prefix is significant |
| Header row | yes |
| Separator | `;` |
| Quoting | none observed |
| Line endings | **CRLF** (`\r\n`) in this accepted sample — Octo+ accepts both CRLF and LF (other formats' samples are LF). Pick LF for generation and stay consistent |
| Trailing newline | absent at EOF |
| Empty fields | consecutive separators, trailing `;` |
| Encoding | sample is pure ASCII; UTF-8 assumed (see `metadata.md`) |

## SFTP delivery

Same as metadata: default landing path `/share/in` (config-level default,
per-repository override); upload as `uploading_<final name>`, then rename —
Octo+ consumes files as soon as they appear, even mid-upload.
