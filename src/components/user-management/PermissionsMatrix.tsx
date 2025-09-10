import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Eye, 
  Plus, 
  Edit3, 
  Trash2, 
  Check,
  FileText,
  Users,
  Settings,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Permission {
  type: string;
  key: string;
  label: string;
  granted: boolean;
}

interface PermissionsMatrixProps {
  permissions: Permission[];
  onPermissionChange: (index: number, granted: boolean) => void;
}

interface PageModule {
  name: string;
  key: string;
  path: string;
  actions: string[];
  icon: React.ReactNode;
  description: string;
}

export function PermissionsMatrix({ permissions, onPermissionChange }: PermissionsMatrixProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['dashboard']));

  const pageModules: PageModule[] = [
    {
      name: 'Dashboard',
      key: 'dashboard',
      path: '/',
      actions: ['view'],
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'System overview and analytics'
    },
    {
      name: 'Employees',
      key: 'employees',
      path: '/employees',
      actions: ['view', 'create', 'edit', 'delete'],
      icon: <Users className="w-4 h-4" />,
      description: 'Employee management and profiles'
    },
    {
      name: 'Documents',
      key: 'documents',
      path: '/documents',
      actions: ['view', 'create', 'edit', 'delete', 'upload'],
      icon: <FileText className="w-4 h-4" />,
      description: 'Document management and tracking'
    },
    {
      name: 'Compliance',
      key: 'compliance',
      path: '/compliance',
      actions: ['view', 'create', 'edit', 'delete'],
      icon: <Shield className="w-4 h-4" />,
      description: 'Compliance tracking and management'
    },
    {
      name: 'Reports',
      key: 'reports',
      path: '/reports',
      actions: ['view', 'generate', 'export'],
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Reports and analytics'
    },
    {
      name: 'Settings',
      key: 'settings',
      path: '/settings',
      actions: ['view', 'edit'],
      icon: <Settings className="w-4 h-4" />,
      description: 'System configuration'
    },
    {
      name: 'User Management',
      key: 'user-management',
      path: '/user-management',
      actions: ['view', 'create', 'edit', 'delete'],
      icon: <Users className="w-4 h-4" />,
      description: 'User and permissions management'
    }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view':
        return <Eye className="w-3 h-3" />;
      case 'create':
        return <Plus className="w-3 h-3" />;
      case 'edit':
        return <Edit3 className="w-3 h-3" />;
      case 'delete':
        return <Trash2 className="w-3 h-3" />;
      default:
        return <Check className="w-3 h-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view':
        return 'text-primary';
      case 'create':
        return 'text-success';
      case 'edit':
        return 'text-warning';
      case 'delete':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const toggleModule = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };

  const getModulePermissionStatus = (module: PageModule) => {
    const pageAccessPerm = permissions.find(p => 
      p.type === 'page_access' && p.key === module.path
    );
    
    const actionPerms = permissions.filter(p => 
      p.type === 'page_action' && p.key.startsWith(module.key + ':')
    );

    const hasAccess = pageAccessPerm?.granted;
    const grantedActions = actionPerms.filter(p => p.granted).length;
    const totalActions = actionPerms.length;

    if (!hasAccess) return { status: 'denied', text: 'No Access', color: 'text-destructive' };
    if (grantedActions === totalActions) return { status: 'full', text: 'Full Access', color: 'text-success' };
    if (grantedActions > 0) return { status: 'partial', text: `${grantedActions}/${totalActions} Actions`, color: 'text-warning' };
    return { status: 'view', text: 'View Only', color: 'text-primary' };
  };

  return (
    <div className="space-y-4">
      {pageModules.map((module) => {
        const isExpanded = expandedModules.has(module.key);
        const status = getModulePermissionStatus(module);
        
        const pageAccessPermission = permissions.find(p => 
          p.type === 'page_access' && p.key === module.path
        );
        const pageAccessIndex = permissions.findIndex(p => 
          p.type === 'page_access' && p.key === module.path
        );

        return (
          <Card key={module.key} className="card-premium">
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
              onClick={() => toggleModule(module.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-primary/10 ${getActionColor('view')}`}>
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {module.name}
                      {pageAccessPermission?.granted ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`${status.color} border-current/20`}
                  >
                    {status.text}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`page-access-${module.key}`}
                      checked={pageAccessPermission?.granted || false}
                      onCheckedChange={(checked) => 
                        pageAccessIndex >= 0 && onPermissionChange(pageAccessIndex, !!checked)
                      }
                    />
                    <Label 
                      htmlFor={`page-access-${module.key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Page Access
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Action Permissions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {module.actions.map((action) => {
                      const permKey = `${module.key}:${action}`;
                      const permission = permissions.find(p => p.key === permKey && p.type === 'page_action');
                      const permIndex = permissions.findIndex(p => p.key === permKey && p.type === 'page_action');
                      const hasPageAccess = pageAccessPermission?.granted ?? true;
                      
                      if (!permission) return null;
                      
                      return (
                        <div 
                          key={action} 
                          className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                            permission.granted 
                              ? 'bg-success-soft border-success/20' 
                              : 'bg-muted/30 border-border'
                          } ${!hasPageAccess ? 'opacity-50' : ''}`}
                        >
                          <Checkbox
                            id={`${module.key}-${action}`}
                            checked={permission.granted && hasPageAccess}
                            disabled={!hasPageAccess}
                            onCheckedChange={(checked) => 
                              onPermissionChange(permIndex, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`${module.key}-${action}`}
                            className={`text-sm capitalize cursor-pointer flex items-center gap-1 ${getActionColor(action)}`}
                          >
                            {getActionIcon(action)}
                            {action}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!pageAccessPermission?.granted && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-warning">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Page access must be granted for these permissions to take effect
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}