export type User = {
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR";
  isActive: boolean;
  isPendingApproval: boolean;
  profile: {
    fullName: string;
    rank: string;
    badge: string;
  } | null;
};

export type UserRosterItem = {
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
