import { Test } from '@nestjs/testing';
import { Axios } from 'axios';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { IHttpAdapter } from '@/infra/http';
import { CreatedModel } from '@/infra/repository';
import { ISecretsAdapter } from '@/infra/secrets';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, SignOutput } from '@/libs/token';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import { ResetPasswordSendEmailInput, ResetPasswordSendEmailUsecase } from '../reset-password-send-email';

describe(ResetPasswordSendEmailUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IResetPasswordRepository;
  let http: jest.Mocked<IHttpAdapter>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IHttpAdapter,
          useValue: {
            instance: jest.fn()
          }
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            APPS: { USER: { HOST: 'https://github.com/', PORT: 3000 } }
          } as Partial<ISecretsAdapter>
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            sign: TestUtils.mockReturnValue<SignOutput>({ token: 'token' })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: TestUtils.mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IUsecase,
          useFactory: (
            repository: IResetPasswordRepository,
            token: ITokenAdapter,
            event: IEventAdapter,
            secret: ISecretsAdapter,
            http: IHttpAdapter
          ) => {
            return new ResetPasswordSendEmailUsecase(repository, token, event, secret, http);
          },
          inject: [IResetPasswordRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter, IHttpAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IResetPasswordRepository);
    http = app.get(IHttpAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as ResetPasswordSendEmailInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<ResetPasswordSendEmailInput>('email') }]);
      }
    );
  });

  const input: ResetPasswordSendEmailInput = { email: 'admin@admin.com' };

  test('when user not found, should expect an error', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity | null }>({ data: null })
      } as Partial<Axios> as Axios;
    });
    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
  });

  const resetPassword = new ResetPasswordEntity({ id: TestUtils.getMockUUID(), token: 'token', user });

  test('when token was founded, should expect void', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(resetPassword);

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });

  test('when token was not founded, should expect void', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });
});
