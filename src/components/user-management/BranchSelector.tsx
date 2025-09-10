import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";

interface BranchAccess {
  id: string;
  name: string;
  hasAccess: boolean;
}

interface BranchSelectorProps {
  branches: BranchAccess[];
  onBranchAccessChange: (branchId: string, hasAccess: boolean) => void;
}

export function BranchSelector({ branches, onBranchAccessChange }: BranchSelectorProps) {
  const accessibleBranches = branches.filter(b => b.hasAccess).length;
  const totalBranches = branches.length;

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Branch Access
          <Badge variant="outline" className="ml-auto">
            {accessibleBranches}/{totalBranches} Branches
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which branches this user can access and manage
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {branches.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No branches configured</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {branches.map((branch) => (
              <div 
                key={branch.id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  branch.hasAccess 
                    ? 'bg-success-soft border-success/20' 
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={branch.hasAccess}
                    onCheckedChange={(checked) => 
                      onBranchAccessChange(branch.id, !!checked)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Label 
                      htmlFor={`branch-${branch.id}`} 
                      className="font-medium cursor-pointer"
                    >
                      {branch.name}
                    </Label>
                  </div>
                </div>
                
                {branch.hasAccess && (
                  <Badge className="bg-success text-success-foreground">
                    Accessible
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
        
        {branches.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-primary">
            Users can only see and manage data from branches they have access to
          </div>
        )}
      </CardContent>
    </Card>
  );
}