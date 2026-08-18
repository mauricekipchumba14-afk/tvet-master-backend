import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Handles the core structural tree: departments -> courses -> units -> classes -> intakes.
// Every method is scoped by institutionId so one institution never sees another's structure.
@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  createDepartment(institutionId: string, name: string, code?: string) {
    return this.prisma.department.create({ data: { institutionId, name, code } });
  }

  listDepartments(institutionId: string) {
    return this.prisma.department.findMany({ where: { institutionId }, include: { courses: true } });
  }

  createCourse(departmentId: string, name: string, level: any, durationYears: number) {
    return this.prisma.course.create({ data: { departmentId, name, level, durationYears } });
  }

  createUnit(courseId: string, unitCode: string, unitName: string, semester: number, creditHours: number) {
    return this.prisma.unit.create({ data: { courseId, unitCode, unitName, semester, creditHours } });
  }

  createIntake(institutionId: string, name: string, startDate: Date, endDate: Date) {
    return this.prisma.intake.create({ data: { institutionId, name, startDate, endDate } });
  }

  createClass(courseId: string, intakeId: string, name: string, yearOfStudy: number) {
    return this.prisma.class.create({ data: { courseId, intakeId, name, yearOfStudy } });
  }

  assignTrainer(unitId: string, classId: string, trainerId: string) {
    return this.prisma.unitAssignment.create({ data: { unitId, classId, trainerId } });
  }

  // Units + classes a specific trainer is allowed to touch — this is the
  // list every trainer-facing endpoint should filter against.
  trainerUnits(trainerId: string) {
    return this.prisma.unitAssignment.findMany({
      where: { trainerId },
      include: { unit: true, class: true },
    });
  }
}
