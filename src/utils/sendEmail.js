import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000 
  });

  await transporter.sendMail({
    from: `"Kaaltube" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};

export const sendEmailWithTimeout = (data, ms = 12000) =>
  Promise.race([
    sendEmail(data),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timeout")), ms)
    )
]);
