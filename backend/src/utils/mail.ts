import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  const transporter = getTransporter();
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

export async function sendBookingCreatedEmail(email: string, details: any) {
  try {
    if (!email) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Đặt lịch thành công - Pickleball Booking",
      html: `
        <h2>Xác nhận đặt lịch thành công</h2>
        <p>Chào ${details.playerName},</p>
        <p>Chi tiết đặt lịch của bạn:</p>
        <ul>
          <li><strong>Mã booking:</strong> ${details.bookingCode}</li>
          <li><strong>Loại:</strong> ${details.bookingType}</li>
          <li><strong>Ngày:</strong> ${details.bookingDate}</li>
          <li><strong>Khung giờ:</strong> ${details.startTime} - ${details.endTime}</li>
          ${details.courtName ? `<li><strong>Sân:</strong> ${details.courtName}</li>` : ""}
          ${details.coachName ? `<li><strong>HLV:</strong> ${details.coachName}</li>` : ""}
          <li><strong>Trạng thái:</strong> Chờ thanh toán</li>
        </ul>
        <p><strong>Lưu ý:</strong> Vui lòng thanh toán trong 10 phút hoặc trước giờ bắt đầu sân.</p>
      `,
    });
  } catch (err) {
    console.warn("Failed to send booking created email:", err);
  }
}

export async function sendPaymentSuccessEmail(email: string, details: any) {
  try {
    if (!email) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Thanh toán booking thành công",
      html: `
        <h2>Thanh toán thành công</h2>
        <p>Booking <strong>${details.bookingCode}</strong> đã được thanh toán thành công.</p>
        <ul>
          <li><strong>Số tiền:</strong> ${Number(details.amount).toLocaleString('vi-VN')} VND</li>
          <li><strong>Ngày chơi:</strong> ${details.bookingDate}</li>
          <li><strong>Khung giờ:</strong> ${details.startTime} - ${details.endTime}</li>
        </ul>
        <p>Trạng thái: Đã xác nhận.</p>
        <p>Vui lòng đến đúng giờ để check-in tại sân.</p>
      `,
    });
  } catch (err) {
    console.warn("Failed to send payment success email:", err);
  }
}

export async function sendCoachAssignedEmail(email: string, details: any) {
  try {
    if (!email) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Bạn có booking mới",
      html: `
        <h2>Bạn có một lịch hướng dẫn mới</h2>
        <p>Chi tiết:</p>
        <ul>
          <li><strong>Mã booking:</strong> ${details.bookingCode}</li>
          <li><strong>Học viên:</strong> ${details.playerName}</li>
          <li><strong>Ngày:</strong> ${details.bookingDate}</li>
          <li><strong>Khung giờ:</strong> ${details.startTime} - ${details.endTime}</li>
          <li><strong>Dịch vụ:</strong> ${details.bookingType}</li>
        </ul>
        <p>Vui lòng theo dõi và đến sân đúng giờ.</p>
      `,
    });
  } catch (err) {
    console.warn("Failed to send coach assigned email:", err);
  }
}

export async function sendNoShowEmail(email: string, details: any) {
  try {
    if (!email) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: details.isAuto ? "Booking của bạn đã bị tự động đánh dấu No-show" : "Booking của bạn đã bị đánh dấu No-show",
      html: `
        <h2>Thông báo No-show</h2>
        <p>Booking <strong>${details.bookingCode}</strong> vào lúc ${details.startTime} ngày ${details.bookingDate} đã bị đánh dấu No-show.</p>
        ${details.isAuto ? "<p>Booking của bạn đã bị đánh dấu No-show do không check-in sau 15 phút kể từ giờ bắt đầu.</p>" : (details.reason ? `<p>Lý do: ${details.reason}</p>` : "")}
      `,
    });
  } catch (err) {
    console.warn("Failed to send no-show email:", err);
  }
}

export async function sendPaymentExpiredEmail(email: string, details: any) {
  try {
    if (!email) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Booking đã hết hạn thanh toán",
      html: `
        <h2>Thông báo hết hạn thanh toán</h2>
        <p>Booking <strong>${details.bookingCode}</strong> đã quá thời gian thanh toán và đã tự động bị huỷ.</p>
        <p>Slot đã được mở lại cho người khác đặt. Bạn có thể đặt lại một lịch mới trên hệ thống.</p>
      `,
    });
  } catch (err) {
    console.warn("Failed to send payment expired email:", err);
  }
}