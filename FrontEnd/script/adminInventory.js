document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("inventorySearch");
  const strengthInput = document.getElementById("inventoryStrength");
  const dosageSelect = document.getElementById("inventoryDosage");
  const filterGroup = document.getElementById("inventoryFilters");
  const tableBody = document.querySelector("[data-role='inventory-body']");

  const LOW_STOCK_THRESHOLD = 20;
  let activeFilter = "all";
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

  const renderRows = (items) => {
    tableBody.innerHTML = "";
    if (!items || items.length === 0) {
      tableBody.innerHTML = "<tr><td colspan=\"5\" class=\"empty-row\">No medicines found.</td></tr>";
      return;
    }

    items.forEach((medicine) => {
      const row = document.createElement("tr");
      const isLow = medicine.quantity <= LOW_STOCK_THRESHOLD;
      const statusLabel = isLow ? "Low" : "Stable";
      const statusClass = isLow ? "status-pill low" : "status-pill stable";

      row.innerHTML = `
        <td>
          <div class="med-name">${medicine.generic_name} ${medicine.strength || ""}</div>
          <div class="med-sub">${medicine.dosage_form || "Unknown"} - ${medicine.brand_name}</div>
        </td>
        <td><div class="stock-val">${medicine.quantity} units</div></td>
        <td><div class="expiry-date">${formatDate(medicine.expiry_date)}</div></td>
        <td><span class="${statusClass}">${statusLabel}</span></td>
        <td><button class="action-btn" type="button">Edit</button></td>
      `;
      tableBody.appendChild(row);
    });
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

    fetch(`/api/medicines?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          throw new Error("Failed to load inventory");
        }
        data.medicines.forEach((medicine) => {
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
        renderRows(applyFilters(data.medicines));
      })
      .catch(() => {
        tableBody.innerHTML = "<tr><td colspan=\"5\" class=\"empty-row\">Unable to load inventory.</td></tr>";
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
    fetchInventory();
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

  fetchInventory();
});
