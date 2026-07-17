import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Readable } from 'node:stream'
import type { PutResult, StorageProvider } from './storage.provider'

@Injectable()
export class S3StorageProvider implements StorageProvider {
  // Region and credentials resolve from the standard AWS env/profile chain
  private readonly client = new S3Client({})
  private readonly bucket: string | undefined

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET')
  }

  async put(key: string, body: Buffer | Readable, contentType?: string): Promise<PutResult> {
    if (!this.bucket) {
      throw new Error('S3_BUCKET is not configured')
    }
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType ?? 'application/octet-stream',
      },
    })
    await upload.done()
    // Streams don't expose a length up front; report what we know
    const size = Buffer.isBuffer(body) ? body.length : -1
    return { key, size }
  }
}
