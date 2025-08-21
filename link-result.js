// Lấy thông tin từ URL parameters
const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url') || 'Không xác định';
const result = urlParams.get('result') || 'safe';
const riskLevel = urlParams.get('risk') || 'LOW';
const message = urlParams.get('message') || '';

// Hiển thị URL
document.getElementById('url-display').textContent = targetUrl;

function showSafeResult() {
    document.getElementById('result-icon').textContent = '✅';
    document.getElementById('result-title').textContent = 'Link An toàn!';
    document.getElementById('result-subtitle').textContent = 'Bạn có thể yên tâm truy cập';
    
    const resultContent = document.getElementById('result-content');
    resultContent.innerHTML = `
        <div class="result-box safe-box">
            <div class="box-title">✅ Kết quả kiểm tra</div>
            <div class="box-text">
                ChongLuaDao đã xác nhận rằng link này an toàn để truy cập. 
                Không phát hiện dấu hiệu lừa đảo hoặc mối đe dọa bảo mật nào.
            </div>
        </div>
        <div class="countdown-box">
            <div class="countdown-text">Tự động chuyển hướng trong <span id="countdown">3</span> giây...</div>
        </div>
    `;
    
    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = `
        <a href="${targetUrl}" class="btn btn-primary" id="access-btn">🌐 Truy cập Ngay</a>
        <button class="btn btn-secondary" id="whitelist-btn">✅ Thêm vào Whitelist</button>
        <button class="btn btn-secondary" id="close-btn">❌ Đóng</button>
    `;
    
    // Bind events
    document.getElementById('access-btn').addEventListener('click', function() {
        window.location.href = targetUrl;
    });
    
    document.getElementById('whitelist-btn').addEventListener('click', addToWhitelist);
    document.getElementById('close-btn').addEventListener('click', closeWindow);
    
    // Countdown timer
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.location.href = targetUrl;
        }
    }, 1000);
}

function showUnsafeResult() {
    document.getElementById('result-icon').textContent = '⚠️';
    document.getElementById('result-title').textContent = 'Link Nguy hiểm!';
    document.getElementById('result-subtitle').textContent = 'Phát hiện dấu hiệu lừa đảo';
    
    const resultContent = document.getElementById('result-content');
    resultContent.innerHTML = `
        <div class="result-box danger-box">
            <div class="box-title">⚠️ Cảnh báo bảo mật</div>
            <div class="box-text">
                ${message || 'ChongLuaDao đã phát hiện dấu hiệu nguy hiểm từ link này. ' +
                'Có thể là trang lừa đảo, chứa mã độc hoặc các mối đe dọa bảo mật khác.'}
            </div>
        </div>
    `;
    
    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = `
        <button class="btn btn-danger" id="report-btn">🚨 Báo cáo Lừa đảo</button>
        <button class="btn btn-warning" id="newtab-btn">⚠️ Vẫn Truy cập</button>
        <button class="btn btn-secondary" id="copy-btn">📋 Copy Link</button>
        <button class="btn btn-secondary" id="exit-btn">❌ Thoát</button>
    `;
    
    // Bind events
    document.getElementById('report-btn').addEventListener('click', reportPhishing);
    document.getElementById('newtab-btn').addEventListener('click', goToNewTab);
    document.getElementById('copy-btn').addEventListener('click', copyLink);
    document.getElementById('exit-btn').addEventListener('click', closeWindow);
}

function showErrorResult() {
    document.getElementById('result-icon').textContent = '❌';
    document.getElementById('result-title').textContent = 'Không thể Kiểm tra';
    document.getElementById('result-subtitle').textContent = 'Đã xảy ra lỗi trong quá trình kiểm tra';
    
    const resultContent = document.getElementById('result-content');
    resultContent.innerHTML = `
        <div class="result-box warning-box">
            <div class="box-title">❌ Lỗi kiểm tra</div>
            <div class="box-text">
                ${message || 'Không thể kết nối đến máy chủ kiểm tra hoặc xảy ra lỗi hệ thống. ' +
                'Vui lòng thử lại sau hoặc truy cập link với sự thận trọng.'}
            </div>
        </div>
    `;
    
    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = `
        <a href="${targetUrl}" class="btn btn-primary" id="access-btn">🌐 Vẫn Truy cập</a>
        <button class="btn btn-secondary" id="close-btn">❌ Đóng</button>
    `;
    
    // Bind events
    document.getElementById('access-btn').addEventListener('click', function() {
        window.location.href = targetUrl;
    });
    
    document.getElementById('close-btn').addEventListener('click', closeWindow);
}

function reportPhishing() {
    try {
        window.open('https://chongluadao.vn/report/reportphishing', '_blank');
    } catch (error) {
        console.error('Lỗi khi mở trang báo cáo:', error);
    }
}

function goToNewTab() {
    try {
        // Lấy tab hiện tại
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                const currentTabId = tabs[0].id;
                
                // Gửi message đến background script để cho phép điều hướng
                chrome.runtime.sendMessage({
                    type: 'ALLOW_NAVIGATION',
                    data: { 
                        url: targetUrl, 
                        tabId: currentTabId 
                    }
                }, (response) => {
                    if (response && response.success) {
                        console.log('Đã được phép điều hướng');
                    } else {
                        // Fallback: chuyển trực tiếp nếu không có response
                        window.location.href = targetUrl;
                    }
                });
            } else {
                // Fallback: chuyển trực tiếp nếu không lấy được tabId
                window.location.href = targetUrl;
            }
        });
    } catch (error) {
        console.error('Lỗi khi chuyển đến trang web:', error);
        // Fallback: chuyển trực tiếp nếu có lỗi
        window.location.href = targetUrl;
    }
}

function copyLink(event) {
    try {
        navigator.clipboard.writeText(targetUrl).then(() => {
            // Hiển thị thông báo copy thành công
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅ Đã Copy!';
            button.style.background = '#10b981';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#6b7280';
            }, 2000);
        }).catch(err => {
            console.error('Lỗi khi copy link:', err);
            alert('Không thể copy link. Vui lòng thử lại.');
        });
    } catch (error) {
        console.error('Lỗi khi copy link:', error);
    }
}

function closeWindow() {
    try {
        window.close();
    } catch (error) {
        console.error('Lỗi khi đóng cửa sổ:', error);
    }
}

function addToWhitelist() {
    try {
        chrome.runtime.sendMessage({
            type: 'ADD_TO_WHITELIST',
            data: { url: targetUrl }
        }, (response) => {
            if (response && response.success) {
                // Hiển thị thông báo thành công
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Đã thêm!';
                button.style.background = '#10b981';
                button.disabled = true;
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#6b7280';
                    button.disabled = false;
                }, 2000);
            }
        });
    } catch (error) {
        console.error('Lỗi khi thêm vào whitelist:', error);
    }
}

function removeFromWhitelist() {
    try {
        chrome.runtime.sendMessage({
            type: 'REMOVE_FROM_WHITELIST',
            data: { url: targetUrl }
        }, (response) => {
            if (response && response.success) {
                // Hiển thị thông báo thành công
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Đã xóa!';
                button.style.background = '#dc2626';
                button.disabled = true;
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#6b7280';
                    button.disabled = false;
                }, 2000);
            }
        });
    } catch (error) {
        console.error('Lỗi khi xóa khỏi whitelist:', error);
    }
}

// Hiển thị kết quả dựa trên trạng thái
try {
    if (result === 'safe') {
        showSafeResult();
    } else if (result === 'unsafe') {
        showUnsafeResult();
    } else {
        showErrorResult();
    }
} catch (error) {
    console.error('Lỗi khi hiển thị kết quả:', error);
}
