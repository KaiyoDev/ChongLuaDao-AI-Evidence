// Result Page JavaScript
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Global variables
let currentReportData = null;
let currentReportText = "";
let currentTheme = localStorage.getItem('theme') || 'light';

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeIcon = $('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }
}

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
  const container = $('#toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-icon">${typeIcons[type] || typeIcons.info}</span>
      <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove toast
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }
  }, duration);
}

// Utility functions
function formatRiskLevel(risk) {
  if (risk <= 2) return { text: "An toàn", color: "#22c55e", icon: "🟢", class: "low" };
  if (risk <= 5) return { text: "Thận trọng", color: "#f59e0b", icon: "🟡", class: "medium" };
  if (risk <= 8) return { text: "Nguy hiểm", color: "#ef4444", icon: "🔴", class: "high" };
  return { text: "Cực nguy hiểm", color: "#dc2626", icon: "🚨", class: "critical" };
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString("vi-VN", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Load report data from URL parameters or storage
async function loadReportData() {
  try {
    // Try to get data from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (reportId) {
      // Load from storage by ID
      const result = await chrome.storage.local.get(['analysis_history']);
      const history = result.analysis_history || [];
      const report = history.find((item, index) => index.toString() === reportId);
      
      if (report) {
        currentReportData = report;
        displayReport(report);
        return;
      }
    }
    
    // Try to get latest report
    const result = await chrome.storage.local.get(['latest_report']);
    if (result.latest_report) {
      currentReportData = result.latest_report;
      displayReport(result.latest_report);
    } else {
      showError("Không tìm thấy dữ liệu báo cáo");
    }
  } catch (error) {
    console.error('Error loading report data:', error);
    showError("Lỗi khi tải dữ liệu báo cáo");
  }
}

// Display report data
function displayReport(reportData) {
  const aiData = reportData.ai || {};
  
  // Update risk overview
  const riskInfo = formatRiskLevel(aiData.risk || 0);
  $('#riskIcon').textContent = riskInfo.icon;
  $('#riskLevel').textContent = `${aiData.risk || 0}/10`;
  $('#riskLabel').textContent = riskInfo.text;
  
  // Update meta info
  $('#analyzeUrl').textContent = reportData.url || 'Không có URL';
  $('#analyzeTime').textContent = formatDate(reportData.time);
  $('#findingsCount').textContent = `${(aiData.findings || []).length} dấu hiệu`;
  
  // Update content sections
  $('#summaryContent').textContent = aiData.summary || 'Không có tóm tắt';
  $('#evidenceContent').textContent = aiData.evidence_text || 'Không có bằng chứng chi tiết';
  $('#technicalContent').textContent = aiData.technical_analysis || 'Không có phân tích kỹ thuật';
  $('#recommendationContent').textContent = aiData.recommendation || 'Không có khuyến nghị';
  
  // Update findings list
  const findingsList = $('#findingsList');
  if (aiData.findings && aiData.findings.length > 0) {
    findingsList.innerHTML = aiData.findings.map((finding, index) => `
      <div class="finding-item">
        <div class="finding-number">${index + 1}</div>
        <div class="finding-text">${finding}</div>
      </div>
    `).join('');
  } else {
    findingsList.innerHTML = '<div class="no-findings">Không có dấu hiệu đáng ngờ nào được phát hiện</div>';
  }
  
  // Update images grid
  const imagesGrid = $('#imagesGrid');
  const uploads = reportData.uploads || {};
  
  let imagesHTML = '';
  if (uploads.currentView?.link) {
    imagesHTML += `
      <div class="image-card">
        <h4>Ảnh viewport hiện tại</h4>
        <a href="${uploads.currentView.link}" target="_blank" class="image-link">
          <span class="btn-icon">🖼️</span>
          Xem ảnh viewport
        </a>
      </div>
    `;
  }
  
  if (uploads.fullPage?.link) {
    imagesHTML += `
      <div class="image-card">
        <h4>Ảnh toàn trang</h4>
        <a href="${uploads.fullPage.link}" target="_blank" class="image-link">
          <span class="btn-icon">📄</span>
          Xem ảnh toàn trang
        </a>
      </div>
    `;
  }
  
  if (uploads.annotated?.link) {
    imagesHTML += `
      <div class="image-card">
        <h4>Ảnh chú thích bằng chứng</h4>
        <a href="${uploads.annotated.link}" target="_blank" class="image-link">
          <span class="btn-icon">🎯</span>
          Xem ảnh chú thích
        </a>
      </div>
    `;
  }
  
  if (!imagesHTML) {
    imagesHTML = '<div class="no-images">Không có ảnh bằng chứng</div>';
  }
  
  imagesGrid.innerHTML = imagesHTML;
  
  // Store report text for copying
  currentReportText = reportData.reportText || generateReportText(reportData);
}

// Generate report text if not available
function generateReportText(reportData) {
  const aiData = reportData.ai || {};
  const riskInfo = formatRiskLevel(aiData.risk || 0);
  
  return `
🛡️ BÁO CÁO PHÂN TÍCH CHUYÊN SÂU - CHONGLUADAO.VN

📊 THÔNG TIN CƠ BẢN:
🌐 URL: ${reportData.url || 'Không có'}
⏰ Thời gian: ${formatDate(reportData.time)}
⚠️ Mức rủi ro: ${aiData.risk || 0}/10 - ${riskInfo.text}

📝 TÓM TẮT:
${aiData.summary || 'Không có tóm tắt'}

🔍 CÁC DẤU HIỆU PHÁT HIỆN:
${(aiData.findings || []).map((finding, index) => `${index + 1}. ${finding}`).join('\n') || 'Không có dấu hiệu đáng ngờ'}

📋 BẰNG CHỨNG CHI TIẾT:
${aiData.evidence_text || 'Không có bằng chứng chi tiết'}

⚙️ PHÂN TÍCH KỸ THUẬT:
${aiData.technical_analysis || 'Không có phân tích kỹ thuật'}

💡 KHUYẾN NGHỊ:
${aiData.recommendation || 'Không có khuyến nghị'}

📸 BẰNG CHỨNG HÌNH ẢNH:
${reportData.uploads?.currentView?.link ? `- Ảnh viewport: ${reportData.uploads.currentView.link}` : ''}
${reportData.uploads?.fullPage?.link ? `- Ảnh toàn trang: ${reportData.uploads.fullPage.link}` : ''}
${reportData.uploads?.annotated?.link ? `- Ảnh chú thích: ${reportData.uploads.annotated.link}` : ''}

---
Báo cáo được tạo bởi ChongLuaDao AI Evidence Extension
  `.trim();
}

// Show error message
function showError(message) {
  const container = $('.result-full-container');
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">❌</div>
      <h3>Có lỗi xảy ra</h3>
      <p>${message}</p>
      <button onclick="window.close()" class="primary-btn">
        <span class="btn-icon">↩️</span>
        <div class="btn-content">
          <div class="btn-title">Đóng tab</div>
        </div>
      </button>
    </div>
  `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadReportData();
  
  // Theme toggle
  $('#themeToggle').addEventListener('click', toggleTheme);
  
  // Copy full report
  $('#copyFullReport').addEventListener('click', async () => {
    try {
      if (currentReportText) {
        await navigator.clipboard.writeText(currentReportText);
        showToast("📋 Đã copy báo cáo đầy đủ vào clipboard", "success");
      } else {
        showToast("❌ Không có dữ liệu để copy", "error");
      }
    } catch (error) {
      showToast("❌ Lỗi khi copy báo cáo", "error");
    }
  });
  
  // Fill form from result
  $('#fillFormFromResult').addEventListener('click', async () => {
    try {
      if (currentReportData) {
        const response = await chrome.runtime.sendMessage({
          type: "FILL_CHONGLUADAO_FORM",
          reportData: currentReportData
        });
        
        if (response.ok) {
          showToast("📝 Đã điền form ChongLuaDao tự động", "success");
        } else {
          showToast("⚠️ " + (response.error || "Không thể điền form tự động"), "warning");
        }
      } else {
        showToast("❌ Không có dữ liệu để điền form", "error");
      }
    } catch (error) {
      showToast("❌ Lỗi khi điền form", "error");
    }
  });
  
  // Export PDF (placeholder)
  $('#exportPDF').addEventListener('click', () => {
    window.print();
  });
  
  // Back to popup
  $('#backToPopup').addEventListener('click', () => {
    window.close();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'c':
          e.preventDefault();
          $('#copyFullReport').click();
          break;
        case 'p':
          e.preventDefault();
          $('#exportPDF').click();
          break;
        case 'w':
          e.preventDefault();
          window.close();
          break;
      }
    }
  });
});
