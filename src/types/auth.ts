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
  /** Cuenta de demostracion: datos ficticios y acciones simuladas que no se guardan. */
  demo?: boolean;
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

export type DemoProfile = { key: string; label: string; description: string };
export type DemoProfilesResponse = { enabled: boolean; profiles: DemoProfile[] };
