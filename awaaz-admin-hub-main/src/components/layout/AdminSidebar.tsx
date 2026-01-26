import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
  LifeBuoy,
  Megaphone,
  AlertTriangle,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Users2 } from "lucide-react";

function OwnerAdminRequests() {
  const { user } = useAuth();
  if (!user || user.role !== "OWNER") return null;
  return (
    <NavLink
      to="/admin-requests"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
      activeClassName="text-sidebar-primary bg-sidebar-accent"
    >
      <Users2 className="h-5 w-5 flex-shrink-0" />
      <span className="ml-1">Admin Requests</span>
    </NavLink>
  );
}

const primaryItems = [
  { title: "Event", url: "/", icon: Megaphone },
  // { title: "General", url: "/general", icon: FileText },
  // { title: "Rescue", url: "/rescue", icon: LifeBuoy },
  { title: "SOS", url: "/sos", icon: AlertTriangle },
];

const groupedItems = [
  {
    title: "Report",
    icon: ClipboardList,
    defaultOpen: true,
    children: [
      { title: "Post", url: "/reports?tab=post" },
      { title: "Comment", url: "/reports?tab=comment" },
      { title: "Profile", url: "/reports?tab=profile" },
    ],
  },
  {
    title: "User Manage",
    icon: Users,
    defaultOpen: true,
    children: [
      // { title: "User", url: "/users?tab=user" },
      { title: "App Users", url: "/app-users" },
      { title: "Blocked Users", url: "/blocked-users" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    defaultOpen: false,
    children: [],
    url: "/notifications",
  },
  {
    title: "Logs",
    icon: ScrollText,
    defaultOpen: false,
    children: [],
    url: "/logs",
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  open?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  isMobile = false,
  open = true,
  onCloseMobile,
}: AdminSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groupedItems.forEach((group) => {
      initial[group.title] = group.defaultOpen ?? false;
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    onCloseMobile?.();
  };
  return (
    <>
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          isMobile && "w-64",
          isMobile && (open ? "translate-x-0" : "-translate-x-full")
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent p-1 ring-1 ring-sidebar-border">
                <img src="/awaz_logo.png" alt="Awaaz logo" className="h-full w-full object-contain" />
              </div>
              {!collapsed && (
                <span className="text-lg font-semibold tracking-tight animate-fade-in">
                  Awaaz Operator
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            <div className="space-y-1">
              {primaryItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.url === "/"}
                  onClick={isMobile ? onCloseMobile : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-primary"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="animate-fade-in">{item.title}</span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="space-y-2">
              {groupedItems.map((section) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.title];
                const hasChildren = section.children && section.children.length > 0;

                return (
                  <div key={section.title} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <SectionIcon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{section.title}</span>}
                      </span>
                      {!collapsed && hasChildren && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isOpen && "-rotate-90"
                          )}
                        />
                      )}
                    </button>

                    {!collapsed && hasChildren && isOpen && (
                      <div className="space-y-1 pl-4">
                        {section.children.map((child) => (
                          <NavLink
                            key={child.title}
                            to={child.url}
                            onClick={isMobile ? onCloseMobile : undefined}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                            activeClassName="text-sidebar-primary bg-sidebar-accent"
                          >
                            <span className="ml-1">{child.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}

                    {!collapsed && !hasChildren && (
                      <NavLink
                        to={section.url ?? "/"}
                        onClick={isMobile ? onCloseMobile : undefined}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        activeClassName="text-sidebar-primary bg-sidebar-accent"
                      >
                        <span className="ml-1">{section.title}</span>
                      </NavLink>
                    )}
                  </div>
                );
              })}

              {/* Admin Requests (only visible to Owners) */}
              {!collapsed && (
                <div>
                  <OwnerAdminRequests />
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-3">
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "text-muted-foreground",
                collapsed && "justify-center px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>

          {/* Toggle Button */}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md transition-transform hover:scale-110"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-foreground" />
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
