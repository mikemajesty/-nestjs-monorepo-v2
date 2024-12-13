import { PermissionEntity } from '@/core/permission/entity/permission';
import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { UserChangePasswordInput } from '@/core/user/use-cases/user-change-password';
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput } from '@/core/user/use-cases/user-update';
import { CreatedModel } from '@/infra/repository';
import { Swagger } from '@/utils/docs/swagger';
import { UserRequest } from '@/utils/request';
import { TestUtils } from '@/utils/tests';

const BASE_URL = `api/v1/users`;

const entity = {
  id: TestUtils.getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  roles: [
    new RoleEntity({
      id: TestUtils.getMockUUID(),
      name: RoleEnum.USER,
      permissions: [
        new PermissionEntity({
          id: TestUtils.getMockUUID(),
          name: 'permission:create'
        })
      ]
    })
  ]
} as UserEntity;

const fullEntity = {
  ...entity,
  createdAt: TestUtils.getMockDate(),
  updatedAt: TestUtils.getMockDate(),
  deletedAt: null
} as UserEntity;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON<CreatedModel>({
      status: 200,
      json: { created: true, id: TestUtils.getMockUUID() } as UserCreateOutput,
      description: 'user created.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
      message: 'userExists',
      description: 'user exists.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON<UserEntity>({
      status: 200,
      json: { ...fullEntity, deletedAt: TestUtils.getMockDate() } as UserDeleteOutput,
      description: 'user updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'userNotFound',
      description: 'user not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
      message: 'userExists',
      description: 'user exists.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON<UserEntity>({
      status: 200,
      json: fullEntity as UserGetByIdOutput,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  changePassword: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'change password successfully.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/change-password/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    }),
    400: Swagger.defaultResponseWithMultiplesError({
      status: 400,
      route: `${BASE_URL}/change-password/:id`,
      messages: {
        'password is incorrect': { description: 'password is incorrect', value: ['passwordIsIncorrect'] },
        'password is different': { description: 'new password is different', value: ['passwordIsDifferent'] }
      },
      description: 'change password.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON<UserEntity>({
      status: 200,
      json: { ...fullEntity, deletedAt: TestUtils.getMockDate() } as UserDeleteOutput,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  me: {
    200: Swagger.defaultResponseJSON<UserRequest>({
      status: 200,
      json: { email: 'admin@admin.com', name: 'ADMIN', id: TestUtils.getMockUUID() } as UserRequest,
      description: 'user jwt data.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON<UserListOutput>({
      status: 200,
      json: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as UserListOutput,
      description: 'user created.'
    }),
    400: Swagger.defaultPaginateExceptions({ url: BASE_URL })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON<UserCreateInput>({
    name: 'Admin',
    email: 'admin@admin.com',
    password: '*****',
    roles: [RoleEnum.USER]
  } as UserCreateInput),
  update: Swagger.defaultRequestJSON<UserUpdateInput>({
    name: 'Admin',
    email: 'admin@admin.com',
    roles: [RoleEnum.USER]
  } as UserUpdateInput),
  changePassword: Swagger.defaultRequestJSON<UserChangePasswordInput>({
    password: '**',
    confirmPassword: '***',
    newPassword: '***'
  } as UserChangePasswordInput),
  list: Swagger.defaultRequestListJSON()
};
