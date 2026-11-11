export type ChatAuthor = {
  id: string;
  username: string;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
  profile: {
    fullName: string;
    rank: string;
    badge: string;
    avatarUrl?: string | null;
  } | null;
};

export type ChatAudience = "ALL" | "COMMAND" | "DRIVERS" | "GUARD" | "BOARD";
export const chatAudienceLabels: Record<ChatAudience, string> = { ALL: "Todo el personal", COMMAND: "Jefatura", DRIVERS: "Choferes habilitados", GUARD: "Guardia de hoy", BOARD: "Comisión directiva" };

export type ChatMessage = {
  id: string;
  authorUserId: string;
  body: string;
  audience?: ChatAudience;
  isPinned: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ChatAuthor;
};
