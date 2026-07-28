export type ChatAuthor = {
  id: string;
  username: string;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR";
  profile: {
    fullName: string;
    rank: string;
    badge: string;
    avatarUrl?: string | null;
  } | null;
};

export type ChatMessage = {
  id: string;
  authorUserId: string;
  body: string;
  isPinned: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ChatAuthor;
};
