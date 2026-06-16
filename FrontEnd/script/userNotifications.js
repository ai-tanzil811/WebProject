async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

function updateBadge(count) {
  const badgeIds = [
    'shoppingNotificationCount',
    'checkoutNotificationCount',
    'notificationsNotificationCount',
    'profileNotificationCount'
  ];

  badgeIds.forEach((id) => {
    const badge = document.getElementById(id);
    if (!badge) {
      return;
    }

    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  });
}

async function loadUnreadCount() {
  try {
    const response = await fetch('/api/notifications/unread-count', { credentials: 'include' });
    const data = await readJsonResponse(response);
    const unreadCount = data && data.success ? Number.parseInt(data.unreadCount, 10) || 0 : 0;
    updateBadge(unreadCount);
  } catch (_error) {
    updateBadge(0);
  }
}

async function loadNotificationFeed() {
  const list = document.getElementById('notification-list');
  if (!list) {
    return;
  }

  try {
    const response = await fetch('/api/notifications', { credentials: 'include' });
    const data = await readJsonResponse(response);

    if (!response.ok || !data || !data.success || !Array.isArray(data.notifications)) {
      return;
    }

    list.innerHTML = '';
    if (data.notifications.length === 0) {
      list.innerHTML = '<article class="notice-item"><h3>No notifications yet</h3><p>You will see prescription review updates here.</p></article>';
      return;
    }

    data.notifications.forEach((notification) => {
      const article = document.createElement('article');
      article.className = `notice-item ${notification.is_read ? '' : 'unread'}`;
      article.innerHTML = `
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <small>${new Date(notification.created_at).toLocaleString()}</small>
      `;
      list.appendChild(article);
    });

    await fetch('/api/notifications/mark-all-read', {
      method: 'PATCH',
      credentials: 'include'
    });

    updateBadge(0);
  } catch (_error) {
    // Keep the static fallback content if the API is unavailable.
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUnreadCount();
  loadNotificationFeed();
});