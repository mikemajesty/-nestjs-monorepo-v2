import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { CreatedModel } from '@/infra/repository';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';

import { RoleEntity, RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleAddPermissionInput, RoleAddPermissionUsecase } from '../role-add-permission';

describe(RoleAddPermissionUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IRoleRepository;
  let permissionRepository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (roleRepository: IRoleRepository, permissionRepository: IPermissionRepository) => {
            return new RoleAddPermissionUsecase(roleRepository, permissionRepository);
          },
          inject: [IRoleRepository, IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IRoleRepository);
    permissionRepository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleAddPermissionInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<RoleAddPermissionInput>('id')
          },
          {
            message: 'Required',
            path: TestUtils.nameOf<RoleAddPermissionInput>('permissions')
          }
        ]);
      }
    );
  });

  const input: RoleAddPermissionInput = {
    id: TestUtils.getMockUUID(),
    permissions: ['user:create', 'user:list']
  };

  test('when role not exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permissions = [
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:create' }),
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:update' })
  ];

  const role = new RoleEntity({
    id: UUIDUtils.create(),
    name: RoleEnum.USER,
    permissions
  });

  test('when delete permission with associated permission successfully, should expect an update permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(role);
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });

  test('when delete permission without associated permission successfully, should expect an update permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>({
      ...role,
      permissions: role.permissions.filter((p) => p.name !== 'user:create')
    });
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
