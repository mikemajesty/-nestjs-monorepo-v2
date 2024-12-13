import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteInput, UserDeleteUsecase } from '../user-delete';

describe(UserDeleteUsecase.name, () => {
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
            return new UserDeleteUsecase(userRepository);
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
      () => usecase.execute({ id: 'uuid' } as UserDeleteInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid uuid',
            path: TestUtils.nameOf<UserDeleteInput>('id')
          }
        ]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: '*Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })],
    password: { id: TestUtils.getMockUUID(), password: '****' }
  });

  test('when user deleted successfully, should expect an user deleted.', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.softRemove = TestUtils.mockResolvedValue<UserEntity>();

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(expect.any(UserEntity));
    expect(repository.softRemove).toHaveBeenCalled();
  });
});
