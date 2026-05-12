document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.auth-shell').forEach((shell) => {
    const form = shell.querySelector('.auth-form');
    const roleInput = shell.querySelector('input[name="login_role"]');
    const roleCards = Array.from(shell.querySelectorAll('.role-card'));
    const roleLabel = shell.querySelector('[data-role-label]');
    const roleTitle = shell.querySelector('[data-role-title]');
    const roleSubtitle = shell.querySelector('[data-role-subtitle]');
    const submitButton = shell.querySelector('[data-submit]');
    const passwordField = shell.querySelector('input[name="password"]');
    const passwordToggle = shell.querySelector('[data-password-toggle]');
    const feedback = shell.querySelector('[data-feedback]');
    const defaultRole = shell.dataset.defaultRole || 'user';
    const emailField = shell.querySelector('input[name="email"]');

    const roleCopy = {
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

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (feedback && error) {
      feedback.hidden = false;
      feedback.textContent = error === 'invalid_credentials'
        ? 'Invalid email or password.'
        : 'Please complete all required fields.';
    }

    function applyRole(role) {
      const normalizedRole = roleCopy[role] ? role : 'user';
      const copy = roleCopy[normalizedRole];

      if (roleInput) {
        roleInput.value = normalizedRole;
      }

      if (roleLabel) {
        roleLabel.textContent = copy.label;
      }

      if (roleTitle) {
        roleTitle.textContent = copy.title;
      }

      if (roleSubtitle) {
        roleSubtitle.textContent = copy.subtitle;
      }

      if (submitButton) {
        submitButton.textContent = copy.submit;
      }

      if (form) {
        form.dataset.role = normalizedRole;
      }

      roleCards.forEach((card) => {
        card.classList.toggle('active', card.dataset.role === normalizedRole);
      });
    }

    roleCards.forEach((card) => {
      card.addEventListener('click', () => {
        applyRole(card.dataset.role);
      });
    });

    if (passwordToggle && passwordField) {
      passwordToggle.addEventListener('click', () => {
        const isHidden = passwordField.type === 'password';
        passwordField.type = isHidden ? 'text' : 'password';
        passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailField?.value || '';
        const password = passwordField?.value || '';
        const login_role = roleInput?.value || 'user';

        if (!email || !password) {
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = 'Please complete all required fields.';
          }
          return;
        }

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, login_role }),
          });

          const data = await response.json();

          if (data.success) {
            window.location.href = data.redirect;
          } else {
            if (feedback) {
              feedback.hidden = false;
              feedback.textContent = data.message || 'Login failed. Please try again.';
            }
          }
        } catch (error) {
          console.error('Login error:', error);
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = 'An error occurred. Please try again.';
          }
        }
      });
    }

    applyRole(defaultRole);
  });
});