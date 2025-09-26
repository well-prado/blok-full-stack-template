import BlokLink from "../components/BlokLink";
import { Button } from "../components/ui/button";
import React from "react";

interface GuestLayoutProps {
  children: React.ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <BlokLink
              href="/"
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  B
                </span>
              </div>
              <span className="text-xl font-bold">Blok Admin</span>
            </BlokLink>

            <div className="flex items-center space-x-4">
              <BlokLink href="/login">
                <Button variant="ghost">Sign In</Button>
              </BlokLink>
              <BlokLink href="/register">
                <Button>Get Started</Button>
              </BlokLink>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © 2024 Blok Admin. Built with React 19, React Router, and Shadcn
              UI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
