/**
 * MediVault Registration Form Handler
 * Manages user and admin registration with validation and file uploads
 */

document.addEventListener('DOMContentLoaded', initializeRegistration);

function initializeRegistration() {
  const userForm = document.getElementById('userRegisterForm');
  const adminForm = document.getElementById('adminRegisterForm');

  if (userForm) setupFormHandler(userForm, 'user');
  if (adminForm) setupFormHandler(adminForm, 'admin');
}

/**
 * Setup all event listeners for a registration form
 */
function setupFormHandler(form, userType) {
  const panel = form.closest('.auth-panel');
  const feedback = panel.querySelector('[data-feedback]');
  const successMsg = panel.querySelector('[data-success]');
  const submitBtn = form.querySelector('[data-submit]');

  // Setup password visibility toggles
  setupPasswordToggle(form, '[data-password-toggle]', 'input[name="password"]');
  setupPasswordToggle(form, '[data-confirm-toggle]', 'input[name="confirmPassword"]');

  // Setup file input handlers
  const photoInput = form.querySelector('input[name="photo"]');
  const shopBannerInput = form.querySelector('input[name="shopBanner"]');

  if (photoInput) setupFileInput(photoInput);
  if (shopBannerInput) setupFileInput(shopBannerInput);

  // Setup form submission
  form.addEventListener('submit', e => handleRegistration(e, form, userType, submitBtn, feedback, successMsg));
}

/**
 * Setup password visibility toggle
 */
function setupPasswordToggle(form, toggleSelector, inputSelector) {
  const toggle = form.querySelector(toggleSelector);
  if (!toggle) return;

  toggle.addEventListener('click', e => {
    e.preventDefault();
    const input = form.querySelector(inputSelector);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? 'Hide' : 'Show';
  });
}

/**
 * Setup file input with drag-and-drop support
 */
function setupFileInput(fileInput) {
  const wrapper = fileInput.closest('.file-input-wrapper');
  if (!wrapper) return;

  const label = wrapper.querySelector('.file-input-label');
  const fileName = wrapper.querySelector('[data-file-name]');

  // File selection event
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = `✓ Selected: ${fileInput.files[0].name}`;
      fileName.hidden = false;
    }
  });

  // Drag and drop events
  const dragEvents = {
    dragenter: () => updateFileInputStyle(label, true),
    dragover: e => e.preventDefault(),
    dragleave: () => updateFileInputStyle(label, false),
    drop: e => handleFileDrop(e, fileInput, label)
  };

  Object.entries(dragEvents).forEach(([event, handler]) => {
    label.addEventListener(event, handler);
  });
}

/**
 * Update file input styling on drag
 */
function updateFileInputStyle(label, isDragging) {
  if (isDragging) {
    label.style.borderColor = 'rgba(29, 78, 216, 0.8)';
    label.style.background = 'var(--primary-soft)';
  } else {
    label.style.borderColor = '';
    label.style.background = '';
  }
}

/**
 * Handle file drop
 */
function handleFileDrop(e, fileInput, label) {
  e.preventDefault();
  e.stopPropagation();
  updateFileInputStyle(label, false);

  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Validate registration form inputs
 */
function validateRegistration(form, feedback) {
  const email = form.querySelector('input[name="email"]').value;
  const password = form.querySelector('input[name="password"]').value;
  const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;
  const terms = form.querySelector('input[name="terms"]').checked;

  // Check required fields
  if (!email || !password || !confirmPassword) {
    showError(feedback, 'Please fill in all required fields.');
    return false;
  }

  // Check password match
  if (password !== confirmPassword) {
    showError(feedback, 'Passwords do not match.');
    return false;
  }

  // Check password length
  if (password.length < 8) {
    showError(feedback, 'Password must be at least 8 characters long.');
    return false;
  }

  // Check terms agreement
  if (!terms) {
    showError(feedback, 'You must agree to the terms and conditions.');
    return false;
  }

  return true;
}

/**
 * Handle registration form submission
 */
async function handleRegistration(e, form, userType, submitBtn, feedback, successMsg) {
  e.preventDefault();

  // Clear previous messages
  clearMessages(feedback, successMsg);

  // Validate form
  if (!validateRegistration(form, feedback)) {
    return;
  }

  try {
    // Disable submit button
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = userType === 'admin' ? 'Creating admin account...' : 'Creating account...';

    const endpoint = userType === 'admin' ? '/api/auth/register-admin' : '/api/auth/register-user';

    const response = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(form)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showError(feedback, data.message || 'Registration failed. Please try again.');
      return;
    }

    // Success
    showSuccess(successMsg, data.message || 'Account created successfully! Redirecting to login...');
    form.reset();

    // Redirect after 2 seconds
    setTimeout(() => {
      const redirectUrl = userType === 'admin' ? '/pages/Admin_login.html' : '/pages/User_login.html';
      window.location.href = redirectUrl;
    }, 2000);

  } catch (error) {
    console.error('Registration error:', error);
    showError(feedback, 'Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = userType === 'admin' ? 'Create Admin Account' : 'Create Account';
  }
}

/**
 * Display error message
 */
function showError(element, message) {
  if (element) {
    element.hidden = false;
    element.textContent = message;
  }
}

/**
 * Display success message
 */
function showSuccess(element, message) {
  if (element) {
    element.hidden = false;
    element.textContent = message;
  }
}

/**
 * Clear all messages
 */
function clearMessages(feedback, successMsg) {
  if (feedback) feedback.hidden = true;
  if (successMsg) successMsg.hidden = true;
}

