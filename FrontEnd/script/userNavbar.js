document.addEventListener("DOMContentLoaded", () => {
  const mount = document.querySelector("[data-include='user-navbar']");
  if (!mount) {
    return;
  }

  // Define global toast notification system if not already defined
  if (!window.showToast) {
    window.showToast = (message, type = 'info') => {
      let container = document.querySelector('.mv-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'mv-toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `mv-toast ${type}`;
      
      let icon = 'ℹ️';
      if (type === 'success') icon = '✅';
      if (type === 'error') icon = '❌';

      toast.innerHTML = `<span>${icon}</span> <div style="flex:1;">${message}</div>`;
      container.appendChild(toast);

      // Slide in and auto-remove after 4 seconds
      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    };
  }

  // Fetch and load the navbar partial
  fetch("../partials/userNavbar.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load user navbar");
      }
      return response.text();
    })
    .then((html) => {
      mount.innerHTML = html;
      
      // Highlight active nav link based on body data-active-nav attribute
      const activeKey = document.body.getAttribute("data-active-nav");
      if (activeKey) {
        const activeLink = mount.querySelector(`[data-nav="${activeKey}"]`);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }

      // Verify user authentication session
      fetch('/api/auth/status', { credentials: 'include' })
        .then(r => r.json())
        .then(status => {
          if (!status || !status.authenticated || !status.user || status.user.role !== 'user') {
            // Unauthenticated user, redirect to user login page
            window.location.href = '/pages/User_login.html';
            return;
          }

          // Hook up notifications badge
          loadUserNotificationsCount();

          // Hook up cart badge
          loadUserCartCount();

          // Bind cart click behavior
          const cartBtn = mount.querySelector('#navCartBtn');
          if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
              e.preventDefault();
              if (window.location.pathname.endsWith('/Shopping.html')) {
                // If already on shopping dashboard, open cart modal directly
                const viewCartBtn = document.getElementById('viewCartBtn');
                if (viewCartBtn) {
                  viewCartBtn.click();
                }
              } else {
                // Redirect to shopping dashboard with query parameter to open cart
                window.location.href = '/pages/Shopping.html?openCart=true';
              }
            });
          }

          // Bind logout click behavior
          const logoutBtn = mount.querySelector('#navLogoutBtn');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              } catch (err) {
                console.error('Logout request failed:', err);
              } finally {
                window.location.href = '/pages/User_login.html';
              }
            });
          }
        })
        .catch(() => {
          window.location.href = '/pages/User_login.html';
        });
    })
    .catch((err) => {
      console.error("User navbar failed to render:", err);
    });

  // Helper function to fetch and display notifications badge
  function loadUserNotificationsCount() {
    const badge = document.getElementById('userNotificationCount');
    if (!badge) return;

    fetch('/api/notifications/unread-count', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          const count = Number.parseInt(data.unreadCount, 10) || 0;
          if (count > 0) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.removeAttribute('hidden');
            badge.style.display = 'inline-flex';
          } else {
            badge.setAttribute('hidden', 'true');
            badge.style.display = 'none';
          }
        }
      })
      .catch(err => console.error('Error fetching notification count:', err));
  }

  // Helper function to fetch and display cart badge
  function loadUserCartCount() {
    const badge = document.getElementById('userCartCount');
    if (!badge) return;

    fetch('/api/cart/view', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.cart)) {
          const count = data.cart.reduce((sum, item) => sum + item.quantity, 0);
          if (count > 0) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.removeAttribute('hidden');
            badge.style.display = 'inline-flex';
          } else {
            badge.setAttribute('hidden', 'true');
            badge.style.display = 'none';
          }
        }
      })
      .catch(err => console.error('Error fetching cart count:', err));
  }
});
