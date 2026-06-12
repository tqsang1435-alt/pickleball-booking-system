import crypto from "crypto";
import { paymentConfig } from "@/config/payment";
import type { MomoWebhookBody } from "../payments.type";

export type CreateMomoPaymentParams = {
  paymentId: number;
  amount: number;
  paymentCode: string; // Used as orderId
  bookingId: number;
};

export type MomoPaymentResult = {
  success: boolean;
  checkoutUrl?: string;
  errorMessage?: string;
  rawResponse: string;
};

/**
 * Creates an HMAC-SHA256 signature for MoMo API requests.
 */
function createMomoSignature(rawSignature: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

/**
 * Calls MoMo API to create a payment link/deeplink.
 */
export async function createMomoPaymentLink(
  params: CreateMomoPaymentParams
): Promise<MomoPaymentResult> {
  const { momo } = paymentConfig;

  // Configuration check
  if (!momo.partnerCode || !momo.accessKey || !momo.secretKey) {
    return {
      success: false,
      errorMessage: "Thiếu cấu hình MoMo trong biến môi trường",
      rawResponse: JSON.stringify({ error: "Missing config" }),
    };
  }

  const partnerCode = momo.partnerCode;
  const accessKey = momo.accessKey;
  const secretKey = momo.secretKey;
  const endpoint = momo.endpoint;
  const redirectUrl = momo.redirectUrl;
  const ipnUrl = momo.ipnUrl;
  const requestType = momo.requestType;
  const lang = "vi";

  // Request variables
  const orderId = params.paymentCode;
  const requestId = `${orderId}-${Date.now()}`;
  const amount = params.amount.toString();
  const orderInfo = `Thanh toan booking ${params.bookingId}`;
  const extraData = Buffer.from(JSON.stringify({ bookingId: params.bookingId })).toString("base64");
  // Hết hạn sau 10 phút - MoMo yêu cầu Unix timestamp tính bằng giây
  const orderExpireTime = Math.floor(Date.now() / 1000) + 600;

  // Raw signature string following MoMo format (alphabetical order)
  // Lưu ý: orderExpireTime KHÔNG đưa vào rawSignature - MoMo không verify field này
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  // Generate signature
  const signature = createMomoSignature(rawSignature, secretKey);

  const requestBody = {
    partnerCode,
    partnerName: "Pickleball System",
    storeId: "PickleballBooking",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture: true,
    extraData,
    orderExpireTime,
    signature,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    const rawResponse = JSON.stringify(responseData);

    console.log("[MoMo Gateway] Response:", rawResponse);

    if (responseData.resultCode === 0 && responseData.payUrl) {
      return {
        success: true,
        checkoutUrl: responseData.payUrl,
        rawResponse,
      };
    } else {
      return {
        success: false,
        errorMessage: responseData.message || "MoMo API trả về lỗi",
        rawResponse,
      };
    }
  } catch (error: any) {
    console.error("[MoMo Gateway] Error creating payment link:", error);
    return {
      success: false,
      errorMessage: error.message,
      rawResponse: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Verifies the signature of the MoMo IPN/webhook payload.
 *
 * return: { isValid: boolean, data?: MomoWebhookBody }
 */
export async function verifyMomoIpn(
  body: MomoWebhookBody
): Promise<{ isValid: boolean; data?: MomoWebhookBody }> {
  const { momo } = paymentConfig;
  const secretKey = momo.secretKey;

  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = body;

  const rawSignature = `accessKey=${momo.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const generatedSignature = createMomoSignature(rawSignature, secretKey);

  if (generatedSignature === signature) {
    return { isValid: true, data: body };
  } else {
    return { isValid: false };
  }
}

/**
 * Helper to determine if MoMo webhook result is a success.
 * In MoMo, resultCode === 0 means success.
 */
export function isMomoWebhookSuccess(resultCode: number): boolean {
  return resultCode === 0;
}
