import nodemailer from "nodemailer";

const {
  EMAIL_PROVIDER,
  EMAIL_FROM_NAME = "AutoHub",
  EMAIL_FROM_EMAIL,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USER,
  MAILTRAP_PASS,
} = process.env;

if (EMAIL_PROVIDER !== "mailtrap") {
  throw new Error("EMAIL_PROVIDER must be set to mailtrap.");
}

const requiredEnv = {
  EMAIL_FROM_EMAIL,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USER,
  MAILTRAP_PASS,
};

const missing = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(`Missing email environment variables: ${missing.join(", ")}`);
}

export const emailTransporter = nodemailer.createTransport({
  host: MAILTRAP_HOST,
  port: Number(MAILTRAP_PORT),
  secure: Number(MAILTRAP_PORT) === 465,
  auth: {
    user: MAILTRAP_USER,
    pass: MAILTRAP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || (!html && !text)) {
    throw new Error("Email recipient, subject, and content are required.");
  }

  const result = await emailTransporter.sendMail({
    from: {
      name: EMAIL_FROM_NAME,
      address: EMAIL_FROM_EMAIL,
    },
    to,
    subject,
    html,
    text,
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
};
