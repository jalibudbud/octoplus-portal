# Octo+ Data Portal — Project Plan

*Status: Draft v0.3 · Owner: [You — PO/Tech Lead] · Team: 2–3 devs · Last updated: 16 July 2026*

---

## 1. Context

Octo+ is a French RFID retail solution (modules: stocktake, purchasing, product search, RFID label printing). The **only** ingestion path is CSV over SFTP — **confirmed: Octo+ has no API**. Each repository has a predefined file format with French column headers and a repository-specific filename prefix.

As a reseller, our team hand-builds these CSVs today against a mapping spreadsheet.

## 2. Problem statement

| Pain | Impact |
|---|---|
| CSVs are created manually, per repository, per customer | Slow, does not scale with deal volume |
| Column names are French (`CODE_ATTRIBUT`, `LIBELLE_ATTRIBUT`…) | Team must cross-reference a mapping sheet for every field |
| Mapping sheet is the only source of truth | Tribal knowledge; drifts from reality; no validation |
| No validation before delivery | Errors surface late, inside Octo+, during customer-facing POCs |
| Files delivered to Octo+ SFTP by hand | Error-prone; wrong-destination risk; no audit trail |
| POC setup (create a product, a store) is slow | Directly hurts sales cycle time |

## 3. Goal

An **internal** web application that lets our team produce **valid Octo+ CSV files in English**, and deliver them automatically to the **correct Octo+ SFTP instance**, with validation, ordered delivery, storage and an audit trail.

### Decisions locked

| Question | Decision |
|---|---|
| Octo+ API? | **None. SFTP/CSV only.** |
| Users v1 | **Internal team only** (customer self-service deferred) |
| Encoding | Believed UTF-8 — **must be verified empirically in Phase 0** |
| Scale | **5–10 customers year one; exactly 1 Octo+ instance per customer** (contractual rule) |
| Hosting | **Our cloud** + a small **relay VM in France** with a static, Octo+-whitelisted egress IP |
| Feedback loop | None today (logs viewable in Octo+ platform). **Webhook on Octo+ roadmap** — build a receiver stub now |
| Filenames | **Per-repository prefixes** (e.g. `I_SKU`, `I_CAB`), defined by us — config in schema registry |
| Team | 2–3 devs; PO/Tech lead: the project owner |
| Timeline | No hard deadline / pending POC — build right, ship the vertical slice early |
| Auth | Microsoft 365 in-house → **Entra ID SSO (OIDC)** — natural fit, no SSO used before but low effort |

### Success criteria

- Time to produce a valid product/category file drops from *hours* to *minutes*
- Zero need to open the mapping sheet during normal operation
- Zero files delivered to the wrong Octo+ instance
- Multi-file product setups always delivered in dependency order
- Every generated file is reproducible and traceable (who, what, when, where)
- Adding a new Octo+ repository requires **config**, not a code release

### Explicit non-goals (v1)

- Not replacing Octo+ or any of its modules
- Not a general-purpose ETL tool
- Not reading data back out of Octo+
- Not customer self-service — internal team only

---

## 4. V1 scope — repositories

Eight repositories across five domains (formats documented in
`docs/reference/`):

| Domain | Repository | Prefix | Notes |
|---|---|---|---|
| Product | Category | `INT01` | First in load order — shared metadata format |
| Product | SKU | `I_SKU` | Depends on Category |
| Product | Barcode | `I_CAB` | Depends on SKU |
| Metadata | Suppliers | `INT01` | Referenced by delivery notices — shared metadata format |
| Metadata | Stores | `INT01` | Shared metadata format (3 levels), incl. color/size |
| Inventory | Stock on-hand | `INT04` | Depends on SKU |
| Shipping | Supplier delivery notice | `I_DSU` | **Transactional** — references supplier + SKUs + qty |
| Printing | Bulk printing | `INT05` | References existing SKUs + store |

> **Pricing:** Octo+ has a separate "price list" repository, **deferred for
> now** — v1 uses the RSP/COST prices in the SKU file
> (`SELLING_PRICE`/`BUYING_PRICE`) as the default.

