import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

// M-Pesa Daraja STK Push integration. Requires a registered paybill/till
// number and Daraja app credentials (see .env.example).
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private async getAccessToken() {
    const key = this.config.get('MPESA_CONSUMER_KEY');
    const secret = this.config.get('MPESA_CONSUMER_SECRET');
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } },
    );
    return res.data.access_token;
  }

  async initiateStkPush(payerId: string, phoneNumber: string, amount: number, type: string, referenceId: string) {
    const token = await this.getAccessToken();
    const shortcode = this.config.get('MPESA_SHORTCODE');
    const passkey = this.config.get('MPESA_PASSKEY');
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const transaction = await this.prisma.transaction.create({
      data: {
        payerId,
        type: type as any,
        referenceId,
        amount,
        paymentMethod: 'mpesa',
        status: 'pending',
      },
    });

    await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.config.get('MPESA_CALLBACK_URL'),
        AccountReference: transaction.id,
        TransactionDesc: type,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return transaction;
  }

  // Safaricom calls this URL after the customer completes/cancels the STK push.
  async handleCallback(payload: any) {
    const stk = payload?.Body?.stkCallback;
    const transactionId = stk?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'AccountReference')?.Value;
    const success = stk?.ResultCode === 0;
    const receipt = stk?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;

    if (!transactionId) return { received: true };

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: success ? 'completed' : 'failed',
        providerReference: receipt,
      },
    });
  }
}
