import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  try {
    const transport = createTransport();

    if (!transport) {
      console.log('[Email] SMTP not configured — logging email to console');
      console.log(`[Email] To: ${to}`);
      console.log(`[Email] Subject: ${subject}`);
      console.log(`[Email] Body: ${html}`);
      return;
    }

    await transport.sendMail({
      from: process.env.SMTP_FROM || 'noreply@smarted.app',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send email:', err);
  }
}
