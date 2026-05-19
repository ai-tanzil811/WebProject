let currentPage = 1;
const itemsPerPage = 20;
let cartData = { cart: [], total: 0 };
let currentSort = 'name';

const medicinesGrid = document.getElementById('medicinesGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const cartModal = document.getElementById('cartModal');
const conflictModal = document.getElementById('conflictModal');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const viewCartBtn = document.getElementById('viewCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const logoutBtn = document.getElementById('logoutBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const successMessage = document.getElementById('successMessage');
const sortSelect = document.getElementById('sortSelect');

logoutBtn.addEventListener('click', () => {
  window.location.href = '/pages/User_login.html';
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  currentPage = 1;
  fetchMedicines(1, getFilters());
});

async function fetchMedicines(page = 1, filters = {}) {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const params = new URLSearchParams({ page, limit: itemsPerPage, sort: currentSort, ...filters });
    const response = await fetch(`/api/medicines?${params}`);
    const data = await response.json();

    if (data.success) {
      displayMedicines(data.medicines);
      displayPagination(data.pagination);
    } else {
      showError('Failed to fetch medicines');
    }
  } catch (error) {
    console.error('Error fetching medicines:', error);
    showError('Error loading medicines');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

function displayMedicines(medicines) {
  medicinesGrid.innerHTML = '';
  if (medicines.length === 0) {
    medicinesGrid.innerHTML = '<p class="no-medicines">No medicines found</p>';
    return;
  }

  medicines.forEach(medicine => {
    const card = document.createElement('div');
    card.className = 'medicine-card';
    card.innerHTML = `
      <div class="medicine-header">
        <h3>${medicine.generic_name}</h3>
        ${medicine.is_restricted ? '<span class="badge-restricted">Restricted</span>' : ''}
      </div>
      <div class="medicine-details">
        <p><strong>Brand:</strong> ${medicine.brand_name}</p>
        <p><strong>Strength:</strong> ${medicine.strength || 'N/A'}</p>
        <p><strong>Form:</strong> ${medicine.dosage_form || 'N/A'}</p>
        <p><strong>Manufacturer:</strong> ${medicine.manufacturer || 'N/A'}</p>
      </div>
      <div class="medicine-stock">
        <p class="stock-status ${medicine.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
          ${medicine.quantity > 0 ? `In Stock (${medicine.quantity})` : 'Out of Stock'}
        </p>
      </div>
      <div class="medicine-footer">
        <div class="price">₱${parseFloat(medicine.price).toFixed(2)}</div>
        <div class="quantity-input">
          <input type="number" class="qty-input" min="1" max="${medicine.quantity}" value="1" data-medicine-id="${medicine.medicine_id}">
          <button class="btn-add-cart" data-medicine-id="${medicine.medicine_id}" ${medicine.quantity === 0 ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    `;
    medicinesGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', handleAddToCart);
  });
}

function displayPagination(pagination) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = '';

  if (pagination.pages <= 1) return;

  for (let i = 1; i <= pagination.pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `pagination-btn ${i === pagination.page ? 'active' : ''}`;
    btn.addEventListener('click', () => {
      currentPage = i;
      const filters = getFilters();
      fetchMedicines(i, filters);
      window.scrollTo(0, 0);
    });
    paginationContainer.appendChild(btn);
  }
}

function getFilters() {
  const search = searchInput.value.trim();
  const strength = document.getElementById('strengthFilter').value.trim();
  const dosageForm = document.getElementById('dosageFilter').value;

  const filters = {};
  if (search) filters.search = search;
  if (strength) filters.strength = strength;
  if (dosageForm) filters.dosageForm = dosageForm;

  return filters;
}

searchBtn.addEventListener('click', () => {
  currentPage = 1;
  fetchMedicines(1, getFilters());
});

applyFilterBtn.addEventListener('click', () => {
  currentPage = 1;
  fetchMedicines(1, getFilters());
});

clearFilterBtn.addEventListener('click', () => {
  searchInput.value = '';
  document.getElementById('strengthFilter').value = '';
  document.getElementById('dosageFilter').value = '';
  currentPage = 1;
  fetchMedicines(1, {});
});

async function handleAddToCart(e) {
  const medicineId = e.target.dataset.medicineId;
  const qtyInput = e.target.parentElement.querySelector('.qty-input');
  const quantity = parseInt(qtyInput.value);

  if (quantity < 1) {
    showError('Please enter a valid quantity');
    return;
  }

  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicine_id: medicineId, quantity })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess('Item added to cart');
      updateCartSummary();
    } else {
      showError(data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showError('Error adding to cart');
  }
}

