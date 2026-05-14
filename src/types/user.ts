export interface UserRecord {
  id: string;
  username: string;
  password: string;
  role: string;
  created_at: string;
}

export type PublicUser = Omit<UserRecord, "password">;
