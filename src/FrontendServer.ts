/**
 * Frontend Server for React SPA
 * 
 * Serves the built React frontend from the /frontend/dist directory
 * Handles client-side routing by serving index.html for all non-API routes
 * 
 * @module FrontendServer
 */

import { and, eq, gt } from "drizzle-orm";
import { sessions, users } from "../database/schemas";

import { db } from "../database/config";
import express from "express";
import fs from "fs";
import path from "path";

const router: express.Router = express.Router();

// Path to the frontend build directory
const frontendDistPath = path.join(process.cwd(), 'frontend', 'dist');

// Path to the public uploads directory
const uploadsPath = path.join(process.cwd(), 'public');

// Check if frontend build exists
const frontendExists = fs.existsSync(frontendDistPath);

// Check if we're in development mode with Vite dev server
const isDevelopment = process.env.NODE_ENV !== 'production';
const viteDevServerUrl = 'http://localhost:5173';

/**
 * Check if Vite dev server is running
 */
async function isViteDevServerRunning(): Promise<boolean> {
  if (!isDevelopment) return false;
  
  try {
    const response = await fetch(`${viteDevServerUrl}/`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(1000) // 1 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get component name for a given route
 * Maps URL paths to React component names
 */
function getComponentForRoute(path: string): string {
  // Remove leading slash and convert to component name
  const cleanPath = path.replace(/^\/+/, '') || 'home';
  
  // Route mapping
  const routeMap: Record<string, string> = {
    '': 'Home',
    'home': 'Home',
    'dashboard': 'Dashboard',
    'login': 'Login',
    'register': 'Register',
    'profile': 'Profile',
    'settings': 'Settings',
    'users': 'Users',
    'analytics': 'Analytics',
    'security': 'Security',
    'system': 'System',
    'logs': 'AdminLogs',
    'themes': 'Themes',
    'help': 'Help',
    'navigation-test': 'NavigationTest'
  };

  // Handle nested routes (e.g., /users/123 -> Users)
  const baseRoute = cleanPath.split('/')[0];
  
  return routeMap[baseRoute] || 'NotFound';
}

/**
 * Extract route parameters from path
 * e.g., /users/123 -> { id: '123' }
 */
function extractRouteParams(path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const segments = path.split('/').filter(Boolean);
  
  // Simple parameter extraction - in a real app, use a proper router
  if (segments.length >= 2) {
    // Assume second segment is an ID for now
    params.id = segments[1];
  }
  
  return params;
}

/**
 * Get dashboard-specific props
 */
async function getDashboardProps(user: any): Promise<Record<string, any>> {
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  try {
    // This would normally call your dashboard API
    return {
      stats: {
        totalUsers: 3,
        adminUsers: 1,
        regularUsers: 2,
        verifiedUsers: 3
      },
      recentActivity: {
        lastLogin: new Date().toISOString(),
        systemStatus: 'healthy'
      }
    };
  } catch (error) {
    return { error: 'Failed to load dashboard data' };
  }
}

/**
 * Get users page props
 */
async function getUsersProps(user: any, req: express.Request): Promise<Record<string, any>> {
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  // Extract query parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  return {
    pagination: { page, limit },
    users: [] // Would fetch from database
  };
}

/**
 * Get analytics props
 */
async function getAnalyticsProps(user: any): Promise<Record<string, any>> {
  if (!user) {
    return { error: 'Unauthorized' };
  }

  return {
    metrics: {
      pageViews: 1250,
      uniqueVisitors: 320,
      bounceRate: 0.35
    }
  };
}

/**
 * Get logs props (admin only)
 */
async function getLogsProps(user: any): Promise<Record<string, any>> {
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized. Admin access required for system logs.' };
  }

  return {
    initialData: {
      totalLogs: 0,
      todayLogs: 0,
      failedActions: 0,
      highRiskActions: 0,
      message: 'System logs will be loaded dynamically via API'
    }
  };
}

/**
 * Get props for a given route
 * Fetches data needed for the component
 */
async function getPropsForRoute(path: string, user: any, req: express.Request): Promise<Record<string, any>> {
  const cleanPath = path.replace(/^\/+/, '') || 'home';
  const baseRoute = cleanPath.split('/')[0];
  
  // Base props available to all routes
  const baseProps = {
    path: path,
    query: req.query,
    params: extractRouteParams(path),
    timestamp: new Date().toISOString()
  };

  try {
    // Route-specific props
    switch (baseRoute) {
      case 'dashboard':
        return {
          ...baseProps,
          ...await getDashboardProps(user)
        };
      
      case 'users':
        return {
          ...baseProps,
          ...await getUsersProps(user, req)
        };
      
      case 'analytics':
        return {
          ...baseProps,
          ...await getAnalyticsProps(user)
        };
      
      case 'logs':
        return {
          ...baseProps,
          ...await getLogsProps(user)
        };
      
      case 'navigation-test':
        return {
          ...baseProps,
          testData: {
            timestamp: new Date().toISOString(),
            user: user?.name || 'Guest',
            path: path
          }
        };
      
      default:
        return baseProps;
    }
  } catch (error) {
    console.error(`Error fetching props for route ${path}:`, error);
    return baseProps;
  }
}

/**
 * Generate page version for cache busting
 */
function generatePageVersion(): string {
  return `v${Date.now()}`;
}

/**
 * Server-side authentication check
 * Similar to Laravel + Inertia.js approach
 */
async function getAuthenticatedUser(req: express.Request): Promise<any | null> {
  try {
    // Get session token from cookies
    const sessionToken = req.cookies?.blok_session_token;
    
    if (!sessionToken) {
      return null;
    }

    // Look up the session in the database
    const sessionResult = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
          profileImage: users.profileImage,
          preferences: users.preferences
        }
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, sessionToken),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return null;
    }

    const user = sessionResult[0].user;
    
    // Parse preferences JSON if it exists
    let preferences = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (e) {
        console.warn('Failed to parse user preferences:', e);
        preferences = {};
      }
    }

    return {
      ...user,
      preferences,
    };
  } catch (error) {
    console.error('Server-side auth check failed:', error);
    return null;
  }
}

