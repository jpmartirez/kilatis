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

export interface AxisDetail {
  state: "positive" | "negative" | "not-assessable" | string;
  tier?: "low" | "moderate" | "high" | null;
  score?: number | null;
  threshold: number;
  demoted: boolean;
  demote_reason: string;
}

export interface DetectionScores {
  p_ai: number;
  p_splice: number;
}

export interface ImageAnalysisResult {
  filename: string;
  verdict: "Authentic" | "Spliced" | "AI-generated / deepfake" | "AI-generated + spliced" | "Manual review" | string;
  headline: string;
  scores: DetectionScores;
  ai_axis: AxisDetail;
  splice_axis: AxisDetail;
  detail: string[];
  has_tamper_mask: boolean;
  mask_base64?: string | null;
  status: "success" | "error" | string;
  error?: string | null;
}

export interface BatchDetectionResponse {
  total_images: number;
  authentic_count: number;
  spliced_count: number;
  ai_generated_count: number;
  ai_spliced_count: number;
  manual_review_count: number;
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
