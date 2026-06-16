/**
 * MediVault Password Reset Form Handler
 * Refactored for consistency and efficiency.
 */

// ========== DOM Elements ==========
const elements = {
    form: document.getElementById('forgotPasswordForm'),
    emailInput: document.getElementById('emailInput'),
    emailDisplay: document.getElementById('emailDisplay'),
    otpInput: document.getElementById('otpInput'),
    newPasswordInput: document.getElementById('newPasswordInput'),
    confirmPasswordInput: document.getElementById('confirmPasswordInput'),
    feedback: document.querySelector('[data-feedback]'),
    successMsg: document.querySelector('[data-success]'),
    loginBtn: document.getElementById('loginRedirectBtn')
};

// ========== State Variables ==========
let state = {
    resetToken: null,
    userType: 'user'
};

// ========== Initialization ==========
document.querySelectorAll('[data-next-step]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleNextStep();
    });
});

document.querySelectorAll('[data-prev-step]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(elements.form.querySelector('.form-step.active').dataset.step);
        goToStep(currentStep - 1);
    });
});

document.querySelector('[data-resend-otp]')?.addEventListener('click', handleResendOTP);

// ========== Navigation Logic ==========
function goToStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    const target = document.querySelector(`[data-step="${stepNumber}"]`);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

async function handleNextStep() {
    const currentStepNum = parseInt(elements.form.querySelector('.form-step.active').dataset.step);
    
    const handlers = {
        1: handleEmailSubmit,
        2: handleOtpSubmit,
        3: handlePasswordSubmit
    };

    if (handlers[currentStepNum]) {
        await handlers[currentStepNum]();
    }
}

// ========== Step 1: Email Verification ==========
async function handleEmailSubmit() {
    clearMessages();
    const email = elements.emailInput.value.trim();
    const btn = document.getElementById('submitEmailBtn');

    if (!isValidEmail(email)) return showError('Please enter a valid email address.');

    try {
        setLoading(btn, true, 'Sending...');
        const response = await postData('/api/auth/request-password-reset', { email });

        if (response.success) {
            state.userType = response.userType;
            state.resetToken = response.resetToken;
            elements.emailDisplay.textContent = email;
            showSuccess('Verification code sent!');
            goToStep(2);
        } else {
            showError(response.message || 'Verification failed.');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        setLoading(btn, false, 'Send Reset Link');
    }
}

// ========== Step 2: OTP Verification ==========
async function handleOtpSubmit() {
    clearMessages();
    const otp = elements.otpInput.value.trim();
    const btn = document.getElementById('submitOtpBtn');

    if (!/^\d{6}$/.test(otp)) return showError('Enter a valid 6-digit code.');

    try {
        setLoading(btn, true, 'Verifying...');
        const response = await postData('/api/auth/verify-reset-code', {
            email: elements.emailInput.value,
            resetCode: otp
        });

        if (response.success) {
            state.resetToken = response.resetToken;
            showSuccess('Code verified!');
            goToStep(3);
        } else {
            showError(response.message || 'Invalid code.');
        }
    } catch (err) {
        showError('Network error.');
    } finally {
        setLoading(btn, false, 'Verify Code');
    }
}

// ========== Step 3: Password Reset ==========
async function handlePasswordSubmit() {
    clearMessages();
    const newPass = elements.newPasswordInput.value;
    const confirmPass = elements.confirmPasswordInput.value;
    const btn = document.getElementById('submitPasswordBtn');

    if (newPass !== confirmPass) return showError('Passwords do not match.');
    if (!isStrongPassword(newPass)) return showError('Password is too weak.');

    try {
        setLoading(btn, true, 'Resetting...');
        const response = await postData('/api/auth/reset-password', {
            email: elements.emailInput.value,
            resetToken: state.resetToken,
            newPassword: newPass
        });

        if (response.success) {
            elements.loginBtn.href = state.userType === 'admin' ? '/pages/Admin_login.html' : '/pages/User_login.html';
            goToStep(4);
        } else {
            showError(response.message || 'Reset failed.');
        }
    } catch (err) {
        showError('Network error.');
    } finally {
        setLoading(btn, false, 'Reset Password');
    }
}

// ========== Helpers & Utilities ==========
async function postData(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

function setLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = text;
}

function showError(msg) {
    elements.feedback.hidden = false;
    elements.feedback.textContent = msg;
}

function showSuccess(msg) {
    elements.successMsg.hidden = false;
    elements.successMsg.textContent = msg;
}

function clearMessages() {
    elements.feedback.hidden = true;
    elements.successMsg.hidden = true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(p) {
    return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);
}

// Password Requirements UI
elements.newPasswordInput.addEventListener('input', function() {
    const p = this.value;
    const updateReq = (type, met) => {
        document.querySelector(`[data-requirement="${type}"]`)?.classList.toggle('met', met);
    };
    updateReq('length', p.length >= 8);
    updateReq('uppercase', /[A-Z]/.test(p));
    updateReq('lowercase', /[a-z]/.test(p));
    updateReq('number', /[0-9]/.test(p));
});

// Visibility Toggles
[
    { toggle: '[data-password-toggle]', input: elements.newPasswordInput },
    { toggle: '[data-confirm-toggle]', input: elements.confirmPasswordInput }
].forEach(item => {
    document.querySelector(item.toggle)?.addEventListener('click', function(e) {
        e.preventDefault();
        const isPass = item.input.type === 'password';
        item.input.type = isPass ? 'text' : 'password';
        this.textContent = isPass ? 'Hide' : 'Show';
    });
});