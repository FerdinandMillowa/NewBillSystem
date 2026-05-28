import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// FIX 1: Must use 'import type' for Request/Response when isolatedModules +
// emitDecoratorMetadata are both enabled — they are type-only references in
// decorated parameter positions, which TypeScript requires to be type imports.
import type { Request, Response } from 'express';
import { PaychanguService } from './paychangu.service';
import { PaymentsService } from '../payments/payments.service';
import { CustomersService } from '../customers/customers.service';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';
// FIX 2: Import the PaymentMethod enum so we can pass the correct typed value
// instead of a raw string literal, which TS rejects against the enum type.
import { PaymentMethod, UserRole } from '../common/enums';

@Controller('paychangu')
export class PaychanguController {
  private readonly logger = new Logger(PaychanguController.name);

  constructor(
    private readonly paychanguService: PaychanguService,
    private readonly paymentsService: PaymentsService,
    private readonly customersService: CustomersService,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * GET /paychangu/checkout
   *
   * Resolves customer from billId, calculates outstanding balance,
   * then redirects to Paychangu hosted checkout.
   *
   * Query params:
   *   billId  — required; used to identify customer
   *   amount  — optional; defaults to full outstanding balance
   */
  @Get('checkout')
  async checkout(
    @Query('billId') billId: string,
    @Query('amount') amountParam: string,
    @Res() res: Response,
  ) {
    if (!billId) {
      return res
        .status(400)
        .send(this.buildErrorPage('Invalid payment link — missing bill reference.'));
    }

    try {
      // Resolve the bill to get the customer
      const bill = await this.billRepository.findOne({
        where: { id: billId },
        relations: ['customer'],
      });

      if (!bill || !bill.customer) {
        return res
          .status(404)
          .send(
            this.buildErrorPage(
              'Bill not found. Please contact Pitch & Roll Bar directly.',
            ),
          );
      }

      const customer = bill.customer;

      // Use CustomersService for the live outstanding balance
      const customerWithBalance =
        await this.customersService.findOneWithBalance(customer.id);

      const outstandingBalance = customerWithBalance.balance;

      // Determine payment amount — query param overrides outstanding balance
      let amount: number;

      if (amountParam) {
        amount = parseFloat(amountParam);
        if (isNaN(amount) || amount <= 0) {
          return res
            .status(400)
            .send(this.buildErrorPage('Invalid payment amount in link.'));
        }
      } else {
        amount = outstandingBalance;
      }

      if (amount <= 0) {
        return res
          .status(200)
          .send(
            this.buildErrorPage(
              'Your account has no outstanding balance. No payment is required.',
            ),
          );
      }

      const txRef = this.paychanguService.generateTxRef();

      const { checkoutUrl } = await this.paychanguService.initiateCheckout({
        customerId: customer.id,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        amount,
        txRef,
        billId,
      });

      this.logger.log(
        `Redirecting customer ${customer.id} to Paychangu, tx_ref: ${txRef}, amount: MWK ${amount}`,
      );

      return res.redirect(302, checkoutUrl);
    } catch (err: any) {
      this.logger.error(
        `Checkout error for billId=${billId}: ${err?.message}`,
      );
      return res
        .status(500)
        .send(
          this.buildErrorPage(
            'We could not initiate your payment. Please try again or contact Pitch & Roll Bar directly.',
          ),
        );
    }
  }

  /**
   * POST /paychangu/webhook
   *
   * Receives Paychangu payment notifications.
   * Responds HTTP 200 immediately, then re-verifies and records.
   * Duplicate webhooks (same tx_ref) are silently ignored via unique constraint.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response) {
    // Acknowledge immediately — Paychangu requires HTTP 200 within seconds
    res.status(200).send({ received: true });

    const signature = req.headers['signature'] as string;
    const rawBody: string = (req as any).rawBody || JSON.stringify(req.body);

    if (
      signature &&
      !this.paychanguService.validateWebhookSignature(rawBody, signature)
    ) {
      this.logger.warn('Webhook rejected — invalid signature');
      return;
    }

    const payload = req.body;

    this.logger.log(
      `Webhook received — event: ${payload?.event_type}, status: ${payload?.status}`,
    );

    // Only act on confirmed successful payments
    if (payload?.status !== 'success') {
      this.logger.log(
        `Webhook ignored — status is not success: ${payload?.status}`,
      );
      return;
    }

    const txRef: string = payload?.tx_ref || payload?.reference;

    if (!txRef) {
      this.logger.warn('Webhook payload missing tx_ref — ignoring');
      return;
    }

    // Always re-verify with Paychangu — never trust the payload alone
    const verified = await this.paychanguService.verifyTransaction(txRef);

    if (!verified) {
      this.logger.warn(
        `Could not verify tx_ref ${txRef} with Paychangu API — ignoring`,
      );
      return;
    }

    if (verified.status !== 'success') {
      this.logger.log(
        `Paychangu verification returned "${verified.status}" for tx_ref ${txRef} — ignoring`,
      );
      return;
    }

    if (!verified.customerId) {
      this.logger.warn(
        `tx_ref ${txRef} has no customerId in meta — cannot record payment`,
      );
      return;
    }

    this.logger.log(
      `Recording verified online payment — tx_ref: ${txRef}, amount: MWK ${verified.amount}, customer: ${verified.customerId}`,
    );

    try {
      // Record with ADMIN role — auto-verifies and fires confirmation email.
      // FIX 2: Use PaymentMethod.CARD enum value instead of raw string 'card'
      // so TypeScript is satisfied that the type matches CreatePaymentDto.
      await this.paymentsService.create(
        {
          customerId: verified.customerId,
          amount: verified.amount,
          paymentMethod: PaymentMethod.CARD,
          notes: `Online payment via Paychangu — Ref: ${txRef}`,
          referenceNumber: txRef,
        },
        UserRole.ADMIN,
      );

      this.logger.log(
        `Paychangu payment recorded successfully for tx_ref: ${txRef}`,
      );
    } catch (err: any) {
      // PostgreSQL error code 23505 = unique_violation (duplicate tx_ref)
      const isDuplicate =
        err?.code === '23505' ||
        err?.message?.toLowerCase().includes('duplicate') ||
        err?.message?.toLowerCase().includes('unique');

      if (isDuplicate) {
        this.logger.warn(
          `Duplicate webhook for tx_ref ${txRef} — already recorded, ignoring`,
        );
        return;
      }

      this.logger.error(
        `Failed to record payment for tx_ref ${txRef}: ${err?.message}`,
      );
    }
  }

  /**
   * GET /paychangu/result
   *
   * Result page shown after Paychangu redirects the customer back.
   * Covers success, cancellation, and failure states.
   */
  @Get('result')
  result(
    @Query('tx_ref') txRef: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const isSuccess = status === 'success';
    const isCancelled = status === 'cancelled' || status === 'failed';

    const iconChar = isSuccess ? '✓' : '✕';
    const iconBg = isSuccess ? '#f0fdf4' : '#fef2f2';
    const iconBorder = isSuccess ? '#bbf7d0' : '#fecaca';
    const title = isSuccess
      ? 'Payment Successful!'
      : isCancelled
        ? 'Payment Cancelled'
        : 'Payment Incomplete';
    const message = isSuccess
      ? 'Your payment has been received and is being processed. A confirmation email will be sent to your registered email address shortly.'
      : isCancelled
        ? 'Your payment was cancelled. No charges have been made to your account.'
        : 'Your payment could not be completed. Please try again or contact us directly.';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} — Pitch &amp; Roll Bar</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,.10);max-width:500px;width:100%;overflow:hidden}
    .hdr{background:#1a1a2e;padding:32px 40px 24px;text-align:center}
    .hdr img{height:52px;object-fit:contain;display:block;margin:0 auto 12px}
    .hdr p{margin:0;color:#a0a0b0;font-size:13px;letter-spacing:.5px;text-transform:uppercase}
    .body{padding:40px;text-align:center}
    .icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px;background:${iconBg};border:2px solid ${iconBorder}}
    h1{font-size:24px;font-weight:700;color:#111827;margin-bottom:14px}
    .msg{font-size:15px;color:#6b7280;line-height:1.7}
    .ref-box{margin:22px 0;padding:14px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:left}
    .ref-box p{font-size:12px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}
    .ref-box span{font-size:15px;font-weight:600;color:#374151;font-family:monospace}
    .methods{margin:0 40px 32px;padding:20px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;text-align:left}
    .methods h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:14px;text-transform:uppercase;letter-spacing:.4px}
    .method-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
    .method-row:last-child{margin-bottom:0}
    .method-emoji{font-size:18px;flex-shrink:0;margin-top:1px}
    .method-row p{margin:0;font-size:13px;color:#6b7280;line-height:1.5}
    .method-row strong{color:#111827}
    .ftr{padding:0 40px 28px;text-align:center}
    .ftr p{font-size:13px;color:#9ca3af}
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <img src="https://pitch-roll-bar-xyz123.vercel.app/logo.png" alt="Pitch &amp; Roll Bar"/>
      <p>Payment ${isSuccess ? 'Confirmation' : 'Status'}</p>
    </div>
    <div class="body">
      <div class="icon">${iconChar}</div>
      <h1>${title}</h1>
      <p class="msg">${message}</p>
      ${
        txRef
          ? `<div class="ref-box">
        <p>Transaction Reference</p>
        <span>${txRef}</span>
      </div>`
          : ''
      }
    </div>
    <div class="methods">
      <h3>Other Payment Methods</h3>
      <div class="method-row">
        <span class="method-emoji">🏦</span>
        <p><strong>National Bank of Malawi</strong><br/>Account Number: <strong>1007565921</strong></p>
      </div>
      <div class="method-row">
        <span class="method-emoji">📱</span>
        <p><strong>Mpamba</strong><br/>Agent Code: <strong>122581</strong> &nbsp;·&nbsp; Agent Name: <strong>Pitch and Roll</strong></p>
      </div>
      <div class="method-row">
        <span class="method-emoji">📱</span>
        <p><strong>Airtel Money</strong><br/>Agent Code: <strong>788577</strong> &nbsp;·&nbsp; Agent Name: <strong>Pitch and Roll</strong></p>
      </div>
    </div>
    <div class="ftr">
      <p>${isSuccess ? 'Please keep your transaction reference for your records.' : 'You may safely close this page.'}</p>
    </div>
  </div>
</body>
</html>`;

    return res.status(200).send(html);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Payment Error — Pitch &amp; Roll Bar</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,.10);max-width:460px;width:100%;overflow:hidden}
    .hdr{background:#1a1a2e;padding:28px 40px;text-align:center}
    .hdr img{height:48px;object-fit:contain;display:block;margin:0 auto}
    .body{padding:40px;text-align:center}
    .icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;background:#fef2f2;border:2px solid #fecaca}
    h1{font-size:20px;font-weight:700;color:#111827;margin-bottom:12px}
    p{font-size:14px;color:#6b7280;line-height:1.7}
    .methods{margin:0 40px 32px;padding:16px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;text-align:left}
    .methods h3{font-size:12px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:.4px}
    .method-row{display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:#6b7280}
    .method-row:last-child{margin-bottom:0}
    .method-row strong{color:#111827}
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr"><img src="https://pitch-roll-bar-xyz123.vercel.app/logo.png" alt="Pitch &amp; Roll Bar"/></div>
    <div class="body">
      <div class="icon">⚠</div>
      <h1>Payment Error</h1>
      <p>${message}</p>
    </div>
    <div class="methods">
      <h3>Pay Directly Instead</h3>
      <div class="method-row"><span>🏦</span><span>National Bank of Malawi — Account: <strong>1007565921</strong></span></div>
      <div class="method-row"><span>📱</span><span>Mpamba Agent <strong>122581</strong> — <strong>Pitch and Roll</strong></span></div>
      <div class="method-row"><span>📱</span><span>Airtel Money Agent <strong>788577</strong> — <strong>Pitch and Roll</strong></span></div>
    </div>
  </div>
</body>
</html>`;
  }
}
