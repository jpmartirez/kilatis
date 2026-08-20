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

export interface ImageAnalysisResult {
  filename: string;
  verdict: "AUTHENTIC" | "AI-GENERATED";
  classification: "AUTHENTIC" | "AI-GENERATED" | "DEEPFAKE";
  p_tile: number;
  p_face: number | null;
  has_face: boolean;
  tiles_analyzed: number;
  face_tiles_analyzed: number;
  status: string;
  error?: string | null;
}

export interface BatchDetectionResponse {
  case_number?: string | null;
  case_title?: string | null;
  investigator?: string | null;
  total_images: number;
  ai_generated_count: number;
  deepfake_count: number;
  authentic_count: number;
  threshold_used: number;
  model_status: string;
  results: ImageAnalysisResult[];
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

export async function analyzeEvidenceImages(
  files: File[],
  metadata: {
    caseNumber?: string;
    caseTitle?: string;
    investigatorName?: string;
    caseNotes?: string;
  }
): Promise<BatchDetectionResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  if (metadata.caseNumber) formData.append("case_number", metadata.caseNumber);
  if (metadata.caseTitle) formData.append("case_title", metadata.caseTitle);
  if (metadata.investigatorName) formData.append("investigator_name", metadata.investigatorName);
  if (metadata.caseNotes) formData.append("case_notes", metadata.caseNotes);

  const res = await fetch(`${API_BASE_URL}/api/detection/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(errorData.detail || "Analysis request failed");
  }

  return res.json();
}
