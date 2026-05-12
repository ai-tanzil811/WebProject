document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("inventorySearch");
  const strengthInput = document.getElementById("inventoryStrength");
  const dosageSelect = document.getElementById("inventoryDosage");
  const filterGroup = document.getElementById("inventoryFilters");
  const tableBody = document.querySelector("[data-role='inventory-body']");
  const inventoryStatus = document.getElementById("inventoryStatus");
  const lowStockCount = document.getElementById("lowStockCount");
  const expiringCount = document.getElementById("expiringCount");
  const totalMedicineCount = document.getElementById("totalMedicineCount");
  const medicineForm = document.getElementById("medicineForm");
  const medicineFormTitle = document.getElementById("medicineFormTitle");
  const medicineFormStatus = document.getElementById("medicineFormStatus");
  const medicineSubmitBtn = document.getElementById("medicineSubmitBtn");
  const medicineResetBtn = document.getElementById("medicineResetBtn");
  const genericNameInput = document.getElementById("genericName");
  const brandNameInput = document.getElementById("brandName");
  const strengthFormInput = document.getElementById("strength");
  const dosageFormInput = document.getElementById("dosageForm");
  const manufacturerInput = document.getElementById("manufacturer");
  const batchNumberInput = document.getElementById("batchNumber");
  const quantityInput = document.getElementById("quantity");
  const priceInput = document.getElementById("price");
  const expiryDateInput = document.getElementById("expiryDate");
  const descriptionInput = document.getElementById("description");
  const isRestrictedInput = document.getElementById("isRestricted");

  const LOW_STOCK_THRESHOLD = 20;
  let activeFilter = "all";
  let inventoryItems = [];
  let editingMedicineId = null;
  let dosageOptions = new Set();

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const setStatusMessage = (message, tone = "muted") => {
    if (!inventoryStatus) {
      return;
    }
    inventoryStatus.className = `stock-summary ${tone}`;
    inventoryStatus.textContent = message;
  };

  const readJsonResponse = async (response) => {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  };

  const updateFormMode = () => {
    const isEditing = editingMedicineId !== null;
    medicineFormTitle.textContent = isEditing ? "Edit Medicine" : "Add New Medicine";
    medicineSubmitBtn.textContent = isEditing ? "Update Medicine" : "Register Product";
    medicineFormStatus.textContent = isEditing
      ? "Update the selected medicine and save the changes to the database."
      : "Fill in the inventory details and save them to the database.";
  };

  const resetForm = () => {
    editingMedicineId = null;
    medicineForm.reset();
    updateFormMode();
  };

  const fillForm = (medicine) => {
    editingMedicineId = medicine.medicine_id;
    genericNameInput.value = medicine.generic_name || "";
    brandNameInput.value = medicine.brand_name || "";
    strengthFormInput.value = medicine.strength || "";
    dosageFormInput.value = medicine.dosage_form || "";
    manufacturerInput.value = medicine.manufacturer || "";
    batchNumberInput.value = medicine.batch_number || "";
    quantityInput.value = medicine.quantity ?? 0;
    priceInput.value = medicine.price ?? "";
    expiryDateInput.value = medicine.expiry_date ? String(medicine.expiry_date).slice(0, 10) : "";
    descriptionInput.value = medicine.description || "";
    isRestrictedInput.checked = Boolean(medicine.is_restricted);
    updateFormMode();
    medicineForm.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderCounts = (items) => {
    const total = items.length;
    const low = items.filter((medicine) => Number(medicine.quantity || 0) <= LOW_STOCK_THRESHOLD).length;
    const expiring = items.filter((medicine) => {
      if (!medicine.expiry_date) {
        return false;
      }
      const expiryDate = new Date(medicine.expiry_date);
      if (Number.isNaN(expiryDate.getTime())) {
        return false;
      }
      const today = new Date();
      const horizon = new Date();
      horizon.setDate(today.getDate() + 30);
      return expiryDate >= today && expiryDate <= horizon;
    }).length;

    if (totalMedicineCount) totalMedicineCount.textContent = String(total);
    if (lowStockCount) lowStockCount.textContent = String(low).padStart(2, "0");
    if (expiringCount) expiringCount.textContent = String(expiring).padStart(2, "0");
  };

  const renderInventory = () => {
    renderCounts(inventoryItems);
    renderRows(applyFilters(inventoryItems));
  };

  const renderRows = (items) => {
    tableBody.innerHTML = "";
    if (!items || items.length === 0) {
      tableBody.innerHTML = "<tr><td colspan=\"5\" class=\"empty-row\">No medicines found.</td></tr>";
      setStatusMessage("No medicines match the current filters.", "muted");
      return;
    }

    items.forEach((medicine) => {
      const row = document.createElement("tr");
      const isLow = medicine.quantity <= LOW_STOCK_THRESHOLD;
      const statusLabel = isLow ? "Low" : "Stable";
      const statusClass = isLow ? "status-pill low" : "status-pill stable";

      row.innerHTML = `
        <td data-label="Medicine Name">
          <div class="med-name">${medicine.generic_name} ${medicine.strength || ""}</div>
          <div class="med-sub">${medicine.dosage_form || "Unknown"} - ${medicine.brand_name}</div>
        </td>
        <td data-label="Stock"><div class="stock-val">${medicine.quantity} units</div></td>
        <td data-label="Expiry"><div class="expiry-date">${formatDate(medicine.expiry_date)}</div></td>
        <td data-label="Status"><span class="${statusClass}">${statusLabel}</span></td>
        <td data-label="Actions" class="action-cell">
          <button class="action-btn" type="button" data-action="edit" data-id="${medicine.medicine_id}">Edit</button>
          <button class="action-btn danger" type="button" data-action="delete" data-id="${medicine.medicine_id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    setStatusMessage(`Showing ${items.length} medicine${items.length === 1 ? "" : "s"} in the current view.`, "muted");
  };

  const applyFilters = (items) => {
    return items.filter((medicine) => {
      if (activeFilter === "low") {
        return medicine.quantity <= LOW_STOCK_THRESHOLD;
      }
      if (activeFilter === "in") {
        return medicine.quantity > LOW_STOCK_THRESHOLD;
      }
      if (activeFilter === "rx") {
        return Boolean(medicine.is_restricted);
      }
      return true;
    });
  };

  const exportInventory = () => {
    if (!inventoryItems.length) {
      setStatusMessage("No inventory rows to export.", "muted");
      return;
    }

    const headers = ["generic_name", "brand_name", "strength", "dosage_form", "manufacturer", "quantity", "price", "expiry_date", "is_restricted"];
    const csvRows = [headers.join(",")];

    inventoryItems.forEach((medicine) => {
      csvRows.push([
        medicine.generic_name,
        medicine.brand_name,
        medicine.strength || "",
        medicine.dosage_form || "",
        medicine.manufacturer || "",
        medicine.quantity,
        medicine.price ?? "",
        medicine.expiry_date || "",
        medicine.is_restricted ? "yes" : "no"
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "medivault_inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const fetchInventory = () => {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) {
      params.set("search", searchInput.value.trim());
    }
    if (strengthInput.value.trim()) {
      params.set("strength", strengthInput.value.trim());
    }
    if (dosageSelect.value) {
      params.set("dosageForm", dosageSelect.value);
    }
    params.set("limit", "100");

    setStatusMessage("Refreshing inventory from the database...", "muted");
    fetch(`/api/medicines?${params.toString()}`)
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok || !data) {
          throw new Error("Failed to load inventory");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Failed to load inventory");
        }
        const medicines = data.medicines || [];
        inventoryItems = medicines;
        medicines.forEach((medicine) => {
          if (medicine.dosage_form) {
            dosageOptions.add(medicine.dosage_form);
          }
        });
        if (dosageOptions.size > 0 && dosageSelect.options.length === 1) {
          Array.from(dosageOptions).sort().forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            dosageSelect.appendChild(item);
          });
        }
        renderInventory();
      })
      .catch(() => {
        tableBody.innerHTML = "<tr><td colspan=\"5\" class=\"empty-row\">Unable to load inventory.</td></tr>";
        setStatusMessage("Unable to load inventory data.", "error");
      });
  };

  const fetchDashboardSummary = () => {
    fetch("/api/admin/dashboard")
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok || !data) {
          throw new Error("Failed to load summary");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Summary unavailable");
        }
        if (lowStockCount) lowStockCount.textContent = String(data.stats.lowStockAlerts).padStart(2, "0");
        if (expiringCount) expiringCount.textContent = String(data.stats.expiringSoon).padStart(2, "0");
        if (totalMedicineCount) totalMedicineCount.textContent = String(data.stats.totalMedicines);
      })
      .catch(() => {
        setStatusMessage("Inventory summary is unavailable until an admin session is active.", "muted");
      });
  };

  const saveMedicine = (event) => {
    event.preventDefault();

    const payload = {
      genericName: genericNameInput.value.trim(),
      brandName: brandNameInput.value.trim() || genericNameInput.value.trim(),
      strength: strengthFormInput.value.trim(),
      dosageForm: dosageFormInput.value.trim(),
      manufacturer: manufacturerInput.value.trim(),
      batchNumber: batchNumberInput.value.trim(),
      quantity: quantityInput.value,
      price: priceInput.value,
      expiryDate: expiryDateInput.value,
      description: descriptionInput.value.trim(),
      isRestricted: isRestrictedInput.checked
    };

    if (!payload.genericName) {
      setStatusMessage("Generic name is required.", "error");
      return;
    }

    if (payload.quantity === "" || Number.isNaN(Number.parseInt(payload.quantity, 10))) {
      setStatusMessage("Stock level is required.", "error");
      return;
    }

    const method = editingMedicineId ? "PUT" : "POST";
    const url = editingMedicineId ? `/api/medicines/${editingMedicineId}` : "/api/medicines";

    medicineSubmitBtn.disabled = true;
    setStatusMessage("Saving medicine data...", "muted");

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => ({ ok: response.ok, data: await readJsonResponse(response) }))
      .then(({ ok, data }) => {
        if (!ok || !data || !data.success) {
          throw new Error(data.message || "Failed to save medicine");
        }

        setStatusMessage(data.message || "Medicine saved successfully.", "success");
        resetForm();
        fetchInventory();
        fetchDashboardSummary();
      })
      .catch((error) => {
        setStatusMessage(error.message || "Failed to save medicine.", "error");
      })
      .finally(() => {
        medicineSubmitBtn.disabled = false;
      });
  };

  const deleteMedicine = (medicineId) => {
    const medicine = inventoryItems.find((item) => String(item.medicine_id) === String(medicineId));
    const label = medicine ? `${medicine.generic_name} ${medicine.strength || ""}`.trim() : "this medicine";

    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }

    setStatusMessage("Deleting medicine...", "muted");

    fetch(`/api/medicines/${medicineId}`, { method: "DELETE" })
      .then(async (response) => ({ ok: response.ok, data: await readJsonResponse(response) }))
      .then(({ ok, data }) => {
        if (!ok || !data || !data.success) {
          throw new Error(data.message || "Failed to delete medicine");
        }

        if (editingMedicineId && String(editingMedicineId) === String(medicineId)) {
          resetForm();
        }

        fetchInventory();
        fetchDashboardSummary();
        setStatusMessage(data.message || "Medicine deleted successfully.", "success");
      })
      .catch((error) => {
        setStatusMessage(error.message || "Failed to delete medicine.", "error");
      });
  };

  filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) {
      return;
    }
    filterGroup.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderInventory();
  });

  [searchInput, strengthInput, dosageSelect].forEach((control) => {
    control.addEventListener("change", fetchInventory);
    control.addEventListener("input", () => {
      if (control === searchInput) {
        clearTimeout(control._debounceTimer);
        control._debounceTimer = setTimeout(fetchInventory, 300);
      }
    });
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const { action, id } = button.dataset;
    if (action === "edit") {
      const medicine = inventoryItems.find((item) => String(item.medicine_id) === String(id));
      if (medicine) {
        fillForm(medicine);
      }
      return;
    }

    if (action === "delete") {
      deleteMedicine(id);
    }
  });

  medicineForm.addEventListener("submit", saveMedicine);
  medicineResetBtn.addEventListener("click", resetForm);

  const exportButton = document.querySelector(".icon-btn[title='Export']");
  if (exportButton) {
    exportButton.addEventListener("click", exportInventory);
  }

  updateFormMode();
  fetchDashboardSummary();
  fetchInventory();
});
