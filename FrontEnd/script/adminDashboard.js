document.addEventListener("DOMContentLoaded", () => {
  const stats = {
    total: document.getElementById("stat-total"),
    low: document.getElementById("stat-low"),
    expiring: document.getElementById("stat-expiring"),
    reviews: document.getElementById("stat-reviews")
  };
  const activityList = document.getElementById("activity-list");

  const renderActivity = (items) => {
    activityList.innerHTML = "";
    if (!items || items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "No recent activity yet.";
      activityList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "activity-item";

      const header = document.createElement("div");
      header.className = "activity-header";

      const title = document.createElement("div");
      title.className = "activity-title";
      title.textContent = item.action || "Activity";

      const time = document.createElement("div");
      time.className = "activity-time";
      time.textContent = new Date(item.created_at).toLocaleString();

      header.appendChild(title);
      header.appendChild(time);

      const detail = document.createElement("div");
      detail.className = "activity-desc";
      const actor = item.actor_name ? ` by ${item.actor_name}` : "";
      const entity = item.entity_type ? ` on ${item.entity_type}` : "";
      detail.textContent = `Recorded${entity}${actor}.`;

      wrapper.appendChild(header);
      wrapper.appendChild(detail);
      activityList.appendChild(wrapper);
    });
  };

  fetch("/api/admin/dashboard")
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
      renderActivity(data.activity);
    })
    .catch(() => {
      if (activityList) {
        activityList.innerHTML = "<div class=\"activity-empty\">Unable to load dashboard data.</div>";
      }
    });
});
