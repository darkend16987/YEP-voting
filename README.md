# Year End Video Voting System

Hệ thống bình chọn video cuối năm với realtime race dashboard.

## Tính năng

- Xác thực Google SSO với allowlist email
- Giao diện voting tối ưu cho mobile
- Dashboard realtime với animation
- Tự động tính điểm theo giải thưởng

## Cấu trúc giải thưởng

| Giải | Điểm | Giới hạn |
|------|------|----------|
| Nhất | 5 | 1 |
| Nhì | 3 | 2 |
| Ba | 2 | 3 |

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Firebase

Copy file `.env.example` thành `.env` và điền thông tin:

```bash
cp .env.example .env
```

Lấy Firebase config từ Firebase Console > Project Settings > Web App.

### 3. Cấu hình danh sách email

**Cách 1: File local (đơn giản)**

1. Đặt file CSV chứa email vào `scripts/mail_list.csv`
2. Chạy script convert:
```bash
node scripts/convert-csv.js
```

**Cách 2: Firestore (linh hoạt hơn)**

1. Đặt file CSV vào `scripts/mail_list.csv`
2. Upload lên Firestore:
```bash
node scripts/upload-emails-to-firestore.js
```

### 4. Chạy development server

```bash
npm run dev
```

### 5. Build production

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/          # React components
│   ├── LoginScreen.jsx  # Màn hình đăng nhập
│   ├── VotingScreen.jsx # Màn hình chấm điểm
│   └── DashboardScreen.jsx # Bảng xếp hạng live
├── config/
│   ├── firebase.js      # Firebase configuration
│   └── constants.js     # App constants (videos, awards)
├── data/
│   └── email_list.js    # Danh sách email allowed
├── services/
│   └── emailService.js  # Email validation service
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## Tùy chỉnh

### Thay đổi danh sách video

Chỉnh sửa file `src/config/constants.js`:

```javascript
export const VIDEOS = [
  {
    id: 'v1',
    name: 'Tên Video',
    team: 'Tên Team',
    color: 'bg-blue-500',
    // ... other properties
  },
];
```

### Thay đổi cơ cấu giải thưởng

Chỉnh sửa `AWARDS` trong `src/config/constants.js`.

## Deploy

### Vercel

1. Push code lên GitHub
2. Import project vào Vercel
3. Thêm environment variables từ `.env`
4. Deploy

### Firebase Hosting

```bash
firebase login
firebase init hosting
firebase deploy
```

## Bảo mật

- Không commit file `.env` lên git
- File `.env.example` chỉ chứa template
- Danh sách email production nên dùng Firestore
- Firebase Rules cần được cấu hình đúng

## Firebase Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only write their own vote
    match /artifacts/{appId}/users/{userId}/vote_entry {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public votes readable by all authenticated users
    match /artifacts/{appId}/public/data/all_votes/{voteId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == voteId;
    }

    // Config readable by authenticated users only
    match /artifacts/{appId}/config/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin via console
    }
  }
}
```

## License

Private - Internal use only
