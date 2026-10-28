import { emailTransporter } from "../integrations/email/email.client.js";

try {
  await emailTransporter.verify();
  console.log("Mailtrap SMTP connection successful.");
} catch (error) {
  console.error("Mailtrap SMTP connection failed:", error.message);
  process.exitCode = 1;
}
