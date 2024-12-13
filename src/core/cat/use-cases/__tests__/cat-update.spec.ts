import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { UpdatedModel } from '@/infra/repository';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatUpdateInput, CatUpdateUsecase } from '../cat-update';

describe(CatUpdateUsecase.name, () => {
  let usecase: IUsecase;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: ILoggerAdapter,
          useValue: {
            info: jest.fn()
          }
        },
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (catRepository: ICatRepository, logger: ILoggerAdapter) => {
            return new CatUpdateUsecase(catRepository, logger);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatUpdateInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<CatUpdateInput>('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat updated successfully, should expect a cat updated', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(cat);
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>();

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(cat);
  });
});
