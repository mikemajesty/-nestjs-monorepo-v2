import { Module } from '@nestjs/common';

import { HealthController } from './controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: []
})
export class HealthModule {}
