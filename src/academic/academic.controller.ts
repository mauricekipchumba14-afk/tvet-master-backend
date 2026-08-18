import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AcademicService } from './academic.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1')
export class AcademicController {
  constructor(private academic: AcademicService) {}

  @Post('departments')
  @Roles('institution_admin' as any)
  createDepartment(@Req() req, @Body() body: { name: string; code?: string }) {
    return this.academic.createDepartment(req.user.institutionId, body.name, body.code);
  }

  @Get('institutions/:id/departments')
  listDepartments(@Param('id') institutionId: string) {
    return this.academic.listDepartments(institutionId);
  }

  @Post('courses')
  @Roles('institution_admin' as any)
  createCourse(@Body() body: { departmentId: string; name: string; level: any; durationYears: number }) {
    return this.academic.createCourse(body.departmentId, body.name, body.level, body.durationYears);
  }

  @Post('units')
  @Roles('institution_admin' as any)
  createUnit(@Body() body: { courseId: string; unitCode: string; unitName: string; semester: number; creditHours: number }) {
    return this.academic.createUnit(body.courseId, body.unitCode, body.unitName, body.semester, body.creditHours);
  }

  @Post('intakes')
  @Roles('institution_admin' as any)
  createIntake(@Req() req, @Body() body: { name: string; startDate: string; endDate: string }) {
    return this.academic.createIntake(req.user.institutionId, body.name, new Date(body.startDate), new Date(body.endDate));
  }

  @Post('classes')
  @Roles('institution_admin' as any)
  createClass(@Body() body: { courseId: string; intakeId: string; name: string; yearOfStudy: number }) {
    return this.academic.createClass(body.courseId, body.intakeId, body.name, body.yearOfStudy);
  }

  @Post('unit-assignments')
  @Roles('institution_admin' as any)
  assignTrainer(@Body() body: { unitId: string; classId: string; trainerId: string }) {
    return this.academic.assignTrainer(body.unitId, body.classId, body.trainerId);
  }

  @Get('trainer/units')
  @Roles('trainer' as any)
  myUnits(@Req() req) {
    return this.academic.trainerUnits(req.user.userId);
  }
}
