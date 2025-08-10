# Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và dự án này tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### 🎉 Added (Tính năng mới)
- **Core Extension Framework**: Extension Chrome Manifest V3 hoàn chỉnh
- **Google Gemini Integration**: Tích hợp API Gemini 2.0 Flash cho phân tích AI
- **Screenshot Capture**: Chụp màn hình trang web hiện tại
- **Evidence Annotation**: Vẽ chú thích bằng chứng lên ảnh với panel thông tin
- **Image Upload**: Upload ảnh gốc và ảnh chú thích lên ChongLuaDao.vn
- **History Management**: Lưu và quản lý lịch sử phân tích (tối đa 300 entries)
- **Options Page**: Cấu hình API Gemini và headers upload
- **Professional Reports**: Template báo cáo chuyên nghiệp với emoji và format chuẩn
- **Auto-copy Feature**: Tự động copy báo cáo vào clipboard
- **Modern UI**: Giao diện Material Design với gradient và responsive

### 🛠️ Fixed (Sửa lỗi)
- **Service Worker Compatibility**: Thay `Image` constructor bằng `createImageBitmap()`
- **Manifest V3 Issues**: Bỏ `"type": "module"` khỏi background service worker
- **FileReader Compatibility**: Thay `FileReader` bằng `ArrayBuffer` cho service worker
- **Upload Error 413**: Nén ảnh PNG → JPEG (quality 0.8) để giảm dung lượng
- **Image Size Optimization**: Resize ảnh tối đa 1200px width để tránh lỗi upload
- **Variable Conflicts**: Sửa trùng lặp tên biến `blob` trong cùng scope

### 🔧 Changed (Thay đổi)
- **Default Model**: Chuyển từ `gemini-1.5-pro` sang `gemini-2.0-flash`
- **Image Format**: Upload format từ PNG sang JPEG để tối ưu dung lượng
- **Report Display**: Hiển thị báo cáo text thay vì JSON cho user-friendly

### 📋 Technical Details (Chi tiết kỹ thuật)

#### Architecture
- **Background Script**: Service worker xử lý logic chính
- **Popup Interface**: HTML/CSS/JS cho giao diện chính
- **Options Page**: Cấu hình độc lập với validation
- **Storage System**: Chrome Storage API (sync cho settings, local cho history)

#### Dependencies
- **Chrome Extensions API**: Manifest V3
- **Google Gemini API**: 2.0 Flash model
- **OffscreenCanvas**: Vẽ chú thích tương thích service worker
- **Fetch API**: HTTP requests cho upload và AI

#### Security
- **API Key Security**: Lưu local, không gửi cho third-party
- **HTTPS Only**: Tất cả network requests qua SSL
- **No Tracking**: Không thu thập dữ liệu người dùng
- **Local Processing**: Chỉ gửi ảnh cho Gemini và ChongLuaDao.vn

#### Performance
- **Image Compression**: Giảm 70% dung lượng upload
- **Lazy Loading**: Chỉ load cần thiết
- **Error Handling**: Graceful fallback cho mọi API calls
- **Background Processing**: Không block UI thread

### 📸 Screenshots
- Popup interface với nút phân tích
- Options page với cấu hình API
- Báo cáo mẫu với evidence links
- History management UI

### 🧪 Testing
- ✅ Chrome 120+ compatibility tested
- ✅ Gemini API integration verified  
- ✅ Upload functionality confirmed
- ✅ Cross-domain screenshot capture
- ✅ Storage persistence validated

---

## Planned for [1.1.0] - Q1 2025

### 🎯 Features in Development
- [ ] Multi-language support (English)
- [ ] Batch analysis for multiple tabs
- [ ] Custom AI prompt templates
- [ ] PDF/Word export functionality
- [ ] Webhook integration for auto-reporting

### 🔍 Under Investigation
- Performance optimization for large images
- Offline analysis capabilities
- Browser sync for settings
- Advanced filtering options

---

## Development Notes

### Coding Standards
- **ES6+**: Modern JavaScript features
- **No jQuery**: Vanilla JS for performance
- **Async/Await**: Promise-based error handling
- **Modular Design**: Separated concerns

### Git Workflow
- **Main Branch**: Production-ready code
- **Feature Branches**: `feature/description`
- **Hotfix Branches**: `hotfix/issue-description`
- **Semantic Commits**: Conventional commit messages

### Release Process
1. Feature development in branches
2. Pull request review
3. Integration testing
4. Version bump in manifest.json
5. Tag release with changelog
6. GitHub release with assets

---

**Repository**: https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence  
**Developer**: KaiyoDev (Đặng Hoàng Ân)  
**License**: MIT
