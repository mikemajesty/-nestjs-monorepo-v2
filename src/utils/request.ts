import { AxiosInstance, AxiosRequestConfig } from 'axios';

import { UserEntity } from '@/core/user/entity/user';

export type TracingType = {
  tracerId: string;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
};

export type UserRequest = UserEntity;

export interface ApiRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly tracing: TracingType;
  readonly user: UserRequest;
  readonly params: { [key: string]: string | number };
  readonly query: { [key: string]: string | number };
  readonly headers: Headers & { authorization: string };
  readonly url: string;
  readonly files: {
    buffer: Buffer;
    encoding: string;
    fieldname: string;
    mimetype: string;
    originalname: string;
    size: number;
  }[];
}
