import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuizzesService } from './quizzes.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1')
export class QuizzesController {
  constructor(private quizzes: QuizzesService) {}

  @Post('question-bank')
  @Roles('trainer' as any)
  addQuestion(@Req() req, @Body() body: any) {
    return this.quizzes.addQuestion(body.unitId, req.user.userId, body);
  }

  @Post('quizzes')
  @Roles('trainer' as any)
  createQuiz(@Req() req, @Body() body: any) {
    return this.quizzes.createQuiz(req.user.userId, body);
  }

  @Post('quizzes/:id/attempt')
  @Roles('student' as any)
  startAttempt(@Req() req, @Param('id') quizId: string) {
    return this.quizzes.startAttempt(req.user.userId, quizId);
  }

  @Post('quizzes/attempts/:attemptId/submit')
  @Roles('student' as any)
  submit(@Param('attemptId') attemptId: string, @Body() body: { answers: any[] }) {
    return this.quizzes.submitAttempt(attemptId, body.answers);
  }
}
