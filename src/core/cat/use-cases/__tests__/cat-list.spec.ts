import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { CatListInput, CatListOutput, CatListUsecase } from '@/core/cat/use-cases/cat-list';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';

describe(CatListUsecase.name, () => {
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
            return new CatListUsecase(catRepository);
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
      () => usecase.execute({} as CatListInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<CatListInput>('search') }]);
      }
    );
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy',
    createdAt: TestUtils.getMockDate(),
    updatedAt: TestUtils.getMockDate(),
    deletedAt: null
  });

  const cats = [cat];

  test('when cats are found, should expect an user list', async () => {
    const output = { docs: cats, page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: cats,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when cats not found, should expect an empty list', async () => {
    const output = { docs: [{} as CatEntity], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(output);
  });
});
