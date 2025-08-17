// background.js
console.log("Background script loaded");

// ===== Helpers =====
const API_UPLOAD = "https://chongluadao.vn/api/upload-image";
// API endpoints
const API_CHECK_URL = "https://kaiyobot.gis-humg.com/api/checkurl?url=";
const API_CHECK_DOMAIN = "https://kaiyobot.gis-humg.com/api/checkmail?domain=";

const nowIso = () => new Date().toISOString();
const dataUrlToBase64 = (d) => d.split(",")[1];

// Kiểm tra URL có nguy hiểm không trước khi quét
async function checkUrlSafety(url) {
  try {
    console.log(`Checking URL safety: ${url}`);
    const response = await fetch(`${API_CHECK_URL}${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`URL safety check failed with status: ${response.status}`);
      return {
        success: false,
        data: { result: "unknown", riskLevel: "unknown", message: "Không thể kiểm tra an toàn URL" }
      };
    }
    
    const data = await response.json();
    console.log('URL safety check result:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return {
      success: false,
      data: { result: "unknown", riskLevel: "unknown", message: "Lỗi khi kiểm tra an toàn URL" }
    };
  }
}

// Kiểm tra domain đã được báo cáo chưa
async function checkDomainReported(url) {
  try {
    const domain = new URL(url).hostname;
    console.log(`Checking domain reported: ${domain}`);
    
    const response = await fetch(`${API_CHECK_DOMAIN}${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Domain check failed with status: ${response.status}`);
      return { success: false, reported: false, message: "Không thể kiểm tra domain" };
    }
    
    const data = await response.json();
    console.log('Domain report result:', data);
    return data;
  } catch (error) {
    console.error('Error checking domain report:', error);
    return { success: false, reported: false, message: "Lỗi khi kiểm tra domain" };
  }
}



// Nén ảnh thông minh để tránh lỗi 413 (Payload Too Large)
async function compressImage(dataUrl, maxWidth = 1200, quality = 0.7) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  
  // Tính toán kích thước mới với logic thông minh hơn
  let { width, height } = bitmap;
  const originalSize = width * height;
  
  // Với ảnh full page rất lớn, giảm kích thước mạnh hơn
  if (originalSize > 5000000) { // > 5M pixels
    maxWidth = 1000;
    quality = 0.6;
  } else if (originalSize > 2000000) { // > 2M pixels  
    maxWidth = 1100;
    quality = 0.65;
  }
  
  // Scale down nếu cần
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  // Với ảnh quá cao, cũng giới hạn chiều cao
  const maxHeight = 8000;
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  const compressedBlob = await canvas.convertToBlob({ 
    type: "image/jpeg", 
    quality 
  });
  
  const arrayBuffer = await compressedBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Tạo báo cáo chi tiết cho form ChongLuaDao - format chuyên nghiệp
function generateShortEvidence(aiData, reportUrl) {
  const riskLevel = aiData.risk || 0;
  
  // Bắt đầu với phần CÁC BẰNG CHỨNG CỤ THỂ - sử dụng findings từ AI
  let evidenceText = `CÁC BẰNG CHỨNG CỤ THỂ:\n`;
  
  // Sử dụng findings từ AI analysis (giống phần "CÁC DẤU HIỆU PHÁT HIỆN")
  const findings = aiData.findings || [];
  if (findings.length > 0) {
    findings.forEach((finding, index) => {
      evidenceText += `${index + 1}. ${finding}\n`;
    });
  } else {
    // Fallback về bằng chứng chi tiết nếu không có findings
    const detailedEvidence = generateDetailedEvidence(aiData, reportUrl);
    evidenceText += detailedEvidence;
  }
  
  // Thêm URL và thời gian
  evidenceText += `\nURL ĐƯỢC PHÂN TÍCH: ${reportUrl}`;
  evidenceText += `\nTHỜI GIAN PHÂN TÍCH: ${new Date().toLocaleString('vi-VN')}`;
  evidenceText += `\n\nPhân tích bởi: ChongLuaDao AI Evidence Extension v2.11.0`;
  
  return evidenceText;
}

// Tạo báo cáo văn bản chi tiết từ AI analysis
function generateReportText(aiData, uploadUrls) {
  const { url, capturedAt, urlSafetyData, domainReportData } = aiData;
  const risk = aiData.risk || 0;
  const findings = aiData.findings || [];
  const summary = aiData.summary || "Đang phân tích...";
  const evidenceText = aiData.evidence_text || "";
  const technicalAnalysis = aiData.technical_analysis || "";
  const recommendation = aiData.recommendation || "";
  const websiteCategory = aiData.website_category || "unknown";
  const threatLevel = aiData.threat_level || "LOW";
  const confidenceScore = aiData.confidence_score || 85;
  
  // Tạo báo cáo chi tiết
  let report = `# 🛡️ BÁO CÁO PHÂN TÍCH AN NINH MẠNG

## 📊 THÔNG TIN TỔNG QUAN
🌐 **URL phân tích:** ${url}
⏰ **Thời gian:** ${new Date(capturedAt).toLocaleString('vi-VN')}
📊 **Mức độ rủi ro:** ${risk}/10 - ${risk >= 8 ? '🔴 CỰC NGUY HIỂM' : risk >= 6 ? '🟠 NGUY HIỂM' : risk >= 4 ? '🟡 THẬN TRỌNG' : '🟢 AN TOÀN'}
🎯 **Phân loại:** ${websiteCategory}
⚠️ **Mức độ đe dọa:** ${threatLevel}
🎯 **Độ tin cậy:** ${confidenceScore}%

`;

  // Thêm thông tin kiểm tra URL safety nếu có
  if (urlSafetyData && urlSafetyData.success && urlSafetyData.data) {
    const safetyData = urlSafetyData.data;
    report += `## 🔍 KẾT QUẢ KIỂM TRA AN TOÀN URL
📡 **Kết quả quét:** ${safetyData.result} (${safetyData.riskLevel})
📢 **Thông báo:** ${safetyData.message}
📊 **Thống kê quét:** ${safetyData.summary?.total || 0} nguồn, ${safetyData.summary?.safe || 0} an toàn, ${safetyData.summary?.unsafe || 0} nguy hiểm

`;

    if (safetyData.details?.unsafe?.length > 0) {
      report += `⚠️ **Nguồn cảnh báo nguy hiểm:**\n`;
      safetyData.details.unsafe.forEach(item => {
        report += `   • ${item.api.split('/').pop()}: ${item.note}\n`;
      });
      report += `\n`;
    }
  }

  report += `## 📝 TÓM TẮT ĐÁNH GIÁ
${summary}

## 🔍 CÁC DẤU HIỆU PHÁT HIỆN (${findings.length})
`;

  findings.forEach((finding, index) => {
    report += `${index + 1}. ${finding}\n`;
  });

  report += `
## 📋 BẰNG CHỨNG CHI TIẾT
${evidenceText}

## 🔧 PHÂN TÍCH KỸ THUẬT
${technicalAnalysis}

## 💡 KHUYẾN NGHỊ
${recommendation}

## 📷 HÌNH ẢNH BẰNG CHỨNG
`;

  if (uploadUrls.currentView && uploadUrls.currentView !== 'Failed to upload') {
    report += `• **Ảnh viewport:** ${uploadUrls.currentView}\n`;
  }
  if (uploadUrls.fullPage && uploadUrls.fullPage !== 'Failed to upload') {
    report += `• **Ảnh toàn trang:** ${uploadUrls.fullPage}\n`;
  }
  if (uploadUrls.annotated && uploadUrls.annotated !== 'Failed to upload') {
    report += `• **Ảnh phân tích:** ${uploadUrls.annotated}\n`;
  }

  // Thêm thông tin domain report nếu có
  if (domainReportData?.success && domainReportData.reported) {
    report += `\n\n## 🚨 CẢNH BÁO DOMAIN ĐÃ BÁO CÁO
📋 **Domain:** ${domainReportData.domain}
⚠️ **Trạng thái:** ${domainReportData.reported ? 'Đã được báo cáo trong tháng này' : 'Chưa có báo cáo'}
📅 **Thời gian kiểm tra:** ${new Date(domainReportData.timestamp).toLocaleString('vi-VN')}
💬 **Ghi chú:** ${domainReportData.message || 'Domain này đã từng được người dùng khác báo cáo'}`;
  }

  report += `
---
**🤖 Phân tích bởi:** ChongLuaDao AI Evidence Extension v2.11.0
**⏱️ Thời gian tạo báo cáo:** ${new Date().toLocaleString('vi-VN')}
`;

  return report;
}

// Tạo bằng chứng chi tiết dựa trên AI analysis - tập trung vào BẰNG CHỨNG CỤ THỂ
function generateDetailedEvidence(aiData, reportUrl) {
  const findings = aiData.findings || [];
  const evidenceText = aiData.evidence_text || '';
  const technicalAnalysis = aiData.technical_analysis || '';
  const context = aiData.context || {};
  
  let detailedPoints = [];
  
  // 1. BẰNG CHỨNG NỘI DUNG CỤ THỂ
  const contentEvidence = extractContentEvidence(context, evidenceText);
  detailedPoints = detailedPoints.concat(contentEvidence);
  
  // 2. BẰNG CHỨNG KỸ THUẬT CỤ THỂ  
  const techEvidence = extractTechnicalEvidence(context, technicalAnalysis);
  detailedPoints = detailedPoints.concat(techEvidence);
  
  // 3. BẰNG CHỨNG CẤU TRÚC TRANG WEB
  const structureEvidence = extractStructureEvidence(context);
  detailedPoints = detailedPoints.concat(structureEvidence);
  
  // 4. BẰNG CHỨNG HOẠT ĐỘNG ĐÁNG NGỜ
  const behaviorEvidence = extractBehaviorEvidence(findings, evidenceText);
  detailedPoints = detailedPoints.concat(behaviorEvidence);
  
  // 5. BẰNG CHỨNG AN NINH VÀ BẢO MẬT
  const securityEvidence = extractSecurityEvidence(context, technicalAnalysis);
  detailedPoints = detailedPoints.concat(securityEvidence);
  
  // Giới hạn tối đa 8 bằng chứng quan trọng nhất
  return detailedPoints.slice(0, 8).join('\n');
}

// Trích xuất bằng chứng từ nội dung trang web - NÂNG CẤP
function extractContentEvidence(context, evidenceText) {
  const evidence = [];
  const suspicious = context.suspicious_analysis || {};
  
  // Bằng chứng từ khóa bất hợp pháp
  if (suspicious.found_illegal_terms && suspicious.found_illegal_terms.length > 0) {
    const terms = suspicious.found_illegal_terms.slice(0, 5).map(term => `"${term}"`).join(', ');
    evidence.push(`Phát hiện ${suspicious.found_illegal_terms.length} từ khóa bất hợp pháp: ${terms} xuất hiện trong nội dung trang`);
  }
  
  // Bằng chứng số thẻ tín dụng
  if (suspicious.credit_cards_detected && suspicious.found_credit_cards.length > 0) {
    evidence.push(`Phát hiện ${suspicious.found_credit_cards.length} pattern số thẻ tín dụng trong trang, có thể là thông tin đánh cắp`);
  }
  
  // Bằng chứng địa chỉ cryptocurrency
  if (suspicious.crypto_detected && suspicious.found_crypto_addresses.length > 0) {
    evidence.push(`Phát hiện ${suspicious.found_crypto_addresses.length} địa chỉ cryptocurrency, thường dùng cho giao dịch ẩn danh bất hợp pháp`);
  }
  
  // Bằng chứng từ tiêu đề trang
  if (context.title) {
    const title = context.title.toLowerCase();
    if (title.includes('chợ đen') || title.includes('hack') || title.includes('dump') || title.includes('ccv')) {
      evidence.push(`Tiêu đề trang "${context.title}" công khai tuyên bố hoạt động bất hợp pháp`);
    }
  }
  
  // Bằng chứng từ domain name
  if (context.domain) {
    const domain = context.domain.toLowerCase();
    if (domain.includes('tienban') || domain.includes('hack') || domain.includes('dump')) {
      evidence.push(`Domain "${context.domain}" được đặt tên gợi ý rõ ràng hoạt động mua bán bất hợp pháp`);
    }
  }
  
  return evidence;
}

// Trích xuất bằng chứng kỹ thuật - NÂNG CẤP
function extractTechnicalEvidence(context, technicalAnalysis) {
  const evidence = [];
  const suspicious = context.suspicious_analysis || {};
  
  // Bằng chứng JavaScript obfuscated
  if (suspicious.suspicious_scripts && suspicious.suspicious_scripts.length > 0) {
    const scriptCount = suspicious.suspicious_scripts.length;
    const patterns = [...new Set(suspicious.suspicious_scripts.flatMap(s => s.suspicious_patterns))];
    const highEntropyScripts = suspicious.suspicious_scripts.filter(s => s.entropy > 6).length;
    
    if (highEntropyScripts > 0) {
      evidence.push(`Phát hiện ${scriptCount} script JavaScript sử dụng kỹ thuật obfuscation cao: ${patterns.slice(0, 4).join(', ')}, ${highEntropyScripts} script có entropy > 6.0`);
    } else {
      evidence.push(`Phát hiện ${scriptCount} script JavaScript có pattern đáng ngờ: ${patterns.slice(0, 4).join(', ')}`);
    }
  }
  
  // Bằng chứng input fields nguy hiểm
  if (suspicious.dangerous_inputs_detected && suspicious.dangerous_inputs.length > 0) {
    const inputTypes = [...new Set(suspicious.dangerous_inputs.map(i => i.type || i.name))];
    evidence.push(`Phát hiện ${suspicious.dangerous_inputs.length} input field thu thập thông tin nhạy cảm: ${inputTypes.join(', ')}`);
  }
  
  // Bằng chứng HTTPS
  if (context.security && !context.security.https) {
    evidence.push(`Trang web không sử dụng HTTPS khi thu thập thông tin nhạy cảm, vi phạm chuẩn bảo mật cơ bản`);
  }
  
  // Bằng chứng iframe ẩn
  if (suspicious.hidden_elements_detected && suspicious.hidden_iframes.length > 0) {
    evidence.push(`Phát hiện ${suspicious.hidden_iframes.length} iframe ẩn kích thước 0x0 hoặc invisible, dùng để tracking hoặc load script độc hại`);
  }
  
  return evidence;
}

// Trích xuất bằng chứng cấu trúc trang web
function extractStructureEvidence(context) {
  const evidence = [];
  
  // Bằng chứng forms thu thập dữ liệu
  if (context.forms && context.forms.length > 0) {
    const sensitiveInputs = [];
    context.forms.forEach(form => {
      form.inputs?.forEach(input => {
        if (input.type === 'password' || input.name?.includes('password') || 
            input.name?.includes('otp') || input.name?.includes('pin')) {
          sensitiveInputs.push(input.type);
        }
      });
    });
    
    if (sensitiveInputs.length > 0) {
      evidence.push(`Phát hiện ${context.forms.length} form thu thập dữ liệu nhạy cảm: ${[...new Set(sensitiveInputs)].join(', ')}`);
    }
  }
  
  // Bằng chứng meta tags thiếu
  const metaTags = context.meta_tags || {};
  const missingMeta = [];
  if (!metaTags.description) missingMeta.push('description');
  if (!metaTags.author) missingMeta.push('author');
  if (!metaTags.contact) missingMeta.push('contact');
  
  if (missingMeta.length > 0) {
    evidence.push(`Thiếu thông tin meta tags cơ bản: ${missingMeta.join(', ')}, che giấu thông tin chủ sở hữu`);
  }
  
  return evidence;
}

// Trích xuất bằng chứng hành vi đáng ngờ
function extractBehaviorEvidence(findings, evidenceText) {
  const evidence = [];
  const allText = `${findings.join(' ')} ${evidenceText}`.toLowerCase();
  
  // 1. Phát hiện chiêu trò lừa đảo nâng cao
  const advancedFraud = extractAdvancedFraudEvidence(findings, evidenceText, allText);
  evidence.push(...advancedFraud.slice(0, 2)); // Lấy 2 bằng chứng quan trọng nhất
  
  // 2. Bằng chứng thanh toán đáng ngờ
  if (allText.includes('bitcoin') || allText.includes('usdt') || allText.includes('cryptocurrency')) {
    evidence.push(`Sử dụng thanh toán cryptocurrency để tránh truy vết trong các giao dịch bất hợp pháp`);
  }
  
  // 3. Bằng chứng popup/redirect
  if (allText.includes('popup') || allText.includes('redirect') || allText.includes('window.open')) {
    evidence.push(`Sử dụng popup và redirect tự động để điều hướng người dùng đến các trang không mong muốn`);
  }
  
  // 4. Bằng chứng urgency/scarcity
  if (allText.includes('limited time') || allText.includes('urgent') || allText.includes('countdown')) {
    evidence.push(`Áp dụng kỹ thuật tâm lý tạo cảm giác khan hiếm và gấp gáp để thúc đẩy hành động`);
  }
  
  return evidence.slice(0, 4); // Giới hạn 4 bằng chứng quan trọng nhất
}

// Trích xuất bằng chứng an ninh - NÂNG CẤP
function extractSecurityEvidence(context, technicalAnalysis) {
  const evidence = [];
  const suspicious = context.suspicious_analysis || {};
  
  // Bằng chứng links đáng ngờ
  if (suspicious.suspicious_links_detected && suspicious.suspicious_links.length > 0) {
    const telegramCount = suspicious.suspicious_links.filter(link => link.href.includes('telegram')).length;
    const shortenerCount = suspicious.suspicious_links.filter(link => 
      link.href.includes('bit.ly') || link.href.includes('tinyurl')).length;
    
    evidence.push(`Phát hiện ${suspicious.suspicious_links.length} link đáng ngờ: ${telegramCount} Telegram link, ${shortenerCount} URL shortener`);
  }
  
  // Bằng chứng contact links
  if (context.contact_links && context.contact_links.length > 0) {
    const telegramLinks = context.contact_links.filter(link => link.includes('telegram'));
    if (telegramLinks.length > 0) {
      evidence.push(`Chỉ cung cấp ${telegramLinks.length} link liên hệ Telegram, tránh xác thực danh tính qua kênh chính thức`);
    }
  } else {
    evidence.push(`Hoàn toàn không cung cấp thông tin liên hệ, địa chỉ công ty, hoặc phone number`);
  }
  
  // Bằng chứng scripts từ bên thứ 3
  if (context.scripts && context.scripts.length > 0) {
    const externalScripts = context.scripts.filter(script => script.src && !script.src.includes(context.domain));
    if (externalScripts.length > 3) {
      evidence.push(`Tải ${externalScripts.length} script JavaScript từ ${externalScripts.length} domain khác nhau, tăng nguy cơ mã độc`);
    }
  }
  
  return evidence;
}

// Phân tích loại trang web và mục đích
function analyzeWebsiteType(category, summary, evidenceText) {
  const allText = `${summary} ${evidenceText}`.toLowerCase();
  
  // CHUYÊN BIỆT: Phát hiện chợ đen, tiền bẩn, CCV lậu
  if (allText.match(/(chợ đen|tiền bẩn|ccv|thẻ tín dụng|đánh cắp|rửa tiền|tài khoản lậu|hack|crack|dump)/)) {
    return "Trang web tự nhận là \"Chợ Đen\" và công khai mua bán \"tiền bẩn\", CCV (thông tin thẻ tín dụng đánh cắp), và các loại tài khoản lậu";
  }
  
  // CHUYÊN BIỆT: Phát hiện các từ ngữ phi pháp
  if (allText.match(/(tienban|money dirty|illegal|stolen|fraud|scam|phishing)/)) {
    return "Sử dụng các từ ngữ như \"tiền bẩn\", \"CCV lậu\", \"rửa tiền\" cho thấy hoạt động phi pháp";
  }
  
  if (allText.match(/(game|tài khoản|acc|shop game|bán acc)/)) {
    return "Trang web bán tài khoản game trực tuyến với nhiều dấu hiệu đáng ngờ";
  }
  if (allText.match(/(đầu tư|forex|bitcoin|crypto|trading)/)) {
    return "Trang web đầu tư tài chính trực tuyến không có giấy phép hoạt động";
  }
  if (allText.match(/(ngân hàng|bank|atm|chuyển khoản)/)) {
    return "Trang web mạo danh ngân hàng để đánh cắp thông tin tài khoản";
  }
  if (allText.match(/(casino|cờ bạc|cá cược|lô đề)/)) {
    return "Trang web cờ bạc trực tuyến trái phép luật pháp Việt Nam";
  }
  if (allText.match(/(shopee|lazada|tiki|mua sắm)/)) {
    return "Trang web mạo danh sàn thương mại điện tử để lừa đảo";
  }
  
  return `Trang web ${category.toLowerCase()} với các hoạt động đáng ngờ`;
}

// Phân tích tính minh bạch và thông tin pháp lý
function analyzeLegalTransparency(evidenceText, technicalAnalysis) {
  const allText = `${evidenceText} ${technicalAnalysis}`.toLowerCase();
  
  if (allText.match(/(không.*thông tin.*liên hệ|thiếu.*địa chỉ|không.*số điện thoại)/)) {
    return "Không có thông tin rõ ràng về chủ sở hữu và địa chỉ kinh doanh";
  }
  if (allText.match(/(không.*giấy phép|thiếu.*chứng nhận|không.*đăng ký kinh doanh)/)) {
    return "Không có cơ quan pháp lý hợp pháp và giấy phép kinh doanh";
  }
  if (allText.match(/(ẩn.*whois|private.*registration|contact.*hidden)/)) {
    return "Thông tin đăng ký domain bị ẩn hoặc sử dụng dịch vụ private registration";
  }
  
  return null;
}

// Phân tích các vấn đề bảo mật và kỹ thuật
function analyzeSecurityIssues(technicalAnalysis, evidenceText) {
  const allText = `${technicalAnalysis} ${evidenceText}`.toLowerCase();
  
  if (allText.match(/(obfuscated|mã.*rối|javascript.*phức tạp|code.*che giấu)/)) {
    return "Sử dụng nhiều mã JavaScript phức tạp và bị làm rối (obfuscated)";
  }
  if (allText.match(/(ssl.*không.*hợp lệ|http.*không.*an toàn|chứng chỉ.*sai)/)) {
    return "Thiếu chứng chỉ SSL hợp lệ hoặc sử dụng kết nối không an toàn";
  }
  if (allText.match(/(tracking.*script|third.*party.*code|external.*script)/)) {
    return "Tích hợp nhiều script tracking và mã từ bên thứ ba không rõ nguồn gốc";
  }
  
  return null;
}

// Phân tích các tính năng đáng ngờ
function analyzeSuspiciousFeatures(findings, evidenceText) {
  const features = [];
  const allText = `${findings.join(' ')} ${evidenceText}`.toLowerCase();
  
  // CHUYÊN BIỆT: Phát hiện mã JavaScript được làm rối
  if (allText.match(/(obfuscated|mã.*rối|javascript.*phức tạp|eval\(|unescape\(|fromcharcode|btoa\(|atob\()/)) {
    features.push("Sử dụng nhiều mã JavaScript phức tạp và bị làm rối (obfuscated)");
  }
  
  // CHUYÊN BIỆT: Phát hiện các popup và redirect đáng ngờ
  if (allText.match(/(popup.*spam|quảng cáo.*nhiều|redirect.*tự động|window\.open|location\.href.*random)/)) {
    features.push("Xuất hiện nhiều popup quảng cáo và chuyển hướng tự động đáng ngờ");
  }
  
  // CHUYÊN BIỆT: Phát hiện thanh toán thiếu minh bạch
  if (allText.match(/(thanh toán|nạp tiền|payment|checkout|bitcoin|usdt|momo|bank.*transfer)/)) {
    features.push("Có các chức năng nạp tiền và thanh toán trực tuyến thiếu minh bạch");
  }
  
  // CHUYÊN BIỆT: Phát hiện các hoạt động vi phạm pháp luật nghiêm trọng
  if (allText.match(/(bán.*ccv|mua.*thẻ.*cắp|hack.*account|stolen.*data|dump.*card)/)) {
    features.push("VI PHẠM PHÁP LUẬT NGHIÊM TRỌNG: Công khai bán các sản phẩm/dịch vụ bất hợp pháp như CCV, thẻ cắp, tài khoản hack");
  }
  
  // VI PHẠM PHÁP LUẬT: Buôn bán tài khoản game/mạng xã hội
  if (allText.match(/(bán.*tài.*khoản|acc.*game|account.*game|nick.*game|bán.*acc|mua.*acc|tài.*khoản.*facebook|tài.*khoản.*instagram|tài.*khoản.*tiktok)/)) {
    features.push("VI PHẠM PHÁP LUẬT: Buôn bán tài khoản game/mạng xã hội - vi phạm điều khoản dịch vụ và có thể vi phạm luật sở hữu trí tuệ");
  }
  
  // VI PHẠM BẢO MẬT: Thu thập thông tin cá nhân trái phép
  if (allText.match(/(số.*điện.*thoại|phone.*number|địa.*chỉ.*nhà|home.*address|cccd|cmnd|passport|căn.*cước)/)) {
    features.push("VI PHẠM BẢO MẬT: Yêu cầu cung cấp thông tin cá nhân nhạy cảm có thể dẫn đến rò rỉ dữ liệu và lạm dụng");
  }
  
  // CHUYÊN BIỆT: Phát hiện việc ẩn thông tin chủ sở hữu
  if (allText.match(/(whois.*hidden|privacy.*protection|contact.*private|proxy.*domain)/)) {
    features.push("Ẩn thông tin chủ sở hữu domain và sử dụng dịch vụ privacy protection");
  }
  
  if (allText.match(/(countdown|thời gian.*giới hạn|urgency|gấp|limited.*time)/)) {
    features.push("Sử dụng kỹ thuật tâm lý tạo áp lực thời gian và sự gấp gáp");
  }
  
  return features;
}

// Phân tích chiến lược pricing
function analyzePricingStrategy(evidenceText, findings) {
  const allText = `${evidenceText} ${findings.join(' ')}`.toLowerCase();
  
  if (allText.match(/(giảm.*90%|khuyến mãi.*cao|giá.*rẻ.*bất thường|discount.*90)/)) {
    return "Quảng cáo giá rẻ và khuyến mãi cao bất thường (giảm giá 90%)";
  }
  if (allText.match(/(lợi nhuận.*cao|lãi.*suất.*lớn|thu nhập.*khủng)/)) {
    return "Hứa hẹn lợi nhuận và lãi suất cao bất thường không thực tế";
  }
  
  return null;
}

// Phân tích thu thập dữ liệu
function analyzeDataCollection(evidenceText, findings) {
  const allText = `${evidenceText} ${findings.join(' ')}`.toLowerCase();
  
  if (allText.match(/(form.*đăng.*ký|thu thập.*thông tin|input.*field)/)) {
    return "Thu thập thông tin người dùng thông qua form đăng ký/đăng nhập";
  }
  if (allText.match(/(otp|mật khẩu|pin|cccd|cmnd)/)) {
    return "Yêu cầu cung cấp thông tin nhạy cảm như OTP, mật khẩu, số CCCD";
  }
  
  return null;
}

// Tạo kết luận rủi ro
function generateRiskConclusion(riskLevel, category, reportUrl) {
  const domain = reportUrl.split('/')[2] || reportUrl;
  
  if (riskLevel >= 8) {
    return `Có thể là trang web lừa đảo nhằm chiếm đoạt thông tin và tiền của người dùng`;
  }
  if (riskLevel >= 6) {
    return `Trang web có nhiều dấu hiệu đáng ngờ, không khuyến khích sử dụng`;
  }
  if (riskLevel >= 4) {
    return `Cần thận trọng khi sử dụng trang web này và không cung cấp thông tin cá nhân`;
  }
  
  return null;
}

// Cải thiện finding đơn lẻ
function enhanceFinding(finding) {
  // Nếu finding đã đủ chi tiết thì giữ nguyên
  if (finding.length > 50) {
    return finding;
  }
  
  // Nếu ngắn quá thì bỏ qua
  if (finding.length < 20) {
    return null;
  }
  
  return finding;
}

// Trích xuất bằng chứng kỹ thuật cụ thể
function extractTechnicalPoints(technicalText) {
  const sentences = technicalText.split(/[.!?]+/).filter(s => s.trim().length > 15);
  const technicalPatterns = [
    /SSL|HTTPS|chứng chỉ|certificate/i,
    /domain|DNS|IP address|subdomain/i,
    /script|JavaScript|code|malware/i,
    /redirect|chuyển hướng|302|301/i,
    /API|endpoint|server|hosting/i,
    /cookie|session|tracking|fingerprint/i
  ];
  
  const techPoints = [];
  for (const pattern of technicalPatterns) {
    for (const sentence of sentences) {
      if (pattern.test(sentence) && techPoints.length < 3) {
        const cleanSentence = sentence.trim().slice(0, 120) + (sentence.length > 120 ? '...' : '');
        if (!techPoints.some(p => p.includes(cleanSentence.slice(0, 30)))) {
          techPoints.push(`• ${cleanSentence}`);
        }
      }
    }
  }
  
  return techPoints.join('\n');
}

// Trích xuất bằng chứng cụ thể từ evidence text
function extractSpecificEvidence(evidenceText) {
  const sentences = evidenceText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const evidencePatterns = [
    /phát hiện.*form|input.*field|thu thập.*dữ liệu/i,
    /trang.*mạo danh|giả mạo.*logo|copy.*thiết kế/i,
    /yêu cầu.*thông tin|nhập.*mật khẩu|cung cấp.*OTP/i,
    /không.*có.*giấy phép|thiếu.*thông tin.*liên hệ|địa chỉ.*không.*rõ/i,
    /hứa.*lợi nhuận|cam kết.*lãi|đảm bảo.*thu nhập/i,
    /popup.*lạ|quảng cáo.*spam|chuyển hướng.*tự động/i
  ];
  
  const evidencePoints = [];
  for (const pattern of evidencePatterns) {
    for (const sentence of sentences) {
      if (pattern.test(sentence) && evidencePoints.length < 4) {
        let cleanSentence = sentence.trim();
        // Làm sạch và rút gọn
        cleanSentence = cleanSentence.replace(/^[^\w]*/, '').replace(/[^\w]*$/, '');
        if (cleanSentence.length > 150) {
          cleanSentence = cleanSentence.slice(0, 147) + '...';
        }
        if (cleanSentence.length > 30 && !evidencePoints.some(p => p.includes(cleanSentence.slice(0, 40)))) {
          evidencePoints.push(`• ${cleanSentence}`);
        }
      }
    }
  }
  
  return evidencePoints.join('\n');
}

// Xác định thể loại dựa trên AI analysis
function detectCategory(aiData) {
  const findings = (aiData.findings || []).join(' ').toLowerCase();
  const summary = (aiData.summary || '').toLowerCase();
  const evidenceText = (aiData.evidence_text || '').toLowerCase();
  const url = (aiData.url || '').toLowerCase();
  
  const allText = `${findings} ${summary} ${evidenceText} ${url}`;
  
  // CHUYÊN BIỆT: Phân loại chợ đen và hoạt động phi pháp (ưu tiên cao nhất)
  if (allText.match(/(chợ đen|tiền bẩn|ccv|rửa tiền|hack|stolen|dump|cvv|fullz|bins|tienban)/i)) {
    return 'Chợ đen - Mua bán hoạt động phi pháp';
  }
  
  // Phân loại theo thứ tự ưu tiên
  if (allText.match(/(ngân hàng|bank|vietcombank|techcombank|bidv|vietinbank|agribank|acb|mb|vpbank|sacombank|atm|thẻ tín dụng|visa|mastercard)/i)) {
    return 'Mạo danh ngân hàng/tài chính';
  }
  if (allText.match(/(shopee|lazada|tiki|sendo|mua sắm|sàn thương mại|tmdt|e-commerce)/i)) {
    return 'Mạo danh sàn TMDT';
  }
  if (allText.match(/(facebook|zalo|messenger|telegram|viber|instagram|tiktok|mạng xã hội)/i)) {
    return 'Mạo danh mạng xã hội';
  }
  if (allText.match(/(cờ bạc|casino|cá cược|bài bạc|xổ số|lô đề|game bài)/i)) {
    return 'Cờ bạc trực tuyến';
  }
  if (allText.match(/(đầu tư|forex|bitcoin|cryptocurrency|btc|eth|chứng khoán|cổ phiếu|quỹ đầu tư)/i)) {
    return 'Lừa đảo đầu tư';
  }
  if (allText.match(/(otp|mã xác minh|pin|mật khẩu|password|cccd|cmnd|căn cước|chứng minh)/i)) {
    return 'Lấy cắp thông tin cá nhân';
  }
  if (allText.match(/(chính phủ|bộ|sở|ủy ban|thuế|bảo hiểm xã hội|bhxh|cục|văn phòng chính phủ)/i)) {
    return 'Mạo danh cơ quan nhà nước';
  }
  if (allText.match(/(fpt|viettel|vnpt|mobifone|vinaphone|nhà mạng|telco|sim|gói cước)/i)) {
    return 'Mạo danh nhà mạng';
  }
  
  return 'Lừa đảo khác';
}
  
// Tạo báo cáo mẫu để copy với nội dung chi tiết
function generateReportText(aiData, urls) {
  const riskLevel = aiData.risk || 0;
  let riskText = "🟢 An toàn";
  let riskIcon = "🟢";
  
  if (riskLevel >= 9) {
    riskText = "🔴 CỰC KỲ NGUY HIỂM";
    riskIcon = "🔴";
  } else if (riskLevel >= 7) {
    riskText = "🟠 NGUY HIỂM CAO";
    riskIcon = "🟠";
  } else if (riskLevel >= 5) {
    riskText = "🟡 CẦN THẬN TRỌNG";
    riskIcon = "🟡";
  } else if (riskLevel >= 3) {
    riskText = "🟡 CÓ RỦI RO";
    riskIcon = "🟡";
  }

  const findings = (aiData.findings || []).map((f, i) => `${i + 1}. ${f}`).join('\n');
  const timestamp = new Date().toLocaleString('vi-VN');
  
  // Thêm section bằng chứng kỹ thuật dựa trên dữ liệu thu thập được
  let technicalEvidence = '';
  if (aiData.context?.suspicious_analysis) {
    const suspicious = aiData.context.suspicious_analysis;
    technicalEvidence = `
═══════════════════════════════════════════════════════════
🚨 BẰNG CHỨNG KỸ THUẬT CHI TIẾT
═══════════════════════════════════════════════════════════

${suspicious.illegal_content_detected ? `🔴 PHÁT HIỆN NỘI DUNG BẤT HỢP PHÁP:
${suspicious.found_illegal_terms.map(term => `• "${term}"`).join('\n')}
` : ''}${suspicious.obfuscated_code_detected ? `🔴 PHÁT HIỆN MÃ JAVASCRIPT ĐÁNG NGỜ:
${suspicious.suspicious_scripts.map(script => 
  `• ${script.src === 'inline' ? 'Script nội tuyến' : script.src}: [${script.suspicious_patterns.join(', ')}] (${script.length} ký tự)`
).join('\n')}
` : ''}${suspicious.hidden_elements_detected ? `🔴 PHÁT HIỆN ELEMENT ẨN ĐÁNG NGỜ:
${suspicious.hidden_iframes.map(iframe => 
  `• iframe ẩn: ${iframe.src || 'không có src'} (${iframe.width}x${iframe.height})`
).join('\n')}
` : ''}`;
  }
  
  return `${riskIcon} BÁO CÁO PHÂN TÍCH BẢO MẬT TRANG WEB - CHUYÊN SÂU

═══════════════════════════════════════════════════════════
📊 THÔNG TIN TỔNG QUAN
═══════════════════════════════════════════════════════════

📋 TÓM TẮT: ${aiData.summary || 'Cần đánh giá thêm'}
⚠️ MỨC RỦI RO: ${riskLevel}/10 - ${riskText}
🌐 URL ĐƯỢC PHÂN TÍCH: ${aiData.url || 'N/A'}
⏰ THỜI GIAN PHÂN TÍCH: ${timestamp}

═══════════════════════════════════════════════════════════
🔍 CÁC DẤU HIỆU PHÁT HIỆN (${(aiData.findings || []).length} mục)
═══════════════════════════════════════════════════════════

${findings || 'Không phát hiện dấu hiệu bất thường rõ ràng.'}
${technicalEvidence}
═══════════════════════════════════════════════════════════
📝 BẰNG CHỨNG CHI TIẾT VÀ PHÂN TÍCH
═══════════════════════════════════════════════════════════

${aiData.evidence_text || 'Cần thực hiện phân tích sâu hơn để đưa ra kết luận chính xác về mức độ rủi ro của trang web này.'}

═══════════════════════════════════════════════════════════
⚙️ PHÂN TÍCH KỸ THUẬT
═══════════════════════════════════════════════════════════

${aiData.technical_analysis || 'Chưa có đủ dữ liệu kỹ thuật để phân tích chi tiết. Khuyến nghị thực hiện kiểm tra bổ sung về chứng chỉ SSL, domain authority và các script được tải.'}

═══════════════════════════════════════════════════════════
💡 KHUYẾN NGHỊ VÀ HÀNH ĐỘNG
═══════════════════════════════════════════════════════════

${aiData.recommendation || 'Hãy thận trọng khi sử dụng trang web này. Không cung cấp thông tin cá nhân nhạy cảm mà chưa được xác minh kỹ lưỡng.'}

═══════════════════════════════════════════════════════════
📸 TÀI LIỆU BẰNG CHỨNG
═══════════════════════════════════════════════════════════

🖼️ ẢNH VIEWPORT HIỆN TẠI: ${urls.currentView || 'Lỗi tải lên - không thể lưu trữ'}
📄 ẢNH TOÀN TRANG: ${urls.fullPage || 'Lỗi tải lên - không thể lưu trữ'}
🔍 ẢNH PHÂN TÍCH CHÚ THÍCH: ${urls.annotated || 'Lỗi tải lên - không thể lưu trữ'}

═══════════════════════════════════════════════════════════
📋 THÔNG TIN HỆ THỐNG
═══════════════════════════════════════════════════════════

🤖 PHÂN TÍCH BỞI: ChongLuaDao AI Evidence v2.0 (Enhanced)
🔧 CÔNG CỤ: Gemini 2.0 Flash + Computer Vision Analysis
📅 PHIÊN BẢN BÁO CÁO: ${new Date().toISOString().split('T')[0]}-ENHANCED

═══════════════════════════════════════════════════════════
⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM
═══════════════════════════════════════════════════════════

Báo cáo này được tạo tự động bởi hệ thống AI dựa trên phân tích hình ảnh và nội dung tại thời điểm kiểm tra. Kết quả chỉ mang tính chất tham khảo. Người dùng cần cân nhắc kỹ lưỡng và có thể tham khảo ý kiến chuyên gia trước khi đưa ra quyết định cuối cùng.

🛡️ Tìm hiểu thêm về bảo vệ bản thân khỏi lừa đảo: https://chongluadao.vn
📞 Báo cáo lừa đảo: 19001616 (Cục An toàn thông tin)

═══════════════════════════════════════════════════════════`;
}

// Upload ảnh (JSON payload: { image: <base64>, filename })
async function uploadImageJSON({ base64, filename, headers = {} }) {
  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ image: base64, filename })
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  return res.json();
}

// Chụp màn hình tab đang hiển thị
async function captureVisible() {
  return await chrome.tabs.captureVisibleTab(undefined, { format: "png" }); // dataURL
}

// Chụp màn hình với retry logic để xử lý quota limit
async function captureWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const screenshot = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
      return screenshot;
    } catch (error) {
      console.warn(`Capture attempt ${attempt} failed:`, error.message);
      
      // Nếu là lỗi quota, đợi lâu hơn
      if (error.message.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND")) {
        const waitTime = 1000 * attempt; // Tăng dần thời gian đợi
        console.log(`Quota exceeded, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (attempt === maxRetries) {
        // Nếu hết retry và vẫn lỗi, throw error
        throw error;
      } else {
        // Các lỗi khác, đợi ngắn hơn
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
}

// Chụp toàn bộ trang web (full page screenshot) với fix cắt bên phải
async function captureFullPage(tabId) {
  const startTime = Date.now();
  
  try {
    // Ẩn extension UI và đo kích thước chính xác
    const dimensionsPromise = chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Ẩn tất cả extension elements để tránh che
        const extensionElements = document.querySelectorAll('[data-extension], [id*="extension"], [class*="extension"]');
        const hiddenElements = [];
        extensionElements.forEach(el => {
          if (el.style.display !== 'none') {
            hiddenElements.push({element: el, originalDisplay: el.style.display});
            el.style.display = 'none';
          }
        });
        
        // Scroll lên đầu trang để đo chính xác
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);
        
        // Đo kích thước thực tế với padding
        const body = document.body;
        const html = document.documentElement;
        
        // Lấy kích thước content thực tế với buffer
        const contentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight,
          body.getBoundingClientRect().height,
          html.getBoundingClientRect().height
        );
        
        // Thêm buffer cho width để tránh bị cắt
        const contentWidth = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth,
          body.getBoundingClientRect().width,
          html.getBoundingClientRect().width,
          window.innerWidth + 50 // Thêm 50px buffer
        );
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = Math.min(window.innerWidth, contentWidth);
        
        // Test scroll để đảm bảo không có nội dung ẩn
        window.scrollTo(contentWidth - viewportWidth, 0);
        const maxScrollX = window.scrollX;
        
        window.scrollTo(0, contentHeight);
        const maxScrollY = window.scrollY;
        const actualHeight = maxScrollY + viewportHeight;
        
        // Khôi phục vị trí ban đầu
        window.scrollTo(originalScrollX, originalScrollY);
        
        // Khôi phục extension elements
        hiddenElements.forEach(({element, originalDisplay}) => {
          element.style.display = originalDisplay;
        });
        
        return {
          width: contentWidth,
          height: Math.max(contentHeight, actualHeight),
          contentHeight: contentHeight,
          actualHeight: actualHeight,
          maxScrollY: maxScrollY,
          maxScrollX: maxScrollX,
          viewportHeight: viewportHeight,
          viewportWidth: viewportWidth,
          originalScrollX: originalScrollX,
          originalScrollY: originalScrollY,
          hasHorizontalScroll: maxScrollX > 0
        };
      }
    });

    // Timeout sau 5 giây
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout getting page dimensions")), 5000)
    );

    const [{ result: dimensions }] = await Promise.race([dimensionsPromise, timeoutPromise]);
    const { width, height, viewportHeight, viewportWidth, originalScrollX, originalScrollY, 
            contentHeight, actualHeight, maxScrollY, maxScrollX, hasHorizontalScroll } = dimensions;
    
    console.log(`Page dimensions: ${width}x${height} (content: ${contentHeight}, viewport: ${viewportWidth}x${viewportHeight}, horizontalScroll: ${hasHorizontalScroll})`);
    
    // Logic thông minh để quyết định có nên full capture hay không
    const maxReasonableHeight = viewportHeight * 8; // Tăng từ 6 lên 8 để capture trang dài hơn
    const estimatedTime = Math.ceil(height / viewportHeight) * 600; // Giảm thời gian ước tính
    
    // Fallback về capture thường nếu:
    if (height <= viewportHeight * 1.8 ||           // Trang ngắn (giảm từ 2.5 xuống 1.8)
        height > maxReasonableHeight ||             // Trang quá dài  
        estimatedTime > 20000) {                    // Ước tính > 20 giây
      
      console.log(`Using quick capture: height=${height}, estimated_time=${estimatedTime}ms`);
      
      // Nếu có horizontal scroll, thử capture với scroll về 0,0 trước
      if (hasHorizontalScroll) {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => window.scrollTo(0, 0)
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      return await captureVisible();
    }

    // Tăng số lần scroll để capture đầy đủ hơn
    const maxChunks = 15; // Tăng từ 10 lên 15 để chụp đầy đủ hơn
    const verticalChunks = Math.min(Math.ceil(height / viewportHeight), maxChunks);
    const horizontalChunks = hasHorizontalScroll ? 2 : 1; // Nếu có horizontal scroll thì chụp 2 cột
    const screenshots = [];

    console.log(`Starting full page capture: ${verticalChunks} vertical × ${horizontalChunks} horizontal chunks`);

      // Bỏ thông báo progress - chụp im lặng

    // Scroll và chụp từng phần với overlap để tránh bị cắt (hỗ trợ cả horizontal)
    for (let row = 0; row < verticalChunks; row++) {
      for (let col = 0; col < horizontalChunks; col++) {
        const chunkStart = Date.now();
        const chunkIndex = row * horizontalChunks + col;
        
        // Tính toán vị trí scroll vertical với overlap tốt hơn
        let scrollY;
        if (row === 0) {
          scrollY = 0;
        } else if (row === verticalChunks - 1) {
          // Chunk cuối: đảm bảo chụp hết footer
          scrollY = Math.max(0, height - viewportHeight);
        } else {
          // Overlap 15% để đảm bảo không bỏ sót nội dung
          const overlapPixels = Math.floor(viewportHeight * 0.15);
          scrollY = (row * viewportHeight) - overlapPixels;
        }
        
        // Tính toán vị trí scroll horizontal
        let scrollX = 0;
        if (horizontalChunks > 1) {
          if (col === 0) {
            scrollX = 0;
          } else {
            // Scroll sang phải để chụp phần còn lại
            scrollX = Math.min(maxScrollX, viewportWidth * 0.7); // Overlap 30%
          }
        }
        
        // Scroll đến vị trí chính xác
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (x, y) => {
            // Ẩn extension elements trước khi chụp
            const extensionElements = document.querySelectorAll('[data-extension], [id*="extension"], [class*="extension"]');
            extensionElements.forEach(el => {
              el.style.visibility = 'hidden';
            });
            
            window.scrollTo({
              top: y,
              left: x,
              behavior: 'instant'
            });
            
            // Đảm bảo scroll chính xác
            const actualY = window.scrollY;
            const actualX = window.scrollX;
            if (Math.abs(actualY - y) > 5 || Math.abs(actualX - x) > 5) {
              window.scrollTo(x, y);
            }
          },
          args: [scrollX, scrollY]
        });

        // Delay để trang ổn định
        const minDelayBetweenCaptures = 700;
        await new Promise(resolve => setTimeout(resolve, minDelayBetweenCaptures));

        try {
          // Lấy vị trí scroll thực tế sau khi ổn định
          const [{ result: actualScrollData }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => ({
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              viewportHeight: window.innerHeight,
              viewportWidth: window.innerWidth
            })
          });

          // Chụp màn hình với retry
          const screenshot = await captureWithRetry(3);
          screenshots.push({
            dataUrl: screenshot,
            scrollY: actualScrollData.scrollY,
            scrollX: actualScrollData.scrollX,
            plannedScrollY: scrollY,
            plannedScrollX: scrollX,
            chunkIndex: chunkIndex,
            row: row,
            col: col,
            actualViewport: {
              width: actualScrollData.viewportWidth,
              height: actualScrollData.viewportHeight
            }
          });

          const chunkTime = Date.now() - chunkStart;
          console.log(`Chunk [${row},${col}]: planned=(${scrollX},${scrollY}), actual=(${actualScrollData.scrollX},${actualScrollData.scrollY}), time=${chunkTime}ms`);
          
        } catch (error) {
          console.error(`Failed to capture chunk [${row},${col}]:`, error);
          
          // Nếu fail quá nhiều chunk thì dừng
          if (screenshots.length === 0 && chunkIndex > 2) {
            throw new Error("Too many capture failures, falling back to visible area");
          }
          
          continue;
        }

        // Timeout check - tăng lên 45 giây cho trang dài
        if (Date.now() - startTime > 45000) {
          console.warn("Full page capture timeout, using current chunks");
          break;
        }
      }
    }

    // Khôi phục vị trí scroll ban đầu
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (x, y) => {
        window.scrollTo(x, y);
      },
      args: [originalScrollX, originalScrollY]
    });

    // Ghép các ảnh lại với timeout
    console.log(`Stitching ${screenshots.length} screenshots...`);
    const stitchPromise = stitchScreenshots(screenshots, dimensions);
    const stitchTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout stitching screenshots")), 10000)
    );

    const fullPageDataUrl = await Promise.race([stitchPromise, stitchTimeoutPromise]);
    
    const totalTime = Date.now() - startTime;
    console.log(`Full page capture completed in ${totalTime}ms`);
    
    return fullPageDataUrl;

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Full page capture failed after ${totalTime}ms:`, error);
    console.log("Falling back to visible area capture");
    return await captureVisible();
  }
}

// Ghép các screenshot thành một ảnh duy nhất với xử lý cả vertical và horizontal
async function stitchScreenshots(screenshots, dimensions) {
  console.log(`Stitching ${screenshots.length} screenshots...`);
  
  if (screenshots.length === 0) {
    throw new Error("No screenshots to stitch");
  }
  
  if (screenshots.length === 1) {
    return screenshots[0].dataUrl;
  }
  
  const { width, height, viewportHeight, viewportWidth, hasHorizontalScroll } = dimensions;
  
  // Sắp xếp screenshots theo row, sau đó theo col
  screenshots.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  
  // Tính toán kích thước canvas
  const maxRow = Math.max(...screenshots.map(s => s.row || 0));
  const maxCol = Math.max(...screenshots.map(s => s.col || 0));
  const actualCanvasHeight = Math.max(height, (maxRow + 1) * viewportHeight);
  const actualCanvasWidth = hasHorizontalScroll ? Math.max(width, viewportWidth * 1.3) : viewportWidth;
  
  // Tạo canvas
  const canvas = new OffscreenCanvas(actualCanvasWidth, actualCanvasHeight);
  const ctx = canvas.getContext("2d");
  
  // Fill background trắng
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, actualCanvasWidth, actualCanvasHeight);
  
  console.log(`Canvas size: ${actualCanvasWidth}x${actualCanvasHeight}, screenshots arranged in ${maxRow + 1}x${maxCol + 1} grid`);
  
  // Vẽ từng chunk
  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    const { dataUrl, scrollY, scrollX, row, col, actualViewport } = screenshot;
    
    console.log(`Processing chunk [${row},${col}]: scroll=(${scrollX},${scrollY})`);
    
    try {
      // Tạo image từ dataUrl
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      
      const chunkViewportHeight = actualViewport?.height || viewportHeight;
      const chunkViewportWidth = actualViewport?.width || viewportWidth;
      
      // Tính toán vị trí vẽ
      let drawX = col * viewportWidth * 0.7; // Overlap 30% cho horizontal
      let drawY = scrollY;
      let sourceX = 0;
      let sourceY = 0;
      let drawWidth = chunkViewportWidth;
      let drawHeight = chunkViewportHeight;
      
      // Xử lý overlap vertical
      if (row > 0) {
        const sameColPrevious = screenshots.find(s => s.col === col && s.row === row - 1);
        if (sameColPrevious) {
          const prevEndY = sameColPrevious.scrollY + chunkViewportHeight;
          if (scrollY < prevEndY) {
            const overlapHeight = prevEndY - scrollY;
            sourceY = overlapHeight;
            drawY = prevEndY;
            drawHeight = chunkViewportHeight - overlapHeight;
          }
        }
      }
      
      // Xử lý overlap horizontal  
      if (col > 0) {
        const sameRowPrevious = screenshots.find(s => s.row === row && s.col === col - 1);
        if (sameRowPrevious) {
          const overlapWidth = chunkViewportWidth * 0.3;
          sourceX = overlapWidth;
          drawWidth = chunkViewportWidth - overlapWidth;
        }
      }
      
      // Đảm bảo không vẽ quá canvas
      if (drawX + drawWidth > actualCanvasWidth) {
        drawWidth = actualCanvasWidth - drawX;
      }
      if (drawY + drawHeight > actualCanvasHeight) {
        drawHeight = actualCanvasHeight - drawY;
      }
      
      // Vẽ lên canvas
      if (drawWidth > 0 && drawHeight > 0) {
        ctx.drawImage(
          imageBitmap,
          sourceX, sourceY, drawWidth, drawHeight,
          drawX, drawY, drawWidth, drawHeight
        );
        
        console.log(`Drew chunk [${row},${col}]: source(${sourceX},${sourceY},${drawWidth},${drawHeight}) -> dest(${drawX},${drawY},${drawWidth},${drawHeight})`);
      }
    } catch (error) {
      console.error(`Failed to process chunk [${row},${col}]:`, error);
      continue;
    }
  }
  
  // Convert canvas to dataUrl
  const outputBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  const arrayBuffer = await outputBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  console.log(`Stitching completed: final size ${actualCanvasWidth}x${actualCanvasHeight}`);
  
  return `data:image/jpeg;base64,${base64}`;
}

// Lấy ngữ cảnh trang chi tiết (để gửi kèm cho Gemini)
async function getPageContext(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // Thu thập thông tin cơ bản (loại bỏ extension code)
      let cleanHTML = document.documentElement.outerHTML
        // Loại bỏ extension scripts và elements
        .replace(/<script[^>]*data-extension[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<div[^>]*data-extension[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<style[^>]*data-extension[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/chrome-extension:\/\/[^\s"'<>]+/gi, '')
        .replace(/moz-extension:\/\/[^\s"'<>]+/gi, '')
        .replace(/<script[^>]*src="chrome-extension:\/\/[^"]*"[^>]*><\/script>/gi, '')
        .replace(/<link[^>]*href="chrome-extension:\/\/[^"]*"[^>]*>/gi, '');
      
      const html = cleanHTML.slice(0, 800000);
      const text = (document.body?.innerText || "").slice(0, 8000);
      
      // Phân tích forms và inputs nhạy cảm
      const forms = Array.from(document.forms).map(form => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.elements).map(el => ({
          name: el.name,
          type: el.type,
          placeholder: el.placeholder,
          required: el.required
        }))
      }));
      
      // Kiểm tra links và redirects
      const links = Array.from(document.links).slice(0, 50).map(link => ({
        href: link.href,
        text: link.textContent?.slice(0, 100),
        target: link.target
      }));
      
      // Kiểm tra scripts và tracking
      const scripts = Array.from(document.scripts).slice(0, 20).map(script => ({
        src: script.src,
        inline: script.src ? false : true,
        content_length: script.textContent?.length || 0
      }));
      
      // Kiểm tra meta tags quan trọng
      const metaTags = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.name || meta.property || meta.httpEquiv;
        if (name) metaTags[name] = meta.content;
      });
      
      // Kiểm tra certificate info (qua protocol)
      const isHTTPS = location.protocol === 'https:';
      
      // Kiểm tra localStorage và cookies
      let hasLocalStorage = false;
      let cookieCount = 0;
      let localStorageData = {};
      try {
        hasLocalStorage = localStorage.length > 0;
        cookieCount = document.cookie.split(';').length;
        // Thu thập một vài key localStorage để phân tích
        for (let i = 0; i < Math.min(localStorage.length, 10); i++) {
          const key = localStorage.key(i);
          localStorageData[key] = localStorage.getItem(key)?.slice(0, 200);
        }
      } catch (e) {}
      
      // CHUYÊN BIỆT: Quét sâu các dấu hiệu chợ đen và hoạt động bất hợp pháp
      const suspiciousKeywords = [
        // Từ khóa chợ đen và hoạt động phi pháp
        'chợ đen', 'tiền bẩn', 'rửa tiền', 'hack', 'stolen', 'dump', 'lừa đảo',
        'black market', 'underground', 'dirty money', 'money laundering', 'scam',
        'dark web', 'deepweb', 'hàng cấm', 'ma túy', 'vũ khí', 'thuốc lắc',
        
        // Từ khóa tài chính bất hợp pháp
        'ccv', 'cvv', 'fullz', 'bins', 'carding', 'fraud', 'illegal',
        'fake id', 'ssn', 'credit card', 'bank account', 'paypal', 'western union',
        'thẻ tín dụng giả', 'clone thẻ', 'đánh cắp thẻ', 'mua bán thẻ',
        
        // Từ khóa lừa đảo tài chính
        'đầu tư siêu lợi nhuận', 'lãi suất khủng', 'thu nhập khủng', 
        'đầu tư 1 ăn 10', 'bảo hiểm lợi nhuận', 'cam kết hoàn tiền',
        'đa cấp', 'kiếm tiền nhanh', 'việc nhẹ lương cao',
        
        // Từ khóa lừa đảo mạng xã hội
        'hack facebook', 'hack zalo', 'hack instagram', 'tool hack',
        'phishing', 'giả mạo', 'clone nick', 'đánh cắp tài khoản',
        'bán acc', 'mua bán tài khoản', 'share acc', 'acc vip',
        
        // Từ khóa ngân hàng và thanh toán đáng ngờ
        'tài khoản bank', 'thẻ visa', 'chuyển tiền', 'rút tiền', 'đổi tiền',
        'ngân hàng ảo', 'ví điện tử ảo', 'tài khoản ngân hàng ảo',
        'chuyển tiền ảo', 'rút tiền ảo', 'tiền ảo', 'tiền điện tử',
        
        // Từ khóa cờ bạc và cá cược
        'cờ bạc', 'casino', 'cá cược', 'đánh bài', 'poker', 'slot',
        'lô đề', 'số đề', 'cá độ', 'đặt cược', 'win2888', 'rikvip',
        
        // Từ khóa lừa đảo thương mại điện tử
        'hàng giả', 'hàng nhái', 'hàng fake', 'super fake', 'replica',
        'giá rẻ bất ngờ', 'sale sốc', 'giảm sốc', 'thanh lý gấp',
        'xả kho', 'giá gốc', 'giá tận xưởng'
      ];
      
      const pageContent = document.body.innerText.toLowerCase();
      const pageHTML = document.documentElement.outerHTML.toLowerCase();
      
      // Tìm kiếm trong cả nội dung text và HTML source
      const foundSuspiciousTerms = suspiciousKeywords.filter(term => 
        pageContent.includes(term.toLowerCase()) || pageHTML.includes(term.toLowerCase())
      );
      
      // Phát hiện pattern số thẻ tín dụng giả
      const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
      const foundCreditCards = pageContent.match(creditCardPattern) || [];
      
      // Phát hiện pattern Bitcoin/crypto addresses
      const cryptoPattern = /\b[13][a-km-z1-9]{25,34}\b|0x[a-fA-F0-9]{40}/g;
      const foundCryptoAddresses = pageContent.match(cryptoPattern) || [];
      
      // Kiểm tra obfuscated JavaScript - NÂNG CẤP CHUYÊN SÂU
      const suspiciousScripts = Array.from(document.scripts).filter(script => {
        const content = script.textContent || '';
        return content.includes('eval(') || 
               content.includes('unescape(') || 
               content.includes('fromCharCode') ||
               content.includes('btoa(') ||
               content.includes('atob(') ||
               content.includes('\\x') ||  // Hex encoding
               content.includes('document.write') ||
               content.includes('createElement') && content.includes('appendChild') ||
               content.length > 10000; // Script quá dài có thể đã bị obfuscate
      }).map(script => {
        const content = script.textContent || '';
        return {
          src: script.src || 'inline',
          suspicious_patterns: [
            content.includes('eval(') && 'eval()',
            content.includes('unescape(') && 'unescape()',
            content.includes('fromCharCode') && 'fromCharCode',
            content.includes('btoa(') && 'base64_encode',
            content.includes('atob(') && 'base64_decode',
            content.includes('\\x') && 'hex_encoding',
            content.includes('document.write') && 'dynamic_content',
            content.includes('createElement') && content.includes('appendChild') && 'dom_manipulation',
            content.length > 10000 && 'very_long_script',
            content.length > 50000 && 'extremely_long_script'
          ].filter(Boolean),
          length: content.length,
          entropy: calculateEntropy(content.slice(0, 1000)) // Tính entropy để phát hiện mã hóa
        };
      });
      
      // Hàm tính entropy để phát hiện mã hóa/obfuscation
      function calculateEntropy(str) {
        if (!str) return 0;
        const freq = {};
        for (let char of str) {
          freq[char] = (freq[char] || 0) + 1;
        }
        const len = str.length;
        return Object.values(freq).reduce((entropy, count) => {
          const p = count / len;
          return entropy - p * Math.log2(p);
        }, 0);
      }
      
      // Quét các URL đáng ngờ trong links
      const suspiciousLinks = Array.from(document.links).filter(link => {
        const href = link.href.toLowerCase();
        const text = link.textContent.toLowerCase();
        return href.includes('telegram.me') || 
               href.includes('t.me') ||
               href.includes('bit.ly') ||
               href.includes('tinyurl') ||
               text.includes('download') && text.includes('tool') ||
               text.includes('hack') ||
               text.includes('crack');
      }).map(link => ({
        href: link.href,
        text: link.textContent.slice(0, 100),
        suspicious: true
      }));
      
      // Kiểm tra các input fields nguy hiểm
      const dangerousInputs = Array.from(document.querySelectorAll('input')).filter(input => {
        const name = (input.name || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        
        return name.includes('password') ||
               name.includes('otp') ||
               name.includes('pin') ||
               name.includes('cvv') ||
               name.includes('ccv') ||
               placeholder.includes('password') ||
               placeholder.includes('otp') ||
               placeholder.includes('pin') ||
               id.includes('credit') ||
               id.includes('card');
      }).map(input => ({
        type: input.type,
        name: input.name,
        placeholder: input.placeholder,
        required: input.required
      }));
      
      // Kiểm tra iframe ẩn hoặc đáng ngờ
      const suspiciousIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
        const style = getComputedStyle(iframe);
        return style.display === 'none' || 
               style.visibility === 'hidden' ||
               style.width === '0px' ||
               style.height === '0px' ||
               iframe.style.position === 'absolute' && 
               (iframe.style.left === '-9999px' || iframe.style.top === '-9999px');
      }).map(iframe => ({
        src: iframe.src,
        width: iframe.width || iframe.style.width,
        height: iframe.height || iframe.style.height,
        hidden: true
      }));
      
      // Kiểm tra social media và contact info
      const contactSelectors = [
        'a[href^="tel:"]', 'a[href^="mailto:"]', 
        'a[href*="facebook"]', 'a[href*="telegram"]', 
        'a[href*="zalo"]', 'a[href*="viber"]'
      ];
      const contactLinks = contactSelectors.map(sel => 
        Array.from(document.querySelectorAll(sel)).map(el => el.href)
      ).flat();
      
      return {
        url: location.href,
        domain: location.hostname,
        title: document.title,
        html_snippet: html,
        page_text: text,
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
        dpr: devicePixelRatio || 1,
        viewport: { w: innerWidth, h: innerHeight, sx: scrollX, sy: scrollY },
        // Thông tin bổ sung để phân tích
        forms: forms,
        links_sample: links,
        scripts: scripts,
        meta_tags: metaTags,
        security: {
          https: isHTTPS,
          has_local_storage: hasLocalStorage,
          cookie_count: cookieCount,
          local_storage_data: localStorageData
        },
        contact_links: contactLinks,
        page_stats: {
          image_count: document.images.length,
          link_count: document.links.length,
          form_count: document.forms.length,
          script_count: document.scripts.length
        },
        // BẰNG CHỨNG CHUYÊN BIỆT CHO CHỢ ĐEN & LỪA ĐẢO - NÂNG CẤP
        suspicious_analysis: {
          found_illegal_terms: foundSuspiciousTerms,
          found_credit_cards: foundCreditCards.slice(0, 5), // Chỉ lưu 5 pattern đầu
          found_crypto_addresses: foundCryptoAddresses.slice(0, 3), // Chỉ lưu 3 địa chỉ đầu
          suspicious_scripts: suspiciousScripts,
          suspicious_links: suspiciousLinks.slice(0, 10),
          dangerous_inputs: dangerousInputs,
          hidden_iframes: suspiciousIframes,
          // Flags for easy checking
          illegal_content_detected: foundSuspiciousTerms.length > 0,
          credit_cards_detected: foundCreditCards.length > 0,
          crypto_detected: foundCryptoAddresses.length > 0,
          obfuscated_code_detected: suspiciousScripts.length > 0,
          suspicious_links_detected: suspiciousLinks.length > 0,
          dangerous_inputs_detected: dangerousInputs.length > 0,
          hidden_elements_detected: suspiciousIframes.length > 0,
          // Risk scores
          total_risk_indicators: [
            foundSuspiciousTerms.length > 0,
            foundCreditCards.length > 0,
            foundCryptoAddresses.length > 0,
            suspiciousScripts.length > 0,
            suspiciousLinks.length > 0,
            dangerousInputs.length > 0,
            suspiciousIframes.length > 0
          ].filter(Boolean).length
        }
      };
    }
  });
  return result;
}

// Vẽ chú thích dựa trên báo cáo AI (panel + boxes)
async function annotateWithAI(dataUrl, report) {
  // Tạo ImageBitmap thay vì Image (tương thích Manifest V3)
  const response = await fetch(dataUrl);
  const imageBlob = await response.blob();
  const img = await createImageBitmap(imageBlob);

  // OffscreenCanvas: chuẩn Manifest V3
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // Panel thông tin
  const pad = 24, panelW = Math.min(760, img.width - pad*2), panelH = 240;
  ctx.globalAlpha = 0.85; 
  ctx.fillStyle = "#000";
  ctx.fillRect(pad, pad, panelW, panelH);
  ctx.globalAlpha = 1; 
  ctx.fillStyle = "#fff";

  // Tiêu đề chính
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(report.summary || "Có vẻ nguy hiểm", pad+14, pad+38);

  // Risk score
  ctx.font = "18px system-ui, sans-serif";
  const riskTxt = typeof report.risk === "number" ? `Rủi ro: ${report.risk}/10` : "Rủi ro: ?";
  ctx.fillText(riskTxt, pad+14, pad+66);

  // URL và thời gian
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(`URL: ${(report.url||"").slice(0,100)}`, pad+14, pad+90);
  ctx.fillText(`Thời gian: ${new Date().toLocaleString()}`, pad+14, pad+110);

  // Evidence text (nếu có)
  if (report.evidence_text) {
    ctx.fillText(`Bằng chứng: ${report.evidence_text.slice(0,90)}`, pad+14, pad+130);
  }

  // 5 phát hiện đầu cho ảnh
  const findings = (report.findings || []).slice(0, 5);
  let y = pad+154;
  for (const f of findings) {
    const s = `• ${f}`;
    ctx.fillText(s.length > 110 ? s.slice(0,107) + "..." : s, pad+14, y);
    y += 20;
  }

  // Vẽ boxes đánh dấu vùng nguy hiểm
  const boxes = report.boxes || []; // [{x,y,w,h,label,score}]
  ctx.lineWidth = 3;
  for (const b of boxes) {
    // Vẽ khung màu vàng
    ctx.strokeStyle = "#ffd60a";
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    
    // Vẽ label nếu có
    if (b.label) {
      const label = `${b.label}${b.score ? ` (${Math.round(b.score*100)}%)` : ""}`;
      const labelWidth = ctx.measureText(label).width + 10;
      
      // Background cho label
      ctx.globalAlpha = 0.9; 
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(b.x, Math.max(0, b.y-22), labelWidth, 20);
      
      // Text label
      ctx.globalAlpha = 1; 
      ctx.fillStyle = "#000"; 
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText(label, b.x+5, Math.max(14, b.y-7));
    }
  }

  const outputBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  
  // Chuyển blob thành base64 không dùng FileReader (tương thích service worker)
  const arrayBuffer = await outputBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Lưu lịch sử (tối đa 50 entries để tránh quota)
async function pushHistory(entry) {
  const KEY = "analysis_history";
  console.log('📝 Pushing history entry:', {
    url: entry.url,
    time: entry.time,
    hasAI: !!entry.ai,
    risk: entry.ai?.risk
  });
  
  try {
    const { [KEY]: list = [] } = await chrome.storage.local.get([KEY]);
    console.log('📊 Current history list length:', list.length);
    
    // Add entry to beginning of array
    list.unshift(entry);
    const trimmedList = list.slice(0, 50); // Giảm xuống 50 để tránh quota
    
    // Save back to storage
    await chrome.storage.local.set({ [KEY]: trimmedList });
    
    console.log('✅ History saved successfully, new length:', trimmedList.length);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving history:', error);
    
    // Nếu lỗi quota, thử xóa history cũ và retry
    if (error.message?.includes('quota') || error.message?.includes('Quota')) {
      console.log('🧹 Clearing old history due to quota, retrying...');
      try {
        const { [KEY]: list = [] } = await chrome.storage.local.get([KEY]);
        const reducedList = list.slice(0, 20); // Chỉ giữ 20 entries mới nhất
        await chrome.storage.local.set({ [KEY]: reducedList });
        
        // Retry save with reduced history
        reducedList.unshift(entry);
        const finalList = reducedList.slice(0, 20);
        await chrome.storage.local.set({ [KEY]: finalList });
        
        console.log('✅ History saved after cleanup, length:', finalList.length);
        return true;
      } catch (retryError) {
        console.error('❌ Failed to save even after cleanup:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

// ===== Gemini (Google Generative Language API) =====
function buildGeminiPrompt(context, urlSafetyData = null) {
  // Tích hợp thông tin an toàn URL vào prompt nếu có
  let urlSafetyContext = '';
  if (urlSafetyData && urlSafetyData.success && urlSafetyData.data) {
    const { result, riskLevel, message, summary, details } = urlSafetyData.data;
    urlSafetyContext = `
