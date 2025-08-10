const $ = (s) => document.querySelector(s);

function setStatus(message, type = "info") {
  const statusEl = $("#status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

// Load saved settings
(async function init() {
  try {
    setStatus("🔄 Đang tải cấu hình...", "loading");
    
    const { 
      geminiApiKey, 
      geminiModel, 
      geminiEndpointBase, 
      apiHeaders 
    } = await chrome.storage.sync.get([
      "geminiApiKey",
      "geminiModel", 
      "geminiEndpointBase",
      "apiHeaders"
    ]);

    if (geminiApiKey) $("#geminiApiKey").value = geminiApiKey;
    if (geminiModel) $("#geminiModel").value = geminiModel;
    if (geminiEndpointBase) $("#geminiEndpointBase").value = geminiEndpointBase;
    
    if (apiHeaders) {
      $("#apiHeaders").value = JSON.stringify(apiHeaders, null, 2);
    }

    setStatus("✅ Đã tải cấu hình", "success");
  } catch (error) {
    setStatus(`❌ Lỗi tải cấu hình: ${error.message}`, "error");
  }
})();

// Save settings
$("#save").addEventListener("click", async () => {
  try {
    setStatus("💾 Đang lưu cấu hình...", "loading");

    // Validate API key
    const geminiApiKey = $("#geminiApiKey").value.trim();
    if (!geminiApiKey) {
      throw new Error("Vui lòng nhập Gemini API Key");
    }

    if (!geminiApiKey.startsWith("AIza")) {
      throw new Error("API Key phải bắt đầu bằng 'AIza'");
    }

    // Parse API headers
    let apiHeaders = {};
    const headersText = $("#apiHeaders").value.trim();
    if (headersText) {
      try {
        apiHeaders = JSON.parse(headersText);
        if (typeof apiHeaders !== "object" || Array.isArray(apiHeaders)) {
          throw new Error("Headers phải là object JSON");
        }
      } catch (e) {
        throw new Error("JSON headers không hợp lệ: " + e.message);
      }
    }

    // Get other values
    const geminiModel = $("#geminiModel").value.trim() || "gemini-2.0-flash";
    const geminiEndpointBase = $("#geminiEndpointBase").value.trim() || 
                               "https://generativelanguage.googleapis.com";

    // Validate endpoint URL
    try {
      new URL(geminiEndpointBase);
    } catch {
      throw new Error("Endpoint URL không hợp lệ");
    }

    // Save to storage
    await chrome.storage.sync.set({ 
      geminiApiKey, 
      geminiModel, 
      geminiEndpointBase, 
      apiHeaders 
    });

    setStatus("✅ Đã lưu cấu hình thành công!", "success");
    
  } catch (error) {
    setStatus(`❌ Lỗi: ${error.message}`, "error");
  }
});

// Test API connection
$("#test").addEventListener("click", async () => {
  try {
    setStatus("🧪 Đang kiểm tra kết nối API...", "loading");

    const geminiApiKey = $("#geminiApiKey").value.trim();
    if (!geminiApiKey) {
      throw new Error("Vui lòng nhập API Key trước khi test");
    }

    const geminiModel = $("#geminiModel").value.trim() || "gemini-2.0-flash";
    const geminiEndpointBase = $("#geminiEndpointBase").value.trim() || 
                               "https://generativelanguage.googleapis.com";

    // Create test endpoint
    const testEndpoint = 
      `${geminiEndpointBase}/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

    // Simple test request
    const testBody = {
      contents: [{
        role: "user",
        parts: [{ text: "Xin chào! Đây là test kết nối API." }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50
      }
    };

    const response = await fetch(testEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      setStatus("✅ API hoạt động tốt! Kết nối thành công.", "success");
    } else {
      setStatus("⚠️ API phản hồi nhưng format không đúng", "warning");
    }

  } catch (error) {
    if (error.message.includes("403")) {
      setStatus("❌ API Key không hợp lệ hoặc hết quota", "error");
    } else if (error.message.includes("404")) {
      setStatus("❌ Model không tồn tại hoặc endpoint sai", "error");
    } else {
      setStatus(`❌ Lỗi test API: ${error.message}`, "error");
    }
  }
});

// Toggle password visibility
$("#geminiApiKey").addEventListener("focus", function() {
  this.type = "text";
});

$("#geminiApiKey").addEventListener("blur", function() {
  this.type = "password";
});
