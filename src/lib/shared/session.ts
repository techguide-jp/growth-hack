export const USER_ROLE_VALUES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
};

export type SessionInfo = {
  id: string;
  expiresAt: string;
};

export type SessionState = {
  user: SessionUser | null;
  session: SessionInfo | null;
  isOnboarded: boolean;
};
