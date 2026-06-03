export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // מוצפן
  avatarUrl?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  // Follow relationships
  followers?: string[]; // users who follow this user (ids)
  following?: string[]; // users this user follows (ids)
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // Expose follow relationships for UI
  followers?: string[];
  following?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}