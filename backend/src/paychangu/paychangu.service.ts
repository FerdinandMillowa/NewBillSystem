import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface InitiateCheckoutParams {
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  amount: number;
  txRef: string;
  billId?: string;
}

export interface PaychanguCheckoutResult {
  checkoutUrl: string;
  txRef: string;
}

@Injectable()
export class PaychanguService {
  private readonly logger = new Logger(PaychanguService.name);
  private readonly apiUrl = 'https://api.paychangu.com/payment';
  private readonly verifyUrl = 'https://api.paychangu.com/verify-payment';
  private readonly backendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.backendUrl =
      this.configService.get<string>('BACKEND_URL') ||
      'https://pitch-roll-backend.onrender.com';
  }

  /**
   * Generates a unique transaction reference.
   * Format: PR-{timestamp}-{random6chars}
   */
  generateTxRef(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PR-${ts}-${rand}`;
  }

  /**
   * Initiates a Paychangu hosted checkout session.
   * Returns the hosted checkout URL to redirect the customer to.
   */
  async initiateCheckout(
    params: InitiateCheckoutParams,
  ): Promise<PaychanguCheckoutResult> {
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');

    if (!secretKey) {
      throw new Error('PAYCHANGU_SECRET_KEY is not configured');
    }

    const callbackUrl = `${this.backendUrl}/paychangu/webhook`;
    const returnUrl = `${this.backendUrl}/paychangu/result?tx_ref=${params.txRef}&status=cancelled`;

    const body: Record<string, any> = {
      amount: params.amount.toString(),
      currency: 'MWK',
      tx_ref: params.txRef,
      first_name: params.customerFirstName,
      last_name: params.customerLastName,
      email: params.customerEmail,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: 'Pitch & Roll Bar',
        description: params.billId
          ? `Bill payment — Ref #${params.billId.substring(0, 8).toUpperCase()}`
          : 'Account balance payment',
        logo: 'https://pitch-roll-bar-xyz123.vercel.app/logo.png',
      },
      // FIX: Paychangu expects meta as a native JSON object (per their docs
      // example: { "uuid": "uuid", "response": "Response" }), not a
      // stringified value. Sending JSON.stringify(...) here caused the API
      // to reject the request with "The meta must be an array."
      meta: {
        customerId: params.customerId,
        ...(params.billId && { billId: params.billId }),
      },
    };

    this.logger.log(
      `Initiating Paychangu checkout for customer ${params.customerId}, tx_ref: ${params.txRef}, amount: MWK ${params.amount}`,
    );

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json();

    if (!response.ok || data.status !== 'success') {
      this.logger.error(
        `Paychangu checkout initiation failed: ${JSON.stringify(data)}`,
      );
      throw new Error(
        data?.message || 'Failed to initiate Paychangu checkout',
      );
    }

    const checkoutUrl: string =
      data?.data?.checkout_url || data?.data?.link || data?.data?.url;

    if (!checkoutUrl) {
      this.logger.error(
        `Paychangu response missing checkout URL: ${JSON.stringify(data)}`,
      );
      throw new Error('Paychangu did not return a checkout URL');
    }

    this.logger.log(
      `Paychangu checkout URL generated for tx_ref: ${params.txRef}`,
    );

    return { checkoutUrl, txRef: params.txRef };
  }

  /**
   * Verifies a transaction with Paychangu by tx_ref.
   * Always re-query — never trust the webhook payload alone.
   */
  async verifyTransaction(txRef: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    customerId: string | null;
    billId: string | null;
    reference: string;
  } | null> {
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');

    if (!secretKey) {
      this.logger.error('PAYCHANGU_SECRET_KEY not set — cannot verify');
      return null;
    }

    try {
      const response = await fetch(`${this.verifyUrl}/${txRef}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: 'application/json',
        },
      });

      const data: any = await response.json();

      if (!response.ok || data.status !== 'success') {
        this.logger.warn(
          `Paychangu verification failed for tx_ref ${txRef}: ${JSON.stringify(data)}`,
        );
        return null;
      }

      const txData = data.data;
      let customerId: string | null = null;
      let billId: string | null = null;

      // Parse meta field — we stored customerId and optional billId there
      try {
        if (txData.meta) {
          const meta =
            typeof txData.meta === 'string'
              ? JSON.parse(txData.meta)
              : txData.meta;
          customerId = meta.customerId || null;
          billId = meta.billId || null;
        }
      } catch {
        this.logger.warn(`Could not parse meta for tx_ref ${txRef}`);
      }

      return {
        status: txData.status,
        amount: parseFloat(txData.amount),
        currency: txData.currency,
        customerId,
        billId,
        reference: txData.reference || txRef,
      };
    } catch (err: any) {
      this.logger.error(
        `Error verifying Paychangu transaction ${txRef}: ${err?.message}`,
      );
      return null;
    }
  }

  /**
   * Validates a Paychangu webhook signature.
   * The Signature header is a SHA-256 HMAC of the raw payload body
   * using the webhook secret key.
   */
  validateWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>(
      'PAYCHANGU_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.warn(
        'PAYCHANGU_WEBHOOK_SECRET not set — skipping signature validation',
      );
      // Allow through but log — better than silently failing in dev
      return true;
    }

    const computed = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const valid = computed === signature;

    if (!valid) {
      this.logger.warn(
        `Webhook signature mismatch. Expected: ${computed}, Got: ${signature}`,
      );
    }

    return valid;
  }
}