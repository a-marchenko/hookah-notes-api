export interface AuthPayload {
  id: number;
  username: string;
  role: 'user' | 'admin' | 'super';
  tokenVersion?: number;
}
