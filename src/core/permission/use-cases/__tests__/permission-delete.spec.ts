import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { PermissionDeleteInput, PermissionDeleteUsecase } from '@/core/permission/use-cases/permission-delete';
import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UpdatedModel } from '@/infra/repository';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity } from './../../entity/permission';

describe(PermissionDeleteUsecase.name, () => {
  let usecase: IUsecase;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionDeleteUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionDeleteInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<PermissionDeleteInput>('id')
          }
        ]);
      }
    );
  });

  const input: PermissionDeleteInput = {
    id: TestUtils.getMockUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when permission has association with role, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>({
      roles: [{ name: RoleEnum.BACKOFFICE } as RoleEntity]
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  const permission = new PermissionEntity({
    id: TestUtils.getMockUUID(),
    name: 'name:permission'
  });

  test('when permission deleted successfully, should expect a permission deleted', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(permission);
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...permission,
      deletedAt: expect.any(Date)
    });
  });
});
