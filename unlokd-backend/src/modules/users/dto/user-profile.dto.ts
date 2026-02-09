export type UserProfileDto = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presenceStatus: string | null;
};
