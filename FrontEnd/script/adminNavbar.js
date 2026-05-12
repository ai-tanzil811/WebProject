document.addEventListener("DOMContentLoaded", () => {
  const mount = document.querySelector("[data-include='admin-navbar']");
  if (!mount) {
    return;
  }

  fetch("../partials/adminNavbar.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load navbar");
      }
      return response.text();
    })
    .then((html) => {
      mount.innerHTML = html;
      const activeKey = document.body.getAttribute("data-active-nav");
      if (activeKey) {
        const activeLink = mount.querySelector(`[data-nav="${activeKey}"]`);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }

      const searchInput = mount.querySelector("[data-nav-search]");
      if (searchInput) {
        const goToSearch = (event) => {
          event.preventDefault();
          if (!window.location.pathname.endsWith("/Admin_search.html")) {
            window.location.href = "./Admin_search.html";
          }
        };
        searchInput.addEventListener("focus", goToSearch);
        searchInput.addEventListener("click", goToSearch);
      }
    })
    .catch(() => {
      mount.innerHTML = "";
    });
});
