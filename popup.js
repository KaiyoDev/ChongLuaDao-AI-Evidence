const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';

function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeIcon = $('.theme-icon');
  themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
  const toastContainer = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
}

// Progress Tracking System
let currentStep = 0;
const totalSteps = 4;

function showProgress() {
  $('#progressSection').hidden = false;
  $('#result').hidden = true;
  $('#historyList').hidden = true;
  updateProgress(0, 'Đang khởi tạo...');
}

function updateProgress(step, message) {
  currentStep = step;
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const steps = $$('.step');
  
  // Update progress bar
  const percentage = (step / totalSteps) * 100;
  progressFill.style.width = `${percentage}%`;
  
  // Update progress text
  progressText.textContent = message;
  
  // Update step indicators
  steps.forEach((stepEl, index) => {
    const stepNum = index + 1;
    stepEl.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      stepEl.classList.add('completed');
    } else if (stepNum === currentStep) {
      stepEl.classList.add('active');
    }
  });
}

function hideProgress() {
  $('#progressSection').hidden = true;
}

// Enhanced Status System
function setStatus(message, type = "info") {
  const statusEl = $("#status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;
}

function hideStatus() {
  $("#status").hidden = true;
}

// Utility functions
function formatRiskLevel(risk) {
  if (risk <= 2) return { text: "An toàn", color: "#22c55e", icon: "🟢" };
  if (risk <= 5) return { text: "Thận trọng", color: "#f59e0b", icon: "🟡" };
  if (risk <= 8) return { text: "Nguy hiểm", color: "#ef4444", icon: "🔴" };
  return { text: "Cực nguy hiểm", color: "#dc2626", icon: "🚨" };
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

// Enhanced Analysis Function
async function runAnalysis(mode = "FULL_PAGE") {
  try {
    // Disable buttons during analysis
    const buttons = $$('button');
    buttons.forEach(btn => btn.disabled = true);
    
    // Get current tab first to check URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Kiểm tra đặc biệt cho các trang chợ đen
    const url = tab.url.toLowerCase();
    let specialWarning = "";
    if (url.includes('tienban') || url.includes('chợ đen') || url.includes('ccv') || url.includes('dump')) {
      specialWarning = "🚨 CẢNH BÁO: Đây có thể là trang chợ đen bán hoạt động bất hợp pháp! ";
      showToast(specialWarning, 'error', 6000);
    }
    
    // Show progress
    showProgress();
    updateProgress(1, 'Đang chụp ảnh trang web...');
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({ 
      type: "RUN_CAPTURE_AND_ANALYZE", 
      tabId: tab.id,
      captureMode: mode
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Phân tích thất bại");
    }

    const report = response.report;
    const aiData = report.ai || {};
    
    // Update progress through steps
    updateProgress(2, 'AI đang phân tích dữ liệu...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateProgress(3, 'Đang vẽ bằng chứng...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateProgress(4, 'Đang upload ảnh...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hiển thị báo cáo text đẹp thay vì JSON
    const reportText = report.reportText || "Không có báo cáo";
    currentReportText = reportText; // Lưu để copy sau
    currentReportData = report; // Lưu để điền form
    
    // Format display data cho JSON view (backup)
    const riskInfo = formatRiskLevel(aiData.risk || 0);
    const displayData = {
      "🔍 Tóm tắt": aiData.summary || "Không xác định",
      "⚠️ Mức rủi ro": `${aiData.risk || 0}/10 - ${riskInfo.text}`,
      "📝 Bằng chứng chi tiết": aiData.evidence_text || "Không có",
      "⚙️ Phân tích kỹ thuật": aiData.technical_analysis || "Chưa có",
      "💡 Khuyến nghị": aiData.recommendation || "Cần thận trọng",
      "🔎 Các phát hiện": aiData.findings || [],
      "🌐 URL": report.url || "",
      "⏰ Thời gian": new Date(report.time).toLocaleString("vi-VN"),
      "📤 Upload": {
        "Ảnh viewport": report.uploads?.currentView?.link || "Lỗi upload",
        "Ảnh toàn trang": report.uploads?.fullPage?.link || "Lỗi upload",
        "Ảnh chú thích": report.uploads?.annotated?.link || "Lỗi upload"
      }
    };

    // Hide progress and show results
    hideProgress();
    
    // Hiển thị báo cáo text đẹp
    $("#result").hidden = false;
    $("#historyList").hidden = true;
    $("#resultData").textContent = reportText;
    
    // Show success toast
    showToast("✅ Phân tích hoàn thành! Báo cáo đã được tạo.", "success");
    
    // Re-enable buttons
    buttons.forEach(btn => btn.disabled = false);
    
  } catch (error) {
    console.error('Analysis error:', error);
    hideProgress();
    
    // Re-enable buttons
    const buttons = $$('button');
    buttons.forEach(btn => btn.disabled = false);
    
    showToast(`❌ Lỗi: ${error.message}`, 'error');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Theme toggle
  $('#themeToggle').addEventListener('click', toggleTheme);
  
  // Main analysis function (Full Page)
  $("#run").addEventListener("click", async () => {
    await runAnalysis("FULL_PAGE");
  });

  // Quick analysis function (Current View)
  $("#runQuick").addEventListener("click", async () => {
    await runAnalysis("QUICK");
  });

  // History management
  $("#history").addEventListener("click", async () => {
    try {
      // Open history page in new tab
      await chrome.tabs.create({ url: 'history.html' });
      showToast("📋 Đã mở trang lịch sử", "success");
    } catch (error) {
      showToast("❌ Lỗi khi mở trang lịch sử", "error");
    }
  });

  $("#clear").addEventListener("click", async () => {
    if (confirm("Bạn có chắc muốn xóa tất cả lịch sử phân tích?")) {
      try {
        await chrome.storage.local.remove(['analysisHistory']);
        showToast("🗑️ Đã xóa tất cả lịch sử", "success");
        $("#historyList").hidden = true;
      } catch (error) {
        showToast("❌ Lỗi khi xóa lịch sử", "error");
      }
    }
  });

  // Copy report
  $("#copyReport").addEventListener("click", async () => {
    try {
      if (currentReportText) {
        await navigator.clipboard.writeText(currentReportText);
        showToast("📋 Đã copy báo cáo vào clipboard", "success");
      } else {
        showToast("❌ Không có báo cáo để copy", "error");
      }
    } catch (error) {
      showToast("❌ Lỗi khi copy báo cáo", "error");
    }
  });

  // Fill form
  $("#fillForm").addEventListener("click", async () => {
    try {
      if (currentReportData) {
        // Open ChongLuaDao form
        const formUrl = "https://chongluadao.vn/report/reportphishing";
        await chrome.tabs.create({ url: formUrl });
        showToast("📝 Đã mở form ChongLuaDao", "success");
      } else {
        showToast("❌ Không có dữ liệu để điền form", "error");
      }
    } catch (error) {
      showToast("❌ Lỗi khi mở form", "error");
    }
  });

  // Export history
  $("#exportHistory").addEventListener("click", async () => {
    try {
      const history = await chrome.storage.local.get(['analysisHistory']);
      const historyData = history.analysisHistory || [];
      
      if (historyData.length === 0) {
        showToast("❌ Không có dữ liệu để xuất", "error");
        return;
      }
      
      const dataStr = JSON.stringify(historyData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chongluadao-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast("📤 Đã xuất dữ liệu lịch sử", "success");
    } catch (error) {
      showToast("❌ Lỗi khi xuất dữ liệu", "error");
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          runAnalysis("FULL_PAGE");
          break;
        case '2':
          e.preventDefault();
          runAnalysis("QUICK");
          break;
        case 'h':
          e.preventDefault();
          $("#history").click();
          break;
        case 'c':
          e.preventDefault();
          $("#copyReport").click();
          break;
      }
    }
  });
});

// Global variables for current report
let currentReportText = "";
let currentReportData = null;
