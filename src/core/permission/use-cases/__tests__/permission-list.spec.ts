import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import {
  PermissionListInput,
  PermissionListOutput,
  PermissionListUsecase
} from '@/core/permission/use-cases/permission-list';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity } from './../../entity/permission';

describe(PermissionListUsecase.name, () => {
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
            return new PermissionListUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IPermissionRepository);
  });

  test('when sort input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionListInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<PermissionListInput>('search')
          }
        ]);
      }
    );
  });

  const input: PermissionListInput = {
    limit: 1,
    page: 1,
    search: {},
    sort: { createdAt: -1 }
  };

  const permission = new PermissionEntity({
    id: TestUtils.getMockUUID(),
    name: 'name:permission',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const permissions = [permission];

  test('when permission are found, should expect an permission list', async () => {
    const output: PermissionListOutput = {
      docs: [permission],
      page: 1,
      limit: 1,
      total: 1
    };
    repository.paginate = TestUtils.mockResolvedValue<PermissionListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: permissions,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when permission not found, should expect an empty list', async () => {
    const output: PermissionListOutput = {
      docs: [],
      page: 1,
      limit: 1,
      total: 1
    };
    repository.paginate = TestUtils.mockResolvedValue<PermissionListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
