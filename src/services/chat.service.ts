import { api } from "@/lib/api-client";
import { ChatMessage } from "@/types/chat";

export async function getChatMessagesRequest(params?: {
  limit?: number;
  before?: string;
}) {
  const response = await api.get<ChatMessage[]>("/chat/messages", { params });
  return response.data;
}

export async function createChatMessageRequest(body: string) {
  const response = await api.post<ChatMessage>("/chat/messages", { body });
  return response.data;
}

export async function updateChatMessageRequest(payload: {
  id: string;
  body: string;
}) {
  const response = await api.patch<ChatMessage>(`/chat/messages/${payload.id}`, {
    body: payload.body,
  });

  return response.data;
}

export async function deleteChatMessageRequest(id: string) {
  const response = await api.delete<{ message: string }>(`/chat/messages/${id}`);
  return response.data;
}

export async function pinChatMessageRequest(payload: {
  id: string;
  isPinned: boolean;
}) {
  const response = await api.patch<ChatMessage>(
    `/chat/messages/${payload.id}/pin`,
    { isPinned: payload.isPinned },
  );

  return response.data;
}
