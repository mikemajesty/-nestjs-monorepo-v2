export abstract class IUsecase {
  abstract execute(...input: unknown[]): Promise<unknown>;
}
