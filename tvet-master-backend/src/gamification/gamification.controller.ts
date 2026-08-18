import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/gamification')
export class GamificationController {
  constructor(private gamification: GamificationService) {}

  @Get('leaderboard')
  leaderboard(@Query('scope') scope: any, @Query('id') id: string, @Query('period') period: any) {
    return this.gamification.recomputeLeaderboard(scope, id, period);
  }
}
