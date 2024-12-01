import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { ResetPasswordConfirmUsecase } from '@/core/reset-password/use-cases/reset-password-confirm';
import { ResetPasswordSendEmailUsecase } from '@/core/reset-password/use-cases/reset-password-send-email';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ResetPasswordSchema } from '@/infra/database/postgres/schemas/reset-password';
import { HttpModule, IHttpAdapter } from '@/infra/http';
import { LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';

import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter';
import { ResetPasswordController } from './controller';
import { ResetPasswordRepository } from './repository';

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    RedisCacheModule,
    TokenLibModule,
    EventLibModule,
    TypeOrmModule.forFeature([ResetPasswordSchema]),
    HttpModule
  ],
  controllers: [ResetPasswordController],
  providers: [
    {
      provide: IResetPasswordRepository,
      useFactory: (repository: Repository<ResetPasswordSchema & ResetPasswordEntity>) => {
        return new ResetPasswordRepository(repository);
      },
      inject: [getRepositoryToken(ResetPasswordSchema)]
    },
    {
      provide: ISendEmailResetPasswordAdapter,
      useFactory: (
        resetpasswordtokenRepository: IResetPasswordRepository,
        token: ITokenAdapter,
        event: IEventAdapter,
        secret: ISecretsAdapter,
        http: IHttpAdapter
      ) => {
        return new ResetPasswordSendEmailUsecase(resetpasswordtokenRepository, token, event, secret, http);
      },
      inject: [IResetPasswordRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter, IHttpAdapter]
    },
    {
      provide: IConfirmResetPasswordAdapter,
      useFactory: (
        resetpasswordtokenRepository: IResetPasswordRepository,
        token: ITokenAdapter,
        event: IEventAdapter,
        http: IHttpAdapter,
        secret: ISecretsAdapter
      ) => {
        return new ResetPasswordConfirmUsecase(resetpasswordtokenRepository, token, event, http, secret);
      },
      inject: [IResetPasswordRepository, ITokenAdapter, IEventAdapter, IHttpAdapter, ISecretsAdapter]
    }
  ],
  exports: [IResetPasswordRepository, ISendEmailResetPasswordAdapter]
})
export class ResetPasswordModule {}
