/**
 * Script RESET tất cả phiếu bầu
 *
 * ⚠️ CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ phiếu bầu!
 * Không thể hoàn tác sau khi chạy.
 *
 * Cách sử dụng:
 * node scripts/reset-votes.js
 *
 * Với confirmation tự động:
 * node scripts/reset-votes.js --confirm
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

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
const securityCode = process.env.VITE_SECURITY_CODE;

// Parse arguments
const args = process.argv.slice(2);
const autoConfirm = args.includes('--confirm');

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function resetVotes() {
  console.log('');
  console.log('⚠️  RESET PHIẾU BẦU');
  console.log('═'.repeat(50));
  console.log('');
  console.log('❗ CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ phiếu bầu!');
  console.log('   Không thể hoàn tác sau khi thực hiện.');
  console.log('');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Count current votes
  const publicVotesRef = collection(db, 'artifacts', appId, 'public_votes');
  const publicVotesSnap = await getDocs(publicVotesRef);
  const currentVotes = publicVotesSnap.size;

  console.log(`📊 Số phiếu hiện tại: ${currentVotes}`);
  console.log('');

  if (currentVotes === 0) {
    console.log('✅ Không có phiếu nào để xóa.');
    process.exit(0);
  }

  // Confirm
  if (!autoConfirm) {
    // Verify security code if set
    if (securityCode) {
      const inputCode = await prompt('🔐 Nhập mã bảo mật: ');
      if (inputCode !== securityCode) {
        console.log('❌ Mã bảo mật không đúng!');
        process.exit(1);
      }
    }

    const confirm = await prompt(`Bạn có chắc muốn xóa ${currentVotes} phiếu bầu? (yes/no): `);
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Đã hủy.');
      process.exit(0);
    }
  }

  console.log('');
  console.log('🗑️  Đang xóa phiếu bầu...');

  // Delete all public_votes
  let deletedPublic = 0;
  for (const docSnap of publicVotesSnap.docs) {
    await deleteDoc(docSnap.ref);
    deletedPublic++;
    if (deletedPublic % 10 === 0 || deletedPublic === publicVotesSnap.size) {
      process.stdout.write(`\r   Đã xóa public_votes: ${deletedPublic}/${publicVotesSnap.size}`);
    }
  }
  console.log('');

  // Delete all user_votes
  const userVotesRef = collection(db, 'artifacts', appId, 'user_votes');
  const userVotesSnap = await getDocs(userVotesRef);
  let deletedUser = 0;
  for (const docSnap of userVotesSnap.docs) {
    await deleteDoc(docSnap.ref);
    deletedUser++;
    if (deletedUser % 10 === 0 || deletedUser === userVotesSnap.size) {
      process.stdout.write(`\r   Đã xóa user_votes: ${deletedUser}/${userVotesSnap.size}`);
    }
  }
  console.log('');

  // Reset voting status
  console.log('   Đang reset trạng thái voting...');
  const statusRef = doc(db, 'artifacts', appId, 'config', 'voting_status');
  await setDoc(statusRef, {
    isLocked: false,
    resetAt: new Date().toISOString(),
    resetBy: 'cli-script'
  });

  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ RESET HOÀN TẤT!');
  console.log(`   - Đã xóa ${deletedPublic} public_votes`);
  console.log(`   - Đã xóa ${deletedUser} user_votes`);
  console.log(`   - Đã mở lại voting`);
  console.log('');
  console.log(`Reset lúc: ${new Date().toLocaleString('vi-VN')}`);
  console.log('');
}

resetVotes().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
