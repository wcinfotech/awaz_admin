import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function AdminHeader({
  title,
  onToggleSidebar,
  sidebarCollapsed,
}: AdminHeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted md:inline-flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search across Awaaz"
            className="w-72 bg-background pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-foreground hover:border-foreground"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground">
            <img src="/awaz_logo.png" alt="Awaaz logo" className="h-6 w-6" />
            <span>Awaaz Operator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
