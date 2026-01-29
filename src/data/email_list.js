/**
 * DANH SÁCH EMAIL ĐƯỢC PHÉP ĐĂNG NHẬP
 *
 * Cách sử dụng:
 * 1. Mở file CSV chứa danh sách email
 * 2. Copy toàn bộ email và paste vào array bên dưới
 * 3. Đảm bảo mỗi email nằm trên một dòng và được bọc trong dấu nháy
 *
 * Ví dụ format:
 * export const ALLOWED_EMAILS = [
 *   "user1@company.com",
 *   "user2@company.com",
 *   ...
 * ];
 *
 * Tip: Sử dụng script convert-csv.js để tự động chuyển từ CSV
 */

export const ALLOWED_EMAILS = [
  // === PASTE DANH SÁCH EMAIL TẠI ĐÂY ===
  // Mỗi email một dòng, format: "email@company.com",

  // Ví dụ:
  // "nguyen.van.a@company.com",
  // "tran.thi.b@company.com",

  // === KẾT THÚC DANH SÁCH ===
];

// Cho phép tất cả domain (chỉ dùng khi test)
export const ALLOW_ALL_DOMAINS = false;

/**
 * Kiểm tra email có được phép không
 * @param {string} email
 * @returns {boolean}
 */
export const isEmailAllowed = (email) => {
  if (ALLOW_ALL_DOMAINS) return true;
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase().trim());
};
