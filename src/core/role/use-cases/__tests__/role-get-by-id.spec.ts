import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { IRoleRepository } from '../../repository/role';
import { RoleGetByIdInput, RoleGetByIdUsecase } from '../role-get-by-id';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleGetByIdUsecase.name, () => {
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
            return new RoleGetByIdUsecase(roleRepository);
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
      () => usecase.execute({} as RoleGetByIdInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Required',
            path: TestUtils.nameOf<RoleGetByIdInput>('id')
          }
        ]);
      }
    );
  });

  const input: RoleGetByIdInput = {
    id: TestUtils.getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({
    id: TestUtils.getMockUUID(),
    name: RoleEnum.USER
  });

  test('when role found, should expect a role found', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(role);

    await expect(usecase.execute(input)).resolves.toEqual(role);
  });
});
