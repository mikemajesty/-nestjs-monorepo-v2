import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionGetByIdInput, PermissionGetByIdUsecase } from '../permission-get-by-id';
import { PermissionEntity } from './../../entity/permission';

describe(PermissionGetByIdUsecase.name, () => {
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
            return new PermissionGetByIdUsecase(permissionRepository);
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
      () => usecase.execute({} as PermissionGetByIdInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<PermissionGetByIdInput>('id')
          }
        ]);
      }
    );
  });

  const input: PermissionGetByIdInput = {
    id: TestUtils.getMockUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permission = new PermissionEntity({
    id: TestUtils.getMockUUID(),
    name: 'name:permission'
  });

  test('when permission found, should expect a permission found', async () => {
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(permission);

    await expect(usecase.execute(input)).resolves.toEqual(permission);
  });
});
