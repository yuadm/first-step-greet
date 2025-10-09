import { useState, useEffect } from "react";
import { UserCog, Plus, Shield, Users, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { UserRoleSelect } from "./UserRoleSelect";
import { UserPermissionsDialog } from "./UserPermissionsDialog";
import { UserManagementMetrics } from "./UserManagementMetrics";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export function UserManagementContent() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [creating, setCreating] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const { toast } = useToast();
  const { user: currentUser, userRole } = useAuth();
  const { canCreateUsers, canEditUsers, canDeleteUsers } = usePagePermissions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all user roles with emails
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Combine role data with email data
      const usersWithRoles: UserWithRole[] = (userRoles || []).map((userRole: any) => ({
        id: userRole.user_id,
        email: userRole.email || 
               (userRole.user_id === currentUser?.id ? currentUser.email || 'current@user.com' : 'user@example.com'),
        created_at: userRole.created_at,
        role: userRole.role
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Could not fetch user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Use the edge function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "User created successfully",
          description: `${newUserEmail} has been added with ${newUserRole} role`,
        });
        
        setCreateUserOpen(false);
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast({
        title: "User deleted",
        description: "User and their authentication account have been removed successfully",
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setResettingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          password: newPassword
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      toast({
        title: "Password reset successful",
        description: "User password has been updated successfully",
      });
      
      setResetPasswordOpen(false);
      setSelectedUserId("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const openResetPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setResetPasswordOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'manager':
        return 'bg-warning text-warning-foreground';
      case 'hr':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isCurrentUser = (userId: string) => {
    return userId === currentUser?.id;
  };

  const rolePermissions = {
    admin: [
      "Full system access",
      "User management", 
      "System settings",
      "All branches",
      "Reports & analytics"
    ],
    manager: [
      "Employee management",
      "Leave approvals",
      "Branch access", 
      "Reports viewing",
      "Compliance tracking"
    ],
    hr: [
      "Employee records",
      "Document tracking",
      "Compliance management",
      "Leave management", 
      "Reports generation"
    ],
    user: [
      "View own data",
      "Submit leave requests",
      "Update personal info",
      "View documents",
      "Basic reporting"
    ]
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage user roles, permissions, and access control
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canCreateUsers() && (
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system and assign their role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCreateUserOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createUser} disabled={creating}>
                    {creating ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <UserManagementMetrics
          totalUsers={users.length}
          adminCount={users.filter(u => u.role === 'admin').length}
          userCount={users.filter(u => u.role === 'user').length}
        />
      </div>

      {/* Users Grid */}
      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Active Users
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => (
            <Card 
              key={user.id} 
              className="card-premium group hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                {/* User Avatar & Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                    user.role === 'admin' ? 'from-red-500 to-pink-500' :
                    user.role === 'manager' ? 'from-orange-500 to-amber-500' :
                    user.role === 'hr' ? 'from-purple-500 to-pink-500' :
                    'from-green-500 to-emerald-500'
                  } flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <UserCog className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">
                        {user.email.split('@')[0]}
                      </h3>
                      {isCurrentUser(user.id) && (
                        <Badge variant="outline" className="bg-primary/10 border-primary/20">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="mb-4">
                  <Badge className={`${getRoleBadgeColor(user.role)} px-3 py-1`}>
                    {user.role.toUpperCase()}
                  </Badge>
                </div>

                {/* Created Date */}
                <div className="text-xs text-muted-foreground mb-4">
                  Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {canEditUsers() && (
                    <UserRoleSelect
                      value={user.role}
                      onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      disabled={isCurrentUser(user.id)}
                    />
                  )}
                  {canEditUsers() && (
                    <UserPermissionsDialog
                      user={user}
                      onSuccess={fetchUsers}
                    />
                  )}
                  {canEditUsers() && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openResetPasswordDialog(user.id)}
                      className="w-full justify-start"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Password
                    </Button>
                  )}
                  {canDeleteUsers() && !isCurrentUser(user.id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Password Reset Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for this user. They will be able to sign in with the new password immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-new-password">New Password</Label>
              <Input
                id="reset-new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm Password</Label>
              <Input
                id="reset-confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordOpen(false);
                  setSelectedUserId("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={resetUserPassword} disabled={resettingPassword}>
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {users.length === 0 && !loading && (
        <div className="text-center py-12 animate-fade-in">
          <UserCog className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first user with appropriate roles.
          </p>
          {canCreateUsers() && (
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setCreateUserOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
