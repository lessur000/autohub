const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

export const createEmailTemplate = ({
  title,
  greeting,
  message,
  details = [],
  actionUrl,
  actionLabel,
}) => {
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeMessage = escapeHtml(message);

  const detailsHtml = details
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">
            ${escapeHtml(label)}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee">
            ${escapeHtml(value)}
          </td>
        </tr>
      `,
    )
    .join("");

  const actionHtml = actionUrl
    ? `
      <p style="margin:24px 0">
        <a
          href="${escapeHtml(actionUrl)}"
          style="background:#111;color:#fff;padding:12px 20px;
          text-decoration:none;border-radius:6px;display:inline-block"
        >
          ${escapeHtml(actionLabel || "Continue")}
        </a>
      </p>
    `
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>${safeTitle}</title>
      </head>
      <body style="font-family:Arial,sans-serif;color:#222;
        line-height:1.6;background:#f5f5f5;padding:24px">
        <div style="max-width:600px;margin:auto;background:#fff;
          padding:28px;border-radius:8px">
          <h1 style="font-size:24px">${safeTitle}</h1>
          <p>Hello ${safeGreeting},</p>
          <p>${safeMessage}</p>
          ${
            details.length
              ? `<table style="width:100%;border-collapse:collapse">
                  ${detailsHtml}
                </table>`
              : ""
          }
          ${actionHtml}
          <p style="color:#777;font-size:12px;margin-top:32px">
            AutoHub · This is an automated email.
          </p>
        </div>
      </body>
    </html>
  `;
};
