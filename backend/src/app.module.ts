import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StorageModule } from './storage/storage.module'
import { FilesModule } from './files/files.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    FilesModule,
  ],
})
export class AppModule {}
