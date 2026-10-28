import { sendPaymentConfirmationEmail } from "../integrations/email/payment-confirmation.email.js";

try {
  const result = await sendPaymentConfirmationEmail({
    email: "test@example.com",
    customerName: "Juan Dela Cruz",
    orderNumber: "AH-TEST-1001",
    amount: 150000,
    paymentMethod: "Xendit QRPh",
    transactionId: "TXN-TEST-1001",
    currency: "PHP",
  });

  console.log("Payment confirmation email sent successfully.");
  console.log("Message ID:", result.messageId);
} catch (error) {
  console.error("Payment confirmation test failed:", error.message);
  process.exitCode = 1;
}