THÔNG TIN AN TOÀN URL ĐÃ KIỂM TRA:
- Kết quả tổng quát: ${result} (mức độ rủi ro: ${riskLevel})
- Thông báo: ${message}
- Tổng kết quét: ${summary?.total || 0} nguồn kiểm tra, ${summary?.safe || 0} an toàn, ${summary?.unsafe || 0} nguy hiểm, ${summary?.unknown || 0} không xác định
${details?.unsafe?.length > 0 ? `- Nguồn cảnh báo nguy hiểm: ${details.unsafe.map(u => u.api + ': ' + u.note).join('; ')}` : ''}
${details?.safe?.length > 0 ? `- Số nguồn xác nhận an toàn: ${details.safe.length}` : ''}

QUAN TRỌNG: Hãy tích hợp thông tin này vào phân tích để đưa ra đánh giá chính xác hơn.
`;
  }



  return `
Bạn là chuyên gia an ninh mạng và phân tích lừa đảo web hàng đầu. Phân tích TOÀN DIỆN và CHUYÊN SÂU hình ảnh cùng nội dung trang web để đưa ra đánh giá RỦI RO chi tiết nhất.

${urlSafetyContext}

YÊU CẦU PHÂN TÍCH CHUYÊN SÂU - QUÉT TOÀN BỘ TRANG WEB:
1. 🔍 QUÉT GỚI GIAO DIỆN: Phân tích từng element (buttons, forms, links, images, icons, menus)
2. 📝 PHÂN TÍCH NGÔN NGỮ: Kiểm tra từ khóa marketing, ngôn ngữ thuyết phục, lời hứa hẹn
3. 🎨 ĐÁNH GIÁ THIẾT KẾ: UX/UI manipulative, copy design, color psychology
4. 🌐 KIỂM TRA DOMAIN: Authority, trust signals, SSL, subdomain patterns
5. ⚙️ PHÂN TÍCH KỸ THUẬT: Scripts, redirects, tracking, obfuscation, API calls
6. 🏛️ TÍNH HỢP PHÁP: Giấy phép, thông tin pháp lý, contact info validation
7. 💰 RỦI RO TÀI CHÍNH: Payment methods, pricing strategy, investment promises
8. 🔐 BẢO MẬT DỮ LIỆU: Form security, data collection practices, privacy policy
9. 📱 MOBILE/APP: Download sources, permissions, store presence
10. 🎯 SOCIAL ENGINEERING: Psychological tactics, urgency creation, trust exploitation

