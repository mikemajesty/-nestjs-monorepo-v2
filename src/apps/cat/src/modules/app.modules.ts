import { Module } from '@nestjs/common';

import { MongoDatabaseModule } from '@/infra/database/mongo';
import { PostgresDatabaseModule } from '@/infra/database/postgres';
import { LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';

import { CatModule } from './cat/module';
import { HealthModule } from './health/module';

@Module({
  imports: [SecretsModule, HealthModule, LoggerModule, PostgresDatabaseModule, MongoDatabaseModule, CatModule],
  controllers: [],
  providers: []
})
export class AuthAppModule {}
