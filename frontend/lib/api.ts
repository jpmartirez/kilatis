const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  username: string;
  role: "admin" | "investigator";
  created_by_id?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function loginUser(username: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(errorData.detail || "Authentication failed");
  }

  return res.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Invalid session");
  }

  return res.json();
}

export async function createInvestigator(
  token: string,
  username: string,
  password: string
): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/investigator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to create investigator" }));
    throw new Error(errorData.detail || "Failed to create investigator account");
  }

  return res.json();
}

export async function getMyInvestigators(token: string): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/users/investigators`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch investigators");
  }

  return res.json();
}

