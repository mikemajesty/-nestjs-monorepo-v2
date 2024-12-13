import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout';
import { IUsecase } from '@/utils/usecase';

export abstract class ILogoutAdapter implements IUsecase {
  abstract execute(input: LogoutInput): Promise<LogoutOutput>;
}
