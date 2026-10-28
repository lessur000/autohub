import { sendPasswordResetEmail } from "../integrations/email/password-reset.email.js";

try {
  const result = await sendPasswordResetEmail({
    email: "test@example.com",
    customerName: "Juan Dela Cruz",
    resetUrl: "http://localhost:5173/reset-password?token=TEST-ONLY-TOKEN",
  });

  console.log("Password reset email sent successfully.");
  console.log("Message ID:", result.messageId);
} catch (error) {
  console.error("Password reset test failed:", error.message);
  process.exitCode = 1;
}
