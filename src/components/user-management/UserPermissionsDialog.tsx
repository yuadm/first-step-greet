import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Shield, ChevronDown, Search, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
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

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getModuleStatus = (moduleKey: string) => {
    const actions = pageModules.find(m => m.key === moduleKey)?.actions || [];
    const actionPerms = actions.map(action => 
      permissions.find(p => p.key === `${moduleKey}:${action}` && p.type === 'page_action')?.granted ?? true
    );
    
    const grantedCount = actionPerms.filter(Boolean).length;
    if (grantedCount === actions.length) return 'full';
    if (grantedCount === 0) return 'none';
    return 'partial';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Full Access</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><MinusCircle className="w-3 h-3 mr-1" />Partial Access</Badge>;
      case 'none':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />No Access</Badge>;
    }
  };

  const filteredModules = pageModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const savePermissions = async () => {
    setLoading(true);
    try {
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
        <Button variant="outline" size="sm" className="w-full hover:bg-primary/10 transition-colors">
          <Key className="w-4 h-4 mr-2" />
          Manage Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh]">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Permissions Manager</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pages" className="gap-2">
              <Key className="w-4 h-4" />
              Page Access
              <Badge variant="secondary" className="ml-1">{pageModules.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <Shield className="w-4 h-4" />
              Actions
              <Badge variant="secondary" className="ml-1">
                {pageModules.reduce((acc, m) => acc + m.actions.length, 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-2">
              <Shield className="w-4 h-4" />
              Branches
              <Badge variant="secondary" className="ml-1">{branchAccess.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Page Access Tab */}
          <TabsContent value="pages" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredModules.map((module) => {
                  const pageAccessPermission = permissions.find(p => 
                    p.type === 'page_access' && p.key === module.path
                  );
                  const permIndex = permissions.findIndex(p => 
                    p.type === 'page_access' && p.key === module.path
                  );
                  
                  if (!pageAccessPermission) return null;
                  
                  return (
                    <div 
                      key={`page-${module.key}`} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <Label 
                            htmlFor={`page-access-${module.key}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {module.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">{module.path}</p>
                        </div>
                      </div>
                      <Switch
                        id={`page-access-${module.key}`}
                        checked={pageAccessPermission.granted}
                        onCheckedChange={(checked) => handlePermissionChange(permIndex, checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredModules.map((module) => {
                  const pageAccessPermission = permissions.find(p => 
                    p.type === 'page_access' && p.key === module.path
                  );
                  const hasPageAccess = pageAccessPermission?.granted ?? true;
                  const status = getModuleStatus(module.key);
                  const isOpen = openSections[module.key] ?? false;
                  
                  return (
                    <Collapsible
                      key={module.key}
                      open={isOpen}
                      onOpenChange={() => toggleSection(module.key)}
                      className="border rounded-lg overflow-hidden"
                    >
                      <CollapsibleTrigger className="w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            <div className="text-left">
                              <p className="font-semibold">{module.name}</p>
                              <p className="text-xs text-muted-foreground">{module.path}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            <Badge variant="outline">{module.actions.length} actions</Badge>
                          </div>
                        </div>
                        {!hasPageAccess && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-yellow-600">
                            <XCircle className="w-3 h-3" />
                            Page access disabled - Enable page access first
                          </div>
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Separator />
                        <div className="p-4 bg-muted/30">
                          <div className="grid grid-cols-2 gap-3">
                            {module.actions.map((action) => {
                              const permKey = `${module.key}:${action}`;
                              const permission = permissions.find(p => p.key === permKey && p.type === 'page_action');
                              const permIndex = permissions.findIndex(p => p.key === permKey && p.type === 'page_action');
                              
                              if (!permission) return null;
                              
                              return (
                                <div 
                                  key={action} 
                                  className="flex items-center justify-between p-2 rounded-md bg-background"
                                >
                                  <Label 
                                    htmlFor={`${module.key}-${action}`}
                                    className="text-sm capitalize cursor-pointer flex-1"
                                  >
                                    {action.replace(/-/g, ' ')}
                                  </Label>
                                  <Switch
                                    id={`${module.key}-${action}`}
                                    checked={permission.granted}
                                    disabled={!hasPageAccess}
                                    onCheckedChange={(checked) => handlePermissionChange(permIndex, checked)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Branch Access Tab */}
          <TabsContent value="branches" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {branchAccess.map((branch) => (
                  <div 
                    key={branch.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Label 
                      htmlFor={`branch-${branch.id}`} 
                      className="cursor-pointer font-medium flex-1"
                    >
                      {branch.name}
                    </Label>
                    <Switch
                      id={`branch-${branch.id}`}
                      checked={branch.hasAccess}
                      onCheckedChange={(checked) => handleBranchAccessChange(branch.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background">
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
      </DialogContent>
    </Dialog>
  );
}