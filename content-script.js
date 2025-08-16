// content-script.js - Xử lý hiển thị cảnh báo và status updates
console.log("ChongLuaDao Content Script loaded");

// Hiển thị status updates
function showStatusUpdate(message) {
  // Tìm hoặc tạo status overlay
  let statusOverlay = document.getElementById('chongluadao-status-overlay');
  if (!statusOverlay) {
    statusOverlay = document.createElement('div');
    statusOverlay.id = 'chongluadao-status-overlay';
    statusOverlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(statusOverlay);
    
    // CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  statusOverlay.textContent = message;
  statusOverlay.style.display = 'block';
  
  // Auto hide sau 8 giây
  setTimeout(() => {
    if (statusOverlay && statusOverlay.style.display !== 'none') {
      statusOverlay.style.display = 'none';
    }
  }, 8000);
}

// Hiển thị cảnh báo URL nguy hiểm
function showUrlSafetyWarning(safetyData) {
  const { result, riskLevel, message, summary, details } = safetyData;
  
  // Tạo warning modal
  const modal = document.createElement('div');
  modal.id = 'chongluadao-warning-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  `;
  
  // Risk level colors
  const riskColors = {
    high: '#dc2626',
    medium: '#f59e0b', 
    low: '#10b981',
    unknown: '#6b7280'
  };
  
  const riskColor = riskColors[riskLevel] || riskColors.unknown;
  
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
      <h2 style="margin: 0; color: ${riskColor}; font-size: 24px;">Cảnh báo URL nguy hiểm!</h2>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        <strong>Mức độ rủi ro:</strong> ${riskLevel.toUpperCase()}<br>
        <strong>Thông báo:</strong> ${message}
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #374151;">Chi tiết kiểm tra:</h3>
      <p style="color: #6b7280; margin-bottom: 10px;">
        <strong>Tổng kết:</strong> ${summary?.total || 0} nguồn kiểm tra, 
        <span style="color: #10b981;">${summary?.safe || 0} an toàn</span>, 
        <span style="color: #dc2626;">${summary?.unsafe || 0} nguy hiểm</span>
      </p>
      
      ${details?.unsafe?.length > 0 ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
          <h4 style="margin: 0 0 8px 0; color: #dc2626;">Nguồn cảnh báo nguy hiểm:</h4>
          ${details.unsafe.map(item => `
            <div style="margin-bottom: 5px; color: #7f1d1d;">
              • <strong>${item.api.split('/').pop()}:</strong> ${item.note}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${details?.safe?.length > 0 ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px;">
          <h4 style="margin: 0 0 8px 0; color: #15803d;">Các nguồn xác nhận an toàn (${details.safe.length}):</h4>
          <div style="color: #166534; font-size: 13px;">
            ${details.safe.map(item => item.api.split('/').pop()).join(', ')}
          </div>
        </div>
      ` : ''}
    </div>
    
    <div style="text-align: center;">
      <button id="chongluadao-cancel-scan" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        margin-right: 10px;
      ">❌ Hủy quét</button>
      
      <button id="chongluadao-force-scan" style="
        background: #f59e0b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      ">🔍 Vẫn tiếp tục quét</button>
    </div>
    
    <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #6b7280;">
      💡 Khuyến nghị: Không nên tiếp tục nếu URL đã được nhiều nguồn đánh dấu nguy hiểm
    </p>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('chongluadao-cancel-scan').onclick = () => {
    modal.remove();
    showStatusUpdate("❌ Đã hủy quét theo yêu cầu người dùng");
  };
  
  document.getElementById('chongluadao-force-scan').onclick = () => {
    modal.remove();
    showStatusUpdate("🔍 Đang tiếp tục quét (bỏ qua cảnh báo)...");
    
    // Gửi message để tiếp tục quét với forceScan = true
    chrome.runtime.sendMessage({
      type: "RUN_CAPTURE_AND_ANALYZE",
      forceScan: true,
      captureMode: "FULL_PAGE" // Default mode
    });
  };
  
  // Click outside để đóng
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
      showStatusUpdate("❌ Đã hủy quét theo yêu cầu người dùng");
    }
  };
}

// Lắng nghe messages từ background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === "STATUS_UPDATE") {
    showStatusUpdate(message.message);
  } else if (message.type === "URL_SAFETY_WARNING") {
    showUrlSafetyWarning(message.data);
  }
});
