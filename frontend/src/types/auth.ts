export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type AuthUser = {
  UserID?: number;
  userId?: number;

  FullName?: string;
  fullName?: string;

  Email?: string;
  email?: string;

  RoleName?: string;
  role?: string;
  roles?: string[];
};
export type AuthResponse = {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    token?: string;
    user?: AuthUser;
  };
  user?: AuthUser;
};
