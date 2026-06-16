document.addEventListener("DOMContentLoaded", () => {
  const stats = {
    total: document.getElementById("stat-total"),
    low: document.getElementById("stat-low"),
    expiring: document.getElementById("stat-expiring"),
    reviews: document.getElementById("stat-reviews")
  };
  const prescriptionList = document.getElementById('prescriptionList');
  const reservesList = document.getElementById('reservesList');
  const adminLoginUrl = '/pages/Admin_login.html';

  const ensureAdminSession = async () => {
    try {
      const response = await fetch('/api/auth/status', { credentials: 'include' });
      const data = await response.json();

      if (!data || !data.authenticated || !data.user || data.user.role !== 'admin') {
        window.location.href = adminLoginUrl;
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking admin session:', error);
      window.location.href = adminLoginUrl;
      return false;
    }
  };

  // Modal handling
  const modal = document.getElementById("addMedicineModal");
  const reportModal = document.getElementById("complianceReportModal");
  const form = document.getElementById("addMedicineForm");
  const addMedicineBtn = document.getElementById("addMedicineBtn");
  const exportReportBtn = document.getElementById("exportReportBtn");
  const closeBtn = document.querySelector(".modal-close");
  const closeReportBtn = document.querySelector(".modal-close-report");
  const cancelBtn = document.querySelector(".modal-cancel");

  // Open modal
  const openModal = () => {
    modal.classList.remove("hidden");
  };

  // Close modal
  const closeModal = () => {
    modal.classList.add("hidden");
    form.reset();
  };

  // Close report modal
  const closeReportModal = () => {
    reportModal.classList.add("hidden");
  };

  // Display compliance report
  const displayComplianceReport = (data) => {
    const reportContent = document.getElementById("reportContent");
    
    let html = `
      <div class="report-section">
        <h3>Inventory Summary</h3>
        <div class="report-grid">
          <div class="report-stat">
            <span class="stat-label">Total Medicines</span>
            <span class="stat-value">${data.inventory_summary.total_medicines}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Inventory Value</span>
            <span class="stat-value">$${data.inventory_summary.total_inventory_value}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Low Stock Items</span>
            <span class="stat-value warning">${data.inventory_summary.low_stock_items}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Out of Stock</span>
            <span class="stat-value danger">${data.inventory_summary.out_of_stock_items}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Expired</span>
            <span class="stat-value danger">${data.inventory_summary.expired_medicines}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Expiring Soon</span>
            <span class="stat-value warning">${data.inventory_summary.expiring_soon}</span>
          </div>
          <div class="report-stat">
            <span class="stat-label">Restricted</span>
            <span class="stat-value">${data.inventory_summary.restricted_medicines}</span>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>Today's Orders</h3>
        <div class="report-summary">
          <div class="summary-item">
            <span>Orders Count:</span>
            <strong>${data.todays_orders.count}</strong>
          </div>
          <div class="summary-item">
            <span>Total Quantity:</span>
            <strong>${data.todays_orders.total_quantity} units</strong>
          </div>
          <div class="summary-item">
            <span>Total Value:</span>
            <strong>$${data.todays_orders.total_value}</strong>
          </div>
        </div>
        ${data.todays_orders.orders.length > 0 ? `
          <div class="orders-list">
            ${data.todays_orders.orders.map(order => `
              <div class="order-item">
                <div class="order-header">
                  <span class="order-id">Order #${order.order_id}</span>
                  <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-details">
                  <div><strong>Customer:</strong> ${order.customer_name}</div>
                  <div><strong>Time:</strong> ${order.order_date}</div>
                  <div><strong>Medicines:</strong> ${order.medicines}</div>
                  <div><strong>Quantity:</strong> ${order.quantity} units</div>
                  <div><strong>Amount:</strong> $${order.amount}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="no-data">No orders today</p>'}
      </div>

      <div class="report-section">
        <h3>Orders from Last ${data.parameters.last_days} Days</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders Count</th>
              <th>Total Quantity</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${data.last_days_orders.data.map(day => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString()}</td>
                <td>${day.orders_count}</td>
                <td>${day.total_quantity} units</td>
                <td>$${day.total_value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h3>Reserved Medicines</h3>
        <div class="report-summary">
          <div class="summary-item">
            <span>Total Reserved Quantity:</span>
            <strong>${data.reserved_medicines.total_quantity} units</strong>
          </div>
          <div class="summary-item">
            <span>Pending Orders:</span>
            <strong>${data.reserved_medicines.pending_orders}</strong>
          </div>
        </div>
        ${data.reserved_medicines.medicines.length > 0 ? `
          <table class="report-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Strength</th>
                <th>Reserved Qty</th>
                <th>Orders</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.reserved_medicines.medicines.map(med => `
                <tr>
                  <td><strong>${med.generic_name}</strong><br>${med.brand_name}</td>
                  <td>${med.strength}</td>
                  <td>${med.reserved_quantity} units</td>
                  <td>${med.order_count}</td>
                  <td><span class="status-tag">${med.order_statuses}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No reserved medicines</p>'}
      </div>

      <div class="report-footer">
        <p>Report generated: ${data.generated_at}</p>
      </div>
    `;

    reportContent.innerHTML = html;
  };

  // Export compliance report
  const exportReport = async () => {
    exportReportBtn.disabled = true;
    exportReportBtn.textContent = "Generating...";

    try {
      const response = await fetch("/api/admin/export/compliance-report", { credentials: 'include' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate report");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to generate report");
      }

      // Display report in modal
      displayComplianceReport(result.data);
      reportModal.classList.remove("hidden");

      showNotification("Report generated successfully!", "success");
    } catch (error) {
      console.error("Error exporting report:", error);
      showNotification(error.message || "Failed to generate report", "error");
    } finally {
      exportReportBtn.disabled = false;
      exportReportBtn.textContent = "Export Compliance Report";
    }
  };

  // Event listeners for modal
  if (addMedicineBtn) {
    addMedicineBtn.addEventListener("click", openModal);
  }
  if (exportReportBtn) {
    exportReportBtn.addEventListener("click", exportReport);
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
  if (closeReportBtn) {
    closeReportBtn.addEventListener("click", closeReportModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  // Close modal on backdrop click
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });
  }

  const reportBackdrop = document.querySelector("#complianceReportModal .modal-backdrop");
  if (reportBackdrop) {
    reportBackdrop.addEventListener("click", (e) => {
      if (e.target === reportBackdrop) {
        closeReportModal();
      }
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Adding...";

      try {
        const formData = new FormData(form);
        const data = {
          genericName: formData.get("genericName"),
          brandName: formData.get("brandName"),
          strength: formData.get("strength") || null,
          dosageForm: formData.get("dosageForm") || null,
          manufacturer: formData.get("manufacturer") || null,
          batchNumber: formData.get("batchNumber") || null,
          expiryDate: formData.get("expiryDate") || null,
          quantity: parseInt(formData.get("quantity"), 10) || 0,
          price: parseFloat(formData.get("price")) || null,
          isRestricted: formData.get("isRestricted") ? true : false,
          description: formData.get("description") || null
        };

        const response = await fetch("/api/medicines", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to add medicine");
        }

        // Success
        showNotification("Medicine added successfully!", "success");
        closeModal();

        // Optionally refresh dashboard stats
        loadDashboardData();
      } catch (error) {
        console.error("Error adding medicine:", error);
        showNotification(error.message || "Failed to add medicine", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Medicine";
      }
    });
  }

  // Notification helper
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      z-index: 2000;
      animation: slideInRight 0.3s ease;
    `;

    if (type === "success") {
      notification.style.background = "#15803d";
      notification.style.color = "white";
    } else if (type === "error") {
      notification.style.background = "#dc2626";
      notification.style.color = "white";
    } else {
      notification.style.background = "var(--blue)";
      notification.style.color = "white";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Load dashboard data
  const loadDashboardData = () => {
    fetch("/api/admin/dashboard", { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Dashboard data unavailable");
        }
        stats.total.textContent = data.stats.totalMedicines;
        stats.low.textContent = data.stats.lowStockAlerts;
        stats.expiring.textContent = data.stats.expiringSoon;
        stats.reviews.textContent = data.stats.pendingReviews;
        renderRecentReserves(data.reservedMedicines);
      })
      .catch(() => {
        if (reservesList) {
          reservesList.innerHTML = "<p class='panel-text'>Unable to load recent reserves.</p>";
        }
      });
  };

  const renderRecentReserves = (items) => {
    if (!reservesList) return;

    if (!items || items.length === 0) {
      reservesList.innerHTML = '<p class="panel-text">No recent reserves.</p>';
      return;
    }

    reservesList.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'reserve-item';
      row.innerHTML = `
        <div class="reserve-info">
          <div class="reserve-name"><strong>${item.generic_name}</strong> ${item.brand_name ? `(${item.brand_name})` : ''}</div>
          <div class="reserve-meta">Strength: ${item.strength || 'N/A'}</div>
          <div class="reserve-meta">Reserved: ${item.reserved_quantity || 0} units</div>
        </div>
        <div class="reserve-status">${item.order_statuses || 'pending'}</div>
      `;
      reservesList.appendChild(row);
    });
  };

  const loadPendingPrescriptions = () => {
    if (!prescriptionList) return;
    prescriptionList.innerHTML = "<p class='panel-text'>Loading pending prescription uploads...</p>";

    fetch('/api/prescriptions/pending', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load pending prescriptions');
        }
        return response.json();
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || 'Unable to load pending prescriptions');
        }

        if (!data.uploads || data.uploads.length === 0) {
          prescriptionList.innerHTML = '<p class="panel-text">No pending prescription uploads.</p>';
          return;
        }

        prescriptionList.innerHTML = '';
        data.uploads.forEach((upload) => {
          const item = document.createElement('div');
          item.className = 'prescription-item';

          item.innerHTML = `
            <div class="prescription-info">
              <div><strong>${upload.user_name}</strong> (${upload.user_email})</div>
              <div class="prescription-meta">File: <a href="${upload.file_path}" target="_blank">${upload.file_name}</a></div>
              <div class="prescription-meta">Uploaded: ${new Date(upload.created_at).toLocaleString()}</div>
              <div class="prescription-meta">Notes: ${upload.review_notes || 'Awaiting review'}</div>
            </div>
            <div class="prescription-actions">
              <button data-id="${upload.upload_id}" class="btn-approve">Approve</button>
              <button data-id="${upload.upload_id}" class="btn-reject">Reject</button>
            </div>
          `;

          const approveBtn = item.querySelector('.btn-approve');
          const rejectBtn = item.querySelector('.btn-reject');

          approveBtn.addEventListener('click', () => handlePrescriptionAction(upload.upload_id, 'approve'));
          rejectBtn.addEventListener('click', () => handlePrescriptionAction(upload.upload_id, 'reject'));

          prescriptionList.appendChild(item);
        });
      })
      .catch((err) => {
        console.error('Error loading pending prescriptions:', err);
        prescriptionList.innerHTML = '<p class="panel-text">Unable to load pending prescription uploads.</p>';
      });
  };

  const handlePrescriptionAction = async (id, action) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}/${action}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: action === 'approve' ? 'Approved by admin' : 'Rejected by admin' })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${action} prescription`);
      }
      showNotification(`Prescription ${action}d successfully`, 'success');
      loadPendingPrescriptions();
      loadDashboardData();
    } catch (err) {
      console.error(`Error ${action}ing prescription:`, err);
      showNotification(err.message || `Unable to ${action} prescription`, 'error');
    }
  };

  // Initial load
  ensureAdminSession().then((isAdmin) => {
    if (!isAdmin) {
      return;
    }

    loadDashboardData();
    loadPendingPrescriptions();
  });

  // Add CSS for animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(20px);
      }
    }
  `;
  document.head.appendChild(style);
});
