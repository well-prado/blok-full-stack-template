import { Alert, AlertDescription } from "../components/ui/alert";
import {
  AlertTriangle,
  Check,
  Eye,
  Key,
  Lock,
  Monitor,
  QrCode,
  Shield,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useEffect, useState } from "react";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useBlokRouter } from "../hooks/useBlokRouter";
import { useWorkflowMutation } from "../blok-types";

interface SecurityLog {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

export default function SecurityPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useBlokRouter();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // SDK hooks for security operations
  const twoFactorAuthMutation = useWorkflowMutation({
    workflowName: "two-factor-auth",
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Two-factor authentication updated successfully!");
        setLoading(false);
      }
    },
    onError: (error) => {
      toast.error(`Two-factor auth operation failed: ${error.message}`);
      setLoading(false);
    },
  });

  // Note: audit-logs workflow is not available, so we'll keep the fetch call for now
  // This would need to be implemented in the backend

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Load security logs
      const logsResponse = await fetch("/api/audit-logs", {
        method: "GET",
        credentials: "include", // Use session cookies
      });

      if (logsResponse.ok) {
        const logsResult = await logsResponse.json();
        if (
          logsResult.success &&
          logsResult.data &&
          logsResult.data.recentActivity
        ) {
          setSecurityLogs(logsResult.data.recentActivity.slice(0, 10)); // Show latest 10
        }
      }

      // Mock active sessions data (replace with real API call)
      setActiveSessions([
        {
          id: "1",
          device: "Chrome on Windows",
          location: "New York, US",
          ipAddress: "192.168.1.100",
          lastActive: "Just now",
          current: true,
        },
        {
          id: "2",
          device: "Safari on iPhone",
          location: "New York, US",
          ipAddress: "192.168.1.101",
          lastActive: "2 hours ago",
          current: false,
        },
        {
          id: "3",
          device: "Firefox on Ubuntu",
          location: "San Francisco, US",
          ipAddress: "10.0.0.50",
          lastActive: "1 day ago",
          current: false,
        },
      ]);

      // Check 2FA status (mock for now)
      setTwoFactorEnabled(user?.twoFactorEnabled || false);
    } catch (error) {
      console.error("Failed to load security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const result = await twoFactorAuthMutation.mutateAsync({
        action: "setup",
      });

      if (result.success) {
        setShowQRCode(true);
        toast.success(
          "2FA setup initiated. Scan the QR code with your authenticator app."
        );
      } else {
        throw new Error(result.message || "Failed to setup 2FA");
      }
    } catch (error) {
      console.error("2FA setup error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to setup 2FA"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const result = await twoFactorAuthMutation.mutateAsync({
        action: "verify",
        token: verificationCode,
      });

      if (result.success) {
        setTwoFactorEnabled(true);
        setShowQRCode(false);
        setVerificationCode("");
        toast.success("Two-factor authentication enabled successfully!");
      } else {
        throw new Error(result.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      const result = await twoFactorAuthMutation.mutateAsync({
        action: "disable",
      });

      if (result.success) {
        setTwoFactorEnabled(false);
        toast.success("Two-factor authentication disabled");
      } else {
        throw new Error(result.message || "Failed to disable 2FA");
      }
    } catch (error) {
      console.error("2FA disable error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to disable 2FA"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    // Mock session termination (replace with real API call)
    setActiveSessions((prev) =>
      prev.filter((session) => session.id !== sessionId)
    );
    toast.success("Session terminated successfully");
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
        return <Key className="h-4 w-4 text-green-500" />;
      case "logout":
        return <X className="h-4 w-4 text-orange-500" />;
      case "failed_login":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Manage your account security, two-factor authentication, and
              monitor login activity
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Two-Factor Authentication */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? "Your account is protected with 2FA"
                      : "Enable 2FA to secure your account"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {twoFactorEnabled ? (
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  )}
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={
                      twoFactorEnabled ? handleDisable2FA : handleEnable2FA
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {showQRCode && (
                <div className="space-y-4 p-4 border rounded-lg glass-card">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="glass-input text-center text-lg tracking-widest"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerify2FA}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 glass-button glass-button-hover"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Verify & Enable
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowQRCode(false);
                        setVerificationCode("");
                      }}
                      className="glass-button glass-button-hover"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorEnabled && (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is active. You'll need your
                    authenticator app to sign in.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Password Security */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Security
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Strength</span>
                  <Badge variant="secondary">Strong</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Last Changed</p>
                <p className="text-sm text-muted-foreground">30 days ago</p>
              </div>

              <Button
                variant="outline"
                className="w-full glass-button glass-button-hover"
                onClick={() => router.push("/profile")}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg glass-card glass-card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="glass-icon-container">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.current && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                      className="glass-button glass-button-hover text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Logs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Security Activity
            </CardTitle>
            <CardDescription>
              Monitor recent security events and login attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {securityLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="capitalize">
                            {log.action.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.success ? "secondary" : "destructive"}
                        >
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No security logs available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