Two repository *kinds* with different UX needs:
- **Master data** (category, SKU, barcode, suppliers, stores): create/maintain reference data; grid entry, CSV import, cloning between customers.
- **Transactional** (delivery notice, bulk print, stock update): reference master data that must already exist; validation should check references against the app's stored datasets.

### Load-order dependencies (enforced by the app)

```
Product chain:    Category → SKU → Barcode
Inventory:        SKU must exist before Stock on-hand
Shipping:         Supplier + SKUs must exist before Delivery notice
Printing:         SKUs + Store must exist before Bulk printing
```

Dependencies are declared **in the schema registry** per repository, not hardcoded. The app:
1. Warns/blocks out-of-order single-file sends when the referenced data hasn't been delivered to that instance
2. Offers a **"bundle" flow**: build a full product setup (category + SKU + barcode) and deliver it as an ordered sequence in one action, halting the chain if any upload fails

---

## 5. Solution overview

```
[ 1. Template / Schema Registry ]  Octo+ formats: columns, prefixes, dependencies — declarative & versioned
              ↓
[ 2. Data Entry UI ]               English forms + spreadsheet grid + CSV import
              ↓
[ 3. Validation + Transformation ] EN→FR mapping, referential checks, ordered CSV emit
              ↓
[ 4. Storage ]                     S3 / blob — artifact + source data
              ↓
[ 5. Delivery ]                    Queue → France relay → per-customer Octo+ SFTP
              ↑
[ 6. (Future) Webhook receiver ]   Octo+ ingestion events → delivery status confirmed/rejected
```

### 5.1 Template / Schema Registry

Each Octo+ repository is described **as data, not as code**:
- Repository key + domain + **kind** (master / transactional)
- Ordered column list: French column name, English label, help text, type, required, default, allowed values, validation rule
- File-level: delimiter (`;`), quoting/escaping, encoding, header row, line endings
- **Filename prefix** (`I_SKU`, `I_CAB`, …) + full filename convention (prefix + timestamp/sequence — confirm exact pattern in Phase 0)
- **Dependencies** — list of repository keys that must precede this one
- **Schema version** — bound per instance

Worked example — *product category*:

| Octo+ column (FR) | UI label (EN) | Type | Required |
|---|---|---|---|
| `BUT` | Purpose / Target | enum | Yes |
| `CODE_ATTRIBUT` | Attribute code | string | Yes |
| `LIBELLE_ATTRIBUT` | Attribute label | string | Yes |
| `TYPE_ATTRIBUT_PARENT` | Parent attribute type | string | No |
| `CODE_ATTRIBUT_PARENT` | Parent attribute code | string | No |

The user never sees French columns. Mapping is applied on generate.

> **Migration task:** the existing mapping spreadsheet + the prefix lookup table (`{octoplus_key: "I_SKU", type: "product_sku"}` …) are the seed data for this registry. Phase 0 validates them field-by-field against files Octo+ has actually accepted.

### 5.2 Data entry UI

- **Dynamic forms** rendered from schema — no hardcoded screens per repository
- **Grid / spreadsheet mode** for bulk entry; paste from Excel
- **CSV import + column auto-mapping** — bring an existing customer file, map headers, fix errors inline
- **Drafts** — nothing generated until explicitly triggered
- **Preview** — the actual French CSV, before sending
- **Datasets** — save a POC dataset per customer; clone to another customer/instance
- **Bundle builder** — compose category + SKU + barcode in one flow, deliver in order

### 5.3 Validation + transformation

1. **Field level** — required, type, length, enum, regex
2. **Set level** — duplicate keys within a file
3. **Referential level** — transactional files checked against master data previously delivered to the *same instance* (a delivery notice can't reference a SKU that was never sent to that customer's Octo+)

Explicit transformation concerns (silent-corruption territory):
- **Encoding** — assumed UTF-8, **unverified**. Phase 0 gate: round-trip é, è, à, ç, œ through a real test instance and verify labels inside Octo+. Per-instance encoding override exists in config either way.
- **Delimiter collision** — `;` inside values must be quoted/escaped per Octo+'s parser
- **Decimal separator** — comma vs dot (pricing, stock quantities)
- **Dates** — format, timezone (delivery notices)
- **Booleans** — `O`/`N` vs `1`/`0`
- **Line endings**, **empty vs null**, **filename pattern beyond the prefix**

