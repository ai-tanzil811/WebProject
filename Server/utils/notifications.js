async function createUserNotification(connection, options) {
  const {
    userId,
    title,
    message,
    notificationType = 'info',
    referenceType = null,
    referenceId = null
  } = options || {};

  if (!userId || !title || !message) {
    return null;
  }

  const [result] = await connection.query(
    `INSERT INTO UserNotifications
      (user_id, title, message, notification_type, reference_type, reference_id, is_read)
     VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
    [userId, title, message, notificationType, referenceType, referenceId]
  );

  return result.insertId;
}

module.exports = { createUserNotification };