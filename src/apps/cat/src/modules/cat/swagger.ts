import { CatEntity } from '@/core/cat/entity/cat';
import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create';
import { CatDeleteOutput } from '@/core/cat/use-cases/cat-delete';
import { CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id';
import { CatListOutput } from '@/core/cat/use-cases/cat-list';
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update';
import { Swagger } from '@/utils/docs/swagger';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

const BASE_URL = `api/v1/cats`;

const entity = {
  id: TestUtils.getMockUUID(),
  name: 'Miau',
  breed: 'breed',
  age: 1
} as CatEntity;

const fullEntity = {
  ...entity,
  createdAt: TestUtils.getMockDate(),
  updatedAt: TestUtils.getMockDate(),
  deletedAt: null
} as CatEntity;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON<CatCreateOutput>({
      status: 200,
      json: { created: true, id: TestUtils.getMockUUID() } as CatCreateOutput,
      description: 'create user.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON<CatEntity>({
      status: 200,
      json: fullEntity as CatUpdateOutput,
      description: 'update user.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: ApiNotFoundException.name,
      description: 'cat not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON<CatEntity>({
      status: 200,
      json: fullEntity as CatGetByIdOutput,
      description: 'cat founded.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: ApiNotFoundException.name,
      description: 'cat not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON<CatEntity>({
      status: 200,
      json: { ...fullEntity, deletedAt: TestUtils.getMockDate() } as CatDeleteOutput,
      description: 'cat deleted.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: ApiNotFoundException.name,
      description: 'cat not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON<CatListOutput>({
      status: 200,
      json: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as CatListOutput,
      description: 'cat created.'
    }),
    400: Swagger.defaultPaginateExceptions({ url: BASE_URL })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON<CatCreateInput>({ name: 'miau', breed: 'breed', age: 1 } as CatCreateInput),
  update: Swagger.defaultRequestJSON<CatUpdateInput>({ name: 'miau', breed: 'breed', age: 1 } as CatUpdateInput),
  list: Swagger.defaultRequestListJSON()
};
