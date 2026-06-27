import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  buildBillNotificationHtml,
  buildBillNotificationSubject,
  type BillNotificationData,
} from './templates/bill-notification.template';
import {
  buildPaymentNotificationHtml,
  buildPaymentNotificationSubject,
  type PaymentNotificationData,
} from './templates/payment-notification.template';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string =
    'Pitch & Roll Bar <onboarding@resend.dev>';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set — email notifications are disabled',
      );
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Send a bill notification email to the customer.
   */
  async sendBillNotification(data: BillNotificationData): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `[Bill ${data.billId}] Skipping email — Resend client not initialised`,
      );
      return;
    }

    try {
      const subject = buildBillNotificationSubject(data.billId);
      const html = buildBillNotificationHtml(data);

      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(
          `[Bill ${data.billId}] Resend returned an error for ${data.customerEmail}: ${JSON.stringify(result.error)}`,
        );
        return;
      }

      this.logger.log(
        `[Bill ${data.billId}] Notification sent to ${data.customerEmail} (Resend ID: ${result.data?.id})`,
      );
    } catch (err: any) {
      this.logger.error(
        `[Bill ${data.billId}] Failed to send notification to ${data.customerEmail}: ${err?.message ?? err}`,
      );
    }
  }

  /**
   * Send a payment verification confirmation email to the customer.
   */
  async sendPaymentNotification(data: PaymentNotificationData): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `[Payment ${data.paymentId}] Skipping email — Resend client not initialised`,
      );
      return;
    }

    try {
      const subject = buildPaymentNotificationSubject(data.paymentId);
      const html = buildPaymentNotificationHtml(data);

      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(
          `[Payment ${data.paymentId}] Resend returned an error for ${data.customerEmail}: ${JSON.stringify(result.error)}`,
        );
        return;
      }

      this.logger.log(
        `[Payment ${data.paymentId}] Confirmation sent to ${data.customerEmail} (Resend ID: ${result.data?.id})`,
      );
    } catch (err: any) {
      this.logger.error(
        `[Payment ${data.paymentId}] Failed to send confirmation to ${data.customerEmail}: ${err?.message ?? err}`,
      );
    }
  }
}
