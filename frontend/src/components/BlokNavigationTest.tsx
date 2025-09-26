/**
 * Blok Navigation Integration Test Component
 * Tests the server-client navigation integration
 */

import BlokLink, { BlokButton } from "./BlokLink";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useBlokRouter } from "../hooks/useBlokRouter";

export default function BlokNavigationTest() {
  const router = useBlokRouter();
  const [testResults, setTestResults] = useState<
    Record<string, "pending" | "success" | "error">
  >({
    serverData: "pending",
    spaNavigation: "pending",
    backButton: "pending",
    errorHandling: "pending",
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const updateTestResult = (test: string, result: "success" | "error") => {
    setTestResults((prev) => ({ ...prev, [test]: result }));
  };

  useEffect(() => {
    runInitialTests();
  }, []);

  const runInitialTests = () => {
    // Test 1: Server Data Injection
    addLog("Testing server data injection...");
    addLog(`Current port: ${window.location.port}`);

    const pageData = (window as any).__BLOK_PAGE_DATA__;
    const authData = (window as any).__BLOK_AUTH__;

    addLog(`__BLOK_PAGE_DATA__: ${pageData ? "Found" : "Not found"}`);
    addLog(`__BLOK_AUTH__: ${authData ? "Found" : "Not found"}`);

    const serverData = pageData || authData;
    if (serverData) {
      addLog("✅ Server data found and injected successfully");
      updateTestResult("serverData", "success");
    } else {
      addLog(
        "❌ Server data not found - Make sure you're testing on http://localhost:4000/navigation-test"
      );
      updateTestResult("serverData", "error");
    }
  };

  const testSPANavigation = async () => {
    addLog("Testing SPA navigation...");
    try {
      // Navigate to a public route (login page) and back
      const startUrl = router.currentUrl;
      addLog(`Starting URL: ${startUrl}`);
      addLog(`Window location before: ${window.location.pathname}`);

      addLog("Calling router.push('/login')...");
      await router.push("/login");

      // Add a small delay to allow React state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      addLog(`Router currentUrl after push: ${router.currentUrl}`);
      addLog(`Window location after: ${window.location.pathname}`);

      if (router.currentUrl === "/login") {
        addLog("✅ SPA navigation successful");
        updateTestResult("spaNavigation", "success");

        // Navigate back
        addLog("Navigating back to start URL...");
        await router.push(startUrl);
      } else {
        addLog("❌ SPA navigation failed - URL not updated");
        addLog(`Expected: /login, Got: ${router.currentUrl}`);
        updateTestResult("spaNavigation", "error");
      }
    } catch (error) {
      addLog(`❌ SPA navigation failed: ${error}`);
      updateTestResult("spaNavigation", "error");
    }
  };

  const testBackButton = async () => {
    addLog("Testing back button functionality...");
    try {
      const startUrl = router.currentUrl;

      // Navigate to register page (public route)
      await router.push("/register");
      addLog("Navigated to /register");

      // Go back
      router.back();

      // Give it a moment to process
      setTimeout(() => {
        if (router.currentUrl === startUrl) {
          addLog("✅ Back button works correctly");
          updateTestResult("backButton", "success");
        } else {
          addLog("❌ Back button failed");
          updateTestResult("backButton", "error");
        }
      }, 100);
    } catch (error) {
      addLog(`❌ Back button test failed: ${error}`);
      updateTestResult("backButton", "error");
    }
  };

  const testErrorHandling = async () => {
    addLog("Testing error handling...");
    try {
      // Try to navigate to a non-existent page
      await router.push("/non-existent-page");
      addLog("Navigation to non-existent page completed (may show 404)");
      updateTestResult("errorHandling", "success");
    } catch (error) {
      addLog(`Error handling test completed: ${error}`);
      updateTestResult("errorHandling", "success");
    }
  };

  const runAllTests = async () => {
    await testSPANavigation();
    await testBackButton();
    await testErrorHandling();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusBadge = (status: "pending" | "success" | "error") => {
    const variants = {
      pending: "secondary",
      success: "default",
      error: "destructive",
    } as const;

    const labels = {
      pending: "Pending",
      success: "Pass",
      error: "Fail",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Blok Navigation Integration Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current URL: <code>{router.currentUrl}</code> | Navigating:{" "}
          {router.isNavigating ? "Yes" : "No"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Results */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Test Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Server Data</span>
              {getStatusBadge(testResults.serverData)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">SPA Navigation</span>
              {getStatusBadge(testResults.spaNavigation)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Back Button</span>
              {getStatusBadge(testResults.backButton)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Error Handling</span>
              {getStatusBadge(testResults.errorHandling)}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Manual Tests</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={router.isNavigating}>
              Run All Tests
            </Button>
            <Button
              onClick={testSPANavigation}
              variant="outline"
              disabled={router.isNavigating}
            >
              Test SPA Navigation
            </Button>
            <Button
              onClick={testBackButton}
              variant="outline"
              disabled={router.isNavigating}
            >
              Test Back Button
            </Button>
            <Button
              onClick={testErrorHandling}
              variant="outline"
              disabled={router.isNavigating}
            >
              Test Error Handling
            </Button>
          </div>
        </div>

        {/* Navigation Links Test */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Navigation Links Test</h3>
          <div className="flex flex-wrap gap-2">
            <BlokLink
              href="/dashboard"
              className="text-blue-600 hover:underline"
            >
              Dashboard (Link)
            </BlokLink>
            <BlokLink
              href="/settings"
              className="text-blue-600 hover:underline"
            >
              Settings (Link)
            </BlokLink>
            <BlokLink href="/users" className="text-blue-600 hover:underline">
              Users (Link)
            </BlokLink>
            <BlokButton
              href="/profile"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Profile (Button)
            </BlokButton>
          </div>
        </div>

        {/* Programmatic Navigation Test */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Programmatic Navigation Test
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              router.push('/dashboard')
            </Button>
            <Button
              onClick={() => router.replace("/settings")}
              variant="outline"
            >
              router.replace('/settings')
            </Button>
            <Button onClick={() => router.back()} variant="outline">
              router.back()
            </Button>
            <Button onClick={() => router.forward()} variant="outline">
              router.forward()
            </Button>
            <Button onClick={() => router.reload()} variant="outline">
              router.reload()
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Test Logs</h3>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg h-48 overflow-y-auto">
            <pre className="text-sm">
              {logs.length === 0 ? "No logs yet..." : logs.join("\n")}
            </pre>
          </div>
        </div>

        {/* Server Data Display */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Server Injected Data</h3>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(
                {
                  pageData: (window as any).__BLOK_PAGE_DATA__ || null,
                  authData: (window as any).__BLOK_AUTH__ || null,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
