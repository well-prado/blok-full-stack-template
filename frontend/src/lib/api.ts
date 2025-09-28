/**
 * API Client for Blok Backend
 * Handles authentication, user management, and admin operations
 */

import { ErrorHandler } from "./error-handler";

const API_BASE_URL = 'http://localhost:4000/api';

export interface LoginRequest {
  email: string;
  password: string;
  sessionDurationHours?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'USER';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  emailVerified: boolean;
  profileImage?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    language?: string;
    timezone?: string;
    bio?: string;
  };
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
  message: string;
  statusCode: number;
}

export interface AdminDashboard {
  success: boolean;
  dashboard: {
    title: string;
    user: User;
    stats: {
      totalUsers: number;
      adminUsers: number;
      regularUsers: number;
      verifiedUsers: number;
    };
    recentActivity: {
      lastLogin: string;
      systemStatus: string;
      uptime: number;
    };
    quickActions: Array<{
      name: string;
      endpoint: string;
      method: string;
    }>;
  };
  statusCode: number;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  message: string;
  statusCode: number;
}

class ApiClient {
  constructor() {
    // Authentication is now handled entirely via session cookies
  }

  // Cookie management is now handled by the backend via Set-Cookie headers
  // Authentication state is managed via server injection (Laravel + Inertia.js style)

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge existing headers if they exist
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Session authentication is handled via cookies automatically
    // No need to set Authorization header as backend reads from cookies

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important: Include cookies in requests
    });

    // Use ErrorHandler for response handling
    await ErrorHandler.handleResponse(response, {
      showToast: true,
      redirectToLogin: true,
    });

    return response.json();
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Session cookie is now set by the backend via Set-Cookie header
    // No need to manually set cookies on the frontend

    return response;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth-register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Session cookie is now set by the backend via Set-Cookie header
    // No need to manually set cookies on the frontend

    return response;
  }

  async logout(): Promise<void> {
    try {
      // Backend will handle session cleanup via cookie
      await this.request('/auth-logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } finally {
      // Clear session cookies
      document.cookie = "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }

  // Admin methods
  async getAdminDashboard(): Promise<AdminDashboard> {
    return this.request<AdminDashboard>('/admin-dashboard');
  }

  async getUserList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'user';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const endpoint = queryParams.toString() 
      ? `/user-management?${queryParams.toString()}`
      : '/user-management';

    return this.request<UserListResponse>(endpoint);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<any> {
    return this.request(`/user-update`, {
      method: 'PUT',
      body: JSON.stringify({ id: userId, ...updates }),
    });
  }

  async deleteUser(userId: string): Promise<any> {
    return this.request(`/user-delete`, {
      method: 'DELETE',
      body: JSON.stringify({ id: userId }),
    });
  }

  async createUserAsAdmin(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
  }): Promise<any> {
    return this.request('/admin-user-create', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Profile methods
  async updateProfile(updates: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    preferences?: User['preferences'];
  }): Promise<any> {
    return this.request('/profile-update', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateThemePreferences(themeId: string, themeMode: 'light' | 'dark'): Promise<any> {
    return this.request('/theme-preferences', {
      method: 'PUT',
      body: JSON.stringify({
        themeId,
        themeMode,
      }),
    });
  }

  async uploadProfileImage(base64Image: string, oldImagePath?: string): Promise<any> {
    return this.request('/profile-image-upload', {
      method: 'POST',
      body: JSON.stringify({
        base64: base64Image,
        oldImagePath,
      }),
    });
  }

  // Utility methods (deprecated - now using server-driven auth)
  isAuthenticated(): boolean {
    // This method is deprecated in server-driven approach
    // Authentication state is now managed via server injection
    return false;
  }

  async verifySession(): Promise<{ success: boolean; user?: User }> {
    // This method is deprecated in server-driven approach
    // Session verification is now handled server-side
    try {
      const response = await this.request<{ success: boolean; user: User; session: any; message: string }>('/verify-session');
      return {
        success: response.success,
        user: response.user
      };
    } catch (error) {
      return { success: false };
    }
  }

  // Notification methods
  async getUserNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    includeExpired?: boolean;
  }): Promise<{
    notifications: any[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const endpoint = queryParams.toString() 
      ? `/user-notifications?${queryParams.toString()}`
      : '/user-notifications';

    return this.request(endpoint);
  }

  async markNotificationRead(notificationId: string, isRead: boolean = true): Promise<any> {
    return this.request('/mark-notification-read', {
      method: 'PUT',
      body: JSON.stringify({ notificationId, isRead }),
    });
  }

  async clearAllNotifications(markAsRead: boolean = false): Promise<any> {
    return this.request('/clear-all-notifications', {
      method: 'DELETE',
      body: JSON.stringify({ markAsRead }),
    });
  }

  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'system';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    actionLabel?: string;
    category?: string;
    metadata?: any;
    sourceWorkflow?: string;
    sourceNode?: string;
    expiresAt?: string;
  }): Promise<any> {
    return this.request('/create-notification', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  getCurrentUser(): User | null {
    // User data is now managed by AuthContext, not localStorage
    // This method is deprecated - use useAuth() hook instead
    return null;
  }

  isAdmin(): boolean {
    // Role checking is now handled by AuthContext
    // This method is deprecated - use useAuth() hook instead
    return false;
  }
}

export const apiClient = new ApiClient();
