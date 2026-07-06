export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';
