export const EVENTS_KEY = "awaaz:events";
export const POSTS_KEY = "awaaz:general_posts";
export const LOGS_KEY = "awaaz:logs";
const useMock = (import.meta.env.VITE_USE_MOCK || "false").toLowerCase() === "true";

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
    // In a real app, handle quota/storage errors
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    return null;
  }
}

// Events
export function saveEvents(events: any[]) {
  saveToStorage(EVENTS_KEY, events);
  try {
    window.dispatchEvent(new Event("awaaz-events-changed"));
  } catch (e) {
    // noop
  }
}

export function loadEvents(): any[] | null {
  return loadFromStorage<any[]>(EVENTS_KEY);
}

// Posts (General)
export function savePosts(posts: any[]) {
  saveToStorage(POSTS_KEY, posts);
}

export function loadPosts(): any[] | null {
  return loadFromStorage<any[]>(POSTS_KEY);
}

// Logs
export function saveLogs(logs: any[]) {
  saveToStorage(LOGS_KEY, logs);
}

export function loadLogs(): any[] | null {
  return loadFromStorage<any[]>(LOGS_KEY);
}

export function addLog(entry: any) {
  const current = loadLogs() || [];
  const next = [entry, ...current];
  saveLogs(next);
  // Notify listeners
  try {
    window.dispatchEvent(new Event("awaaz-logs-changed"));
  } catch (e) {
    // noop
  }
}

// Admins (registration / approval)
export const ADMINS_KEY = "awaaz:admins";

export type AdminStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type AdminRole = "ADMIN" | "OWNER";

export interface AdminRecord {
  id: string;
  fullName: string;
  email: string;
  password?: string; // for demo only
  status: AdminStatus;
  role: AdminRole;
  createdAt: string;
}

export function saveAdmins(admins: AdminRecord[]) {
  saveToStorage(ADMINS_KEY, admins);
  try {
    window.dispatchEvent(new Event("awaaz-admins-changed"));
  } catch (e) {
    // noop
  }
}

export function loadAdmins(): AdminRecord[] | null {
  return loadFromStorage<AdminRecord[]>(ADMINS_KEY);
}

export function addAdmin(admin: AdminRecord) {
  const current = loadAdmins() || [];
  const next = [admin, ...current];
  saveAdmins(next);
}

export function updateAdminStatus(email: string, status: AdminStatus) {
  const current = loadAdmins() || [];
  const next = current.map((a) => (a.email.toLowerCase() === email.toLowerCase() ? { ...a, status } : a));
  saveAdmins(next);
}

// Seed initial admin data (only if none exists)
if (useMock) {
  (function seedAdmins() {
    try {
      if (!loadAdmins()) {
        const owner: AdminRecord = {
          id: "admin-owner",
          fullName: "Super Admin",
          email: "owner@awaaz.com",
          password: "ownerpass",
          status: "APPROVED",
          role: "OWNER",
          createdAt: new Date().toISOString(),
        };
        const sampleApproved: AdminRecord = {
          id: "admin-001",
          fullName: "Rohini Patel",
          email: "admin1@awaaz.com",
          password: "adminpass",
          status: "APPROVED",
          role: "ADMIN",
          createdAt: new Date().toISOString(),
        };
        const samplePending: AdminRecord = {
          id: "admin-002",
          fullName: "Yusuf Khan",
          email: "pending1@awaaz.com",
          password: "pendingpass",
          status: "PENDING_APPROVAL",
          role: "ADMIN",
          createdAt: new Date().toISOString(),
        };
        saveAdmins([owner, sampleApproved, samplePending]);
      }
    } catch (e) {
      // noop
    }
  })();

  // DEV: auto-login as Super Admin (owner) for convenience during local development
  // This writes the same auth shape used by the AuthProvider. Remove in production.
  (function seedOwnerAuth() {
    try {
      const AUTH_KEY = "awaaz-admin-auth";
      if (!localStorage.getItem(AUTH_KEY)) {
        localStorage.setItem(
          AUTH_KEY,
          JSON.stringify({ token: "awaaz-operator-token", email: "owner@awaaz.com", role: "OWNER", approval: "APPROVED" })
        );
        // Notify listeners if any
        try {
          window.dispatchEvent(new Event("awaaz-admins-changed"));
        } catch (e) {
          // noop
        }
      }
    } catch (e) {
      // noop
    }
  })();
}

