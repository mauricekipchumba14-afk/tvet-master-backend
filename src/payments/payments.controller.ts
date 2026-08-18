import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('mpesa/stk-push')
  stkPush(@Req() req, @Body() body: { phoneNumber: string; amount: number; type: string; referenceId: string }) {
    return this.payments.initiateStkPush(req.user.userId, body.phoneNumber, body.amount, body.type, body.referenceId);
  }

  // No auth guard — this is called by Safaricom's servers, not the frontend.
  @Post('webhook/mpesa')
  webhook(@Body() body: any) {
    return this.payments.handleCallback(body);
  }
}
