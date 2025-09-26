import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  BarChart3,
  ChevronLeft,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Palette,
  ScrollText,
  Server,
  Settings,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { BlokLink, useBlokRouter } from "../lib/blok-navigation";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import React from "react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { useAnimation } from "../contexts/AnimationContext";
import { useAuth } from "../contexts/AuthContext";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
  { name: "System Logs", href: "/logs", icon: ScrollText, adminOnly: true },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Security", href: "/security", icon: Shield },
  { name: "Themes", href: "/themes", icon: Palette },
  { name: "System", href: "/system", icon: Server, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const { shouldAnimate } = useAnimation();
  const router = useBlokRouter();
  const [navigationRef] = useAutoAnimate({ duration: shouldAnimate ? 200 : 0 });
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    const checkIsDesktop = () => {
      if (typeof window !== "undefined") {
        setIsDesktop(window.innerWidth >= 1024);
      }
    };

    // Initial check
    checkIsDesktop();

    // Set up resize listener
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkIsDesktop);
    }

    // Mark as initialized after a short delay to prevent initial animations
    const initTimer = setTimeout(() => {
      setHasInitialized(true);
    }, 100);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkIsDesktop);
      }
      clearTimeout(initTimer);
    };
  }, []);

  const handleLogout = async () => {
    // The logout function in AuthContext handles navigation to login
    await logout();
  };

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Enhanced animation configuration
  const animationConfig = {
    width: isCollapsed ? 64 : 256,
    x: isDesktop ? 0 : isOpen ? 0 : -280,
  };

  const transitionConfig = {
    type: "spring" as const,
    damping: 25,
    stiffness: 200,
    mass: 0.8,
    duration: hasInitialized && shouldAnimate ? undefined : 0, // No animation on initial load
  };

  return (
    <motion.div
      initial={animationConfig} // Start with final position to prevent flash
      animate={animationConfig}
      transition={transitionConfig}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 glass-card m-4 rounded-2xl flex flex-col overflow-hidden sidebar-container",
        isDesktop && "lg:translate-x-0",
        isAnimating && "animating"
      )}
      style={{
        // Ensure proper layering and smooth rendering
        willChange: isAnimating ? "transform, width" : "auto",
        backfaceVisibility: "hidden",
        perspective: 1000,
      }}
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          "flex h-16 items-center px-4 flex-shrink-0",
          isCollapsed ? "justify-center" : "justify-between px-6"
        )}
      >
        <motion.div
          initial={false}
          animate={{
            opacity: isCollapsed ? 0 : 1,
            scale: isCollapsed ? 0.8 : 1,
            x: isCollapsed ? -20 : 0,
          }}
          transition={{
            duration: hasInitialized && shouldAnimate ? 0.25 : 0,
            ease: "easeOut",
          }}
          style={{
            display: isCollapsed ? "none" : "block",
            transformOrigin: "left center",
          }}
        >
          <h1 className="text-xl font-bold text-foreground">Blok Admin</h1>
        </motion.div>

        <div className="flex items-center gap-2">
          {/* Desktop collapse button */}
          <motion.div
            whileHover={shouldAnimate && hasInitialized ? { scale: 1.05 } : {}}
            whileTap={shouldAnimate && hasInitialized ? { scale: 0.95 } : {}}
            transition={{ duration: 0.1 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex glass-button glass-button-hover text-muted-foreground hover:text-foreground"
              onClick={onToggleCollapse}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{
                  duration: hasInitialized && shouldAnimate ? 0.3 : 0,
                  ease: "easeInOut",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden glass-button glass-button-hover text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation - flex-1 to take available space */}
      <nav className={cn("mt-8 flex-1", isCollapsed ? "px-2" : "px-4")}>
        <div ref={navigationRef} className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = router.isActive(item.href);
            return (
              <motion.div
                key={item.name}
                whileHover={
                  shouldAnimate && hasInitialized ? { x: 2, scale: 1.01 } : {}
                }
                whileTap={
                  shouldAnimate && hasInitialized ? { scale: 0.98 } : {}
                }
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <BlokLink
                  href={item.href}
                  onClick={onClose} // Auto-hide on mobile
                  className={cn(
                    "flex items-center text-sm rounded-lg transition-all duration-200 glass-button glass-button-hover",
                    isCollapsed
                      ? "justify-center p-3 w-12 h-12 mx-auto"
                      : "gap-3 px-3 py-2",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0",
                      isCollapsed ? "h-5 w-5" : "h-5 w-5"
                    )}
                  />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: isCollapsed ? 0 : 1,
                      x: isCollapsed ? -10 : 0,
                    }}
                    transition={{
                      duration: hasInitialized && shouldAnimate ? 0.2 : 0,
                      ease: "easeOut",
                    }}
                    className="truncate"
                    style={{ display: isCollapsed ? "none" : "inline" }}
                  >
                    {item.name}
                  </motion.span>
                </BlokLink>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User controls at bottom - flex-shrink-0 to maintain size */}
      <div className={cn("flex-shrink-0 p-4", isCollapsed ? "px-2" : "px-4")}>
        {isCollapsed ? (
          /* Collapsed sidebar - user controls as navigation items */
          <div className="space-y-2">
            {/* Avatar button - exact nav item structure */}
            <div
              className="flex items-center text-sm rounded-lg transition-all duration-200 glass-button glass-button-hover justify-center p-3 w-12 h-12 mx-auto text-muted-foreground hover:text-foreground cursor-pointer"
              title={user?.name || "User Profile"}
            >
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Logout button - exact nav item structure */}
            <button
              onClick={handleLogout}
              className="flex items-center text-sm rounded-lg transition-all duration-200 glass-button glass-button-hover justify-center p-3 w-12 h-12 mx-auto text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
            </button>
          </div>
        ) : (
          /* Expanded sidebar layout */
          <div className="glass-card rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/10">
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-1">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant={user?.role === "admin" ? "default" : "secondary"}
                className={cn(
                  "text-xs font-medium",
                  user?.role === "admin"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                    : "bg-white/10 text-muted-foreground border-white/10"
                )}
              >
                {user?.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                {user?.role}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-3 glass-button glass-button-hover text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