### 5.4 Storage

- S3-compatible object storage in our cloud (pluggable driver keeps blob/local possible)
- Store the **immutable generated artifact** and the **structured source data** (edit → regenerate)
- Downloadable from the UI; retention policy per environment

### 5.5 Delivery — relay architecture

Because Octo+ **IP-whitelists** SFTP clients, uploads go through a dedicated relay:

```
Web app + API + DB + queue (our cloud)
        │  artifact ref + delivery job
        ▼
Relay VM (France, small, static IP — whitelisted by Octo+)
        │  streams artifact from S3/blob
        ▼
Per-customer Octo+ SFTP instance
```

**Relay design notes:**
- Stateless worker: pulls jobs from the queue, streams the artifact from object storage, uploads via SFTP — no files at rest on the VM beyond the stream
- **Only** its egress IP needs whitelisting; the main app can live anywhere in our cloud
- Uploads are **atomic**: Octo+ consumes files as soon as they appear (even mid-upload), so write as `uploading_<final name>`, rename to the final prefixed name when the transfer completes
- Retries with backoff; job status reported back (queued → uploading → sent → failed)
- Single VM is fine for v1 volumes; it's stateless, so a second one later is trivial
- Secure the app→relay channel (private network / VPN / mTLS); relay holds no credentials at rest — it fetches SFTP secrets per-job from the secrets manager

**Customer/Instance config** — since the rule is **1 customer = 1 instance**, these collapse into one object:
- Customer name, environment (test/prod)
- SFTP host, port, username; auth (SSH key or password) in **secrets manager, never plaintext**
- Host key fingerprint (pinned)
- Remote path per repository; schema version; encoding override

**Delivery flow:**
1. Pick Repository (or Bundle) + Customer
2. Pre-flight validation → blocking
3. Preview CSV(s) → confirm; destination shown prominently, prod visually distinct
4. Generate → store artifact(s)
5. Enqueue (ordered, for bundles) → relay uploads atomically → status recorded
6. Idempotency guard against accidental double-delivery

### 5.6 Webhook receiver (build the socket now, plug in later)

Octo+ is developing a webhook that posts ingestion events to a given URL. Today, feedback is only visible in their logs platform.

- v1: delivery statuses stop at **"sent"**; UI links out to the Octo+ logs platform per instance
- Build now: a `POST /webhooks/octoplus/:instance` endpoint (authenticated, e.g. shared secret/HMAC) that updates delivery records to **confirmed / rejected** — dormant until Octo+ ships
- Action item: ask Octo+ for their **webhook event schema and timeline** so the receiver matches reality

### 5.7 Cross-cutting

