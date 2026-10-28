import { sendEmail } from "./email.client.js";
import { createEmailTemplate } from "./email.templates.js";

export const sendPasswordResetEmail = async ({
  email,
  customerName,
  resetUrl,
}) => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl || !resetUrl) {
    throw new Error("Password reset URL is required.");
  }

  const parsedResetUrl = new URL(resetUrl);
  const parsedFrontendUrl = new URL(frontendUrl);

  if (
    parsedResetUrl.origin !== parsedFrontendUrl.origin ||
    (parsedResetUrl.protocol !== "https:" &&
      parsedFrontendUrl.protocol === "https:")
  ) {
    throw new Error("Invalid password reset URL.");
  }

  return sendEmail({
    to: email,
    subject: "Reset Your AutoHub Password",
    text: [
      `Hello ${customerName},`,
      "We received a request to reset your password.",
      `Reset your password here: ${resetUrl}`,
      "If you did not request this, ignore this email.",
    ].join("\n\n"),
    html: createEmailTemplate({
      title: "Password Reset",
      greeting: customerName,
      message:
        "We received a request to reset your AutoHub password. Use the button below to continue.",
      actionUrl: resetUrl,
      actionLabel: "Reset Password",
    }),
  });
};
