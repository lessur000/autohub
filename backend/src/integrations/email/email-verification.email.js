import { sendEmail } from "./email.client.js";
import { createEmailTemplate } from "./email.templates.js";

export const sendEmailVerification = async ({
  email,
  customerName,
  verificationUrl,
}) => {
  return sendEmail({
    to: email,
    subject: "Verify Your AutoHub Email Address",
    text: [
      `Hello ${customerName},`,
      "",
      "Please verify your AutoHub email address using this link:",
      verificationUrl,
      "",
      "This link expires in 30 minutes.",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: createEmailTemplate({
      title: "Verify Your Email",
      greeting: customerName,
      message:
        "Thank you for creating an AutoHub account. Please verify your email address to confirm that you own this email account.",
      actionUrl: verificationUrl,
      actionLabel: "Verify Email Address",
      details: [
        { label: "Email", value: email },
        { label: "Link Expiration", value: "30 minutes" },
      ],
    }),
  });
};