- **Auth: Microsoft Entra ID SSO (OIDC)** — we already run Microsoft 365; an Entra app registration gives login with work accounts, MFA, and offboarding for free. First-time SSO setup, but standard libraries make this a small task.
- **RBAC** — Admin (instances + secrets), Operator (create/deliver), Viewer. Map to Entra groups if convenient.
- **Audit log** — who generated what, from which data, to which destination, when, outcome
- **Delivery dashboard** — every file's status, error detail, link to Octo+ logs
- **Alerting** — on delivery failure (email/Teams — we're an M365 shop)

---

## 6. Architecture summary

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Schema-driven forms + data grid |
| API | Node/NestJS *or* Python/FastAPI | Decide in Phase 0 by team skills (2–3 devs — pick the stack the team is fastest in) |
| Database | PostgreSQL | Schemas, datasets, customers, jobs, audit |
| Object storage | S3-compatible | Artifacts + source data |
| Queue + workers | BullMQ / Celery | Ordered, retryable delivery off the request path |
| Relay | Small VM, France, static IP | Octo+ whitelisting; stateless streamer |
| Secrets | Cloud secrets manager / Vault | SFTP creds never in DB or Git |
| Auth | Entra ID (OIDC) | Existing M365 tenant |

**Design principle:** schema-driven everywhere. New repository, changed format, new prefix, new dependency = config change, not release. With no API ever coming, this pipeline *is* the product.

---

## 7. Delivery phases

With 2–3 devs and no hard deadline: optimize for a **working vertical slice early**, then widen. Rough shape (calibrate in Phase 0):

### Phase 0 — Discovery & format inventory *(~2–3 wks)*
- Validate mapping sheet + prefix lookup table field-by-field against accepted sample files, for all 9 v1 repositories
- **Encoding round-trip test** (é, è, à, ç, œ) on a real test instance — hard gate
- Confirm full filename pattern beyond prefix (timestamp? sequence? extension? trigger file?)
- Confirm SFTP behavior: landing paths per repository, pickup mechanism/polling, what happens to processed files
- Ask Octo+: webhook schema + ETA
- Provision France relay VM, get its IP whitelisted on a test instance
- Entra app registration; stack decision
- **Exit:** signed-off schemas for Category + SKU + Barcode; whitelisted relay reaching a test SFTP

### Phase 1 — Vertical slice *(~3–4 wks)*
Product Category end-to-end: form → validate → transform → generate → store → queue → relay → test instance → delivery record. Entra login in place.
- **Exit:** a file created in the app is ingested successfully by a real Octo+ test instance.

### Phase 2 — Registry + all 9 repositories *(~4–6 wks)*
- Schema registry with versioning, prefixes, dependencies
- All v1 repositories live; master vs transactional handling; referential validation
- Grid editing, Excel paste, CSV import + auto-mapping, preview
- **Bundle flow** with ordered delivery

### Phase 3 — Multi-customer *(~2–3 wks)*
- Customer/instance management, secrets integration, connection test, host-key pinning
- Per-repository remote paths; prod/test rails; destination confirmation

### Phase 4 — Operations *(~2–3 wks)*
- Audit log, delivery dashboard, retries/alerting (Teams/email), RBAC
- Webhook receiver endpoint (dormant), link-outs to Octo+ logs platform

### Phase 5 — Hardening & rollout
- Run a full real customer setup through the app end to end (this becomes the de facto POC)
- Docs + team training; decommission manual CSV process
- Later: activate webhook when Octo+ ships it; evaluate customer self-service (v2)

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Encoding assumption wrong** (UTF-8 unverified) | Accented labels corrupt silently | Phase 0 round-trip test is a hard gate |
| Mapping sheet / prefix table incomplete or wrong | Bad foundation | Phase 0 validation against accepted files |
| Octo+ changes a format without notice | Silent failures | Schema versioning; monitor logs; webhook when available |
| No feedback loop yet | "Sent" ≠ "accepted" | Link to Octo+ logs in v1; webhook receiver pre-built |
| Relay VM is a single point of failure | Delivery outage | Stateless design; monitoring; second VM trivial to add |
| Whitelisting friction per new customer instance | Onboarding delay | One static relay IP covers all instances — confirm Octo+ whitelists it globally vs per-instance |
| Out-of-order delivery (barcode before SKU) | Rejected/orphaned data | Dependencies in registry; bundle flow; blocking warnings |
| SFTP credentials mishandled | Security incident | Secrets manager; relay fetches per-job; host-key pinning; RBAC |
| Escaping edge cases (`;`, quotes, decimals) | Corrupted POC data | Adversarial test fixtures per repository |
| Small team + broad scope | Slow delivery | Vertical slice first; registry makes repos 2–9 cheap; non-goals binding |

---

## 9. Remaining open items

1. Exact filename pattern beyond prefix (timestamp/sequence/trigger file?) — **Phase 0**
2. Octo+ webhook event schema + timeline — **ask Octo+**
3. Whether one whitelisted relay IP covers all instances or whitelisting is per-instance — **ask Octo+**
4. Encoding verification — **Phase 0 gate**
5. Stack choice (Node vs Python) — **team decision, Phase 0**
6. Prefix values for the 7 repositories beyond `I_SKU` / `I_CAB` — **from lookup table**

## 10. Immediate next actions

- [done] Share mapping spreadsheet + full prefix lookup table + accepted sample files
- [done] Request Octo+ test SFTP instance access
- [no need we handle this internally] Ask Octo+: webhook schema/ETA + whitelisting model (global vs per-instance)
- [add in todo] Provision France relay VM; submit its IP for whitelisting
- [add in todo] Encoding round-trip test
- [add in todo] Team stack decision (Node/NestJS vs Python/FastAPI)
- [add in future improvement] Entra ID app registration
