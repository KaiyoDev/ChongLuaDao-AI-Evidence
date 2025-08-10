const $ = (s) => document.querySelector(s);

// Utility functions
function formatRiskLevel(risk) {
  if (risk <= 2) return { text: "An toàn", color: "#22c55e" };
  if (risk <= 5) return { text: "Thận trọng", color: "#f59e0b" };
  if (risk <= 8) return { text: "Nguy hiểm", color: "#ef4444" };
  return { text: "Cực nguy hiểm", color: "#dc2626" };
}

function setStatus(message, type = "info") {
  const statusEl = $("#status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function showResult(data) {
  $("#result").hidden = false;
  $("#historyList").hidden = true;
  $("#resultData").textContent = JSON.stringify(data, null, 2);
}

function showHistory(data) {
  $("#historyList").hidden = false;
  $("#result").hidden = true;
  $("#historyData").textContent = JSON.stringify(data, null, 2);
}

// Main analysis function
$("#run").addEventListener("click", async () => {
  try {
    setStatus("🔄 Đang chụp màn hình và phân tích...", "loading");
    $("#result").hidden = true;
    $("#historyList").hidden = true;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({ 
      type: "RUN_CAPTURE_AND_ANALYZE", 
      tabId: tab.id 
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Phân tích thất bại");
    }

    const report = response.report;
    const aiData = report.ai || {};
    
    // Hiển thị báo cáo text đẹp thay vì JSON
    const reportText = report.reportText || "Không có báo cáo";
    currentReportText = reportText; // Lưu để copy sau
    
    // Format display data cho JSON view (backup)
    const riskInfo = formatRiskLevel(aiData.risk || 0);
    const displayData = {
      "🔍 Tóm tắt": aiData.summary || "Không xác định",
      "⚠️ Mức rủi ro": `${aiData.risk || 0}/10 - ${riskInfo.text}`,
      "📝 Bằng chứng": aiData.evidence_text || "Không có",
      "🔎 Phát hiện": aiData.findings || [],
      "🌐 URL": report.url || "",
      "⏰ Thời gian": new Date(report.time).toLocaleString("vi-VN"),
      "📤 Upload": {
        "Ảnh gốc": report.uploads?.original?.link || "Lỗi upload",
        "Ảnh chú thích": report.uploads?.annotated?.link || "Lỗi upload"
      }
    };

    // Hiển thị báo cáo text đẹp
    $("#result").hidden = false;
    $("#historyList").hidden = true;
    $("#resultData").textContent = reportText;
    
    setStatus("✅ Hoàn thành! Báo cáo đã được copy vào clipboard.", "success");

    // Copy báo cáo đẹp vào clipboard
    try {
      await navigator.clipboard.writeText(reportText);
    } catch (e) {
      console.log("Không thể copy vào clipboard:", e);
      // Fallback: copy JSON data
      try {
        await navigator.clipboard.writeText(JSON.stringify(displayData, null, 2));
      } catch (e2) {
        console.log("Fallback copy cũng thất bại:", e2);
      }
    }

  } catch (error) {
    setStatus(`❌ Lỗi: ${error.message}`, "error");
    console.error("Analysis error:", error);
  }
});

// History functions
$("#history").addEventListener("click", async () => {
  try {
    setStatus("📋 Đang tải lịch sử...", "loading");
    
    const response = await chrome.runtime.sendMessage({ type: "GET_HISTORY" });
    
    if (!response?.ok) {
      throw new Error("Không thể đọc lịch sử");
    }

    const history = response.history || [];
    
    if (history.length === 0) {
      setStatus("📋 Lịch sử trống", "info");
      return;
    }

    // Format history for display
    const formattedHistory = history.map((item, index) => {
      const riskInfo = formatRiskLevel(item.ai?.risk || 0);
      return {
        "#": index + 1,
        "URL": item.url || "",
        "Thời gian": new Date(item.time).toLocaleString("vi-VN"),
        "Rủi ro": `${item.ai?.risk || 0}/10 - ${riskInfo.text}`,
        "Tóm tắt": item.ai?.summary || "",
        "Phát hiện": (item.ai?.findings || []).slice(0, 3),
        "Ảnh chú thích": item.uploads?.annotated?.link || ""
      };
    });

    showHistory(formattedHistory);
    setStatus(`📋 Hiển thị ${history.length} bản ghi lịch sử`, "success");

  } catch (error) {
    setStatus(`❌ Lỗi tải lịch sử: ${error.message}`, "error");
  }
});

$("#clear").addEventListener("click", async () => {
  try {
    if (!confirm("Bạn có chắc muốn xoá toàn bộ lịch sử phân tích?")) {
      return;
    }

    setStatus("🗑️ Đang xoá lịch sử...", "loading");
    
    await chrome.runtime.sendMessage({ type: "CLEAR_HISTORY" });
    
    $("#historyList").hidden = true;
    $("#result").hidden = true;
    setStatus("✅ Đã xoá toàn bộ lịch sử", "success");

  } catch (error) {
    setStatus(`❌ Lỗi xoá lịch sử: ${error.message}`, "error");
  }
});

// Copy report function
let currentReportText = "";

$("#copyReport").addEventListener("click", async () => {
  if (!currentReportText) {
    setStatus("❌ Không có báo cáo để copy", "error");
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentReportText);
    setStatus("✅ Đã copy báo cáo vào clipboard!", "success");
  } catch (error) {
    setStatus("❌ Không thể copy báo cáo", "error");
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setStatus("🛡️ Sẵn sàng phân tích lừa đảo", "info");
});
