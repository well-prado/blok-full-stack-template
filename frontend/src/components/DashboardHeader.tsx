import { Card, CardContent } from "./ui/card";
import { Moon, Search, Settings, Sun, User } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NotificationDrawer } from "./NotificationDrawer";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { BlokLink } from "../lib/blok-navigation";

export function DashboardHeader() {
  const { toggleThemeMode } = useTheme();
  const { user } = useAuth();

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Blok Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ""}! Here's what's
              happening today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 glass-input"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="glass-button glass-button-hover"
              onClick={toggleThemeMode}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <NotificationDrawer />

            <Button
              variant="ghost"
              size="icon"
              className="glass-button glass-button-hover"
              asChild
            >
              <BlokLink href="/settings">
                <Settings className="h-5 w-5" />
              </BlokLink>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="glass-button glass-button-hover"
              asChild
            >
              <BlokLink href="/profile">
                <User className="h-5 w-5" />
              </BlokLink>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
