/**
 * Email Validation Service
 *
 * Hỗ trợ 2 nguồn dữ liệu:
 * 1. Local file (src/data/email_list.js) - mặc định
 * 2. Firestore (realtime, linh hoạt hơn)
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, activeAppId } from '../config/firebase';
import { ALLOWED_EMAILS, ALLOW_ALL_DOMAINS, isEmailAllowed as localCheck } from '../data/email_list';

// Cache cho Firestore emails
let firestoreEmailsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy danh sách email từ Firestore
 */
export async function fetchEmailsFromFirestore() {
  // Kiểm tra cache
  if (firestoreEmailsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return firestoreEmailsCache;
  }

  try {
    const listRef = collection(db, 'artifacts', activeAppId, 'config', 'allowed_emails', 'list');
    const snapshot = await getDocs(listRef);

    const emails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        emails.push(data.email.toLowerCase());
      }
    });

    // Update cache
    firestoreEmailsCache = emails;
    cacheTimestamp = Date.now();

    return emails;
  } catch (error) {
    console.error('Lỗi khi lấy email từ Firestore:', error);
    // Fallback về local list
    return ALLOWED_EMAILS;
  }
}

/**
 * Kiểm tra xem có sử dụng Firestore không
 */
export async function isUsingFirestore() {
  try {
    const metaRef = doc(db, 'artifacts', activeAppId, 'config', 'allowed_emails');
    const metaSnap = await getDoc(metaRef);
    return metaSnap.exists();
  } catch {
    return false;
  }
}

/**
 * Kiểm tra email có được phép không
 * Tự động detect nguồn dữ liệu
 */
export async function validateEmail(email) {
  if (ALLOW_ALL_DOMAINS) return { allowed: true, source: 'bypass' };
  if (!email) return { allowed: false, source: 'invalid' };

  const normalizedEmail = email.toLowerCase().trim();

  // Thử Firestore trước
  const useFirestore = await isUsingFirestore();

  if (useFirestore) {
    const firestoreEmails = await fetchEmailsFromFirestore();
    const allowed = firestoreEmails.includes(normalizedEmail);
    return { allowed, source: 'firestore' };
  }

  // Fallback về local
  const allowed = localCheck(normalizedEmail);
  return { allowed, source: 'local' };
}

/**
 * Kiểm tra nhanh (sync) - chỉ dùng local
 */
export function validateEmailSync(email) {
  return localCheck(email);
}

/**
 * Lấy thống kê email
 */
export async function getEmailStats() {
  const useFirestore = await isUsingFirestore();

  if (useFirestore) {
    const metaRef = doc(db, 'artifacts', activeAppId, 'config', 'allowed_emails');
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists()) {
      return {
        source: 'firestore',
        ...metaSnap.data()
      };
    }
  }

  return {
    source: 'local',
    totalCount: ALLOWED_EMAILS.length,
    lastUpdated: 'N/A'
  };
}
