// Danh sách tác phẩm dự thi
export const VIDEOS = [
  {
    id: 'v1',
    name: 'Xuân này, ta lớn hơn',
    team: 'Liên quân Zone2',
    color: 'bg-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'v2',
    name: 'The Jump - Bứt phá',
    team: 'Liên quân Zone 5',
    color: 'bg-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'v3',
    name: 'Thức tỉnh',
    team: 'Liên quân Zone 6',
    color: 'bg-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-violet-600',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30'
  }
];

// Cơ cấu giải thưởng và Giới hạn
// Cơ cấu giải thưởng và Giới hạn
export const AWARDS = [
  {
    id: 'none',
    label: 'Chưa chọn',
    shortLabel: '---',
    point: 0,
    limit: 999,
    icon: null,
    bgColor: 'bg-slate-700',
    textColor: 'text-slate-400',
    selectedBg: 'bg-slate-600',
  },
  {
    id: 'first',
    label: 'Giải Nhất',
    shortLabel: 'Nhất',
    point: 5,
    limit: 1,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    selectedBg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-500/50',
    description: '5 điểm - Tối đa 1 giải'
  },
  {
    id: 'second',
    label: 'Giải Nhì',
    shortLabel: 'Nhì',
    point: 3,
    limit: 1,
    bgColor: 'bg-slate-300/10',
    textColor: 'text-slate-300',
    selectedBg: 'bg-gradient-to-r from-slate-400 to-slate-500',
    borderColor: 'border-slate-400/50',
    description: '3 điểm - Tối đa 1 giải'
  },
  {
    id: 'third',
    label: 'Giải Ba',
    shortLabel: 'Ba',
    point: 2,
    limit: 1,
    bgColor: 'bg-amber-600/10',
    textColor: 'text-amber-600',
    selectedBg: 'bg-gradient-to-r from-amber-600 to-amber-700',
    borderColor: 'border-amber-600/50',
    description: '2 điểm - Tối đa 1 giải'
  },
];

// Tổng số user dự kiến (có thể cấu hình qua env)
export const TOTAL_EXPECTED_USERS = parseInt(import.meta.env.VITE_TOTAL_EXPECTED_USERS) || 280;

// Cấu hình validation
export const VOTING_RULES = {
  mustVoteAll: true, // Phải chấm hết tất cả video
  canChangeVote: false, // Không được sửa vote
};

// Admin configuration - Đọc từ environment variables để bảo mật
// QUAN TRỌNG: Không hardcode credentials trong code!
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
export const SECURITY_CODE = import.meta.env.VITE_SECURITY_CODE || '';

// Cảnh báo nếu chưa cấu hình
if (!ADMIN_EMAIL || !SECURITY_CODE) {
  console.warn('[Config] ⚠️ ADMIN_EMAIL hoặc SECURITY_CODE chưa được cấu hình trong .env');
}

/**
 * HỆ SỐ NHÂN ĐIỂM CHO USER ĐẶC BIỆT
 *
 * Một số user có quyền vote với hệ số nhân cao hơn:
 * - Hội đồng quản trị (HDQT): x10
 * - Ban Giám đốc (BGD): x5
 * - User thường: x1 (mặc định)
 *
 * Cách thêm user đặc biệt:
 * 1. Thêm email vào mảng tương ứng (HDQT hoặc BGD)
 * 2. Email phải viết thường (lowercase)
 * 3. Email phải nằm trong danh sách email được phép (mail list)
 */
export const VOTE_MULTIPLIERS = {
  // Hội đồng quản trị - Hệ số x10
  HDQT: {
    multiplier: 10,
    label: 'Hội đồng Quản trị',
    emails: [
      'xuanhoa.inno@gmail.com',
      'leader4@innojsc.com',
      'leader@innojsc.com',
    ]
  },
  // Ban Giám đốc - Hệ số x5
  BGD: {
    multiplier: 5,
    label: 'Ban Giám đốc',
    emails: [
      'dongdv2005@gmail.com',
      'mbsan06@gmail.com',
      'quangbv.vae@gmail.com',
      'giangchau16@gmail.com',
      'dotatkien@gmail.com',
      'phamquochuy710@gmail.com',
      'dohoanganh2803@gmail.com',
      'phukhanh103@gmail.com',
      'levantai1993@gmail.com',
      'dinhkhuong2906@gmail.com',
    ]
  }
};

/**
 * Lấy hệ số nhân cho một email
 * @param {string} email - Email của user
 * @returns {{ multiplier: number, role: string | null }}
 */
export function getVoteMultiplier(email) {
  if (!email) return { multiplier: 1, role: null };

  const normalizedEmail = email.toLowerCase().trim();

  // Kiểm tra HĐQT trước (ưu tiên cao hơn)
  if (VOTE_MULTIPLIERS.HDQT.emails.includes(normalizedEmail)) {
    return {
      multiplier: VOTE_MULTIPLIERS.HDQT.multiplier,
      role: VOTE_MULTIPLIERS.HDQT.label
    };
  }

  // Kiểm tra BGĐ
  if (VOTE_MULTIPLIERS.BGD.emails.includes(normalizedEmail)) {
    return {
      multiplier: VOTE_MULTIPLIERS.BGD.multiplier,
      role: VOTE_MULTIPLIERS.BGD.label
    };
  }

  // User thường
  return { multiplier: 1, role: null };
}
