import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { TokenLibModule } from '@/libs/token';
import { TestUtils } from '@/utils/tests';
import { IUsecase } from '@/utils/usecase';

import { LogoutInput, LogoutUsecase } from '../user-logout';

describe(LogoutUsecase.name, () => {
  let usecase: IUsecase;
  let cache: ICacheAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule, SecretsModule],
      providers: [
        {
          provide: ICacheAdapter,
          useValue: {
            set: TestUtils.mockResolvedValue<void>()
          }
        },
        {
          provide: IUsecase,
          useFactory: (cache: ICacheAdapter, secrets: ISecretsAdapter) => {
            return new LogoutUsecase(cache, secrets);
          },
          inject: [ICacheAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUsecase);
    cache = app.get(ICacheAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as LogoutInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<LogoutInput>('token') }]);
      }
    );
  });

  test('when user logout, should expect set token to blacklist', async () => {
    cache.set = TestUtils.mockResolvedValue<void>();

    await expect(usecase.execute({ token: '12345678910' })).resolves.toBeUndefined();
  });
});
