/**
 * Script EXPORT kết quả bình chọn ra file
 *
 * Xuất:
 * - Kết quả tổng hợp (JSON và CSV)
 * - Chi tiết từng phiếu (tùy chọn)
 *
 * Cách sử dụng:
 * node scripts/export-results.js
 * node scripts/export-results.js --detailed (bao gồm chi tiết phiếu)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
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

// Parse arguments
const args = process.argv.slice(2);
const includeDetailed = args.includes('--detailed');

// Video definitions
const VIDEOS = [
  { id: 'v1', name: 'Hành Trình Vươn Xa', team: 'Team Marketing' },
  { id: 'v2', name: 'Chuyện Công Sở', team: 'Team Sale & Admin' },
  { id: 'v3', name: 'The Future Is Now', team: 'Team Tech & Product' },
  { id: 'v4', name: 'Người Dẫn Đường', team: 'Team BOD' },
];

const AWARDS = {
  first: { label: 'Giải Nhất', point: 5 },
  second: { label: 'Giải Nhì', point: 3 },
  third: { label: 'Giải Ba', point: 2 },
  none: { label: 'Không chọn', point: 0 }
};

async function exportResults() {
  console.log('');
  console.log('📤 EXPORT KẾT QUẢ BÌNH CHỌN');
  console.log('═'.repeat(50));
  console.log('');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Get all votes
  console.log('📊 Đang lấy dữ liệu...');
  const votesRef = collection(db, 'artifacts', appId, 'public_votes');
  const votesSnap = await getDocs(votesRef);

  const votes = [];
  const scores = {};
  const awardCounts = {};

  VIDEOS.forEach(v => {
    scores[v.id] = 0;
    awardCounts[v.id] = { first: 0, second: 0, third: 0, none: 0 };
  });

  votesSnap.forEach(doc => {
    const data = doc.data();
    votes.push({
      id: doc.id,
      email: data.email || 'N/A',
      name: data.name || 'N/A',
      selections: data.selections || {},
      points: data.points || {},
      timestamp: data.timestamp?.toDate?.() || data.timestamp || 'N/A'
    });

    // Calculate scores
    if (data.points) {
      Object.entries(data.points).forEach(([vid, point]) => {
        if (scores[vid] !== undefined) scores[vid] += point;
      });
    }

    // Count awards
    if (data.selections) {
      Object.entries(data.selections).forEach(([vid, award]) => {
        if (awardCounts[vid] && awardCounts[vid][award] !== undefined) {
          awardCounts[vid][award]++;
        }
      });
    }
  });

  console.log(`   Tổng số phiếu: ${votes.length}`);
  console.log('');

  // Sort results
  const results = VIDEOS.map(v => ({
    id: v.id,
    name: v.name,
    team: v.team,
    score: scores[v.id],
    awards: awardCounts[v.id]
  })).sort((a, b) => b.score - a.score);

  // Display summary
  console.log('🏆 KẾT QUẢ:');
  console.log('─'.repeat(50));
  results.forEach((item, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    console.log(`${medal} ${item.name}`);
    console.log(`   Team: ${item.team}`);
    console.log(`   Điểm: ${item.score}`);
    console.log(`   Giải Nhất: ${item.awards.first} | Nhì: ${item.awards.second} | Ba: ${item.awards.third}`);
    console.log('');
  });

  // Create output directory
  const outputDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Export JSON
  const jsonData = {
    exportedAt: new Date().toISOString(),
    totalVotes: votes.length,
    results: results,
    ...(includeDetailed && { votes: votes })
  };

  const jsonFile = path.join(outputDir, `results_${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`📄 Đã xuất JSON: ${jsonFile}`);

  // Export CSV - Summary
  let csvSummary = 'Rank,Video,Team,Score,First_Awards,Second_Awards,Third_Awards\n';
  results.forEach((item, idx) => {
    csvSummary += `${idx + 1},"${item.name}","${item.team}",${item.score},${item.awards.first},${item.awards.second},${item.awards.third}\n`;
  });

  const csvSummaryFile = path.join(outputDir, `summary_${timestamp}.csv`);
  fs.writeFileSync(csvSummaryFile, csvSummary, 'utf-8');
  console.log(`📄 Đã xuất CSV (tổng hợp): ${csvSummaryFile}`);

  // Export CSV - Detailed votes
  if (includeDetailed) {
    let csvDetailed = 'Email,Name,Timestamp';
    VIDEOS.forEach(v => {
      csvDetailed += `,${v.name}_Award,${v.name}_Points`;
    });
    csvDetailed += '\n';

    votes.forEach(vote => {
      csvDetailed += `"${vote.email}","${vote.name}","${vote.timestamp}"`;
      VIDEOS.forEach(v => {
        const award = vote.selections[v.id] || 'none';
        const points = vote.points[v.id] || 0;
        csvDetailed += `,"${AWARDS[award]?.label || award}",${points}`;
      });
      csvDetailed += '\n';
    });

    const csvDetailedFile = path.join(outputDir, `detailed_${timestamp}.csv`);
    fs.writeFileSync(csvDetailedFile, csvDetailed, 'utf-8');
    console.log(`📄 Đã xuất CSV (chi tiết): ${csvDetailedFile}`);
  }

  console.log('');
  console.log('═'.repeat(50));
  console.log('✅ EXPORT HOÀN TẤT!');
  console.log(`   Output directory: ${outputDir}`);
  console.log('');
}

exportResults().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
