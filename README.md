# 🛡️ ChongLuaDao AI Evidence

Extension Chrome phát hiện lừa đảo bằng AI Gemini - Tạo bằng chứng tự động với khả năng phân tích chuyên sâu

## ✨ Tính năng chính

- 🧠 **AI Phân tích thông minh**: Sử dụng Gemini 2.0 Flash để phát hiện chiêu trò lừa đảo tinh vi
- 📸 **Chụp toàn trang**: Capture cả trang web dài bằng công nghệ stitching
- 🎯 **Vẽ chú thích bằng chứng**: Đánh dấu vùng nguy hiểm với AI Computer Vision
- ☁️ **Upload đa ảnh**: Tự động upload 3 loại ảnh (viewport, toàn trang, chú thích)
- 📋 **Auto-fill ChongLuaDao**: Tự động điền form báo cáo lừa đảo
- 🔍 **Phát hiện chiêu trò nâng cao**: Mạo danh người nổi tiếng, báo chí, rút tiền thành công giả
- 📚 **Lịch sử chi tiết**: Theo dõi tất cả phân tích với báo cáo chuyên nghiệp

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
4. Nhập **Email** (cho auto-fill form)
5. Chọn **Model AI** (khuyến nghị: `gemini-2.0-flash`)
6. Nhấn **"💾 Lưu cấu hình"**
7. Test kết nối bằng nút **"🧪 Test API"**

## 📖 Hướng dẫn sử dụng

### Phân tích trang web
1. Mở trang web cần kiểm tra
2. Nhấn vào icon **🛡️ ChongLuaDao AI Evidence**
3. Chọn một trong hai chế độ:
   - **"📸 Chụp Toàn Trang & Phân tích"**: Phân tích chi tiết (30-60s)
   - **"⚡ Chụp Nhanh & Phân tích"**: Phân tích nhanh (15-30s)
4. Chờ AI phân tích và tạo bằng chứng
5. Xem kết quả chi tiết với 3 ảnh bằng chứng

### Auto-fill báo cáo ChongLuaDao
1. Sau khi phân tích xong, nhấn **"📝 Điền Form ChongLuaDao"**
2. Extension sẽ tự động:
   - Mở trang `chongluadao.vn/report/reportphishing`
   - Điền URL, danh mục, bằng chứng chi tiết
   - Attach 3 ảnh bằng chứng
   - Điền email liên hệ

### Xem lịch sử
1. Mở popup extension
2. Nhấn **"📋 Xem lịch sử"**
3. Danh sách tất cả phân tích sẽ hiển thị
4. Có thể xóa lịch sử bằng **"🗑️ Xoá lịch sử"**

## 🎯 Các chiêu trò lừa đảo được AI phát hiện

### 🔴 Nguy hiểm cao (8-10/10)
- **Mạo danh người nổi tiếng**: Shark Tank, Hoài Linh, Sơn Tùng, Thủy Tiên...
- **Mạo danh báo chí**: VTV, VnExpress, Tuổi Trẻ, Thanh Niên...
- **Rút tiền thành công giả**: Screenshot bank, testimonial khách hàng fake
- **Chợ đen**: CCV, tiền bẩn, tài khoản hack, dump card
- **Cờ bạc/casino** trái phép
- **Mạo danh ngân hàng** thu thập OTP/PIN

### 🟡 Đáng ngờ (5-7/10)  
- **Chứng chỉ/giải thưởng giả**: ISO, FDA, Top Award không rõ nguồn gốc
- **Áp lực thời gian**: Countdown sale giả, "chỉ còn X ngày"
- **Thống kê người dùng giả**: "10 triệu người sử dụng" không xác thực
- **Form thu thập dữ liệu** nhạy cảm
- **Khuyến mãi bất thường** (giảm 90%)
- **Domain giả mạo** và thiếu thông tin pháp lý

### 🟢 An toàn (0-4/10)
- Trang chính thống có đầy đủ thông tin pháp lý
- HTTPS hợp lệ và chứng chỉ SSL đúng
- Không yêu cầu dữ liệu nhạy cảm
- Thiết kế chuyên nghiệp, minh bạch

## 📊 Kết quả phân tích v2.8.0

Extension sẽ cung cấp báo cáo chi tiết:

