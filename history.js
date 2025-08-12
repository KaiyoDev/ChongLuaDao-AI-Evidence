const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Removed theme management - using green/white theme only

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

// Utility functions
function formatRiskLevel(risk) {
  if (risk <= 2) return { text: "An toàn", color: "#22c55e", icon: "🟢", class: "low" };
  if (risk <= 5) return { text: "Thận trọng", color: "#f59e0b", icon: "🟡", class: "medium" };
  if (risk <= 8) return { text: "Nguy hiểm", color: "#ef4444", icon: "🔴", class: "high" };
  return { text: "Cực nguy hiểm", color: "#dc2626", icon: "🚨", class: "high" };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Data Management
let historyData = [];
let filteredData = [];

async function loadHistoryData() {
  try {
    showLoading(true);
    const result = await chrome.storage.local.get(['analysis_history']);
    historyData = result.analysis_history || [];
    filteredData = [...historyData];
    
    updateStats();
    renderHistoryList();
    showLoading(false);
    
    if (historyData.length === 0) {
      showEmptyState(true);
    } else {
      showEmptyState(false);
    }
    
    showToast(`📋 Đã tải ${historyData.length} bản ghi lịch sử`, 'success');
  } catch (error) {
    console.error('Error loading history:', error);
    showToast('❌ Lỗi khi tải lịch sử', 'error');
    showLoading(false);
  }
}

function updateStats() {
  const total = historyData.length;
  const highRisk = historyData.filter(item => (item.ai?.risk || 0) >= 8).length;
  const safe = historyData.filter(item => (item.ai?.risk || 0) <= 2).length;
  
  const today = new Date().toDateString();
  const todayCount = historyData.filter(item => 
    new Date(item.time).toDateString() === today
  ).length;
  
  $('#totalAnalyses').textContent = total;
  $('#highRiskCount').textContent = highRisk;
  $('#safeCount').textContent = safe;
  $('#todayCount').textContent = todayCount;
}

function renderHistoryList() {
  const historyList = $('#historyList');
  
  if (filteredData.length === 0) {
    historyList.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>Không tìm thấy kết quả</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = filteredData.map((item, index) => {
    const riskInfo = formatRiskLevel(item.ai?.risk || 0);
    const formattedDate = formatDate(item.time);
    const summary = item.ai?.summary || 'Không có tóm tắt';
    const url = item.url || 'Không có URL';
    const findings = item.ai?.findings || [];
    const evidenceText = item.ai?.evidence_text || '';
    
    return `
      <div class="history-item" data-index="${index}">
        <div class="history-item-header">
          <div class="history-item-title">
            <span class="risk-badge ${riskInfo.class}">
              ${riskInfo.icon} ${item.ai?.risk || 0}/10
            </span>
            <span class="history-item-url">${url}</span>
          </div>
          <div class="history-item-actions">
            <button class="action-btn view-btn" title="Xem chi tiết">
              <span class="btn-icon">👁️</span>
            </button>
            <button class="action-btn copy-btn" title="Copy báo cáo">
              <span class="btn-icon">📋</span>
            </button>
            <button class="action-btn delete-btn" title="Xóa">
              <span class="btn-icon">🗑️</span>
            </button>
          </div>
        </div>
        <div class="history-item-content">
          <p class="history-item-summary"><strong>Tóm tắt:</strong> ${summary}</p>
          ${findings.length > 0 ? `
            <div class="history-item-findings">
              <strong>Dấu hiệu phát hiện (${findings.length}):</strong>
              <ul>
                ${findings.slice(0, 5).map(finding => `<li>${finding}</li>`).join('')}
                ${findings.length > 5 ? `<li><em>... và ${findings.length - 5} dấu hiệu khác</em></li>` : ''}
              </ul>
            </div>
          ` : ''}
          ${evidenceText ? `
            <div class="history-item-evidence">
              <strong>Bằng chứng:</strong>
              <p>${evidenceText.length > 300 ? evidenceText.substring(0, 300) + '...' : evidenceText}</p>
            </div>
          ` : ''}
          <div class="history-item-meta">
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              ${formattedDate}
            </span>
            <span class="meta-item">
              <span class="meta-icon">🔗</span>
              ${item.uploads?.annotated?.link ? 'Có ảnh' : 'Không có ảnh'}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📊</span>
              ${findings.length} dấu hiệu
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners to action buttons
  addHistoryItemListeners();
}

function addHistoryItemListeners() {
  // View details
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('.history-item').dataset.index);
      const item = filteredData[index];
      showHistoryDetails(item);
    });
  });
  
  // Copy report
  $$('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.closest('.history-item').dataset.index);
      const item = filteredData[index];
      await copyReport(item);
    });
  });
  
  // Delete item
  $$('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.closest('.history-item').dataset.index);
      const item = filteredData[index];
      await deleteHistoryItem(item, index);
    });
  });
}

function showHistoryDetails(item) {
  const riskInfo = formatRiskLevel(item.ai?.risk || 0);
  const formattedDate = new Date(item.time).toLocaleString('vi-VN');
  
  const detailsHTML = `
    <div class="history-details">
      <div class="details-header">
        <h3>Chi tiết phân tích</h3>
        <button class="close-btn" id="closeDetails">✕</button>
      </div>
      <div class="details-content">
        <div class="detail-section">
          <h4>📊 Thông tin cơ bản</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>URL:</label>
              <span>${item.url || 'Không có'}</span>
            </div>
            <div class="detail-item">
              <label>Thời gian:</label>
              <span>${formattedDate}</span>
            </div>
            <div class="detail-item">
              <label>Mức rủi ro:</label>
              <span class="risk-badge ${riskInfo.class}">
                ${riskInfo.icon} ${item.ai?.risk || 0}/10 - ${riskInfo.text}
              </span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>📝 Tóm tắt</h4>
          <p>${item.ai?.summary || 'Không có tóm tắt'}</p>
        </div>
        
        <div class="detail-section">
          <h4>🔍 Bằng chứng chi tiết</h4>
          <p>${item.ai?.evidence_text || 'Không có bằng chứng'}</p>
        </div>
        
        <div class="detail-section">
          <h4>💡 Khuyến nghị</h4>
          <p>${item.ai?.recommendation || 'Không có khuyến nghị'}</p>
        </div>
        
        <div class="detail-section">
          <h4>📤 Ảnh bằng chứng</h4>
          <div class="image-links">
            ${item.uploads?.currentView?.link ? 
              `<a href="${item.uploads.currentView.link}" target="_blank" class="image-link">📸 Ảnh viewport</a>` : ''}
            ${item.uploads?.fullPage?.link ? 
              `<a href="${item.uploads.fullPage.link}" target="_blank" class="image-link">📸 Ảnh toàn trang</a>` : ''}
            ${item.uploads?.annotated?.link ? 
              `<a href="${item.uploads.annotated.link}" target="_blank" class="image-link">🎨 Ảnh chú thích</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = detailsHTML;
  document.body.appendChild(modal);
  
  // Close modal
  $('#closeDetails').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

async function copyReport(item) {
  try {
    const reportText = item.reportText || JSON.stringify(item, null, 2);
    await navigator.clipboard.writeText(reportText);
    showToast('📋 Đã copy báo cáo vào clipboard', 'success');
  } catch (error) {
    showToast('❌ Lỗi khi copy báo cáo', 'error');
  }
}

async function deleteHistoryItem(item, index) {
  if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
  
  try {
    // Remove from original data
    const originalIndex = historyData.findIndex(h => h.time === item.time && h.url === item.url);
    if (originalIndex !== -1) {
      historyData.splice(originalIndex, 1);
    }
    
    // Remove from filtered data
    filteredData.splice(index, 1);
    
    // Update storage
    await chrome.storage.local.set({ analysisHistory: historyData });
    
    // Update UI
    updateStats();
    renderHistoryList();
    
    showToast('🗑️ Đã xóa bản ghi', 'success');
  } catch (error) {
    showToast('❌ Lỗi khi xóa bản ghi', 'error');
  }
}

// Filtering and Search
function applyFilters() {
  const riskFilter = $('#riskFilter').value;
  const dateFilter = $('#dateFilter').value;
  const searchTerm = $('#searchInput').value.toLowerCase();
  
  filteredData = historyData.filter(item => {
    const risk = item.ai?.risk || 0;
    const itemDate = new Date(item.time);
    const now = new Date();
    
    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'high' && risk < 8) return false;
      if (riskFilter === 'medium' && (risk < 5 || risk >= 8)) return false;
      if (riskFilter === 'low' && risk >= 5) return false;
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today' && diffDays > 0) return false;
      if (dateFilter === 'week' && diffDays > 7) return false;
      if (dateFilter === 'month' && diffDays > 30) return false;
    }
    
    // Search filter
    if (searchTerm) {
      const url = (item.url || '').toLowerCase();
      const summary = (item.ai?.summary || '').toLowerCase();
      const evidence = (item.ai?.evidence_text || '').toLowerCase();
      
      if (!url.includes(searchTerm) && 
          !summary.includes(searchTerm) && 
          !evidence.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
  
  renderHistoryList();
}

// Export and Clear functions
async function exportAllData() {
  try {
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
    
    showToast('📤 Đã xuất dữ liệu thành công', 'success');
  } catch (error) {
    showToast('❌ Lỗi khi xuất dữ liệu', 'error');
  }
}

async function clearAllData() {
  if (!confirm('Bạn có chắc muốn xóa TOÀN BỘ lịch sử phân tích? Hành động này không thể hoàn tác!')) {
    return;
  }
  
  try {
    await chrome.storage.local.remove(['analysisHistory']);
    historyData = [];
    filteredData = [];
    
    updateStats();
    renderHistoryList();
    showEmptyState(true);
    
    showToast('🗑️ Đã xóa toàn bộ lịch sử', 'success');
  } catch (error) {
    showToast('❌ Lỗi khi xóa lịch sử', 'error');
  }
}

// UI State Management
function showLoading(show) {
  $('#loadingState').hidden = !show;
}

function showEmptyState(show) {
  $('#emptyState').hidden = !show;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  
  // Load initial data
  loadHistoryData();
  
  // Event listeners
  $('#riskFilter').addEventListener('change', applyFilters);
  $('#dateFilter').addEventListener('change', applyFilters);
  $('#searchInput').addEventListener('input', debounce(applyFilters, 300));
  
  $('#exportAll').addEventListener('click', exportAllData);
  $('#clearAll').addEventListener('click', clearAllData);
  $('#refreshData').addEventListener('click', loadHistoryData);
  
  $('#goToPopup').addEventListener('click', () => {
    window.close();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          $('#searchInput').focus();
          break;
        case 'r':
          e.preventDefault();
          loadHistoryData();
          break;
        case 'e':
          e.preventDefault();
          exportAllData();
          break;
      }
    }
  });
});

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
