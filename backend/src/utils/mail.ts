import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Mã OTP xác thực tài khoản",
    html: `
      <h2>Xác thực tài khoản Pickleball</h2>
      <p>Mã OTP của bạn là:</p>
      <h1>${otp}</h1>
      <p>Mã có hiệu lực trong 5 phút.</p>
    `,
  });
}