// Serve uploaded files from public directory
router.use('/uploads', express.static(path.join(uploadsPath, 'uploads'), {
  maxAge: '1h', // Cache uploaded files for 1 hour
  etag: true,
  lastModified: true
}));

// Main route handler - supports both development and production modes
router.get("*", async (req, res, next) => {
  // Skip API routes - let workflows handle them
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip uploads - they're handled by static middleware
  if (req.path.startsWith('/uploads/')) {
    return next();
  }

  // Skip health-check and metrics
  if (req.path === '/health-check' || req.path === '/metrics') {
    return next();
  }

  // Check if Vite dev server is running (development mode)
  const viteIsRunning = await isViteDevServerRunning();
  
  if (viteIsRunning) {
    // Development mode: Proxy to Vite dev server for HMR
    
    // In development mode, proxy all non-API requests to Vite dev server
    // This enables HMR and live reloading without builds
    
    try {
      // For SPA routes, we still need to inject server data
      if (!req.path.includes('.') && !req.path.startsWith('/src/') && !req.path.startsWith('/@')) {
        // Check authentication server-side
        const user = await getAuthenticatedUser(req);
        
        // Create page data object (Inertia.js style)
        const pageData = {
          component: getComponentForRoute(req.path),
          props: await getPropsForRoute(req.path, user, req),
          auth: {
            user: user,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
          },
          url: req.originalUrl,
          version: generatePageVersion(),
          timestamp: new Date().toISOString()
        };

        // Check if this is an XHR/AJAX request (Blok navigation)
        const isBlokRequest = req.headers['x-blok-navigation'] === 'true' ||
                             req.headers['x-inertia'] === 'true' ||
                             req.headers['x-requested-with'] === 'XMLHttpRequest';

        if (isBlokRequest) {
          // Return JSON response for SPA navigation
          res.json(pageData);
          return;
        }

        // For initial page loads, get HTML from Vite and inject data
        const viteResponse = await fetch(`${viteDevServerUrl}/`);
        if (viteResponse.ok) {
          let html = await viteResponse.text();
          
          // Inject page data before the closing </head> tag
          const injectionScript = `
          <script>
            // Server-injected page data (Laravel + Inertia.js style)
            window.__BLOK_PAGE_DATA__ = ${JSON.stringify(pageData)};
            // Legacy auth data for backward compatibility
            window.__BLOK_AUTH__ = ${JSON.stringify(pageData.auth)};
          </script>`;
          
          html = html.replace('</head>', `${injectionScript}\n</head>`);
          
          res.send(html);
          return;
        }
      }
      
      // For static assets and HMR, proxy directly to Vite
      const viteUrl = `${viteDevServerUrl}${req.originalUrl}`;
      
      // Create proper headers object for fetch
      const proxyHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          proxyHeaders[key] = value;
        } else if (Array.isArray(value)) {
          proxyHeaders[key] = value.join(', ');
        }
      }
      proxyHeaders.host = 'localhost:5173';
      
      const viteResponse = await fetch(viteUrl, {
        method: req.method,
        headers: proxyHeaders
      });
      
      // Copy response headers
      for (const [key, value] of viteResponse.headers.entries()) {
        res.setHeader(key, value);
      }
      
      res.status(viteResponse.status);
      
      if (viteResponse.body) {
        // Handle the ReadableStream properly
        const reader = viteResponse.body.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error('Error streaming response:', error);
          res.end();
        } finally {
          reader.releaseLock();
        }
      } else {
        res.end();
      }
      
    } catch (error) {
      console.error('Error proxying to Vite dev server:', error);
      res.status(500).send(getViteErrorPage());
    }
    
  } else if (frontendExists) {
    // Production mode: Serve built React SPA from /frontend/dist
    
    // Serve static assets with caching headers
    if (req.path.startsWith('/assets/') || req.path.match(/\.(svg|ico|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/)) {
      const staticMiddleware = express.static(frontendDistPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else if (filePath.match(/\.(svg|ico|png|jpg|jpeg|gif|webp)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week for images
          }
        }
      });
      return staticMiddleware(req, res, next);
    }

    // Skip requests for other files with extensions that aren't handled above
    if (req.path.includes('.') && !req.path.match(/\/(login|register|dashboard|profile|users|settings|security)$/)) {
      return next();
    }

    try {
      // Check authentication server-side
      const user = await getAuthenticatedUser(req);
      
      // Create page data object (Inertia.js style)
      const pageData = {
        component: getComponentForRoute(req.path),
        props: await getPropsForRoute(req.path, user, req),
        auth: {
          user: user,
          isAuthenticated: !!user,
          isAdmin: user?.role === 'admin',
        },
        url: req.originalUrl,
        version: generatePageVersion(),
        timestamp: new Date().toISOString()
      };

      // Check if this is an XHR/AJAX request (Blok navigation)
      const isBlokRequest = req.headers['x-blok-navigation'] === 'true' ||
                           req.headers['x-inertia'] === 'true' ||
                           req.headers['x-requested-with'] === 'XMLHttpRequest';

      if (isBlokRequest) {
        // Return JSON response for SPA navigation
        res.json(pageData);
        return;
      }

      // Serve index.html with injected page data (initial page load)
      const indexPath = path.join(frontendDistPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        // Read the HTML file
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Inject page data before the closing </head> tag
        const injectionScript = `
        <script>
          // Server-injected page data (Laravel + Inertia.js style)
          window.__BLOK_PAGE_DATA__ = ${JSON.stringify(pageData)};
          // Legacy auth data for backward compatibility
          window.__BLOK_AUTH__ = ${JSON.stringify(pageData.auth)};
        </script>`;
        
        html = html.replace('</head>', `${injectionScript}\n</head>`);
        
        res.send(html);
      } else {
        res.status(500).send(getDevelopmentPage());
      }
    } catch (error) {
      console.error('Error serving page data:', error);
      
      // Fallback response
      const fallbackData = {
        component: 'Error',
        props: { error: 'Server error occurred' },
        auth: { user: null, isAuthenticated: false, isAdmin: false },
        url: req.originalUrl,
        version: '1',
        timestamp: new Date().toISOString()
      };

      const isBlokRequest = req.headers['x-blok-navigation'] === 'true' ||
                           req.headers['x-inertia'] === 'true' ||
                           req.headers['x-requested-with'] === 'XMLHttpRequest';

      if (isBlokRequest) {
        res.status(500).json(fallbackData);
      } else {
        const indexPath = path.join(frontendDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(500).send(getDevelopmentPage());
        }
      }
    }
  } else {
    res.status(404).send(getDevelopmentPage());
  }
});

