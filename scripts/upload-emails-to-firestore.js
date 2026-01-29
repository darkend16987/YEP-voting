/**
 * Script upload danh sách email lên Firestore
 *
 * Ưu điểm của việc dùng Firestore:
 * - Có thể thêm/xóa email mà không cần redeploy
 * - Quản lý dễ dàng qua Firebase Console
 * - Hỗ trợ realtime update
 *
 * Cách sử dụng:
 * 1. Đặt file mail_list.csv vào thư mục scripts/
 * 2. Tạo file .env với Firebase credentials
 * 3. Chạy: node scripts/upload-emails-to-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CSV_FILE = path.join(__dirname, 'mail_list.csv');

function extractEmails(csvContent) {
  const lines = csvContent.split('\n');
  const emails = [];

  const firstLine = lines[0]?.toLowerCase().trim();
  const hasHeader = firstLine?.includes('email') || firstLine?.includes('mail');
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

async function uploadEmails() {
  console.log('🔄 Đang đọc file CSV...');

  if (!fs.existsSync(CSV_FILE)) {
    console.error('❌ Không tìm thấy file mail_list.csv');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const emails = extractEmails(csvContent);

  console.log(`✅ Tìm thấy ${emails.length} email`);

  // Upload từng batch (Firestore limit 500 writes per batch)
  const BATCH_SIZE = 450;
  let uploaded = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = emails.slice(i, i + BATCH_SIZE);

    for (const email of chunk) {
      // Dùng email làm document ID (thay @ bằng _at_ để hợp lệ)
      const docId = email.replace('@', '_at_').replace(/\./g, '_dot_');
      const ref = doc(db, 'artifacts', appId, 'config', 'allowed_emails', 'list', docId);
      batch.set(ref, {
        email: email,
        addedAt: new Date().toISOString()
      });
    }

    await batch.commit();
    uploaded += chunk.length;
    console.log(`📤 Đã upload ${uploaded}/${emails.length} email`);
  }

  // Lưu thêm metadata
  const metaRef = doc(db, 'artifacts', appId, 'config', 'allowed_emails');
  await setDoc(metaRef, {
    totalCount: emails.length,
    lastUpdated: new Date().toISOString(),
    source: 'csv_upload'
  });

  console.log('');
  console.log('✅ Upload hoàn tất!');
  console.log(`📊 Tổng số email: ${emails.length}`);
  console.log('');
  console.log('Lưu ý: Để sử dụng Firestore làm nguồn email,');
  console.log('hãy set EMAIL_SOURCE=firestore trong file config');
}

uploadEmails().catch(console.error);
