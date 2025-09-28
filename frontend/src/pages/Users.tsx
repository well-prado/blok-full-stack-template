import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Calendar,
  Edit3,
  Mail,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useCallback, useEffect, useState } from "react";
import {
  useWorkflowMutation,
  useWorkflowQuery,
  type AuthRegisterOutput,
  type UserUpdateOutput,
  type UserDeleteOutput,
  type UserListTestOutput,
} from "../blok-types";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  activeUsers: number;
  verifiedUsers: number;
}

export default function UsersPage() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
  });

  // SDK hooks for user operations
  const usersQuery = useWorkflowQuery({
    workflowName: "user-list-test",
    input: {
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  }) as { data?: UserListTestOutput; isLoading: boolean; refetch: () => void };

  const createUserMutation = useWorkflowMutation({
    workflowName: "auth-register",
    onSuccess: (data: AuthRegisterOutput) => {
      if (data.success) {
        toast.success("User created successfully");
        setShowAddDialog(false);
        setFormData({ name: "", email: "", password: "", role: "USER" });
        usersQuery.refetch();
      }
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const updateUserMutation = useWorkflowMutation({
    workflowName: "user-update",
    onSuccess: (data: UserUpdateOutput) => {
      if (data.success) {
        toast.success("User updated successfully");
        setShowEditDialog(false);
        setSelectedUser(null);
        usersQuery.refetch();
      }
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const deleteUserMutation = useWorkflowMutation({
    workflowName: "user-delete",
    onSuccess: (data: UserDeleteOutput) => {
      if (data.success) {
        toast.success("User deleted successfully");
        setShowDeleteDialog(false);
        setSelectedUser(null);
        usersQuery.refetch();
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Update users when query data changes
  useEffect(() => {
    if (usersQuery.data?.success && usersQuery.data.users) {
      setUsers(usersQuery.data.users);
      setFilteredUsers(usersQuery.data.users);

      // Calculate stats
      const totalUsers = usersQuery.data.users.length;
      const adminUsers = usersQuery.data.users.filter(
        (u: any) => u.role === "ADMIN"
      ).length;
      const activeUsers = usersQuery.data.users.filter(
        (u: any) => u.status === "active"
      ).length;
      const verifiedUsers = usersQuery.data.users.filter(
        (u: any) => u.emailVerified
      ).length;

      setStats({
        totalUsers,
        adminUsers,
        activeUsers,
        verifiedUsers,
      });
    }
    setLoading(usersQuery.isLoading);
  }, [usersQuery.data, usersQuery.isLoading]);

  // Load users data (now using SDK hooks)
  const loadUsers = useCallback(async () => {
    await usersQuery.refetch();
  }, [usersQuery]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    // Status filter (using emailVerified as active status)
    if (selectedStatus !== "all") {
      if (selectedStatus === "active") {
        filtered = filtered.filter((user) => user.emailVerified);
      } else if (selectedStatus === "inactive") {
        filtered = filtered.filter((user) => !user.emailVerified);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle add user
  const handleAddUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast.error(error.message || "Failed to create user");
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        id: selectedUser.id, // Fixed: use "id" instead of "userId" to match backend expectation
        name: formData.name,
        email: formData.email,
        role: formData.role,
        // Only include password if it's provided
        ...(formData.password && { password: formData.password }),
      };

      await updateUserMutation.mutateAsync(updateData);
      setFormData({ name: "", email: "", password: "", role: "USER" });
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync({
        id: selectedUser.id, // Fixed: use "id" instead of "userId" to match backend expectation
      });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  User Management
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Manage users and permissions
                </CardDescription>
              </div>
              <Button
                className="glass-button glass-button-hover"
                onClick={() => setShowAddDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10 glass-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[140px] glass-input">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px] glass-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground">Loading users...</div>
            </CardContent>
          </Card>
        )}

        {/* Users Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="glass-card glass-card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                        <Badge
                          variant={
                            user.emailVerified ? "default" : "destructive"
                          }
                        >
                          {user.emailVerified ? (
                            <UserCheck className="h-3 w-3 mr-1" />
                          ) : (
                            <UserX className="h-3 w-3 mr-1" />
                          )}
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ||
                selectedRole !== "all" ||
                selectedStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first user"}
              </p>
              {!searchQuery &&
                selectedRole === "all" &&
                selectedStatus === "all" && (
                  <Button onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.totalUsers - stats.verifiedUsers}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. They will receive an email to verify
                their account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter user's full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter user's email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter initial password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role.toLowerCase()}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({
                      ...formData,
                      role: value.toUpperCase() as "ADMIN" | "USER",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={
                  !formData.name || !formData.email || !formData.password
                }
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password blank to keep current
                password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter user's full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter user's email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">Password (optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role.toLowerCase()}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({
                      ...formData,
                      role: value.toUpperCase() as "ADMIN" | "USER",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={!formData.name || !formData.email}
              >
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                user account for <strong>{selectedUser?.name}</strong> and
                remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
