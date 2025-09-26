/**
 * Blok Router - Inertia.js-inspired navigation system
 * Provides seamless SPA navigation with server-side integration
 */

export interface VisitOptions {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  data?: Record<string, any>;
  headers?: Record<string, string>;
  preserveState?: boolean;
  preserveScroll?: boolean;
  replace?: boolean;
  only?: string[];
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onFinish?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

export interface PageData {
  component: string;
  props: Record<string, any>;
  auth: {
    user: any;
    isAuthenticated: boolean;
    isAdmin: boolean;
  };
  url: string;
  version?: string;
}

export interface NavigationState {
  isNavigating: boolean;
  currentUrl: string;
  pageData: PageData | null;
  history: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  error?: Error | null;
}

class BlokRouter {
  private listeners: Set<(state: NavigationState) => void> = new Set();
  private state: NavigationState = {
    isNavigating: false,
    currentUrl: window.location.pathname,
    pageData: null,
    history: [window.location.pathname],
    canGoBack: false,
    canGoForward: false,
    error: null,
  };
  private cachedSnapshot: NavigationState | null = null;
  private lastStateString: string | null = null;

  constructor() {
    this.initializeFromServerData();
    this.setupPopstateListener();
  }

  /**
   * Initialize router state from server-injected data
   */
  private initializeFromServerData() {
    // Try to get full page data first (new format)
    const serverPageData = (window as any).__BLOK_PAGE_DATA__;
    if (serverPageData) {
      this.state.pageData = serverPageData;
      return;
    }

    // Fallback to legacy auth data format
    const serverAuth = (window as any).__BLOK_AUTH__;
    if (serverAuth) {
      this.state.pageData = {
        component: this.getComponentFromPath(window.location.pathname),
        props: {},
        auth: serverAuth,
        url: window.location.pathname,
        version: '1',
      };
    }
  }

  /**
   * Setup browser history listener
   */
  private setupPopstateListener() {
    window.addEventListener('popstate', (event) => {
      if (event.state?.blokNavigation) {
        this.handlePopstate(event.state);
      }
    });
  }

  /**
   * Handle browser back/forward navigation
   */
  private handlePopstate(state: any) {
    this.setState({
      currentUrl: window.location.pathname,
      pageData: state.pageData || this.state.pageData,
    });
  }

  /**
   * Get component name from URL path
   */
  private getComponentFromPath(path: string): string {
    const pathMap: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/login': 'Login',
      '/register': 'Register',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/security': 'Security',
      '/themes': 'Themes',
      '/users': 'Users',
      '/analytics': 'Analytics',
      '/system': 'System',
      '/help': 'Help',
    };

    return pathMap[path] || 'NotFound';
  }

  /**
   * Handle unauthorized requests
   */
  private handleUnauthorized(): void {
    // Clear any stored auth data
    document.cookie = 'blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login page
    window.location.href = '/login';
  }

