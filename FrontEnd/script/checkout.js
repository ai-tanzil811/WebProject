const checkoutForm = document.getElementById('checkoutForm');
const summaryItems = document.getElementById('summaryItems');
const totalAmount = document.getElementById('totalAmount');
const totalAmountMobile = document.getElementById('totalAmountMobile');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const successMessage = document.getElementById('successMessage');
const successModal = document.getElementById('successModal');
const conflictModal = document.getElementById('conflictModal');
const checkoutConflictList = document.getElementById('checkoutConflictList');
const prescriptionGroup = document.getElementById('prescriptionGroup');
const prescriptionReuseNotice = document.getElementById('prescriptionReuseNotice');
const returnToCartBtn = document.getElementById('returnToCartBtn');
const notificationCount = document.getElementById('checkoutNotificationCount');
let hasReusablePrescriptionForConflict = false;
let latestPrescriptionStatus = '';
const userLoginUrl = '/pages/User_login.html';

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

async function loadLatestPrescriptionStatus() {
  try {
    const response = await fetch('/api/prescriptions/my', { credentials: 'include' });
    const data = await readJsonResponse(response);
    if (!response.ok || !data || !data.success || !data.upload) {
      hasReusablePrescriptionForConflict = false;
      latestPrescriptionStatus = '';
      return;
    }

    const status = String(data.upload.status || '').toLowerCase();
    latestPrescriptionStatus = status;
    hasReusablePrescriptionForConflict = status === 'pending' || status === 'approved';
  } catch (_error) {
    hasReusablePrescriptionForConflict = false;
    latestPrescriptionStatus = '';
  }
}

function redirectToLogin(message = 'Your session expired. Please log in again.') {
  showError(message);
  setTimeout(() => {
    window.location.href = userLoginUrl;
  }, 800);
}

async function loadCartSummary() {
  try {
    await loadLatestPrescriptionStatus();

    const response = await fetch('/api/cart/view', { credentials: 'include' });
    const data = await readJsonResponse(response);

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok || !data || !data.success || !Array.isArray(data.cart) || data.cart.length === 0) {
      window.location.href = '/pages/Shopping.html';
      return;
    }

    displaySummary(data);
    await updatePrescriptionRequirement(data.cart);
  } catch (error) {
    console.error('Error loading cart:', error);
    showError('Failed to load order summary');
  }
}

async function updatePrescriptionRequirement(cartItems) {
  const hasRestrictedItems = Array.isArray(cartItems) && cartItems.some((item) => item.is_restricted);
  let hasConflicts = false;

  try {
    const conflictResponse = await fetch('/api/cart/check-conflicts', {
      method: 'POST',
      credentials: 'include'
    });
    const conflictData = await readJsonResponse(conflictResponse);
    hasConflicts = Boolean(conflictData && conflictData.success && conflictData.conflicts && conflictData.conflicts.length > 0);
  } catch (_error) {
    hasConflicts = false;
  }

  const prescriptionRequired = hasRestrictedItems || (hasConflicts && !hasReusablePrescriptionForConflict);

  if (prescriptionGroup) {
    prescriptionGroup.classList.toggle('hidden', !prescriptionRequired);
  }

  const prescriptionLabel = document.querySelector('label[for="prescription"]');
  if (prescriptionLabel) {
    prescriptionLabel.textContent = prescriptionRequired
      ? 'Upload Prescription (Required for restricted medicines or interaction conflicts)'
      : 'Upload Prescription (Optional)';
  }

  const prescriptionInput = document.getElementById('prescription');
  if (prescriptionInput) {
    prescriptionInput.required = prescriptionRequired;
  }

  if (prescriptionReuseNotice) {
    if (hasConflicts && hasReusablePrescriptionForConflict && !hasRestrictedItems) {
      const statusLabel = latestPrescriptionStatus || 'pending';
      prescriptionReuseNotice.textContent = `Using your previously uploaded prescription (${statusLabel}) for conflict review. No re-upload is needed.`;
      prescriptionReuseNotice.classList.remove('hidden');
    } else if (hasConflicts && hasReusablePrescriptionForConflict && hasRestrictedItems) {
      prescriptionReuseNotice.textContent = 'A previous prescription was found, but this order contains restricted medicines, so you still need to upload a prescription for this checkout.';
      prescriptionReuseNotice.classList.remove('hidden');
    } else {
      prescriptionReuseNotice.textContent = '';
      prescriptionReuseNotice.classList.add('hidden');
    }
  }
}

