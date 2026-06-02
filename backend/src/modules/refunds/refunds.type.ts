export type CreateRefundInput = {
  bookingId: number;
  paymentId: number;
  refundAmount: number;
  reason: string;
};

export type RefundResult = {
  refundId: number;
  bookingId: number;
  paymentId: number;
  refundAmount: number;
  status: string;
  message: string;
};
