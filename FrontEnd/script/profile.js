document.addEventListener('DOMContentLoaded', async () => {
  const roleEl = document.getElementById('profile-role');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const nidEl = document.getElementById('profile-nid');
  const ageEl = document.getElementById('profile-age');
  const photoEl = document.getElementById('profile-photo');

  try {
    const resp = await fetch('/api/auth/profile', { credentials: 'include' });
    if (resp.status === 401) {
      // Not authenticated, redirect to login
      window.location.href = '/pages/User_login.html';
      return;
    }

    const data = await resp.json();

    if (!data || !data.success || !data.user) {
      console.warn('Profile not available', data);
      return;
    }

    const user = data.user;

    roleEl.textContent = user.role || 'User';
    nameEl.textContent = user.name || '—';
    emailEl.textContent = user.email || '—';
    nidEl.textContent = user.nid || '—';
    ageEl.textContent = user.age || '—';

    if (user.photo_image_path) {
      // If server stores a relative path, use it directly.
      photoEl.src = user.photo_image_path;
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});
