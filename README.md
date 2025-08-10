# 🛡️ ChongLuaDao AI Evidence

Extension Chrome phát hiện lừa đảo bằng AI Gemini - Tạo bằng chứng tự động

## ✨ Tính năng chính

- 🔍 **Phát hiện lừa đảo thông minh**: Sử dụng AI Gemini để phân tích trang web
- 📸 **Chụp màn hình tự động**: Capture toàn bộ trang đang xem
- 🎯 **Vẽ chú thích bằng chứng**: Đánh dấu vùng nguy hiểm trên ảnh
- ☁️ **Upload bằng chứng**: Tự động upload lên ChongLuaDao.vn
- 📚 **Lưu lịch sử**: Theo dõi tất cả phân tích đã thực hiện
- ⚙️ **Cấu hình linh hoạt**: Tùy chỉnh API Gemini và upload

## 🚀 Cài đặt Extension

### Bước 1: Tải về source code
```bash
git clone https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence.git
cd ChongLuaDao-AI-Evidence
```

### Bước 2: Load extension vào Chrome
1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** (chế độ nhà phát triển)
3. Nhấn **Load unpacked** (Tải tiện ích chưa đóng gói)
4. Chọn thư mục chứa extension này
5. Extension sẽ xuất hiện trong thanh công cụ

## 🔧 Cấu hình API

### Lấy Gemini API Key
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập tài khoản Google
3. Tạo API Key mới
4. Copy API Key (bắt đầu bằng `AIza...`)

### Cấu hình trong Extension
1. Nhấn vào icon extension trên thanh công cụ
2. Chọn **"⚙️ Cấu hình API"**
3. Nhập **Gemini API Key**
4. Chọn **Model AI** (khuyến nghị: `gemini-2.0-flash`)
5. Nhấn **"💾 Lưu cấu hình"**
6. Test kết nối bằng nút **"🧪 Test API"**

## 📖 Hướng dẫn sử dụng

### Phân tích trang web
1. Mở trang web cần kiểm tra
2. Nhấn vào icon **🛡️ ChongLuaDao AI Evidence**
3. Nhấn **"📸 Chụp & Phân tích (Gemini)"**
4. Chờ AI phân tích (15-30 giây)
5. Xem kết quả và bằng chứng được tạo

### Xem lịch sử
1. Mở popup extension
2. Nhấn **"📋 Xem lịch sử"**
3. Danh sách tất cả phân tích sẽ hiển thị
4. Có thể xóa lịch sử bằng **"🗑️ Xoá lịch sử"**

## 🎯 Các dấu hiệu lừa đảo được AI phát hiện

### 🔴 Nguy hiểm cao (8-10/10)
- Cờ bạc/cá cược trái phép
- Thu thập OTP/mật khẩu/PIN
- Mạo danh ngân hàng
- App đầu tư "lãi cao"

### 🟡 Đáng ngờ (5-7/10)  
- Form yêu cầu thông tin cá nhân
- Khuyến mãi quá hấp dẫn
- Domain giả mạo
- Thiếu thông tin pháp lý

### 🟢 An toàn (0-4/10)
- Trang chính thống
- HTTPS hợp lệ
- Thông tin minh bạch
- Không yêu cầu dữ liệu nhạy cảm

## 📊 Kết quả phân tích

Extension sẽ cung cấp:

```json
{
  "🔍 Tóm tắt": "Trang lừa đảo nguy hiểm",
  "⚠️ Mức rủi ro": "9/10 - Cực nguy hiểm", 
  "📝 Bằng chứng": "Thu thập OTP ngân hàng",
  "🔎 Phát hiện": [
    "Form nhập OTP không mã hóa",
    "Domain giả mạo ngân hàng",
    "Yêu cầu mật khẩu internet banking"
  ],
  "🌐 URL": "https://example-scam.com",
  "⏰ Thời gian": "2024-01-15 14:30:25",
  "📤 Upload": {
    "Ảnh gốc": "https://chongluadao.vn/evidence/original.png",
    "Ảnh chú thích": "https://chongluadao.vn/evidence/annotated.png"
  }
}
```

## ⚙️ Cấu hình nâng cao

### Custom Headers cho Upload
Nếu API upload yêu cầu xác thực:
```json
{
  "Authorization": "Bearer your-token",
  "X-Custom-Header": "value"  
}
```

## 🔒 Bảo mật & Quyền riêng tư

