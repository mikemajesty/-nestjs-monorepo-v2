import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ApiConflictException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { PermissionEntity } from '../../entity/permission';
import { IPermissionRepository } from '../../repository/permission';
import { PermissionCreateInput, PermissionCreateUsecase } from '../permission-create';

describe(PermissionCreateUsecase.name, () => {
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
          provide: ILoggerAdapter,
          useValue: {
            info: TestUtils.mockReturnValue<void>()
          }
        },
        {
          provide: IUsecase,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionCreateUsecase(permissionRepository, logger);
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionCreateInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<PermissionCreateInput>('name')
          }
        ]);
      }
    );
  });

  const input: PermissionCreateInput = {
    name: 'name:permission'
  };

  const output: PermissionEntity = new PermissionEntity({
    id: TestUtils.getMockUUID(),
    name: input.name
  });

  test('when permission exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(output);

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when permission created successfully, should expect a permission created', async () => {
    repository.create = TestUtils.mockResolvedValue<CreatedModel>({
      created: true,
      id: TestUtils.getMockUUID()
    });
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).resolves.toBeInstanceOf(PermissionEntity);
  });
});
