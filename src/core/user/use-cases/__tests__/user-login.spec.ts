import { Test } from '@nestjs/testing';
import { Axios } from 'axios';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import { LoginInput, LoginOutput, LoginUsecase } from '../user-login';

describe(LoginUsecase.name, () => {
  let usecase: IUsecase;
  let http: jest.Mocked<IHttpAdapter>;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule],
      providers: [
        {
          provide: IHttpAdapter,
          useValue: {
            instance: jest.fn()
          }
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            APPS: { USER: { HOST: 'https://github.com' } }
          } as Partial<ISecretsAdapter>
        },
        {
          provide: IUsecase,
          useFactory: (tokenService: ITokenAdapter, http: IHttpAdapter, secret: ISecretsAdapter) => {
            return new LoginUsecase(tokenService, http, secret);
          },
          inject: [ITokenAdapter, IHttpAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    http = app.get(IHttpAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as LoginInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<LoginInput>('email') },
          {
            message: 'Required',
            path: TestUtils.nameOf<LoginInput>('password')
          }
        ]);
      }
    );
  });

  const input: LoginInput = { email: 'admin@admin.com', password: '****' };
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
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })],
    password: { id: TestUtils.getMockUUID(), password: '***' }
  });

  test('when user role not found, should expect an error', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: new UserEntity({ ...user, roles: [] }) })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when password is incorrect, should expect an error', async () => {
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiBadRequestException);
  });

  test('when user login successfully, should expect a token', async () => {
    user.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820';
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as LoginOutput);
  });
});
