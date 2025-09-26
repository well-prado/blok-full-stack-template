/**
 * Blok Navigation Usage Examples
 * Comprehensive examples showing how to use the new navigation system
 */

import BlokLink, { ActiveLink, BlokButton } from "../components/BlokLink";

import { Button } from "../components/ui/button";
import { useBlokRouter } from "../hooks/useBlokRouter";
import { useState } from "react";

// ============================================================================
// 1. BASIC LINK USAGE
// ============================================================================

export function BasicLinkExamples() {
  return (
    <div className="space-y-4">
      <h2>Basic Link Examples</h2>

      {/* Simple navigation link */}
      <BlokLink href="/dashboard" className="text-blue-600 hover:underline">
        Go to Dashboard
      </BlokLink>

      {/* Link with custom styling */}
      <BlokLink
        href="/settings"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Settings
      </BlokLink>

      {/* External link (will not be intercepted) */}
      <BlokLink href="https://example.com" className="text-green-600">
        External Link
      </BlokLink>

      {/* Link with prefetching on hover */}
      <BlokLink href="/profile" prefetch className="text-purple-600">
        Profile (Prefetched on Hover)
      </BlokLink>
    </div>
  );
}

// ============================================================================
// 2. PROGRAMMATIC NAVIGATION WITH HOOK
// ============================================================================

