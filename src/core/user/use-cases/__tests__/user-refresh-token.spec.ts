import { Test } from '@nestjs/testing';
import { Axios } from 'axios';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { ITokenAdapter, SignOutput } from '@/libs/token';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import {
  RefreshTokenInput,
  RefreshTokenOutput,
  RefreshTokenUsecase,
  UserRefreshTokenVerifyInput
} from '../user-refresh-token';

describe(RefreshTokenUsecase.name, () => {
  let usecase: IUsecase;
  let http: jest.Mocked<IHttpAdapter>;
  let token: ITokenAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: ISecretsAdapter,
          useValue: {
            APPS: { USER: { HOST: 'https://github.com/', PORT: 3000 } }
          } as Partial<ISecretsAdapter> as ISecretsAdapter
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
            verify: TestUtils.mockResolvedValue<UserRefreshTokenVerifyInput>()
          }
        },
        {
          provide: IUsecase,
          useFactory: (tokenService: ITokenAdapter, http: IHttpAdapter, secret: ISecretsAdapter) => {
            return new RefreshTokenUsecase(tokenService, http, secret);
          },
          inject: [ITokenAdapter, IHttpAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    http = app.get(IHttpAdapter);
    token = app.get(ITokenAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RefreshTokenInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<RefreshTokenInput>('refreshToken')
          }
        ]);
      }
    );
  });

  const input: RefreshTokenInput = { refreshToken: '<token>' };
  test('when token is incorrect, should expect an error', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      id: null
    }));
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity | null }>({ data: null })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiBadRequestException);
  });

  test('when user not found, should expect an error', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        id: TestUtils.getMockUUID()
      };
    });
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
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        id: TestUtils.getMockUUID()
      };
    });
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: new UserEntity({ ...user, roles: [] }) })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when user refresh token successfully, should expect a token', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      id: TestUtils.getMockUUID()
    }));
    token.sign = TestUtils.mockReturnValue<SignOutput>({ token: '<token>' });
    user.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820';
    http.instance.mockImplementation(() => {
      return {
        get: TestUtils.mockResolvedValue<{ data: UserEntity }>({ data: user })
      } as Partial<Axios> as Axios;
    });

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as RefreshTokenOutput);
  });
});
