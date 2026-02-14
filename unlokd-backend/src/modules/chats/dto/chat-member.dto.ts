export type ChatMemberDto = {
  userId: number;
  role: 'OWNER' | 'MEMBER';
  displayName: string;
  presenceStatus: string | null;
  avatarUrl: string | null;
};
