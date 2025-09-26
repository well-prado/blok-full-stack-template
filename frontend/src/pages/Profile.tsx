import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Camera, Eye, EyeOff, Lock, Mail, Save, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import React, { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { AppLayout } from "../layouts/AppLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { blokRouter } from "../lib/blok-router";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useWorkflowMutation } from "../blok-types";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  // const { updateUser } = useAuth(); // Uncomment if using OPTION 2
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states - Initialize with empty values, useEffect will populate from user data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    bio: "",
    preferences: {
      theme: "system" as "light" | "dark" | "system",
      notifications: true,
      emailUpdates: true,
      language: "en",
      timezone: "UTC",
    },
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // SDK hooks for profile operations
  const profileImageUploadMutation = useWorkflowMutation({
    workflowName: "profile-image-upload",
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Profile image updated successfully!");
        setUploadingImage(false);
      }
    },
    onError: (error) => {
      toast.error(`Failed to upload image: ${error.message}`);
      setUploadingImage(false);
    },
  });

  const profileUpdateMutation = useWorkflowMutation({
    workflowName: "profile-update",
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Profile updated successfully!");
        setLoading(false);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
      setLoading(false);
    },
  });

  // Redirect if not authenticated (use useEffect to avoid render-time state updates)
  useEffect(() => {
    if (!isAuthenticated) {
      blokRouter.push("/login");
    }
  }, [isAuthenticated]);

  // Sync form data when user data changes (fixes bio not appearing issue)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        bio: user?.preferences?.bio || "",
        preferences: {
          theme: user?.preferences?.theme || "system",
          // Handle both boolean and object structure for notifications
          notifications:
            typeof user?.preferences?.notifications === "boolean"
              ? user.preferences.notifications
              : user?.preferences?.notifications?.email !== false,
          // Handle emailUpdates (might be in preferences or notifications object)
          emailUpdates:
            (user?.preferences as any)?.emailUpdates !== false ||
            user?.preferences?.notifications?.marketing !== false,
          language: user?.preferences?.language || "en",
          timezone: user?.preferences?.timezone || "UTC",
        },
      });
    }
  }, [user]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("preferences.")) {
      const prefKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: checked,
      },
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: value,
      },
    }));
  };

  // Helper function to get timezone display info
  const getTimezoneInfo = (timezone: string) => {
    try {
      const now = new Date();
      const timeInZone = now.toLocaleString("en-US", {
        timeZone: timezone,
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
      const offsetString = now
        .toLocaleString("en-US", {
          timeZone: timezone,
          timeZoneName: "short",
        })
        .split(", ")[1];

      return `Current time: ${timeInZone} (${offsetString})`;
    } catch (error) {
      return `Current time: ${new Date().toLocaleTimeString()} (Local)`;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        try {
          const result = await profileImageUploadMutation.mutateAsync({
            profileImage: base64,
          });

          if (result.success) {
            // OPTION 1: Full page refresh (more reliable, shows all updates immediately)
            setTimeout(() => {
              window.location.reload();
            }, 1000); // Small delay to let user see the success toast

            // OPTION 2: Update context directly (smoother UX, no page reload)
            // updateUser(result.user);
          } else {
            throw new Error(result.message || "Failed to upload image");
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image"
          );
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to process image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password fields if provided
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast.error("Current password is required to set a new password");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }
        if (formData.newPassword.length < 8) {
          toast.error("New password must be at least 8 characters long");
          return;
        }
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        preferences: {
          ...formData.preferences,
          bio: formData.bio, // Include bio in preferences
        },
      };

      // Add password fields if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const result = await profileUpdateMutation.mutateAsync(updateData);

      if (result.success) {
        // OPTION 1: Full page refresh (more reliable, shows all updates immediately)
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to let user see the success toast

        // OPTION 2: Update context directly (smoother UX, no page reload)
        // updateUser(result.user);
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              Profile Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={user?.profileImage}
                    alt={user?.name || "Profile"}
                  />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full glass-button glass-button-hover"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: 2MB • JPG, PNG, GIF
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>
                Update your personal information and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="pl-10 glass-input"
                        disabled
                        title="Email cannot be changed as it's used for login"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    className="glass-input resize-none"
                    rows={3}
                  />
                </div>

                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="Current password"
                          className="pl-10 pr-10 glass-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="New password"
                          className="pl-10 pr-10 glass-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm password"
                          className="pl-10 pr-10 glass-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferences.language">Language</Label>
                      <Select
                        value={formData.preferences.language}
                        onValueChange={(value) =>
                          handleSelectChange("language", value)
                        }
                      >
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="pt-br">
                            Português (Brasil)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferences.timezone">Timezone</Label>
                      <Select
                        value={formData.preferences.timezone}
                        onValueChange={(value) =>
                          handleSelectChange("timezone", value)
                        }
                      >
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">
                            UTC - Coordinated Universal Time
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            EST/EDT - Eastern Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            CST/CDT - Central Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            MST/MDT - Mountain Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            PST/PDT - Pacific Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Sao_Paulo">
                            BRT - Brasília Time (Brazil)
                          </SelectItem>
                          <SelectItem value="Europe/London">
                            GMT/BST - Greenwich Mean Time (UK)
                          </SelectItem>
                          <SelectItem value="Europe/Paris">
                            CET/CEST - Central European Time
                          </SelectItem>
                          <SelectItem value="Europe/Berlin">
                            CET/CEST - Central European Time (Germany)
                          </SelectItem>
                          <SelectItem value="Asia/Tokyo">
                            JST - Japan Standard Time
                          </SelectItem>
                          <SelectItem value="Asia/Shanghai">
                            CST - China Standard Time
                          </SelectItem>
                          <SelectItem value="Asia/Kolkata">
                            IST - India Standard Time
                          </SelectItem>
                          <SelectItem value="Australia/Sydney">
                            AEST/AEDT - Australian Eastern Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {getTimezoneInfo(formData.preferences.timezone)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for account updates
                        </p>
                      </div>
                      <Switch
                        checked={formData.preferences.notifications}
                        onCheckedChange={(checked) =>
                          handleSwitchChange("notifications", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and improvements
                        </p>
                      </div>
                      <Switch
                        checked={formData.preferences.emailUpdates}
                        onCheckedChange={(checked) =>
                          handleSwitchChange("emailUpdates", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="glass-button glass-button-hover"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
