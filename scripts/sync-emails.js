/**
 * Script SYNC danh sách email giữa CSV và Firestore
 *
 * Tính năng:
 * - Thêm email mới từ CSV
 * - Xóa email không còn trong CSV (tùy chọn)
 * - Hiển thị diff trước khi thực hiện
 * - Cập nhật cả local file và Firestore
 *
 * Cách sử dụng:
 * 1. Đặt file mail_list.csv vào thư mục scripts/
 * 2. Tạo file .env với Firebase credentials
 * 3. Chạy: node scripts/sync-emails.js
 * 4. Có option: node scripts/sync-emails.js --dry-run (chỉ xem diff, không thay đổi)
 *               node scripts/sync-emails.js --no-delete (chỉ thêm, không xóa)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const appId = process.env.VITE_APP_ID || 'default-app';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const noDelete = args.includes('--no-delete');

const CSV_FILE = path.join(__dirname, 'mail_list.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'email_list.js');

// Email to Firestore doc ID
function emailToDocId(email) {
  return email.replace('@', '_at_').replace(/\./g, '_dot_');
}

// Extract emails from CSV
function extractEmailsFromCSV(csvContent) {
  const lines = csvContent.split('\n');
  const emails = [];

  const firstLine = lines[0]?.toLowerCase().trim();

  // Check if first line contains an email address (if so, it's data, not header)
  const firstLineParts = firstLine ? firstLine.split(/[,\t]/) : [];
  const firstLineHasEmail = firstLineParts.some(part =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part.trim().replace(/['"]/g, ''))
  );

  const hasHeader = !firstLineHasEmail && (firstLine?.includes('email') || firstLine?.includes('mail'));
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[,\t]/);
    for (const part of parts) {
      const cleaned = part.trim().replace(/['"]/g, '');
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        emails.push(cleaned.toLowerCase());
        break;
      }
    }
  }

  return [...new Set(emails)];
}

// Generate local email_list.js file
function generateLocalEmailFile(emails) {
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
 * 2. Chạy: node scripts/sync-emails.js
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

// Main sync function
async function syncEmails() {
  console.log('📧 EMAIL SYNC TOOL');
  console.log('==================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (chỉ xem, không thay đổi)' : 'LIVE'}`);
  console.log(`Delete mode: ${noDelete ? 'DISABLED (chỉ thêm)' : 'ENABLED (thêm + xóa)'}`);
  console.log('');

  // Step 1: Read CSV
  console.log('📂 Đang đọc file CSV...');
  if (!fs.existsSync(CSV_FILE)) {
    console.error('❌ Không tìm thấy file mail_list.csv tại:', CSV_FILE);
    console.log('');
    console.log('Hướng dẫn:');
    console.log('1. Tạo file scripts/mail_list.csv');
    console.log('2. Mỗi dòng một email hoặc có cột "email"');
    console.log('3. Chạy lại script này');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const csvEmails = extractEmailsFromCSV(csvContent);
  console.log(`   Tìm thấy ${csvEmails.length} email trong CSV`);

  // Step 2: Initialize Firebase and get current Firestore emails
  console.log('');
  console.log('🔥 Đang kết nối Firestore...');

  let firestoreEmails = [];
  let db;

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    const listRef = collection(db, 'artifacts', appId, 'config', 'allowed_emails', 'list');
    const snapshot = await getDocs(listRef);

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        firestoreEmails.push(data.email.toLowerCase());
      }
    });
    console.log(`   Tìm thấy ${firestoreEmails.length} email trong Firestore`);
  } catch (error) {
    console.log('   ⚠️ Không thể kết nối Firestore:', error.message);
    console.log('   Sẽ chỉ cập nhật file local.');
    firestoreEmails = [];
  }

  // Step 3: Calculate diff
  console.log('');
  console.log('📊 PHÂN TÍCH THAY ĐỔI:');
  console.log('─'.repeat(50));

  const csvSet = new Set(csvEmails);
  const firestoreSet = new Set(firestoreEmails);

  const toAdd = csvEmails.filter(e => !firestoreSet.has(e));
  const toDelete = firestoreEmails.filter(e => !csvSet.has(e));
  const unchanged = csvEmails.filter(e => firestoreSet.has(e));

  console.log(`   ✅ Giữ nguyên: ${unchanged.length} email`);
  console.log(`   ➕ Thêm mới:   ${toAdd.length} email`);
  console.log(`   ➖ Xóa bỏ:     ${noDelete ? '0 (disabled)' : toDelete.length + ' email'}`);
  console.log('');

  if (toAdd.length > 0) {
    console.log('📥 EMAIL SẼ THÊM MỚI:');
    toAdd.slice(0, 10).forEach(e => console.log(`   + ${e}`));
    if (toAdd.length > 10) console.log(`   ... và ${toAdd.length - 10} email khác`);
    console.log('');
  }

  if (toDelete.length > 0 && !noDelete) {
    console.log('📤 EMAIL SẼ XÓA:');
    toDelete.slice(0, 10).forEach(e => console.log(`   - ${e}`));
    if (toDelete.length > 10) console.log(`   ... và ${toDelete.length - 10} email khác`);
    console.log('');
  }

  // Step 4: Confirm and execute
  if (isDryRun) {
    console.log('🔍 DRY RUN - Không có thay đổi nào được thực hiện.');
    console.log('   Để thực hiện thay đổi, chạy lại mà không có --dry-run');
    process.exit(0);
  }

  if (toAdd.length === 0 && (toDelete.length === 0 || noDelete)) {
    console.log('✅ Không có thay đổi nào cần thực hiện.');
    process.exit(0);
  }

  // Step 5: Update local file
  console.log('📁 Đang cập nhật file local...');
  const localContent = generateLocalEmailFile(csvEmails);
  fs.writeFileSync(OUTPUT_FILE, localContent, 'utf-8');
  console.log(`   ✅ Đã cập nhật: ${OUTPUT_FILE}`);

  // Step 6: Update Firestore
  if (db) {
    console.log('');
    console.log('☁️  Đang cập nhật Firestore...');

    // Add new emails
    if (toAdd.length > 0) {
      const BATCH_SIZE = 450;
      let added = 0;

      for (let i = 0; i < toAdd.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = toAdd.slice(i, i + BATCH_SIZE);

        for (const email of chunk) {
          const docId = emailToDocId(email);
          const ref = doc(db, 'artifacts', appId, 'config', 'allowed_emails', 'list', docId);
          batch.set(ref, {
            email: email,
            addedAt: new Date().toISOString()
          });
        }

        await batch.commit();
        added += chunk.length;
        console.log(`   ➕ Đã thêm ${added}/${toAdd.length} email`);
      }
    }

    // Delete removed emails
    if (toDelete.length > 0 && !noDelete) {
      let deleted = 0;
      for (const email of toDelete) {
        const docId = emailToDocId(email);
        const ref = doc(db, 'artifacts', appId, 'config', 'allowed_emails', 'list', docId);
        await deleteDoc(ref);
        deleted++;
        if (deleted % 50 === 0 || deleted === toDelete.length) {
          console.log(`   ➖ Đã xóa ${deleted}/${toDelete.length} email`);
        }
      }
    }

    // Update metadata
    const metaRef = doc(db, 'artifacts', appId, 'config', 'allowed_emails');
    await setDoc(metaRef, {
      totalCount: csvEmails.length,
      lastUpdated: new Date().toISOString(),
      source: 'csv_sync',
      added: toAdd.length,
      deleted: noDelete ? 0 : toDelete.length
    });
    console.log('   ✅ Đã cập nhật metadata');
  }

  // Summary
  console.log('');
  console.log('🎉 SYNC HOÀN TẤT!');
  console.log('─'.repeat(50));
  console.log(`   Tổng email hiện tại: ${csvEmails.length}`);
  console.log(`   Đã thêm: ${toAdd.length}`);
  console.log(`   Đã xóa: ${noDelete ? 0 : toDelete.length}`);
  console.log('');
}

syncEmails().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