```
CÁC BẰNG CHỨNG CỤ THỂ:
Trang web bán tài khoản game trực tuyến với nhiều dấu hiệu đáng ngờ
Sử dụng hình ảnh người nổi tiếng "Shark Bình" để quảng cáo sản phẩm không rõ nguồn gốc
Mạo danh báo chí "VnExpress" để tăng độ tin cậy và uy tín cho sản phẩm/dịch vụ
Sử dụng câu chuyện rút tiền thành công giả mạo với số tiền lớn để tạo lòng tin
Sử dụng nhiều mã JavaScript phức tạp và bị làm rối (obfuscated)
Có các chức năng nạp tiền và thanh toán trực tuyến thiếu minh bạch
Quảng cáo giá rẻ và khuyến mãi cao bất thường (giảm giá 90%)
Có thể là trang web lừa đảo nhằm chiếm đoạt thông tin và tiền của người dùng

URL ĐƯỢC PHÂN TÍCH: https://example-scam.com/
THỜI GIAN PHÂN TÍCH: 15:30:25 11/8/2025

Phân tích bởi: ChongLuaDao AI Evidence Extension v2.8.0

HÌNH ẢNH BẰNG CHỨNG:
• Ảnh viewport: https://iili.io/example1.jpg
• Ảnh toàn trang: https://iili.io/example2.jpg
• Ảnh phân tích: https://iili.io/example3.jpg
```

## 📝 Lịch sử phát triển chi tiết

### 🎯 Version 1.0.0 - Khởi tạo
**Mục tiêu**: Tạo extension cơ bản với AI Gemini

#### ✨ Tính năng chính
- Extension Chrome Manifest V3
- Tích hợp Google Gemini API
- Chụp màn hình viewport hiện tại
- Phân tích cơ bản với AI
- Upload ảnh lên ChongLuaDao.vn
- Lưu lịch sử cục bộ

#### 🔧 Thành phần kỹ thuật
- `background.js`: Service Worker xử lý logic chính
- `popup.html/js`: Giao diện người dùng
- `options.html/js`: Cấu hình API
- Chrome Storage API cho lưu trữ

---

### 🎨 Version 2.0.0 - Nâng cấp AI & Evidence
**Mục tiêu**: Cải thiện chất lượng phân tích AI và tăng độ dài bằng chứng

#### 📈 Cải tiến AI Analysis
- **Mở rộng Gemini Prompt**: Từ 200 từ → 800 từ với hướng dẫn chi tiết
- **Tăng maxOutputTokens**: 1500 → 3000 tokens
- **Thêm JSON schema**: `technical_analysis`, `recommendation`, `evidence_text`
- **Nâng cao findings**: Từ 5-8 → 8-15 dấu hiệu cụ thể

#### 🔍 Context Collection nâng cao
- **Thêm page metadata**: Title, description, forms, links
- **Phân tích security**: SSL, cookies, scripts
- **Thu thập contact info**: Email, phone, social links
- **Page statistics**: Elements count, performance metrics

#### 📋 Cải thiện Report Format
- **Structured sections**: Summary, Risk, Findings, Evidence, Technical, Recommendation
- **Professional formatting**: Headers với emoji, section dividers
- **Detailed evidence**: 300-500 từ thay vì 100-150 từ
- **Technical analysis**: 200-300 từ chuyên sâu

---

### ⚡ Version 2.1.0 - Full Page Capture
**Mục tiêu**: Chụp toàn bộ trang web thay vì chỉ viewport

#### 📸 Full Page Screenshot
- **Scrolling & Stitching**: Tự động scroll và ghép nhiều ảnh
- **Smart page detection**: Tính toán chiều cao thực tế trang
- **Overlap handling**: Xử lý phần chồng lấp giữa các chunk
- **Fallback mechanism**: Quay về chụp viewport nếu trang ngắn

#### 🚀 Speed Optimization
- **Smart compression**: Điều chỉnh quality dựa trên kích thước
- **Parallel processing**: Xử lý đồng thời capture và AI analysis
- **Progress tracking**: Hiển thị tiến độ real-time cho user

#### 🔧 Technical improvements
- **OffscreenCanvas**: Sử dụng cho stitching hiệu quả
- **Memory management**: Giải phóng memory sau mỗi chunk
- **Error handling**: Robust error recovery

---

### 🎛️ Version 2.2.0 - Quick Mode
**Mục tiêu**: Thêm chế độ phân tích nhanh

#### ⚡ Quick Analysis Mode
- **Dual mode UI**: "Chụp Toàn Trang" vs "Chụp Nhanh"
- **Quick mode**: Chỉ viewport, nhanh hơn 50%
- **Smart mode selection**: Auto-suggest dựa trên page size
- **User preference**: Ghi nhớ lựa chọn của user

