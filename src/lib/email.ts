import nodemailer from "nodemailer";
import { getOrderStatusLabel } from "@/lib/order-status";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPreOrderEmail({
  to,
  employeeName,
  companyName,
  kitName,
  publicUrl,
}: {
  to: string;
  employeeName?: string;
  companyName: string;
  kitName: string;
  publicUrl: string;
}) {
  const greeting = employeeName ? `Hi ${esc(employeeName)}` : "Hi";

  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your welcome kit is ready — choose your preferences",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">${greeting},</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          <strong>${esc(companyName)}</strong> has prepared a <strong>${esc(kitName)}</strong> for you.
          Please use the link below to choose your preferences and confirm your delivery details.
        </p>
        <div style="margin: 32px 0;">
          <a href="${publicUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Choose my preferences
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or copy this link: <a href="${publicUrl}" style="color: #666;">${publicUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Custom Branded Products
        </p>
      </div>
    `,
  });
}

export async function sendInviteEmail({
  to,
  employeeName,
  companyName,
  inviteUrl,
}: {
  to: string;
  employeeName?: string;
  companyName: string;
  inviteUrl: string;
}) {
  const greeting = employeeName ? `Hi ${esc(employeeName)}` : "Hi";

  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to,
    subject: `You've been invited to join ${companyName} on Kitify`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">${greeting},</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          You've been invited to join <strong>${esc(companyName)}</strong> on Kitify.
          Please use the link below to set up your password and activate your account.
        </p>
        <div style="margin: 32px 0;">
          <a href="${inviteUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Set up my account
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or copy this link: <a href="${inviteUrl}" style="color: #666;">${inviteUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Custom Branded Products
        </p>
      </div>
    `,
  });
}

export async function sendAddedToCompanyEmail({
  to,
  userName,
  companyName,
  loginUrl,
}: {
  to: string;
  userName?: string;
  companyName: string;
  loginUrl: string;
}) {
  const greeting = userName ? `Hi ${esc(userName)}` : "Hi";

  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to,
    subject: `You've been added to ${companyName} on Kitify`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">${greeting},</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          You've been added to <strong>${esc(companyName)}</strong> on Kitify.
          You can log in to your existing account and switch between your
          companies from the sidebar.
        </p>
        <div style="margin: 32px 0;">
          <a href="${loginUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Go to Kitify
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or copy this link: <a href="${loginUrl}" style="color: #666;">${loginUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Custom Branded Products
        </p>
      </div>
    `,
  });
}

export async function sendOrderStatusEmail({
  to,
  companyName,
  kitName,
  orderId,
  newStatus,
}: {
  to: string;
  companyName: string;
  kitName: string;
  orderId: string;
  newStatus: string;
}) {
  const label = getOrderStatusLabel(newStatus);
  const dashboardUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/dashboard/orders/${orderId}`;

  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to,
    subject: `Order update: ${kitName} — ${label}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">Order Status Update</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          The order for <strong>${esc(kitName)}</strong> from <strong>${esc(companyName)}</strong>
          has been updated to <strong>${label}</strong>.
        </p>
        <div style="margin: 32px 0;">
          <a href="${dashboardUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            View Order
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or copy this link: <a href="${dashboardUrl}" style="color: #666;">${dashboardUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Custom Branded Products
        </p>
      </div>
    `,
  });
}

export async function sendShippingQuoteRequestEmail({
  companyName,
  kitName,
  orderId,
}: {
  companyName: string;
  kitName: string;
  orderId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;

  const adminUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/admin/orders/${orderId}`;

  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `Shipping quote needed: ${kitName} (${companyName})`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">Shipping Quote Requested</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          <strong>${esc(companyName)}</strong> has placed an international order for
          <strong>${esc(kitName)}</strong> that requires a shipping quote before payment
          can be released.
        </p>
        <div style="margin: 32px 0;">
          <a href="${adminUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Set Shipping Cost
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or open: <a href="${adminUrl}" style="color: #666;">${adminUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Admin notification
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from: `"Kitify" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111;">Reset your password</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new password.
          This link will expire in 1 hour.
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Reset my password
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Or copy this link: <a href="${resetUrl}" style="color: #666;">${resetUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Kitify — Custom Branded Products
        </p>
      </div>
    `,
  });
}
