import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Bell, User, Settings, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Trophy, label: "Matches", href: "/matches" },
    { icon: Users, label: "Leaderboard", href: "/leaderboard" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Users, label: "Friends", href: "/friends" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
  ];

  if (user?.isAdmin) {
    navItems.push({ icon: ShieldAlert, label: "Admin Panel", href: "/admin" });
  }

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-sidebar border-r border-sidebar-border z-40">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">BBPW</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10", isActive && "text-primary")} />
                <span className="font-medium relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden ring-2 ring-primary/20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary text-primary font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{user?.username}</div>
              <div className="text-xs text-gold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                {user?.coins?.toLocaleString()}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => logout.mutate(undefined)}
            className="text-muted-foreground hover:text-white p-2 transition-colors rounded-md hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileTabBar() {
  const [location] = useLocation();
  
  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Trophy, label: "Matches", href: "/matches" },
    { icon: Users, label: "Rank", href: "/leaderboard" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border z-40 flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <div className={cn(
              "flex flex-col items-center justify-center gap-1 h-full",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}