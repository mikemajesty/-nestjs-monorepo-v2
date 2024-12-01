import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IRoleRepository } from '@/core/role/repository/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { UserChangePasswordUsecase } from '@/core/user/use-cases/user-change-password';
import { UserCreateUsecase } from '@/core/user/use-cases/user-create';
import { UserDeleteUsecase } from '@/core/user/use-cases/user-delete';
import { UserGetByIdUsecase } from '@/core/user/use-cases/user-get-by-id';
import { UserListUsecase } from '@/core/user/use-cases/user-list';
import { UserSearchUsecase } from '@/core/user/use-cases/user-search';
import { UserUpdateUsecase } from '@/core/user/use-cases/user-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { UserSchema } from '@/infra/database/postgres/schemas/user';
import { UserPasswordSchema } from '@/infra/database/postgres/schemas/user-password';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { TokenLibModule } from '@/libs/token';
import { AuthenticationMiddleware } from '@/observables/middlewares';

import { RoleModule } from '../roles/module';
import {
  IUserChangePasswordAdapter,
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIdAdapter,
  IUserListAdapter,
  IUserSearchAdapter,
  IUserUpdateAdapter
} from './adapter';
import { UserController } from './controller';
import { UserRepository } from './repository';

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    RedisCacheModule,
    EventLibModule,
    TypeOrmModule.forFeature([UserSchema, UserPasswordSchema]),
    RoleModule
  ],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepository,
      useFactory: (repository: Repository<UserSchema & UserEntity>) => {
        return new UserRepository(repository);
      },
      inject: [getRepositoryToken(UserSchema)]
    },
    {
      provide: IUserCreateAdapter,
      useFactory: (
        userRepository: IUserRepository,
        loggerService: ILoggerAdapter,
        event: IEventAdapter,
        roleRepository: IRoleRepository
      ) => {
        return new UserCreateUsecase(userRepository, loggerService, event, roleRepository);
      },
      inject: [IUserRepository, ILoggerAdapter, IEventAdapter, IRoleRepository]
    },
    {
      provide: IUserUpdateAdapter,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter, roleRepository: IRoleRepository) => {
        return new UserUpdateUsecase(userRepository, loggerService, roleRepository);
      },
      inject: [IUserRepository, ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IUserListAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserListUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserDeleteAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserDeleteUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserSearchAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserSearchUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserGetByIdAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserGetByIdUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserChangePasswordAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserChangePasswordUsecase(userRepository);
      },
      inject: [IUserRepository]
    }
  ],
  exports: [
    IUserRepository,
    IUserCreateAdapter,
    IUserUpdateAdapter,
    IUserListAdapter,
    IUserDeleteAdapter,
    IUserGetByIdAdapter
  ]
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude({ method: RequestMethod.GET, path: '(.*)/search', version: '1' })
      .forRoutes(UserController);
  }
}
