// ── Shopping Page Controller ──
// Manages medicine browsing, search/filter, cart, and checkout flow.

let currentPage = 1;
const itemsPerPage = 20;
let cartData = { cart: [], total: 0 };
let currentSort = 'name';

// ── DOM References ──
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
const feedbackMessage = document.getElementById('feedbackMessage');
const successMessage = document.getElementById('successMessage');
const sortSelect = document.getElementById('sortSelect');
const conflictPrescriptionInput = document.getElementById('conflictPrescriptionInput');
const uploadConflictPrescriptionBtn = document.getElementById('uploadConflictPrescriptionBtn');
const continueCheckoutBtn = document.getElementById('continueCheckoutBtn');
const restrictedWarning = document.getElementById('restrictedWarning');

// Note: logoutBtn is handled by userNavbar.js (id="navLogoutBtn"), no longer in this script.

// ── Sort Control ──
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    fetchMedicines(1, getFilters());
  });
}

// ── Fetch & Display Medicines ──
async function fetchMedicines(page = 1, filters = {}) {
  try {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'block';

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
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
  }
}

function displayMedicines(medicines) {
  if (!medicinesGrid) return;
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
        <div class="price">৳${parseFloat(medicine.price).toFixed(2)}</div>
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
  if (!paginationContainer) return;
  paginationContainer.innerHTML = '';

  if (pagination.pages <= 1) return;

  for (let i = 1; i <= pagination.pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `pagination-btn ${i === pagination.page ? 'active' : ''}`;
    btn.addEventListener('click', () => {
      currentPage = i;
      fetchMedicines(i, getFilters());
      window.scrollTo(0, 0);
    });
    paginationContainer.appendChild(btn);
  }
}

// ── Filters ──
function getFilters() {
  const search = searchInput ? searchInput.value.trim() : '';
  const strength = (document.getElementById('strengthFilter')?.value || '').trim();
  const dosageForm = document.getElementById('dosageFilter')?.value || '';

  const filters = {};
  if (search) filters.search = search;
  if (strength) filters.strength = strength;
  if (dosageForm) filters.dosageForm = dosageForm;

  return filters;
}

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchMedicines(1, getFilters());
  });
}

if (applyFilterBtn) {
  applyFilterBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchMedicines(1, getFilters());
  });
}

if (clearFilterBtn) {
  clearFilterBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    const strengthEl = document.getElementById('strengthFilter');
    if (strengthEl) strengthEl.value = '';
    const dosageEl = document.getElementById('dosageFilter');
    if (dosageEl) dosageEl.value = '';
    currentPage = 1;
    fetchMedicines(1, {});
  });
}

// ── Add to Cart ──
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicine_id: medicineId, quantity })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess('Item added to cart');
      await updateCartSummary();
    } else {
      showError(data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showError('Error adding to cart');
  }
}

// ── Cart Summary ──
async function updateCartSummary() {
  try {
    const response = await fetch('/api/cart/view', { credentials: 'include' });
    cartData = await response.json();

    if (cartData.success) {
      if (cartCount) cartCount.textContent = cartData.cart.reduce((sum, item) => sum + item.quantity, 0);
      if (cartTotal) cartTotal.textContent = cartData.total.toFixed(2);
      updateRestrictedWarning(cartData.cart);
    }
  } catch (error) {
    console.error('Error updating cart:', error);
  }
}

function updateRestrictedWarning(cartItems) {
  if (!restrictedWarning) return;
  const hasRestricted = Array.isArray(cartItems) && cartItems.some(item => item.is_restricted);
  if (hasRestricted) {
    restrictedWarning.classList.remove('hidden');
  } else {
    restrictedWarning.classList.add('hidden');
  }
}

// ── Cart Modal ──
if (viewCartBtn) {
  viewCartBtn.addEventListener('click', async () => {
    await updateCartSummary();
    displayCartModal();
    if (cartModal) cartModal.style.display = 'flex';
  });
}

