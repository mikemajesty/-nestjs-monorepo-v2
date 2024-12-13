import { z } from 'zod';

import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';

import { CatEntity, CatEntitySchema } from '../entity/cat';
import { ICatRepository } from '../repository/cat';

export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: UUIDUtils.create(), ...input });

    const created = await this.catRepository.create(entity);

    return created;
  }
}

export type CatCreateInput = z.infer<typeof CatCreateSchema>;
export type CatCreateOutput = CreatedModel;
