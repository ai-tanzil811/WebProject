const checkoutForm = document.getElementById('checkoutForm');
const summaryItems = document.getElementById('summaryItems');
const totalAmount = document.getElementById('totalAmount');
const totalAmountMobile = document.getElementById('totalAmountMobile');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const successMessage = document.getElementById('successMessage');
const successModal = document.getElementById('successModal');

async function loadCartSummary() {
  try {
    const response = await fetch('/api/cart/view');
    const data = await response.json();

    if (!data.success || data.cart.length === 0) {
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
        <p class="price-per">₱${item.price.toFixed(2)}</p>
        <p class="price-total">₱${item.subtotal.toFixed(2)}</p>
      </div>
    `;
    summaryItems.appendChild(div);
  });

  totalAmount.textContent = data.total.toFixed(2);
  totalAmountMobile.textContent = data.total.toFixed(2);
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

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryAddress,
        notes: notes || null
      })
    });

    const data = await response.json();

    if (data.success) {
      displaySuccessModal(data.order_id);
    } else {
      showError(data.message || 'Failed to place order');
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

  document.getElementById('continueBtn').addEventListener('click', () => {
    window.location.href = '/pages/Shopping.html';
  });
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
