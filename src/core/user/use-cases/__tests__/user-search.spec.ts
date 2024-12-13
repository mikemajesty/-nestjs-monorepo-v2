import { Test } from '@nestjs/testing';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { RoleEntity } from '@/core/role/entity/role';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserSearchInput, UserSearchUsecase } from '../user-search';

describe(UserSearchUsecase.name, () => {
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
            return new UserSearchUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IUserRepository);
  });

  test('when search successfully, should expect an user', async () => {
    const user = {
      id: TestUtils.getMockUUID(),
      email: 'email@email.com',
      name: 'Name',
      roles: [
        new RoleEntity({
          id: TestUtils.getMockUUID(),
          name: 'Role',
          permissions: [new PermissionEntity({ id: TestUtils.getMockUUID(), name: 'permission:create' })]
        })
      ]
    };
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user);
    await expect(usecase.execute({} as UserSearchInput)).resolves.toEqual(user);
  });
});
