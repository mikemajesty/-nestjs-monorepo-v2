import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserSearchUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UserSearchInput): Promise<UserSearchOutput> {
    const user = await this.userRepository.findOneWithRelation(input, { password: true });
    return user;
  }
}

export type UserSearchInput = Partial<UserEntity>;
export type UserSearchOutput = UserEntity;
