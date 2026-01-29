// Danh sách tác phẩm dự thi
export const VIDEOS = [
  {
    id: 'v1',
    name: 'Hành Trình Vươn Xa',
    team: 'Team Marketing',
    color: 'bg-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'v2',
    name: 'Chuyện Công Sở',
    team: 'Team Sale & Admin',
    color: 'bg-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'v3',
    name: 'The Future Is Now',
    team: 'Team Tech & Product',
    color: 'bg-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-violet-600',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30'
  },
  {
    id: 'v4',
    name: 'Người Dẫn Đường',
    team: 'Team BOD',
    color: 'bg-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-600',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
];

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
    emoji: ''
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
    emoji: '🏆',
    description: '5 điểm - Tối đa 1 giải'
  },
  {
    id: 'second',
    label: 'Giải Nhì',
    shortLabel: 'Nhì',
    point: 3,
    limit: 2,
    bgColor: 'bg-slate-300/10',
    textColor: 'text-slate-300',
    selectedBg: 'bg-gradient-to-r from-slate-400 to-slate-500',
    borderColor: 'border-slate-400/50',
    emoji: '🥈',
    description: '3 điểm - Tối đa 2 giải'
  },
  {
    id: 'third',
    label: 'Giải Ba',
    shortLabel: 'Ba',
    point: 2,
    limit: 3,
    bgColor: 'bg-amber-600/10',
    textColor: 'text-amber-600',
    selectedBg: 'bg-gradient-to-r from-amber-600 to-amber-700',
    borderColor: 'border-amber-600/50',
    emoji: '🥉',
    description: '2 điểm - Tối đa 3 giải'
  },
];

// Tổng số user dự kiến
export const TOTAL_EXPECTED_USERS = 250;

// Cấu hình validation
export const VOTING_RULES = {
  mustVoteAll: true, // Phải chấm hết tất cả video
  canChangeVote: false, // Không được sửa vote
};
