# Scripts Utility

Các script hỗ trợ quản lý hệ thống voting.

## Yêu cầu

1. File `.env` phải được cấu hình đầy đủ (copy từ `.env.example`)
2. Node.js v18+

## Danh sách Scripts

### 1. `sync-emails.js` - Đồng bộ danh sách email

Đồng bộ email từ file CSV lên cả local file và Firestore.

```bash
# Xem trước thay đổi (dry run)
node scripts/sync-emails.js --dry-run

# Đồng bộ đầy đủ (thêm mới + xóa cũ)
node scripts/sync-emails.js

# Chỉ thêm email mới, không xóa
node scripts/sync-emails.js --no-delete
```

**Lưu ý:**
- Đặt file `mail_list.csv` trong thư mục `scripts/`
- Format CSV: mỗi dòng một email hoặc có cột header "email"

### 2. `check-status.js` - Kiểm tra trạng thái

Hiển thị trạng thái hiện tại của hệ thống.

```bash
node scripts/check-status.js
```

Output bao gồm:
- Số lượng email được phép
- Trạng thái voting (mở/đóng)
- Số phiếu bầu
- Kết quả hiện tại

### 3. `reset-votes.js` - Reset phiếu bầu

⚠️ **CẢNH BÁO:** Xóa TOÀN BỘ phiếu bầu, không thể hoàn tác!

```bash
# Có xác nhận
node scripts/reset-votes.js

# Tự động xác nhận (dùng trong automation)
node scripts/reset-votes.js --confirm
```

### 4. `export-results.js` - Xuất kết quả

Xuất kết quả bình chọn ra file JSON và CSV.

```bash
# Xuất tổng hợp
node scripts/export-results.js

# Xuất kèm chi tiết từng phiếu
node scripts/export-results.js --detailed
```

Output được lưu trong thư mục `scripts/exports/`

### 5. `convert-csv.js` - Chuyển đổi CSV (legacy)

Script cũ, chỉ cập nhật file local. Nên dùng `sync-emails.js` thay thế.

```bash
node scripts/convert-csv.js
```

### 6. `upload-emails-to-firestore.js` - Upload lên Firestore (legacy)

Script cũ, chỉ upload lên Firestore. Nên dùng `sync-emails.js` thay thế.

```bash
node scripts/upload-emails-to-firestore.js
```

## Workflow khuyến nghị

### Trước khi vote thật:

1. Chuẩn bị file `mail_list.csv` với danh sách email đầy đủ
2. Chạy `node scripts/sync-emails.js --dry-run` để xem preview
3. Chạy `node scripts/sync-emails.js` để đồng bộ
4. Chạy `node scripts/check-status.js` để kiểm tra
5. Reset vote test: `node scripts/reset-votes.js`

### Trong quá trình vote:

1. Kiểm tra: `node scripts/check-status.js`
2. Nếu cần thêm email: cập nhật CSV rồi `node scripts/sync-emails.js --no-delete`

### Sau khi vote:

1. Export kết quả: `node scripts/export-results.js --detailed`
2. Kết quả sẽ có trong `scripts/exports/`

## Cấu hình Videos

Để thay đổi danh sách video, sửa file `src/config/constants.js`:

```javascript
export const VIDEOS = [
  {
    id: 'v1',
    name: 'Tên Video',
    team: 'Tên Team',
    color: 'bg-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  // ... thêm video khác
];
```

## Troubleshooting

### Lỗi kết nối Firebase
- Kiểm tra file `.env` đã có đầy đủ credentials
- Kiểm tra kết nối mạng

### Lỗi permission Firestore
- Deploy lại Firestore rules: `firebase deploy --only firestore:rules`

### Email không được thêm/xóa
- Chạy `--dry-run` trước để xem diff
- Kiểm tra format CSV (email phải hợp lệ)