TRẢ VỀ JSON DUY NHẤT theo schema:
{
  "risk": <number 0-10>,
  "summary": <string: tóm tắt 2-3 câu chi tiết>,
  "findings": [<mảng 12 dấu hiệu CỤ THỂ và CHI TIẾT bằng tiếng Việt>],
  "evidence_text": <string: bằng chứng chi tiết 500-800 từ>,
  "technical_analysis": <string: phân tích kỹ thuật 300-450 từ>,
  "recommendation": <string: khuyến nghị cụ thể 150-200 từ>,
  "website_category": <string: phân loại website (ecommerce/investment/gaming/banking/news/social/etc)>,
  "threat_level": <string: "LOW/MEDIUM/HIGH/CRITICAL">,
  "confidence_score": <number 0-100>,
  "boxes": [{"x":num,"y":num,"w":num,"h":num,"label":str,"score":0-1}]
}

QUAN TRỌNG VỀ FINDINGS - PHẢI CÓ ĐÚNG 12 DẤU HIỆU: 
BUỘC PHẢI TRẢ VỀ ĐÚNG 12 FINDINGS TRONG MẢNG, KHÔNG ĐƯỢC ÍT HỤT!
Mỗi finding phải CỤ THỂ và CHI TIẾT, không được chung chung. Ví dụ:
❌ KHÔNG ĐƯỢC: "Trang web đáng ngờ"
❌ KHÔNG ĐƯỢC: "Có dấu hiệu lừa đảo"
✅ ĐƯỢC: "Trang web bán tài khoản game trực tuyến với nhiều dấu hiệu đáng ngờ"
✅ ĐƯỢC: "Sử dụng nhiều mã JavaScript phức tạp và bị làm rối (obfuscated)"
✅ ĐƯỢC: "Quảng cáo giá rẻ và khuyến mãi cao bất thường (giảm giá 90%)"

LUÔN LUÔN TRẢ VỀ ĐÚNG 12 FINDINGS TRONG MẢNG JSON, NGAY CẢ KHI TRANG WEB AN TOÀN!

TIÊU CHÍ CHẤM ĐIỂM RỦI RO (0-10):
- 0-1: Trang web chính thống, có đầy đủ thông tin pháp lý
- 2-3: Trang web hợp pháp nhưng có một số điểm cần lưu ý  
- 4-5: Có dấu hiệu đáng ngờ, cần thận trọng khi sử dụng
- 6-7: Nhiều dấu hiệu lừa đảo, rủi ro cao
- 8-9: Rất nguy hiểm, có dấu hiệu lừa đảo rõ ràng
- 10: Chắc chắn là lừa đảo, cực kỳ nguy hiểm

DẤU HIỆU LỪA ĐẢO NÂNG CAO (tìm kiếm kỹ lưỡng):

🎯 GIAO DIỆN & THIẾT KẾ:
- Logo kém chất lượng, thiết kế nghiệp dư
- Copy thiết kế của các trang web uy tín
- Popup quá nhiều, giao diện flashy thái quá
- Countdown timer tạo cảm giác gấp gáp giả tạo
- Thiếu footer thông tin, điều khoản sử dụng

💰 TÀI CHÍNH & ĐẦU TƯ:
- Hứa hẹn lợi nhuận cao bất thường (>15%/tháng)
- Yêu cầu nạp tiền trước, phí kích hoạt
- Cơ chế Ponzi/MLM (mời bạn bè nhận thưởng)
- Tự nhận là "độc quyền", "bí mật thành công"
- Không có giấy phép kinh doanh rõ ràng

🔐 BẢO MẬT & THÔNG TIN:
- Thu thập OTP, mã PIN, mật khẩu ngân hàng
- Yêu cầu CCCD/CMND scan chất lượng cao
- Form đăng ký quá đơn giản cho dịch vụ tài chính
- Không có chính sách bảo mật/quyền riêng tư
- Lưu trữ thông tin không mã hóa

🌐 KỸ THUẬT & DOMAIN:
- Subdomain của dịch vụ miễn phí (blogspot, github.io)
- Không có SSL/HTTPS hoặc cert không hợp lệ
- Redirect qua nhiều domain trung gian
- Code JavaScript obfuscated, tracking scripts đáng ngờ

📱 MOBILE & APP:
- Yêu cầu tải app từ nguồn không phải Store chính thức
- APK trực tiếp từ website thay vì Google Play
- Quyền app quá rộng (truy cập SMS, contacts, etc.)
- App không có developer profile rõ ràng

🏛️ PHÁP LÝ & TỔ CHỨC:
- Không có thông tin công ty, địa chỉ liên hệ
- Hotline chỉ qua Telegram/Zalo, không có số cố định
- Mạo danh cơ quan nhà nước, ngân hàng
- Tự nhận có "giấy phép" nhưng không cung cấp số văn bản
- Logo/tên gần giống thương hiệu lớn

🎪 MARKETING & NGÔN NGỮ:
- Từ ngữ tạo FOMO: "duy nhất", "cơ hội cuối", "hôm nay"
- Testimonial giả, ảnh người dùng stock photos
- Quảng cáo "không rủi ro", "đảm bảo lãi"
- Celebrity endorsement không rõ nguồn gốc
- Ngôn ngữ tiếng Việt lạ, có dấu hiệu dịch máy

🚨 ĐẶC BIỆT - PHÁT HIỆN CHỢ ĐEN & HOẠT ĐỘNG PHI PHÁP:
- Tự nhận là "chợ đen", "black market", "underground"
- Công khai bán "tiền bẩn", "dirty money", "money laundering"
- Bán CCV (Credit Card Verification), thông tin thẻ tín dụng cắp
- Bán "dump card", thông tin thẻ từ đánh cắp
- Bán tài khoản hack, stolen accounts, cracked accounts
- Dịch vụ hack game mod game, hack account, hack game, hack tool, hack tool game, hack tool game mod, hack tool game mod game, hack tool game mod game mod, hack tool game mod game mod game, hack tool game mod game mod game mod, hack tool game mod game mod game mod game, hack tool game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod, hack tool game mod game mod game mod game mod game mod game mod game mod game mod game mod game mod
- Từ ngữ: "rửa tiền", "clean money", "money exchange illegal"
- Bán database cá nhân, thông tin nhạy cảm bị rò rỉ
- Các thuật ngữ hacker: "cvv", "fullz", "dumps", "bins"

PHÂN TÍCH NGĂN STACK DỮ LIỆU TRANG:
📊 Domain: ${context.domain}
🔗 URL đầy đủ: ${context.url}
📋 Tiêu đề: ${context.title}
🖥️ User Agent: ${context.ua}
📐 Viewport: ${context.viewport?.w}x${context.viewport?.h} (scroll: ${context.viewport?.sx}, ${context.viewport?.sy})
⏰ Thời gian phân tích: ${new Date().toISOString()}

🛡️ BẢO MẬT TRANG:
- HTTPS: ${context.security?.https ? 'Có' : 'KHÔNG - RỦI RO CAO'}
- Local Storage: ${context.security?.has_local_storage ? 'Có sử dụng' : 'Không'}
- Cookies: ${context.security?.cookie_count || 0} cookie(s)

📊 THỐNG KÊ TRANG:
- Hình ảnh: ${context.page_stats?.image_count || 0}
- Links: ${context.page_stats?.link_count || 0}
- Forms: ${context.page_stats?.form_count || 0}
- Scripts: ${context.page_stats?.script_count || 0}

📋 FORMS PHÁT HIỆN (${(context.forms || []).length} form):
${(context.forms || []).map((form, i) => 
  `Form ${i+1}: ${form.method?.toUpperCase() || 'GET'} → ${form.action || 'same page'}
  Inputs: ${form.inputs?.map(inp => `${inp.type}(${inp.name})`).join(', ') || 'none'}`
).join('\n') || 'Không có form nào'}

📱 THÔNG TIN LIÊN LẠC PHÁT HIỆN:
${(context.contact_links || []).length > 0 ? context.contact_links.join('\n') : 'Không tìm thấy thông tin liên lạc'}

🔗 CÁC SCRIPT ĐƯỢC TẢI (${(context.scripts || []).length} script):
${(context.scripts || []).slice(0, 10).map(script => 
  script.src ? `External: ${script.src}` : `Inline: ${script.content_length} chars`
).join('\n') || 'Không có script'}

🚨 PHÂN TÍCH BẰNG CHỨNG CHUYÊN BIỆT:
${context.suspicious_analysis ? `
📊 Tổng quan rủi ro:
- Phát hiện nội dung bất hợp pháp: ${context.suspicious_analysis.illegal_content_detected ? 'CÓ ⚠️' : 'Không'}
- Phát hiện mã JavaScript đáng ngờ: ${context.suspicious_analysis.obfuscated_code_detected ? 'CÓ ⚠️' : 'Không'}  
- Phát hiện element ẩn đáng ngờ: ${context.suspicious_analysis.hidden_elements_detected ? 'CÓ ⚠️' : 'Không'}

🔍 Chi tiết từ khóa bất hợp pháp được tìm thấy (${context.suspicious_analysis.found_illegal_terms?.length || 0} từ):
${(context.suspicious_analysis.found_illegal_terms || []).join(', ') || 'Không có'}

⚡ Chi tiết script đáng ngờ (${context.suspicious_analysis.suspicious_scripts?.length || 0} script):
${(context.suspicious_analysis.suspicious_scripts || []).map(script => 
  `- ${script.src}: [${script.suspicious_patterns.join(', ')}] (${script.length} chars)`
).join('\n') || 'Không có'}

🔒 Element ẩn đáng ngờ (${context.suspicious_analysis.hidden_iframes?.length || 0} iframe):
${(context.suspicious_analysis.hidden_iframes || []).map(iframe => 
  `- ${iframe.src || 'no-src'}: ${iframe.width}x${iframe.height}`
).join('\n') || 'Không có'}

💾 LocalStorage Data:
${Object.keys(context.security?.local_storage_data || {}).length > 0 ? 
  Object.entries(context.security.local_storage_data).map(([key, value]) => 
    `- ${key}: ${value?.slice(0, 100) || 'N/A'}...`
  ).join('\n') : 'Không có localStorage data'}
` : 'Chưa thu thập được dữ liệu phân tích chuyên sâu'}

🏷️ META TAGS QUAN TRỌNG:
${Object.entries(context.meta_tags || {}).slice(0, 10).map(([key, value]) => 
  `${key}: ${value?.slice(0, 100) || 'N/A'}`
).join('\n') || 'Không có meta tags'}

📝 NỘI DUNG TEXT TRANG (${context.page_text?.length || 0} ký tự):
${(context.page_text || "").slice(0, 2000)}

💻 HTML SOURCE CODE (${context.html_snippet?.length || 0} ký tự):
${(context.html_snippet || "").slice(0, 4000)}

🎯 NHIỆM VỤ QUAN TRỌNG: 
Đây là ảnh TOÀN BỘ TRANG WEB (full page screenshot), không phải chỉ viewport. Hãy phân tích từ đầu đến cuối trang:

⚠️ LƯU Ý BẮT BUỘC: MẢNG "findings" PHẢI CÓ ĐÚNG 12 PHẦN TỬ!
Nếu trang web an toàn, hãy tạo ra 12 điểm tích cực hoặc các đặc điểm kỹ thuật.
- Quét toàn bộ chiều dài trang từ header đến footer
- Chú ý các phần có thể ẩn dưới fold ban đầu
- Phân tích layout tổng thể và user journey
- Tìm các element đáng ngờ ở mọi vị trí trên trang
- Phải tạo ra 12 lý do khác nhau để đánh giá rủi ro của trang web tránh quá chung chung mà cụ thể lên đến 12 dấu hiệu cụ thể

Viết evidence_text như báo cáo chuyên gia (300+ từ) và technical_analysis chi tiết về cấu trúc trang. Recommendation phải cụ thể dựa trên full context của trang.`;
}

async function callGemini({ apiKey, model, imageBase64, context, endpointBase, urlSafetyData = null }) {
  const endpoint =
    (endpointBase || "https://generativelanguage.googleapis.com") +
    `/v1beta/models/${encodeURIComponent(model || "gemini-2.0-flash")}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{
      role: "user",
      parts: [
        { text: buildGeminiPrompt(context, urlSafetyData) },
        { inlineData: { mimeType: "image/png", data: imageBase64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 6000, // Tăng lên 6000 cho phân tích 12 findings chi tiết
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  // Lấy text JSON từ candidates
  const txt =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n");

  if (!txt) throw new Error("Gemini: không có nội dung trả về");

  // Parse JSON an toàn
  let report;
  try {
    report = JSON.parse(txt);
  } catch {
    // Thử gỡ markdown wrapper
    const cleaned = txt.replace(/^```json\s*|\s*```$/g, "").trim();
    report = JSON.parse(cleaned);
  }

  // Validate và chuẩn hóa dữ liệu
  report.risk = typeof report.risk === "number" ? Math.max(0, Math.min(10, report.risk)) : 7;
  report.summary = report.summary || "Có vẻ nguy hiểm";
  report.findings = Array.isArray(report.findings) ? report.findings : [];
  report.evidence_text = report.evidence_text || "Cần phân tích thêm để đưa ra đánh giá chính xác.";
  report.technical_analysis = report.technical_analysis || "Chưa có phân tích kỹ thuật chi tiết.";
  report.recommendation = report.recommendation || "Hãy thận trọng khi sử dụng trang web này.";
  report.website_category = report.website_category || "unknown";
  report.threat_level = report.threat_level || (report.risk >= 8 ? "CRITICAL" : report.risk >= 6 ? "HIGH" : report.risk >= 4 ? "MEDIUM" : "LOW");
  report.confidence_score = typeof report.confidence_score === "number" ? Math.max(0, Math.min(100, report.confidence_score)) : 85;
  report.boxes = Array.isArray(report.boxes) ? report.boxes : [];

  return report;
}

// ===== Message router =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "RUN_CAPTURE_AND_ANALYZE") {
        console.log('Received RUN_CAPTURE_AND_ANALYZE message:', msg);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tab.id;

        const { apiHeaders = {}, geminiApiKey, geminiModel, geminiEndpointBase } =
          await chrome.storage.sync.get(["apiHeaders", "geminiApiKey", "geminiModel", "geminiEndpointBase"]);

        if (!geminiApiKey) throw new Error("Chưa cấu hình Gemini API Key trong Options.");

        // 0) Kiểm tra an toàn URL và domain đã báo cáo trước khi quét (nếu không phải force scan)
        let urlSafetyData = null;
        let domainReportData = null;
        if (!msg.forceScan) {
          // Bỏ thông báo progress - chỉ im lặng quét
          
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          // Kiểm tra URL safety và domain report song song
          const [urlSafetyResult, domainReportResult] = await Promise.all([
            checkUrlSafety(currentTab.url),
            checkDomainReported(currentTab.url)
          ]);
          
          urlSafetyData = urlSafetyResult;
          domainReportData = domainReportResult;
          
          console.log('URL Safety Check Result:', urlSafetyData);
          console.log('Domain Report Check Result:', domainReportData);
          
          // Nếu URL nguy hiểm hoặc domain đã được báo cáo và người dùng chưa xác nhận tiếp tục
          const isUnsafeUrl = urlSafetyData?.success && urlSafetyData.data?.result === "unsafe";
          const isDomainReported = domainReportData?.success && domainReportData.reported;
          
          if (isUnsafeUrl || isDomainReported) {
            chrome.tabs.sendMessage(tabId, { 
              type: "URL_SAFETY_WARNING", 
              data: {
                urlSafety: urlSafetyData?.data,
                domainReport: domainReportData,
                isUnsafeUrl,
                isDomainReported
              }
            }).catch(() => {});
            return; // Dừng quét để chờ người dùng xác nhận
          }
        }

        // 1) Lấy context và chụp ảnh theo chế độ được chọn (im lặng)
        const ctx = await getPageContext(tabId);
        
        const captureMode = msg.captureMode || "FULL_PAGE";
        let fullPageDataUrl, currentViewDataUrl;
        
        if (captureMode === "QUICK") {
          console.log("Using quick capture mode - single screenshot");
          currentViewDataUrl = await captureVisible();
          fullPageDataUrl = currentViewDataUrl; // Dùng cùng ảnh cho cả 2
        } else {
          console.log("Using full page capture mode - dual screenshots");
          // Chụp viewport hiện tại trước
          currentViewDataUrl = await captureVisible();
          // Sau đó chụp full page (im lặng)
          fullPageDataUrl = await captureFullPage(tabId);
        }
        
        const shotBase64 = dataUrlToBase64(fullPageDataUrl); // Dùng full page cho AI analysis

        // 2) Gọi Gemini phân tích chuyên sâu (im lặng)
        
        let aiReport = await callGemini({
          apiKey: geminiApiKey,
          model: geminiModel || "gemini-2.0-flash",
          imageBase64: shotBase64,
          context: ctx,
          endpointBase: geminiEndpointBase,
          urlSafetyData: urlSafetyData // Truyền thông tin safety check
        });

        // 3) Bổ sung thông tin
        aiReport.url = ctx.url;
        aiReport.capturedAt = nowIso();
        aiReport.context = ctx; // Lưu context để sử dụng trong báo cáo
        aiReport.urlSafetyData = urlSafetyData; // Lưu kết quả kiểm tra an toàn URL
        aiReport.domainReportData = domainReportData; // Lưu kết quả kiểm tra domain đã báo cáo


        // 4) Upload ảnh viewport hiện tại (im lặng)
        
        const compressedCurrentView = await compressImage(currentViewDataUrl, 1200, 0.8);
        const upCurrentView = await uploadImageJSON({
          base64: compressedCurrentView,
          filename: `viewport_${Date.now()}.jpg`,
          headers: apiHeaders
        }).catch(e => ({ success: false, error: String(e) }));

        // 5) Upload ảnh full page (im lặng)
        
        const compressedFullPage = await compressImage(fullPageDataUrl, 1200, 0.8);
        const upFullPage = await uploadImageJSON({
          base64: compressedFullPage,
          filename: `fullpage_${Date.now()}.jpg`,
          headers: apiHeaders
        }).catch(e => ({ success: false, error: String(e) }));

        // 6) Vẽ chú thích và upload ảnh có chú thích (im lặng)
        const annotatedB64 = await annotateWithAI(fullPageDataUrl, aiReport);
        
        const upAnnotated = await uploadImageJSON({
          base64: annotatedB64,
          filename: `evidence_annotated_${Date.now()}.jpg`,
          headers: apiHeaders
        }).catch(e => ({ success: false, error: String(e) }));

        // 7) Tạo báo cáo cuối cùng
        const uploadUrls = {
          currentView: upCurrentView.success ? upCurrentView.link : upCurrentView.error,
          fullPage: upFullPage.success ? upFullPage.link : upFullPage.error,
          annotated: upAnnotated.success ? upAnnotated.link : upAnnotated.error
        };
        
        const reportText = generateReportText(aiReport, uploadUrls);
        
        // Tối ưu report để giảm storage quota
        const report = {
          url: ctx.url,
          time: aiReport.capturedAt,
          ai: {
            risk: aiReport.risk,
            summary: aiReport.summary,
            findings: aiReport.findings?.slice(0, 12) || [], // Tăng lên 12 findings
            website_category: aiReport.website_category,
            threat_level: aiReport.threat_level,
            confidence_score: aiReport.confidence_score
            // Bỏ context, evidence_text, technical_analysis để tiết kiệm storage
          },
          uploads: { 
            currentView: upCurrentView?.success ? upCurrentView.link : null,
            fullPage: upFullPage?.success ? upFullPage.link : null,
            annotated: upAnnotated?.success ? upAnnotated.link : null
          }
          // Bỏ reportText để tiết kiệm storage
        };

        // 7) Lưu vào lịch sử với error handling tốt hơn
        console.log('✅ Saving report to history...');
        try {
          // Tạo object report compact để tránh quota
          const compactReport = {
            url: ctx.url,
            time: aiReport.capturedAt,
            ai: {
              risk: aiReport.risk || 0,
              summary: (aiReport.summary || "").slice(0, 200),
              findings: (aiReport.findings || []).slice(0, 12),
              website_category: aiReport.website_category,
              threat_level: aiReport.threat_level
            },
            uploads: {
              currentView: upCurrentView?.success ? upCurrentView.link : null,
              fullPage: upFullPage?.success ? upFullPage.link : null,
              annotated: upAnnotated?.success ? upAnnotated.link : null
            }
          };
          
          const historyResult = await pushHistory(compactReport);
          if (historyResult) {
            console.log('✅ Report saved to history successfully');
          } else {
            console.warn('⚠️ History save returned false, but continuing...');
          }
        } catch (historyError) {
          console.error('❌ Error saving to history:', historyError);
          // Thử lưu với dữ liệu tối thiểu
          try {
            const minimalReport = {
              url: ctx.url,
              time: aiReport.capturedAt,
              ai: { risk: aiReport.risk || 0, summary: "Phân tích hoàn tất" }
            };
            await pushHistory(minimalReport);
            console.log('✅ Minimal report saved to history');
          } catch (fallbackError) {
            console.error('❌ Even minimal save failed:', fallbackError);
          }
        }
        

        
        // Bỏ thông báo lớn - chỉ quét im lặng
        
        console.log('📤 Sending response to popup...');
        sendResponse({ ok: true, report });
      }

      if (msg?.type === "GET_HISTORY") {
        const { analysis_history = [] } = await chrome.storage.local.get(["analysis_history"]);
        sendResponse({ ok: true, history: analysis_history });
      }

      if (msg?.type === "CLEAR_HISTORY") {
        await chrome.storage.local.set({ analysis_history: [] });
        sendResponse({ ok: true });
      }

      if (msg?.type === "FILL_CHONGLUADAO_FORM") {
        console.log('Received FILL_CHONGLUADAO_FORM message:', msg);
        const reportData = msg.reportData;
        const aiData = reportData.ai || {};
        
        // Lấy email từ storage
        const { userEmail } = await chrome.storage.sync.get(['userEmail']);
        
        // Tạo dữ liệu form
        const formData = {
          url: reportData.url || '',
          category: detectCategory(aiData),
          evidence: generateShortEvidence(aiData, reportData.url),
          email: userEmail || '',
          images: {
            currentView: reportData.uploads?.currentView?.link || '',
            fullPage: reportData.uploads?.fullPage?.link || '',
            annotated: reportData.uploads?.annotated?.link || ''
          }
        };
        
        // Mở tab ChongLuaDao với dữ liệu
        const formUrl = 'https://chongluadao.vn/report/reportphishing';
        const newTab = await chrome.tabs.create({ url: formUrl });
        
        // Đợi tab load xong rồi điền form
        const waitForLoad = () => {
          return new Promise((resolve) => {
            const listener = (tabId, changeInfo) => {
              if (tabId === newTab.id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            
            // Timeout sau 10 giây
            setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 10000);
          });
        };
        
        await waitForLoad();
        
        // Điền form
        try {
          console.log('Executing form fill script with data:', formData);
          
          await chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: fillChongLuaDaoForm,
            args: [formData]
          });
          
          console.log('Form fill script executed successfully');
          sendResponse({ ok: true, message: "Đã điền form thành công" });
        } catch (error) {
          console.error("Failed to fill form:", error);
          sendResponse({ ok: false, error: "Không thể điền form tự động. Vui lòng điền thủ công." });
        }
      }
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ ok: false, error: String(error) });
    }
  })();
  return true;
});

// Function để điền form ChongLuaDao (chạy trong content script)
function fillChongLuaDaoForm(formData) {
  try {
    console.log('Filling ChongLuaDao form with data:', formData);
    
    // Đợi một chút để trang load hoàn toàn
    setTimeout(() => {
      // Điền URL trang cần báo cáo
      const urlField = document.querySelector('input[placeholder*="Trang cần báo cáo"], input[name*="url"], input[type="url"]');
      if (urlField) {
        urlField.value = formData.url;
        urlField.dispatchEvent(new Event('input', { bubbles: true }));
        urlField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('URL field filled:', formData.url);
      }
      
      // Điền thể loại
      const categorySelect = document.querySelector('select, select[name*="category"], .select');
      if (categorySelect) {
        // Tìm option phù hợp
        const options = categorySelect.querySelectorAll('option');
        for (const option of options) {
          if (option.textContent.includes(formData.category) || 
              option.value.includes(formData.category.toLowerCase().replace(/\s+/g, ''))) {
            categorySelect.value = option.value;
            categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Category selected:', formData.category);
            break;
          }
        }
      }
      
      // Điền bằng chứng
      const evidenceField = document.querySelector('textarea[placeholder*="Cung cấp bằng chứng"], textarea[name*="evidence"], textarea[rows]');
      if (evidenceField) {
        evidenceField.value = formData.evidence;
        evidenceField.dispatchEvent(new Event('input', { bubbles: true }));
        evidenceField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Evidence field filled');
      }
      
      // Điền email (nếu có trong formData)
      if (formData.email) {
        const emailField = document.querySelector('input[type="email"], input[placeholder*="Email"], input[name*="email"]');
        if (emailField) {
          emailField.value = formData.email;
          emailField.dispatchEvent(new Event('input', { bubbles: true }));
          emailField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Email field filled');
        }
      }
      
      // Thêm thông tin về 2 ảnh chính vào phần bằng chứng
      if (formData.images && (formData.images.fullPage || formData.images.annotated)) {
        let imageInfo = '\n\nHÌNH ẢNH BẰNG CHỨNG:';
        
        // Ưu tiên ảnh toàn trang và ảnh phân tích (2 ảnh quan trọng nhất)
        if (formData.images.fullPage) {
          imageInfo += `\n• Ảnh toàn trang: ${formData.images.fullPage}`;
        }
        if (formData.images.annotated) {
          imageInfo += `\n• Ảnh có chú thích phân tích: ${formData.images.annotated}`;
        }
        
        if (evidenceField) {
          evidenceField.value += imageInfo;
          evidenceField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      // Hiển thị thông báo thành công với thông tin ảnh chính
      const mainImages = [formData.images?.fullPage, formData.images?.annotated].filter(Boolean);
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 340px;">
          <strong>✅ ChongLuaDao Extension</strong><br>
          Đã điền form với bằng chứng cụ thể!<br>
          <small>📷 Gửi kèm ${mainImages.length} ảnh bằng chứng chính</small><br>
          <small>🔍 Bằng chứng chi tiết đã được trích xuất</small><br>
          <small>Kiểm tra và submit khi sẵn sàng</small>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Tự động ẩn thông báo sau 5 giây
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
      
      console.log('Form filling completed');
      
    }, 1000); // Đợi 1 giây
    
  } catch (error) {
    console.error('Error filling form:', error);
    
    // Hiển thị thông báo lỗi
    const errorNotification = document.createElement('div');
    errorNotification.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px;">
        <strong>❌ ChongLuaDao Extension</strong><br>
        Không thể điền form tự động<br>
        <small>Vui lòng điền thủ công</small>
      </div>
    `;
    document.body.appendChild(errorNotification);
    
    setTimeout(() => {
      if (errorNotification.parentNode) {
        errorNotification.parentNode.removeChild(errorNotification);
      }
    }, 5000);
  }
}

// ============== PHÁT HIỆN CÁC CHIÊU TRÒ LỪA ĐẢO NÂNG CAO ==============

// Phát hiện quảng cáo mạo danh người nổi tiếng
function detectCelebrityFraud(evidenceText, summary) {
  const allText = `${evidenceText} ${summary}`.toLowerCase();
  
  // Danh sách người nổi tiếng VN thường bị mạo danh
  const celebrities = [
    'shark bình', 'shark linh', 'shark thủy', 'shark hưng', 'shark thuỷ',
    'hoài linh', 'trấn thành', 'hariwon', 'đàm vĩnh hưng', 'mr. đàm',
    'sơn tùng', 'đen vâu', 'jack', 'k-icm', 'hieuthuhai',
    'thủy tiên', 'công vinh', 'việt hương', 'lê giang',
    'hồ ngọc hà', 'thanh hà', 'mỹ tâm', 'đông nhi', 'hari won',
    'quang linh', 'khá bảnh', 'độ mixi', 'pewpew', 'xemesis',
    'ngọc trinh', 'chi pu', 'sơn tùng mtp', 'đức phúc', 'erik',
    'karik', 'binz', 'wowy', 'rhymastic', 'suboi',
    'bích phương', 'min', 'tóc tiên', 'isaac', 'gil lê',
    'trường giang', 'nhã phương', 'lan ngọc', 'ninh dương lan ngọc',
    'ngô kiến huy', 'jun phạm', 'sam', 'trịnh thăng bình', 'lê dương bảo lâm',
    'trường thế vinh', 'ngọc phước', 'duy khánh', 'huỳnh phương', 'thái vũ'
  ];
  
  // Từ khóa quảng cáo mạo danh
  const fraudKeywords = [
    'khuyên dùng', 'sử dụng', 'đầu tư', 'kiếm tiền', 'bí quyết',
    'chia sẻ', 'tiết lộ', 'bật mí', 'gợi ý', 'khuyến nghị', 
    'chứng thực', 'xác nhận', 'cam kết', 'đảm bảo',
    'thu nhập khủng', 'lợi nhuận cao', 'siêu lợi nhuận',
    'bảo hiểm lợi nhuận', 'cam kết hoàn tiền', 'đa cấp',
    'kiếm tiền nhanh', 'việc nhẹ lương cao', 'thu nhập ổn định',
    'không cần vốn', 'không cần kinh nghiệm', 'ai cũng làm được',
    'thành công 100%', 'bảo đảm thắng', 'không lo thua lỗ'
  ];
  
  for (const celebrity of celebrities) {
    if (allText.includes(celebrity)) {
      for (const keyword of fraudKeywords) {
        if (allText.includes(keyword)) {
          return `Sử dụng hình ảnh và tên tuổi người nổi tiếng "${celebrity}" để quảng cáo sản phẩm không rõ nguồn gốc`;
        }
      }
    }
  }
  
  // Phát hiện pattern chung về celebrity endorsement
  if (allText.match(/(shark|người nổi tiếng|mc|ca sĩ|diễn viên|youtuber|tiktoker|streamer|kol|idol).*?(khuyên|dùng|đầu tư|kiếm tiền|bảo đảm|cam kết|chia sẻ|tiết lộ)/)) {
    return "Mạo danh người nổi tiếng để tăng độ tin cậy và lừa đảo người dùng";
  }
  
  return null;
}

// Phát hiện quảng cáo rút tiền thành công giả
function detectFakeSuccessStories(evidenceText, findings) {
  const allText = `${evidenceText} ${findings.join(' ')}`.toLowerCase();
  
  // Pattern rút tiền thành công
  const successPatterns = [
    /rút.*?(\d+).*?(triệu|nghìn|k|tr)/,
    /kiếm.*?(\d+).*?(triệu|nghìn|k|tr).*?(ngày|tuần|tháng)/,
    /thu.*?(\d+).*?(triệu|nghìn|k|tr)/,
    /lãi.*?(\d+).*?(triệu|nghìn|k|tr)/,
    /thành công.*?rút.*?(\d+)/,
    /đã.*?nhận.*?(\d+).*?(triệu|nghìn)/,
    /nhận.*?(\d+).*?(triệu|nghìn|k|tr).*?(hôm nay|tuần này|tháng này)/,
    /đầu tư.*?(\d+).*?(triệu|nghìn|k|tr).*?(lãi|lời)/,
    /chốt.*?(\d+).*?(triệu|nghìn|k|tr).*?(lệnh|phiên)/
  ];
  
  const testimonialKeywords = [
    'chị mai', 'anh nam', 'chị hoa', 'anh tuấn', 'chị lan',
    'bà nga', 'cô linh', 'thầy minh', 'chú hùng', 'em trang',
    'khách hàng', 'thành viên', 'user', 'trader', 'nhà đầu tư',
    'anh thắng', 'chị thảo', 'anh phong', 'chị ngọc', 'anh quân',
    'chị hương', 'anh dũng', 'chị linh', 'anh minh', 'chị hà',
    'người chơi', 'thành viên vip', 'cao thủ', 'chuyên gia', 'người thắng lớn'
  ];
  
  let hasSuccessPattern = false;
  let hasTestimonial = false;
  
  // Kiểm tra pattern số tiền
  for (const pattern of successPatterns) {
    if (allText.match(pattern)) {
      hasSuccessPattern = true;
      break;
    }
  }
  
  // Kiểm tra testimonial
  for (const keyword of testimonialKeywords) {
    if (allText.includes(keyword)) {
      hasTestimonial = true;
      break;
    }
  }
  
  if (hasSuccessPattern && hasTestimonial) {
    return "Sử dụng câu chuyện rút tiền thành công giả mạo với số tiền lớn để tạo lòng tin";
  }
  
  if (hasSuccessPattern) {
    return "Quảng cáo số tiền kiếm được/rút được bất thường để thu hút người dùng";
  }
  
  // Pattern screenshot bank/ví điện tử
  if (allText.match(/(screenshot|ảnh chụp|hình.*?(chuyển khoản|rút tiền|số dư)|bank.*?statement)/)) {
    return "Hiển thị ảnh chụp màn hình giao dịch/số dư có thể bị chỉnh sửa để làm bằng chứng giả";
  }
  
  return null;
}

// Phát hiện mạo danh báo chí và truyền thông
function detectFakeNewsEndorsements(evidenceText, summary) {
  const allText = `${evidenceText} ${summary}`.toLowerCase();
  
  // Danh sách báo chí VN thường bị mạo danh
  const newsOutlets = [
    'vtv', 'vtc', 'vtv1', 'vtv3', 'vtv9',
    'vnexpress', 'vne', 'tuổi trẻ', 'tuoi tre', 'thanh niên', 'thanh nien',
    'dân trí', 'dan tri', 'vietnamnet', 'vietnam net', 'zing news', 'zing',
    'kenh14', 'kênh 14', 'báo mới', 'bao moi', 'news', 'tin tức',
    'café land', 'cafeland', 'eva', 'afamily', 'doisongphapluat',
    'người lao động', 'nguoi lao dong', 'lao động', 'lao dong',
    'infonet', 'info net', 'soha', 'genk', 'tinhte', 'tinhte.vn'
  ];
  
  // Từ khóa đưa tin
  const newsKeywords = [
    'đưa tin', 'báo cáo', 'thông tin', 'xác nhận', 'phản ánh',
    'tiết lộ', 'bộc bạch', 'chia sẻ', 'phỏng vấn', 'tường thuật',
    'điều tra', 'khám phá', 'phát hiện', 'bất ngờ'
  ];
  
  // Kiểm tra mạo danh báo chí
  for (const outlet of newsOutlets) {
    if (allText.includes(outlet)) {
      for (const keyword of newsKeywords) {
        if (allText.includes(keyword)) {
          return `Mạo danh báo chí "${outlet}" để tăng độ tin cậy và uy tín cho sản phẩm/dịch vụ`;
        }
      }
    }
  }
  
  // Pattern chung về tin tức giả
  if (allText.match(/(báo.*?(đưa tin|xác nhận)|truyền hình.*?(phỏng vấn|báo cáo)|được.*?báo chí.*?(ghi nhận|đề cập))/)) {
    return "Giả mạo việc được báo chí đưa tin hoặc truyền thông xác nhận để tăng uy tín";
  }
  
  // Logo báo chí giả
  if (allText.match(/(logo.*?(vtv|vnexpress|tuoi tre)|có.*?mặt.*?(báo|truyền hình))/)) {
    return "Sử dụng logo hoặc biểu tượng của các cơ quan báo chí để tạo vẻ chính thống";
  }
  
  return null;
}

// Nâng cấp extractBehaviorEvidence để bao gồm các chiêu trò mới
function extractAdvancedFraudEvidence(findings, evidenceText, summary) {
  const evidence = [];
  
  // 1. Phát hiện mạo danh người nổi tiếng
  const celebrityFraud = detectCelebrityFraud(evidenceText, summary);
  if (celebrityFraud) {
    evidence.push(celebrityFraud);
  }
  
  // 2. Phát hiện câu chuyện thành công giả
  const fakeSuccess = detectFakeSuccessStories(evidenceText, findings);
  if (fakeSuccess) {
    evidence.push(fakeSuccess);
  }
  
  // 3. Phát hiện mạo danh báo chí
  const fakeNews = detectFakeNewsEndorsements(evidenceText, summary);
  if (fakeNews) {
    evidence.push(fakeNews);
  }
  
  // 4. Phát hiện các chiêu trò khác
  const allText = `${evidenceText} ${findings.join(' ')} ${summary}`.toLowerCase();
  
  // Giả mạo chứng chỉ/giải thưởng
  if (allText.match(/(chứng nhận|giấy phép|iso|fda|gmp|haccp|halal|ce|who|bộ y tế|bộ công thương|giải thưởng|top|best|award|được.*?công nhận|xác nhận|chứng thực)/)) {
    evidence.push("Tự xưng có chứng nhận/giải thưởng quốc tế không rõ nguồn gốc, không thể xác minh được tính xác thực và không có thông tin chi tiết về đơn vị cấp phép");
  }
  
  // Áp lực thời gian và số lượng
  if (allText.match(/(chỉ còn|còn lại|sắp hết|sắp kết thúc|giới hạn|có hạn|nhanh tay|tranh thủ|duy nhất|cuối cùng|chớp ngay|nhanh chân|số lượng có hạn|chỉ.*?(ngày|giờ|phút)|khuyến mãi.*?hết.*?hạn|sale.*?sốc|giảm giá.*?cuối)/)) {
    evidence.push("Tạo áp lực tâm lý bằng các chiêu trò như: countdown giả, thông báo sắp hết hàng, khuyến mãi có thời hạn, số lượng giới hạn để thúc đẩy người dùng ra quyết định nhanh mà không cân nhắc kỹ");
  }
  
  // Số lượng giả mạo
  if (allText.match(/(hơn.*?\d+.*?(triệu|nghìn).*?người.*?sử dụng|đã.*?bán.*?\d+.*?(triệu|nghìn).*?sản phẩm|khách hàng.*?hài lòng|đánh giá.*?sao|review.*?tốt|lượt mua|lượt đánh giá|lượt theo dõi|lượt xem|lượt tương tác)/)) {
    evidence.push("Đưa ra các con số thống kê người dùng/doanh số và đánh giá không có nguồn xác thực, có dấu hiệu mua đánh giá ảo, tương tác ảo");
  }

  // Giả mạo địa chỉ và thông tin liên hệ
  if (allText.match(/(văn phòng|chi nhánh|showroom|cửa hàng|địa chỉ|trụ sở|công ty|doanh nghiệp|nhà máy|xưởng sản xuất).*?(quận|phường|đường|số|tỉnh|thành phố)/)) {
    evidence.push("Đưa ra địa chỉ văn phòng/cửa hàng/nhà máy không có thật hoặc mượn địa chỉ của đơn vị khác để tạo uy tín, không có giấy phép kinh doanh tại địa chỉ được nêu");
  }

  // Chiêu trò về giá và khuyến mãi 
  if (allText.match(/(giá gốc|giá thị trường|giá công ty|chiết khấu|ưu đãi|khuyến mãi|giảm.*?%|tặng|free|miễn phí|mua 1 tặng 1|combo|deal shock|flash sale|siêu sale|sale sốc|giá hủy diệt)/)) {
    evidence.push("Sử dụng các chiêu trò về giá như: Nâng giá gốc ảo để đánh lừa về mức giảm giá, khuyến mãi ảo, quà tặng không có thật, tạo cảm giác khan hiếm và giá trị cao");
  }

  // Lợi dụng tâm lý người dùng
  if (allText.match(/(không còn lo|hết đau đầu|giải quyết|cam kết|bảo hành|hoàn tiền|đổi trả|không hiệu quả|trả lại tiền|100%|bảo đảm|chắc chắn|tuyệt đối|vĩnh viễn|trọn đời)/)) {
    evidence.push("Lợi dụng tâm lý người dùng bằng các cam kết/bảo đảm mơ hồ, hứa hẹn quá mức về hiệu quả, không rõ ràng về điều kiện và quy trình thực hiện");
  }

  // Mạo danh thương hiệu
  if (allText.match(/(chính hãng|authentic|auth|xuất xứ|nhập khẩu|phân phối|độc quyền|uỷ quyền|đại lý|nhà phân phối|thương hiệu|brand|made in|sản xuất tại|xuất xứ từ|hàng ngoại|hàng hiệu)/)) {
    evidence.push("Mạo danh là đại lý/nhà phân phối chính hãng của các thương hiệu lớn mà không có giấy tờ chứng minh, giả mạo xuất xứ sản phẩm");
  }

  // Lợi dụng tin tức và sự kiện
  if (allText.match(/(hot|trending|viral|xu hướng|thịnh hành|được ưa chuộng|được săn lùng|cháy hàng|best seller|bán chạy|hot hit|đình đám|gây sốt|làm mưa làm gió|phủ sóng)/)) {
    evidence.push("Tạo hiệu ứng đám đông giả bằng cách nói sản phẩm/dịch vụ đang viral, được nhiều người quan tâm, tạo cảm giác sợ bỏ lỡ (FOMO)");
  }

}
