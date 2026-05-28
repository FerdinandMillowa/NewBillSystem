const LOGO_URL = 'https://pitch-roll-bar-xyz123.vercel.app/logo.png';
const BRAND_COLOR = '#1a1a2e';
const ACCENT_COLOR = '#16a34a';
const BACKEND_URL = 'https://pitch-roll-backend.onrender.com';

export interface PaymentNotificationData {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  paymentDate: Date | null;
  verifiedAt: Date;
  outstandingBalance: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    mpamba: 'Mpamba',
    airtel_money: 'Airtel Money',
    bank: 'Bank Transfer',
    card: 'Card',
    mobile_money: 'Mobile Money',
  };
  return labels[method] || method;
}

function getMethodBadgeColor(method: string): string {
  const colors: Record<string, string> = {
    cash: '#16a34a',
    mpamba: '#2563eb',
    airtel_money: '#dc2626',
    bank: '#7c3aed',
    card: '#ea580c',
    mobile_money: '#2563eb',
  };
  return colors[method] || '#6b7280';
}

export function buildPaymentNotificationHtml(
  data: PaymentNotificationData,
): string {
  const {
    customerFirstName,
    customerLastName,
    paymentId,
    amount,
    paymentMethod,
    referenceNumber,
    notes,
    paymentDate,
    verifiedAt,
    outstandingBalance,
  } = data;

  const shortId = paymentId.substring(0, 8).toUpperCase();
  const balanceColor = outstandingBalance > 0 ? '#dc2626' : '#16a34a';
  const methodColor = getMethodBadgeColor(paymentMethod);
  const methodLabel = formatPaymentMethod(paymentMethod);

  // Pay Online link for remaining balance (only shown if still outstanding)
  const payUrl =
    outstandingBalance > 0
      ? `${BACKEND_URL}/paychangu/checkout` +
        `?amount=${encodeURIComponent(outstandingBalance.toString())}`
      : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed – Pitch & Roll Bar</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="Pitch & Roll Bar" height="52" style="display:block;margin:0 auto 12px;object-fit:contain;" />
              <p style="margin:0;color:#a0a0b0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Payment Confirmed</p>
            </td>
          </tr>

          <!-- Verified badge -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <div style="display:inline-block;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:9999px;padding:10px 24px;">
                <span style="font-size:14px;font-weight:600;color:#16a34a;">✓ Payment Verified</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
                Hello, ${customerFirstName} ${customerLastName}
              </p>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
                Your payment has been received and verified by our team. Here is your confirmation.
              </p>
            </td>
          </tr>

          <!-- Amount highlight -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:${ACCENT_COLOR};">${formatCurrency(amount)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details Card -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">

                <!-- Payment ID row -->
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Payment Reference</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#111827;font-family:monospace;">#${shortId}</p>
                        </td>
                        <td style="text-align:right;">
                          <span style="display:inline-block;padding:5px 14px;border-radius:9999px;font-size:12px;font-weight:600;background-color:${methodColor};color:#ffffff;">
                            ${methodLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  referenceNumber
                    ? `
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Transaction ID</p>
                    <p style="margin:0;font-size:14px;color:#111827;font-weight:600;font-family:monospace;">${referenceNumber}</p>
                  </td>
                </tr>`
                    : ''
                }

                <!-- Dates row -->
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:16px 24px;width:50%;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Payment Date</p>
                          <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${paymentDate ? formatDate(paymentDate) : '—'}</p>
                        </td>
                        <td style="padding:16px 24px;width:50%;border-left:1px solid #e5e7eb;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Verified On</p>
                          <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${formatDate(verifiedAt)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  notes
                    ? `
                <tr>
                  <td style="padding:16px 24px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
                    <p style="margin:0;font-size:14px;color:#111827;">${notes}</p>
                  </td>
                </tr>`
                    : ''
                }

              </table>
            </td>
          </tr>

          <!-- Outstanding Balance -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${outstandingBalance > 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${outstandingBalance > 0 ? '#fecaca' : '#bbf7d0'};border-radius:10px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">
                            ${outstandingBalance > 0 ? 'Remaining Balance' : 'Account Balance'}
                          </p>
                          <p style="margin:0;font-size:24px;font-weight:700;color:${balanceColor};">
                            ${formatCurrency(Math.abs(outstandingBalance))}
                          </p>
                        </td>
                        <td style="text-align:right;">
                          <span style="display:inline-block;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:600;background-color:${balanceColor};color:#ffffff;">
                            ${outstandingBalance > 0 ? 'Still Owing' : 'Fully Settled'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            outstandingBalance > 0
              ? `
          <!-- Pay remaining online -->
          <tr>
            <td style="padding:20px 40px 0;text-align:center;">
              <a href="${payUrl}"
                 style="display:inline-block;background-color:#e94560;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">
                Pay Remaining Balance Online
              </a>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
                You can adjust the amount on the payment page.
              </p>
            </td>
          </tr>

          <!-- Payment Methods -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">Other Ways to Settle Your Remaining Balance</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;font-size:18px;">🏦</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">National Bank of Malawi</p>
                          <p style="margin:0;font-size:13px;color:#6b7280;">Account Number: <strong style="color:#111827;font-family:monospace;">1007565921</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;font-size:18px;">📱</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">Mpamba</p>
                          <p style="margin:0;font-size:13px;color:#6b7280;">Agent Code: <strong style="color:#111827;font-family:monospace;">122581</strong> &nbsp;·&nbsp; Agent Name: <strong style="color:#111827;">Pitch and Roll</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 24px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;font-size:18px;">📱</td>
                        <td>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">Airtel Money</p>
                          <p style="margin:0;font-size:13px;color:#6b7280;">Agent Code: <strong style="color:#111827;font-family:monospace;">788577</strong> &nbsp;·&nbsp; Agent Name: <strong style="color:#111827;">Pitch and Roll</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Thank you message -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
                ${
                  outstandingBalance > 0
                    ? `Thank you for your payment. You still have a remaining balance of <strong>${formatCurrency(outstandingBalance)}</strong>. Please settle this at your earliest convenience.`
                    : `Thank you! Your account is now fully settled. We appreciate your continued patronage at Pitch &amp; Roll Bar.`
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">
                      This is an automated confirmation from <strong style="color:#374151;">Pitch &amp; Roll Bar</strong>.
                    </p>
                    <p style="margin:0;font-size:12px;color:#d1d5db;">
                      Please keep this email for your records. If you have any questions, contact us directly.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildPaymentNotificationSubject(paymentId: string): string {
  const shortId = paymentId.substring(0, 8).toUpperCase();
  return `Payment Confirmed #${shortId} – Pitch & Roll Bar`;
}
