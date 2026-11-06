export type Role = 'owner' | 'accountant' | 'staff' | 'viewer';
export type Lang = 'en' | 'hi';
export type Theme = 'dark' | 'light';

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  permissions: string[];
}