---

### 🛠️ Version 2.2.1  - Rate Limit Fix
**Mục tiêu**: Khắc phục lỗi Chrome API quota

#### 🚫 Quota Error Resolution
- **Rate limiting**: Tăng delay 150ms → 600ms giữa captures
- **Retry mechanism**: Exponential backoff cho API calls
- **Chunk reduction**: Giảm maxChunks 20 → 10, maxHeight 8 → 6 viewports
- **Timeout extension**: 15s → 20s cho full page capture

#### 📊 User Experience
- **Progress estimation**: Hiển thị estimated time remaining
- **Chunk progress**: "Đang chụp chunk 3/7..."
- **Error messaging**: Thông báo rõ ràng khi gặp quota limit

---

### 🎯 Version 2.3.0  - Perfect Full Page
**Mục tiêu**: Hoàn thiện full page capture, loại bỏ cropping

#### 📐 Precision Stitching
- **Accurate dimensions**: Sử dụng `getBoundingClientRect()` cho measurement chính xác
- **10% overlap**: Đảm bảo không bỏ sót nội dung giữa các chunk
- **Instant scrolling**: `behavior: 'instant'` cho scroll mượt mà
- **Scroll verification**: Kiểm tra actual scroll position sau mỗi lần scroll

#### 🔧 Algorithm improvements
- **Smart canvas calculation**: Tính actualCanvasHeight chính xác
- **Overlap cropping**: Logic xử lý chồng lấp giữa chunks
- **White background**: Fill canvas với background trắng
- **Chunk sorting**: Sắp xếp theo scrollY position

#### 🧪 Quality assurance
- **End-to-end testing**: Scroll tới cuối để verify page height
- **Edge case handling**: Xử lý trang quá ngắn, quá dài
- **Memory optimization**: Efficient image processing

---

### 📋 Version 2.4.0  - Auto-fill ChongLuaDao
**Mục tiêu**: Tự động điền form báo cáo lừa đảo

#### 🤖 Intelligent Form Filling
- **Smart evidence generation**: `generateShortEvidence()` tạo bằng chứng cụ thể
- **Category detection**: `detectCategory()` với 8+ categories
- **Technical points extraction**: Lọc technical findings quan trọng
- **Specific evidence**: Trích xuất evidence points từ AI analysis

#### 🌐 ChongLuaDao Integration
- **Form automation**: Tự động mở tab mới với report form
- **Field mapping**: URL, category, evidence, email fields
- **Event dispatching**: Trigger proper form events
- **Success notification**: Overlay confirmation trên page

#### 📊 Evidence Quality
- **Structured format**: "CÁC BẰNG CHỨNG CỤ THỂ" header
- **Timestamp**: Thời gian phân tích chính xác
- **URL reference**: Link tới trang được phân tích
- **Extension version**: Traceability

---

### 🖼️ Version 2.5.0  - Multi-Image Evidence
**Mục tiêu**: Gửi nhiều ảnh bằng chứng

#### 📸 Triple Image System
- **Viewport image**: Ảnh màn hình hiện tại
- **Full page image**: Ảnh toàn trang đã stitched
- **Annotated image**: Ảnh có chú thích AI analysis
- **Separate uploads**: Upload riêng biệt với naming convention

#### 🔗 Image Links Integration
- **Auto-append**: Thêm links ảnh vào evidence text
- **Professional format**: "HÌNH ẢNH BẰNG CHỨNG:" section
- **Named convention**: `viewport_*.jpg`, `fullpage_*.jpg`, `annotated_*.jpg`

#### 📝 Enhanced Evidence
- **Specific focus**: Loại bỏ generic warnings
- **Concrete examples**: "Quảng cáo giá rẻ và khuyến mãi cao bất thường (giảm giá 90%)"
- **Professional terminology**: Sử dụng thuật ngữ chuyên môn

---

### 🎯 Version 2.6.0  - Professional Evidence Format
**Mục tiêu**: Chuẩn hóa format bằng chứng theo chuẩn chuyên nghiệp

#### 📋 Smart Evidence Generation
- **8-tier analysis**: Website type, legal, security, suspicious features, pricing, data collection, risk conclusion, enhanced findings
- **Pattern matching**: Intelligent detection cho từng loại trang web
- **Context-aware**: Phân tích dựa trên loại website (game shop, investment, banking, casino, ecommerce)

