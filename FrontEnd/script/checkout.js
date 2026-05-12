const checkoutForm = document.getElementById('checkoutForm');
const summaryItems = document.getElementById('summaryItems');
const totalAmount = document.getElementById('totalAmount');
const totalAmountMobile = document.getElementById('totalAmountMobile');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const successMessage = document.getElementById('successMessage');
const successModal = document.getElementById('successModal');

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

async function loadCartSummary() {
  try {
    const response = await fetch('/api/cart/view', { credentials: 'include' });
    const data = await readJsonResponse(response);

    if (!response.ok || !data || !data.success || !Array.isArray(data.cart) || data.cart.length === 0) {
      window.location.href = '/pages/Shopping.html';
      return;
    }

    displaySummary(data);
  } catch (error) {
    console.error('Error loading cart:', error);
    showError('Failed to load order summary');
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

  if (!deliveryAddress) {
    showError('Please enter a delivery address');
    return;
  }

  try {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';

    const cartResponse = await fetch('/api/cart/view', { credentials: 'include' });
    const cartData = await readJsonResponse(cartResponse);
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
    if (!conflictResponse.ok || !conflictData || !conflictData.success) {
      showError('Failed to validate cart conflicts. Please try again.');
      return;
    }

    if (conflictData.conflicts && conflictData.conflicts.length > 0) {
      showError('Drug interaction conflicts found in your cart. Resolve conflicts before placing the order.');
      window.location.href = '/pages/Shopping.html';
      return;
    }

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryAddress,
        notes: notes || null
      })
    });

    const data = await readJsonResponse(response);

    if (response.ok && data && data.success) {
      displaySuccessModal(data.order_id);
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

loadCartSummary();
