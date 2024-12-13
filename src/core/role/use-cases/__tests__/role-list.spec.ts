import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleListInput, RoleListOutput, RoleListUsecase } from '@/core/role/use-cases/role-list';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleListUsecase.name, () => {
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
            return new RoleListUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(IRoleRepository);
  });

  test('when sort input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleListInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<RoleListInput>('search')
          }
        ]);
      }
    );
  });

  const input: RoleListInput = {
    limit: 1,
    page: 1,
    search: {},
    sort: { createdAt: -1 }
  };

  const role = new RoleEntity({
    id: TestUtils.getMockUUID(),
    name: RoleEnum.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  test('when role are found, should expect an role list', async () => {
    const output: RoleListOutput = {
      docs: [role],
      page: 1,
      limit: 1,
      total: 1
    };
    repository.paginate = TestUtils.mockResolvedValue<RoleListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: [role],
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when role not found, should expect an empty list', async () => {
    const output: RoleListOutput = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<RoleListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
