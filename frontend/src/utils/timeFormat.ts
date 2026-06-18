/**
 * Hàm tính thời gian tương đối (Ví dụ: "5 phút trước", "hôm qua")
 * @param dateString Chuỗi thời gian chuẩn ISO (VD: 2026-06-17T21:00:00Z)
 */
export const getRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Vừa xong";
  
  // 1. Sửa lỗi Timezone (Múi giờ): 
  // Xóa ký tự 'Z' (chuẩn UTC) ở cuối chuỗi nếu có.
  // Lý do: DB lưu giờ Việt Nam (GMT+7) nhưng không ghi rõ timezone. 
  // Node.js tự động gắn chữ 'Z', khiến Trình duyệt cộng dư thêm 7 tiếng.
  // Việc xóa chữ 'Z' ép trình duyệt hiểu đây là giờ Local (Việt Nam).
  const localDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
  const date = new Date(localDateString);
  const now = new Date();
  
  // Tính khoảng cách thời gian (giây) giữa hiện tại và lúc tạo.
  // Giá trị sẽ là số âm vì date nằm trong quá khứ so với now.
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  // Nếu chênh lệch >= 0 (thời gian ở tương lai do lệch vài giây server), coi như Vừa xong
  if (diffInSeconds >= 0) return "Vừa xong";

  const absDiff = Math.abs(diffInSeconds);
  
  // 2. Sử dụng API Intl.RelativeTimeFormat chuẩn quốc tế của Javascript
  // { numeric: 'auto' } giúp nó tự động dùng chữ "hôm qua" thay vì "1 ngày trước"
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (absDiff < 60) return "Vừa xong";
  
  const diffInMinutes = Math.round(absDiff / 60);
  if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute');
  
  const diffInHours = Math.round(absDiff / 3600);
  if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');
  
  const diffInDays = Math.round(absDiff / 86400);
  if (diffInDays < 30) return rtf.format(-diffInDays, 'day');
  
  const diffInMonths = Math.round(absDiff / 2592000);
  if (diffInMonths < 12) return rtf.format(-diffInMonths, 'month');
  
  const diffInYears = Math.round(absDiff / 31536000);
  return rtf.format(-diffInYears, 'year');
};
