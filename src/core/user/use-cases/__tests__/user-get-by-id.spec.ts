import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserGetByIdInput, UserGetByIdUsecase } from '../user-get-by-id';

describe(UserGetByIdUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (userRepository: IUserRepository) => {
            return new UserGetByIdUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserGetByIdInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<UserGetByIdInput>('id')
          }
        ]);
      }
    );
  });

  test('when user not found, should expect an errror', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
  });

  test('when user getById successfully, should expect a user', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(user);
  });
});
