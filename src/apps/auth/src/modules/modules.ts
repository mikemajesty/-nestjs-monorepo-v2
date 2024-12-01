import { Module } from '@nestjs/common';

import { MongoDatabaseModule } from '@/infra/database/mongo';
import { PostgresDatabaseModule } from '@/infra/database/postgres';
import { LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';

import { HealthModule } from './health/module';
import { LoginModule } from './login/module';
import { LogoutModule } from './logout/module';

@Module({
  imports: [
    SecretsModule,
    HealthModule,
    LoggerModule,
    PostgresDatabaseModule,
    MongoDatabaseModule,
    LoginModule,
    LogoutModule
  ],
  controllers: [],
  providers: []
})
export class AuthAppModule {}
