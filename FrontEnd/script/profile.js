document.addEventListener('DOMContentLoaded', async () => {
  const isAdminPage = document.body && document.body.classList && document.body.classList.contains('admin-page');
  const adminLoginUrl = '/pages/Admin_login.html';
  const userLoginUrl = '/pages/User_login.html';

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

  const emptyValue = '-';
  const isFormVisible = () => {
    if (!form) {
      return false;
    }

    if (form.hidden) {
      return false;
    }

    return form.style.display !== 'none';
  };

  const setFormVisible = (visible) => {
    if (!form) {
      return;
    }

    form.hidden = !visible;
    form.style.display = visible ? 'block' : 'none';
  };

  try {
    const resp = await fetch('/api/auth/profile', { credentials: 'include' });
    if (resp.status === 401) {
      window.location.href = isAdminPage ? adminLoginUrl : userLoginUrl;
      return;
    }

    const data = await resp.json();

    if (!data || !data.success || !data.user) {
      console.warn('Profile not available', data);
      return;
    }

    const user = data.user;
    const userRole = user.role || 'user';

    if (isAdminPage && userRole !== 'admin') {
      window.location.href = adminLoginUrl;
      return;
    }

    if (!isAdminPage && userRole === 'admin') {
      window.location.href = '/pages/Admin_profile.html';
      return;
    }

    if (roleEl) roleEl.textContent = userRole;
    if (nameEl) nameEl.textContent = user.name || emptyValue;
    if (emailEl) emailEl.textContent = user.email || emptyValue;
    if (nidEl) nidEl.textContent = user.nid || emptyValue;
    if (ageEl) ageEl.textContent = user.age || emptyValue;

    if (user.photo_image_path && photoEl) {
      photoEl.src = user.photo_image_path;
      photoEl.hidden = false;
    } else if (photoEl) {
      photoEl.hidden = true;
    }

    if (inputName) inputName.value = user.name || '';
    if (inputNid) inputNid.value = user.nid || '';
    if (inputAge) inputAge.value = user.age || '';

    if (btnEdit && form) {
      btnEdit.addEventListener('click', () => {
        setFormVisible(!isFormVisible());
      });
    }

    if (btnCancel && form && editStatus) {
      btnCancel.addEventListener('click', (e) => {
        e.preventDefault();
        setFormVisible(false);
        editStatus.textContent = '';
      });
    }

    if (btnSave && form && editStatus) {
      btnSave.addEventListener('click', async (e) => {
        e.preventDefault();
        editStatus.textContent = 'Saving...';

        try {
          const fd = new FormData();
          if (inputName && inputName.value) fd.append('name', inputName.value);
          if (inputNid && inputNid.value && !isAdminPage) fd.append('nid', inputNid.value);
          if (inputAge && inputAge.value && !isAdminPage) fd.append('age', inputAge.value);
          if (inputPhoto && inputPhoto.files && inputPhoto.files[0]) fd.append('photo', inputPhoto.files[0]);

          const res = await fetch('/api/auth/profile', {
            method: 'PATCH',
            credentials: 'include',
            body: fd
          });

          const result = await res.json();
          if (res.ok && result && result.success && result.user) {
            const updatedUser = result.user;
            if (nameEl) nameEl.textContent = updatedUser.name || emptyValue;
            if (nidEl) nidEl.textContent = updatedUser.nid || emptyValue;
            if (ageEl) ageEl.textContent = updatedUser.age || emptyValue;
            if (updatedUser.photo_image_path && photoEl) {
              photoEl.src = `${updatedUser.photo_image_path}?v=${Date.now()}`;
              photoEl.hidden = false;
            }
            editStatus.textContent = 'Saved';
            setTimeout(() => {
              editStatus.textContent = '';
              setFormVisible(false);
            }, 1000);
          } else {
            editStatus.textContent = result && result.message ? result.message : 'Save failed';
          }
        } catch (err) {
          console.error('Save profile failed', err);
          editStatus.textContent = 'Save failed';
        }
      });
    }

    const prescriptionStatus = document.getElementById('prescription-status');
    const prescriptionFileName = document.getElementById('prescription-file-name');
    const prescriptionNotes = document.getElementById('prescription-notes');
    const prescriptionTimestamp = document.getElementById('prescription-timestamp');
    const prescriptionUploadForm = document.getElementById('prescription-upload-form');
    const prescriptionInput = document.getElementById('prescription-input');
    const uploadFeedback = document.getElementById('upload-feedback');
    const hasPrescriptionSection = prescriptionStatus && prescriptionFileName && prescriptionNotes && prescriptionTimestamp;

    async function loadPrescriptionStatus() {
      if (!hasPrescriptionSection) {
        return;
      }

      try {
        const response = await fetch('/api/prescriptions/my', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Unable to load prescription status');
        }

        const result = await response.json();
        if (result && result.success && result.upload) {
          prescriptionStatus.textContent = result.upload.status || 'Pending';
          prescriptionFileName.innerHTML = result.upload.file_path
            ? `<a href="${result.upload.file_path}" target="_blank">${result.upload.file_name}</a>`
            : result.upload.file_name || emptyValue;
          prescriptionNotes.textContent = result.upload.review_notes || 'Waiting for admin review';
          prescriptionTimestamp.textContent = result.upload.updated_at
            ? new Date(result.upload.updated_at).toLocaleString()
            : result.upload.created_at
              ? new Date(result.upload.created_at).toLocaleString()
              : emptyValue;
        } else {
          prescriptionStatus.textContent = 'No prescription uploaded yet';
          prescriptionFileName.textContent = emptyValue;
          prescriptionNotes.textContent = emptyValue;
          prescriptionTimestamp.textContent = emptyValue;
        }
      } catch (err) {
        console.error('Failed to load prescription status:', err);
      }
    }

    if (!isAdminPage && prescriptionUploadForm && uploadFeedback && prescriptionInput) {
      prescriptionUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        uploadFeedback.textContent = 'Uploading...';

        const file = prescriptionInput.files && prescriptionInput.files[0];
        if (!file) {
          uploadFeedback.textContent = 'Please select a prescription file first.';
          return;
        }

        const fd = new FormData();
        fd.append('prescription', file);

        try {
          const res = await fetch('/api/prescriptions/upload', {
            method: 'POST',
            credentials: 'include',
            body: fd
          });
          const result = await res.json();
          if (res.ok && result && result.success) {
            uploadFeedback.textContent = 'Prescription uploaded successfully.';
            await loadPrescriptionStatus();
            prescriptionInput.value = '';
          } else {
            uploadFeedback.textContent = result.message || 'Upload failed.';
          }
        } catch (err) {
          console.error('Prescription upload failed:', err);
          uploadFeedback.textContent = 'Upload failed. Please try again.';
        }
      });
    }

    if (!isAdminPage) {
      await loadPrescriptionStatus();
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});
