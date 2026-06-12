import crypto from 'crypto';
import axios from 'axios';

// Giả sử có sẵn các config trong env
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "";
const MOMO_API_URL = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/refund";

export type MomoRefundRequest = {
  orderId: string; // Mã đơn hàng gốc
  amount: number; // Số tiền gốc
  transId: number; // transId của Momo trả về khi thanh toán thành công
  refundAmount?: number; // Số tiền hoàn (có thể partial)
};

export async function processMomoRefund(data: MomoRefundRequest, refundCode: string) {
  if (!MOMO_PARTNER_CODE || !MOMO_SECRET_KEY || !MOMO_ACCESS_KEY) {
    throw new Error("Missing MoMo Refund configuration in environment variables.");
  }

  const { orderId, amount, transId, refundAmount } = data;
  const actualRefundAmount = refundAmount || amount;

  const requestId = `${refundCode}-${Date.now()}`; // unique request id
  const refundReqId = refundCode; // unique refund order id cho request này

  // Tạo signature theo chuẩn MoMo: 
  // accessKey=$accessKey&amount=$amount&description=$description&orderId=$orderId&partnerCode=$partnerCode&requestId=$requestId&transId=$transId
  // Lưu ý MoMo v2 Refund API Signature format:
  // accessKey=...&amount=...&description=...&orderId=...&partnerCode=...&requestId=...&transId=...
  // Nhưng đối với v2 Refund, format signature là: 
  const description = `Hoan tien giao dich ${orderId}`; // unaccented

  // raw signature format: accessKey=...&amount=...&description=...&orderId=...&partnerCode=...&requestId=...&transId=...
  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${actualRefundAmount}&description=${description}&orderId=${orderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}&transId=${transId}`;

  const signature = crypto
    .createHmac("sha256", MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    orderId: refundReqId,
    requestId: requestId,
    amount: actualRefundAmount,
    transId: transId,
    lang: "vi",
    description: description,
    signature: signature,
  };

  try {
    const response = await axios.post(MOMO_API_URL, requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data;
  } catch (error: any) {
    console.error("MoMo Refund Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Lỗi gọi API hoàn tiền MoMo");
  }
}
