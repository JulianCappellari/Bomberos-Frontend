export type AuthUser = {
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

export type LoginResponse = {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};