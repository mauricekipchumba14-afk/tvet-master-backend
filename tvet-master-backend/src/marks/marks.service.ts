import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarksService {
  constructor(private prisma: PrismaService) {}

  createAssessment(trainerId: string, data: {
    unitId: string; classId: string; type: any; title: string;
    maxScore: number; weightPercent: number; date: Date;
  }) {
    // A trainer may only create assessments for units/classes they're assigned to.
    return this.assertAssignedThenRun(trainerId, data.unitId, data.classId, () =>
      this.prisma.assessment.create({ data: { ...data, trainerId } }),
    );
  }

  async enterMarks(trainerId: string, assessmentId: string, entries: { studentId: string; score: number }[]) {
    const assessment = await this.prisma.assessment.findUniqueOrThrow({ where: { id: assessmentId } });
    if (assessment.trainerId !== trainerId) {
      throw new ForbiddenException('You can only enter marks for your own assessments');
    }
    return this.prisma.$transaction(
      entries.map((e) =>
        this.prisma.mark.upsert({
          where: { assessmentId_studentId: { assessmentId, studentId: e.studentId } },
          update: { score: e.score, enteredById: trainerId },
          create: { assessmentId, studentId: e.studentId, score: e.score, enteredById: trainerId },
        }),
      ),
    );
  }

  // A student may only ever see their own results.
  myResults(studentId: string) {
    return this.prisma.mark.findMany({
      where: { studentId },
      include: { assessment: { include: { unit: true } } },
    });
  }

  classResults(classId: string) {
    return this.prisma.mark.findMany({
      where: { assessment: { classId } },
      include: { assessment: true, student: { include: { user: true } } },
    });
  }

  private async assertAssignedThenRun<T>(trainerId: string, unitId: string, classId: string, fn: () => Promise<T>): Promise<T> {
    const assignment = await this.prisma.unitAssignment.findFirst({ where: { trainerId, unitId, classId } });
    if (!assignment) throw new ForbiddenException('You are not assigned to this unit/class');
    return fn();
  }
}
