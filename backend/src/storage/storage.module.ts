import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { STORAGE_PROVIDER } from './storage.provider'
import { LocalStorageProvider } from './local-storage.provider'
import { S3StorageProvider } from './s3-storage.provider'

@Module({
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        config: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
      ) => {
        const driver = config.get<string>('STORAGE_PROVIDER') ?? 'local'
        switch (driver) {
          case 's3':
            return s3
          case 'local':
            return local
          default:
            throw new Error(`Unknown STORAGE_PROVIDER: ${driver} (expected local | s3)`)
        }
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
