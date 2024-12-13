import { z } from 'zod';

import { UserEntity } from '@/core/user/entity/user';
import { UserPasswordEntity } from '@/core/user/entity/user-password';
import { SendEmailInput } from '@/infra/email';
import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { IResetPasswordRepository } from '../repository/reset-password';

export const ResetPasswordConfirmSchema = z.object({
  token: z.string(),
  password: z.string().min(5).max(200),
  confirmPassword: z.string().min(5).max(200)
});

export class ResetPasswordConfirmUsecase implements IUsecase {
  constructor(
    private readonly resetPasswordTokenRepository: IResetPasswordRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter,
    private readonly http: IHttpAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  @ValidateSchema(ResetPasswordConfirmSchema)
  async execute(input: ResetPasswordConfirmInput): Promise<ResetPasswordConfirmOutput> {
    const samePassword = input.password === input.confirmPassword;

    if (!samePassword) {
      throw new ApiBadRequestException('passwords are different');
    }

    const token = await this.token.verify<ResetPasswordConfirmVerify>(input.token);

    const { data: user } = await this.http
      .instance()
      .get<UserEntity>(`${this.secret.APPS.USER.HOST}/api/vi/users/find-by?id=${token.id}`);

    if (!user) {
      throw new ApiNotFoundException('user not found');
    }

    const resetPasswordToken = await this.resetPasswordTokenRepository.findByIdUserId(user.id);

    if (!resetPasswordToken) {
      throw new ApiUnauthorizedException('token was expired');
    }

    const passwordEntity = new UserPasswordEntity(user.password);

    passwordEntity.createPassword();

    await this.http.instance().post(`${this.secret.APPS.USER.HOST}/api/vi/users`, user);
    // await this.userRepository.create(user);

    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Password has been changed successfully',
      template: 'reset-password',
      payload: { name: user.name }
    });

    await this.resetPasswordTokenRepository.remove({ userId: user.id });
  }
}

export type ResetPasswordConfirmInput = z.infer<typeof ResetPasswordConfirmSchema>;
export type ResetPasswordConfirmOutput = void;

export type ResetPasswordConfirmVerify = {
  id: string;
};
