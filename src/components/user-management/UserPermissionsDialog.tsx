import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Shield } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  role: string;
}

interface UserPermissionsDialogProps {
  user: UserWithRole;
  onSuccess: () => void;
}

interface Permission {
  type: string;
  key: string;
  label: string;
  granted: boolean;
}

interface BranchAccess {
  id: string;
  name: string;
  hasAccess: boolean;
}

export function UserPermissionsDialog({ user, onSuccess }: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [branchAccess, setBranchAccess] = useState<BranchAccess[]>([]);
  const { toast } = useToast();

  const pageModules = [
    {
      name: 'Dashboard',
      key: 'dashboard',
      path: '/',
      actions: ['view']
    },
    {
      name: 'Employees',
      key: 'employees', 
      path: '/employees',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'Clients',
      key: 'clients',
      path: '/clients',
      actions: ['view', 'create', 'edit', 'delete', 'import', 'bulk-delete']
    },
    {
      name: 'Leaves',
      key: 'leaves',
      path: '/leaves', 
      actions: ['view', 'create', 'edit', 'delete', 'approve']
    },
    {
      name: 'Documents',
      key: 'documents',
      path: '/documents',
      actions: ['view', 'create', 'edit', 'delete', 'upload']
    },
    {
      name: 'Document Signing',
      key: 'document-signing',
      path: '/document-signing',
      actions: ['view', 'create', 'edit', 'delete', 'sign']
    },
    {
      name: 'Compliance',
      key: 'compliance',
      path: '/compliance',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'Compliance Types',
      key: 'compliance-types',
      path: '/compliance/types',
      actions: ['view']
    },
    {
      name: 'Care Worker Statements',
      key: 'care-worker-statements', 
      path: '/compliance/statements',
      actions: ['view']
    },
    {
      name: 'Reports',
      key: 'reports',
      path: '/reports',
      actions: ['view', 'generate', 'export']
    },
    {
      name: 'Job Applications',
      key: 'job-applications',
      path: '/job-applications',
      actions: ['view', 'delete', 'edit', 'download-pdf', 'reference-send-request', 'reference-download-pdf', 'reference-manual-pdf']
    },
    {
      name: 'Settings',
      key: 'settings',
      path: '/settings',
      actions: ['view', 'edit']
    },
    {
      name: 'User Management',
      key: 'user-management',
      path: '/user-management',
      actions: ['view', 'create', 'edit', 'delete']
    }
  ];

  const generateDefaultPermissions = () => {
    const permissions: Permission[] = [];
    
    // Add page access permissions
    pageModules.forEach(module => {
      permissions.push({
        type: 'page_access',
        key: module.path,
        label: `${module.name} - Page Access`,
        granted: true
      });
    });
    
    // Add page action permissions
    pageModules.forEach(module => {
      module.actions.forEach(action => {
        permissions.push({
          type: 'page_action',
          key: `${module.key}:${action}`,
          label: `${module.name} - ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          granted: true
        });
      });
    });
    
    return permissions;
  };

  const defaultPermissions = generateDefaultPermissions();

  useEffect(() => {
    if (open) {
      fetchUserPermissions();
      fetchBranches();
    }
  }, [open]);

  const fetchUserPermissions = async () => {
    try {
      const { data: userPermissions, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const permissionsMap = new Map(
        (userPermissions || []).map(p => [`${p.permission_type}:${p.permission_key}`, p.granted])
      );

      const permissionsWithState = defaultPermissions.map(perm => ({
        ...perm,
        granted: permissionsMap.get(`${perm.type}:${perm.key}`) ?? true
      }));

      setPermissions(permissionsWithState);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Error loading permissions",
        description: "Could not fetch user permissions. Please try again.",
        variant: "destructive",
      });
      // Use default permissions if there's an error
      setPermissions(defaultPermissions.map(perm => ({ ...perm, granted: true })));
    }
  };

  const fetchBranches = async () => {
    try {
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (branchesError) throw branchesError;

      const { data: userBranchAccess, error: accessError } = await supabase
        .from('user_branch_access')
        .select('branch_id')
        .eq('user_id', user.id);

      if (accessError) throw accessError;

      const accessibleBranchIds = new Set(
        (userBranchAccess || []).map(access => access.branch_id)
      );

      const branchesWithAccess = (branchesData || []).map(branch => ({
        id: branch.id,
        name: branch.name,
        hasAccess: accessibleBranchIds.has(branch.id)
      }));

      setBranchAccess(branchesWithAccess);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error loading branches",
        description: "Could not fetch branch data. Please try again.",
        variant: "destructive",
      });
      setBranchAccess([]);
    }
  };

  const handlePermissionChange = (index: number, granted: boolean) => {
    setPermissions(prev => prev.map((perm, i) => 
      i === index ? { ...perm, granted } : perm
    ));
  };

  const handleBranchAccessChange = (branchId: string, hasAccess: boolean) => {
    setBranchAccess(prev => prev.map(branch =>
      branch.id === branchId ? { ...branch, hasAccess } : branch
    ));
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      // Save page and feature permissions
      for (const permission of permissions) {
        const { error: upsertError } = await supabase
          .from('user_permissions')
          .upsert({
            user_id: user.id,
            permission_type: permission.type,
            permission_key: permission.key,
            granted: permission.granted,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,permission_type,permission_key'
          });

        if (upsertError) throw upsertError;
      }

      // Save branch access permissions
      // First, remove all existing branch access for this user
      const { error: deleteError } = await supabase
        .from('user_branch_access')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Then, insert new branch access records for branches with access
      const branchesToInsert = branchAccess
        .filter(branch => branch.hasAccess)
        .map(branch => ({
          user_id: user.id,
          branch_id: branch.id
        }));

      if (branchesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_branch_access')
          .insert(branchesToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Permissions updated",
        description: "User permissions have been saved successfully",
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error updating permissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-primary/10 transition-colors">
          <Key className="w-4 h-4 mr-2" />
          Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-t-lg -z-10"></div>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Manage Permissions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Page Access Permissions */}
          <Card className="card-premium border-primary/20">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="w-4 h-4 text-primary" />
                </div>
                Page Access
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Control which pages the user can access
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pageModules.map((module) => {
                  const pageAccessPermission = permissions.find(p => 
                    p.type === 'page_access' && p.key === module.path
                  );
                  const permIndex = permissions.findIndex(p => 
                    p.type === 'page_access' && p.key === module.path
                  );
                  
                  if (!pageAccessPermission) return null;
                  
                  return (
                    <div key={`page-${module.key}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`page-access-${module.key}`}
                        checked={pageAccessPermission.granted}
                        onCheckedChange={(checked) => handlePermissionChange(permIndex, !!checked)}
                      />
                      <Label 
                        htmlFor={`page-access-${module.key}`}
                        className="text-sm cursor-pointer font-medium"
                      >
                        {module.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Page Action Permissions */}
          {pageModules.map((module) => {
            const pageAccessPermission = permissions.find(p => 
              p.type === 'page_access' && p.key === module.path
            );
            const hasPageAccess = pageAccessPermission?.granted ?? true;
            
            return (
              <Card key={module.key} className={`card-premium ${!hasPageAccess ? "opacity-50" : ""}`}>
                <CardHeader className="bg-gradient-to-br from-muted/30 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      {module.name} - Actions
                      <span className="text-sm text-muted-foreground font-normal block">
                        {module.path}
                      </span>
                    </div>
                  </CardTitle>
                  {!hasPageAccess && (
                    <p className="text-xs text-muted-foreground bg-warning/10 p-2 rounded">
                      ⚠️ Page access must be granted for these permissions to take effect
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {module.actions.map((action) => {
                      const permKey = `${module.key}:${action}`;
                      const permission = permissions.find(p => p.key === permKey && p.type === 'page_action');
                      const permIndex = permissions.findIndex(p => p.key === permKey && p.type === 'page_action');
                      
                      if (!permission) return null;
                      
                      return (
                        <div key={action} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.key}-${action}`}
                            checked={permission.granted}
                            disabled={!hasPageAccess}
                            onCheckedChange={(checked) => handlePermissionChange(permIndex, !!checked)}
                          />
                          <Label 
                            htmlFor={`${module.key}-${action}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {action}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Branch Access */}
          <Card className="card-premium border-purple-500/20">
            <CardHeader className="bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                Branch Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {branchAccess.map((branch) => (
                <div key={branch.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={branch.hasAccess}
                    onCheckedChange={(checked) => handleBranchAccessChange(branch.id, !!checked)}
                  />
                  <Label htmlFor={`branch-${branch.id}`}>{branch.name}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={savePermissions} 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}