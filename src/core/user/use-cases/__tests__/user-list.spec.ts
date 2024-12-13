import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserListInput, UserListOutput, UserListUsecase } from '../user-list';

describe(UserListUsecase.name, () => {
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
            return new UserListUsecase(userRepository);
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
      () => usecase.execute({} as UserListInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<UserListInput>('search')
          }
        ]);
      }
    );
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
  });

  const users = [
    {
      ...user,
      createdAt: TestUtils.getMockDate(),
      updatedAt: TestUtils.getMockDate(),
      deletedAt: null
    } as UserEntity
  ];

  test('when users are found, should expect an user list', async () => {
    const output = { docs: users, page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<UserListOutput>(output);

    await expect(
      usecase.execute({
        limit: 1,
        page: 1,
        search: {},
        sort: { createdAt: -1 }
      })
    ).resolves.toEqual({
      docs: users,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when users not found, should expect an empty list', async () => {
    const output: UserListOutput = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<UserListOutput>(output);

    await expect(
      usecase.execute({
        limit: 1,
        page: 1,
        search: {},
        sort: { createdAt: -1 }
      })
    ).resolves.toEqual(output);
  });
});
