const emailInput = document.getElementById('emailInput');
const emailDisplay = document.getElementById('emailDisplay');
const otpInput = document.getElementById('otpInput');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const feedback = document.querySelector('[data-feedback]');
const successMsg = document.querySelector('[data-success]');
const form = document.getElementById('forgotPasswordForm');

let resetToken = null;
let userType = 'user'; // 'user' or 'admin'

// Step navigation
const nextStepBtns = document.querySelectorAll('[data-next-step]');
const prevStepBtns = document.querySelectorAll('[data-prev-step]');

nextStepBtns.forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const currentStep = form.querySelector('.form-step.active');
    const stepNum = parseInt(currentStep.getAttribute('data-step'));

    if (stepNum === 1) handleEmailSubmit();
    else if (stepNum === 2) handleOtpSubmit();
    else if (stepNum === 3) handlePasswordSubmit();
  });
});

prevStepBtns.forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const currentStep = form.querySelector('.form-step.active');
    const stepNum = parseInt(currentStep.getAttribute('data-step'));
    goToStep(stepNum - 1);
  });
});

function goToStep(stepNumber) {
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');
  window.scrollTo(0, 0);
}

// Step 1: Email Submission
async function handleEmailSubmit() {
  clearMessages();

  const email = emailInput.value.trim();

  if (!email) {
    showError('Please enter your email address.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  try {
    const submitBtn = document.getElementById('submitEmailBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      userType = data.userType; // 'user' or 'admin'
      resetToken = data.resetToken;
      emailDisplay.textContent = email;
      showSuccess('Verification code sent! Check your email.');
      goToStep(2);
    } else {
      showError(data.message || 'Failed to send reset link.');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred. Please try again.');
  }
}

// Step 2: OTP Verification
async function handleOtpSubmit() {
  clearMessages();

  const otp = otpInput.value.trim();

  if (!otp || otp.length !== 6) {
    showError('Please enter a valid 6-digit code.');
    return;
  }

  try {
    const submitBtn = document.getElementById('submitOtpBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    const response = await fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value,
        resetCode: otp
      })
    });

    const data = await response.json();

    if (data.success) {
      resetToken = data.resetToken;
      showSuccess('Code verified! Set your new password.');
      goToStep(3);
    } else {
      showError(data.message || 'Invalid verification code.');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify Code';
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred. Please try again.');
  }
}

// Step 3: Password Reset
async function handlePasswordSubmit() {
  clearMessages();

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!newPassword || !confirmPassword) {
    showError('Please enter both passwords.');
    return;
  }

  if (newPassword !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  if (!isStrongPassword(newPassword)) {
    showError('Password does not meet requirements.');
    return;
  }

  try {
    const submitBtn = document.getElementById('submitPasswordBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value,
        resetToken: resetToken,
        newPassword: newPassword
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess('Password reset successful!');
      goToStep(4);

      const loginBtn = document.getElementById('loginRedirectBtn');
      const redirectUrl = userType === 'admin' ? '/pages/Admin_login.html' : '/pages/User_login.html';
      loginBtn.href = redirectUrl;
    } else {
      showError(data.message || 'Failed to reset password.');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Reset Password';
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred. Please try again.');
  }
}

// Password validation
newPasswordInput.addEventListener('input', function () {
  const password = this.value;

  updateRequirement('length', password.length >= 8);
  updateRequirement('uppercase', /[A-Z]/.test(password));
  updateRequirement('lowercase', /[a-z]/.test(password));
  updateRequirement('number', /[0-9]/.test(password));
});

function updateRequirement(type, met) {
  const req = document.querySelector(`[data-requirement="${type}"]`);
  if (met) {
    req.classList.add('met');
  } else {
    req.classList.remove('met');
  }
}

function isStrongPassword(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
}

// Password toggle
const passwordToggle = document.querySelector('[data-password-toggle]');
const confirmToggle = document.querySelector('[data-confirm-toggle]');

if (passwordToggle) {
  passwordToggle.addEventListener('click', function (e) {
    e.preventDefault();
    newPasswordInput.type = newPasswordInput.type === 'password' ? 'text' : 'password';
    this.textContent = newPasswordInput.type === 'password' ? 'Show' : 'Hide';
  });
}

if (confirmToggle) {
  confirmToggle.addEventListener('click', function (e) {
    e.preventDefault();
    confirmPasswordInput.type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    this.textContent = confirmPasswordInput.type === 'password' ? 'Show' : 'Hide';
  });
}

// Resend OTP
const resendBtn = document.querySelector('[data-resend-otp]');
if (resendBtn) {
  resendBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('New code sent to your email.');
      } else {
        showError('Failed to resend code.');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('An error occurred. Please try again.');
    }
  });
}

// Utility functions
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showError(message) {
  if (feedback) {
    feedback.hidden = false;
    feedback.textContent = message;
  }
}

function showSuccess(message) {
  if (successMsg) {
    successMsg.hidden = false;
    successMsg.textContent = message;
  }
}

function clearMessages() {
  if (feedback) feedback.hidden = true;
  if (successMsg) successMsg.hidden = true;
}
