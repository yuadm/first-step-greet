import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Shield, Building2, User } from "lucide-react";
import { PermissionsMatrix } from "./PermissionsMatrix";
import { BranchSelector } from "./BranchSelector";

interface UserWithRole {
  id: string;
  email: string;
  role: string;
}

interface ModernPermissionsDialogProps {
  user: UserWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ModernPermissionsDialog({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: ModernPermissionsDialogProps) {
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
      const { error: deleteError } = await supabase
        .from('user_branch_access')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

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

      onOpenChange(false);
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

  const getPermissionsSummary = () => {
    const grantedPageAccess = permissions.filter(p => p.type === 'page_access' && p.granted).length;
    const totalPageAccess = permissions.filter(p => p.type === 'page_access').length;
    const grantedActions = permissions.filter(p => p.type === 'page_action' && p.granted).length;
    const totalActions = permissions.filter(p => p.type === 'page_action').length;
    const grantedBranches = branchAccess.filter(b => b.hasAccess).length;
    const totalBranches = branchAccess.length;

    return { grantedPageAccess, totalPageAccess, grantedActions, totalActions, grantedBranches, totalBranches };
  };

  const summary = getPermissionsSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Manage Permissions for {user.email}
            <Badge className={user.role === 'admin' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}>
              {user.role.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="permissions" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Module Permissions
              <Badge variant="outline" className="ml-1">
                {summary.grantedPageAccess}/{summary.totalPageAccess}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Branch Access
              <Badge variant="outline" className="ml-1">
                {summary.grantedBranches}/{summary.totalBranches}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="permissions" className="h-full overflow-y-auto pr-2 mt-4">
              <PermissionsMatrix
                permissions={permissions}
                onPermissionChange={handlePermissionChange}
              />
            </TabsContent>
            
            <TabsContent value="branches" className="h-full overflow-y-auto pr-2 mt-4">
              <BranchSelector
                branches={branchAccess}
                onBranchAccessChange={handleBranchAccessChange}
              />
            </TabsContent>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {summary.grantedActions} of {summary.totalActions} actions permitted
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={savePermissions} 
                disabled={loading}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}