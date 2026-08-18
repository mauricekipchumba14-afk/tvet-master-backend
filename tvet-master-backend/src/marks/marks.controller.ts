import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MarksService } from './marks.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1')
export class MarksController {
  constructor(private marks: MarksService) {}

  @Post('trainer/assessments')
  @Roles('trainer' as any)
  createAssessment(@Req() req, @Body() body: any) {
    return this.marks.createAssessment(req.user.userId, body);
  }

  @Post('trainer/assessments/:id/marks')
  @Roles('trainer' as any)
  enterMarks(@Req() req, @Param('id') assessmentId: string, @Body() body: { entries: { studentId: string; score: number }[] }) {
    return this.marks.enterMarks(req.user.userId, assessmentId, body.entries);
  }

  @Get('student/results')
  @Roles('student' as any)
  myResults(@Req() req) {
    return this.marks.myResults(req.user.userId);
  }

  @Get('classes/:id/results')
  @Roles('institution_admin' as any, 'hod' as any, 'registrar' as any)
  classResults(@Param('id') classId: string) {
    return this.marks.classResults(classId);
  }
}
