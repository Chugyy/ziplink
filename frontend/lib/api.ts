const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8900";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || "Request failed", res.status);
  }

  return res.json();
}

export const api = {
  // Auth
  signup: (email: string, password: string) =>
    request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/api/auth/me"),

  // Links
  createLink: (data: {
    destination_url: string;
    title?: string;
    custom_slug?: string;
  }) =>
    request("/api/links", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listLinks: (limit = 50, offset = 0) =>
    request(`/api/links?limit=${limit}&offset=${offset}`),

  getLinkStats: (slug: string) => request(`/api/links/${slug}/stats`),

  updateLink: (
    id: string,
    data: { title?: string; destination_url?: string; is_active?: boolean }
  ) =>
    request(`/api/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteLink: (id: string) =>
    request(`/api/links/${id}`, { method: "DELETE" }),

  // Stats
  overviewStats: () => request("/api/stats/overview"),
};

export { ApiError };
