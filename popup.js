// ===== Modern ChongLuaDao AI Evidence - Popup Script =====

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Global State
let currentReportData = null;
let currentReportText = "";
let analysisInProgress = false;
let currentStep = 0;
const totalSteps = 4;

function updateConnectionStatus() {
  const statusText = $('#connectionStatus .status-text');
  const statusDot = $('#connectionStatus .status-dot');
  
  // Check API configuration
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      statusText.textContent = 'Sẵn sàng';
      statusDot.style.background = '#22c55e';
    } else {
      statusText.textContent = 'Cần cấu hình';
      statusDot.style.background = '#f59e0b';
    }
  });
}



// ===== Progress System =====
function showProgress() {
  $('#progressSection').hidden = false;
  $('#result').hidden = true;
  $('#historyList').hidden = true;
  updateProgress(0, 'Đang khởi tạo phân tích...');
  
  // Auto scroll to progress section
  setTimeout(() => {
    $('#progressSection').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 200);
}

function updateProgress(step, message) {
  currentStep = step;
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const progressPercentage = $('#progressPercentage');
  const timelineSteps = $$('.timeline-step');
  
  // Update progress bar
  const percentage = Math.min((step / totalSteps) * 100, 100);
  progressFill.style.width = `${percentage}%`;
  progressPercentage.textContent = `${Math.round(percentage)}%`;
  
  // Update status text
  progressText.textContent = message;
  
  // Update timeline steps
  timelineSteps.forEach((stepEl, index) => {
    const stepNum = index + 1;
    stepEl.classList.remove('active', 'completed');
    
    if (stepNum < step) {
      stepEl.classList.add('completed');
    } else if (stepNum === step) {
      stepEl.classList.add('active');
    }
  });
}

function hideProgress() {
  $('#progressSection').hidden = true;
}

// ===== Analysis Functions =====
async function runAnalysis(isFullPage = true) {
  if (analysisInProgress) {
    return;
  }

  // Check API key first
  const apiConfig = await chrome.storage.sync.get(['geminiApiKey']);
  if (!apiConfig.geminiApiKey) {
    // Mở trang cài đặt trực tiếp
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    return;
  }

  analysisInProgress = true;
  
  try {
    showProgress();
    
    // Step 1: Capture screenshots
    updateProgress(1, 'Đang chụp ảnh màn hình...');
    
    const response = await chrome.runtime.sendMessage({ 
      type: "RUN_CAPTURE_AND_ANALYZE", 
      fullPage: isFullPage
    });
    
    if (!response.ok) {
      throw new Error(response.error || 'Có lỗi xảy ra trong quá trình phân tích');
    }
    
    // Step 2: AI Analysis
    updateProgress(2, 'AI đang phân tích nội dung...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 3: Generate annotations
    updateProgress(3, 'Đang tạo chú thích bằng chứng...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Upload
    updateProgress(4, 'Đang upload bằng chứng...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Complete
    updateProgress(totalSteps, 'Hoàn thành!');
    
    // Display results
    await displayResults(response.report);
    
  } catch (error) {
    console.error('Analysis error:', error);
    hideProgress();
    
    // Show error message to user
    $('#result').hidden = false;
    $('#resultSummary').innerHTML = `
      <div style="color: var(--error-600); padding: var(--space-4); background: var(--error-50); border: 1px solid var(--error-200); border-radius: var(--radius-lg);">
        <strong>❌ Lỗi phân tích:</strong><br>
        ${error.message || 'Có lỗi xảy ra trong quá trình phân tích. Vui lòng thử lại.'}
      </div>
    `;
  } finally {
    analysisInProgress = false;
  }
}

async function displayResults(report) {
  hideProgress();
  
  if (!report) {
    return;
  }
  
  // Store report data
  currentReportData = report;
  currentReportText = report.reportText || generateReportText(report);
  
  // Save latest report for result page
  try {
    await chrome.storage.local.set({ latest_report: report });
    console.log('✅ Latest report saved successfully');
  } catch (error) {
    console.error('❌ Error saving latest report:', error);
  }
  
  // Show results section
  $('#result').hidden = false;
  $('#historyList').hidden = true;
  
  // Update risk badge
  const aiData = report.ai || {};
  updateRiskBadge(aiData.risk || 0);
  
  // Update summary
  const summary = generateSummary(report);
  const resultSummary = $('#resultSummary');
  resultSummary.innerHTML = '';
  
  // Remove skeleton
  const skeleton = resultSummary.querySelector('.summary-skeleton');
  if (skeleton) skeleton.remove();
  
  // Add summary content
  const summaryDiv = document.createElement('div');
  summaryDiv.innerHTML = summary;
  resultSummary.appendChild(summaryDiv);
  
  // Update detailed tabs
  updateResultTabs(report);
  
  // Auto scroll to results
  setTimeout(() => {
    $('#result').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 300);
  
  // Update history stats
  updateHistoryStats();
}

function updateRiskBadge(riskLevel) {
  const riskBadge = $('#riskBadge');
  const riskLevelEl = riskBadge.querySelector('.risk-level');
  const riskTextEl = riskBadge.querySelector('.risk-text');
  
  riskLevelEl.textContent = riskLevel;
  
  // Remove existing classes
  riskBadge.classList.remove('low', 'medium', 'high');
  
  if (riskLevel <= 3) {
    riskBadge.classList.add('low');
    riskTextEl.textContent = 'An toàn';
  } else if (riskLevel <= 6) {
    riskBadge.classList.add('medium');
    riskTextEl.textContent = 'Thận trọng';
  } else {
    riskBadge.classList.add('high');
    riskTextEl.textContent = 'Nguy hiểm';
  }
}

function generateSummary(report) {
  const aiData = report.ai || {};
  const riskLevel = aiData.risk || 0;
  const findings = aiData.findings || [];
  const websiteCategory = aiData.website_category || 'unknown';
  const threatLevel = aiData.threat_level || 'LOW';
  const confidenceScore = aiData.confidence_score || 85;
  
  let riskText = 'An toàn';
  if (riskLevel > 6) riskText = 'Nguy hiểm';
  else if (riskLevel > 3) riskText = 'Thận trọng';
  
  // Map category to Vietnamese
  const categoryMap = {
    'ecommerce': 'Thương mại điện tử',
    'investment': 'Đầu tư / Tài chính',
    'gaming': 'Game / Giải trí',
    'banking': 'Ngân hàng',
    'news': 'Tin tức',
    'social': 'Mạng xã hội',
    'casino': 'Casino / Cờ bạc',
    'unknown': 'Chưa xác định'
  };
  
  // Map threat level to Vietnamese  
  const threatMap = {
    'LOW': '🟢 Thấp',
    'MEDIUM': '🟡 Trung bình', 
    'HIGH': '🟠 Cao',
    'CRITICAL': '🔴 Cực nguy hiểm'
  };
  
  return `
    <div class="summary-content">
      <p><strong>Mức độ rủi ro:</strong> ${riskLevel}/10 - <span class="risk-${riskLevel <= 3 ? 'low' : riskLevel <= 6 ? 'medium' : 'high'}">${riskText}</span></p>
      <p><strong>Mức độ đe dọa:</strong> ${threatMap[threatLevel] || threatLevel}</p>
      <p><strong>Phân loại website:</strong> ${categoryMap[websiteCategory] || websiteCategory}</p>
      <p><strong>Độ tin cậy phân tích:</strong> ${confidenceScore}%</p>
      <p><strong>Phát hiện:</strong> ${findings.length} dấu hiệu đáng chú ý</p>
      <p><strong>Tóm tắt:</strong> ${aiData.summary || 'Không có thông tin tóm tắt'}</p>
    </div>
  `;
}

function updateResultTabs(report) {
  const aiData = report.ai || {};
  
  // Overview tab
  const overviewTab = $('#tab-overview pre');
  if (overviewTab) {
    overviewTab.textContent = currentReportText;
  }
  
  // Findings tab
  const findingsTab = $('#tab-findings');
  if (findingsTab) {
    const findings = aiData.findings || [];
    if (findings.length > 0) {
      findingsTab.innerHTML = findings.map((finding, index) => `
        <div class="finding-item">
          <div class="finding-number">${index + 1}</div>
          <div class="finding-content">${finding}</div>
        </div>
      `).join('');
    } else {
      findingsTab.innerHTML = '<p class="no-data">Không có dấu hiệu đáng ngờ nào được phát hiện</p>';
    }
  }
  
  // Evidence tab
  const evidenceTab = $('#tab-evidence');
  if (evidenceTab) {
    const uploads = report.uploads || {};
    let evidenceHTML = '';
    
    if (uploads.currentView?.link) {
      evidenceHTML += `<div class="evidence-item">
        <h5>📷 Ảnh viewport hiện tại</h5>
        <a href="${uploads.currentView.link}" target="_blank" class="evidence-link">Xem ảnh</a>
      </div>`;
    }
    
    if (uploads.fullPage?.link) {
      evidenceHTML += `<div class="evidence-item">
        <h5>📄 Ảnh toàn trang</h5>
        <a href="${uploads.fullPage.link}" target="_blank" class="evidence-link">Xem ảnh</a>
      </div>`;
    }
    
    if (uploads.annotated?.link) {
      evidenceHTML += `<div class="evidence-item">
        <h5>🎯 Ảnh chú thích bằng chứng</h5>
        <a href="${uploads.annotated.link}" target="_blank" class="evidence-link">Xem ảnh</a>
      </div>`;
    }
    
    evidenceTab.innerHTML = evidenceHTML || '<p class="no-data">Không có bằng chứng hình ảnh</p>';
  }
}

function generateReportText(report) {
  const aiData = report.ai || {};
  const riskLevel = aiData.risk || 0;
  
  return `
🛡️ BÁO CÁO PHÂN TÍCH AN NINH - CHONGLUADAO.VN

📊 THÔNG TIN CƠ BẢN:
🌐 URL: ${report.url || 'Không có'}
⏰ Thời gian: ${new Date(report.time).toLocaleString('vi-VN')}
⚠️ Mức rủi ro: ${riskLevel}/10

📝 TÓM TẮT:
${aiData.summary || 'Không có tóm tắt'}

🔍 CÁC DẤU HIỆU PHÁT HIỆN:
${(aiData.findings || []).map((finding, index) => `${index + 1}. ${finding}`).join('\n') || 'Không có dấu hiệu đáng ngờ'}

📋 BẰNG CHỨNG CHI TIẾT:
${aiData.evidence_text || 'Không có bằng chứng chi tiết'}

💡 KHUYẾN NGHỊ:
${aiData.recommendation || 'Không có khuyến nghị'}

📸 BẰNG CHỨNG HÌNH ẢNH:
${report.uploads?.currentView?.link ? `- Ảnh viewport: ${report.uploads.currentView.link}` : ''}
${report.uploads?.fullPage?.link ? `- Ảnh toàn trang: ${report.uploads.fullPage.link}` : ''}
${report.uploads?.annotated?.link ? `- Ảnh chú thích: ${report.uploads.annotated.link}` : ''}

---
Báo cáo được tạo bởi ChongLuaDao AI Evidence Extension
  `.trim();
}

// ===== History Management =====
// Function removed - history now opens in separate tab

async function updateHistoryStats() {
  try {
    const result = await chrome.storage.local.get(['analysis_history']);
    const history = result.analysis_history || [];
    
    const totalScans = history.length;
    const highRiskScans = history.filter(item => (item.ai?.risk || 0) > 6).length;
    
    $('#totalScans').textContent = totalScans;
    $('#highRiskScans').textContent = highRiskScans;

  } catch (error) {
    console.error('Error updating history stats:', error);
  }
}

function viewHistoryItem(index) {
  chrome.storage.local.get(['analysis_history'], (result) => {
    const history = result.analysis_history || [];
    if (history[index]) {
      currentReportData = history[index];
      displayResults(history[index]);
    }
  });
}

async function deleteHistoryItem(index) {
  try {
    const result = await chrome.storage.local.get(['analysis_history']);
    const history = result.analysis_history || [];
    history.splice(index, 1);
    await chrome.storage.local.set({ analysis_history: history });
    loadHistory();
  } catch (error) {
    console.error('Error deleting history item:', error);
  }
}

async function clearAllHistory() {
  try {
    await chrome.storage.local.set({ analysis_history: [] });
    loadHistory();
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

async function exportHistory() {
  try {
    const result = await chrome.storage.local.get(['analysis_history']);
    const history = result.analysis_history || [];
    
    if (history.length === 0) {
      return;
    }

    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chongluadao-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Export error:', error);
  }
}



// ===== Tab System =====
function initTabs() {
  const tabButtons = $$('.details-tabs .tab-btn');
  const tabPanels = $$('.tab-panel');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update panels
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `tab-${targetTab}`) {
          panel.classList.add('active');
        }
      });
    });
  });
}