// -----------------------------
// Reports & Users (admin actions)
// -----------------------------
export const REPORTS_KEY = "awaaz:reports";
export type ReportType = "POST" | "USER" | "COMMENT";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export interface ReportRecord {
  id: string;
  type: ReportType;
  reason: string;
  createdAt: string;
  status: ReportStatus;
  // optional target information to locate item
  targetId?: string; // post/comment id
  targetUserEmail?: string; // for USER reports
  details?: string;
  // admin remarks and warnings (audit)
  remarks?: { id: string; admin: string; text: string; createdAt: string }[];
  warnings?: { id: string; to: string; subject?: string; body: string; createdAt: string }[];
  // resolution metadata
  resolvedBy?: "user" | "admin";
  resolvedAt?: string;
}

export function saveReports(reports: ReportRecord[]) {
  saveToStorage(REPORTS_KEY, reports);
  try {
    window.dispatchEvent(new Event("awaaz-reports-changed"));
  } catch (e) {
    // noop
  }
}

export function loadReports(): ReportRecord[] | null {
  return loadFromStorage<ReportRecord[]>(REPORTS_KEY);
}

export const AUTO_BLOCK_THRESHOLD = 3; // number of OPEN reports to trigger auto-block

export function addReport(report: ReportRecord) {
  const current = loadReports() || [];
  const next = [report, ...current];
  saveReports(next);

  // Auto-block logic: if the report targets a user, count OPEN reports for that user
  try {
    if (report.targetUserEmail) {
      const target = report.targetUserEmail.toLowerCase();
      const openReportsForUser = next.filter((r) => r.targetUserEmail && r.targetUserEmail.toLowerCase() === target && r.status === "OPEN");
      if (openReportsForUser.length >= AUTO_BLOCK_THRESHOLD) {
        // block the user automatically
        blockUser(target, "auto");
        // notify the user
        addNotification({ id: `notif-${Date.now()}`, to: target, subject: "Account blocked", body: `Your account has been automatically blocked due to ${openReportsForUser.length} reports. Please contact support to appeal.`, createdAt: new Date().toISOString() });
        // audit log
        addLog({ id: `log-${Date.now()}`, timestamp: new Date().toLocaleString(), level: "warning", type: "user", user: "system", action: "Auto Block", details: `Auto-blocked ${target} after ${openReportsForUser.length} open reports` });
      }
    }
  } catch (e) {
    // noop
  }
}

export function updateReportStatus(reportId: string, status: ReportStatus) {
  const current = loadReports() || [];
  const next = current.map((r) => (r.id === reportId ? { ...r, status } : r));
  saveReports(next);
}

export function setReportResolvedBy(reportId: string, by: "user" | "admin") {
  const current = loadReports() || [];
  const next = current.map((r) => (r.id === reportId ? { ...r, resolvedBy: by, resolvedAt: new Date().toISOString(), status: "RESOLVED" } : r));
  saveReports(next as ReportRecord[]);
}

export function reopenReport(reportId: string) {
  const current = loadReports() || [];
  const next = current.map((r) => (r.id === reportId ? { ...r, status: "OPEN", resolvedBy: undefined, resolvedAt: undefined } : r));
  saveReports(next as ReportRecord[]);
}

export function addReportRemark(reportId: string, remark: { id: string; admin: string; text: string; createdAt: string }) {
  const current = loadReports() || [];
  const next = current.map((r) => (r.id === reportId ? { ...r, remarks: [...(r.remarks || []), remark] } : r));
  saveReports(next as ReportRecord[]);
}

export function addReportWarning(reportId: string, warning: { id: string; to: string; subject: string; body: string; createdAt: string }) {
  const current = loadReports() || [];
  const next = current.map((r) => (r.id === reportId ? { ...r, warnings: [...(r.warnings || []), warning] } : r));
  saveReports(next as ReportRecord[]);
}

