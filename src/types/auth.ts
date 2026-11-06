export type UserRole = 'desarrollador' | 'propietario' | 'usuario';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  level: number;
}
