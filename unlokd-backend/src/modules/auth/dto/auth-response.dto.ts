export type AuthUserDto = {
  id: number;
  email: string;
  username: string;
};

export type AuthResponseDto = {
  accessToken: string;
  user: AuthUserDto;
};
