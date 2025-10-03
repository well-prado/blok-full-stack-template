import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWorkflowMutation, useWorkflowQuery } from "../blok-types";

import { blokRouter } from "../lib/blok-router";
import { toast } from "sonner";
import { useSafeAuth } from "../hooks/useSafeAuth";

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category?: string;
  metadata?: Record<string, any>;
  sourceWorkflow?: string;
  sourceNode?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Drawer state
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  // Actions
  fetchNotifications: (options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  markAsRead: (notificationId: string, isRead?: boolean) => Promise<void>;
  clearAllNotifications: (markAsRead?: boolean) => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => void;

  // Utility
  getNotificationsByType: (type: Notification["type"]) => Notification[];
  getNotificationsByPriority: (
    priority: Notification["priority"]
  ) => Notification[];
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useSafeAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // SDK hooks for notification operations
  const notificationsQuery = useWorkflowQuery({
    workflowKey: "user-notifications",
    input: {
      userId: "current", // The backend should handle current user context
      unreadOnly: false,
      limit: 50,
      offset: 0,
    },
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const markNotificationMutation = useWorkflowMutation({
    workflowKey: "mark-notification-read",
    onSuccess: () => {
      // Refetch notifications to get updated state
      notificationsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update notification: ${error.message}`);
    },
  });

  const clearAllMutation = useWorkflowMutation({
    workflowKey: "clear-all-notifications",
    onSuccess: () => {
      // Refetch notifications to get updated state
      notificationsQuery.refetch();
      toast.success("All notifications cleared");
    },
    onError: (error) => {
      toast.error(`Failed to clear notifications: ${error.message}`);
    },
  });

  // Update notifications from SDK query data
  useEffect(() => {
    if (notificationsQuery.data?.success && notificationsQuery.data.data) {
      const data = notificationsQuery.data.data as any;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError(null);
    } else if (notificationsQuery.error) {
      setError(notificationsQuery.error.message);
    }
    setLoading(notificationsQuery.isLoading);
  }, [
    notificationsQuery.data,
    notificationsQuery.error,
    notificationsQuery.isLoading,
  ]);

  // Legacy fetchNotifications function (now just triggers refetch)
  const fetchNotifications = useCallback(
    async (
      _options: {
        unreadOnly?: boolean;
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      // Don't fetch notifications if user is not authenticated
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
        setLoading(false);
        return;
      }

      // Use SDK query refetch instead of direct API call
      await notificationsQuery.refetch();
    },
    [isAuthenticated, notificationsQuery]
  );

  // Mark notification as read/unread
  const markAsRead = useCallback(
    async (notificationId: string, isRead: boolean = true) => {
      try {
        await markNotificationMutation.mutateAsync({
          notificationId,
          isRead,
        });

        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead,
                  readAt: isRead ? new Date().toISOString() : undefined,
                }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => (isRead ? Math.max(0, prev - 1) : prev + 1));

        toast.success(`Notification marked as ${isRead ? "read" : "unread"}`);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        toast.error("Failed to update notification");
      }
    },
    [markNotificationMutation]
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(
    async (markAsRead: boolean = false) => {
      try {
        await clearAllMutation.mutateAsync({
          action: markAsRead ? "mark_as_read" : "delete",
          userId: "current", // Backend should handle current user context
        });

        if (markAsRead) {
          // Mark all as read locally
          setNotifications((prev) =>
            prev.map((notification) => ({
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            }))
          );
          setUnreadCount(0);
        } else {
          // Clear all notifications
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (err) {
        console.error("Failed to clear notifications:", err);
        toast.error("Failed to clear notifications");
      }
    },
    [clearAllMutation]
  );

  // Add notification locally (for real-time updates)
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: notification.actionUrl
          ? {
              label: notification.actionLabel || "View",
              onClick: () => {
                if (notification.actionUrl) {
                  blokRouter.push(notification.actionUrl);
                }
              },
            }
          : {
              label: "View All",
              onClick: () => setIsDrawerOpen(true),
            },
      });
    },
    []
  );

  // Utility functions
  const getNotificationsByType = useCallback(
    (type: Notification["type"]) => {
      return notifications.filter((notification) => notification.type === type);
    },
    [notifications]
  );

  const getNotificationsByPriority = useCallback(
    (priority: Notification["priority"]) => {
      return notifications.filter(
        (notification) => notification.priority === priority
      );
    },
    [notifications]
  );

  const refreshNotifications = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  // Load notifications only when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // No need to call fetchNotifications here - the SDK query handles this automatically
      // The notificationsQuery will auto-fetch when enabled becomes true
    } else {
      // Clear notifications when user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isAuthenticated]); // REMOVED fetchNotifications from dependencies

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      isDrawerOpen,
      setIsDrawerOpen,
      fetchNotifications,
      markAsRead,
      clearAllNotifications,
      addNotification,
      getNotificationsByType,
      getNotificationsByPriority,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      isDrawerOpen,
      fetchNotifications,
      markAsRead,
      clearAllNotifications,
      addNotification,
      getNotificationsByType,
      getNotificationsByPriority,
      refreshNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
