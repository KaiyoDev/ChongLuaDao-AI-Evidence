// content-script.js - Xử lý hiển thị cảnh báo và status updates
console.log("ChongLuaDao Content Script loaded");

// Hiển thị status updates với thanh tiến trình
function showStatusUpdate(message, progress = null, step = null, totalSteps = null) {
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
      padding: 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      backdrop-filter: blur(10px);
      z-index: 999999;
      min-width: 320px;
      max-width: 400px;
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
      @keyframes progressGlow {
        0% { box-shadow: 0 0 5px rgba(255,255,255,0.3); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.6); }
        100% { box-shadow: 0 0 5px rgba(255,255,255,0.3); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Tạo nội dung với progress bar
  let content = `
    <div style="margin-bottom: ${progress !== null ? '15px' : '0'};">
      ${message}
    </div>
  `;
  
  if (progress !== null) {
    const percentage = Math.max(0, Math.min(100, progress));
    content += `
      <div style="margin-bottom: 10px;">
        <div style="
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          height: 8px;
          overflow: hidden;
        ">
          <div style="
            background: linear-gradient(90deg, #10b981, #34d399);
            height: 100%;
            width: ${percentage}%;
            border-radius: 10px;
            transition: width 0.3s ease;
            animation: progressGlow 2s infinite;
          "></div>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
          font-size: 12px;
          opacity: 0.9;
        ">
          <span>${percentage.toFixed(0)}%</span>
          ${step && totalSteps ? `<span>Bước ${step}/${totalSteps}</span>` : ''}
        </div>
      </div>
    `;
  }
  
  statusOverlay.innerHTML = content;
  statusOverlay.style.display = 'block';
  
  // Auto hide sau 8 giây (trừ khi có progress đang chạy)
  if (progress === null || progress >= 100) {
    setTimeout(() => {
      if (statusOverlay && statusOverlay.style.display !== 'none') {
        statusOverlay.style.display = 'none';
      }
    }, 8000);
  }
}

// Hiển thị thông báo kiểm tra link bắt đầu
function showLinkCheckStart(data) {
  const { url } = data;
  
  // Tạo modal kiểm tra link
  const modal = document.createElement('div');
  modal.id = 'chongluadao-link-check-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 40px;
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  `;
  
  content.innerHTML = `
    <div style="margin-bottom: 30px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
      <h2 style="margin: 0; color: #374151; font-size: 28px; font-weight: 600;">Đang kiểm tra link an toàn</h2>
    </div>
    
    <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
        <strong>URL:</strong> ${url}<br>
        <span style="font-size: 14px; opacity: 0.8;">Vui lòng chờ trong giây lát...</span>
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <div style="
        background: #e5e7eb;
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
        position: relative;
      ">
        <div style="
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          height: 100%;
          width: 0%;
          border-radius: 10px;
          animation: loadingProgress 2s infinite;
        "></div>
      </div>
    </div>
    
    <div style="color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 10px 0;">🛡️ ChongLuaDao đang phân tích:</p>
      <ul style="text-align: left; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Mức độ rủi ro của trang web</li>
        <li>Dấu hiệu lừa đảo và mã độc</li>
        <li>Thông tin bảo mật và SSL</li>
        <li>Danh tiếng domain</li>
      </ul>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // CSS animation cho loading
  const style = document.createElement('style');
  style.textContent = `
    @keyframes loadingProgress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// Hiển thị thông báo link an toàn
function showLinkCheckSafe(data) {
  const { url, urlSafety } = data;
  
  // Xóa modal kiểm tra nếu có
  const existingModal = document.getElementById('chongluadao-link-check-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Tạo thông báo an toàn
  const notification = document.createElement('div');
  notification.id = 'chongluadao-safe-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    backdrop-filter: blur(10px);
    z-index: 999999;
    min-width: 320px;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px;">
      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Link an toàn!</h3>
    </div>
    
    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.4;">
        <strong>URL:</strong> ${url}<br>
        <span style="opacity: 0.9;">Đang chuyển hướng trong giây lát...</span>
      </p>
    </div>
    
    <div style="text-align: center; font-size: 12px; opacity: 0.8;">
      🛡️ ChongLuaDao đã xác nhận an toàn
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Hiển thị thông báo lỗi kiểm tra link
function showLinkCheckError(data) {
  const { url, error } = data;
  
  // Xóa modal kiểm tra nếu có
  const existingModal = document.getElementById('chongluadao-link-check-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Tạo thông báo lỗi
  const notification = document.createElement('div');
  notification.id = 'chongluadao-error-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    backdrop-filter: blur(10px);
    z-index: 999999;
    min-width: 320px;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px;">
      <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Không thể kiểm tra</h3>
    </div>
    
    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.4;">
        <strong>URL:</strong> ${url}<br>
        <span style="opacity: 0.9;">Lỗi: ${error}</span>
      </p>
    </div>
    
    <div style="text-align: center; font-size: 12px; opacity: 0.8;">
      Vẫn sẽ chuyển hướng sau 2 giây
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Hiển thị cảnh báo URL nguy hiểm
function showUrlSafetyWarning(data) {
  const { urlSafety, isUnsafeUrl } = data;
  
  // Xóa modal kiểm tra nếu có
  const existingModal = document.getElementById('chongluadao-link-check-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Xác định thông tin hiển thị dựa trên loại cảnh báo
  let warningTitle, warningIcon, mainMessage, riskLevel, riskColor;
  
  if (isUnsafeUrl) {
    warningTitle = "Cảnh báo URL nguy hiểm!";
    warningIcon = "⚠️";
    mainMessage = urlSafety.message || "URL này được đánh dấu là nguy hiểm";
    riskLevel = urlSafety.riskLevel?.toUpperCase() || "HIGH";
    riskColor = "#dc2626";
  } else {
    warningTitle = "Thông báo an toàn";
    warningIcon = "ℹ️";
    mainMessage = "Đã phát hiện một số vấn đề cần lưu ý";
    riskLevel = "LOW";
    riskColor = "#10b981";
  }
  
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
  
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">${warningIcon}</div>
      <h2 style="margin: 0; color: ${riskColor}; font-size: 24px;">${warningTitle}</h2>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        <strong>Mức độ rủi ro:</strong> ${riskLevel}<br>
        <strong>Thông báo:</strong> ${mainMessage}
      </p>
    </div>
    

    
    ${isUnsafeUrl ? `
      <div style="margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #374151;">Chi tiết kiểm tra URL:</h3>
        <p style="color: #6b7280; margin-bottom: 10px;">
          <strong>Tổng kết:</strong> ${urlSafety?.summary?.total || 0} nguồn kiểm tra, 
          <span style="color: #10b981;">${urlSafety?.summary?.safe || 0} an toàn</span>, 
          <span style="color: #dc2626;">${urlSafety?.summary?.unsafe || 0} nguy hiểm</span>
        </p>
        
        ${urlSafety?.details?.unsafe?.length > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #dc2626;">Nguồn cảnh báo nguy hiểm:</h4>
            ${urlSafety.details.unsafe.map(item => `
              <div style="margin-bottom: 5px; color: #7f1d1d;">
                • <strong>${item.api.split('/').pop()}:</strong> ${item.note}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${urlSafety?.details?.safe?.length > 0 ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #15803d;">Các nguồn xác nhận an toàn (${urlSafety.details.safe.length}):</h4>
            <div style="color: #166534; font-size: 13px;">
              ${urlSafety.details.safe.map(item => item.api.split('/').pop()).join(', ')}
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
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
      ">❌ Tắt</button>
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
    //showStatusUpdate("❌ Đã hủy quét theo yêu cầu người dùng");
  };
  
  // Click outside để đóng
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
      //showStatusUpdate("❌ Đã hủy quét theo yêu cầu người dùng");
    }
  };
}

// Bỏ function showAnalysisComplete - không cần thông báo to nữa

// Lắng nghe messages từ background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === "STATUS_UPDATE") {
    showStatusUpdate(message.message, message.progress, message.step, message.totalSteps);
  } else if (message.type === "URL_SAFETY_WARNING") {
    showUrlSafetyWarning(message.data);
  } else if (message.type === "LINK_CHECK_START") {
    showLinkCheckStart(message.data);
  } else if (message.type === "LINK_CHECK_SAFE") {
    showLinkCheckSafe(message.data);
  } else if (message.type === "LINK_CHECK_ERROR") {
    showLinkCheckError(message.data);
  }
  // Bỏ ANALYSIS_COMPLETE - không cần thông báo to nữa
});
