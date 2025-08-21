// Lấy URL từ URL parameters
const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url') || 'Không xác định';

// Hiển thị URL
document.getElementById('url-display').textContent = targetUrl;

// Hàm cập nhật bước progress
function updateStep(stepNumber) {
    // Reset tất cả các bước
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step-${i}`);
        step.classList.remove('active');
    }
    
    // Kích hoạt bước hiện tại
    if (stepNumber <= 3) {
        const currentStep = document.getElementById(`step-${stepNumber}`);
        currentStep.classList.add('active');
    }
}

// Bắt đầu animation
setTimeout(() => {
    updateStep(1); // Bước 1: Phân tích URL
}, 500);

setTimeout(() => {
    updateStep(2); // Bước 2: Kiểm tra bảo mật
}, 1500);

setTimeout(() => {
    updateStep(3); // Bước 3: Hoàn tất
}, 2500);

// Mô phỏng thời gian kiểm tra (3 giây)
setTimeout(() => {
    // Gửi thông báo về background script
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({
            type: 'LINK_CHECK_COMPLETE',
            data: { url: targetUrl }
        });
    }
}, 3000);
