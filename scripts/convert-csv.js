/**
 * Script chuyển đổi file CSV thành danh sách email cho hệ thống
 *
 * Cách sử dụng:
 * 1. Đặt file CSV vào thư mục scripts/ với tên mail_list.csv
 * 2. Chạy: node scripts/convert-csv.js
 * 3. Copy output vào file src/data/email_list.js
 *
 * Format CSV hỗ trợ:
 * - Mỗi email trên một dòng
 * - Hoặc có header (email, Email, EMAIL)
 * - Hoặc email nằm ở cột đầu tiên
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, 'mail_list.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'email_list.js');

// Đọc file CSV
function readCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Không thể đọc file: ${filePath}`);
    console.error('Hãy đảm bảo file mail_list.csv tồn tại trong thư mục scripts/');
    process.exit(1);
  }
}

// Parse CSV và extract emails
function extractEmails(csvContent) {
  const lines = csvContent.split('\n');
  const emails = [];

  // Kiểm tra xem dòng đầu có phải header không
  const firstLine = lines[0]?.toLowerCase().trim();
  const hasHeader = firstLine?.includes('email') || firstLine?.includes('mail');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Tách theo dấu phẩy hoặc tab
    const parts = line.split(/[,\t]/);

    // Tìm email trong các parts
    for (const part of parts) {
      const cleaned = part.trim().replace(/['"]/g, '');
      if (isValidEmail(cleaned)) {
        emails.push(cleaned.toLowerCase());
        break; // Chỉ lấy email đầu tiên trong mỗi dòng
      }
    }
  }

  // Loại bỏ trùng lặp
  return [...new Set(emails)];
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Tạo nội dung file output
function generateOutputContent(emails) {
  const emailStrings = emails.map(e => `  "${e}",`).join('\n');

  return `/**
 * DANH SÁCH EMAIL ĐƯỢC PHÉP ĐĂNG NHẬP
 *
 * File này được tạo tự động từ CSV
 * Tổng số email: ${emails.length}
 * Thời gian tạo: ${new Date().toLocaleString('vi-VN')}
 *
 * Để cập nhật:
 * 1. Chỉnh sửa file scripts/mail_list.csv
 * 2. Chạy: node scripts/convert-csv.js
 */

export const ALLOWED_EMAILS = [
${emailStrings}
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
`;
}

// Main
function main() {
  console.log('🔄 Đang đọc file CSV...');
  const csvContent = readCSV(CSV_FILE);

  console.log('📧 Đang trích xuất email...');
  const emails = extractEmails(csvContent);

  if (emails.length === 0) {
    console.error('❌ Không tìm thấy email hợp lệ trong file CSV');
    process.exit(1);
  }

  console.log(`✅ Tìm thấy ${emails.length} email hợp lệ`);

  // Tạo file output
  const outputContent = generateOutputContent(emails);
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf-8');

  console.log(`📁 Đã ghi vào file: ${OUTPUT_FILE}`);
  console.log('');
  console.log('Danh sách email:');
  emails.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  if (emails.length > 5) {
    console.log(`  ... và ${emails.length - 5} email khác`);
  }
}

main();
