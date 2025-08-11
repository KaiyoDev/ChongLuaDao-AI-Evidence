# 🤝 Contributing to ChongLuaDao AI Evidence

Cảm ơn bạn quan tâm đến việc đóng góp cho dự án! Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng.

## 📋 Quy trình đóng góp

### 1. Fork và Clone
```bash
# Fork repository trên GitHub
# Sau đó clone về máy local
git clone https://github.com/YOUR_USERNAME/ChongLuaDao-AI-Evidence.git
cd ChongLuaDao-AI-Evidence
```

### 2. Tạo Branch
```bash
# Tạo branch cho feature/bugfix
git checkout -b feature/your-feature-name
# hoặc
git checkout -b bugfix/issue-description
```

### 3. Development
- Viết code tuân theo coding standards
- Thêm comments cho logic phức tạp
- Test thoroughly trước khi commit

### 4. Commit
```bash
# Commit với message rõ ràng
git add .
git commit -m "feat: add batch analysis feature"
# hoặc
git commit -m "fix: resolve upload error 413"
```

### 5. Push và Pull Request
```bash
git push origin feature/your-feature-name
```
Sau đó tạo Pull Request trên GitHub

## 📝 Coding Standards

### JavaScript Style
```javascript
// ✅ Good: Use async/await
async function analyzeImage(dataUrl) {
  try {
    const result = await callGemini(dataUrl);
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// ❌ Bad: Callback hell
function analyzeImage(dataUrl, callback) {
  callGemini(dataUrl, function(error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, result);
    }
  });
}
```

### Naming Conventions
- **Functions**: `camelCase` - `analyzeWithAI()`, `compressImage()`
- **Constants**: `UPPER_SNAKE_CASE` - `API_UPLOAD`, `MAX_WIDTH`  
- **Variables**: `camelCase` - `shotDataUrl`, `aiReport`
- **Files**: `kebab-case` - `background.js`, `popup.html`

### Error Handling
```javascript
// ✅ Always handle errors gracefully
async function uploadImage(data) {
  try {
    const response = await fetch(API_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}
```

## 🧪 Testing Guidelines

### Manual Testing
1. **Load extension** vào Chrome
2. **Test core features**:
   - Screenshot capture
   - AI analysis
   - Image upload
   - Report generation
3. **Test edge cases**:
   - Large images
   - Network errors
   - Invalid API keys
   - Empty responses

### Console Testing
```javascript
// Check for errors in console
// Background script errors
chrome.runtime.getBackgroundPage(console.log);

// Storage inspection
chrome.storage.local.get(console.log);
chrome.storage.sync.get(console.log);
```

## 🎯 Types of Contributions

### 🐛 Bug Reports
Khi báo cáo bug, hãy bao gồm:
- **Steps to reproduce**: Các bước tái hiện lỗi
- **Expected behavior**: Hành vi mong đợi
- **Actual behavior**: Hành vi thực tế
- **Environment**: Chrome version, OS
- **Screenshots**: Nếu có thể
- **Console errors**: Copy error messages

### ✨ Feature Requests
Khi đề xuất feature:
- **Use case**: Tại sao cần feature này?
- **Proposed solution**: Giải pháp đề xuất
- **Alternatives**: Các cách khác đã xem xét
- **Implementation notes**: Gợi ý kỹ thuật

### 📚 Documentation
- Cải thiện README.md
- Thêm code comments
- Viết guides/tutorials
- Cập nhật CHANGELOG.md

### 🔧 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Security enhancements

## 📂 Project Structure

```
ChongLuaDao-AI-Evidence/
├── manifest.json          # Extension configuration
├── background.js          # Service worker logic
├── popup.html/.js         # Main interface
├── options.html/.js       # Settings page
├── styles.css             # UI styling
├── icons/                 # Extension icons
├── README.md              # Project documentation
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # This file
└── LICENSE                # MIT license
```

## 🚀 Development Setup

### Prerequisites
- Chrome browser (version 120+)
- Text editor (VS Code recommended)
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extensions API

### Local Development
1. **Clone repository**
2. **Open Chrome Extensions**: `chrome://extensions/`
3. **Enable Developer mode**
4. **Load unpacked**: Select project folder
5. **Make changes** and reload extension
6. **Test functionality**

## 🔍 Code Review Process

### Pull Request Guidelines
- **Clear title**: Mô tả ngắn gọn thay đổi
- **Detailed description**: Giải thích chi tiết
- **Link issues**: Reference related issues
- **Screenshots**: Nếu có UI changes
- **Testing**: Confirm đã test thoroughly

### Review Criteria
- ✅ Code quality và style
- ✅ Functionality works as expected
- ✅ No performance regression
- ✅ Security considerations
- ✅ Documentation updates

## 🎨 UI/UX Guidelines

### Design Principles
- **Simplicity**: Giao diện đơn giản, dễ sử dụng
- **Consistency**: Theo Material Design principles
- **Accessibility**: Hỗ trợ keyboard navigation
- **Responsive**: Hoạt động trên các kích thước màn hình

### Color Scheme
```css
/* Primary colors */
--primary-blue: #3b82f6;
--primary-dark: #1e40af;

/* Status colors */
--success-green: #22c55e;
--warning-yellow: #f59e0b;
--error-red: #ef4444;

/* Neutral colors */
--gray-100: #f3f4f6;
--gray-800: #1f2937;
```

## 📞 Community

### Getting Help
- **GitHub Issues**: Báo cáo bugs, đề xuất features
- **Discussions**: Thảo luận về dự án
- **Email**: sadboydev06@gmail.com

### Code of Conduct
- Tôn trọng mọi người
- Xây dựng môi trường thân thiện
- Hỗ trợ lẫn nhau học hỏi
- Tập trung vào mục tiêu chung

## 🏆 Recognition

Contributors sẽ được:
- Ghi nhận trong CHANGELOG.md
- Mention trong release notes
- Badge trên GitHub profile
- Invitation vào team (cho frequent contributors)

---

**Happy Coding!** 🚀

Cảm ơn bạn đã quan tâm đến dự án ChongLuaDao AI Evidence!
