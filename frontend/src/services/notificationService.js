import apiClient from "./apiClient";

// =========================================================
// GET MY NOTIFICATIONS
// =========================================================

export async function getMyNotifications({
  limit = 50,
  offset = 0,
  unreadOnly = false,
} = {}) {
  const response = await apiClient.get("/api/notifications", {
    params: {
      limit,
      offset,
      unreadOnly,
    },
  });

  return response.data.data;
}

// =========================================================
// GET UNREAD COUNT
// =========================================================

export async function getUnreadNotificationCount() {
  const response = await apiClient.get("/api/notifications/unread-count");

  return response.data?.data?.count ?? 0;
}

// =========================================================
// MARK ONE AS READ
// =========================================================

export async function markNotificationAsRead(notificationId) {
  const response = await apiClient.patch(
    `/api/notifications/${notificationId}/read`,
  );

  return response.data.data;
}

// =========================================================
// MARK ALL AS READ
// =========================================================

export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch("/api/notifications/read-all");

  return response.data.data;
}

// =========================================================
// DELETE ONE
// =========================================================

export async function deleteNotification(notificationId) {
  await apiClient.delete(`/api/notifications/${notificationId}`);
}
