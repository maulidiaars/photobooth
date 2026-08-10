export interface Admin {
  id: string;
  username: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
}
