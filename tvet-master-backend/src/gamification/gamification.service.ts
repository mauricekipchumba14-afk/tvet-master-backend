import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POINTS = {
  quiz_completed: 10,
  cat_passed: 25,
  material_read: 2,
  video_completed: 5,
  streak_bonus: 15,
};

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(studentId: string, reason: keyof typeof POINTS, referenceId?: string) {
    return this.prisma.pointEvent.create({
      data: { studentId, points: POINTS[reason], reason, referenceId },
    });
  }

  async checkAndAwardBadges(studentId: string) {
    const badges = await this.prisma.badge.findMany();
    const awarded: string[] = [];

    for (const badge of badges) {
      const criteria: any = badge.criteria;
      const already = await this.prisma.studentBadge.findUnique({
        where: { studentId_badgeId: { studentId, badgeId: badge.id } },
      });
      if (already) continue;

      // Example criterion shape: { type: "unit_quiz_score_avg", unitId, threshold }
      if (criteria.type === 'unit_quiz_score_avg') {
        const attempts = await this.prisma.quizAttempt.findMany({
          where: { studentId, status: { in: ['submitted', 'graded'] }, quiz: { unitId: criteria.unitId } },
        });
        if (attempts.length === 0) continue;
        const avg = attempts.reduce((sum, a) => sum + Number(a.score ?? 0), 0) / attempts.length;
        if (avg >= criteria.threshold) {
          await this.prisma.studentBadge.create({ data: { studentId, badgeId: badge.id } });
          awarded.push(badge.name);
        }
      }
    }
    return awarded;
  }

  // Precomputed leaderboard — call this from a scheduled job (e.g. nightly cron),
  // not on every page load, so it stays cheap at scale.
  async recomputeLeaderboard(scope: 'class' | 'department' | 'institution' | 'unit', scopeId: string, period: 'weekly' | 'monthly' | 'all_time') {
    // Simplified: sums all point_events for students in scope. Real implementation
    // would join through class/department/institution membership.
    const points = await this.prisma.pointEvent.groupBy({
      by: ['studentId'],
      _sum: { points: true },
    });
    const ranked = points
      .sort((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0))
      .map((p, i) => ({ studentId: p.studentId, totalPoints: p._sum.points ?? 0, rank: i + 1 }));
    return ranked;
  }
}
