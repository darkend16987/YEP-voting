/**
 * Script kiểm tra trạng thái hệ thống voting
 *
 * Hiển thị:
 * - Số lượng email được phép
 * - Số lượng phiếu bầu
 * - Trạng thái voting (mở/đóng)
 * - Kết quả hiện tại
 *
 * Cách sử dụng:
 * node scripts/check-status.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection } from 'firebase/firestore';
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

// Video definitions (should match constants.js)
const VIDEOS = [
  { id: 'v1', name: 'Hành Trình Vươn Xa', team: 'Team Marketing' },
  { id: 'v2', name: 'Chuyện Công Sở', team: 'Team Sale & Admin' },
  { id: 'v3', name: 'The Future Is Now', team: 'Team Tech & Product' },
  { id: 'v4', name: 'Người Dẫn Đường', team: 'Team BOD' },
];

async function checkStatus() {
  console.log('');
  console.log('🔍 KIỂM TRA TRẠNG THÁI HỆ THỐNG VOTING');
  console.log('═'.repeat(60));
  console.log('');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // 1. Check email list
  console.log('📧 DANH SÁCH EMAIL CHO PHÉP:');
  console.log('─'.repeat(40));
  try {
    const emailMetaRef = doc(db, 'artifacts', appId, 'config', 'allowed_emails');
    const emailMeta = await getDoc(emailMetaRef);

    if (emailMeta.exists()) {
      const data = emailMeta.data();
      console.log(`   Tổng số email: ${data.totalCount || 'N/A'}`);
      console.log(`   Cập nhật lần cuối: ${data.lastUpdated || 'N/A'}`);
      console.log(`   Nguồn: ${data.source || 'N/A'}`);
    } else {
      console.log('   ⚠️ Chưa có metadata email trong Firestore');
      console.log('   Hệ thống sẽ dùng file local');
    }
  } catch (error) {
    console.log('   ❌ Lỗi:', error.message);
  }
  console.log('');

  // 2. Check voting status
  console.log('🔐 TRẠNG THÁI VOTING:');
  console.log('─'.repeat(40));
  try {
    const statusRef = doc(db, 'artifacts', appId, 'config', 'voting_status');
    const statusSnap = await getDoc(statusRef);

    if (statusSnap.exists()) {
      const data = statusSnap.data();
      console.log(`   Trạng thái: ${data.isLocked ? '🔒 ĐÃ KHÓA' : '🟢 ĐANG MỞ'}`);
      if (data.isLocked) {
        console.log(`   Khóa lúc: ${data.lockedAt || 'N/A'}`);
      }
    } else {
      console.log('   Trạng thái: 🟢 ĐANG MỞ (chưa có config)');
    }
  } catch (error) {
    console.log('   ❌ Lỗi:', error.message);
  }
  console.log('');

  // 3. Check votes
  console.log('📊 THỐNG KÊ PHIẾU BẦU:');
  console.log('─'.repeat(40));
  try {
    const votesRef = collection(db, 'artifacts', appId, 'public_votes');
    const votesSnap = await getDocs(votesRef);

    const totalVotes = votesSnap.size;
    console.log(`   Tổng số phiếu: ${totalVotes}`);

    // Calculate scores
    const scores = {};
    VIDEOS.forEach(v => scores[v.id] = 0);

    votesSnap.forEach(doc => {
      const data = doc.data();
      if (data.points) {
        Object.entries(data.points).forEach(([vid, point]) => {
          if (scores[vid] !== undefined) scores[vid] += point;
        });
      }
    });

    console.log('');
    console.log('🏆 KẾT QUẢ HIỆN TẠI:');
    console.log('─'.repeat(40));

    // Sort by score
    const sorted = VIDEOS.map(v => ({
      ...v,
      score: scores[v.id]
    })).sort((a, b) => b.score - a.score);

    sorted.forEach((item, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
      const bar = '█'.repeat(Math.floor(item.score / 5)) + '░'.repeat(Math.max(0, 20 - Math.floor(item.score / 5)));
      console.log(`   ${medal} ${item.name.padEnd(25)} ${bar} ${item.score} pts`);
      console.log(`      ${item.team}`);
    });

  } catch (error) {
    console.log('   ❌ Lỗi:', error.message);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log(`Kiểm tra lúc: ${new Date().toLocaleString('vi-VN')}`);
  console.log('');
}

checkStatus().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
