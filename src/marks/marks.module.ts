import { Module } from '@nestjs/common';
import { MarksService } from './marks.service';
import { MarksController } from './marks.controller';

@Module({
  providers: [MarksService],
  controllers: [MarksController],
})
export class MarksModule {}