// Notifications
export const NOTIFICATIONS_KEY = "awaaz:notifications";
export interface NotificationRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
  seen?: boolean;
}

export function saveNotifications(notifs: NotificationRecord[]) {
  saveToStorage(NOTIFICATIONS_KEY, notifs);
  try {
    window.dispatchEvent(new Event("awaaz-notifications-changed"));
  } catch (e) {
    // noop
  }
}

export function loadNotifications(): NotificationRecord[] | null {
  return loadFromStorage<NotificationRecord[]>(NOTIFICATIONS_KEY);
}

export function addNotification(notif: NotificationRecord) {
  const current = loadNotifications() || [];
  const next = [notif, ...current];
  saveNotifications(next);
}

export function updateNotification(id: string, patch: Partial<NotificationRecord>) {
  const current = loadNotifications() || [];
  const next = current.map((n) => (n.id === id ? { ...n, ...patch } : n));
  saveNotifications(next);
}

export function markAllNotificationsRead() {
  const current = loadNotifications() || [];
  const next = current.map((n) => ({ ...n, seen: true }));
  saveNotifications(next);
}

export function deleteNotification(id: string) {
  const current = loadNotifications() || [];
  const next = current.filter((n) => n.id !== id);
  saveNotifications(next);
}

// Admin FCM Token (for demo)
export const ADMIN_FCM_TOKEN_KEY = "awaaz:admin_fcm_token";

export function saveAdminFcmToken(token: string) {
  try {
    saveToStorage(ADMIN_FCM_TOKEN_KEY, token);
    try {
      window.dispatchEvent(new Event("awaaz-admin-fcm-changed"));
    } catch (e) {
      // noop
    }
  } catch (e) {
    // noop
  }
}

export function loadAdminFcmToken(): string | null {
  try {
    return loadFromStorage<string>(ADMIN_FCM_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

// Users storage
export const USERS_KEY = "awaaz:users";
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  blockedBy?: "admin" | "auto";
  blockedAt?: string;
}

export function saveUsers(users: UserRecord[]) {
  saveToStorage(USERS_KEY, users);
  try {
    window.dispatchEvent(new Event("awaaz-users-changed"));
  } catch (e) {
    // noop
  }
}

export function loadUsers(): UserRecord[] | null {
  return loadFromStorage<UserRecord[]>(USERS_KEY);
}

export function updateUserStatus(emailOrId: string, status: UserRecord["status"]) {
  const current = loadUsers() || [];
  const next = current.map((u) => (u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId ? { ...u, status } : u));
  saveUsers(next);
}

export function blockUser(emailOrId: string, by: "admin" | "auto") {
  const current = loadUsers() || [];
  const next = current.map((u) =>
    u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId
      ? ({ ...u, status: "inactive" as UserRecord["status"], blockedBy: by, blockedAt: new Date().toISOString() } as UserRecord)
      : u
  );
  saveUsers(next);
}

export function unblockUser(emailOrId: string) {
  const current = loadUsers() || [];
  const next = current.map((u) =>
    u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId
      ? ({ ...u, status: "active" as UserRecord["status"], blockedBy: undefined, blockedAt: undefined } as UserRecord)
      : u
  );
  saveUsers(next);
}

// Seed some demo users if none exist
if (useMock) {
  (function seedUsers() {
    try {
      if (!loadUsers()) {
        const demo: UserRecord[] = [
          { id: "1", name: "Rahul Sharma", email: "rahul.sharma@example.com", role: "admin", status: "active", joinedAt: new Date().toISOString() },
          { id: "2", name: "Priya Patel", email: "priya.patel@example.com", role: "moderator", status: "active", joinedAt: new Date().toISOString() },
          { id: "3", name: "Amit Singh", email: "amit.singh@example.com", role: "user", status: "pending", joinedAt: new Date().toISOString() },
        ];
        saveUsers(demo);
      }
    } catch (e) {
      // noop
    }
  })();
}
