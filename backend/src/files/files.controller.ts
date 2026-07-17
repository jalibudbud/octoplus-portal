import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { STORAGE_PROVIDER } from '../storage/storage.provider'
import type { PutResult, StorageProvider } from '../storage/storage.provider'

const REPO_SLUG = /^[a-z0-9-]+$/
const SAFE_FILENAME = /^[\w.-]+$/

@Controller('files')
export class FilesController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('repo') repo: string | undefined,
  ): Promise<PutResult> {
    if (!file) {
      throw new BadRequestException('Missing "file" field (multipart/form-data)')
    }
    if (!repo || !REPO_SLUG.test(repo)) {
      throw new BadRequestException('Missing or invalid "repo" field (expected a repository slug)')
    }
    const filename = SAFE_FILENAME.test(file.originalname) ? file.originalname : 'export.csv'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const key = `${repo}/${timestamp}_${filename}`
    return this.storage.put(key, file.buffer, file.mimetype || 'text/csv')
  }
}