- ✅ API Key chỉ lưu trên máy bạn (Chrome Storage)
- ✅ Không gửi dữ liệu cho bên thứ ba ngoài Gemini và ChongLuaDao.vn  
- ✅ Ảnh upload qua HTTPS được mã hóa
- ✅ Lịch sử lưu cục bộ, có thể xóa bất kỳ lúc nào
- ✅ Không theo dõi hoặc thu thập thông tin cá nhân

## 🐛 Khắc phục sự cố

### Extension không hoạt động
1. Kiểm tra API Key đã nhập chính xác
2. Thử test API connection trong cấu hình
3. Refresh trang web và thử lại
4. Kiểm tra console Chrome (F12) để xem lỗi

### Upload ảnh thất bại
1. Kiểm tra kết nối internet
2. Thử lại sau vài phút
3. Liên hệ admin ChongLuaDao.vn nếu vẫn lỗi

### AI phân tích không chính xác
- Gemini có thể nhầm với một số trang phức tạp
- Kết quả chỉ mang tính tham khảo
- Luôn cần kiểm tra thủ công khi nghi ngờ

## 📞 Copyright

- 📧 Email: info@chongluadao.vn
- 🌐 Website: https://chongluadao.vn
- 📱 Fanpage: facebook.com/chongluadao.vn

## 📝 Lịch sử phát triển

### Version 1.0.0 (10/08/2025)

#### 🎯 Khởi tạo dự án
- **Thiết kế kiến trúc**: Xây dựng extension Chrome Manifest V3
- **Tích hợp AI**: Kết nối Google Gemini API cho phân tích lừa đảo
- **Core features**: Chụp màn hình, phân tích, vẽ chú thích, upload

#### 🔧 Phát triển chính
- **Background Service Worker**: Logic xử lý chính với Manifest V3
- **Popup Interface**: Giao diện người dùng thân thiện với Material Design
- **Options Page**: Cấu hình API Gemini và upload headers
- **Storage System**: Lưu trữ lịch sử phân tích cục bộ (tối đa 300 entries)

#### 🛠️ Tối ưu hóa và sửa lỗi
- **Service Worker Compatibility**: 
  - Thay `Image` constructor bằng `createImageBitmap()` 
  - Bỏ `"type": "module"` khỏi manifest
  - Thay `FileReader` bằng `ArrayBuffer` để tương thích

- **Image Compression (Sửa lỗi 413)**:
  - Nén ảnh PNG → JPEG với quality 0.8
  - Giảm kích thước tối đa xuống 1200px width
  - Giảm ~70% dung lượng upload

- **Report Generation**:
  - Tạo template báo cáo chuyên nghiệp với emoji
  - Auto-copy báo cáo vào clipboard
  - Nút copy riêng biệt trong popup

#### 🎨 Giao diện người dùng
- **Modern UI**: Gradient backgrounds, responsive design
- **Status indicators**: Loading states, success/error messages  
- **Emoji integration**: Visual feedback với icons trực quan
- **Copy functionality**: One-click copy báo cáo để chia sẻ

#### 🔐 Bảo mật
- **Local storage**: API keys chỉ lưu trên máy người dùng
- **HTTPS only**: Tất cả uploads qua kết nối an toàn
- **No tracking**: Không thu thập dữ liệu cá nhân

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Hãy:

1. **Fork** repository này
2. **Tạo branch** cho feature: `git checkout -b feature/amazing-feature`
3. **Commit** thay đổi: `git commit -m 'Add amazing feature'`
4. **Push** lên branch: `git push origin feature/amazing-feature`
5. **Mở Pull Request**

### Guidlines đóng góp
- Tuân thủ coding style hiện tại
- Thêm comments cho code phức tạp
- Test thoroughly trước khi submit
- Cập nhật README nếu cần

## 📊 Thống kê dự án

- **🛡️ Repository**: [ChongLuaDao-AI-Evidence](https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence)
- **📜 License**: MIT License
- **🔧 Framework**: Vanilla JavaScript, Chrome Extensions API
- **🤖 AI Engine**: Google Gemini 2.0 Flash
- **💾 Storage**: Chrome Storage API (sync + local)

## 📄 Giấy phép

Dự án này sử dụng giấy phép MIT. Xem file [LICENSE](https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence/blob/main/LICENSE) để biết thêm chi tiết.

---

**⚠️ Lưu ý quan trọng**: Extension này chỉ là công cụ hỗ trợ. Luôn thận trọng và kiểm tra kỹ trước khi cung cấp thông tin cá nhân trên bất kỳ website nào!

**💡 Phát triển bởi**: [KaiyoDev](https://github.com/KaiyoDev) - Đặng Hoàng Ân  
**🌐 Official Repository**: https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence
