// background.js
console.log("Background script loaded");

// ===== Helpers =====
const API_UPLOAD = "https://chongluadao.vn/api/upload-image";

const nowIso = () => new Date().toISOString();
const dataUrlToBase64 = (d) => d.split(",")[1];

// Nén ảnh để tránh lỗi 413 (Payload Too Large)
async function compressImage(dataUrl, maxWidth = 1200, quality = 0.7) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  
  // Tính toán kích thước mới
  let { width, height } = bitmap;
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
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

// Tạo báo cáo mẫu để copy
function generateReportText(aiData, urls) {
  const riskLevel = aiData.risk || 0;
  let riskText = "🟢 An toàn";
  if (riskLevel >= 8) riskText = "🔴 Cực kỳ nguy hiểm";
  else if (riskLevel >= 6) riskText = "🟠 Nguy hiểm cao"; 
  else if (riskLevel >= 3) riskText = "🟡 Cần thận trọng";

  const findings = (aiData.findings || []).map(f => `• ${f}`).join('\n');
  const timestamp = new Date().toLocaleString('vi-VN');
  
  return `🚨 BÁO CÁO PHÁT HIỆN LỪA ĐẢO

📋 TÓM TẮT: ${aiData.summary || 'Có vẻ nguy hiểm'}
⚠️ MỨC RỦI RO: ${riskLevel}/10 - ${riskText}
🌐 URL: ${aiData.url || ''}

🔍 CÁC DẤU HIỆU PHÁT HIỆN:
${findings || '• Không có dấu hiệu cụ thể'}

📝 BẰNG CHỨNG CHI TIẾT:
${aiData.evidence_text || 'Cần kiểm tra thêm'}

📸 HÌNH ẢNH BẰNG CHỨNG:
• Ảnh gốc: ${urls.original || 'Lỗi upload'}
• Ảnh phân tích: ${urls.annotated || 'Lỗi upload'}

⏰ THỜI GIAN PHÂN TÍCH: ${timestamp}
🤖 PHÂN TÍCH BỞI: ChongLuaDao AI Evidence v1.0

---
⚠️ LƯU Ý: Báo cáo này được tạo tự động bởi AI. Hãy thận trọng và kiểm tra kỹ trước khi thực hiện giao dịch.
🛡️ Bảo vệ bản thân khỏi lừa đảo: https://chongluadao.vn`;
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

// Lấy ngữ cảnh trang (để gửi kèm cho Gemini)
async function getPageContext(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const html = document.documentElement.outerHTML.slice(0, 600000);
      const text = (document.body?.innerText || "").slice(0, 6000);
      return {
        url: location.href,
        domain: location.hostname,
        title: document.title,
        html_snippet: html,
        page_text: text,
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
        dpr: devicePixelRatio || 1,
        viewport: { w: innerWidth, h: innerHeight, sx: scrollX, sy: scrollY }
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

  // 3 phát hiện đầu
  const findings = (report.findings || []).slice(0, 3);
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

// Lưu lịch sử (tối đa 300 entries)
async function pushHistory(entry) {
  const KEY = "analysis_history";
  const { [KEY]: list = [] } = await chrome.storage.local.get([KEY]);
  list.unshift(entry);
  await chrome.storage.local.set({ [KEY]: list.slice(0, 300) });
}

// ===== Gemini (Google Generative Language API) =====
function buildGeminiPrompt(context) {
  return `
Bạn là hệ thống phân tích lừa đảo web/app chuyên nghiệp. Hãy đọc hình chụp màn hình và ngữ cảnh trang để đánh giá rủi ro và nêu bằng chứng chi tiết.

YÊU CẦU:
- Trả về JSON **duy nhất**, không giải thích thêm.
- JSON schema chính xác:

{
  "risk": <number from 0..10>,
  "summary": <string ngắn gọn, ví dụ "Trang lừa đảo nguy hiểm">,
  "findings": [
    <mảng string: các dấu hiệu lừa đảo cụ thể, tối đa 12 mục, tiếng Việt>
  ],
  "evidence_text": <string: mô tả bằng chứng chính>,
  "boxes": [
    { "x": <number>, "y": <number>, "w": <number>, "h": <number>, "label": <string>, "score": <0..1> }
  ]
}

HƯỚNG DẪN CHẤM ĐIỂM RỦI RO:
- 0–2: hoàn toàn an toàn, trang chính thống
- 3–5: có một số rủi ro nhỏ, cần thận trọng  
- 6–8: đáng ngờ cao, nhiều dấu hiệu lừa đảo
- 9–10: cực kỳ nguy hiểm, chắc chắn lừa đảo

CÁC DẤU HIỆU LỪA ĐẢO CẦN TÌM:
1. Cờ bạc/cá cược trái phép, casino online
2. Ví tiền điện tử/app đầu tư lạ không rõ nguồn gốc
3. Form thu thập thông tin nhạy cảm (OTP/mật khẩu/PIN/số thẻ)
4. Mạo danh ngân hàng, sàn TMDT, cơ quan chính phủ
5. Yêu cầu "xác minh tài khoản", "cập nhật thông tin"
6. Khuyến mãi/quà tặng quá hấp dẫn, "nhận thưởng ngay"
7. Script theo dõi/mã độc, code obfuscation (AES, base64)
8. Redirect tải app từ nguồn không an toàn
9. Thu thập IP/fingerprint qua bên thứ ba
10. Ngôn ngữ tạo FOMO, hứa hẹn lãi suất cao bất thường
11. Domain giả mạo, URL đáng ngờ
12. Thiếu thông tin pháp lý, chứng nhận

BỐI CẢNH TRANG:
URL: ${context.url}
Domain: ${context.domain}
Tiêu đề: ${context.title}
User-Agent: ${context.ua}
Viewport: ${context.viewport?.w}x${context.viewport?.h}

NỘI DUNG TEXT TRANG:
${(context.page_text || "").slice(0, 2500)}

TRÍCH ĐOẠN HTML:
${(context.html_snippet || "").slice(0, 5000)}

Hãy phân tích kỹ lưỡng và chỉ trả về JSON hợp lệ theo schema trên.`;
}

async function callGemini({ apiKey, model, imageBase64, context, endpointBase }) {
  const endpoint =
    (endpointBase || "https://generativelanguage.googleapis.com") +
    `/v1beta/models/${encodeURIComponent(model || "gemini-2.0-flash")}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{
      role: "user",
      parts: [
        { text: buildGeminiPrompt(context) },
        { inlineData: { mimeType: "image/png", data: imageBase64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1500,
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
  report.evidence_text = report.evidence_text || "";
  report.boxes = Array.isArray(report.boxes) ? report.boxes : [];

  return report;
}

// ===== Message router =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "RUN_CAPTURE_AND_ANALYZE") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tab.id;

        const { apiHeaders = {}, geminiApiKey, geminiModel, geminiEndpointBase } =
          await chrome.storage.sync.get(["apiHeaders", "geminiApiKey", "geminiModel", "geminiEndpointBase"]);

        if (!geminiApiKey) throw new Error("Chưa cấu hình Gemini API Key trong Options.");

        // 1) Lấy context và chụp màn hình
        const ctx = await getPageContext(tabId);
        const shotDataUrl = await captureVisible();
        const shotBase64 = dataUrlToBase64(shotDataUrl);

        // 2) Gọi Gemini phân tích
        let aiReport = await callGemini({
          apiKey: geminiApiKey,
          model: geminiModel || "gemini-2.0-flash",
          imageBase64: shotBase64,
          context: ctx,
          endpointBase: geminiEndpointBase
        });

        // 3) Bổ sung thông tin
        aiReport.url = ctx.url;
        aiReport.capturedAt = nowIso();

        // 4) Nén và upload ảnh gốc
        const compressedOriginal = await compressImage(shotDataUrl, 1200, 0.8);
        const upOriginal = await uploadImageJSON({
          base64: compressedOriginal,
          filename: `evidence_${Date.now()}.jpg`,
          headers: apiHeaders
        }).catch(e => ({ success: false, error: String(e) }));

        // 5) Vẽ chú thích và upload ảnh có chú thích  
        const annotatedB64 = await annotateWithAI(shotDataUrl, aiReport);
        const upAnnotated = await uploadImageJSON({
          base64: annotatedB64,
          filename: `evidence_annotated_${Date.now()}.jpg`,
          headers: apiHeaders
        }).catch(e => ({ success: false, error: String(e) }));

        // 6) Tạo báo cáo cuối cùng
        const uploadUrls = {
          original: upOriginal.success ? upOriginal.link : upOriginal.error,
          annotated: upAnnotated.success ? upAnnotated.link : upAnnotated.error
        };
        
        const reportText = generateReportText(aiReport, uploadUrls);
        
        const report = {
          url: ctx.url,
          time: aiReport.capturedAt,
          ai: aiReport,
          uploads: { original: upOriginal, annotated: upAnnotated },
          reportText: reportText
        };

        // 7) Lưu vào lịch sử
        await pushHistory(report);
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
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ ok: false, error: String(error) });
    }
  })();
  return true;
});
