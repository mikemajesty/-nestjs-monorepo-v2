import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
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
  let userRepository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            HOST: 'localhost'
          }
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
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter,
            secret: ISecretsAdapter
          ) => {
            return new ResetPasswordSendEmailUsecase(repository, userRepository, token, event, secret);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IResetPasswordRepository);
    userRepository = app.get(IUserRepository);
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
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(null);

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
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(resetPassword);

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });

  test('when token was not founded, should expect void', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });
});
