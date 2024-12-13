import { Module } from '@nestjs/common';

import { LoginUsecase } from '@/core/user/use-cases/user-login';
import { RefreshTokenUsecase } from '@/core/user/use-cases/user-refresh-token';
import { HttpModule, IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';

import { ILoginAdapter, IRefreshTokenAdapter } from './adapter';
import { LoginController } from './controller';

@Module({
  imports: [TokenLibModule, SecretsModule, HttpModule],
  controllers: [LoginController],
  providers: [
    {
      provide: ILoginAdapter,
      useFactory: (tokenService: ITokenAdapter, http: IHttpAdapter, secret: ISecretsAdapter) => {
        return new LoginUsecase(tokenService, http, secret);
      },
      inject: [ITokenAdapter, IHttpAdapter, ISecretsAdapter]
    },
    {
      provide: IRefreshTokenAdapter,
      useFactory: (tokenService: ITokenAdapter, http: IHttpAdapter, secret: ISecretsAdapter) => {
        return new RefreshTokenUsecase(tokenService, http, secret);
      },
      inject: [ITokenAdapter, IHttpAdapter, ISecretsAdapter]
    }
  ]
})
export class LoginModule {}
