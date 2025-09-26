import React from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Clock,
  User,
  Shield,
  Database,
  Loader2,
} from "lucide-react";
import { useBlokRouter } from "../hooks/useBlokRouter";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

import {
  type Notification,
  useNotifications,
} from "../contexts/NotificationContext";
import { useAnimation } from "../contexts/AnimationContext";
import { AnimatedButton } from "./AnimatedButton";

// Icon mapping for notification types
const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    case "system":
      return Settings;
    default:
      return Info;
  }
};

// Category icon mapping
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case "user":
      return User;
    case "security":
      return Shield;
    case "system":
      return Database;
    case "workflow":
      return Settings;
    default:
      return Info;
  }
};

// Priority color mapping
const getPriorityColor = (priority: Notification["priority"]) => {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

// Type color mapping
const getTypeColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    case "system":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string, isRead: boolean) => void;
  onNavigate: (url?: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
}: NotificationItemProps) {
  const { shouldAnimate: isAnimationEnabled } = useAnimation();
  const TypeIcon = getNotificationIcon(notification.type);
  const CategoryIcon = getCategoryIcon(notification.category);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id, !notification.isRead);
  };

  const handleNavigate = () => {
    if (notification.actionUrl) {
      onNavigate(notification.actionUrl);
    }
    // Mark as read when clicked
    if (!notification.isRead) {
      onMarkAsRead(notification.id, true);
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50, height: 0 },
  };

  return (
    <motion.div
      variants={isAnimationEnabled ? itemVariants : undefined}
      initial={isAnimationEnabled ? "initial" : undefined}
      animate={isAnimationEnabled ? "animate" : undefined}
      exit={isAnimationEnabled ? "exit" : undefined}
      transition={{ duration: 0.2 }}
      className={`group relative p-4 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      onClick={handleNavigate}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-6 w-2 h-2 bg-primary rounded-full" />
      )}

      <div className="flex items-start gap-3 ml-3">
        {/* Type Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            notification.isRead ? "bg-muted" : "bg-primary/10"
          }`}
        >
          <TypeIcon
            className={`h-4 w-4 ${getTypeColor(notification.type)} ${
              !notification.isRead ? "animate-pulse" : ""
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-medium leading-tight ${
                  !notification.isRead
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {notification.title}
              </h4>
              <p
                className={`text-sm mt-1 leading-snug ${
                  !notification.isRead
                    ? "text-muted-foreground"
                    : "text-muted-foreground/70"
                }`}
              >
                {notification.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleMarkAsRead}
              >
                {notification.isRead ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
              </Button>
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(notification.actionUrl);
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <CategoryIcon className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/60 capitalize">
                {notification.category || "general"}
              </span>
            </div>

            <Badge
              variant={getPriorityColor(notification.priority) as any}
              className="text-xs px-1.5 py-0.5 h-auto"
            >
              {notification.priority}
            </Badge>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {notification.actionUrl && notification.actionLabel && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(notification.actionUrl);
                }}
              >
                {notification.actionLabel}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationDrawer() {
  const router = useBlokRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isDrawerOpen,
    setIsDrawerOpen,
    fetchNotifications,
    markAsRead,
    clearAllNotifications,
  } = useNotifications();

  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore] = React.useState(true); // Will be used for pagination logic later

  // Listen for custom event from Sonner toasts
  React.useEffect(() => {
    const handleOpenDrawer = () => {
      setIsDrawerOpen(true);
    };

    window.addEventListener("openNotificationDrawer", handleOpenDrawer);
    return () => {
      window.removeEventListener("openNotificationDrawer", handleOpenDrawer);
    };
  }, [setIsDrawerOpen]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      await markAsRead(id, isRead);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications(false); // Delete instead of just marking as read
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((notification) =>
          markAsRead(notification.id, true)
        )
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      await fetchNotifications({
        offset: notifications.length,
        limit: 10,
      });
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleNavigate = (url?: string) => {
    if (url) {
      router.push(url);
      setIsDrawerOpen(false);
    }
  };

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      direction="right"
    >
      <DrawerTrigger asChild>
        <div className="relative">
          <AnimatedButton
            variant="ghost"
            size="sm"
            className="glass-button glass-button-hover"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell className="h-4 w-4" />
          </AnimatedButton>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full text-xs font-medium min-w-[18px] h-[18px] flex items-center justify-center leading-none z-10"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </div>
      </DrawerTrigger>

      <DrawerContent className="h-screen w-[400px] ml-auto mt-0 rounded-l-2xl rounded-r-none">
        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b border-border/50 bg-gradient-to-br from-background via-background to-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-lg font-semibold">
                  Notifications
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "All caught up!"}
                </DrawerDescription>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark All Read
                  </Button>
                )}

                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1">
            <div className="relative">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading notifications...
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <XCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Failed to load notifications
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNotifications()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              )}

              {/* Load More Button */}
              {hasMore && notifications.length > 0 && !loading && (
                <div className="p-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      "Load more notifications"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
