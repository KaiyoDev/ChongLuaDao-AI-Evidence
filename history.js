// history.js
console.log("History page loaded");

let historyData = [];
let filteredData = [];

// DOM elements
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const historyList = document.getElementById('historyList');
const totalAnalyses = document.getElementById('totalAnalyses');
const highRiskCount = document.getElementById('highRiskCount');
const safeCount = document.getElementById('safeCount');
const todayCount = document.getElementById('todayCount');

// Filters
const riskFilter = document.getElementById('riskFilter');
const dateFilter = document.getElementById('dateFilter');
const searchInput = document.getElementById('searchInput');

// Buttons
const exportAll = document.getElementById('exportAll');
const clearAll = document.getElementById('clearAll');
const refreshData = document.getElementById('refreshData');
const goToPopup = document.getElementById('goToPopup');

// Toast notifications
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Format risk level with color and icon
function formatRiskLevel(risk) {
  if (risk >= 8) return { text: 'CỰC NGUY HIỂM', color: '#dc2626', icon: '🔴' };
  if (risk >= 6) return { text: 'NGUY HIỂM', color: '#ea580c', icon: '🟠' };
  if (risk >= 4) return { text: 'THẬN TRỌNG', color: '#ca8a04', icon: '🟡' };
  return { text: 'AN TOÀN', color: '#16a34a', icon: '🟢' };
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Render single history item
function renderHistoryItem(item, index) {
  const risk = item.ai?.risk || 0;
  const riskInfo = formatRiskLevel(risk);
  const domain = new URL(item.url).hostname;
    const summary = item.ai?.summary || 'Không có tóm tắt';
    const findings = item.ai?.findings || [];
    
    return `
    <div class="history-item hover-lift" data-index="${index}">
      <div class="history-header">
        <div class="history-meta">
          <div class="history-domain">${domain}</div>
          <div class="history-time">${formatDate(item.time)}</div>
        </div>
        <div class="history-risk" style="color: ${riskInfo.color}">
          <span class="risk-icon">${riskInfo.icon}</span>
          <span class="risk-score">${risk}/10</span>
          <span class="risk-label">${riskInfo.text}</span>
        </div>
      </div>
      
      <div class="history-content">
        <div class="history-url">
          <a href="${item.url}" target="_blank" title="Mở trang web">
            <span class="url-icon">🔗</span>
            ${item.url}
          </a>
        </div>
        
        <div class="history-summary">${summary}</div>
        
        ${findings.length > 0 ? `
          <div class="history-findings">
            <div class="findings-header">🔍 Dấu hiệu phát hiện:</div>
            <ul class="findings-list">
              ${findings.slice(0, 3).map(finding => `<li>${finding}</li>`).join('')}
              ${findings.length > 3 ? `<li class="more-findings">... và ${findings.length - 3} dấu hiệu khác</li>` : ''}
            </ul>
        </div>
        ` : ''}
        
        ${item.uploads ? `
          <div class="history-images">
            ${item.uploads.currentView ? `<a href="${item.uploads.currentView}" target="_blank" class="image-link" title="Xem ảnh viewport">📷 Viewport</a>` : ''}
            ${item.uploads.fullPage ? `<a href="${item.uploads.fullPage}" target="_blank" class="image-link" title="Xem ảnh toàn trang">📄 Toàn trang</a>` : ''}
            ${item.uploads.annotated ? `<a href="${item.uploads.annotated}" target="_blank" class="image-link" title="Xem ảnh phân tích">🔍 Phân tích</a>` : ''}
          </div>
        ` : ''}
        </div>
      
      <div class="history-actions">
        <button class="action-btn copy-url" data-url="${item.url}" title="Copy URL">
          📋 Copy URL
        </button>
        <button class="action-btn delete-item" data-index="${index}" title="Xóa mục này">
          🗑️ Xóa
        </button>
      </div>
    </div>
  `;
}

// Render history list
function renderHistory() {
  if (filteredData.length === 0) {
    historyList.innerHTML = '';
    emptyState.hidden = false;
    return;
  }
  
  emptyState.hidden = true;
  historyList.innerHTML = filteredData.map((item, index) => renderHistoryItem(item, index)).join('');
  
  // Add event listeners
  addHistoryEventListeners();
}

// Add event listeners to history items
function addHistoryEventListeners() {
  // Copy URL buttons
  document.querySelectorAll('.copy-url').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      navigator.clipboard.writeText(url).then(() => {
        showToast('URL đã được copy!', 'success');
      }).catch(() => {
        showToast('Không thể copy URL', 'error');
      });
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      deleteHistoryItem(index);
    });
  });
}

