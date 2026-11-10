export type AuthUser = {
  specialPermissions?: string[];
  primaryRole?: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
  guardEligible?: boolean;
  accessMode?: "PERSONAL" | "GUARD";
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
  isActive: boolean;
  isPendingApproval: boolean;
  mustChangePassword?: boolean;
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
