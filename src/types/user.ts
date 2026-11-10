export type User = {
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
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
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
  profile: {
    fullName: string;
    rank: string;
    badge: string;
    avatarUrl?: string | null;
  } | null;
};
