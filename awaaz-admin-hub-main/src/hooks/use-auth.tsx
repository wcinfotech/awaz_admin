import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "@/lib/api";
import type { AxiosError } from "axios";

type Role = "ADMIN" | "OWNER";

type AdminApproval = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

const normalizeRole = (role?: string): Role => {
  if (!role) return "ADMIN";
  return role.toLowerCase() === "owner" ? "OWNER" : "ADMIN";
};

const normalizeApproval = (
  ownerApproveStatus?: string,
  isVerified?: boolean,
  role?: string
): AdminApproval => {
  if (role?.toLowerCase() === "owner") return "APPROVED";
  const status = (ownerApproveStatus || "").toLowerCase();
  if (status === "rejected") return "REJECTED";
  if (isVerified || status === "approved") return "APPROVED";
  return "PENDING_APPROVAL";
};

interface AuthState {
  email: string;
  role: Role;
  approval?: AdminApproval;
  name?: string;
}

interface AuthContextValue {
  user: AuthState | null;
  token: string | null;
  loading: boolean;
  tokenVerified: boolean;
  loginWithPassword: (payload: { email: string; password: string; remember?: boolean }) => Promise<AuthState>;
  loginWithGoogle: (payload: { email: string }) => Promise<AuthState | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = "awaaz-admin-auth";

const normalizeUserFromApi = (raw: any): AuthState => {
  return {
    email: raw?.email || "",
    role: normalizeRole(raw?.role),
    approval: normalizeApproval(raw?.ownerApproveStatus, raw?.isVerified, raw?.role),
    name: raw?.name || undefined,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setTokenVerified(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const persist = ({ token, user, remember }: { token: string; user: AuthState; remember?: boolean }) => {
    setUser(user);
    setToken(token);
    setTokenVerified(true);
    if (remember !== false) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...user, token }));
    }
  };

  const verifyExistingSession = async (jwt: string) => {
    try {
      const response = await api.post("/admin/v1/auth/verify/token");
      const verifiedUser = response?.data?.body ? normalizeUserFromApi(response.data.body) : null;
      if (verifiedUser) {
        persist({ token: jwt, user: verifiedUser });
      } else {
        setTokenVerified(true);
      }
    } catch (err) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string; email?: string; role?: string; approval?: string; name?: string };
        if (parsed?.token) {
          const normalizedUser = normalizeUserFromApi(parsed);
          setUser(normalizedUser);
          setToken(parsed.token);
          verifyExistingSession(parsed.token);
          return;
        }
      } catch (err) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const loginWithPassword = async ({ email, password, remember }: { email: string; password: string; remember?: boolean }) => {
    if (!email || !password) {
      throw new Error("Missing credentials");
    }

    try {
      const res = await api.post("/admin/v1/auth/login/email", { email, password });
      const body = res?.data?.body;

      if (!body?.token || !body?.user) {
        throw new Error(res?.data?.message || "Login failed");
      }

      const normalizedUser = normalizeUserFromApi(body.user);
      const hydratedUser: AuthState = { ...normalizedUser, email: normalizedUser.email || email };
      persist({ token: body.token, user: hydratedUser, remember });
      return hydratedUser;
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>;
      const message = apiError?.response?.data?.message || (apiError as any)?.message || "Login failed";
      throw new Error(message);
    }
  };

  const loginWithGoogle = async ({ email }: { email: string }) => {
    if (!email) {
      throw new Error("Email required");
    }
    try {
      const res = await api.post("/admin/v1/auth/login-and-register/google", { email });
      const body = res?.data?.body;

      if (body?.token && body?.user) {
        const normalizedUser = normalizeUserFromApi(body.user);
        const hydratedUser: AuthState = { ...normalizedUser, email: normalizedUser.email || email };
        persist({ token: body.token, user: hydratedUser });
        return hydratedUser;
      }

      return null;
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>;
      const message = apiError?.response?.data?.message || (apiError as any)?.message || "Login failed";
      throw new Error(message);
    }
  };

  const logout = () => {
    clearAuth();
  };

  const value = useMemo(
    () => ({ user, token, loading, tokenVerified, loginWithPassword, loginWithGoogle, logout }),
    [user, token, loading, tokenVerified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If the admin is pending approval, redirect to pending page
  if (user && user.approval === "PENDING_APPROVAL") {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}
