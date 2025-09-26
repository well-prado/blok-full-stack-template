/**
 * Navigation Test Page
 * Dedicated page for testing Blok navigation system
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import BlokNavigationTest from "../components/BlokNavigationTest";

export default function NavigationTest() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Blok Navigation System Test
          </h1>
          <p className="text-muted-foreground">
            Comprehensive testing interface for the Blok Inertia.js-inspired
            navigation system
          </p>
        </div>

        <BlokNavigationTest />

        <Card>
          <CardHeader>
            <CardTitle>About This Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p>
                This page tests the integration between the Blok Frontend Server
                and the React client-side navigation system. The system is
                inspired by Inertia.js and provides:
              </p>
              <ul>
                <li>
                  <strong>Server-Side Authentication Injection</strong> - Auth
                  data is injected into the initial page load
                </li>
                <li>
                  <strong>SPA Navigation</strong> - Client-side navigation
                  without full page reloads
                </li>
                <li>
                  <strong>Hybrid Requests</strong> - XHR requests return JSON,
                  regular requests return HTML
                </li>
                <li>
                  <strong>Error Handling</strong> - Graceful handling of 401,
                  403, 404, and other errors
                </li>
                <li>
                  <strong>History Management</strong> - Proper browser
                  back/forward button support
                </li>
              </ul>

              <h4>How It Works:</h4>
              <ol>
                <li>
                  Initial page load: Server injects page data into{" "}
                  <code>window.__BLOK_PAGE_DATA__</code>
                </li>
                <li>
                  Navigation requests: Client sends{" "}
                  <code>X-Blok-Navigation: true</code> header
                </li>
                <li>
                  Server response: Returns JSON for XHR requests, HTML for
                  regular requests
                </li>
                <li>Client update: Updates page content without full reload</li>
              </ol>

              <h4>Testing:</h4>
              <p>
                Use the test controls above to verify each aspect of the
                navigation system. Check the logs to see detailed information
                about each test.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