/**
 * Generate Vite error page when dev server is not accessible
 */
function getViteErrorPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite Dev Server Error - Blok Framework</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full mx-4">
          <div class="text-center mb-6">
            <div class="text-orange-600 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">🔥 Vite Dev Server Connection Error</h1>
            <p class="text-gray-600">The backend is trying to connect to the Vite development server, but it's not accessible.</p>
          </div>
          
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Quick Fix:</h2>
            <ol class="list-decimal list-inside space-y-3 text-gray-700">
              <li>Open a new terminal and navigate to the frontend directory:
                <div class="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">cd frontend</div>
              </li>
              <li>Start the Vite development server:
                <div class="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">npm run dev</div>
              </li>
              <li>The Vite server should start on <code class="bg-gray-200 px-2 py-1 rounded">http://localhost:5173</code></li>
              <li>Refresh this page - it should now work with live reload!</li>
            </ol>
          </div>
          
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Alternative (Production Mode):</h2>
            <p class="text-gray-600 mb-3">If you prefer to use the built version instead of live development:</p>
            <ol class="list-decimal list-inside space-y-2 text-gray-700">
              <li>Build the frontend:
                <div class="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">cd frontend && npm run build</div>
              </li>
              <li>Restart the backend server</li>
            </ol>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-blue-800"><strong>💡 Tip:</strong> With Vite dev server running, you'll get instant hot-reload without needing to rebuild!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Development page when frontend build is not available
 */
function getDevelopmentPage(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blok Admin - Frontend Build Required</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
      <div class="text-red-600 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Frontend Build Not Found</h1>
      <div class="text-gray-600 mb-6">
        The React frontend hasn't been built yet. Please build the frontend first:
        <br><br>
        Try running: <code class="bg-red-100 px-2 py-1 rounded">cd frontend && pnpm build</code>
      </div>
      <a href="/api/admin-dashboard" class="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
        View API Status
      </a>
    </div>
  </body>
  </html>
  `;
}

export default router;