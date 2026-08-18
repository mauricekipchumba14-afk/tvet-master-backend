import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AiTutorService } from './ai-tutor.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/ai-tutor')
export class AiTutorController {
  constructor(private aiTutor: AiTutorService) {}

  @Post('chat')
  @Roles('student' as any)
  chat(@Req() req, @Body() body: { unitId?: string; specialization: string; conversationId?: string; message: string }) {
    return this.aiTutor.chat(req.user.userId, body.unitId ?? null, body.specialization, body.conversationId ?? null, body.message);
  }
}
