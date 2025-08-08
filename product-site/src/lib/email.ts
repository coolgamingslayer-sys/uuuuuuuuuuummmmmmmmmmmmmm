import { Resend } from "resend";

export async function sendDownloadEmail(toEmail: string, downloadUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // In development or missing configuration, skip sending to avoid build-time failures
    return;
  }
  const resend = new Resend(apiKey);

  const from = process.env.EMAIL_FROM || "downloads@example.com";
  const subject = "Your Ultimate AI Business Starter Kit";
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
    <h1>🎉 Thanks for your purchase!</h1>
    <p>Hi,</p>
    <p>Here is your secure download link for the <strong>Ultimate AI Business Starter Kit</strong>:</p>
    <p><a href="${downloadUrl}" style="background:#111; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none;">Download your kit</a></p>
    <p>This link will expire in 72 hours. If it expires, just reply to this email and we’ll refresh it for you.</p>
    <hr />
    <p style="font-size:12px; color:#555">If the button doesn’t work, copy and paste this URL into your browser:<br/>${downloadUrl}</p>
  </div>
  `;

  await resend.emails.send({ from, to: toEmail, subject, html });
}