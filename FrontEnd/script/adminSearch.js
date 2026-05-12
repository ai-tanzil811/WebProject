document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("lookupSearch");
  const searchButton = document.getElementById("lookupSearchBtn");
  const categorySelect = document.getElementById("lookupCategory");
  const filterGroup = document.getElementById("lookupFilters");
  const cardsContainer = document.getElementById("lookupCards");
  const summaryContainer = document.getElementById("lookupSummary");

  const LOW_STOCK_THRESHOLD = 20;
  let activeFilter = "all";
  let allMedicines = [];

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

  const buildCategories = (items) => {
    const categories = new Set();
    items.forEach((medicine) => {
      if (medicine.dosage_form) {
        categories.add(medicine.dosage_form);
      }
    });
    categorySelect.innerHTML = "<option value=\"\">All Categories</option>";
    Array.from(categories).sort().forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  };

  const renderCards = (items) => {
    cardsContainer.innerHTML = "";
    if (!items || items.length === 0) {
      cardsContainer.innerHTML = "<div class=\"empty-state\">No medicines found.</div>";
      if (summaryContainer) {
        summaryContainer.innerHTML = "<div class=\"summary-pill\">No matching medicines in the current view.</div>";
      }
      return;
    }

    items.forEach((medicine) => {
      const stockClass = medicine.quantity <= LOW_STOCK_THRESHOLD ? "stock-badge low" : "stock-badge ok";
      const stockLabel = medicine.quantity <= LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock";
      const rxClass = medicine.is_restricted ? "rx-badge rx" : "rx-badge otc";
      const rxLabel = medicine.is_restricted ? "Rx Only" : "OTC";
      const conflictClass = medicine.conflict_count > 0 ? "conflict-badge active" : "conflict-badge clear";
      const conflictLabel = medicine.conflict_count > 0 ? `${medicine.conflict_count} Conflict${medicine.conflict_count === 1 ? "" : "s"}` : "No Conflicts";

      const card = document.createElement("div");
      card.className = "med-card";
      card.innerHTML = `
        <div class="card-top">
          <span class="${rxClass}">${rxLabel}</span>
          <span class="${stockClass}">${stockLabel}</span>
        </div>
        <div class="card-name">${medicine.generic_name}</div>
        <div class="card-sub">${medicine.brand_name} - ${medicine.strength || ""}</div>
        <div class="card-chips">
          <span class="${conflictClass}">${conflictLabel}</span>
          <span class="form-badge">${medicine.dosage_form || "Unknown Form"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Stock Level</span>
          <span class="meta-value ${medicine.quantity <= LOW_STOCK_THRESHOLD ? "red" : "green"}">${medicine.quantity} Units</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Expiry</span>
          <span class="meta-value normal">${formatDate(medicine.expiry_date)}</span>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    if (summaryContainer) {
      const conflictCount = items.filter((medicine) => medicine.conflict_count > 0).length;
      summaryContainer.innerHTML = `
        <div class="summary-pill">Showing ${items.length} medicines</div>
        <div class="summary-pill accent">${conflictCount} with conflict data</div>
      `;
    }
  };

  const applyFilters = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;

    let filtered = allMedicines.filter((medicine) => {
      const matchesSearch = !searchTerm ||
        medicine.generic_name.toLowerCase().includes(searchTerm) ||
        medicine.brand_name.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || medicine.dosage_form === category;
      return matchesSearch && matchesCategory;
    });

    if (activeFilter === "low") {
      filtered = filtered.filter((medicine) => medicine.quantity <= LOW_STOCK_THRESHOLD);
    }
    if (activeFilter === "in") {
      filtered = filtered.filter((medicine) => medicine.quantity > LOW_STOCK_THRESHOLD);
    }
    if (activeFilter === "rx") {
      filtered = filtered.filter((medicine) => medicine.is_restricted);
    }
    if (activeFilter === "conflict") {
      filtered = filtered.filter((medicine) => Number(medicine.conflict_count || 0) > 0);
    }

    renderCards(filtered);
  };

  const fetchMedicines = () => {
    const params = new URLSearchParams({ limit: "100" });
    fetch(`/api/medicines?${params.toString()}`)
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok || !data) {
          throw new Error("Failed to load medicines");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Failed to load medicines");
        }
        allMedicines = data.medicines || [];
        buildCategories(allMedicines);
        applyFilters();
      })
      .catch(() => {
        cardsContainer.innerHTML = "<div class=\"empty-state\">Unable to load medicines.</div>";
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
    applyFilters();
  });

  searchButton.addEventListener("click", applyFilters);
  searchInput.addEventListener("input", () => {
    clearTimeout(searchInput._debounceTimer);
    searchInput._debounceTimer = setTimeout(applyFilters, 300);
  });
  categorySelect.addEventListener("change", applyFilters);

  fetchMedicines();
});
