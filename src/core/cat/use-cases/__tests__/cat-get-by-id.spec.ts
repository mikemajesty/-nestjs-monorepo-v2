import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatGetByIdInput, CatGetByIdUsecase } from '../cat-get-by-id';

describe(CatGetByIdUsecase.name, () => {
  let usecase: IUsecase;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: IUsecase,
          useFactory: (catRepository: ICatRepository) => {
            return new CatGetByIdUsecase(catRepository);
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
      () => usecase.execute({} as CatGetByIdInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<CatGetByIdInput>('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    name: 'Miau',
    breed: 'dummy',
    age: 10
  });

  test('when cat found, should expect a cat found', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(cat);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(cat);
  });
});
