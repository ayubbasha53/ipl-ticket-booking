export type Role = 'customer' | 'staff' | 'admin';
export interface User {
  id: string; name: string; email: string; phone: string; role: Role;
  emailVerified: boolean; phoneVerified: boolean;
  consent: { transactionalNotifications: boolean; marketingNotifications: boolean };
  createdAt: string;
}
export interface SessionInfo { id: string; current: boolean; userAgent?: string; createdAt: string; expiresAt: string }
