import axios from "axios";

// Toggle mock mode to avoid backend dependency.
const useMock = (import.meta.env.VITE_USE_MOCK_API || "false").toLowerCase() === "true";

let api: {
  get: typeof axios.get;
  post: typeof axios.post;
  put: typeof axios.put;
  delete: typeof axios.delete;
};

if (useMock) {
  const mockResponse = <T>(data: T) => Promise.resolve({ data } as { data: T });

  api = {
    get: async (_url: string) => mockResponse<any>([]),
    delete: async (_url: string) => mockResponse<any>({ success: true }),
    put: async (_url: string, _body?: any) => mockResponse<any>({ success: true }),
    post: async (url: string, body?: any) => {
      // Happy-path mocks for auth flows so UI can proceed without backend.
      if (url.includes("/admin/v1/auth/login/email")) {
        return mockResponse({
          body: {
            token: "mock-token",
            user: { email: body?.email || "demo@awaaz.com", role: "owner" },
          },
        });
      }
      if (url.includes("/admin/v1/auth/login-and-register/google")) {
        return mockResponse({
          body: {
            token: "mock-token",
            user: { email: body?.email || "google@awaaz.com", role: "owner" },
          },
        });
      }
      if (url.includes("/admin/v1/auth/verify/token")) {
        return mockResponse({ status: true });
      }
      return mockResponse({ success: true });
    },
  } as const;
} else {
  // Prefer explicit API host; fall back to local backend.
  const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
  const realApi = axios.create({
    baseURL,
    timeout: 10000,
  });

  realApi.interceptors.request.use((config) => {
    const stored = localStorage.getItem("awaaz-admin-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string };
        if (parsed.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (_) {
        // ignore parse errors
      }
    }
    return config;
  });

  realApi.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem("awaaz-admin-auth");
      }
      return Promise.reject(error);
    }
  );

  api = realApi;
}

export default api;
