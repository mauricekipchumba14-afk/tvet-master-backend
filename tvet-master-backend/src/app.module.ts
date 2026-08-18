import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './academic/academic.module';
import { MarksModule } from './marks/marks.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { GamificationModule } from './gamification/gamification.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AcademicModule,
    MarksModule,
    QuizzesModule,
    GamificationModule,
    AiTutorModule,
    PaymentsModule,
  ],
})
export class AppModule {}