function displaySummary(data) {
  summaryItems.innerHTML = '';

  data.cart.forEach(item => {
    const itemPrice = toNumber(item.price);
    const itemSubtotal = toNumber(item.subtotal, itemPrice * toNumber(item.quantity));
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML = `
      <div class="item-details">
        <h4>${item.generic_name}</h4>
        <p class="item-meta">${item.brand_name} - ${item.strength || 'N/A'}</p>
        <p class="item-form">${item.dosage_form || 'N/A'}</p>
      </div>
      <div class="item-quantity">
        <span class="qty-badge">${item.quantity}x</span>
      </div>
      <div class="item-price">
        <p class="price-per">₱${itemPrice.toFixed(2)}</p>
        <p class="price-total">₱${itemSubtotal.toFixed(2)}</p>
      </div>
    `;
    summaryItems.appendChild(div);
  });

  const total = toNumber(data.total);
  totalAmount.textContent = total.toFixed(2);
  totalAmountMobile.textContent = total.toFixed(2);
}

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const prescriptionInput = document.getElementById('prescription');

  if (!deliveryAddress) {
    showError('Please enter a delivery address');
    return;
  }

  try {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';

    await loadLatestPrescriptionStatus();

    const cartResponse = await fetch('/api/cart/view', { credentials: 'include' });
    const cartData = await readJsonResponse(cartResponse);

    if (cartResponse.status === 401) {
      redirectToLogin();
      return;
    }

    if (!cartResponse.ok || !cartData || !cartData.success || !cartData.cart || cartData.cart.length === 0) {
      showError('Your cart is empty. Please add medicines before checkout.');
      window.location.href = '/pages/Shopping.html';
      return;
    }

    const conflictResponse = await fetch('/api/cart/check-conflicts', {
      method: 'POST',
      credentials: 'include'
    });
    const conflictData = await readJsonResponse(conflictResponse);
    if (conflictResponse.status === 401) {
      redirectToLogin();
      return;
    }

    if (!conflictResponse.ok || !conflictData || !conflictData.success) {
      showError('Failed to validate cart conflicts. Please try again.');
      return;
    }

    if (
      conflictData.conflicts
      && conflictData.conflicts.length > 0
      && (!prescriptionInput || prescriptionInput.files.length === 0)
      && !hasReusablePrescriptionForConflict
    ) {
      displayCheckoutConflicts(conflictData.conflicts);
      showError('A prescription upload is required to continue with conflicting medicines.');

      if (prescriptionGroup) {
        prescriptionGroup.classList.remove('hidden');
      }

      if (prescriptionInput) {
        prescriptionInput.required = true;
      }

      return;
    }

    const formData = new FormData();
    formData.append('deliveryAddress', deliveryAddress);
    if (notes) {
      formData.append('notes', notes);
    }

    if (prescriptionInput && prescriptionInput.files.length > 0) {
      formData.append('prescription', prescriptionInput.files[0]);
    }

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await readJsonResponse(response);

    if (response.ok && data && data.success) {
      displaySuccessModal(data.order_id);
    } else if (response.status === 401) {
      redirectToLogin();
    } else {
      showError((data && data.message) || 'Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    showError('Error placing order. Please try again.');
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';
  }
});

function displayCheckoutConflicts(conflicts) {
  if (checkoutConflictList) {
    checkoutConflictList.innerHTML = '';

    conflicts.forEach((conflict) => {
      const item = document.createElement('div');
      item.className = `checkout-conflict ${conflict.conflict_level || 'moderate'}`;
      item.innerHTML = `
        <strong>${conflict.medicine_1_name || 'Medicine'} + ${conflict.medicine_2_name || 'Medicine'}</strong>
        <p>${conflict.description || 'A drug interaction was detected.'}</p>
        <p>${conflict.recommendation || 'Please remove one of the medicines before checkout.'}</p>
      `;
      checkoutConflictList.appendChild(item);
    });
  }

  if (conflictModal) {
    conflictModal.style.display = 'flex';
  }
}

function displaySuccessModal(orderId) {
  document.getElementById('orderIdDisplay').textContent = orderId;
  successModal.style.display = 'flex';

  document.getElementById('continueBtn').onclick = () => {
    window.location.href = '/pages/Shopping.html';
  };
}

function showError(message) {
  feedbackMessage.textContent = message;
  feedbackMessage.hidden = false;
  setTimeout(() => { feedbackMessage.hidden = true; }, 5000);
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.hidden = false;
  setTimeout(() => { successMessage.hidden = true; }, 3000);
}

async function loadNotificationCount() {
  if (!notificationCount) {
    return;
  }

  try {
    const response = await fetch('/api/notifications/unread-count', { credentials: 'include' });
    const data = await readJsonResponse(response);
    const unreadCount = data && data.success ? Number.parseInt(data.unreadCount, 10) || 0 : 0;
    if (unreadCount > 0) {
      notificationCount.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      notificationCount.hidden = false;
    } else {
      notificationCount.hidden = true;
    }
  } catch (_error) {
    notificationCount.hidden = true;
  }
}

if (returnToCartBtn) {
  returnToCartBtn.addEventListener('click', () => {
    window.location.href = '/pages/Shopping.html';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === conflictModal) conflictModal.style.display = 'none';
  if (e.target === successModal) successModal.style.display = 'none';
});

loadCartSummary();
loadNotificationCount();
