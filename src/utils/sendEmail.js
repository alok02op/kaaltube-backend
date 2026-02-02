import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.BREVO_API_KEY,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: "Kaaltube <no-reply@brevo.com>",
    to,
    subject,
    text,
    html,
  });
};
