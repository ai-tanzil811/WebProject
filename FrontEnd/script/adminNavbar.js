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

      // Dropdown controls: toggle, menu, and actions
      const dropdown = mount.querySelector('#admin-dropdown');
      const toggle = mount.querySelector('#admin-dropdown-toggle');
      const menu = mount.querySelector('#admin-dropdown-menu');

      const closeDropdown = () => {
        if (!dropdown) return;
        dropdown.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (menu) menu.setAttribute('aria-hidden', 'true');
      };

      const openDropdown = () => {
        if (!dropdown) return;
        dropdown.classList.add('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
        if (menu) menu.setAttribute('aria-hidden', 'false');
      };

      // populate avatar and bind actions based on auth status
      fetch('/api/auth/status', { credentials: 'include' })
        .then(r => r.json())
        .then(status => {
          if (!status || !status.authenticated || !status.user) {
            if (dropdown) dropdown.style.display = 'none';
            return;
          }

          const user = status.user;
          const avatarEl = mount.querySelector('#admin-avatar');
          if (avatarEl && user.name) avatarEl.textContent = user.name.charAt(0).toUpperCase();

          if (toggle) {
            toggle.addEventListener('click', (e) => {
              e.stopPropagation();
              if (dropdown.classList.contains('open')) closeDropdown(); else openDropdown();
            });
          }

          // menu item actions
          if (menu) {
            menu.addEventListener('click', async (ev) => {
              const btn = ev.target.closest('.dropdown-item');
              if (!btn) return;
              const action = btn.getAttribute('data-action');
              if (action === 'notifications') {
                window.location.href = './Admin_notifications.html';
              } else if (action === 'profile') {
                window.location.href = './Admin_profile.html';
              } else if (action === 'logout') {
                try {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                } catch (err) {
                  console.error('Logout error', err);
                } finally {
                  window.location.href = './Admin_login.html';
                }
              }
            });
          }

          // close on outside click or Escape
          document.addEventListener('click', (ev) => {
            if (!dropdown) return;
            if (!dropdown.contains(ev.target)) closeDropdown();
          });
          document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeDropdown(); });
        })
        .catch(() => { if (dropdown) dropdown.style.display = 'none'; });
    })
    .catch(() => {
      mount.innerHTML = "";
    });
});
