import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "NotesApp <noreply@example.com>";

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3);">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📝 NotesApp</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Подтверждение email</p>
      </div>
      <div style="padding: 32px; text-align: center;">
        <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 24px;">Ваш код подтверждения:</p>
        <div style="background: rgba(124,58,237,0.15); border: 2px dashed rgba(124,58,237,0.5); border-radius: 12px; padding: 20px; display: inline-block;">
          <span style="font-size: 36px; font-weight: bold; color: #a855f7; letter-spacing: 12px;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">⏰ Код действителен 5 минут</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Если вы не регистрировались, проигнорируйте это письмо.</p>
      </div>
      <div style="padding: 16px; text-align: center; border-top: 1px solid rgba(124,58,237,0.2);">
        <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} NotesApp. Все права защищены.</p>
      </div>
    </div>
  `;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`📧 [DEV MODE] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Код подтверждения — NotesApp",
      html,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    console.log(`📧 [FALLBACK] Verification code for ${email}: ${code}`);
    return true;
  }
}
