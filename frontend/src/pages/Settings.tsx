import { Bell, Database, Palette, Settings, Shield, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatedTabContent } from "../components/AnimatedTabContent";
import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { useAnimation } from "../contexts/AnimationContext";
import { useSearchParams } from "react-router-dom";

const VALID_TABS = [
  "profile",
  "security",
  "notifications",
  "appearance",
  "system",
] as const;

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAnimation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isUpdatingRef = useRef(false);

  // Get initial tab from URL params or default to profile
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get("tab");
    return VALID_TABS.includes(tabFromUrl as any) ? tabFromUrl! : "profile";
  });

  // Handle tab changes - update URL without causing re-render loops
  const handleTabChange = useCallback(
    (newTab: string) => {
      if (
        VALID_TABS.includes(newTab as any) &&
        newTab !== activeTab &&
        !isUpdatingRef.current
      ) {
        isUpdatingRef.current = true;
        setActiveTab(newTab);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", newTab);
        setSearchParams(newParams, { replace: true });
        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
      }
    },
    [activeTab, searchParams, setSearchParams]
  );

  // Sync with URL changes (browser back/forward) - only listen to searchParams
  useEffect(() => {
    if (!isUpdatingRef.current) {
      const tabFromUrl = searchParams.get("tab");
      const validTab = VALID_TABS.includes(tabFromUrl as any)
        ? tabFromUrl!
        : "profile";

      if (validTab !== activeTab) {
        setActiveTab(validTab);
      }
    }
  }, [searchParams, activeTab]); // Keep activeTab to ensure sync

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Settings Tabs */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList className="glass-button">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="flex items-center gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <AnimatedTabContent activeTab={activeTab} tabKey="profile">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and profile settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            className="glass-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            placeholder="john@example.com"
                            className="glass-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          placeholder="Tell us about yourself"
                          className="glass-input"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button className="glass-button glass-button-hover">
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedTabContent>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <AnimatedTabContent activeTab={activeTab} tabKey="security">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Password & Security</CardTitle>
                      <CardDescription>
                        Manage your password and security settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          className="glass-input"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            className="glass-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            className="glass-input"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <div className="font-medium">
                            Two-Factor Authentication
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex justify-end">
                        <Button className="glass-button glass-button-hover">
                          Update Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedTabContent>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <AnimatedTabContent
                  activeTab={activeTab}
                  tabKey="notifications"
                >
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose what notifications you want to receive.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          title: "Email Notifications",
                          description: "Receive notifications via email",
                        },
                        {
                          title: "Push Notifications",
                          description: "Receive push notifications in browser",
                        },
                        {
                          title: "System Updates",
                          description: "Get notified about system maintenance",
                        },
                        {
                          title: "Security Alerts",
                          description: "Receive alerts about security events",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 glass-card rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AnimatedTabContent>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <AnimatedTabContent activeTab={activeTab} tabKey="appearance">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Appearance Settings</CardTitle>
                      <CardDescription>
                        Customize the look and feel of your dashboard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <div className="font-medium">Dark Mode</div>
                          <div className="text-sm text-muted-foreground">
                            Toggle between light and dark themes
                          </div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <div className="font-medium">Compact Mode</div>
                          <div className="text-sm text-muted-foreground">
                            Use a more compact layout to fit more content
                          </div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <div className="font-medium">Animations</div>
                          <div className="text-sm text-muted-foreground">
                            Enable smooth animations and transitions
                          </div>
                        </div>
                        <Switch
                          checked={preferences.enableAnimations}
                          onCheckedChange={(checked) =>
                            updatePreferences({ enableAnimations: checked })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedTabContent>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <AnimatedTabContent activeTab={activeTab} tabKey="system">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>
                        Advanced system configuration options.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Database Status</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default">Connected</Badge>
                              <span className="text-sm text-muted-foreground">
                                SQLite
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label>Cache Status</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default">Active</Badge>
                              <span className="text-sm text-muted-foreground">
                                Redis
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>System Version</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">v1.0.0</Badge>
                              <span className="text-sm text-muted-foreground">
                                Latest
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label>Uptime</Label>
                            <div className="text-sm text-muted-foreground mt-2">
                              2 days, 14 hours, 32 minutes
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="glass-button glass-button-hover"
                        >
                          Clear Cache
                        </Button>
                        <Button
                          variant="outline"
                          className="glass-button glass-button-hover"
                        >
                          Export Data
                        </Button>
                        <Button
                          variant="outline"
                          className="glass-button glass-button-hover"
                        >
                          System Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedTabContent>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
