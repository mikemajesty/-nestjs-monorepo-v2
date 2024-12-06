import { Module } from '@nestjs/common';

import { MongoDatabaseModule } from '@/infra/database/mongo';
import { PostgresDatabaseModule } from '@/infra/database/postgres';
import { LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';

import { HealthModule } from './health/module';
import { PermissionModule } from './permissions/module';
import { RoleModule } from './roles/module';
import { UserModule } from './users/module';

@Module({
  imports: [
    SecretsModule,
    HealthModule,
    LoggerModule,
    PostgresDatabaseModule,
    MongoDatabaseModule,
    PermissionModule,
    RoleModule,
    UserModule
  ],
  controllers: [],
  providers: []
})
export class AuthAppModule {}
