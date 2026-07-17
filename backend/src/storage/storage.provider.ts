import type { Readable } from 'node:stream'

export interface PutResult {
  key: string
  size: number
}

/**
 * Pluggable object-storage driver (project plan §5.4).
 * Implementations: S3 (prod), local disk (dev). Azure Blob planned.
 */
export interface StorageProvider {
  put(key: string, body: Buffer | Readable, contentType?: string): Promise<PutResult>
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER'
