// src/types/auth.ts
export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'member';
    isActive: boolean;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'member'; // Normalmente el rol member es el predeterminado
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }