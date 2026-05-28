const LOGO_URL = 'https://pitch-roll-bar-xyz123.vercel.app/logo.png';
const BRAND_COLOR = '#1a1a2e';
const ACCENT_COLOR = '#e94560';
const BACKEND_URL = 'https://pitch-roll-backend.onrender.com';

export interface BillNotificationData {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  billId: string;
  amount: number;
  description: string;
  transactionDate: Date;
  outstandingBalance: number;
  createdAt: Date;
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

export function buildBillNotificationHtml(data: BillNotificationData): string {
  const {
    customerFirstName,
    customerLastName,
    billId,
    amount,
    description,
    transactionDate,
    outstandingBalance,
    createdAt,
  } = data;

  const shortId = billId.substring(0, 8).toUpperCase();
  const balanceColor = outstandingBalance > 0 ? '#dc2626' : '#16a34a';
  const balanceLabel =
    outstandingBalance > 0 ? 'Outstanding Balance' : 'Account Balance';

  // Paychangu checkout link — pre-fills the outstanding balance but customer can change it
  const payOnlineUrl =
    `${BACKEND_URL}/paychangu/checkout` +
    `?customerId=${encodeURIComponent(data.customerEmail)}` +
    `&billId=${encodeURIComponent(billId)}` +
    `&amount=${encodeURIComponent(outstandingBalance.toString())}`;

  const payUrl =
    `${BACKEND_URL}/paychangu/checkout` +
    `?billId=${encodeURIComponent(billId)}` +
    `&amount=${encodeURIComponent(Math.max(0, outstandingBalance).toString())}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bill Notification – Pitch & Roll Bar</title>
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
              <p style="margin:0;color:#a0a0b0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Bill Notification</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
                Hello, ${customerFirstName} ${customerLastName}
              </p>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
                A new bill has been raised on your account at <strong>Pitch &amp; Roll Bar</strong>. Please find the details below.
              </p>
            </td>
          </tr>

          <!-- Bill Details Card -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Bill Reference</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${ACCENT_COLOR};font-family:monospace;">#${shortId}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;width:50%;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Description</p>
                          <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${description}</p>
                        </td>
                        <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;width:50%;border-left:1px solid #e5e7eb;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Transaction Date</p>
                          <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${formatDate(transactionDate)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;width:50%;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Bill Amount</p>
                          <p style="margin:0;font-size:20px;color:#111827;font-weight:700;">${formatCurrency(amount)}</p>
                        </td>
                        <td style="padding:16px 24px;width:50%;border-left:1px solid #e5e7eb;">
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Issued On</p>
                          <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${formatDate(createdAt)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
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
                          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${balanceLabel}</p>
                          <p style="margin:0;font-size:24px;font-weight:700;color:${balanceColor};">${formatCurrency(Math.abs(outstandingBalance))}</p>
                        </td>
                        <td style="text-align:right;">
                          <span style="display:inline-block;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:600;background-color:${outstandingBalance > 0 ? '#dc2626' : '#16a34a'};color:#ffffff;">
                            ${outstandingBalance > 0 ? 'Amount Owed' : 'Fully Settled'}
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
          <!-- Pay Online Button -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <a href="${payUrl}"
                 style="display:inline-block;background-color:#e94560;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                Pay Online via Paychangu
              </a>
              <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">
                You can adjust the amount on the payment page. Accepts Mpamba, Airtel Money, card &amp; bank transfer.
              </p>
            </td>
          </tr>

          <!-- Payment Methods -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">Other Ways to Settle Your Balance</p>
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

          <!-- Footer -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">
                      This is an automated notification from <strong style="color:#374151;">Pitch &amp; Roll Bar</strong>.
                    </p>
                    <p style="margin:0;font-size:12px;color:#d1d5db;">
                      If you believe this bill was raised in error, please contact us immediately.
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

export function buildBillNotificationSubject(billId: string): string {
  const shortId = billId.substring(0, 8).toUpperCase();
  return `New Bill #${shortId} – Pitch & Roll Bar`;
}
