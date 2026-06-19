
document.addEventListener('DOMContentLoaded', initializeLogin);

function initializeLogin() {
  document.querySelectorAll('.auth-shell').forEach(initializeShell);
}

function initializeShell(shell) {
  const form = shell.querySelector('.auth-form');
  const roleInput = shell.querySelector('input[name="login_role"]');
  const emailField = shell.querySelector('input[name="email"]');
  const passwordField = shell.querySelector('input[name="password"]');
  const roleCards = Array.from(shell.querySelectorAll('.role-card'));
  const passwordToggle = shell.querySelector('[data-password-toggle]');
  const submitButton = shell.querySelector('[data-submit]');
  const feedback = shell.querySelector('[data-feedback]');
  const defaultRole = shell.dataset.defaultRole || 'user';

  // Role text configuration
  const roleConfig = {
    user: {
      label: 'Secure sign in',
      title: 'User Access',
      subtitle: 'Use your clinical email and password to continue.',
      submit: 'Sign in as User',
    },
    admin: {
      label: 'Administrative sign in',
      title: 'Administrator Access',
      subtitle: 'Use your administrator email and password to continue.',
      submit: 'Sign in as Administrator',
    },
  };

  // Display error if present in URL
  displayUrlError(feedback);

  // Setup role selection buttons
  roleCards.forEach(card => {
    card.addEventListener('click', () => applyRole(card.dataset.role));
  });

  // Setup password visibility toggle
  if (passwordToggle && passwordField) {
    passwordToggle.addEventListener('click', () => togglePasswordVisibility(passwordField, passwordToggle));
  }

  // Setup form submission
  if (form) {
    form.addEventListener('submit', e => handleLoginSubmit(e, form, emailField, passwordField, roleInput, submitButton, feedback));
  }

  // Apply default role on page load
  applyRole(defaultRole);

  // Apply role changes
  function applyRole(role) {
    const selectedRole = roleConfig[role] ? role : 'user';
    const config = roleConfig[selectedRole];

    // Update form inputs
    if (roleInput) roleInput.value = selectedRole;
    if (form) form.dataset.role = selectedRole;

    // Update UI text
    updateRoleLabels(shell, config);

    // Highlight selected role card
    roleCards.forEach(card => {
      card.classList.toggle('active', card.dataset.role === selectedRole);
    });
  }
}

/**
 * Updates all role-related labels in the UI
 */
function updateRoleLabels(shell, config) {
  const elements = {
    '[data-role-label]': 'label',
    '[data-role-title]': 'title',
    '[data-role-subtitle]': 'subtitle',
    '[data-submit]': 'submit',
  };

  Object.entries(elements).forEach(([selector, key]) => {
    const el = shell.querySelector(selector);
    if (el) el.textContent = config[key];
  });
}

/**
 * Displays error message if present in URL
 */
function displayUrlError(feedback) {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  if (feedback && error) {
    feedback.hidden = false;
    feedback.textContent = error === 'invalid_credentials'
      ? 'Invalid email or password.'
      : 'Please complete all required fields.';
  }
}

/**
 * Toggles password field visibility
 */
function togglePasswordVisibility(passwordField, toggle) {
  const isHidden = passwordField.type === 'password';
  passwordField.type = isHidden ? 'text' : 'password';
  toggle.textContent = isHidden ? 'Hide' : 'Show';
}

/**
 * Handles login form submission
 */
async function handleLoginSubmit(e, form, emailField, passwordField, roleInput, submitButton, feedback) {
  e.preventDefault();

  const email = emailField?.value?.trim() || '';
  const password = passwordField?.value || '';
  const login_role = roleInput?.value || 'user';

  // Validate input
  if (!email || !password) {
    showError(feedback, 'Please enter both email and password.');
    return;
  }

  try {
    // Disable button during submission
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Signing in...';
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, login_role }),
    });

    const data = await response.json();

    if (data.success && data.redirect) {
      // Login successful - redirect
      window.location.href = data.redirect;
    } else {
      // Login failed
      showError(feedback, data.message || 'Login failed. Please check your credentials.');
    }

  } catch (error) {
    console.error('Login error:', error);
    showError(feedback, 'Network error. Please check your connection.');
  } finally {
    // Re-enable button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = form.querySelector('[data-submit]')?.textContent || 'Sign in';
    }
  }
}

/**
 * Displays error message
 */
function showError(feedback, message) {
  if (feedback) {
    feedback.hidden = false;
    feedback.textContent = message;
  }
}