  /**
   * Update router state and notify listeners
   */
  private setState(updates: Partial<NavigationState>) {
    this.state = { ...this.state, ...updates };
    
    // Invalidate cached snapshot when state changes
    this.cachedSnapshot = null;
    this.lastStateString = null;
    
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Subscribe to router state changes
   */
  subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current router state
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get stable snapshot for useSyncExternalStore
   * Returns the same object reference if state hasn't changed
   */
  getSnapshot(): NavigationState {
    const currentStateString = JSON.stringify(this.state);
    
    // Return cached snapshot if state hasn't changed
    if (this.lastStateString === currentStateString && this.cachedSnapshot) {
      return this.cachedSnapshot;
    }
    
    // Create new snapshot and cache it
    this.cachedSnapshot = { ...this.state };
    this.lastStateString = currentStateString;
    
    return this.cachedSnapshot;
  }

  /**
   * Visit a URL with options (main navigation method)
   */
  async visit(url: string, options: VisitOptions = {}): Promise<void> {
    const {
      method = 'get',
      data = {},
      headers = {},
      // preserveState = false,
      preserveScroll = false,
      replace = false,
      only = [],
      onStart,
      // onProgress,
      onFinish,
      // onCancel,
      onError,
    } = options;

    // Start navigation
    onStart?.();
    this.setState({ isNavigating: true });

    try {
      // Prepare request
      const requestHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'X-Blok-Navigation': 'true', // Blok-specific header for server integration
        'X-Inertia': 'true', // Inertia.js compatibility
        'X-Inertia-Version': this.state.pageData?.version || '',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      };

      if (only.length > 0) {
        requestHeaders['X-Inertia-Partial-Component'] = this.state.pageData?.component || '';
        requestHeaders['X-Inertia-Partial-Data'] = only.join(',');
      }

      // Make request
      const response = await this.makeRequest(url, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: method === 'get' ? undefined : JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          // Unauthorized - redirect to login
          this.handleUnauthorized();
          throw new Error('Authentication required');
        }
        
        if (response.status === 403) {
          throw new Error('Access forbidden');
        }
        
        if (response.status === 404) {
          throw new Error('Page not found');
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const pageData: PageData = await response.json();
      
      // Handle server-side redirects
      if (pageData.props?.redirectTo) {
        await this.visit(pageData.props.redirectTo, { replace: true });
        return;
      }

      // Update browser history
      const historyState = {
        blokNavigation: true,
        pageData,
        preserveScroll,
      };

      if (replace) {
        window.history.replaceState(historyState, '', url);
      } else {
        window.history.pushState(historyState, '', url);
      }

      // Update router state
      this.setState({
        currentUrl: url,
        pageData,
        history: replace 
          ? this.state.history 
          : [...this.state.history, url],
        error: null, // Clear any previous errors
        isNavigating: false, // Ensure navigation state is cleared
      });

      // Handle scroll restoration
      if (!preserveScroll) {
        window.scrollTo(0, 0);
      }

      onFinish?.();
    } catch (error) {
      onError?.(error);
      
      // Set error state instead of falling back to window.location
      this.setState({ 
        isNavigating: false,
        error: error as Error 
      });
      
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      // Note: isNavigating is already set to false in the main state update above
    }
  }

  /**
   * Get the correct base URL for navigation requests
   */
  private getBaseUrl(): string {
    // If running on Vite dev server (port 3000), use Blok backend server (port 4000)
    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    
    // Otherwise use the current origin
    return window.location.origin;
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    // Add base URL if needed
    const fullUrl = url.startsWith('http') ? url : `${this.getBaseUrl()}${url}`;
    
    return fetch(fullUrl, {
      ...options,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * Navigate to URL (alias for visit with GET method)
   */
  async push(url: string, options?: Omit<VisitOptions, 'method'>): Promise<void> {
    return this.visit(url, { ...options, method: 'get' });
  }

  /**
   * Replace current URL (alias for visit with replace: true)
   */
  async replace(url: string, options?: Omit<VisitOptions, 'method' | 'replace'>): Promise<void> {
    return this.visit(url, { ...options, method: 'get', replace: true });
  }

  /**
   * Reload current page
   */
  async reload(options: Omit<VisitOptions, 'method'> = {}): Promise<void> {
    return this.visit(this.state.currentUrl, { ...options, method: 'get', replace: true });
  }

  /**
   * Go back in history
   */
  back(): void {
    if (this.state.canGoBack) {
      window.history.back();
    }
  }

  /**
   * Go forward in history
   */
  forward(): void {
    if (this.state.canGoForward) {
      window.history.forward();
    }
  }

  /**
   * Post data to URL
   */
  async post(url: string, data: Record<string, any> = {}, options?: Omit<VisitOptions, 'method' | 'data'>): Promise<void> {
    return this.visit(url, { ...options, method: 'post', data });
  }

  /**
   * Put data to URL
   */
  async put(url: string, data: Record<string, any> = {}, options?: Omit<VisitOptions, 'method' | 'data'>): Promise<void> {
    return this.visit(url, { ...options, method: 'put', data });
  }

  /**
   * Patch data to URL
   */
  async patch(url: string, data: Record<string, any> = {}, options?: Omit<VisitOptions, 'method' | 'data'>): Promise<void> {
    return this.visit(url, { ...options, method: 'patch', data });
  }

  /**
   * Delete request to URL
   */
  async delete(url: string, options?: Omit<VisitOptions, 'method'>): Promise<void> {
    return this.visit(url, { ...options, method: 'delete' });
  }

  /**
   * Check if currently navigating
   */
  isNavigating(): boolean {
    return this.state.isNavigating;
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.state.currentUrl;
  }

  /**
   * Get current page data
   */
  getPageData(): PageData | null {
    return this.state.pageData;
  }
}

// Create singleton instance
export const blokRouter = new BlokRouter();

// Export for testing
export { BlokRouter };