// Delete single history item
async function deleteHistoryItem(index) {
  if (!confirm('Bạn có chắc muốn xóa mục này?')) return;
  
  try {
    historyData.splice(index, 1);
    await chrome.storage.local.set({ analysis_history: historyData });
    showToast('Đã xóa mục thành công', 'success');
    applyFilters();
    updateStats();
  } catch (error) {
    console.error('Error deleting item:', error);
    showToast('Lỗi khi xóa mục', 'error');
  }
}

// Update statistics
function updateStats() {
  const total = historyData.length;
  const highRisk = historyData.filter(item => (item.ai?.risk || 0) >= 6).length;
  const safe = historyData.filter(item => (item.ai?.risk || 0) < 4).length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayItems = historyData.filter(item => {
    const itemDate = new Date(item.time);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === today.getTime();
  }).length;
  
  totalAnalyses.textContent = total;
  highRiskCount.textContent = highRisk;
  safeCount.textContent = safe;
  todayCount.textContent = todayItems;
}

// Apply filters
function applyFilters() {
  let filtered = [...historyData];
    
    // Risk filter
  const riskValue = riskFilter.value;
  if (riskValue !== 'all') {
    filtered = filtered.filter(item => {
      const risk = item.ai?.risk || 0;
      switch (riskValue) {
        case 'high': return risk >= 8;
        case 'medium': return risk >= 5 && risk < 8;
        case 'low': return risk < 5;
        default: return true;
      }
    });
    }
    
    // Date filter
  const dateValue = dateFilter.value;
  if (dateValue !== 'all') {
    const now = new Date();
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.time);
      const diffTime = now - itemDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      switch (dateValue) {
        case 'today': return diffDays < 1;
        case 'week': return diffDays < 7;
        case 'month': return diffDays < 30;
        default: return true;
      }
    });
    }
    
    // Search filter
  const searchValue = searchInput.value.toLowerCase().trim();
  if (searchValue) {
    filtered = filtered.filter(item => {
      return item.url.toLowerCase().includes(searchValue) ||
             (item.ai?.summary || '').toLowerCase().includes(searchValue) ||
             (item.ai?.findings || []).some(finding => 
               finding.toLowerCase().includes(searchValue)
             );
    });
  }
  
  filteredData = filtered;
  renderHistory();
}

// Load history data
async function loadHistory() {
  try {
    loadingState.hidden = false;
    emptyState.hidden = true;
    historyList.innerHTML = '';
    
    const result = await chrome.storage.local.get(['analysis_history']);
    historyData = result.analysis_history || [];
    
    console.log('Loaded history:', historyData.length, 'items');
    
    // Sort by time (newest first)
    historyData.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    updateStats();
    applyFilters();
    
    loadingState.hidden = true;
  } catch (error) {
    console.error('Error loading history:', error);
    loadingState.hidden = true;
    showToast('Lỗi khi tải lịch sử', 'error');
  }
}

// Export all data
function exportData() {
  try {
    const dataStr = JSON.stringify(historyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chongluadao-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu thành công!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Lỗi khi xuất dữ liệu', 'error');
  }
}

// Clear all data
async function clearAllData() {
  if (!confirm('Bạn có chắc muốn xóa TẤT CẢ lịch sử? Hành động này không thể hoàn tác!')) {
    return;
  }
  
  try {
    await chrome.storage.local.set({ analysis_history: [] });
    historyData = [];
    updateStats();
    applyFilters();
    showToast('Đã xóa tất cả lịch sử', 'success');
  } catch (error) {
    console.error('Clear error:', error);
    showToast('Lỗi khi xóa lịch sử', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadHistory();
  
  // Filter events
  riskFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', debounce(applyFilters, 300));
  
  // Button events
  exportAll.addEventListener('click', exportData);
  clearAll.addEventListener('click', clearAllData);
  refreshData.addEventListener('click', loadHistory);
  goToPopup.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
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