#### 🧠 AI Prompt Enhancement
- **Specific examples**: Hướng dẫn AI viết findings cụ thể
- **Anti-generic rules**: Cấm findings chung chung như "Trang web đáng ngờ"
- **Quality guidelines**: 400-600 từ evidence, 250-350 từ technical analysis

#### 🔍 Finding Categories
- **Website purpose**: "Trang web bán tài khoản game trực tuyến với nhiều dấu hiệu đáng ngờ"
- **Legal transparency**: "Không có thông tin rõ ràng về chủ sở hữu và địa chỉ kinh doanh"
- **Security issues**: "Sử dụng nhiều mã JavaScript phức tạp và bị làm rối (obfuscated)"
- **Pricing strategy**: "Quảng cáo giá rẻ và khuyến mãi cao bất thường (giảm giá 90%)"

---

### 🎭 Version 2.7.0  - Advanced Fraud Detection
**Mục tiêu**: Phát hiện chiêu trò lừa đảo tinh vi

#### 👑 Celebrity Fraud Detection
- **VN Celebrity Database**: 20+ người nổi tiếng thường bị mạo danh
  - Shark Tank: Shark Bình, Shark Linh, Shark Thủy, Shark Hưng
  - Entertainment: Hoài Linh, Trấn Thành, HariWon, Đàm Vĩnh Hưng
  - Music: Sơn Tùng, Đen Vâu, Jack, K-ICM, HieuThuHai
  - Sports: Thủy Tiên, Công Vinh
  - YouTubers: Độ Mixi, PewPew, Xemesis

#### 💰 Fake Success Stories Detection
- **Money pattern recognition**: Regex cho "rút X triệu", "kiếm Y nghìn/ngày"
- **Testimonial keywords**: "chị Mai", "anh Nam", "khách hàng", "trader"
- **Screenshot fraud**: Phát hiện "ảnh chụp chuyển khoản", "bank statement"
- **Success metrics**: Pattern matching số tiền bất thường

#### 📺 News Endorsement Fraud
- **Media Database**: 25+ báo chí VN thường bị mạo danh
  - TV: VTV, VTV1, VTV3, VTV9, VTC
  - Online: VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet
  - Tech/Lifestyle: Zing News, Kenh14, Genk, Tinhte, Soha
- **News keywords**: "đưa tin", "báo cáo", "xác nhận", "phỏng vấn"
- **Logo fraud**: Phát hiện sử dụng logo báo chí trái phép

---

### 🚀 Version 2.8.0  - Complete Fraud Intelligence
**Mục tiêu**: Hệ thống phát hiện lừa đảo hoàn chỉnh

#### 🎪 Advanced Marketing Fraud
- **Certificate fraud**: "Chứng nhận ISO quốc tế", "Giải thưởng top 1"
- **Time pressure**: "Chỉ còn 2 ngày", "Sale sốc cuối cùng"  
- **Fake statistics**: "Hơn 10 triệu người sử dụng", doanh số không xác thực
- **Reviews manipulation**: "Review 5 sao", "100% khách hàng hài lòng"

#### 🔄 Integrated Detection System
- **Multi-layer analysis**: 4 detection systems hoạt động song song
- **Priority scoring**: Lấy 2 findings quan trọng nhất từ advanced fraud
- **Seamless integration**: Tích hợp vào `extractBehaviorEvidence()` hiện có
- **Performance optimization**: Efficient pattern matching

#### 📊 Enhanced Evidence Output
**Trước v2.8.0**:
```
Sử dụng thanh toán cryptocurrency...
Áp dụng kỹ thuật tâm lý...
```

**Sau v2.8.0**:
```
Sử dụng hình ảnh người nổi tiếng "Shark Bình" để quảng cáo sản phẩm không rõ nguồn gốc
Sử dụng câu chuyện rút tiền thành công giả mạo với số tiền lớn để tạo lòng tin
Mạo danh báo chí "VnExpress" để tăng độ tin cậy và uy tín
Tự xưng có chứng nhận/giải thưởng quốc tế không rõ nguồn gốc
```

## 🔒 Bảo mật & Quyền riêng tư

- ✅ **API Key Security**: Chỉ lưu trên máy bạn (Chrome Storage)
- ✅ **Data Privacy**: Không gửi dữ liệu cho bên thứ ba ngoài Gemini và ChongLuaDao.vn  
- ✅ **HTTPS Encryption**: Tất cả uploads qua kết nối an toàn
- ✅ **Local Storage**: Lịch sử lưu cục bộ, có thể xóa bất kỳ lúc nào
- ✅ **No Tracking**: Không thu thập thông tin cá nhân
- ✅ **Transparent**: Open source, có thể audit code

