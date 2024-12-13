import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { RoleDeleteInput, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete';
import { UpdatedModel } from '@/infra/repository';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleDeleteUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleDeleteUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleDeleteInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<RoleDeleteInput>('id')
          }
        ]);
      }
    );
  });

  const input: RoleDeleteInput = {
    id: TestUtils.getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when role has association with permission, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>({
      permissions: [{ name: 'create:cat' } as PermissionEntity]
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  const role = new RoleEntity({
    id: TestUtils.getMockUUID(),
    name: RoleEnum.USER
  });

  test('when role deleted successfully, should expect a role deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(role);
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...role,
      deletedAt: expect.any(Date)
    });
  });
});