async function updateCartSummary() {
  try {
    const response = await fetch('/api/cart/view');
    cartData = await response.json();

    if (cartData.success) {
      cartCount.textContent = cartData.cart.reduce((sum, item) => sum + item.quantity, 0);
      cartTotal.textContent = cartData.total.toFixed(2);
    }
  } catch (error) {
    console.error('Error updating cart:', error);
  }
}

viewCartBtn.addEventListener('click', async () => {
  await updateCartSummary();
  displayCartModal();
  cartModal.style.display = 'flex';
});

function displayCartModal() {
  const cartItemsList = document.getElementById('cartItemsList');
  cartItemsList.innerHTML = '';

  if (cartData.cart.length === 0) {
    cartItemsList.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    return;
  }

  cartData.cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="item-info">
        <h4>${item.generic_name} (${item.brand_name})</h4>
        <p class="item-strength">${item.strength || 'N/A'} - ${item.dosage_form || 'N/A'}</p>
      </div>
      <div class="item-quantity">
        <span>${item.quantity}x ₱${item.price.toFixed(2)}</span>
      </div>
      <div class="item-subtotal">
        ₱${item.subtotal.toFixed(2)}
      </div>
      <button class="btn-remove-item" data-medicine-id="${item.medicine_id}">Remove</button>
    `;
    cartItemsList.appendChild(div);
  });

  document.getElementById('cartTotalLarge').textContent = cartData.total.toFixed(2);

  document.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const medicineId = e.target.dataset.medicineId;
      try {
        const response = await fetch('/api/cart/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicine_id: medicineId })
        });

        const data = await response.json();
        if (data.success) {
          await updateCartSummary();
          displayCartModal();
        }
      } catch (error) {
        console.error('Error removing item:', error);
      }
    });
  });
}

document.getElementById('closeCartBtn').addEventListener('click', () => {
  cartModal.style.display = 'none';
});

document.getElementById('continueShopping').addEventListener('click', () => {
  cartModal.style.display = 'none';
});

document.getElementById('checkoutFromCart').addEventListener('click', () => {
  cartModal.style.display = 'none';
  handleCheckout();
});

checkoutBtn.addEventListener('click', handleCheckout);

async function handleCheckout() {
  try {
    const response = await fetch('/api/cart/check-conflicts', { method: 'POST' });
    const data = await response.json();

    if (!data.success) {
      showError('Failed to check conflicts');
      return;
    }

    if (data.conflicts && data.conflicts.length > 0) {
      displayConflicts(data.conflicts);
      conflictModal.style.display = 'flex';
    } else {
      window.location.href = '/pages/Checkout.html';
    }
  } catch (error) {
    console.error('Error checking conflicts:', error);
    showError('Error processing checkout');
  }
}

function displayConflicts(conflicts) {
  const conflictsList = document.getElementById('conflictsList');
  conflictsList.innerHTML = '';

  conflicts.forEach((conflict, index) => {
    const div = document.createElement('div');
    div.className = `conflict-item conflict-${conflict.conflict_level}`;
    div.innerHTML = `
      <h4>Conflict #${index + 1}: ${conflict.conflict_level.toUpperCase()}</h4>
      <p><strong>Description:</strong> ${conflict.description || 'Drug interaction detected'}</p>
      <p><strong>Recommendation:</strong> ${conflict.recommendation || 'Please consult a healthcare professional'}</p>
    `;
    conflictsList.appendChild(div);
  });
}

document.getElementById('closeConflictBtn').addEventListener('click', () => {
  conflictModal.style.display = 'none';
});

document.getElementById('editCartBtn').addEventListener('click', () => {
  conflictModal.style.display = 'none';
  viewCartBtn.click();
});

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

window.addEventListener('click', (e) => {
  if (e.target === cartModal) cartModal.style.display = 'none';
  if (e.target === conflictModal) conflictModal.style.display = 'none';
});

fetchMedicines(1, {});
