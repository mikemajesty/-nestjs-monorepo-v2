import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { RoleAddPermissionInput } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateInput, RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleDeletePermissionInput } from '@/core/role/use-cases/role-delete-permission';
import { RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateInput, RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { CreatedModel } from '@/infra/repository';
import { Swagger } from '@/utils/docs/swagger';
import { TestUtils } from '@/utils/tests';

const BASE_URL = 'api/v1/roles';

const role = {
  id: TestUtils.getMockUUID(),
  name: RoleEnum.USER,
  createdAt: TestUtils.getMockDate(),
  deletedAt: null,
  updatedAt: TestUtils.getMockDate()
} as RoleEntity;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON<CreatedModel>({
      status: 200,
      json: {
        created: true,
        id: TestUtils.getMockUUID()
      } as RoleCreateOutput,
      description: 'create role.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON<RoleEntity>({
      status: 200,
      json: role as RoleUpdateOutput,
      description: 'update role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON<RoleEntity>({
      status: 200,
      json: role,
      description: 'get role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON<RoleEntity>({
      status: 200,
      json: {
        ...role,
        deletedAt: TestUtils.getMockDate()
      } as RoleDeleteOutput,
      description: 'delete role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: `${BASE_URL}/:id`,
      message: 'roleHasAssociationWithPermission: [permissionName]',
      description: 'role has association with permission.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON<RoleListOutput>({
      status: 200,
      json: {
        docs: [role],
        limit: 10,
        page: 1,
        total: 10
      } as RoleListOutput,
      description: 'list role.'
    }),
    400: Swagger.defaultPaginateExceptions({ url: BASE_URL })
  },
  removePermissions: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'remove permission from role'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/remove-permissions/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  addPermissions: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'add permission to role'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/add-permissions/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON<RoleCreateInput>({
    name: RoleEnum.USER
  } as RoleCreateInput),
  update: Swagger.defaultRequestJSON<RoleUpdateInput>({
    name: RoleEnum.USER
  } as RoleUpdateInput),
  list: Swagger.defaultRequestListJSON(),
  addPermission: Swagger.defaultRequestJSON<RoleAddPermissionInput>({
    permissions: ['permission']
  } as RoleAddPermissionInput),
  deletePermission: Swagger.defaultRequestJSON<RoleDeletePermissionInput>({
    permissions: ['permission']
  } as RoleDeletePermissionInput)
};
