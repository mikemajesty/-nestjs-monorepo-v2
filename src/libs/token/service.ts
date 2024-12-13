import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { ISecretsAdapter } from '@/infra/secrets';
import { ApiUnauthorizedException } from '@/utils/exception';

import { ITokenAdapter } from './adapter';

export const TokenGetSchema = z.object({
  email: z.string().email(),
  roles: z.string(),
  password: z.string()
});

@Injectable()
export class TokenService implements ITokenAdapter {
  constructor(private readonly secret: ISecretsAdapter) {}

  sign<TOpt = jwt.SignOptions>(model: SignInput, options?: TOpt): SignOutput {
    const token = jwt.sign(
      model,
      this.secret.JWT_SECRET_KEY,
      options || {
        expiresIn: this.secret.TOKEN_EXPIRATION as string
      }
    );

    return { token };
  }

  async verify<T>(token: string): Promise<T> {
    return new Promise((res, rej) => {
      jwt.verify(token, this.secret.JWT_SECRET_KEY, (error, decoded) => {
        if (error) rej(new ApiUnauthorizedException(error.message));

        res(decoded as T);
      });
    });
  }
}

export type SignInput = z.infer<typeof TokenGetSchema>;

export type SignOutput = {
  token: string;
};