// ===== Utility Functions =====
function forceCloseAllModals() {
  // Reset any analysis state
  analysisInProgress = false;
  hideProgress();
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize
  updateConnectionStatus();
  initTabs();
  updateHistoryStats();
  
  // Force close any open modals on load
  forceCloseAllModals();
  
  // Emergency reset button
  $('#emergencyReset').addEventListener('click', forceCloseAllModals);
  
  // Main action buttons
  $('#run').addEventListener('click', () => runAnalysis(true));
  $('#runQuick').addEventListener('click', () => runAnalysis(false));
  
  // Tool buttons
  $('#history').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });
  $('#clear').addEventListener('click', clearAllHistory);
  $('#exportHistory').addEventListener('click', exportHistory);
  
  // Result action buttons
  $('#copyReport').addEventListener('click', async () => {
    try {
      if (currentReportText) {
    await navigator.clipboard.writeText(currentReportText);
      }
  } catch (error) {
      console.error('Error copying report:', error);
    }
  });
  
  $('#fillForm').addEventListener('click', async () => {
    try {
      if (currentReportData) {
    await chrome.runtime.sendMessage({ 
      type: "FILL_CHONGLUADAO_FORM", 
      reportData: currentReportData 
    });
      }
    } catch (error) {
      console.error('Error filling form:', error);
    }
  });
  
  $('#expandResult').addEventListener('click', () => {
    const details = $('#resultDetails');
    const button = $('#expandResult');
    
    if (details.hidden) {
      details.hidden = false;
      button.innerHTML = '<span class="btn-icon">📄</span>';
      button.title = 'Thu gọn chi tiết';
    } else {
      details.hidden = true;
      button.innerHTML = '<span class="btn-icon">🔍</span>';
      button.title = 'Xem chi tiết';
    }
  });
  
  $('#openResultTab').addEventListener('click', async () => {
    try {
      if (currentReportData) {
        await chrome.tabs.create({ url: chrome.runtime.getURL("result.html") });
      }
  } catch (error) {
      console.error('Error opening result tab:', error);
    }
  });
  
  // Cancel analysis button
  $('#cancelAnalysis')?.addEventListener('click', () => {
    if (analysisInProgress) {
      analysisInProgress = false;
      hideProgress();
    }
  });
  

  
  // Check connection status on load
  updateConnectionStatus();
  
  // Refresh connection status every 30 seconds
  setInterval(updateConnectionStatus, 30000);
  
  // Emergency escape - press ESC to close any modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      forceCloseAllModals();
    }
  });
});

// Global functions for HTML onclick events
window.viewHistoryItem = viewHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;