function displayCartModal() {
  const cartItemsList = document.getElementById('cartItemsList');
  if (!cartItemsList) return;
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
        <span>${item.quantity}x ৳${item.price.toFixed(2)}</span>
      </div>
      <div class="item-subtotal">
        ৳${item.subtotal.toFixed(2)}
      </div>
      <button class="btn-remove-item" data-medicine-id="${item.medicine_id}">Remove</button>
    `;
    cartItemsList.appendChild(div);
  });

  const totalEl = document.getElementById('cartTotalLarge');
  if (totalEl) totalEl.textContent = cartData.total.toFixed(2);

  document.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const medicineId = e.target.dataset.medicineId;
      try {
        const response = await fetch('/api/cart/remove', {
          method: 'POST',
          credentials: 'include',
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

// Close cart modal
const closeCartBtn = document.getElementById('closeCartBtn');
if (closeCartBtn) {
  closeCartBtn.addEventListener('click', () => {
    if (cartModal) cartModal.style.display = 'none';
  });
}

const continueShopping = document.getElementById('continueShopping');
if (continueShopping) {
  continueShopping.addEventListener('click', () => {
    if (cartModal) cartModal.style.display = 'none';
  });
}

const checkoutFromCart = document.getElementById('checkoutFromCart');
if (checkoutFromCart) {
  checkoutFromCart.addEventListener('click', () => {
    if (cartModal) cartModal.style.display = 'none';
    handleCheckout();
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', handleCheckout);
}

// ── Checkout & Conflict Handling ──
async function handleCheckout() {
  try {
    const response = await fetch('/api/cart/check-conflicts', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();

    if (!data.success) {
      showError('Failed to check conflicts');
      return;
    }

    if (data.conflicts && data.conflicts.length > 0) {
      displayConflicts(data.conflicts);
      if (conflictModal) conflictModal.style.display = 'flex';
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
  if (!conflictsList) return;
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

const closeConflictBtn = document.getElementById('closeConflictBtn');
if (closeConflictBtn) {
  closeConflictBtn.addEventListener('click', () => {
    if (conflictModal) conflictModal.style.display = 'none';
  });
}

const editCartBtn = document.getElementById('editCartBtn');
if (editCartBtn) {
  editCartBtn.addEventListener('click', () => {
    if (conflictModal) conflictModal.style.display = 'none';
    if (viewCartBtn) viewCartBtn.click();
  });
}

if (continueCheckoutBtn) {
  continueCheckoutBtn.addEventListener('click', () => {
    if (conflictModal) conflictModal.style.display = 'none';
    window.location.href = '/pages/Checkout.html';
  });
}

if (uploadConflictPrescriptionBtn) {
  uploadConflictPrescriptionBtn.addEventListener('click', async () => {
    if (!conflictPrescriptionInput || conflictPrescriptionInput.files.length === 0) {
      showError('Please select a prescription file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('prescription', conflictPrescriptionInput.files[0]);

    try {
      uploadConflictPrescriptionBtn.disabled = true;
      uploadConflictPrescriptionBtn.textContent = 'Uploading...';

      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showError(data.message || 'Failed to upload prescription');
        return;
      }

      showSuccess('Prescription uploaded. You can continue to checkout.');
      if (conflictModal) conflictModal.style.display = 'none';
      window.location.href = '/pages/Checkout.html';
    } catch (error) {
      console.error('Error uploading conflict prescription:', error);
      showError('Error uploading prescription');
    } finally {
      uploadConflictPrescriptionBtn.disabled = false;
      uploadConflictPrescriptionBtn.textContent = 'Upload and Continue';
    }
  });
}

// ── Feedback Messages ──
function showError(message) {
  if (feedbackMessage) {
    feedbackMessage.textContent = message;
    feedbackMessage.hidden = false;
    setTimeout(() => { feedbackMessage.hidden = true; }, 5000);
  }
}

function showSuccess(message) {
  if (successMessage) {
    successMessage.textContent = message;
    successMessage.hidden = false;
    setTimeout(() => { successMessage.hidden = true; }, 3000);
  }
}

// Close modals on backdrop click
window.addEventListener('click', (e) => {
  if (cartModal && e.target === cartModal) cartModal.style.display = 'none';
  if (conflictModal && e.target === conflictModal) conflictModal.style.display = 'none';
});

// ── Initialize: Load medicines on page load ──
fetchMedicines(1, {});
