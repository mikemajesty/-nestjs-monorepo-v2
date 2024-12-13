import { PermissionEntity } from '@/core/permission/entity/permission';
import { PermissionCreateInput, PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateInput } from '@/core/permission/use-cases/permission-update';
import { Swagger } from '@/utils/docs/swagger';
import { TestUtils } from '@/utils/tests';

const BASE_URL = 'api/v1/permissions';

const permission = {
  id: TestUtils.getMockUUID(),
  name: 'name',
  createdAt: TestUtils.getMockDate(),
  deletedAt: null,
  updatedAt: TestUtils.getMockDate()
} as PermissionEntity;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON<PermissionEntity>({
      status: 200,
      json: {
        name: 'name:permission',
        id: TestUtils.getMockUUID()
      } as PermissionCreateOutput,
      description: 'create permission.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
      message: 'permissionExists',
      description: 'permission exists.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON<PermissionEntity>({
      status: 200,
      json: permission,
      description: 'update permission.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON<PermissionEntity>({
      status: 200,
      json: permission,
      description: 'permission found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON<PermissionEntity>({
      status: 200,
      json: {
        ...permission,
        deletedAt: TestUtils.getMockDate()
      } as PermissionEntity,
      description: 'delete permission.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'permissionNotFound',
      description: 'permission not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: `${BASE_URL}/:id`,
      message: 'permissionHasAssociationWithRole: [roleName]',
      description: 'permission has association with role.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON<PermissionListOutput>({
      status: 200,
      json: {
        docs: [permission],
        limit: 10,
        page: 1,
        total: 10
      } as PermissionListOutput,
      description: 'list permission.'
    }),
    400: Swagger.defaultPaginateExceptions({ url: BASE_URL })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON<PermissionCreateInput>({
    name: 'Admin'
  } as PermissionCreateInput),
  update: Swagger.defaultRequestJSON<PermissionUpdateInput>({
    name: 'Admin'
  } as PermissionUpdateInput),
  list: Swagger.defaultRequestListJSON()
};
