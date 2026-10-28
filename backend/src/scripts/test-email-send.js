import { sendEmail } from "../integrations/email/email.client.js";

try {
  const result = await sendEmail({
    to: "test@example.com",
    subject: "AutoHub Email Integration Test",
    text: "This is a test email from the AutoHub backend.",
    html: `
      <h1>AutoHub</h1>
      <p>Mailtrap SMTP email integration is working!</p>
    `,
  });

  console.log("Test email sent successfully.");
  console.log("Message ID:", result.messageId);
  console.log("Accepted:", result.accepted);
} catch (error) {
  console.error("Test email failed:", error.message);
  process.exitCode = 1;
}
