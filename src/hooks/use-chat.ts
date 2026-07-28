"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChatMessageRequest,
  deleteChatMessageRequest,
  getChatMessagesRequest,
  pinChatMessageRequest,
  updateChatMessageRequest,
} from "@/services/chat.service";

export function useChatMessages() {
  return useQuery({
    queryKey: ["chat", "messages"],
    queryFn: () => getChatMessagesRequest({ limit: 80 }),
    refetchInterval: 8000,
  });
}

export function useCreateChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatMessageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatMessageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
    },
  });
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatMessageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
    },
  });
}

export function usePinChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pinChatMessageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
    },
  });
}
