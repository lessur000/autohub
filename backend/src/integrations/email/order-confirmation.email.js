import { sendEmail } from "./email.client.js";
import { createEmailTemplate } from "./email.templates.js";

export const sendOrderConfirmationEmail = async ({
  email,
  customerName,
  orderNumber,
  total,
  currency = "PHP",
}) => {
  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(total);

  return sendEmail({
    to: email,
    subject: `AutoHub Order Confirmation - ${orderNumber}`,
    text: `Hello ${customerName}, your order ${orderNumber} has been received. Total: ${formattedTotal}.`,
    html: createEmailTemplate({
      title: "Order Confirmation",
      greeting: customerName,
      message:
        "Thank you for shopping with AutoHub. We have received your order.",
      details: [
        { label: "Order Number", value: orderNumber },
        { label: "Order Total", value: formattedTotal },
        { label: "Status", value: "Received" },
      ],
    }),
  });
};
