import { z } from 'zod';

import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { UserRequest } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { UserPasswordEntity, UserPasswordEntitySchema } from '../entity/user-password';

export const LoginSchema = UserEntitySchema.pick({
  email: true
}).merge(UserPasswordEntitySchema.pick({ password: true }));

export class LoginUsecase implements IUsecase {
  constructor(
    private readonly tokenService: ITokenAdapter,
    private readonly http: IHttpAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput): Promise<LoginOutput> {
    const userURI = `${this.secret.APPS.USER.HOST}/api/v1/users/search?email=${input.email}`;
    const { data: user } = await this.http.instance().get<UserEntity>(userURI);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    if (!user.roles.length) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const passwordEntity = new UserPasswordEntity({
      id: UUIDUtils.create(),
      password: input.password
    });

    passwordEntity.createPassword();

    passwordEntity.verifyPassword(user.password.password);

    const { token } = this.tokenService.sign({
      email: user.email,
      name: user.name,
      id: user.id
    } as UserRequest);

    const { token: refreshToken } = this.tokenService.sign({ userId: user.id });

    return { accessToken: token, refreshToken };
  }
}

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOutput = { accessToken: string; refreshToken: string };
