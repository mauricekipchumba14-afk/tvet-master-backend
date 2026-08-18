import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  addQuestion(unitId: string, createdById: string, data: any) {
    return this.prisma.questionBankItem.create({ data: { unitId, createdById, ...data } });
  }

  // Builds a quiz by randomly selecting questions from the bank per the
  // requested difficulty mix, e.g. { beginner: 5, intermediate: 3, advanced: 2 }.
  async createQuiz(createdById: string, params: {
    unitId: string; classId: string; title: string;
    difficultyMix: Record<string, number>; timeLimitMinutes: number;
    availableFrom: Date; availableUntil: Date; isRandomized?: boolean;
  }) {
    const questionCount = Object.values(params.difficultyMix).reduce((a, b) => a + b, 0);

    const quiz = await this.prisma.quiz.create({
      data: {
        unitId: params.unitId,
        classId: params.classId,
        createdById,
        title: params.title,
        questionCount,
        difficultyMix: params.difficultyMix,
        timeLimitMinutes: params.timeLimitMinutes,
        isRandomized: params.isRandomized ?? true,
        availableFrom: params.availableFrom,
        availableUntil: params.availableUntil,
      },
    });

    let orderIndex = 0;
    for (const [difficulty, count] of Object.entries(params.difficultyMix)) {
      const pool = await this.prisma.questionBankItem.findMany({
        where: { unitId: params.unitId, difficulty: difficulty as any },
      });
      if (pool.length < count) {
        throw new BadRequestException(`Not enough ${difficulty} questions in bank for this unit`);
      }
      const chosen = shuffle(pool).slice(0, count);
      for (const q of chosen) {
        await this.prisma.quizQuestion.create({
          data: { quizId: quiz.id, questionId: q.id, orderIndex: orderIndex++ },
        });
      }
    }
    return quiz;
  }

  async startAttempt(studentId: string, quizId: string) {
    return this.prisma.quizAttempt.create({ data: { quizId, studentId } });
  }

  async submitAttempt(attemptId: string, answers: { questionId: string; studentAnswer: string }[]) {
    const attempt = await this.prisma.quizAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    let autoScore = 0;

    for (const a of answers) {
      const question = await this.prisma.questionBankItem.findUniqueOrThrow({ where: { id: a.questionId } });
      let isCorrect: boolean | null = null;
      let scoreAwarded: number | null = null;

      // MCQ / true-false auto-grade immediately. Short-answer/structured
      // are left for AI-assisted or manual marking (scoreAwarded stays null).
      if (question.questionType === 'mcq' || question.questionType === 'true_false') {
        isCorrect = question.correctAnswer?.trim().toLowerCase() === a.studentAnswer.trim().toLowerCase();
        scoreAwarded = isCorrect ? Number(question.marks) : 0;
        autoScore += scoreAwarded;
      }

      await this.prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: a.questionId,
          studentAnswer: a.studentAnswer,
          isCorrect,
          scoreAwarded,
        },
      });
    }

    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), score: autoScore, status: 'submitted' },
    });
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
