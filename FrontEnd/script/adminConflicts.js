document.addEventListener("DOMContentLoaded", () => {
  const statsContainer = document.getElementById("conflictStats");
  const listContainer = document.getElementById("conflictList");
  const conflictForm = document.getElementById("conflictForm");
  const conflictFormTitle = document.getElementById("conflictFormTitle");
  const conflictFormNote = document.getElementById("conflictFormNote");
  const submitBtn = document.getElementById("conflictSubmitBtn");
  const resetBtn = document.getElementById("conflictResetBtn");
  const openBtn = document.getElementById("openConflictFormBtn");
  const medicineId1 = document.getElementById("medicineId1");
  const medicineId2 = document.getElementById("medicineId2");
  const conflictLevel = document.getElementById("conflictLevel");
  const conflictSearch = document.getElementById("conflictSearch");
  const conflictDescription = document.getElementById("conflictDescription");
  const conflictRecommendation = document.getElementById("conflictRecommendation");

  let medicines = [];
  let conflictLevels = ["mild", "moderate", "severe"];
  let conflicts = [];
  let editingConflictId = null;
  const adminLoginUrl = "/pages/Admin_login.html";

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

  const levelLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

  const ensureAdminSession = async () => {
    try {
      const response = await fetch("/api/auth/status", { credentials: "include" });
      const data = await readJsonResponse(response);

      if (!response.ok || !data || !data.authenticated || !data.user || data.user.role !== "admin") {
        window.location.href = adminLoginUrl;
        return false;
      }

      return true;
    } catch (error) {
      window.location.href = adminLoginUrl;
      return false;
    }
  };

  const renderMedicines = () => {
    const options = medicines.map((medicine) => {
      const title = `${medicine.generic_name} ${medicine.strength || ""}`.trim();
      const subtitle = medicine.brand_name || "";
      return `<option value="${medicine.medicine_id}">${title}${subtitle ? ` - ${subtitle}` : ""}</option>`;
    }).join("");

    medicineId1.innerHTML = `<option value="">Select medicine</option>${options}`;
    medicineId2.innerHTML = `<option value="">Select medicine</option>${options}`;

    conflictLevel.innerHTML = conflictLevels.map((level) => `<option value="${level}">${levelLabel(level)}</option>`).join("");
  };

  const renderStats = (summary = {}) => {
    statsContainer.innerHTML = `
      <div class="stat-pill">${summary.total || 0} total conflicts</div>
      <div class="stat-pill">${summary.mild || 0} mild</div>
      <div class="stat-pill">${summary.moderate || 0} moderate</div>
      <div class="stat-pill">${summary.severe || 0} severe</div>
    `;
  };

  const renderConflicts = (items) => {
    listContainer.innerHTML = "";

    if (!items.length) {
      listContainer.innerHTML = '<div class="conflict-empty">No conflicts found.</div>';
      return;
    }

    items.forEach((conflict) => {
      const card = document.createElement("article");
      card.className = "conflict-card";
      card.innerHTML = `
        <div class="drug-pair">
          <div class="drug-box">
            <div class="drug-label">Medicine A</div>
            <div class="drug-name">${conflict.medicine_1_name}<br />${conflict.medicine_1_strength || ""}</div>
          </div>
          <div class="conflict-middle">
            <span class="severity-badge ${conflict.conflict_level}">${levelLabel(conflict.conflict_level)}</span>
            <div class="arrow-icon">&lt;-&gt;</div>
          </div>
          <div class="drug-box">
            <div class="drug-label">Medicine B</div>
            <div class="drug-name">${conflict.medicine_2_name}<br />${conflict.medicine_2_strength || ""}</div>
          </div>
        </div>
        <div class="conflict-desc">${conflict.description || "No description provided."}</div>
        <div class="conflict-reco">${conflict.recommendation || "No recommendation provided."}</div>
        <div class="card-actions">
          <button class="card-btn" type="button" data-action="edit" data-id="${conflict.conflict_id}">Edit</button>
          <button class="card-btn danger" type="button" data-action="delete" data-id="${conflict.conflict_id}">Delete</button>
        </div>
      `;
      listContainer.appendChild(card);
    });
  };

  const applySearch = () => {
    const term = conflictSearch.value.trim().toLowerCase();
    if (!term) {
      renderConflicts(conflicts);
      return;
    }

    const filtered = conflicts.filter((conflict) => {
      return [
        conflict.medicine_1_name,
        conflict.medicine_2_name,
        conflict.description,
        conflict.recommendation,
        conflict.conflict_level
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });

    renderConflicts(filtered);
  };

  const resetForm = () => {
    editingConflictId = null;
    conflictForm.reset();
    conflictLevel.value = "moderate";
    conflictFormTitle.textContent = "Add Conflict Pair";
    conflictFormNote.textContent = "Select two medicines and save the conflict relationship.";
    submitBtn.textContent = "Save Conflict";
  };

  const fillForm = (conflict) => {
    editingConflictId = conflict.conflict_id;
    medicineId1.value = conflict.medicine_id_1;
    medicineId2.value = conflict.medicine_id_2;
    conflictLevel.value = conflict.conflict_level;
    conflictDescription.value = conflict.description || "";
    conflictRecommendation.value = conflict.recommendation || "";
    conflictFormTitle.textContent = "Edit Conflict Pair";
    conflictFormNote.textContent = "Update the interaction details and save the changes.";
    submitBtn.textContent = "Update Conflict";
    conflictForm.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchOptions = () => {
    return fetch("/api/admin/conflicts/options", { credentials: "include" })
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (response.status === 401) {
          window.location.href = adminLoginUrl;
          throw new Error("Admin access required");
        }
        if (!response.ok || !data) {
          throw new Error((data && data.message) || "Failed to load conflict options");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Failed to load conflict options");
        }
        medicines = data.medicines || [];
        conflictLevels = data.conflictLevels || conflictLevels;
        renderMedicines();
      });
  };

  const fetchConflicts = () => {
    return fetch("/api/admin/conflicts", { credentials: "include" })
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (response.status === 401) {
          window.location.href = adminLoginUrl;
          throw new Error("Admin access required");
        }
        if (!response.ok || !data) {
          throw new Error((data && data.message) || "Failed to load conflicts");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error("Failed to load conflicts");
        }
        conflicts = data.conflicts || [];
        renderStats(data.summary);
        applySearch();
      })
      .catch(() => {
        statsContainer.innerHTML = '<div class="stat-pill">Unable to load conflict data.</div>';
        listContainer.innerHTML = '<div class="conflict-empty">Unable to load conflicts.</div>';
      });
  };

  const saveConflict = (event) => {
    event.preventDefault();

    const payload = {
      medicineId1: medicineId1.value,
      medicineId2: medicineId2.value,
      conflictLevel: conflictLevel.value,
      description: conflictDescription.value.trim(),
      recommendation: conflictRecommendation.value.trim()
    };

    const url = editingConflictId ? `/api/admin/conflicts/${editingConflictId}` : "/api/admin/conflicts";
    const method = editingConflictId ? "PUT" : "POST";

    submitBtn.disabled = true;
    fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok || !data) {
          throw new Error((data && data.message) || "Failed to save conflict");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to save conflict");
        }

        resetForm();
        fetchConflicts();
      })
      .catch((error) => {
        alert(error.message || "Failed to save conflict");
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  };

  const deleteConflict = (id) => {
    if (!window.confirm("Delete this conflict pair?")) {
      return;
    }

    fetch(`/api/admin/conflicts/${id}`, { method: "DELETE", credentials: "include" })
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok || !data) {
          throw new Error((data && data.message) || "Failed to delete conflict");
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to delete conflict");
        }

        fetchConflicts();
      })
      .catch((error) => {
        alert(error.message || "Failed to delete conflict");
      });
  };

  listContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const conflict = conflicts.find((item) => String(item.conflict_id) === String(button.dataset.id));
    if (!conflict) {
      return;
    }

    if (button.dataset.action === "edit") {
      fillForm(conflict);
    }

    if (button.dataset.action === "delete") {
      deleteConflict(conflict.conflict_id);
    }
  });

  conflictSearch.addEventListener("input", applySearch);
  conflictForm.addEventListener("submit", saveConflict);
  resetBtn.addEventListener("click", resetForm);
  openBtn.addEventListener("click", () => {
    resetForm();
    conflictForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetForm();
  ensureAdminSession().then((isAdmin) => {
    if (!isAdmin) {
      return;
    }

    fetchOptions()
      .then(fetchConflicts)
      .catch((error) => {
        statsContainer.innerHTML = '<div class="stat-pill">Unable to load conflict data.</div>';
        listContainer.innerHTML = `<div class="conflict-empty">${error.message || "Unable to load conflict setup."}</div>`;
      });
  });
});
