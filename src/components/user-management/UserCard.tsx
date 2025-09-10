import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  MoreVertical, 
  Shield, 
  Key, 
  RotateCcw, 
  Trash2, 
  User, 
  Crown,
  Settings,
  Calendar
} from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

interface UserCardProps {
  user: UserWithRole;
  isCurrentUser: boolean;
  onEditPermissions: () => void;
  onResetPassword: () => void;
  onDeleteUser: () => void;
  onRoleChange: (role: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function UserCard({ 
  user, 
  isCurrentUser, 
  onEditPermissions, 
  onResetPassword, 
  onDeleteUser,
  onRoleChange,
  canEdit,
  canDelete
}: UserCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'manager':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge-error';
      case 'manager':
        return 'badge-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <Card className="card-premium group hover:shadow-glow transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-12 h-12 bg-gradient-primary">
                <AvatarFallback className="bg-transparent text-white font-semibold">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {user.email.split('@')[0]}
                  </h3>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {user.email}
                </p>
                
                <div className="flex items-center gap-3">
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                    {getRoleIcon(user.role)}
                    {user.role.toUpperCase()}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={onEditPermissions} className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onRoleChange(user.role === 'admin' ? 'user' : 'admin')}
                      className="flex items-center gap-2"
                      disabled={isCurrentUser}
                    >
                      <Settings className="w-4 h-4" />
                      {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={onResetPassword} className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset Password
                    </DropdownMenuItem>
                  </>
                )}
                
                {canDelete && !isCurrentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{user.email}</strong>? 
              This action cannot be undone and will permanently remove their account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}