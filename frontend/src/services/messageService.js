import apiClient from "./apiClient";

export async function getInbox() {
  const response =
    await apiClient.get(
      "/api/messages/inbox",
    );

  return response.data.data;
}

export async function getSentMessages() {
  const response =
    await apiClient.get(
      "/api/messages/sent",
    );

  return response.data.data;
}

export async function getMessage(
  id,
) {
  const response =
    await apiClient.get(
      `/api/messages/${id}`,
    );

  return response.data.data;
}

export async function getUnreadMessageCount() {
  const response =
    await apiClient.get(
      "/api/messages/unread-count",
    );

  return (
    response.data?.data?.count || 0
  );
}

export async function sendMessage({
  recipientId,
  subject,
  body,
  parentMessageId = null,
}) {
  const response =
    await apiClient.post(
      "/api/messages",
      {
        recipientId,
        subject,
        body,
        parentMessageId,
      },
    );

  return response.data.data;
}

export async function markMessageAsRead(
  id,
) {
  const response =
    await apiClient.patch(
      `/api/messages/${id}/read`,
    );

  return response.data.data;
}
export async function getMessageRecipients() {
  const response =
    await apiClient.get(
      "/api/messages/recipients",
    );

  return response.data.data;
}