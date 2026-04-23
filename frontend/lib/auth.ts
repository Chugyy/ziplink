import { api } from "./api";
import { AuthResponse } from "./types";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("username");
}

export function setUsername(username: string) {
  localStorage.setItem("username", username);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = (await api.login(email, password)) as AuthResponse;
  setToken(res.token);
  setUsername(res.user.username);
  return res;
}

export async function signup(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = (await api.signup(email, password)) as AuthResponse;
  setToken(res.token);
  setUsername(res.user.username);
  return res;
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}
