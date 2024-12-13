import { Test } from '@nestjs/testing';
import { Axios } from 'axios';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IHttpAdapter } from '@/infra/http';
import { CreatedModel, RemovedModel } from '@/infra/repository';
import { ISecretsAdapter } from '@/infra/secrets';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmUsecase,
  ResetPasswordConfirmVerify
} from '../reset-password-confirm';

describe(ResetPasswordConfirmUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IResetPasswordRepository;
  let http: jest.Mocked<IHttpAdapter>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            APPS: { USER: { HOST: 'https://github.com/', PORT: 3000 } }
          } as Partial<ISecretsAdapter>
        },
        {
          provide: IHttpAdapter,
          useValue: {
            instance: jest.fn()
          }
        },
        {
          provide: ITokenAdapter,
          useValue: {
            verify: TestUtils.mockReturnValue<ResetPasswordConfirmVerify>({ id: TestUtils.getMockUUID() })
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
            http: IHttpAdapter,
            secret: ISecretsAdapter
          ) => {
            return new ResetPasswordConfirmUsecase(repository, token, event, http, secret);
          },
          inject: [IResetPasswordRepository, ITokenAdapter, IEventAdapter, IHttpAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IResetPasswordRepository);
    http = app.get(IHttpAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as ResetPasswordConfirmInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('token') },
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('password') },
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('confirmPassword') }
        ]);
      }
    );
  });

  test('when password are differents, should expect an error', async () => {
    await expect(usecase.execute({ confirmPassword: '123456', password: '1234567', token: '111' })).rejects.toThrow(
      ApiBadRequestException
    );
  });

  const input: ResetPasswordConfirmInput = { confirmPassword: '123456', password: '123456', token: 'token' };

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })],
    password: { id: TestUtils.getMockUUID(), password: '****' }
  });

  test('when user not found, should expect an error', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity | null }>({ data: null })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when token was expired, should expect an error', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException);
  });

  const defaultResetPassword = new ResetPasswordEntity({ id: TestUtils.getMockUUID(), token: 'token', user });
  test('when confirm successfully, should expect a void', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user }),
        post: TestUtils.mockResolvedValue<CreatedModel | null>(null)
      } as Partial<Axios> as Axios;
    });
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(defaultResetPassword);
    repository.remove = TestUtils.mockResolvedValue<RemovedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });
});
