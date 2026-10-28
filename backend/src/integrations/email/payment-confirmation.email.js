import { sendEmail } from "./email.client.js";
import { createEmailTemplate } from "./email.templates.js";

export const sendPaymentConfirmationEmail = async ({
  email,
  customerName,
  orderNumber,
  amount,
  paymentMethod,
  transactionId,
  currency = "PHP",
}) => {
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(amount);

  return sendEmail({
    to: email,
    subject: `AutoHub Payment Confirmed - ${orderNumber}`,
    text: `Hello ${customerName}, payment for order ${orderNumber} has been confirmed. Amount: ${formattedAmount}.`,
    html: createEmailTemplate({
      title: "Payment Confirmation",
      greeting: customerName,
      message:
        "Your payment has been confirmed. Thank you for choosing AutoHub.",
      details: [
        { label: "Order Number", value: orderNumber },
        { label: "Amount Paid", value: formattedAmount },
        { label: "Payment Method", value: paymentMethod },
        {
          label: "Transaction ID",
          value: transactionId || "Not available",
        },
        { label: "Payment Status", value: "Paid" },
      ],
    }),
  });
};