export function ProgrammaticNavigationExamples() {
  const router = useBlokRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate login API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to dashboard after successful login
      await router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear user data, then redirect
      await router.replace("/login");
    } catch (error) {
      console.error("Logout navigation failed:", error);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // Submit form data via POST
      await router.post("/api/users", formData, {
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
        onError: (error) => console.error("Form submission failed:", error),
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Programmatic Navigation Examples</h2>

      <Button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login & Redirect"}
      </Button>

      <Button onClick={handleLogout} variant="outline">
        Logout
      </Button>

      <Button onClick={() => router.back()}>Go Back</Button>

      <Button onClick={() => router.forward()}>Go Forward</Button>

      <Button onClick={() => router.reload()}>Reload Page</Button>

      <Button
        onClick={() =>
          handleFormSubmit({ name: "John", email: "john@example.com" })
        }
      >
        Submit Form (POST)
      </Button>
    </div>
  );
}

// ============================================================================
// 3. ACTIVE LINK EXAMPLES
// ============================================================================

export function ActiveLinkExamples() {
  const { currentUrl } = useBlokRouter();

  return (
    <div className="space-y-4">
      <h2>Active Link Examples</h2>
      <p>Current URL: {currentUrl}</p>

      <nav className="flex space-x-4">
        <ActiveLink
          href="/dashboard"
          className="px-3 py-2 rounded"
          activeClassName="bg-blue-500 text-white"
          inactiveClassName="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Dashboard
        </ActiveLink>

        <ActiveLink
          href="/settings"
          className="px-3 py-2 rounded"
          activeClassName="bg-blue-500 text-white"
          inactiveClassName="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Settings
        </ActiveLink>

        <ActiveLink
          href="/profile"
          exact
          className="px-3 py-2 rounded"
          activeClassName="bg-blue-500 text-white"
          inactiveClassName="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Profile (Exact Match)
        </ActiveLink>
      </nav>
    </div>
  );
}

// ============================================================================
// 4. FORM SUBMISSION EXAMPLES
// ============================================================================

export function FormSubmissionExamples() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  return (
    <div className="space-y-4">
      <h2>Form Submission Examples</h2>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full p-2 border rounded"
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full p-2 border rounded"
        />

        {/* Submit button that navigates after success */}
        <BlokButton
          href="/users"
          method="post"
          data={formData}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onStart={() => console.log("Form submission started")}
          onFinish={() => console.log("Form submitted successfully")}
          onError={(error) => console.error("Form submission failed:", error)}
        >
          Create User
        </BlokButton>

        {/* Update button */}
        <BlokButton
          href="/users/123"
          method="put"
          data={formData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update User
        </BlokButton>

        {/* Delete button */}
        <BlokButton
          href="/users/123"
          method="delete"
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onStart={() => confirm("Are you sure you want to delete this user?")}
        >
          Delete User
        </BlokButton>
      </form>
    </div>
  );
}

// ============================================================================
// 5. ADVANCED NAVIGATION OPTIONS
// ============================================================================

export function AdvancedNavigationExamples() {
  const router = useBlokRouter();

  const handleAdvancedNavigation = async () => {
    // Navigate with state preservation
    await router.push("/settings", {
      preserveState: true,
      preserveScroll: true,
      onStart: () => console.log("Navigation started"),
      onFinish: () => console.log("Navigation completed"),
    });
  };

  const handlePartialUpdate = async () => {
    // Only update specific parts of the page
    await router.push("/dashboard", {
      only: ["stats", "notifications"], // Only update these sections
      preserveState: true,
    });
  };

  const handleReplaceNavigation = async () => {
    // Replace current history entry instead of adding new one
    await router.replace("/dashboard");
  };

  return (
    <div className="space-y-4">
      <h2>Advanced Navigation Examples</h2>

      <Button onClick={handleAdvancedNavigation}>
        Navigate with State Preservation
      </Button>

      <Button onClick={handlePartialUpdate}>Partial Page Update</Button>

      <Button onClick={handleReplaceNavigation}>Replace Current Page</Button>

      {/* Link with custom headers */}
      <BlokLink
        href="/api/data"
        headers={{ "X-Custom-Header": "value" }}
        className="text-blue-600"
      >
        Link with Custom Headers
      </BlokLink>

      {/* Link that preserves scroll position */}
      <BlokLink href="/long-page" preserveScroll className="text-green-600">
        Navigate without Scroll Reset
      </BlokLink>
    </div>
  );
}

// ============================================================================
// 6. ERROR HANDLING EXAMPLES
// ============================================================================

export function ErrorHandlingExamples() {
  const router = useBlokRouter();

  const handleNavigationWithErrorHandling = async () => {
    try {
      await router.push("/protected-route", {
        onError: (error) => {
          console.error("Navigation failed:", error);
          // Handle specific errors
          if (error.message.includes("401")) {
            router.push("/login");
          }
        },
      });
    } catch (error) {
      console.error("Caught navigation error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Error Handling Examples</h2>

      <Button onClick={handleNavigationWithErrorHandling}>
        Navigate with Error Handling
      </Button>

      {/* Link with error callback */}
      <BlokLink
        href="/might-fail"
        onError={(error) => {
          console.error("Link navigation failed:", error);
          alert("Navigation failed: " + error.message);
        }}
        className="text-red-600"
      >
        Link that Might Fail
      </BlokLink>
    </div>
  );
}

// ============================================================================
// 7. MIGRATION EXAMPLES (OLD vs NEW)
// ============================================================================

export function MigrationExamples() {
  return (
    <div className="space-y-6">
      <h2>Migration Examples (Old vs New)</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold text-red-600">❌ OLD (React Router)</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {`// OLD - React Router Link
import { Link } from 'react-router-dom';
<Link to="/dashboard">Dashboard</Link>

// OLD - useNavigate hook
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');

// OLD - window.location (page reload!)
window.location.href = '/login';
window.location.reload();`}
          </pre>
        </div>

        <div>
          <h3 className="font-bold text-green-600">✅ NEW (Blok Navigation)</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {`// NEW - BlokLink (SPA navigation)
import BlokLink from '../components/BlokLink';
<BlokLink href="/dashboard">Dashboard</BlokLink>

// NEW - useBlokRouter hook
import { useBlokRouter } from '../hooks/useBlokRouter';
const router = useBlokRouter();
router.push('/dashboard');

// NEW - Blok navigation (no reload!)
router.push('/login');
router.reload();`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETE EXAMPLE COMPONENT
// ============================================================================

export default function BlokNavigationExamples() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Blok Navigation Examples</h1>

      <BasicLinkExamples />
      <ProgrammaticNavigationExamples />
      <ActiveLinkExamples />
      <FormSubmissionExamples />
      <AdvancedNavigationExamples />
      <ErrorHandlingExamples />
      <MigrationExamples />
    </div>
  );
}
