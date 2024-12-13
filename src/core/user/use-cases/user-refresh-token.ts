import { z } from 'zod';

import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { UserRequest } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../entity/user';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1)
});

export class RefreshTokenUsecase implements IUsecase {
  constructor(
    private readonly tokenService: ITokenAdapter,
    private readonly http: IHttpAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  @ValidateSchema(RefreshTokenSchema)
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const userToken = await this.tokenService.verify<UserRefreshTokenVerifyInput>(input.refreshToken);

    if (!userToken.id) {
      throw new ApiBadRequestException('incorrectToken');
    }

    const userURI = `${this.secret.APPS.USER.HOST}/api/v1/users/search?id=${userToken.id}`;
    const { data: user } = await this.http.instance().get<UserEntity>(userURI);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    if (!user.roles.length) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const { token } = this.tokenService.sign({
      email: user.email,
      name: user.name,
      id: user.id
    } as UserRequest);

    const { token: refreshToken } = this.tokenService.sign({ userId: user.id });

    return { accessToken: token, refreshToken };
  }
}

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenOutput = { accessToken: string; refreshToken: string };

export type UserRefreshTokenVerifyInput = {
  id: string | null;
};
