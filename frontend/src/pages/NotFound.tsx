import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

import { Button } from "../components/ui/button";
import { useBlokRouter } from "../hooks/useBlokRouter";

export default function NotFound() {
  const router = useBlokRouter();

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    if (router.canGoBack) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* 404 Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <div className="absolute -top-2 -right-2 bg-background border-2 border-destructive rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-destructive font-bold text-sm">404</span>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Current URL Display */}
            <div className="w-full p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Requested URL:
              </p>
              <code className="text-sm font-mono text-foreground break-all">
                {router.currentUrl}
              </code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {/* Additional Help */}
            <div className="text-center space-y-2 pt-4 border-t border-border w-full">
              <p className="text-sm text-muted-foreground">
                Need help? Here are some suggestions:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check the URL for typos</li>
                <li>• Use the navigation menu</li>
                <li>• Go back to the previous page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
