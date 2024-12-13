import { z } from 'zod';

import { ICatRepository } from '@/core/cat/repository/cat';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { CatEntity, CatEntitySchema } from '../entity/cat';

export const CatDeleteSchema = CatEntitySchema.pick({
  id: true
});

export class CatDeleteUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatDeleteSchema)
  async execute({ id }: CatDeleteInput): Promise<CatDeleteOutput> {
    const cat = await this.catRepository.findById(id);

    if (!cat) {
      throw new ApiNotFoundException();
    }

    const entity = new CatEntity(cat);

    entity.deactivated();

    await this.catRepository.updateOne({ id: entity.id }, entity);

    return entity;
  }
}

export type CatDeleteInput = z.infer<typeof CatDeleteSchema>;
export type CatDeleteOutput = CatEntity;
