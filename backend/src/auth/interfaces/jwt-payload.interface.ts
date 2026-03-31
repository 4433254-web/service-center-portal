export interface JwtPayload {
  sub: string;
  login: string;
  roles: string[];
}
