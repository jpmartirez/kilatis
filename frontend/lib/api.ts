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

export interface StreamEvidence {
  spatial_score: number;
  frequency_score: number;
  wavelet_score: number;
  noise_score: number;
  noise_inconsistency: number;
}

export interface ClassProbabilities {
  authentic: number;
  traditional_spliced: number;
  ai_deepfake: number;
}

export interface ImageAnalysisResult {
  filename: string;
  verdict: "Authentic" | "Spliced" | "AI-generated" | "Deepfake" | "AI-generated + spliced" | "Manual review" | string;
  headline: string;
  scores: DetectionScores;
  streams?: StreamEvidence;
  class_probabilities?: ClassProbabilities;
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
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
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
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
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
      "ngrok-skip-browser-warning": "true",
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
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
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
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(errorData.detail || "Analysis request failed");
  }

  return res.json();
}

// ----------------------------------------------------
// History Sessions API
// ----------------------------------------------------

export interface HistorySessionItem {
  id: string;
  user_id: string;
  case_number: string;
  case_title: string;
  verdicts: string[];
  total_images: number;
  created_at: string;
  updated_at: string;
}

export interface HistoryResponse {
  items: HistorySessionItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface HistoryFilters {
  search?: string;
  verdict?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("kilatis_token") ||
    localStorage.getItem("access_token")
  );
}

export async function saveCaseSession(
  payload: {
    case_number: string;
    case_title: string;
    verdicts: string[];
    total_images?: number;
  },
  token?: string
): Promise<HistorySessionItem> {
  const authToken = token || getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/sessions/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      case_number: payload.case_number,
      case_title: payload.case_title,
      verdicts: payload.verdicts,
      total_images: payload.total_images || 1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to save session" }));
    throw new Error(err.detail || "Failed to save case session");
  }

  return res.json();
}

export async function getHistorySessions(
  filters: HistoryFilters = {},
  token?: string
): Promise<HistoryResponse> {
  const authToken = token || getStoredAuthToken();
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.verdict && filters.verdict !== "ALL") params.append("verdict", filters.verdict);
  if (filters.fromDate) params.append("from_date", filters.fromDate);
  if (filters.toDate) params.append("to_date", filters.toDate);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const res = await fetch(`${API_BASE_URL}/api/sessions/history?${params.toString()}`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch history" }));
    throw new Error(err.detail || "Failed to fetch session history");
  }

  return res.json();
}

export async function deleteCaseSession(
  sessionId: string,
  token?: string
): Promise<void> {
  const authToken = token || getStoredAuthToken();
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete session" }));
    throw new Error(err.detail || "Failed to delete case session");
  }
}
