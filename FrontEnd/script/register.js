// User Registration Form
const userRegisterForm = document.getElementById('userRegisterForm');
if (userRegisterForm) {
  setupFormHandler(userRegisterForm, 'user');
}

// Admin Registration Form
const adminRegisterForm = document.getElementById('adminRegisterForm');
if (adminRegisterForm) {
  setupFormHandler(adminRegisterForm, 'admin');
}

function setupFormHandler(form, type) {
  const feedback = form.closest('.auth-panel').querySelector('[data-feedback]');
  const successMsg = form.closest('.auth-panel').querySelector('[data-success]');
  const submitBtn = form.querySelector('[data-submit]');

  // Password toggle for password field
  const passwordToggle = form.querySelector('[data-password-toggle]');
  if (passwordToggle) {
    passwordToggle.addEventListener('click', function (e) {
      e.preventDefault();
      const passwordInput = form.querySelector('input[name="password"]');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.textContent = 'Hide';
      } else {
        passwordInput.type = 'password';
        passwordToggle.textContent = 'Show';
      }
    });
  }

  // Password toggle for confirm password field
  const confirmToggle = form.querySelector('[data-confirm-toggle]');
  if (confirmToggle) {
    confirmToggle.addEventListener('click', function (e) {
      e.preventDefault();
      const confirmInput = form.querySelector('input[name="confirmPassword"]');
      if (confirmInput.type === 'password') {
        confirmInput.type = 'text';
        confirmToggle.textContent = 'Hide';
      } else {
        confirmInput.type = 'password';
        confirmToggle.textContent = 'Show';
      }
    });
  }

  // File input handlers
  const photoInput = form.querySelector('input[name="photo"]');
  if (photoInput) {
    setupFileInput(photoInput);
  }

  const shopBannerInput = form.querySelector('input[name="shopBanner"]');
  if (shopBannerInput) {
    setupFileInput(shopBannerInput);
  }

  // Form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Hide previous messages
    if (feedback) feedback.hidden = true;
    if (successMsg) successMsg.hidden = true;

    // Get form values
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;
    const terms = form.querySelector('input[name="terms"]').checked;

    // Validate
    if (!email || !password || !confirmPassword) {
      showError(feedback, 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      showError(feedback, 'Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      showError(feedback, 'Password must be at least 8 characters long.');
      return;
    }

    if (!terms) {
      showError(feedback, 'You must agree to the terms and conditions.');
      return;
    }

    // Submit form
    submitForm(form, type, submitBtn, feedback, successMsg);
  });
}

function setupFileInput(fileInput) {
  const fileInputWrapper = fileInput.closest('.file-input-wrapper');
  const fileLabel = fileInputWrapper.querySelector('.file-input-label');
  const fileName = fileInputWrapper.querySelector('[data-file-name]');

  // File change event
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      fileName.textContent = '✓ Selected: ' + fileInput.files[0].name;
      fileName.hidden = false;
    }
  });

  // Drag and drop events
  fileLabel.addEventListener('dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.style.borderColor = 'rgba(29, 78, 216, 0.8)';
    fileLabel.style.background = 'var(--primary-soft)';
  });

  fileLabel.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
  });

  fileLabel.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.style.borderColor = '';
    fileLabel.style.background = '';
  });

  fileLabel.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.style.borderColor = '';
    fileLabel.style.background = '';

    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  });
}

async function submitForm(form, type, submitBtn, feedback, successMsg) {
  const endpoint = type === 'admin' ? '/api/auth/register-admin' : '/api/auth/register-user';

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = type === 'admin' ? 'Creating admin account...' : 'Creating account...';

    const formData = new FormData(form);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      const message = data.message || 'Account created successfully! Redirecting to login...';
      showSuccess(successMsg, message);
      form.reset();

      setTimeout(() => {
        const redirectUrl = type === 'admin' ? '/pages/Admin_login.html' : '/pages/User_login.html';
        window.location.href = redirectUrl;
      }, 2000);
    } else {
      showError(feedback, data.message || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showError(feedback, 'An error occurred during registration. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = type === 'admin' ? 'Create Admin Account' : 'Create Account';
  }
}

function showError(element, message) {
  if (element) {
    element.hidden = false;
    element.textContent = message;
  }
}

function showSuccess(element, message) {
  if (element) {
    element.hidden = false;
    element.textContent = message;
  }
}
