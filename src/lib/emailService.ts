import nodemailer from 'nodemailer';

// You will need to add these to your .env.local file:
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=your_email@gmail.com
// SMTP_PASS=your_app_password

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: { to: string | string[], subject: string, html: string }) {
  if (!process.env.SMTP_USER) {
    console.warn('⚠️ SMTP_USER not set. Email will be logged to console instead of sending.');
    console.log(`\n📧 EMAIL TO: ${to}\nSUBJECT: ${subject}\nHTML:\n${html}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Medcy SEO Automation" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
