import { useState, useEffect } from "react";
import { Plus, Users, Crown, User, Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { UserCard } from "./UserCard";
import { CreateUserDialog } from "./CreateUserDialog";
import { ModernPermissionsDialog } from "./ModernPermissionsDialog";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export function UserManagementContent() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { canCreateUsers, canEditUsers, canDeleteUsers } = usePagePermissions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

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

  const createUser = async (email: string, password: string, role: string) => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: { email, password, role }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "User created successfully",
          description: `${email} has been added with ${role} role`,
        });
        
        setCreateUserOpen(false);
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
      
      const response = await fetch(`https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
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
      
      const response = await fetch(`https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser?.id,
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
      setSelectedUser(null);
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

  const isCurrentUser = (userId: string) => {
    return userId === currentUser?.id;
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.split('@')[0].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage users, roles, and permissions across your organization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            className="hover:bg-muted/50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          {canCreateUsers() && (
            <Button 
              onClick={() => setCreateUserOpen(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <Card className="card-premium border-primary/20 bg-gradient-to-br from-primary-soft to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-primary">{userStats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Active accounts</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium border-destructive/20 bg-gradient-to-br from-destructive-soft to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                <p className="text-3xl font-bold text-destructive">{userStats.admins}</p>
                <p className="text-sm text-muted-foreground mt-1">Full access</p>
              </div>
              <Crown className="w-10 h-10 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium border-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                <p className="text-3xl font-bold">{userStats.users}</p>
                <p className="text-sm text-muted-foreground mt-1">Limited access</p>
              </div>
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isCurrentUser={isCurrentUser(user.id)}
              onEditPermissions={() => {
                setSelectedUser(user);
                setPermissionsDialogOpen(true);
              }}
              onResetPassword={() => {
                setSelectedUser(user);
                setResetPasswordOpen(true);
              }}
              onDeleteUser={() => deleteUser(user.id)}
              onRoleChange={(role) => updateUserRole(user.id, role)}
              canEdit={canEditUsers()}
              canDelete={canDeleteUsers()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 animate-fade-in">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || roleFilter !== "all" ? "No users found" : "No users yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || roleFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first user with appropriate roles"
            }
          </p>
          {canCreateUsers() && !searchQuery && roleFilter === "all" && (
            <Button 
              onClick={() => setCreateUserOpen(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onCreateUser={createUser}
        creating={creating}
      />

      {selectedUser && (
        <ModernPermissionsDialog
          user={selectedUser}
          open={permissionsDialogOpen}
          onOpenChange={(open) => {
            setPermissionsDialogOpen(open);
            if (!open) setSelectedUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.email}</DialogTitle>
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordOpen(false);
                  setSelectedUser(null);
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
    </div>
  );
}