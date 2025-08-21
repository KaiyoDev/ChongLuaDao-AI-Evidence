const $ = (s) => document.querySelector(s);

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

// Load configuration
async function loadConfig() {
  try {
    const config = await chrome.storage.sync.get([
      'geminiApiKeys',
      'geminiModel',
      'geminiEndpointBase',
      'userEmail',
      'apiHeaders',
      'autoCheckUrl',
      'whitelistUrls'
    ]);

    // Convert array to textarea format
    const apiKeys = config.geminiApiKeys || [];
    $('#geminiApiKeys').value = apiKeys.join('\n');
    $('#geminiModel').value = config.geminiModel || 'gemini-1.5-pro';
    $('#geminiEndpointBase').value = config.geminiEndpointBase || '';
    $('#userEmail').value = config.userEmail || '';
    $('#apiHeaders').value = config.apiHeaders || '';
    $('#autoCheckUrl').checked = config.autoCheckUrl || false;
    $('#whitelistUrls').value = (config.whitelistUrls || []).join('\n');
    
    showToast("⚙️ Đã tải cấu hình", "success");
  } catch (error) {
    showToast("❌ Lỗi khi tải cấu hình", "error");
    console.error('Load config error:', error);
  }
}

// Save configuration
async function saveConfig() {
  try {
    // Parse API keys from textarea
    const apiKeysText = $('#geminiApiKeys').value.trim();
    const apiKeys = apiKeysText.split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    const whitelistText = $('#whitelistUrls').value.trim();
    const whitelistUrls = whitelistText.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const config = {
      geminiApiKeys: apiKeys,
      geminiModel: $('#geminiModel').value,
      geminiEndpointBase: $('#geminiEndpointBase').value.trim(),
      userEmail: $('#userEmail').value.trim(),
      apiHeaders: $('#apiHeaders').value.trim(),
      autoCheckUrl: $('#autoCheckUrl').checked,
      whitelistUrls
    };

    // Validate required fields
    if (apiKeys.length === 0) {
      showToast("❌ Vui lòng nhập ít nhất 1 Gemini API Key", "error");
      $('#geminiApiKeys').focus();
      return;
    }

    // Validate API keys format
    const invalidKeys = apiKeys.filter(key => !key.startsWith('AIza'));
    if (invalidKeys.length > 0) {
      showToast(`⚠️ ${invalidKeys.length} API Key không đúng định dạng (phải bắt đầu bằng 'AIza')`, "warning");
    }

    // Validate JSON headers if provided
    if (config.apiHeaders) {
      try {
        JSON.parse(config.apiHeaders);
      } catch (e) {
        showToast("❌ Headers JSON không hợp lệ", "error");
        $('#apiHeaders').focus();
        return;
      }
    }

    await chrome.storage.sync.set(config);
    showToast("✅ Đã lưu cấu hình thành công", "success");
    
    // Hide status after success
    setTimeout(() => {
      hideStatus();
    }, 2000);
    
  } catch (error) {
    showToast("❌ Lỗi khi lưu cấu hình", "error");
    console.error('Save config error:', error);
  }
}

// Test API connection
async function testAPI() {
  try {
    // Parse API keys from textarea
    const apiKeysText = $('#geminiApiKeys').value.trim();
    const apiKeys = apiKeysText.split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (apiKeys.length === 0) {
      showToast("❌ Vui lòng nhập ít nhất 1 API Key trước", "error");
      $('#geminiApiKeys').focus();
      return;
    }

    const model = $('#geminiModel').value;
    const endpointBase = $('#geminiEndpointBase').value.trim() || 'https://generativelanguage.googleapis.com';

    showToast(`🧪 Đang test ${apiKeys.length} API keys...`, "info");

    // Test first API key
    const apiKey = apiKeys[0];
    const testPrompt = "Hãy trả lời ngắn gọn: 'Test thành công'";
    const url = `${endpointBase}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      showToast(`✅ Test thành công! ${apiKeys.length} API keys đã sẵn sàng.`, "success");
    } else {
      throw new Error("Phản hồi API không đúng định dạng");
    }

  } catch (error) {
    console.error('API test error:', error);
    
    if (error.message.includes('API_KEY_INVALID')) {
      showToast("❌ API Key không hợp lệ", "error");
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      showToast("❌ Đã vượt quá hạn mức API", "error");
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      showToast("❌ Model không tồn tại", "error");
    } else {
      showToast(`❌ Lỗi kết nối: ${error.message}`, "error");
    }
  }
}

// Form validation
function validateForm() {
  // Parse API keys from textarea
  const apiKeysText = $('#geminiApiKeys').value.trim();
  const apiKeys = apiKeysText.split('\n')
    .map(key => key.trim())
    .filter(key => key.length > 0);

  const email = $('#userEmail').value.trim();
  const headers = $('#apiHeaders').value.trim();

  // API Keys validation
  if (apiKeys.length === 0) {
    showToast("❌ Vui lòng nhập ít nhất 1 API Key", "error");
    $('#geminiApiKeys').focus();
    return false;
  }

  const invalidKeys = apiKeys.filter(key => !key.startsWith('AIza'));
  if (invalidKeys.length > 0) {
    showToast(`⚠️ ${invalidKeys.length} API Key không đúng định dạng`, "warning");
  }

  // Email validation
  if (email && !isValidEmail(email)) {
    showToast("❌ Email không hợp lệ", "error");
    $('#userEmail').focus();
    return false;
  }

  // Headers JSON validation
  if (headers) {
    try {
      JSON.parse(headers);
    } catch (e) {
      showToast("❌ Headers JSON không hợp lệ", "error");
      $('#apiHeaders').focus();
      return false;
    }
  }

  return true;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Auto-save on input change
function setupAutoSave() {
  const inputs = ['#geminiApiKeys', '#geminiModel', '#geminiEndpointBase', '#userEmail', '#apiHeaders'];
  
  inputs.forEach(selector => {
    const element = $(selector);
    if (element) {
      element.addEventListener('input', debounce(() => {
        if (validateForm()) {
          saveConfig();
        }
      }, 1000));
    }
  });
}

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  
  // Load configuration
  loadConfig();
  
  // Setup auto-save
  setupAutoSave();
  
  // Event listeners
  $('#save').addEventListener('click', saveConfig);
  $('#test').addEventListener('click', testAPI);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          saveConfig();
          break;
        case 't':
          e.preventDefault();
          testAPI();
          break;
      }
    }
  });
  
  // Show welcome message
  setTimeout(() => {
    showToast("🛡️ ChongLuaDao AI Evidence - Cấu hình", "info");
  }, 500);
});
