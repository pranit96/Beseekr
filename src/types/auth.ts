export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string; // Google OAuth returns name instead of full_name
  language?: string;
  timezone?: string;
  avatar?: string | null;
  tier?: string;
  providers?: string[];
  trial?: {
    active: boolean;
    ends_at: string;
    days_remaining: number;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    session?: any;
  };
  message?: string;
}

export interface SignupResponse extends AuthResponse {
  mfa_required?: boolean;
}

export interface LoginResponse extends AuthResponse {
  mfa_required?: boolean;
}
