import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const SPECIALIZATION_PROMPTS: Record<string, string> = {
  electrical: 'You are a patient TVET tutor specializing in Electrical & Electronic Engineering. Explain concepts step by step using simple language and real examples relevant to Kenyan TVET curricula.',
  mechanical: 'You are a patient TVET tutor specializing in Mechanical Engineering.',
  ict: 'You are a patient TVET tutor specializing in ICT.',
  automotive: 'You are a patient TVET tutor specializing in Automotive Engineering.',
  building: 'You are a patient TVET tutor specializing in Building & Civil Engineering.',
  business: 'You are a patient TVET tutor specializing in Business Studies.',
  hospitality: 'You are a patient TVET tutor specializing in Hospitality.',
};

// IMPORTANT: the Anthropic API key lives only in this backend service's
// environment (ANTHROPIC_API_KEY) — it is never sent to the frontend.
@Injectable()
export class AiTutorService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async chat(studentId: string, unitId: string | null, specialization: string, conversationId: string | null, message: string) {
    await this.enforceUsageLimit(studentId);

    let conversation = conversationId
      ? await this.prisma.aiConversation.findUniqueOrThrow({ where: { id: conversationId }, include: { messages: true } })
      : await this.prisma.aiConversation.create({ data: { studentId, unitId, specialization }, include: { messages: true } });

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'student', content: message },
    });

    const history = [...conversation.messages, { role: 'student', content: message }].map((m) => ({
      role: m.role === 'student' ? 'user' : 'assistant',
      content: m.content,
    }));

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SPECIALIZATION_PROMPTS[specialization] ?? SPECIALIZATION_PROMPTS.electrical,
        messages: history,
      },
      {
        headers: {
          'x-api-key': this.config.get('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      },
    );

    const reply = response.data.content.map((b: any) => b.text ?? '').join('\n');

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'ai', content: reply },
    });

    await this.incrementUsage(studentId);

    return { conversationId: conversation.id, reply };
  }

  private async enforceUsageLimit(studentId: string) {
    let usage = await this.prisma.aiUsageLimit.findUnique({ where: { studentId } });
    if (!usage) {
      usage = await this.prisma.aiUsageLimit.create({
        data: { studentId, monthlyLimit: 100, resetsAt: nextMonth() },
      });
    }
    if (usage.resetsAt < new Date()) {
      usage = await this.prisma.aiUsageLimit.update({
        where: { studentId },
        data: { messagesUsedThisMonth: 0, resetsAt: nextMonth() },
      });
    }
    if (usage.messagesUsedThisMonth >= usage.monthlyLimit) {
      throw new BadRequestException('Monthly AI tutor limit reached. Upgrade to premium for more.');
    }
  }

  private incrementUsage(studentId: string) {
    return this.prisma.aiUsageLimit.update({
      where: { studentId },
      data: { messagesUsedThisMonth: { increment: 1 } },
    });
  }
}

function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}
