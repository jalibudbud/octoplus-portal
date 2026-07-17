import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import type { Readable } from 'node:stream'
import type { PutResult, StorageProvider } from './storage.provider'

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('LOCAL_STORAGE_DIR') ?? '.storage')
  }

  async put(key: string, body: Buffer | Readable): Promise<PutResult> {
    const filePath = resolve(join(this.root, key))
    if (!filePath.startsWith(this.root + sep)) {
      throw new Error(`Storage key escapes the storage root: ${key}`)
    }
    const buffer = Buffer.isBuffer(body) ? body : await this.collect(body)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, buffer)
    return { key, size: buffer.length }
  }

  private async collect(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
}
