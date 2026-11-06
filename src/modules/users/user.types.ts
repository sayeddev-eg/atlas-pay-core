export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}
