import { NavLink, Outlet, Link } from "react-router-dom";
import { Brain, LayoutDashboard, FileText, Users, MessageSquare, BarChart3, Settings, LogOut } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/jobs", icon: FileText, label: "Job Profiles" },
  { to: "/dashboard/candidates", icon: Users, label: "Candidates" },
  { to: "/dashboard/interviews", icon: MessageSquare, label: "Interviews" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-accent-foreground">RecruitAI</span>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <NavLink
            to="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