## 🐛 Khắc phục sự cố

### Extension không hoạt động
1. **Kiểm tra API Key**: Đảm bảo nhập chính xác từ Google AI Studio
2. **Test connection**: Sử dụng nút "🧪 Test API" trong cấu hình
3. **Refresh page**: Reload trang web và thử lại
4. **Console logs**: Kiểm tra Chrome DevTools (F12) → Console

### Upload ảnh thất bại
1. **Internet connection**: Kiểm tra kết nối mạng ổn định
2. **File size**: Ảnh tự động nén, nhưng có thể vẫn quá lớn
3. **Server status**: ChongLuaDao.vn có thể bảo trì
4. **Retry**: Thử lại sau vài phút

### AI phân tích không chính xác
1. **Context limitation**: Gemini có thể nhầm với trang phức tạp
2. **Reference only**: Kết quả chỉ mang tính tham khảo
3. **Manual verification**: Luôn kiểm tra thủ công khi nghi ngờ
4. **Report feedback**: Báo cáo cases sai để cải thiện prompt

### Full page capture issues
1. **Long pages**: Trang quá dài có thể timeout (>25s)
2. **Dynamic content**: JavaScript-heavy pages có thể không capture hết
3. **Rate limits**: Chrome API có quota, thử lại sau 1 phút
4. **Memory**: Trang quá lớn có thể gây thiếu memory

## ⚙️ Cấu hình nâng cao

### Custom Upload Headers
Nếu API upload yêu cầu authentication:
```json
{
  "Authorization": "Bearer your-token",
  "X-API-Key": "your-api-key",
  "Content-Type": "multipart/form-data"
}
```

### Performance Tuning
- **maxOutputTokens**: 3000 (có thể tăng lên 4000 cho phân tích sâu hơn)
- **Compression quality**: 0.8 (có thể giảm xuống 0.6 để tiết kiệm bandwidth)
- **Chunk delay**: 600ms (có thể tăng lên 800ms nếu gặp rate limit)

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Dự án phát triển qua 8 versions với nhiều cải tiến:

### Cách đóng góp
1. **Fork** repository này
2. **Tạo branch** cho feature: `git checkout -b feature/amazing-feature`
3. **Commit** thay đổi: `git commit -m 'Add amazing feature'`
4. **Push** lên branch: `git push origin feature/amazing-feature`  
5. **Mở Pull Request**

### Development Guidelines
- **Code style**: Tuân thủ JavaScript ES6+ standards
- **Comments**: Thêm JSDoc cho functions phức tạp
- **Testing**: Test thoroughly với nhiều loại websites
- **Documentation**: Cập nhật README cho features mới

### Priority Areas
- **AI Prompt Engineering**: Cải thiện accuracy của Gemini analysis
- **New Fraud Patterns**: Thêm detection cho scam patterns mới
- **Performance**: Tối ưu tốc độ capture và analysis
- **UI/UX**: Cải thiện user experience
- **Internationalization**: Hỗ trợ ngôn ngữ khác

## 📊 Thống kê dự án

- **🛡️ Repository**: [ChongLuaDao-AI-Evidence](https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence)
- **📜 License**: MIT License  
- **🔧 Tech Stack**: Vanilla JavaScript, Chrome Extensions API, HTML5 Canvas
- **🤖 AI Engine**: Google Gemini 2.0 Flash với custom prompts
- **💾 Storage**: Chrome Storage API (sync + local)
- **📊 Lines of Code**: ~2100+ lines (v2.8.0)
- **🚀 Development Time**: 2 tuần (v1.0.0 → v2.8.0)
- **🔍 Detection Patterns**: 50+ fraud patterns được hỗ trợ

## 📄 Giấy phép

Dự án này sử dụng giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

**⚠️ Disclaimer**: Extension này là công cụ hỗ trợ phát hiện lừa đảo. Kết quả AI chỉ mang tính tham khảo. Luôn thận trọng và kiểm tra kỹ trước khi cung cấp thông tin cá nhân trên bất kỳ website nào!

**💡 Phát triển bởi**: [KaiyoDev](https://github.com/KaiyoDev) - Đặng Hoàng Ân  
**🌐 Official Repository**: https://github.com/KaiyoDev/ChongLuaDao-AI-Evidence  
**📞 Support**: Issues tracker trên GitHub