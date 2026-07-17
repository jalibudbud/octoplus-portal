# AGENTS.md — backend (portal API)

NestJS 11 + TypeScript. Modular monolith: module boundaries (`storage`,
`files`; later `sftp-config`, `delivery`) map 1:1 to services that could be
split out. The France relay worker will be a separate NestJS deployable —
do not fold relay/SFTP-upload logic into this API.

## Conventions

- Object storage goes through the `StorageProvider` interface
  (`src/storage/storage.provider.ts`) — inject the `STORAGE_PROVIDER` token,
  never a concrete driver. Drivers: `local` (dev default), `s3`. Azure Blob
  is a planned drop-in.
- Config via `@nestjs/config` / env only (see `.env.example`). Secrets
  (SFTP credentials, cloud keys) are never stored in the DB or committed —
  root `AGENTS.md` constraint.
- Global route prefix `/api`; dev port 3001; CORS origins from `CORS_ORIGIN`.
- No auth yet (internal POC) — Entra ID (OIDC) is the decided auth when it
  lands.

## Run

```
pnpm start:dev    # watch mode on :3001 (local storage driver)
pnpm typecheck
```
