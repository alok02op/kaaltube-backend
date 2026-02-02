import Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendEmail = async ({ to, subject, text, html }) => {
  await apiInstance.sendTransacEmail({
    sender: {
      email: "no-reply@brevo.com",
      name: "Kaaltube",
    },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html,
  });
};
