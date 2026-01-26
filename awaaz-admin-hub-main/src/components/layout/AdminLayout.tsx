import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        isMobile={isMobile}
        open={isMobile ? mobileSidebarOpen : true}
        onToggle={handleToggleSidebar}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <AdminHeader
          title={title}
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
