import { sendOrderConfirmationEmail } from "../integrations/email/order-confirmation.email.js";

try {
  const result = await sendOrderConfirmationEmail({
    email: "test@example.com",
    customerName: "Juan Dela Cruz",
    orderNumber: "AH-TEST-1001",
    total: 150000,
    currency: "PHP",
  });

  console.log("Order confirmation email sent successfully.");
  console.log("Message ID:", result.messageId);
} catch (error) {
  console.error("Order confirmation test failed:", error.message);
  process.exitCode = 1;
}
