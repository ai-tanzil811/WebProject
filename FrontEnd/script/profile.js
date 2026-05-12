document.addEventListener('DOMContentLoaded', async () => {
  const roleEl = document.getElementById('profile-role');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const nidEl = document.getElementById('profile-nid');
  const ageEl = document.getElementById('profile-age');
  const photoEl = document.getElementById('profile-photo');
  const btnEdit = document.getElementById('btn-edit');
  const form = document.getElementById('profile-form');
  const btnSave = document.getElementById('btn-save');
  const btnCancel = document.getElementById('btn-cancel');
  const inputName = document.getElementById('input-name');
  const inputNid = document.getElementById('input-nid');
  const inputAge = document.getElementById('input-age');
  const inputPhoto = document.getElementById('input-photo');
  const editStatus = document.getElementById('edit-status');

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

    // populate edit inputs
    if (inputName) inputName.value = user.name || '';
    if (inputNid) inputNid.value = user.nid || '';
    if (inputAge) inputAge.value = user.age || '';

    // wire edit button
    if (btnEdit && form) {
      btnEdit.addEventListener('click', () => {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (btnCancel && form) {
      btnCancel.addEventListener('click', (e) => {
        e.preventDefault();
        form.style.display = 'none';
        editStatus.textContent = '';
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', async (e) => {
        e.preventDefault();
        editStatus.textContent = 'Saving...';
        try {
          const fd = new FormData();
          if (inputName && inputName.value) fd.append('name', inputName.value);
          if (inputNid && inputNid.value) fd.append('nid', inputNid.value);
          if (inputAge && inputAge.value) fd.append('age', inputAge.value);
          if (inputPhoto && inputPhoto.files && inputPhoto.files[0]) fd.append('photo', inputPhoto.files[0]);

          const res = await fetch('/api/auth/profile', {
            method: 'PATCH',
            credentials: 'include',
            body: fd
          });

          const result = await res.json();
          if (result && result.success && result.user) {
            // update display
            const u = result.user;
            nameEl.textContent = u.name || '—';
            nidEl.textContent = u.nid || '—';
            ageEl.textContent = u.age || '—';
            if (u.photo_image_path) photoEl.src = u.photo_image_path + '?v=' + Date.now();
            editStatus.textContent = 'Saved';
            setTimeout(() => { editStatus.textContent = ''; form.style.display = 'none'; }, 1000);
          } else {
            editStatus.textContent = result && result.message ? result.message : 'Save failed';
          }
        } catch (err) {
          console.error('Save profile failed', err);
          editStatus.textContent = 'Save failed';
        }
      });
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});
